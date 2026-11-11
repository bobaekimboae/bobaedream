import json, subprocess, numpy as np, cv2
W, H, FPS = 540, 960, 25
def track(t0, t1, at, ax, ay, rad=50):
    pr = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", str(t0), "-i", "src.mp4", "-t", str(t1 - t0 + 0.04), "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], stdout=subprocess.PIPE)
    fr = []
    while True:
        b = pr.stdout.read(W * H)
        if len(b) < W * H: break
        fr.append(np.frombuffer(b, np.uint8).reshape(H, W))
    lk = dict(winSize=(31, 31), maxLevel=4, criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01))
    ai = int(round((at - t0) * FPS)); a = np.array([ax / 2, ay / 2], np.float32); pos = {ai: a.copy()}
    for d in (1, -1):
        cur = a.copy(); i = ai
        while 0 <= i + d < len(fr):
            j = i + d; m = np.zeros_like(fr[i]); cv2.circle(m, (int(cur[0]), int(cur[1])), rad, 255, -1)
            p = cv2.goodFeaturesToTrack(fr[i], 80, 0.005, 3, mask=m)
            if p is not None and len(p) >= 4:
                p1, st, _ = cv2.calcOpticalFlowPyrLK(fr[i], fr[j], p, None, **lk); ok = st.ravel() == 1
                if ok.sum() >= 4: cur = cur + np.median((p1 - p)[ok].reshape(-1, 2), 0)
            pos[j] = cur.copy(); i = j
    return [[round(k / FPS, 3), round(float(pos[k][0] * 2), 1), round(float(pos[k][1] * 2), 1)] for k in sorted(pos)]
led = track(1.8, 3.4, 2.6, 198, 812)
print(led[0], led[-1])
json.dump({"led": led, "wheel": json.load(open("wheel_track.json"))}, open("extra_track.json", "w"))
