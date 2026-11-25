"""손끝 화살표 추적(2026-11-25 「왜 넌 손 닿는 부분」 「나세르처럼」 「화살표 버벅」).
딜러 손가락이 부위를 가리키는 컷은 화살표가 그 손끝을 따라가게 한다(나세르·포르쉐 카이로 릴스 방식).
1) 손바닥이 화면 밖이라 MediaPipe Hands가 못 잡음 → OWLv2(Apache-2.0) 「a human hand」 상자를 6프레임마다 찾고, 그 상자 안 피부색 영역의 맨 위 끝 = 손끝(손이 아래에서 들어와 위를 가리킴)
2) 튀는 값 버림(앞뒤 중간값에서 화면 폭 8% 넘게 벗어나면) → 8프레임 이하 빈칸 채움 → 가우시안(σ=3프레임) 평활
3) 손이 컷의 45% 이상 보이면 그 컷은 손끝 추적, 손이 들어오고 나갈 때는 원래 부위 추적과 8프레임에 걸쳐 섞음(순간 이동 없음)
4) 부위 추적(tracks.json)도 같은 방식으로 다시 평활
출력: hand_tracks.json — tracks.json과 같은 모양 {컷: {s0, s1, pts, by}}
사용: python3 hand_point_track.py <작업 폴더>   (src.mp4 · m235_input.json · tracks.json 필요)
"""
import os, sys, json, numpy as np, cv2
G = os.path.join(sys.argv[1], '')
HAND_MODEL = os.environ.get('HAND_MODEL', '/home/claude/bobaedream/scripts/shortform/models/hand_landmarker.task')
FPS = 30
def frames(s0, s1):
    cap = cv2.VideoCapture(G + 'src.mp4'); cap.set(cv2.CAP_PROP_POS_MSEC, s0 * 1000); fr = []
    for _ in range(int(round((s1 - s0) * FPS)) + 1):
        ok, f = cap.read()
        if not ok: break
        fr.append(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    return fr
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'photo_listing'))
def tips(fr, t0ms, step=6):
    import part_anchor as P
    from PIL import Image
    P.PROMPTS['hand'] = 'a human hand'
    n = len(fr); boxes = [None] * n
    for i in list(range(0, n, step)) + [n - 1]:
        r = P.detect(Image.fromarray(fr[i]), ['hand'], thr=0.22)['hand']
        if r:
            s_, b_ = max(r); H_, W_ = fr[i].shape[:2]
            if (b_[2] - b_[0]) * (b_[3] - b_[1]) < 0.45 * W_ * H_: boxes[i] = b_
    out = []
    for i in range(n):   # 앞뒤 검출 상자 사이만 보간(한쪽만 있으면 step 안에서 그대로)
        pv = next((j for j in range(i, -1, -1) if boxes[j] is not None), None); nx = next((j for j in range(i, n) if boxes[j] is not None), None)
        if pv is None and nx is None: out.append(None); continue
        if pv is None or nx is None:
            j = pv if pv is not None else nx
            if abs(j - i) > step: out.append(None); continue
            b = boxes[j]
        elif nx - pv > 2 * step: out.append(None); continue
        else:
            u = 0 if nx == pv else (i - pv) / (nx - pv); b = [p + (q - p) * u for p, q in zip(boxes[pv], boxes[nx])]
        f = fr[i]; H_, W_ = f.shape[:2]; x0, y0, x1, y1 = [int(v) for v in b]
        x0, y0 = max(0, x0 - 20), max(0, y0 - 40); x1, y1 = min(W_, x1 + 20), min(H_, y1)
        roi = cv2.cvtColor(np.ascontiguousarray(f[y0:y1, x0:x1]), cv2.COLOR_RGB2YCrCb)
        m = cv2.inRange(roi, (0, 135, 85), (255, 175, 130)); m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        nl, lab, st, _ = cv2.connectedComponentsWithStats(m)
        if nl <= 1: out.append(None); continue
        big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
        if st[big, cv2.CC_STAT_AREA] < 400: out.append(None); continue
        ys, xs = np.where(lab == big); top = ys.min(); sel = ys <= top + 12
        out.append(((x0 + xs[sel].mean()) / W_, (y0 + top + 6) / H_))
    return out
