# -*- coding: utf-8 -*-
"""오토스카우트 3개국 최신 쇼츠 N편씩: 노랑 칩(붓칠) · 손글씨/낙서(얇은 색 획) 후보 자동 검출 (내부 분석용)."""
import cv2, numpy as np, json, os, sys, subprocess
from multiprocessing import Pool
W = r'C:\Users\Thinkbook\bbx_chip_survey'
FF = r'C:\Users\Thinkbook\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe'
G = [d for d in os.listdir('G:\\') if os.path.isdir(os.path.join('G:\\', d)) and 'SNS레퍼런스_원본영상' in os.listdir(os.path.join('G:\\', d))][0]
BASE = os.path.join('G:\\', G, 'SNS레퍼런스_원본영상')
DIRS = {'de': '오토_독일', 'nl': '오토_네덜란드', 'be': '오토_벨기에'}
OUT = os.path.join(W, 'out')
FW, FH = 360, 640


def latest(cc, n):
    have = {os.path.splitext(f)[0] for f in os.listdir(os.path.join(BASE, DIRS[cc])) if f.endswith('.mp4')}
    order = [l.strip() for l in open(os.path.join(W, f'order_{cc}.txt'), encoding='ascii') if l.strip()]
    ids = [i for i in order if i in have][:n]
    last = order.index(ids[-1]) if ids else 0
    return ids, [i for i in order[:last + 1] if i not in have]


def comps(mask, minarea):
    n, lab, st, _ = cv2.connectedComponentsWithStats(mask, 8)
    for k in range(1, n):
        x, y, w, h, a = st[k]
        if a >= minarea: yield k, x, y, w, h, a, lab


def frame_items(fr):
    hsv = cv2.cvtColor(fr, cv2.COLOR_BGR2HSV)
    yel = cv2.inRange(hsv, (22, 120, 170), (36, 255, 255))
    yel = cv2.morphologyEx(yel, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8)); items = []
    g = cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY)
    for k, x, y, w, h, a, lab in comps(yel, 120):
        fill = a / float(w * h); m = (lab[y:y + h, x:x + w] == k).astype(np.uint8)
        holes = (m == 0) & (cv2.dilate(m, np.ones((9, 9), np.uint8)) > 0)
        gg = g[y:y + h, x:x + w]; dark = int(((gg < 90) & holes).sum()); white = int(((gg > 225) & holes).sum())
        pts = cv2.findNonZero(m); ang = cv2.minAreaRect(pts)[2] if pts is not None else 0
        if ang > 45: ang -= 90
        kind = 'chip' if (fill >= 0.45 and w >= 20 and h >= 10 and a >= 300) else ('stroke' if fill < 0.30 and max(w, h) >= 40 else None)
        if kind: items.append({'kind': kind, 'box': [int(x), int(y), int(w), int(h)], 'area': int(a), 'fill': round(fill, 2),
                               'ang': round(float(ang), 1), 'dark_in': dark, 'white_in': white})
    sat = cv2.inRange(hsv, (0, 170, 150), (179, 255, 255)) & ~yel
    for k, x, y, w, h, a, lab in comps(sat, 150):
        fill = a / float(w * h)
        if fill < 0.22 and max(w, h) >= 50 and a < 6000:
            items.append({'kind': 'color_stroke', 'box': [int(x), int(y), int(w), int(h)], 'area': int(a), 'fill': round(fill, 2),
                          'hue': int(np.median(hsv[y:y + h, x:x + w, 0][lab[y:y + h, x:x + w] == k]))})
    return items


def job(args):
    cc, vid, rank = args
    od = os.path.join(OUT, cc, vid)
    dj = os.path.join(od, 'res.json')
    if os.path.exists(dj):
        return cc, vid, json.load(open(dj, encoding='utf-8'))
    os.makedirs(od, exist_ok=True)
    pr = subprocess.Popen([FF, '-v', 'error', '-threads', '2', '-i', os.path.join(BASE, DIRS[cc], vid + '.mp4'),
                           '-vf', f'fps=2,scale={FW}:{FH}', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], stdout=subprocess.PIPE)
    n = 0; prev = None; keep = []; sz = FW * FH * 3
    while True:
        buf = pr.stdout.read(sz)
        if len(buf) < sz: break
        fr = np.frombuffer(buf, np.uint8).reshape(FH, FW, 3); t = n / 2.0; n += 1
        items = frame_items(fr)
        sig = tuple(sorted((it['kind'], it['box'][0] // 30, it['box'][1] // 30) for it in items))
        if items and sig != prev:
            fn = f'{int(t * 100):05d}.jpg'; cv2.imwrite(os.path.join(od, fn), fr, [cv2.IMWRITE_JPEG_QUALITY, 80])
            keep.append({'t': t, 'file': fn, 'items': items})
        prev = sig
    pr.wait()
    r = {'rank': rank, 'dur': n / 2.0, 'frames': keep}
    json.dump(r, open(dj, 'w', encoding='utf-8'), ensure_ascii=False)
    return cc, vid, r


if __name__ == '__main__':
    N = int(sys.argv[1]) if len(sys.argv) > 1 else 100
    S = {}; jobs = []
    for cc in ('de', 'nl', 'be'):
        ids, miss = latest(cc, N); S[cc] = {'ids': ids, 'not_downloaded_in_range': miss, 'videos': {}}
        jobs += [(cc, v, i + 1) for i, v in enumerate(ids)]
    print('jobs', len(jobs), flush=True)
    done = 0
    with Pool(6) as p:
        for cc, vid, r in p.imap_unordered(job, jobs):
            S[cc]['videos'][vid] = r; done += 1
            if done % 10 == 0:
                print(done, '/', len(jobs), flush=True)
    json.dump(S, open(os.path.join(OUT, 'survey.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    print('done', done)
