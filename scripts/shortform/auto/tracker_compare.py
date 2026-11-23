"""VitTrack vs TAPNext++ 비교 — GLE450(cha10) 라벨 상자 기준.

python3 tracker_compare.py 원본.mp4 ground_final.json 결과.json [--fps 10]
각 라벨: 구간 첫 라벨 상자의 가운데를 시작점으로 두 추적기를 앞으로 돌리고,
라벨 시각마다 추적 위치와 라벨 상자 가운데의 거리(가로 1080 기준 px)·상자 안에 있는지·끊김 횟수·처리 시간을 잰다.
끊김 = 보임 → 안 보임으로 바뀐 횟수(추적기 스스로 놓쳤다고 보고한 횟수).
"""
import json
import os
import sys
import time

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import part_tracker  # noqa: E402

SW, SH = 270, 480


def frames_at(cap, t0, t1, fps):
    out, ts = [], []
    t = t0
    while t <= t1 + 1e-6:
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ok, f = cap.read()
        if not ok:
            break
        out.append(cv2.resize(f, (SW, SH), interpolation=cv2.INTER_AREA)); ts.append(t)
        t += 1.0 / fps
    return out, ts


def main():
    src, lab, dst = sys.argv[1:4]
    fps = float(sys.argv[sys.argv.index('--fps') + 1]) if '--fps' in sys.argv else 10.0
    names = os.environ.get('CMP_TRACKERS', 'vittrack,tapnext').split(',')
    L = json.load(open(lab))
    cap = cv2.VideoCapture(src)
    res = {}
    for key, g in L.items():
        rows = g['rows']
        t0, t1 = rows[0][0], rows[-1][0]
        fr, ts = frames_at(cap, t0, t1, fps)
        x0, y0, x1, y1 = rows[0][2:6]
        pt = ((x0 + x1) / 2, (y0 + y1) / 2); wh = (x1 - x0, y1 - y0)
        res[key] = {'prompt': g['prompt'], 'range': [t0, t1], 'frames': len(fr)}
        for nm in names:
            r, sec = part_tracker.track(fr, 0, pt, wh, name=nm)
            vis = [v for _, _, v in r]
            breaks = sum(1 for a, b in zip(vis, vis[1:]) if a and not b)
            errs, inside = [], 0
            for row in rows[1:]:
                j = min(range(len(ts)), key=lambda k: abs(ts[k] - row[0]))
                bx0, by0, bx1, by1 = row[2:6]
                cx, cy = (bx0 + bx1) / 2, (by0 + by1) / 2
                x, y, _ = r[j]
                errs.append(float(np.hypot((x - cx) * 1080, (y - cy) * 1920)))
                inside += int(bx0 <= x <= bx1 and by0 <= y <= by1)
            res[key][nm] = {
                'mean_px': round(float(np.mean(errs)), 1) if errs else None,
                'max_px': round(float(np.max(errs)), 1) if errs else None,
                'inside': f'{inside}/{len(rows) - 1}',
                'breaks': breaks, 'lost_frames': vis.count(False),
                'sec': round(sec, 2), 'ms_per_frame': round(sec / max(1, len(fr) - 1) * 1000, 1),
                'per_label_px': [round(e, 1) for e in errs],
            }
            print(key, g['prompt'], nm, res[key][nm]['mean_px'], res[key][nm]['inside'],
                  'breaks', breaks, f'{sec:.1f}s', flush=True)
    json.dump(res, open(dst, 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