def clean(p, gap=8, sig=3.0):
    n = len(p); a = np.array([q if q is not None else (np.nan, np.nan) for q in p], float)
    for i in range(n):   # 튀는 값 버림
        if np.isnan(a[i, 0]): continue
        w = a[max(0, i - 3):i + 4]; w = w[~np.isnan(w[:, 0])]
        if len(w) >= 3 and np.abs(a[i] - np.median(w, 0)).max() > 0.08: a[i] = np.nan
    ok = ~np.isnan(a[:, 0]); idx = np.where(ok)[0]
    if not len(idx): return None, ok
    for k in range(2):   # 짧은 빈칸만 직선으로 채움
        a[:, k] = np.interp(np.arange(n), idx, a[idx, k])
    run = 0
    for i in range(n):
        if not ok[i]:
            j = i
            while j < n and not ok[j]: j += 1
            if (j - i) <= gap and i > 0 and j < n: ok[i:j] = True
    r = int(3 * sig); kx = np.exp(-0.5 * (np.arange(-r, r + 1) / sig) ** 2); kx /= kx.sum()
    pad = np.pad(a, ((r, r), (0, 0)), mode='edge'); s = np.stack([np.convolve(pad[:, k], kx, 'valid') for k in range(2)], 1)
    return s, ok
CUTS = json.load(open(G + 'm235_input.json'))['cuts']; TR = json.load(open(G + 'tracks.json')) if os.path.exists(G + 'tracks.json') else {}
out = {}
for c in CUTS:
    k = c['key']; s0, s1 = c['src']
    if k == 'c1' or k == CUTS[-1]['key']: continue
    fr = frames(s0, s1); tp = tips(fr, s0 * 1000); n = len(tp)
    hand, hok = clean(tp)
    part = None
    if k in TR:
        pp = TR[k]['pts']; ts0 = TR[k]['s0']
        seq = [pp[min(len(pp) - 1, max(0, int(round((s0 + i / FPS - ts0) * FPS))))] for i in range(n)]
        part, pok = clean(seq, gap=12, sig=3.0)
    cov = hok.mean() if hand is not None else 0
    if hand is not None and cov >= 0.45:
        w = np.convolve(hok.astype(float), np.ones(9) / 9, 'same')   # 손 있음/없음 경계 8프레임 섞기
        if part is not None: pts = hand * w[:, None] + part * (1 - w[:, None]); by = 'hand+part'
        else:
            pts = hand.copy(); by = 'hand'
        valid = (w > 0.5) | (part is not None)
        for i in range(1, len(pts)):   # 프레임당 이동 상한(화면 폭 1.2%) — 손끝 점이 튀어 화살표가 떨리던 것
            dl = pts[i] - pts[i - 1]; m_ = np.abs(dl).max()
            if m_ > 0.012: pts[i] = pts[i - 1] + dl * 0.012 / m_
        pts, _ = clean([tuple(q) for q in pts], gap=0, sig=4.0)   # σ4 추가 평활(합쳐서 약 σ5)
    elif part is not None: pts, valid, by = part, pok, 'part'
    else:
        print(k, '손끝 없음 · 부위 추적 없음'); continue
    out[k] = {'s0': s0, 's1': s1, 'by': by, 'hand_cover': round(float(cov), 2),
              'pts': [[round(float(x), 4), round(float(y), 4)] if v else None for (x, y), v in zip(pts, valid)]}
    print(k, by, '손 보인 비율', round(float(cov), 2), '프레임', n)
json.dump(out, open(G + 'hand_tracks.json', 'w'))
