# 날 것 감성 브이로그 렌더러 v1 (2026-11-24 사용자 「빠니보틀·에어비앤비 릴스처럼 날 것 감성」)
#  - 원본(DJI 세로 1080x1920)을 고치지 않고 자르기·이어 붙이기만(반사기 원칙). 색보정·필터 없음
#  - 소리: 현장 소리 그대로가 주인공. 배경음은 말 없는 이동 구간에만 낮게(말하면 더 줄임)
#  - 자막: 받아쓰기(faster-whisper) 낱말 시각 그대로, 흰 글자 + 검은 테두리. 지어낸 말 없음(받아쓰기 오탈자만 고침)
#  - 날짜·장소 작은 글씨(파일 이름의 촬영일), 장 제목은 큰 흰 글자 한 줄만. 붓칠·칩·노랑 없음(벨기에판 아님)
#  실행: python3 vlog_raw_render.py edl.json stt.json drive_files.json out.mp4
import os, sys, json, subprocess, shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

EDL, STT, FILES, OUT = sys.argv[1:5]
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
FD = os.path.join(REPO, 'scripts/shortform/fonts')
W, H, FPS = 1080, 1920, 30
TMP = os.environ.get('VLOG_TMP', '/dev/shm/vlog_raw')
os.makedirs(TMP, exist_ok=True)
edl = json.load(open(EDL)); stt = json.load(open(STT))
url = {f['name'].split('_')[2]: f['url'] for f in json.load(open(FILES))}
FIX = edl.get('fix', {})
FILLER = set(edl.get('filler', ['응', '아하', '에휴', '하하', '아...', '오...', '네네네네']))          # 받아쓰기 오탈자 고침(예: 태국수 → 칼국수)
BGM = edl.get('bgm', os.path.join(REPO, 'public/assets/shortform/bgm/bobae_luxury_v1.mp3'))
_fc = {}
def font(n, s):
    if (n, s) not in _fc: _fc[(n, s)] = ImageFont.truetype(os.path.join(FD, f'Pretendard-{n}.otf'), s)
    return _fc[(n, s)]

def text_png(path, lines, size, weight='ExtraBold', stroke=8, y=None, align_top=None, x=None, shadow=True, fill=(255, 255, 255)):
    im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im); f = font(weight, size)
    lh = int(size * 1.28); total = lh * len(lines)
    y0 = (align_top if align_top is not None else (y - total // 2))
    for i, s in enumerate(lines):
        bb = d.textbbox((0, 0), s, font=f, stroke_width=stroke)
        xx = (W - (bb[2] - bb[0])) // 2 - bb[0] if x is None else x
        if shadow:
            sh = Image.new('RGBA', (W, H)); ImageDraw.Draw(sh).text((xx + 4, y0 + i * lh + 6), s, font=f, fill=(0, 0, 0, 120), stroke_width=stroke, stroke_fill=(0, 0, 0, 120))
            im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)))
        d.text((xx, y0 + i * lh), s, font=f, fill=fill, stroke_width=stroke, stroke_fill=(0, 0, 0))
    im.save(path)

def fix(s):
    for a, b in FIX.items(): s = s.replace(a, b)
    return s.strip()

def chunks(clip, a, b, skip=()):
    """받아쓰기 낱말을 2줄 이하 덩어리로. 시각은 원본 기준 → 구간 기준으로 옮김"""
    out = []
    for si, seg in enumerate(stt.get(clip, [])):
        if (clip, si) in skip or any(seg['s'] >= x0 and seg['e'] <= x1 for x0, x1 in edl.get('nocap', {}).get(clip, [])): continue
        ws = [w for w in seg['w'] if w[1] >= a - 0.05 and w[2] <= b + 0.3 and w[0].strip(' .,?!') not in FILLER]
        if not ws: continue
        cur, n = [], 0
        for w in ws:
            t = w[0].strip()
            if cur and n + len(t) > 20: out.append(cur); cur, n = [], 0
            cur.append([t, w[1], w[2]]); n += len(t) + 1
        if cur: out.append(cur)
    res = []
    for i, c in enumerate(out):
        t0 = max(a, c[0][1] - 0.08); t1 = c[-1][2] + 0.35
        if i + 1 < len(out): t1 = min(t1, max(a, out[i + 1][0][1] - 0.08) - 0.05)
        t1 = min(t1, b)
        txt = fix(' '.join(w[0] for w in c))
        if t1 - t0 > 0.25 and txt: res.append((t0 - a, t1 - a, txt))
    return res

