"""콜아웃 점 추적 v4(정확도 고도화).
- 원본 해상도(1080x1920)에서 처리(v3는 540x960 → 오차 2배)
- 레퍼런스 점은 밝기 가중 중심(소수점 단위)으로 잰다
- 광학 흐름(닮음 변환) 궤적 F에, 레퍼런스 점이 보이는 프레임의 잔차(점 - F)를 시간으로 보간해 더한다
  → 점이 보이는 프레임은 레퍼런스와 거의 일치, 안 보이는 구간은 흐름 모양 그대로 이어짐
- 평활은 잔차에만(움직임 자체를 뭉개지 않아 빠른 이동에서 늦어지지 않음)
- 정확도는 '하나 빼고 검증'(그 프레임 점을 빼고 예측한 값과 실제 점의 차이)으로 잰다
사용: python track4.py  (ref_mg.mp4, src.mp4, track3.json 필요) → track4.json"""
import json, subprocess
import numpy as np, cv2
REF, SRC = "ref_mg.mp4", "src.mp4"
W, H, FPS = 1080, 1920, 25
CALL = [(9.8, 11.4), (11.6, 13.2), (14.0, 15.8), (20.4, 21.8), (22.4, 24.1), (24.2, 25.4), (26.8, 27.8),
        (28.0, 29.6), (29.8, 31.6), (33.2, 35.0), (36.6, 37.8), (38.0, 39.2), (40.6, 42.6), (44.0, 46.0),
        (46.2, 48.0), (48.8, 51.0), (52.6, 54.8), (55.2, 57.2), (57.2, 58.8)]
fi = lambda t: int(round(t * FPS))
T3 = json.load(open("track3.json"))

def seg(p, i0, n):
    pr = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{i0 / FPS:.4f}", "-i", p, "-frames:v", str(n), "-vf", f"scale={W}:{H}",
                         "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    m = len(pr) // (W * H * 3)
    return np.frombuffer(pr[:m * W * H * 3], np.uint8).reshape(m, H, W, 3)

def blob(r, s, p, rad=44):
    x1, y1 = int(max(0, p[0] - rad)), int(max(0, p[1] - rad)); x2, y2 = int(min(W, p[0] + rad)), int(min(H, p[1] + rad))
    rr = r[y1:y2, x1:x2].astype(np.int16); ss = s[y1:y2, x1:x2].astype(np.int16)
    diff = np.abs(rr - ss).max(2); m = ((rr.min(2) > 180) & (diff > 25)).astype(np.uint8)
    n, lab, st, cc = cv2.connectedComponentsWithStats(m)
    best = None
    for q in range(1, n):
        bw, bh, ar = st[q][2], st[q][3], st[q][4]
        if 10 <= bw <= 48 and 10 <= bh <= 48 and 0.65 < bw / bh < 1.5 and ar > 0.6 * bw * bh:
            ys, xs = np.where(lab == q); w = diff[ys, xs].astype(float)
            c = np.array([x1 + (xs * w).sum() / w.sum(), y1 + (ys * w).sum() / w.sum()])
            d = np.linalg.norm(c - p)
            if best is None or d < best[0]: best = (d, c)
    return None if best is None else best[1]

lk = dict(winSize=(41, 41), maxLevel=5, criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 40, 0.005))
def feats(g, c):
    m = np.zeros_like(g); cv2.circle(m, (int(c[0]), int(c[1])), 150, 255, -1); cv2.circle(m, (int(c[0]), int(c[1])), 18, 0, -1)
    return cv2.goodFeaturesToTrack(g, 200, 0.003, 5, mask=m)

def flow_chain(G, a0, p0):
    F = {a0: np.array(p0, float)}
    for d in (1, -1):
        cur = np.array(p0, np.float32); i = a0; pts = feats(G[i], cur)
        while 0 <= i + d < len(G):
            j = i + d
            if pts is None or len(pts) < 10: pts = feats(G[i], cur)
            moved = False
            if pts is not None and len(pts) >= 6:
                p1, st, _ = cv2.calcOpticalFlowPyrLK(G[i], G[j], pts, None, **lk)
                pb, st2, _ = cv2.calcOpticalFlowPyrLK(G[j], G[i], p1, None, **lk)
                ok = (st.ravel() == 1) & (st2.ravel() == 1) & (np.linalg.norm(pb - pts, axis=2).ravel() < 1.0)
                if ok.sum() >= 6:
                    A, B = pts[ok].reshape(-1, 2), p1[ok].reshape(-1, 2)
                    wgt = 1 / (20 + np.linalg.norm(A - cur, axis=1))
                    M, inl = cv2.estimateAffinePartial2D(A, B, method=cv2.RANSAC, ransacReprojThreshold=2.0)
                    if M is not None and inl.sum() >= 6:
                        cur = (M @ np.array([cur[0], cur[1], 1.0])).astype(np.float32); moved = True
                    else:
                        mv = B - A; med = np.median(mv, 0); keep = np.linalg.norm(mv - med, axis=1) < 4
                        if keep.sum(): cur = cur + (mv[keep] * wgt[keep, None]).sum(0) / wgt[keep].sum(); moved = True
                    pts = p1[ok].reshape(-1, 1, 2)
            if not moved: pts = None
            F[j] = cur.astype(float).copy(); i = j
    return F

