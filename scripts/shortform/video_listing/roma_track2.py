"""부위 매핑(추적) v2 — 2026-11-23 「매핑 불안정해」.
CSRT 상자 하나(270×480) 대신: 540×960에서 부위 둘레 점 여러 개를 광학 흐름(Lucas-Kanade)으로 따라가고,
앞→뒤·뒤→앞 오차가 큰 점은 버린 뒤 남은 점들의 '가운데 이동(중앙값)'만 쓴다. 점이 모자라면 그 자리에서 새로 뽑는다.
화면 밖으로 나가거나 남은 점이 4개 미만이면 그 프레임은 '잃음'(None) — 렌더러는 잃은 구간에서 화살표를 숨긴다.
마지막에 앞뒤 대칭 평활(가우시안)로 손떨림을 지운다. 결과: tracks.json (기존 형식 + 'ok' 배열)
"""
import cv2, json, os, numpy as np
G = os.environ.get('ROMA_DIR', '/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/roma/')
# 키: (구간 시작, 끝, 기준 시각, 기준 x비율, 기준 y비율, 반경 비율)
A = json.load(open(G + 'anchors.json')) if os.path.exists(G + 'anchors.json') else {}
SW, SH = 540, 960
LK = dict(winSize=(31, 31), maxLevel=4, criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01))


def feats(g, x, y, r):
    m = np.zeros_like(g); cv2.circle(m, (int(x), int(y)), int(r), 255, -1)
    p = cv2.goodFeaturesToTrack(g, maxCorners=60, qualityLevel=0.01, minDistance=5, mask=m)
    return p.reshape(-1, 2) if p is not None else np.zeros((0, 2), np.float32)


def run(frames, ii, x, y, r, order):
    out = {ii: (x, y)}; cx, cy = x, y
    pts = feats(frames[ii], cx, cy, r)
    prev = ii
    for j in order:
        a, b = frames[prev], frames[j]
        if len(pts) < 8: pts = feats(a, cx, cy, r)
        if len(pts) < 4: out[j] = None; prev = j; continue
        p0 = pts.astype(np.float32).reshape(-1, 1, 2)
        p1, s1, _ = cv2.calcOpticalFlowPyrLK(a, b, p0, None, **LK)
        pb, s2, _ = cv2.calcOpticalFlowPyrLK(b, a, p1, None, **LK)
        fb = np.linalg.norm((p0 - pb).reshape(-1, 2), axis=1)
        good = (s1.ravel() == 1) & (s2.ravel() == 1) & (fb < 1.0)
        if good.sum() < 4: out[j] = None; pts = np.zeros((0, 2)); prev = j; continue
        d = (p1 - p0).reshape(-1, 2)[good]
        dx, dy = np.median(d, axis=0)
        # 중앙값에서 크게 벗어난 점(다른 물체에 붙은 점)은 버림
        keep = np.linalg.norm(d - (dx, dy), axis=1) < 3.0
        cx, cy = cx + dx, cy + dy
        pts = p1.reshape(-1, 2)[good][keep]
        out[j] = (cx, cy) if (8 < cx < SW - 8 and 8 < cy < SH - 8) else None
        prev = j
    return out


def gsmooth(xs, sig=4.0):
    xs = np.array(xs, float); ok = ~np.isnan(xs)
    if ok.sum() < 2: return xs
    k = np.arange(-12, 13); w = np.exp(-k ** 2 / (2 * sig ** 2))
    out = np.full_like(xs, np.nan)
    for i in range(len(xs)):
        if not ok[i]: continue
        idx = i + k; m = (idx >= 0) & (idx < len(xs))
        idx, ww = idx[m], w[m]; v = ok[idx]
        out[i] = np.sum(xs[idx][v] * ww[v]) / np.sum(ww[v])
    return out


if __name__ == '__main__':
    cap = cv2.VideoCapture(G + 'src.mp4'); res = {}
    for k, (s0, s1, ti, fx, fy, rr) in A.items():
        cap.set(cv2.CAP_PROP_POS_MSEC, s0 * 1000); fr = []
        for i in range(int(round((s1 - s0) * 30)) + 1):
            ok, f = cap.read()
            if not ok: break
            fr.append(cv2.cvtColor(cv2.resize(f, (SW, SH)), cv2.COLOR_BGR2GRAY))
        ii = min(len(fr) - 1, int(round((ti - s0) * 30)))
        x, y, r = fx * SW, fy * SH, rr * SW
        o = {**run(fr, ii, x, y, r, range(ii + 1, len(fr))), **run(fr, ii, x, y, r, range(ii - 1, -1, -1))}
        raw = [o.get(j) for j in range(len(fr))]
        xs = gsmooth([p[0] if p else np.nan for p in raw]); ys = gsmooth([p[1] if p else np.nan for p in raw])
        pts = [None if np.isnan(a) else (round(a / SW, 4), round(b / SH, 4)) for a, b in zip(xs, ys)]
        good = [p for p in pts if p]
        steps = np.abs(np.diff(np.array(good) * [1080, 1920], axis=0)) if len(good) > 1 else np.zeros((1, 2))
        print(f'{k}: {len(fr)}프레임 잃음 {sum(p is None for p in pts)} · 최대 이동 {steps.max(0).round(1)}px/프레임')
        res[k] = {'s0': s0, 's1': s1, 'pts': pts}
    json.dump(res, open(G + 'tracks.json', 'w'))
