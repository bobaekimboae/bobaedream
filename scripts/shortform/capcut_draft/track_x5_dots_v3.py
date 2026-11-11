"""콜아웃 점 추적 v3(고도화): 점 주변 특징점으로 닮음 변환(이동·확대·회전)을 RANSAC으로 구해 점을 옮긴다(카메라가 밀고 들어갈 때도 점이 부품에 붙음).
레퍼런스 점이 보이면 거의 그 자리로 맞추고(0.85), 예측-레퍼런스 차이를 기록해 정확도를 잰다.
(이전 설명) 콜아웃 점 추적 v2: 레퍼런스 가운데 프레임에서 점 위치를 찾고(라벨 아래·위 점선의 끝),
원본 영상에서 그 점을 매 프레임(25fps) 광학 흐름으로 앞뒤 추적한다. 출력 track2.json + 검사용 그림."""
import json, subprocess
import numpy as np, cv2
REF, SRC = "ref_mg.mp4", "src.mp4"
W, H, FPS = 540, 960, 25
CALL = [(9.8, 11.4), (11.6, 13.2), (14.0, 15.8), (20.4, 21.8), (22.4, 24.1), (24.2, 25.4), (26.8, 27.8),
        (28.0, 29.6), (29.8, 31.6), (33.2, 35.0), (36.6, 37.8), (38.0, 39.2), (40.6, 42.6), (44.0, 46.0),
        (46.2, 48.0), (48.8, 51.0), (52.6, 54.8), (55.2, 57.2), (57.2, 58.8)]
FORCE = {1: True, 15: True}
MANUAL = {1: (12.16, 240, 1530), 15: (49.6, 715, 1062), 17: (56.2, 903, 945)}  # 점이 크롬 위라 자동으로 못 찾음: 레퍼런스 화면에서 직접 잰 위치(1080 좌표)  # 화면 확인으로 정한 라벨 방향(위=True)
fi = lambda t: int(round(t * FPS))

