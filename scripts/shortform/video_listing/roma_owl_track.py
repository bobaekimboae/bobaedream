"""부위 추적 v5 — 2026-11-24 r14 「칩 매핑 재발 방지」(매뉴얼 v4.1 §10 규칙 3).

부위 이름 칩은 화살표로 부위를 따라가야 하는데, r13은 사람이 키프레임을 찍어 둔 컷만 추적이 있어
나머지(패들·계기판·기어 셀렉터·테일램프)가 화살표 없는 위쪽 칩으로 조용히 바뀌었다.
이제 OWLv2(google/owlv2-base-patch16-ensemble, Apache-2.0)가 컷 원본을 0.2초마다 보고 부위 상자를 찾는다.
- 앞 상자와 가까운(중심 거리 화면 0.25 이내) 후보 중 점수 가장 높은 것, 점수 기준 아래면 잃음
- 잃은 칸은 0.6초 이내면 앞뒤를 이어 줌, 가우시안 평활 후 30fps로 보간
입력: 원본 영상, 컷 표(키·원본 시작·끝·찾을 말)   출력: tracks.json에 키를 더함(기존 키는 그대로)
"""
import json, os, sys, numpy as np, cv2
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'photo_listing'))
import part_anchor as PA
G = os.environ.get('ROMA_DIR', '/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/roma/')
PA.PROMPTS.update({
    'paddle': 'a carbon paddle shifter behind a steering wheel',
    'gauge2': 'a digital instrument cluster screen behind a steering wheel',
    'selector': 'gear selector buttons on a car center console',
    'taillight': 'a car tail light',
    'backrest2': 'a beige leather car seat backrest',
    'carpet': 'a red carpet floor mat in a car',
})
JOBS = {  # 키: (원본 시작, 끝, 부위, 점수 기준)
    'c7': (66.0, 70.5, 'paddle', 0.10),
    'c8': (72.5, 78.0, 'gauge2', 0.12),
    'c10b': (86.8, 88.8, 'selector', 0.10),
    'c12': (172.5, 179.0, 'taillight', 0.12),
    'c4s': (37.0, 42.3, 'backrest2', 0.12),   # r15: 시트 재질 글자 → 등받이(매뉴얼 §11)
    'c4c': (37.0, 42.3, 'carpet', 0.10),      # r15: 레드 카펫 → 바닥 카펫
}
STEP, FPS = 0.2, 30


def gsm(v, sig):
    v = np.array(v, float); ok = ~np.isnan(v); out = v.copy(); k = np.arange(-4, 5); w = np.exp(-k ** 2 / (2 * sig ** 2))
    for i in range(len(v)):
        if not ok[i]: continue
        idx = i + k; m = (idx >= 0) & (idx < len(v)); idx, ww = idx[m], w[m]; g = ok[idx]
        out[i] = np.sum(v[idx][g] * ww[g]) / np.sum(ww[g])
    return out


def run(cap, key, s0, s1, part, thr, sheet):
    ts = np.arange(s0, s1 + 1e-6, STEP); cs = []; prev = None
    for t in ts:
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); ok, f = cap.read()
        if not ok: cs.append(None); continue
        img = Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)); W, H = img.size
        cand = [(s, ((b[0] + b[2]) / 2 / W, (b[1] + b[3]) / 2 / H), b) for s, b in PA.detect(img, [part], thr=thr)[part]
                if (b[2] - b[0]) * (b[3] - b[1]) < 0.5 * W * H]
        if prev is not None: cand = [c for c in cand if np.hypot(c[1][0] - prev[0], c[1][1] - prev[1]) < 0.25] or []
        if cand:
            s, c, b = max(cand, key=lambda x: x[0]); prev = c; cs.append(c)
            if len(sheet) < 40 and abs((t - s0) % 1.0) < STEP / 2:
                d = f.copy(); cv2.rectangle(d, (int(b[0]), int(b[1])), (int(b[2]), int(b[3])), (0, 255, 255), 6)
                cv2.putText(d, f'{key} {t:.1f} {s:.2f}', (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 255), 4); sheet.append(cv2.resize(d, (270, 480)))
        else: cs.append(None)
    xs = [c[0] if c else np.nan for c in cs]; ys = [c[1] if c else np.nan for c in cs]
    # 0.6초 이하 구멍만 메움
    a = np.array(xs); ok = ~np.isnan(a); idx = np.where(ok)[0]
    for i in range(len(a)):
        if not ok[i] and idx.size and idx.min() < i < idx.max():
            lo, hi = idx[idx < i].max(), idx[idx > i].min()
            if (hi - lo) * STEP <= 0.6:
                r = (i - lo) / (hi - lo); xs[i] = xs[lo] + (xs[hi] - xs[lo]) * r; ys[i] = ys[lo] + (ys[hi] - ys[lo]) * r
    xs, ys = gsm(xs, 1.2), gsm(ys, 1.2)
    N = int(round((s1 - s0) * FPS)) + 1; tt = np.arange(N) / FPS; t5 = ts - s0; pts = []
    for t in tt:
        j = int(round(t / STEP)); j = min(len(xs) - 1, j)
        if np.isnan(xs[j]): pts.append(None); continue
        okm = ~np.isnan(xs); pts.append((round(float(np.interp(t, t5[okm], xs[okm])), 4), round(float(np.interp(t, t5[okm], ys[okm])), 4)))
    print(f'{key}: 찾음 {sum(c is not None for c in cs)}/{len(cs)} · 잃음(30fps) {sum(p is None for p in pts)}/{N}', flush=True)
    return {'s0': s0, 's1': s1, 'pts': pts, 'by': 'owlv2', 'part': part}


if __name__ == '__main__':
    T = json.load(open(G + 'tracks.json')); cap = cv2.VideoCapture(G + 'src.mp4'); sheet = []
    keys = sys.argv[1:] or list(JOBS)
    for k in keys:
        T[k] = run(cap, k, *JOBS[k], sheet)
    json.dump(T, open(G + 'tracks.json', 'w'))
    if sheet:
        rows = [np.hstack(sheet[i:i + 8] + [np.zeros_like(sheet[0])] * (8 - len(sheet[i:i + 8]))) for i in range(0, len(sheet), 8)]
        cv2.imwrite(G + 'r14_owl_sheet.jpg', np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 70])
