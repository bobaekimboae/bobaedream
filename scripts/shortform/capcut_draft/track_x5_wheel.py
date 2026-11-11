"""휠 허브(BMW 엠블럼) 매 프레임 추적 6.3~9.3초 → wheel_track.json [[t, x, y]] (1080 좌표)"""
import json, subprocess, numpy as np, cv2
W, H, FPS = 540, 960, 25
t0, t1 = 6.3, 9.3
pr = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", str(t0), "-i", "src.mp4", "-t", str(t1 - t0), "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], stdout=subprocess.PIPE)
fr = []
while True:
    b = pr.stdout.read(W * H)
    if len(b) < W * H: break
    fr.append(np.frombuffer(b, np.uint8).reshape(H, W))
ai = int(round((7.2 - t0) * FPS)); anchor = np.array([120.0, 486.0], np.float32)  # 7.2초 허브(레퍼런스 화면에서 잰 값 240,972 의 절반)
lk = dict(winSize=(41, 41), maxLevel=4, criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01))
pos = {ai: anchor.copy()}
for d in (1, -1):
    cur = anchor.copy(); i = ai
    while 0 <= i + d < len(fr):
        j = i + d
        m = np.zeros_like(fr[i]); cv2.circle(m, (int(cur[0]), int(cur[1])), 60, 255, -1)
        p = cv2.goodFeaturesToTrack(fr[i], 80, 0.005, 3, mask=m)
        if p is not None and len(p) >= 4:
            p1, st, _ = cv2.calcOpticalFlowPyrLK(fr[i], fr[j], p, None, **lk)
            ok = st.ravel() == 1
            if ok.sum() >= 4:
                cur = cur + np.median((p1 - p)[ok].reshape(-1, 2), 0)
        pos[j] = cur.copy(); i = j
ts = sorted(pos)
out = [[round(t0 + k / FPS, 3), round(float(pos[k][0] * 2), 1), round(float(pos[k][1] * 2), 1)] for k in ts]
json.dump(out, open("wheel_track.json", "w"))
for r in out[::10]: print(r)
