"""부위 매핑(추적) v3 — 2026-11-23 「매핑이 살짝씩 어긋나는 이유」 「타이어도 노출 좌표를 특정」.

v2(광학 흐름 하나만)가 어긋난 이유를 실측(driftcheck: 기준 사진 조각을 매 프레임 다시 찾아 비교)으로 확인:
  ① 누적 오차: 매 프레임 이동량을 더해 가므로 기준 시각에서 멀어질수록 벌어짐(c10 1.4초 전 102px, c13 1초 전 168px, 1080 기준)
  ② 평활 치우침: 가우시안(시그마 4)이 기준 프레임 자리까지 옮겨 기준 시각에서도 6~13px 어긋남
  ③ 이동만 따라감: 카메라가 다가가면(확대) 부위 주변 점들이 서로 다르게 움직여 가운데 값이 밀림
  ④ 광택 차체 반사·배경 점이 섞이면 가운데 값이 반사 쪽으로 끌림
v3 해결:
  - 좌표 특정(키프레임): 부위마다 시각별 좌표를 여러 개 적는다(사람이 격자 사진을 보고 지정). 이 시각에서는 정확히 그 자리.
  - 키프레임 사이: 앞 키프레임에서 앞으로, 뒤 키프레임에서 뒤로 각각 따라간 뒤 시간 비율로 섞음(양쪽 끝이 다 맞으니 누적 오차가 가운데서 사라짐)
  - 조각 다시 찾기: 가장 가까운 키프레임의 부위 조각을 크기 0.8~1.25배로 바꿔 가며 매 프레임 근처에서 다시 찾고, 잘 맞으면(유사도 0.8 이상) 그 자리로 붙임
  - 평활은 키프레임 고정 후 보정값에만 약하게(시그마 2)
입력: G/anchors3.json {키: {"r": 반경비율, "kf": [[시각, x비율, y비율], ...]}}   출력: G/tracks.json (기존 형식, 잃은 프레임 None)
"""
import cv2, json, os, numpy as np
G = os.environ.get('ROMA_DIR', '/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/roma/')
SW, SH, FPS = 540, 960, 30
LK = dict(winSize=(31, 31), maxLevel=4, criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01))


def feats(g, x, y, r):
    m = np.zeros_like(g); cv2.circle(m, (int(x), int(y)), int(r), 255, -1)
    p = cv2.goodFeaturesToTrack(g, maxCorners=60, qualityLevel=0.01, minDistance=5, mask=m)
    return p.reshape(-1, 2) if p is not None else np.zeros((0, 2), np.float32)


def lk_run(fr, i0, x, y, r, order):
    """i0에서 (x,y)로 시작해 order 순서로 따라감. 잃으면 None."""
    out = {i0: (x, y)}; cx, cy = x, y; pts = feats(fr[i0], cx, cy, r); prev = i0; lost = False
    for j in order:
        if lost: out[j] = None; continue
        if len(pts) < 8: pts = feats(fr[prev], cx, cy, r)
        if len(pts) < 4: out[j] = None; lost = True; continue
        p0 = pts.astype(np.float32).reshape(-1, 1, 2)
        p1, s1, _ = cv2.calcOpticalFlowPyrLK(fr[prev], fr[j], p0, None, **LK)
        pb, s2, _ = cv2.calcOpticalFlowPyrLK(fr[j], fr[prev], p1, None, **LK)
        fb = np.linalg.norm((p0 - pb).reshape(-1, 2), axis=1)
        good = (s1.ravel() == 1) & (s2.ravel() == 1) & (fb < 1.0)
        if good.sum() < 4: out[j] = None; lost = True; continue
        d = (p1 - p0).reshape(-1, 2)[good]; dx, dy = np.median(d, axis=0)
        keep = np.linalg.norm(d - (dx, dy), axis=1) < 3.0
        cx, cy = cx + dx, cy + dy; pts = p1.reshape(-1, 2)[good][keep]
        out[j] = (cx, cy) if (4 < cx < SW - 4 and 4 < cy < SH - 4) else None
        prev = j
    return out


def snap(fr, j, px, py, tpl, win=50):
    """키프레임 조각을 여러 크기로 j 프레임 (px,py) 근처에서 다시 찾음 → (x,y,유사도)"""
    best = (None, None, -1)
    for s in (0.8, 0.9, 1.0, 1.1, 1.25):
        t = cv2.resize(tpl, None, fx=s, fy=s); th, tw = t.shape
        xa, ya = int(max(0, px - win - tw / 2)), int(max(0, py - win - th / 2))
        xb, yb = int(min(SW, px + win + tw / 2)), int(min(SH, py + win + th / 2))
        roi = fr[j][ya:yb, xa:xb]
        if roi.shape[0] <= th or roi.shape[1] <= tw: continue
        res = cv2.matchTemplate(roi, t, cv2.TM_CCOEFF_NORMED); _, mv, _, ml = cv2.minMaxLoc(res)
        if mv > best[2]: best = (xa + ml[0] + tw / 2, ya + ml[1] + th / 2, mv)
    return best