def wrap(s, n=13):
    ws, lines, cur = s.split(), [], ''
    for w in ws:
        if cur and len(cur) + 1 + len(w) > n: lines.append(cur); cur = w
        else: cur = (cur + ' ' + w).strip()
    if cur: lines.append(cur)
    return lines[:2] if len(lines) <= 2 else [' '.join(lines[:len(lines) // 2]), ' '.join(lines[len(lines) // 2:])]

segs = []; T = 0.0
for k, it in enumerate(edl['cuts']):
    clip, a, b = it['clip'], float(it['a']), float(it['b']); dur = b - a
    ov = []   # (png, t0, t1)
    if not it.get('nocap'):
        for j, (t0, t1, txt) in enumerate(chunks(clip, a, b)):
            p = f'{TMP}/c{k:02d}_{j:02d}.png'; text_png(p, wrap(txt), 60, y=1480); ov.append((p, t0, t1))
    for j, c in enumerate(it.get('caps', [])):    # 손으로 넣는 자막(편집자 말 등)
        p = f'{TMP}/m{k:02d}_{j:02d}.png'; text_png(p, c['text'].split('\n'), c.get('size', 60), y=c.get('y', 1480), fill=tuple(c.get('fill', (255, 255, 255))))
        ov.append((p, c.get('t0', 0), c.get('t1', dur)))
    if it.get('title'):
        p = f'{TMP}/t{k:02d}.png'; text_png(p, it['title'].split('\n'), it.get('title_size', 118), weight='Black', stroke=10, y=it.get('title_y', 760))
        ov.append((p, it.get('title_t0', 0.15), it.get('title_t1', min(dur, 2.4))))
    if it.get('stamp'):
        p = f'{TMP}/s{k:02d}.png'; text_png(p, it['stamp'].split('\n'), 38, weight='SemiBold', stroke=3, align_top=150, x=60)
        ov.append((p, 0, min(dur, it.get('stamp_t', 3.5))))
    seg = f'{TMP}/seg{k:02d}.mp4'
    src = it.get('file', url.get(clip)); off = float(it.get('off', 0))   # file: 원본 일부를 잘라 둔 파일(off = 그 파일의 원본 시작 초)
    inputs = ['-ss', f'{a - off:.3f}', '-t', f'{dur:.3f}', '-i', src]
    for p, _, _ in ov: inputs += ['-i', p]
    vf = f'[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},setsar=1'
    if it.get('zoom'):   # 날것 편집의 「훅 당기기」: 중심 1.15배 확대(자르기)
        z = it['zoom']; vf += f',crop=iw/{z}:ih/{z},scale={W}:{H}'
    if it.get('black'):  # 편집자 요청으로 뺀 화면(셀카 등): 검정 화면 + 소리만
        vf += ',drawbox=c=black:t=fill'
    vf += '[v0]'
    last = 'v0'
    for i, (p, t0, t1) in enumerate(ov):
        vf += f';[{last}][{i+1}:v]overlay=0:0:enable=\'between(t,{t0:.3f},{t1:.3f})\'[v{i+1}]'; last = f'v{i+1}'
    af = f'[0:a]aresample=48000,aformat=channel_layouts=stereo,volume={it.get("gain", 1.0)},afade=t=in:d=0.04,afade=t=out:st={max(0, dur-0.06):.3f}:d=0.06[a]'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', *inputs, '-filter_complex', vf + ';' + af, '-map', f'[{last}]', '-map', '[a]',
                    '-t', f'{dur:.3f}', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', str(FPS),
                    '-c:a', 'pcm_s16le', seg], check=True)
    segs.append({'file': seg, 't': round(T, 3), 'dur': dur, 'bgm': it.get('bgm', 0.0), 'clip': clip, 'a': a, 'b': b, 'note': it.get('note', '')})
    T += dur
    print(f'{k:02d} {clip} {a:7.2f}-{b:7.2f} ({dur:5.2f}s) total {T:6.1f}', flush=True)

lst = f'{TMP}/list.txt'
open(lst, 'w').write(''.join(f"file '{s['file']}'\n" for s in segs))
body = f'{TMP}/body.mkv'
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', body], check=True)

# 배경음: 표시한 구간만, 0.8초 페이드, 현장 소리가 나오면 더 줄임(sidechain)
sr = 48000; n = int(T * sr) + sr
env = np.zeros(n, np.float32)
for s in segs:
    if s['bgm'] > 0:
        i0, i1 = int(s['t'] * sr), int((s['t'] + s['dur']) * sr); env[i0:i1] = s['bgm']
k = int(0.8 * sr); ker = np.ones(k, np.float32) / k
env = np.convolve(env, ker, mode='same').astype(np.float32)
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-stream_loop', '-1', '-i', BGM, '-t', f'{T+1:.2f}', '-f', 'f32le', '-ac', '2', '-ar', str(sr), '-'], capture_output=True, check=True).stdout
bg = np.frombuffer(raw, np.float32).reshape(-1, 2)[:n]
bg = bg * env[:len(bg), None]
bgf = f'{TMP}/bgm.f32'; bg.astype(np.float32).tofile(bgf)
fc = ('[0:a]asplit=2[va][vk];'
      f'[1:a]aformat=sample_rates={sr}:channel_layouts=stereo[bg];'
      '[bg][vk]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[bgd];'
      '[va][bgd]amix=inputs=2:normalize=0[mx];[mx]%s[a]')
mixw = f'{TMP}/mix.wav'   # 음량 2번 재기(1번에 맞추면 −16 LUFS 근처로 모자람)
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', body, '-f', 'f32le', '-ar', str(sr), '-ac', '2', '-i', bgf,
                '-filter_complex', fc % 'anull', '-map', '[a]', '-c:a', 'pcm_s16le', mixw], check=True)
ms = subprocess.run(['ffmpeg', '-hide_banner', '-i', mixw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
mj = json.loads(ms[ms.rfind('{'):ms.rfind('}') + 1])
ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={mj['input_i']}:measured_TP={mj['input_tp']}:measured_LRA={mj['input_lra']}"
      f":measured_thresh={mj['input_thresh']}:offset={mj['target_offset']}:linear=true,alimiter=limit=0.84")
fc = fc % ln
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', body, '-f', 'f32le', '-ar', str(sr), '-ac', '2', '-i', bgf,
                '-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p',
                '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-t', f'{T:.3f}', OUT], check=True)
json.dump({'total_s': round(T, 2), 'cuts': segs}, open(OUT + '.plan.json', 'w'), ensure_ascii=False, indent=1)
print(OUT, round(T, 1))
