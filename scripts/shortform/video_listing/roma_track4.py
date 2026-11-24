"""부위 매핑(추적) v4 — 2026-11-23 「아직도 매핑 불안정해 / 오픈소스 깔어」.

오픈소스 점 추적 모델 BootsTAPIR(구글 딥마인드 tapnet, Apache-2.0)로 바꿨다.
v3(OpenCV 광학 흐름)는 프레임마다 이동량을 더해 가서 멀어질수록 벌어졌다. BootsTAPIR는
영상 전체를 한 번에 보고 '이 점이 각 프레임 어디에 있는지'를 직접 찾으므로 누적 오차가 없고,
가려지면 '보이지 않음'을 알려 준다.

방법:
  - 부위마다 사람이 정한 키프레임 좌표(anchors3.json) 둘레에 점 9개(가운데 + 8방향)를 질의로 넣는다.
  - 모델이 각 점의 프레임별 위치·보임 여부를 준다. 점마다 '질의 시각의 부위 중심과의 차이'를 빼서 부위 중심 추정값을 만든다.
  - 프레임마다 가장 가까운 키프레임 두 개의 점들 중 보이는 것들의 가운데 값(중앙값)을 쓰고, 멀리 튄 값은 버린다.
  - 키프레임 차이(지정 좌표 − 모델 값)를 시간에 따라 부드럽게 이어 더한다(강제로 붙이면 툭 튐). 평활 시그마 2.
  - 계산은 256×256, 15fps(CPU), 결과는 30fps로 보간.
입력: G/anchors3.json   출력: G/tracks.json (기존 형식, 잃은 프레임 None)
"""
import cv2, json, os, sys, numpy as np, torch
G = os.environ.get('ROMA_DIR', '/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/roma/')
TAPNET = os.environ.get('TAPNET_DIR', G + '../oss/tapnet')
CKPT = os.environ.get('TAPIR_CKPT', G + '../oss/bootstapir_v2.pt')
sys.path.insert(0, TAPNET)
from tapnet.torch import tapir_model  # noqa: E402
import torch.nn.functional as F  # noqa: E402

S, FPS, STEP = 256, 30, 2
torch.set_grad_enabled(False)
torch.set_num_threads(2)
MODEL = tapir_model.TAPIR(pyramid_level=1)
MODEL.load_state_dict(torch.load(CKPT, map_location='cpu'))
MODEL.eval()


def load(cap, s0, s1):
    cap.set(cv2.CAP_PROP_POS_MSEC, s0 * 1000); fr = []
    for i in range(int(round((s1 - s0) * FPS)) + 1):
        ok, f = cap.read()
        if not ok: break
        if i % STEP == 0: fr.append(cv2.cvtColor(cv2.resize(f, (S, S), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB))
    return np.stack(fr)


def gsm(v, sig=1.0):
    v = np.array(v, float); ok = ~np.isnan(v); out = v.copy(); k = np.arange(-4, 5); w = np.exp(-k ** 2 / (2 * sig ** 2))
    for i in range(len(v)):
        if not ok[i]: continue
        idx = i + k; m = (idx >= 0) & (idx < len(v)); idx, ww = idx[m], w[m]; g = ok[idx]
        out[i] = np.sum(v[idx][g] * ww[g]) / np.sum(ww[g])
    return out


def track_key(cap, s0, s1, kfs, rr):
    fr = load(cap, s0, s1); n = len(fr)
    K = sorted([(min(n - 1, max(0, int(round((t - s0) * FPS / STEP)))), fx * S, fy * S) for t, fx, fy in kfs])
    rad = max(4.0, rr * S * 0.55)
    offs = [(0, 0)] + [(rad * np.cos(a), rad * np.sin(a)) for a in np.linspace(0, 2 * np.pi, 8, endpoint=False)]
    q, meta = [], []
    for ki, (i, x, y) in enumerate(K):
        for dx, dy in offs:
            qx, qy = np.clip(x + dx, 1, S - 2), np.clip(y + dy, 1, S - 2)
            q.append((i, qy, qx)); meta.append((ki, qx - x, qy - y))
    frames = torch.tensor(fr).float() / 255 * 2 - 1
    out = MODEL(frames[None], torch.tensor(q).float()[None])
    tr = out['tracks'][0].numpy()  # [N,T,2] x,y
    vis = ((1 - torch.sigmoid(out['occlusion'][0])) * (1 - torch.sigmoid(out['expected_dist'][0])) > 0.5).numpy()
    kidx = np.array([k[0] for k in K]); ests = [None] * n; nvis = 0
    for j in range(n):
        near = np.argsort(np.abs(kidx - j))[:2]
        c = [(tr[p, j, 0] - meta[p][1], tr[p, j, 1] - meta[p][2]) for p in range(len(q)) if meta[p][0] in near and vis[p, j]]
        if len(c) >= 3:
            c = np.array(c); med = np.median(c, 0); d = np.linalg.norm(c - med, axis=1)
            keep = c[d <= max(3.0, 2.5 * np.median(d) + 1e-6)]; ests[j] = np.median(keep, 0); nvis += 1
    xs = gsm([e[0] if e is not None else np.nan for e in ests], 2.0); ys = gsm([e[1] if e is not None else np.nan for e in ests], 2.0)
    # 키프레임에서 '지정 좌표 - 모델 값' 차이를 재고, 그 차이를 시간에 따라 부드럽게 이어 더한다(키프레임에 강제로 붙이면 그 칸에서 툭 튐)
    okk = [(i, x - xs[i], y - ys[i]) for i, x, y in K if not np.isnan(xs[i])]
    if okk:
        ci = np.array([o[0] for o in okk], float); cx = np.array([o[1] for o in okk]); cy = np.array([o[2] for o in okk])
        tt = np.arange(n); xs = xs + gsm(np.interp(tt, ci, cx), 3.0); ys = ys + gsm(np.interp(tt, ci, cy), 3.0)
    # 30fps로 보간(키프레임 사이 잃은 칸도 앞뒤 값이 있으면 이어 줌, 끝쪽 잃음은 None 유지)
    N = int(round((s1 - s0) * FPS)) + 1; t15 = np.arange(n) * STEP; okm = ~np.isnan(xs); pts = []
    for j in range(N):
        if not okm.any(): pts.append(None); continue
        if j < t15[okm][0] or j > t15[okm][-1]: pts.append(None); continue
        a, b = np.interp(j, t15[okm], xs[okm]), np.interp(j, t15[okm], ys[okm])
        pts.append((round(a / S, 4), round(b / S, 4)) if 1 < a < S - 1 and 1 < b < S - 1 else None)
    return pts, nvis, n


if __name__ == '__main__':
    A = json.load(open(G + 'anchors3.json'))
    if os.path.exists(G + 'tracks.json') and not os.path.exists(G + 'tracks_v3.json'):
        os.replace(G + 'tracks.json', G + 'tracks_v3.json')
    cap = cv2.VideoCapture(G + 'src.mp4'); res = {}
    for k, a in A.items():
        kfs = a['kf']; s0 = a.get('s0', kfs[0][0] - 0.5); s1 = a.get('s1', kfs[-1][0] + 0.5)
        pts, nv, n = track_key(cap, s0, s1, kfs, a['r'])
        print(f'{k}: {n}칸(15fps) · 보임 {nv} · 잃음(30fps) {sum(p is None for p in pts)}/{len(pts)}', flush=True)
        res[k] = {'s0': s0, 's1': s1, 'pts': pts}
    json.dump(res, open(G + 'tracks.json', 'w'))