def fuse(F, Bm, idx, skip=None):
    ks = [i for i in sorted(Bm) if i != skip]
    if not ks: return {i: F[i] for i in idx}
    R = np.array([Bm[i] - F[i] for i in ks])
    # 이상치 제거: 이웃 잔차 중앙값에서 8px 넘게 벗어난 측정은 버림
    good = []
    for n, i in enumerate(ks):
        nb = R[max(0, n - 3):n + 4]
        if np.linalg.norm(R[n] - np.median(nb, 0)) < 8: good.append(n)
    ks = [ks[n] for n in good]; R = R[good]
    if not ks: return {i: F[i] for i in idx}
    rx = np.interp(idx, ks, R[:, 0]); ry = np.interp(idx, ks, R[:, 1])
    if skip is None:  # 잔차만 살짝 평활(측정 잡음 줄이기)
        k = np.array([1, 2, 3, 2, 1], float); k /= k.sum()
        rx = np.convolve(np.pad(rx, 2, mode="edge"), k, "valid"); ry = np.convolve(np.pad(ry, 2, mode="edge"), k, "valid")
    return {i: F[i] + np.array([x, y]) for i, x, y in zip(idx, rx, ry)}

out, loo4, loo3, hit = {}, [], [], []
for k, (a, b) in enumerate(CALL):
    if str(k) not in T3: continue
    i0, n = fi(a), fi(b) - fi(a) + 1
    Rf, Sf = seg(REF, i0, n), seg(SRC, i0, n); n = min(len(Rf), len(Sf))
    G = [cv2.cvtColor(Sf[i], cv2.COLOR_RGB2GRAY) for i in range(n)]
    p3 = {int(round(t * FPS)): np.array([x, y]) for t, x, y in T3[str(k)]["kf"]}
    idx = [i for i in range(n) if i in p3]
    Bm = {}
    for i in idx:
        c = blob(Rf[i], Sf[i], p3[i])
        if c is not None: Bm[i] = c
    # 앵커: 가운데에 가장 가까운 측정 프레임(없으면 v3 위치)
    a0 = min(Bm, key=lambda i: abs(i - n / 2)) if Bm else idx[len(idx) // 2]
    F = flow_chain(G, a0, Bm.get(a0, p3[a0]))
    idx = [i for i in idx if i in F]
    P = fuse(F, Bm, idx)
    for i in list(Bm)[1:-1]:  # 하나 빼고 검증(양끝 제외)
        q = fuse(F, Bm, idx, skip=i)[i]; loo4.append(float(np.linalg.norm(q - Bm[i])))
        loo3.append(float(np.linalg.norm(p3[i] - Bm[i])))
    hit.append((len(Bm), len(idx)))
    out[str(k)] = {"up": T3[str(k)]["up"], "kf": [[round(i / FPS, 3), round(float(P[i][0]), 1), round(float(P[i][1]), 1)] for i in idx]}
    e4 = [np.linalg.norm(P[i] - Bm[i]) for i in Bm]; e3 = [np.linalg.norm(p3[i] - Bm[i]) for i in Bm]
    print(k, f"점 보임 {len(Bm)}/{len(idx)}", "v3 평균", round(float(np.mean(e3)), 1) if e3 else "-", "v4 평균", round(float(np.mean(e4)), 1) if e4 else "-", flush=True)
json.dump(out, open("track4.json", "w"))
st = lambda v: f"평균 {np.mean(v):.1f} 중앙 {np.median(v):.1f} 90% {np.percentile(v, 90):.1f} 최대 {np.max(v):.1f}"
print("하나 빼고 검증(px@1080) v4:", st(loo4), "/ 같은 프레임 v3:", st(loo3), "표본", len(loo4))
print("점 보인 프레임", sum(h[0] for h in hit), "/", sum(h[1] for h in hit))
