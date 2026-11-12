"""콜아웃 점 추적 v5: 레퍼런스 점에 맞추지 않는다(레퍼런스 점도 부품에서 떠 있는 구간이 있어 따라가면 같이 뜸 — 헤드업 디스플레이에서 확인).
레퍼런스 점은 '처음 자리'(앵커)로만 쓰고, 그 뒤로는 원본 해상도 광학 흐름(점 둘레 특징점의 닮음 변환)만으로 부품에 붙여 앞뒤로 추적한다.
앵커 = 콜아웃 초반(등장 애니메이션 뒤) 레퍼런스 점이 보이는 첫 프레임. 흐름이 모자란 프레임만 이전 이동을 이어 씀. 평활은 3프레임 가벼운 것만."""
import json, numpy as np, cv2, sys
g = {}; exec(open("track_x5_dots_v4.py").read().split("out, loo4")[0], g)
CALL, fi, T3 = g["CALL"], g["fi"], g["T3"]
OVR = {int(a): float(b) for a, b in (s.split("=") for s in sys.argv[1:])}  # 콜아웃=앵커초(필요할 때 직접 지정)
out, rep = {}, []
for k, (a, b) in enumerate(CALL):
    if str(k) not in T3: continue
    i0, n = fi(a), fi(b) - fi(a) + 1
    Rf, Sf = g["seg"]("ref_mg.mp4", i0, n), g["seg"]("src.mp4", i0, n); n = min(len(Rf), len(Sf))
    G = [cv2.cvtColor(Sf[i], cv2.COLOR_RGB2GRAY) for i in range(n)]
    p3 = {int(round(t * 25)): np.array([x, y]) for t, x, y in T3[str(k)]["kf"]}
    idx = [i for i in sorted(p3) if i < n]
    Bm = {i: c for i in idx if (c := g["blob"](Rf[i], Sf[i], p3[i])) is not None}
    if k in OVR: a0 = min(idx, key=lambda i: abs(i - OVR[k] * 25)); p0 = Bm.get(a0, p3[a0])
    elif Bm:
        # 등장 애니메이션(첫 6프레임) 뒤, 앞뒤 프레임과 3px 안으로 안정된 첫 측정
        st = [i for i in sorted(Bm) if i >= 6 and all(j in Bm and np.linalg.norm(Bm[j] - Bm[i]) < 3 + 2 * abs(j - i) for j in (i - 1, i + 1))]
        a0 = st[0] if st else sorted(Bm)[len(Bm) // 2]; p0 = Bm[a0]
    else: a0 = idx[len(idx) // 2]; p0 = p3[a0]
    F = g["flow_chain"](G, a0, p0)
    xy = np.array([F[i] for i in idx]); kk = np.array([1, 2, 1], float) / 4
    sm = np.stack([np.convolve(np.pad(xy[:, c], 1, mode="edge"), kk, "valid") for c in (0, 1)], 1)
    out[str(k)] = {"up": T3[str(k)]["up"], "anchor": a0, "kf": [[round(i / 25, 3), round(float(x), 1), round(float(y), 1)] for i, (x, y) in zip(idx, sm)]}
    d = [np.linalg.norm(F[i] - Bm[i]) for i in Bm]; d3 = [np.linalg.norm(p3[i] - F[i]) for i in idx]
    print(k, "앵커", a0, "v5-레퍼 평균/최대", round(float(np.mean(d)), 1) if d else "-", round(float(np.max(d)), 1) if d else "-", "v5-v3 최대", round(float(np.max(d3)), 1), flush=True)
json.dump(out, open("track5.json", "w"))
