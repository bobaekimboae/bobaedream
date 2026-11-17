# Nasser 330 videos - strict re-analysis v3 (2026-11-17)
import os, glob, json, re, subprocess, sys
import numpy as np, cv2
cv2.setNumThreads(1)
os.environ['OMP_NUM_THREADS']='1'
from multiprocessing import Pool
B = r'C:\Users\Thinkbook\Documents\autostudio_analysis'
FF = (glob.glob(os.path.expandvars(r'%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg*\**\bin\ffmpeg.exe'), recursive=True) or ['ffmpeg'])[0]
YN = (glob.glob(os.path.join(B, '**', '*yunet*.onnx'), recursive=True) + glob.glob(os.path.expanduser(r'~\**\*yunet*.onnx'), recursive=False))
YN = YN[0] if YN else None
OUT = os.path.join(B, 'ns300v3'); os.makedirs(OUT, exist_ok=True)

def srt_parse(txt):
    out = []
    for blk in re.split(r'\n\s*\n', txt.strip()):
        m = re.search(r'(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)', blk)
        if not m: continue
        g = list(map(int, m.groups()))
        s = g[0]*3600+g[1]*60+g[2]+g[3]/1000; e = g[4]*3600+g[5]*60+g[6]+g[7]/1000
        t = blk[m.end():].strip().replace('\n', ' ')
        out.append((s, e, t))
    return out

def detect_cuts(path):
    cap = cv2.VideoCapture(path); fps = cap.get(cv2.CAP_PROP_FPS) or 30
    prevh = None; prevg = None; scores = []; frames = []; i = 0
    while True:
        ok, f = cap.read()
        if not ok: break
        sm = cv2.resize(f, (96, 170)); hsv = cv2.cvtColor(sm, cv2.COLOR_BGR2HSV)
        h = cv2.calcHist([hsv], [0, 1, 2], None, [16, 8, 8], [0, 180, 0, 256, 0, 256]); cv2.normalize(h, h)
        g = cv2.cvtColor(sm, cv2.COLOR_BGR2GRAY).astype(np.float32)
        if prevh is not None:
            hd = 1 - cv2.compareHist(prevh, h, cv2.HISTCMP_CORREL)
            pd = float(np.mean(np.abs(g - prevg))) / 255
            scores.append((i / fps, hd, pd))
        prevh, prevg = h, g
        if i % max(1, int(round(fps / 2))) == 0: frames.append((i / fps, f))
        i += 1
    cap.release()
    dur = i / fps
    if not scores: return fps, dur, [], frames
    hd = np.array([s[1] for s in scores]); pd = np.array([s[2] for s in scores]); ts = np.array([s[0] for s in scores])
    # adaptive: score must beat both an absolute floor and a local median*6
    comb = hd * 0.6 + pd * 2.0
    cuts = []
    for k in range(len(comb)):
        lo, hi = max(0, k - 15), min(len(comb), k + 16)
        loc = np.median(comb[lo:hi])
        if comb[k] > 0.35 and comb[k] > 5 * max(loc, 0.02) and comb[k] == comb[max(0, k - 3):k + 4].max():
            if not cuts or ts[k] - cuts[-1] > 0.25: cuts.append(float(ts[k]))
    return fps, dur, cuts, frames

def faces(frames, det):
    hit = []
    for t, f in frames:
        h, w = f.shape[:2]
        if YN:
            det.setInputSize((w, h)); _, r = det.detect(f)
            n = 0 if r is None else int(sum(1 for x in r if x[14] > 0.75 and x[2] * x[3] > 0.01 * w * h))
        else:
            g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
            r = det.detectMultiScale(g, 1.1, 5, minSize=(int(w * 0.12), int(w * 0.12)))
            n = len(r)
        hit.append((t, n > 0))
    return hit

def textband(frames):
    # white low-sat pixels with dark neighbours = burned captions; share of frames per band
    bands = {'top': (0.08, 0.30), 'mid': (0.30, 0.62), 'low': (0.62, 0.88)}
    res = {k: 0 for k in bands}; ylw = 0
    for t, f in frames:
        h, w = f.shape[:2]; hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
        white = ((hsv[..., 2] > 225) & (hsv[..., 1] < 40)).astype(np.uint8)
        yel = ((hsv[..., 0] > 20) & (hsv[..., 0] < 35) & (hsv[..., 1] > 150) & (hsv[..., 2] > 180)).astype(np.uint8)
        dark = (hsv[..., 2] < 50).astype(np.uint8)
        darkn = cv2.dilate(dark, np.ones((3, 3), np.uint8))
        edge = white & darkn
        for k, (a, b) in bands.items():
            rows = edge[int(a * h):int(b * h)].sum(1)
            if (rows > w * 0.06).sum() >= 3: res[k] += 1
        if yel[int(0.08 * h):int(0.88 * h)].mean() > 0.004: ylw += 1
    n = max(1, len(frames))
    out = {k: v / n for k, v in res.items()}; out['yellow'] = ylw / n
    return out