def frames(p):
    pr = subprocess.Popen(["ffmpeg", "-v", "error", "-i", p, "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    n = W * H * 3
    while True:
        b = pr.stdout.read(n)
        if len(b) < n: break
        yield np.frombuffer(b, np.uint8).reshape(H, W, 3)

win = {}
for k, (a, b) in enumerate(CALL):
    for i in range(fi(a), fi(b) + 1): win.setdefault(i, []).append(k)
probe = {k: [fi(a + (b - a) * f) for f in (0.3, 0.4, 0.5, 0.6, 0.7, 0.8)] for k, (a, b) in enumerate(CALL)}
probe_set = {i: k for k, v in probe.items() for i in v}
src = {k: {} for k in range(len(CALL))}
cand = {k: [] for k in range(len(CALL))}
fallback = {}
blobs = {}
refimg = {}
for i, (r, s) in enumerate(zip(frames(REF), frames(SRC))):
    if i not in win: continue
    g = cv2.cvtColor(s, cv2.COLOR_RGB2GRAY)
    for k in win[i]: src[k][i] = g
    wm = ((r.min(2) > 185) & (np.abs(r.astype(int) - s.astype(int)).max(2) > 25)).astype(np.uint8)
    nb, _, sb, cb = cv2.connectedComponentsWithStats(wm)
    blobs[i] = [cb[q] for q in range(1, nb) if 5 <= sb[q][2] <= 24 and 5 <= sb[q][3] <= 24 and 0.6 < sb[q][2] / sb[q][3] < 1.6 and sb[q][4] > 0.55 * sb[q][2] * sb[q][3]]
    if i in probe_set:
        k = probe_set[i]
        d = (np.abs(r.astype(int) - s.astype(int)).max(2) > 45).astype(np.uint8)
        d = cv2.morphologyEx(d, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
        n, lab, st, cen = cv2.connectedComponentsWithStats(cv2.morphologyEx(d, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8)))
        big = [j for j in range(1, n) if st[j][2] >= 60 and 25 <= st[j][3]]
        if not big: continue
        j = max(big, key=lambda j: st[j][2] * st[j][3]); x0, y0, bw, bh = st[j][:4]
        # 라벨 = 넓은 행, 점선 = 좁은 기둥. 각 행의 폭으로 라벨 줄과 점선 줄을 가른다
        rows = (lab[y0:y0 + bh, x0:x0 + bw] == j)
        widths = rows.sum(1)
        wide = np.where(widths > 0.5 * widths.max())[0]
        lab_mid = (wide.min() + wide.max()) / 2
        ys = np.where(widths > 0)[0]
        # 양 끝(위·아래)에서 '흰 둥근 점'을 찾는다: 레퍼런스에서 거의 흰색 + 원본과 차이 큼
        whiteish = ((r.min(2) > 185) & (np.abs(r.astype(int) - s.astype(int)).max(2) > 25)).astype(np.uint8)
        best = None
        for up_try, ey in [e for e in ((True, ys.max()), (False, ys.min())) if FORCE.get(k) in (None, e[0])]:
            band = rows[max(0, ey - 14):ey + 15]
            xs = np.where(band.any(0))[0]
            if not len(xs): continue
            cx0, cy0 = int(x0 + xs.mean()), int(y0 + ey)
            x1, x2, y1, y2 = max(0, cx0 - 55), min(W, cx0 + 55), max(0, cy0 - 55), min(H, cy0 + 55)
            sub = whiteish[y1:y2, x1:x2]
            nn, ll, ss, cc = cv2.connectedComponentsWithStats(sub)
            for q in range(1, nn):
                bw2, bh2, ar = ss[q][2], ss[q][3], ss[q][4]
                if 5 <= bw2 <= 24 and 5 <= bh2 <= 24 and 0.6 < bw2 / bh2 < 1.6 and ar > 0.55 * bw2 * bh2:
                    width_end = widths[ey - 9:ey + 1].max() if up_try else widths[ey:ey + 10].max()
                    score = ar - 0.5 * width_end
                    if best is None or score > best[0]:
                        best = (score, x1 + cc[q][0], y1 + cc[q][1], up_try)
        if best is None:
            # 점이 밝은 바탕 위라 안 보이면: 점선 기둥 끝(방향은 FORCE)
            up_f = FORCE.get(k, True); ey = ys.max() if up_f else ys.min()
            band = rows[max(0, ey - 14):ey + 15]; xs = np.where(band.any(0))[0]
            if len(xs): fallback.setdefault(k, []).append((i, float(x0 + xs.mean()), float(y0 + ey + (-10 if up_f else 10)), up_f))
            continue
        _, dx, dy, up = best
        cand[k].append((i, float(dx), float(dy), bool(up)))
        refimg[(k, i)] = r

lk = dict(winSize=(31, 31), maxLevel=4, criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01))
def feats(g, c):
    m = np.zeros_like(g); cv2.circle(m, (int(c[0]), int(c[1])), 80, 255, -1); cv2.circle(m, (int(c[0]), int(c[1])), 9, 0, -1)  # 점 자체(합성된 흰 점이 아님, 원본) 주변 고리
    return cv2.goodFeaturesToTrack(g, 120, 0.004, 3, mask=m)

out, dbg = {}, []
ERR = {}
snaps = {}
for k, (a, b) in enumerate(CALL):
    fr = src[k]
    if not cand[k] and fallback.get(k): cand[k] = fallback[k]; print(k, "fallback anchor")
    if not cand[k]: print(k, "no anchor"); continue
    if k in MANUAL:
        mt, mx, my = MANUAL[k]; cand[k] = [(fi(mt), mx / 2, my / 2, FORCE.get(k, True))]
    ups = [c[3] for c in cand[k]]; up = sum(ups) * 2 >= len(ups)
    cs = [c for c in cand[k] if c[3] == up]
    # 서로 가장 많이 맞는 후보(추적 전 원시 위치 기준 이웃 수)를 앵커로
    ai, ax, ay, _ = max(cs, key=lambda c: (sum(abs(c[1] - d[1]) + abs(c[2] - d[2]) < 40 for d in cs), -abs(c[0] - fi((a + b) / 2))))
    print(k, "votes", ups)
    pos = {ai: np.array([ax, ay], np.float32)}
    for direction in (1, -1):
        cur = pos[ai].copy(); i = ai; pts = feats(fr[i], cur)
        while (i + direction) in fr:
            j = i + direction
            if pts is None or len(pts) < 8: pts = feats(fr[i], cur)
            if pts is not None and len(pts):
                p1, st, _ = cv2.calcOpticalFlowPyrLK(fr[i], fr[j], pts, None, **lk)
                pb, st2, _ = cv2.calcOpticalFlowPyrLK(fr[j], fr[i], p1, None, **lk)
                ok = (st.ravel() == 1) & (st2.ravel() == 1) & (np.linalg.norm(pb - pts, axis=2).ravel() < 0.8)
                M = None
                if ok.sum() >= 6:
                    M, inl = cv2.estimateAffinePartial2D(pts[ok].reshape(-1, 2), p1[ok].reshape(-1, 2), method=cv2.RANSAC, ransacReprojThreshold=1.5)
                    if M is not None and inl is not None and inl.sum() >= 6:
                        cur = (M @ np.array([cur[0], cur[1], 1.0])).astype(np.float32); pts = p1[ok].reshape(-1, 1, 2)
                    else:
                        M = None
                if M is None and ok.sum() >= 4:
                    mv = (p1 - pts)[ok].reshape(-1, 2)
                    # 점 가까운 특징에 무게(원근 차이 줄이기)
                    dist = np.linalg.norm(pts[ok].reshape(-1, 2) - cur, axis=1)
                    wgt = 1 / (8 + dist); med = np.median(mv, 0)
                    keep = np.linalg.norm(mv - med, axis=1) < 3
                    v = (mv[keep] * wgt[keep, None]).sum(0) / wgt[keep].sum() if keep.sum() else med
                    cur = cur + v; pts = p1[ok].reshape(-1, 1, 2)
                elif M is None:
                    pts = None
            # 레퍼런스의 점(흰 둥근 덩어리)이 예측 자리 가까이 있으면 그 자리로 맞춤(레퍼런스와 같은 트래킹)
            near = [c for c in blobs.get(j, []) if np.linalg.norm(c - cur) < 18]
            if near:
                c = min(near, key=lambda c: np.linalg.norm(c - cur)); ERR.setdefault(k, []).append(float(np.linalg.norm(c - cur)) * 2)
                cur = 0.15 * cur + 0.85 * c.astype(np.float32); snaps[k] = snaps.get(k, 0) + 1
            pos[j] = cur.copy(); i = j
    ts = sorted(pos); xy = np.array([pos[t] for t in ts]) * 2
    ker = np.array([1, 2, 3, 2, 1], float); ker /= ker.sum()
    pad = np.pad(xy, ((2, 2), (0, 0)), mode="edge")
    sm = np.stack([np.convolve(pad[:, c], ker, "valid") for c in (0, 1)], 1)
    out[k] = {"up": up, "kf": [[round((t - fi(a)) / FPS, 3), round(float(x), 1), round(float(y), 1)] for t, (x, y) in zip(ts, sm)]}
    # 검사: 다른 앵커 후보와의 차이(추적이 맞으면 작다)
    errs = []
    for (ci, cx, cy, _) in cand[k]:
        if ci in pos: errs.append(float(np.linalg.norm(pos[ci] - [cx, cy])) * 2)
    print(k, "snaps", snaps.get(k, 0), "/", len(pos), end=" ")
    print(k, "up" if up else "down", "anchor", ai - fi(a), "err vs ref dot(px@1080)", [round(e) for e in errs])
    dbg.append((k, ai, ax, ay, up))
json.dump(out, open("track3.json", "w"))
allv = [e for v in ERR.values() for e in v]
print("예측-레퍼런스 점 차이(px@1080): 평균", round(float(np.mean(allv)), 1), "중앙", round(float(np.median(allv)), 1), "90%", round(float(np.percentile(allv, 90)), 1), "표본", len(allv))
# 검사 그림: 앵커 프레임에 찾은 점
tiles = []
for k, ai, ax, ay, up in [d for d in dbg if (d[0], d[1]) in refimg]:
    im = refimg[(k, ai)].copy(); cv2.circle(im, (int(ax), int(ay)), 14, (255, 0, 0), 3)
    tiles.append(cv2.resize(im, (180, 320)))
rows = [np.hstack(tiles[i:i + 10] + [np.zeros_like(tiles[0])] * (10 - len(tiles[i:i + 10]))) for i in range(0, len(tiles), 10)]
cv2.imwrite("anchors3.jpg", cv2.cvtColor(np.vstack(rows), cv2.COLOR_RGB2BGR))
# 최종(평활 후) 위치 vs 레퍼런스 점(40px 안) — 모든 프레임
ev, cov, tot = [], 0, 0
for k, (a, b) in enumerate(CALL):
    if k not in out: continue
    for t, x, y in out[k]["kf"]:
        i = fi(a) + int(round(t * FPS)); tot += 1
        bs = [c * 2 for c in blobs.get(i, []) if np.linalg.norm(c * 2 - [x, y]) < 40]
        if bs: cov += 1; ev.append(min(float(np.linalg.norm(c - [x, y])) for c in bs))
print('track3.py', "최종 평균", round(float(np.mean(ev)), 1), "90%", round(float(np.percentile(ev, 90)), 1), "덮음", cov, "/", tot)
