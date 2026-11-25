"""T3: SAM 3.1 마스크 풀기 검사 (새 요금 없음).

이미 받은 SAM 결과(sam/*.json, sam_box/*.json)의 마스크를 decode_masks.mjs로 푼 뒤
  1) 풀기 성공률  2) 마스크 크기 = 상자 크기  3) 마스크가 상자 네 변에 닿는지(상자가 마스크 외곽인지)
  4) 채움 비율  을 재고, 컷마다 한 장씩 마스크를 칠한 접촉 시트와
  「글자가 부위 뒤로 지나가는」 시험 영상(바퀴가 글자를 가림)을 만든다.

사용:
  node decode_masks.mjs <sam결과.json> <출력접두어>   # @meta-sam/parser 가 보이는 폴더에서
  python3 t3_mask_check.py --dec /tmp/osst/t3 --clips <eval>/clips --out /tmp/osst/t3/out
"""
import argparse, glob, json, os, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

YEL = np.array([245, 242, 0], np.float32)
FONT = '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'


def load(dec, name):
    idx = json.load(open(f'{dec}/{name}.idx.json'))
    b = np.fromfile(f'{dec}/{name}.bin', np.uint8)
    byf = {}
    for e in idx:
        byf.setdefault(e['f'], []).append(e)
    return idx, b, byf


def mask_of(b, e):
    return b[e['off']:e['off'] + e['w'] * e['h']].reshape(e['h'], e['w']) > 0


def frame(clip, f, fps=30):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{f / fps:.3f}', '-i', clip, '-frames:v', '1',
                          '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(960, 540, 3).astype(np.float32)


def paint(a, b, e):
    m = mask_of(b, e); x0, y0 = e['box'][0], e['box'][1]
    H, W = a.shape[:2]; h = min(m.shape[0], H - y0); w = min(m.shape[1], W - x0)
    m = m[:h, :w]; reg = a[y0:y0 + h, x0:x0 + w]
    edge = m ^ ndimage.binary_erosion(m, iterations=2)
    reg[m] = reg[m] * 0.65 + YEL * 0.35
    reg[edge] = YEL


def stats(dec):
    rows = []; T = dict(masks=0, size_eq_box=0, tight=0, files=0)
    fills = []
    for ix in sorted(glob.glob(f'{dec}/*.idx.json')):
        name = os.path.basename(ix)[:-9]; idx, b, _ = load(dec, name); T['files'] += 1
        for e in idx:
            T['masks'] += 1; x0, y0, x1, y1 = e['box']
            if abs(e['w'] - (x1 - x0 + 1)) <= 1 and abs(e['h'] - (y1 - y0 + 1)) <= 1:
                T['size_eq_box'] += 1
            m = mask_of(b, e); ys, xs = np.nonzero(m)
            if xs.min() <= 2 and ys.min() <= 2 and xs.max() >= e['w'] - 3 and ys.max() >= e['h'] - 3:
                T['tight'] += 1
            fills.append(float(m.mean()))
        rows.append(dict(name=name, masks=len(idx), frames=len({e['f'] for e in idx})))
    f = np.array(fills)
    T.update(fill_min=round(float(f.min()), 3), fill_p5=round(float(np.percentile(f, 5)), 3),
             fill_median=round(float(np.median(f)), 3))
    return T, rows


def sheet(dec, clips, out):
    names = sorted(os.path.basename(p)[4:-9] for p in glob.glob(f'{dec}/sam_*.idx.json')
                   if not os.path.basename(p).startswith('sam_box_'))
    tiles = []
    fnt = ImageFont.truetype(FONT, 22)
    for n in names:
        src = 'sam_box_' + n if os.path.exists(f'{dec}/sam_box_{n}.idx.json') else 'sam_' + n
        idx, b, byf = load(dec, src)
        fs = sorted(byf); f = fs[len(fs) // 2] if fs else 0
        a = frame(f'{clips}/{n}.mp4', f)
        for e in byf.get(f, []):
            paint(a, b, e)
        im = Image.fromarray(a.clip(0, 255).astype(np.uint8)).resize((270, 480))
        d = ImageDraw.Draw(im); d.rectangle([0, 0, 270, 30], fill=(0, 0, 0))
        d.text((6, 2), n + (' *상자' if src.startswith('sam_box') else ''), font=fnt, fill=(255, 255, 255))
        tiles.append(im)
    cols = 6; rows = (len(tiles) + cols - 1) // cols
    S = Image.new('RGB', (cols * 270, rows * 480), (20, 20, 20))
    for i, t in enumerate(tiles):
        S.paste(t, ((i % cols) * 270, (i // cols) * 480))
    S.save(f'{out}/t3_mask_sheet.jpg', quality=82)


def title_behind(dec, clips, out, cut='w2_wheel_pan', text='18인치 휠'):
    """글자를 먼저 그리고 그 위에 마스크 부위(원본 픽셀)를 다시 덮어 글자가 부위 뒤로 가게."""
    src = 'sam_box_' + cut if os.path.exists(f'{dec}/sam_box_{cut}.idx.json') else 'sam_' + cut
    idx, b, byf = load(dec, src)
    clip = f'{clips}/{cut}.mp4'
    n = int(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v', '-count_frames', '-show_entries',
                            'stream=nb_read_frames', '-of', 'csv=p=0', clip], capture_output=True, text=True).stdout)
    dec_p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', clip, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                             stdout=subprocess.PIPE)
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '540x960',
                            '-r', '30', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
                            '-pix_fmt', 'yuv420p', f'{out}/t3_title_behind_{cut}.mp4'], stdin=subprocess.PIPE)
    fnt = ImageFont.truetype(FONT, 120)
    for f in range(n):
        raw = dec_p.stdout.read(540 * 960 * 3)
        if len(raw) < 540 * 960 * 3:
            break
        a = np.frombuffer(raw, np.uint8).reshape(960, 540, 3).copy()
        im = Image.fromarray(a); d = ImageDraw.Draw(im)
        x = 560 - f * 7  # 오른쪽에서 왼쪽으로 천천히 지나감
        d.text((x, 640), text, font=fnt, fill=(245, 242, 0), stroke_width=4, stroke_fill=(0, 0, 0))
        o = np.array(im)
        for e in byf.get(f, []):
            m = mask_of(b, e); x0, y0 = e['box'][0], e['box'][1]
            h = min(m.shape[0], 960 - y0); w = min(m.shape[1], 540 - x0); m = m[:h, :w]
            o[y0:y0 + h, x0:x0 + w][m] = a[y0:y0 + h, x0:x0 + w][m]
        enc.stdin.write(o.tobytes())
    enc.stdin.close(); enc.wait()


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--dec', required=True); ap.add_argument('--clips', required=True)
    ap.add_argument('--out', required=True)
    A = ap.parse_args(); os.makedirs(A.out, exist_ok=True)
    T, rows = stats(A.dec)
    json.dump(dict(totals=T, files=rows), open(f'{A.out}/t3_result.json', 'w'), ensure_ascii=False, indent=1)
    print(json.dumps(T, ensure_ascii=False))
    sheet(A.dec, A.clips, A.out)
    title_behind(A.dec, A.clips, A.out)
    print('ok', A.out)