def audio(mp3, cuts):
    r = {}
    try:
        p = subprocess.run([FF, '-hide_banner', '-nostats', '-i', mp3, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True, errors='ignore')
        m = re.findall(r'I:\s*(-?[\d.]+) LUFS', p.stderr); r['lufs'] = float(m[-1]) if m else None
        m = re.findall(r'Peak:\s*(-?[\d.]+) dBFS', p.stderr); r['tp'] = float(m[-1]) if m else None
        m = re.findall(r'LRA:\s*([\d.]+) LU', p.stderr); r['lra'] = float(m[-1]) if m else None
        raw = subprocess.run([FF, '-v', 'error', '-i', mp3, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
        x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
        hop = 160; n = len(x) // hop
        rms = np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, 1) + 1e-12); db = 20 * np.log10(rms)
        r['first_sound'] = float(np.argmax(db > -32) * 0.01) if (db > -32).any() else None
        # onset (transient) peaks: positive flux of high band energy
        fr = x[:n * hop].reshape(n, hop); hi = np.abs(np.diff(fr, axis=1)).mean(1)
        flux = np.maximum(0, np.diff(hi, prepend=hi[0])); thr = np.median(flux) + 6 * np.std(flux)
        pk = [i * 0.01 for i in range(1, n - 1) if flux[i] > thr and flux[i] >= flux[i - 1] and flux[i] >= flux[i + 1]]
        dd = []
        for t in pk:
            if not dd or t - dd[-1] > 0.3: dd.append(t)
        r['transients'] = len(dd)
        r['cut_hit'] = (sum(1 for c in cuts if any(abs(c - t) <= 0.12 for t in dd)) / len(cuts)) if cuts else None
    except Exception as e:
        r['err'] = str(e)
    return r

SRT = json.load(open(os.path.join(B, 'nasser_srt_345.json'), encoding='utf-8'))
OLD = json.load(open(os.path.join(B, 'ns_cuts300.json'), encoding='utf-8'))

def one(item):
    vid, mp4, mp3 = item
    of = os.path.join(OUT, vid + '.json')
    if os.path.exists(of): return vid
    try:
        det = cv2.FaceDetectorYN.create(YN, '', (320, 320)) if YN else cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        fps, dur, cuts, frames = detect_cuts(mp4)
        old = OLD.get(vid, {}).get('cuts', [])
        agree = [c for c in cuts if any(abs(c - o) <= 0.15 for o in old)]
        conf = sorted(set(agree + [c for c in cuts if not old]))
        use = conf if old else cuts
        bnd = [0.0] + use + [dur]; shots = [b - a for a, b in zip(bnd, bnd[1:]) if b - a > 0.05]
        fh = faces(frames, det)
        tb = textband(frames)
        au = audio(mp3, use) if mp3 and os.path.exists(mp3) else {}
        srt = srt_parse(SRT[vid]) if vid in SRT else []
        ar = os.path.join(B, 'ns_ar100', 'json', vid + '.json'); arw = None
        if os.path.exists(ar):
            a = json.load(open(ar, encoding='utf-8')); words = [w for s in a for w in s.get('w', [])]
            if words:
                span = sum(s['e'] - s['s'] for s in a); arw = {'words': len(words), 'speech_span': span, 'wps': len(words) / max(span, 0.1), 'first_word': words[0][0], 'last_word_end': words[-1][1]}
        res = {'vid': vid, 'fps': fps, 'dur': dur, 'cuts_mine': cuts, 'cuts_old': old, 'cuts_confirmed': use,
               'agree_mine_in_old': len(agree) / len(cuts) if cuts else None,
               'agree_old_in_mine': (sum(1 for o in old if any(abs(c - o) <= 0.15 for c in cuts)) / len(old)) if old else None,
               'shots': shots, 'face': [t for t, h in fh if h], 'face_share': (sum(h for _, h in fh) / len(fh)) if fh else None,
               'face_first1s': any(h for t, h in fh if t < 1.0), 'textband': tb, 'audio': au,
               'srt': [[s, e, len(t)] for s, e, t in srt], 'srt_first': srt[0][0] if srt else None, 'srt_last_end': srt[-1][1] if srt else None,
               'srt_cover': (sum(e - s for s, e, _ in srt) / dur) if srt and dur else None, 'ar': arw}
        json.dump(res, open(of, 'w', encoding='utf-8'), ensure_ascii=False)
    except Exception as e:
        json.dump({'vid': vid, 'err': str(e)}, open(of, 'w', encoding='utf-8'))
    return vid

if __name__ == '__main__':
    items = []
    for d in ['ns_ar100', 'ns_ar200', 'ns_ar300']:
        for f in glob.glob(os.path.join(B, d, 'v', '*.mp4')):
            v = os.path.basename(f)[:-4]; items.append((v, f, os.path.join(B, d, v + '.mp3')))
    print('videos', len(items), 'yunet', YN, flush=True)
    with Pool(6) as p:
        for k, v in enumerate(p.imap_unordered(one, items)):
            if k % 20 == 0: print(k, v, flush=True)
    print('DONE', flush=True)