def gsm(v, sig=2.0):
    v = np.array(v, float); ok = ~np.isnan(v); out = v.copy()
    k = np.arange(-6, 7); w = np.exp(-k ** 2 / (2 * sig ** 2))
    for i in range(len(v)):
        if not ok[i]: continue
        idx = i + k; m = (idx >= 0) & (idx < len(v)); idx, ww = idx[m], w[m]; g = ok[idx]
        out[i] = np.sum(v[idx][g] * ww[g]) / np.sum(ww[g])
    return out


def track_key(cap, s0, s1, kfs, rr):
    cap.set(cv2.CAP_PROP_POS_MSEC, s0 * 1000); fr = []
    for _ in range(int(round((s1 - s0) * FPS)) + 1):
        ok, f = cap.read()
        if not ok: break
        fr.append(cv2.cvtColor(cv2.resize(f, (SW, SH)), cv2.COLOR_BGR2GRAY))
    n = len(fr); r = rr * SW
    K = sorted([(min(n - 1, max(0, int(round((t - s0) * FPS)))), fx * SW, fy * SH) for t, fx, fy in kfs])
    hs = max(12, int(r * 0.8))
    tpls = {i: fr[i][int(y - hs):int(y + hs), int(x - hs):int(x + hs)] for i, x, y in K}
    raw = [None] * n
    for i, x, y in K: raw[i] = (x, y)
    # 첫 키프레임 앞 / 마지막 뒤: 한쪽만
    i, x, y = K[0]; o = lk_run(fr, i, x, y, r, range(i - 1, -1, -1))
    for j in range(0, i): raw[j] = o.get(j)
    i, x, y = K[-1]; o = lk_run(fr, i, x, y, r, range(i + 1, n))
    for j in range(i + 1, n): raw[j] = o.get(j)
    # 키프레임 사이: 양방향 섞기
    for (ia, xa, ya), (ib, xb, yb) in zip(K, K[1:]):
        fa = lk_run(fr, ia, xa, ya, r, range(ia + 1, ib)); fb = lk_run(fr, ib, xb, yb, r, range(ib - 1, ia, -1))
        for j in range(ia + 1, ib):
            w = (j - ia) / (ib - ia); a, b = fa.get(j), fb.get(j)
            if a and b: raw[j] = (a[0] * (1 - w) + b[0] * w, a[1] * (1 - w) + b[1] * w)
            elif a or b:
                p = a or b; lin = (xa * (1 - w) + xb * w, ya * (1 - w) + yb * w)
                raw[j] = (p[0] * 0.6 + lin[0] * 0.4, p[1] * 0.6 + lin[1] * 0.4)
            else: raw[j] = (xa * (1 - w) + xb * w, ya * (1 - w) + yb * w)
    # 조각 다시 찾기(가장 가까운 키프레임 조각)
    snaps = 0
    kidx = [k[0] for k in K]
    for j in range(n):
        if raw[j] is None or j in kidx: continue
        ki = min(kidx, key=lambda q: abs(q - j)); t = tpls[ki]
        if t.size == 0 or t.shape[0] < 10 or t.shape[1] < 10: continue
        sx, sy, sv = snap(fr, j, raw[j][0], raw[j][1], t)
        if sv >= 0.8: raw[j] = (sx, sy); snaps += 1
    xs = gsm([p[0] if p else np.nan for p in raw]); ys = gsm([p[1] if p else np.nan for p in raw])
    for i, x, y in K: xs[i], ys[i] = x, y   # 키프레임은 고정
    pts = [None if (np.isnan(a) or not (4 < a < SW - 4 and 4 < b < SH - 4)) else (round(a / SW, 4), round(b / SH, 4)) for a, b in zip(xs, ys)]
    return pts, snaps, n


if __name__ == '__main__':
    A = json.load(open(G + 'anchors3.json'))
    cap = cv2.VideoCapture(G + 'src.mp4'); res = {}
    for k, a in A.items():
        kfs = a['kf']; s0 = a.get('s0', kfs[0][0] - 0.5); s1 = a.get('s1', kfs[-1][0] + 0.5)
        pts, sn, n = track_key(cap, s0, s1, kfs, a['r'])
        print(f'{k}: {n}프레임 · 키프레임 {len(kfs)} · 조각 다시 찾기 {sn} · 잃음 {sum(p is None for p in pts)}')
        res[k] = {'s0': s0, 's1': s1, 'pts': pts}
    json.dump(res, open(G + 'tracks.json', 'w'))
