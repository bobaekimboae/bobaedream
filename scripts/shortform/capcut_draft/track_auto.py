"""차란차 매물 숏폼 자동 제작 — 콜아웃 점 추적(사양서의 앵커에서 시작, X5 v5 방식: 원본 해상도 LK 광학 흐름 닮음 변환 사슬, 평활 [1,2,1]).
앵커가 콜아웃 구간 가운데에 있으면 앞뒤 두 방향으로 추적한다.
사용: python track_auto.py <spec.json> <src.mp4> <out.json>"""
import json, sys, os
import numpy as np, cv2
SPEC, SRC, OUTF = sys.argv[1:4]
here = os.path.dirname(os.path.abspath(__file__))
g = {"__name__": "lib"}
exec(open(os.path.join(here, "track_x5_dots_v4.py"), encoding="utf-8").read().split("out, loo4")[0].replace('T3 = json.load(open("track3.json"))', ''), g)
seg, flow_chain, FPS = g["seg"], g["flow_chain"], g["FPS"]
SP = json.load(open(SPEC, encoding="utf-8"))
out = {}
for k, c in enumerate(SP["callouts"]):
    a, b = c["t0"], c["t1"]; i0 = int(round(a * FPS)); n = int(round(b * FPS)) - i0 + 1
    F_ = seg(SRC, i0, n); n = len(F_)
    G = [cv2.cvtColor(f, cv2.COLOR_RGB2GRAY) for f in F_]
    at, ax, ay = c["anchor"]; a0 = min(n - 1, max(0, int(round(at * FPS)) - i0))
    F = flow_chain(G, a0, (ax, ay))
    idx = sorted(F); P = np.array([F[i] for i in idx])
    if len(P) > 2:
        Q = P.copy(); Q[1:-1] = (P[:-2] + 2 * P[1:-1] + P[2:]) / 4; P = Q
    out[str(k)] = {"kf": [[round(i / FPS, 3), round(float(x), 1), round(float(y), 1)] for i, (x, y) in zip(idx, P)]}
    mv = np.linalg.norm(P[-1] - P[0]) if len(P) else 0
    print(k, c["label"], "프레임", len(P), "이동", round(float(mv), 1), flush=True)
json.dump(out, open(OUTF, "w"))
