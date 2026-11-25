#!/usr/bin/env python3
"""씽크 점수표 — 음성 ↔ 자막 ↔ 컷 ↔ 부위 ↔ 칩·화살표·효과음이 맞는지 완성 영상에서 다시 재서 100점 만점으로 매긴다. 2026-11-25.

렌더러가 쓴 값만 믿지 않는다(크로스체크):
  · 자막 노랑 전환 = 완성 영상 프레임에서 노랑 글자 위치를 직접 읽음
  · 낱말 시각 = 소리 파형에서 쉼 뒤 소리가 시작되는 곳과 대조(--voice)
  · 부위가 화면에 있는지 = 추적기와 다른 모델(OWLv2)로 다시 찾음(--vis, vis_check.py 결과)

사용: python3 sync_score.py <영상.mp4> --car car.json --words words5.json [--voice v5.raw] [--vis vis.json] [--log log8.json] [--eye eye.json] [--out score.json]
  영상 옆 <영상>.plan.json 필요. --eye = 자동 판정을 사람이 정지컷으로 뒤집은 컷 {"g7": {"visible": true, "why": "..."}}
출고 기준: 총점 90 이상 + 0점 항목 없음 + 자막 빈 곳 0. 하나라도 어긋나면 끝 코드 1.
"""
import argparse, json, re, subprocess, sys
import numpy as np

ap = argparse.ArgumentParser(); ap.add_argument('video'); ap.add_argument('--car', required=True); ap.add_argument('--words', required=True)
ap.add_argument('--voice', help='음성 16k f32 raw'); ap.add_argument('--vis'); ap.add_argument('--log'); ap.add_argument('--eye'); ap.add_argument('--out')
A = ap.parse_args()
P = json.load(open(A.video + '.plan.json', encoding='utf-8')); CAR = json.load(open(A.car, encoding='utf-8')); C = CAR['cuts']
W = json.load(open(A.words, encoding='utf-8')); FPS = 30
EYE = json.load(open(A.eye, encoding='utf-8')) if A.eye else {}
CUT_T = [0.0] + P['cuts']; TOTAL = P['total']; VOICE_END = W[-1][2]
lin = lambda v, good, bad: float(np.clip((bad - v) / (bad - good), 0, 1)) * 100   # good 이하 100점, bad 이상 0점
ROWS = []; DETAIL = {}


def row(name, weight, score, measured, rule, src):
    ROWS.append({'name': name, 'weight': weight, 'score': None if score is None else round(score, 1), 'measured': measured, 'rule': rule, 'source': src})


# ── 1. 자막 노랑 전환 ↔ 말소리 시작(완성 영상에서 직접) ──
cy = P['caption']['center_y_px']; y0, y1 = cy - 70, cy + 70
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', A.video, '-vf', f'crop=1080:{y1 - y0}:0:{y0},scale=540:{(y1 - y0) // 2}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, (y1 - y0) // 2, 540, 3)
yel = (fr[..., 0] > 200) & (fr[..., 1] > 190) & (fr[..., 2] < 110)
col = yel.sum(1)                                   # 프레임별 열 노랑 수
has = col.sum(1) > 25
trans = []                                         # 노랑 글자 자리가 바뀐 시각
for i in range(1, len(col)):
    a, b = col[i - 1] > 0, col[i] > 0
    if not b.any(): continue
    inter, uni = (a & b).sum(), (a | b).sum()
    if not a.any() or inter / max(1, uni) < 0.6: trans.append(i / FPS)
trans = np.array(trans)
err = []; miss = 0
for w, s, e in W:
    if not len(trans): miss += 1; continue
    d = trans - s; j = np.abs(d).argmin()
    if abs(d[j]) > 0.35: miss += 1
    else: err.append(float(d[j]))
err = np.array(err)
p90 = float(np.percentile(np.abs(err), 90)) if len(err) else 9; med = float(np.median(err)) if len(err) else 9
late = float(np.percentile(err, 95)) if len(err) else 9
s1 = lin(p90, 0.10, 0.25) * (1 - miss / len(W))
row('자막 노랑 전환 ↔ 낱말 시작', 20, s1, f'중앙 {med:+.3f}초 · 90% {p90:.3f}초 · 가장 늦음(95%) {late:+.3f}초 · 못 맞춘 낱말 {miss}/{len(W)}', '90%가 0.10초 안(0.25초면 0점)', '완성 영상 노랑 픽셀')
DETAIL['caption_err'] = [round(x, 3) for x in err.tolist()]

SENT0 = {}
# ── 2. 낱말 시각 교차 확인(소리 파형: 쉼 뒤 문장 첫 낱말의 실제 소리 시작) ──
if A.voice:
    au = np.fromfile(A.voice, dtype=np.float32); env = np.array([np.sqrt(float((au[i:i + 320] ** 2).mean()) + 1e-12) for i in range(0, len(au) - 320, 80)])
    db = 20 * np.log10(env + 1e-9); pk = db.max(); d = []
    for c in C:
        t = W[c['start_word']][1]; best = None
        for i in range(int(max(0, t - 0.45) * 200) + 12, min(len(db), int((t + 0.45) * 200))):
            if db[i] > pk - 30 and (db[i - 12:i - 1] < pk - 38).mean() > 0.6 and (best is None or abs(i / 200 - t) < abs(best - t)): best = i / 200
        if best is not None: d.append(t - best); SENT0[c['key']] = best
    d = np.array(d); p9 = float(np.percentile(np.abs(d), 90))
    SENT = {}
    row('낱말 시각 교차 확인(문장 첫 낱말 ↔ 소리 파형)', 10, lin(p9, 0.08, 0.25), f'받아쓰기 − 파형: 중앙 {np.median(d):+.3f}초 · 90% {p9:.3f}초 · 최대 {np.abs(d).max():.3f}초 ({len(d)}문장)', '90%가 0.08초 안', '음성 파형(받아쓰기와 다른 방법)')
    DETAIL['wave_diff'] = [round(float(x), 3) for x in d]
else:
    row('낱말 시각 교차 확인(문장 첫 낱말 ↔ 소리 파형)', 10, None, '음성 파형 없음(--voice)', '90%가 0.08초 안', '—')

# ── 3. 컷 전환 ↔ 문장 시작 ──
lead = np.array([SENT0.get(c['key'], W[c['start_word']][1]) - CUT_T[i] for i, c in enumerate(C)][1:])   # 문장 시작 = 파형에서 확인한 값 우선
okc = ((lead >= 0.03) & (lead <= 0.20)).mean()
row('컷 전환 ↔ 문장 시작', 10, okc * 100, f'컷이 문장보다 {lead.min():.2f}~{lead.max():.2f}초 앞(중앙 {np.median(lead):.2f}) · 기준 안 {okc * 100:.0f}%', '문장 0.03~0.20초 전에 컷(목표 0.10)', '계획 파일 컷 시각')
DETAIL['cut_lead'] = [round(float(x), 2) for x in lead]

# ── 4. 장면 재생 배속 ──
rate = []
for i, c in enumerate(C):
    dur = (CUT_T[i + 1] if i + 1 < len(CUT_T) else VOICE_END) - CUT_T[i]; rate.append((c['src'][1] - c['src'][0]) / dur)
rate = np.array(rate); okr = ((rate >= 0.85) & (rate <= 1.2)).mean()
row('장면 재생 배속', 10, okr * 100, f'{rate.min():.2f}~{rate.max():.2f}배 · 기준 안 {okr * 100:.0f}% · 밖 = {[C[i]["key"] for i in range(len(C)) if not 0.85 <= rate[i] <= 1.2]}', '0.85~1.20배(느린 화면·빨리 감기 없음)', '입력 구간 ÷ 말 길이')
DETAIL['rate'] = {C[i]['key']: round(float(rate[i]), 2) for i in range(len(C))}

# ── 5. 말하는 부위가 화면에 있는가(다른 모델로 다시 찾기) ──
VIS = json.load(open(A.vis, encoding='utf-8')) if A.vis else {}
THR = 0.12; pv = []; pvd = {}
for c in C:
    k = c['key']
    if 'chip' not in c or k == C[0]['key']: continue
    if k in EYE and 'visible' in EYE[k]: v = 1.0 if EYE[k]['visible'] else 0.0; how = 'eye'
    elif k in VIS:
        sc = {n: s for n, st, s, b in VIS[k]}; v = (0.25 * (sc['start'] >= THR) + 0.5 * (sc['word'] >= THR) + 0.25 * (sc['end'] >= THR)); how = 'auto'
    else: continue
    pv.append(v); pvd[k] = [how, round(v, 2)]
row('말하는 부위 = 화면 부위', 20, (np.mean(pv) * 100) if pv else None, f'{len(pv)}컷 평균 {np.mean(pv) * 100:.0f}% · 낮은 컷 = {[k for k, x in pvd.items() if x[1] < 1]}' if pv else '검사 없음', '문장 시작·칩 낱말·문장 끝 3시점에 부위가 보임(칩 낱말 배점 절반)', 'OWLv2 재검출 + 눈 확인(eye)')
DETAIL['part_visible'] = pvd

# ── 6. 칩·큰 숫자 등장 ↔ 낱말 ──
ck = {c['key']: c for c in C}; d = []
for ch in P['chips']:
    c = ck.get(ch['key'])
    if ch['kind'] == 'title' or not c or 'chip_word' not in c: continue
    d.append(ch['t0'] - W[c['chip_word']][1])
for b in P.get('bigs', []):
    c = ck.get(b['key'])
    if c and c.get('bigs'): d.append(b['t_box'] - 0.2 - W[c['bigs'][0][2]][1])
d = np.array(d); okd = ((d >= -0.35) & (d <= 0.15)).mean() if len(d) else 0
row('칩·큰 숫자 등장 ↔ 그 낱말', 10, okd * 100, f'낱말보다 {d.min():+.2f}~{d.max():+.2f}초(중앙 {np.median(d):+.2f}) · 기준 안 {okd * 100:.0f}%', '낱말 0.35초 전 ~ 0.15초 후', '계획 파일 칩 시각')

# ── 7. 효과음 ↔ 화면 사건 ──
ev = [ch['t0'] for ch in P['chips']] + CUT_T; span = []
for b in P.get('bigs', []):
    c = ck.get(b['key'])
    if c and c.get('bigs'):
        j = c['bigs'][0][2]; ev.append(W[j][1] - 0.22); span.append((W[j][1] - 0.3, W[j][2]))   # 큰 숫자: 낱말 0.22초 전에 튀어나옴 · 비유음(말 울음 등)은 그 낱말을 말하는 동안
sd = np.array([0.0 if any(a <= s['t'] <= b for a, b in span) else min(abs(s['t'] - e) for e in ev) for s in P['sfx']]) if P['sfx'] else np.array([0])
row('효과음 ↔ 화면 사건', 5, (sd <= 0.25).mean() * 100, f'가장 가까운 사건과 {sd.max():.2f}초 이내 · 기준 안 {(sd <= 0.25).mean() * 100:.0f}%', '칩·숫자·컷과 0.25초 안', '계획 파일 효과음 시각')

# ── 8. 화살표 끝 ↔ 부위 ──
if A.log and VIS:
    L = [e for e in json.load(open(A.log)) if e[0] == 'arr']; hit = []; hd = {}
    for c in C:
        k = c['key']
        if k not in VIS or not c.get('arrow'): continue
        b = next((bb for n, st, s, bb in VIS[k] if n == 'word' and s >= THR and bb), None)
        if k in EYE and 'arrow_ok' in EYE[k]: hit.append(float(EYE[k]['arrow_ok'])); hd[k] = 'eye'; continue
        if not b: continue
        tw = W[c['chip_word']][1] + 0.1; fa = [e for e in L if e[2] == k]
        if not fa: continue
        e = min(fa, key=lambda e: abs(e[1] / FPS - tw)); x, y = e[3] / 1080, e[4] / 1920
        mx, my = 0.06, 0.04   # 상자 가장자리 여유
        hit.append(float(b[0] - mx <= x <= b[2] + mx and b[1] - my <= y <= b[3] + my)); hd[k] = [round(x, 2), round(y, 2), b]
    row('화살표 끝 ↔ 부위', 10, np.mean(hit) * 100 if hit else None, f'{len(hit)}컷 중 {int(sum(hit))}컷이 부위 상자 안 · 밖 = {[k for k, h in zip(hd, hit) if not h]}', '칩 낱말 시점에 화살표 끝이 부위 상자(여유 6%·4%) 안', '화면 로그 + OWLv2')
    DETAIL['arrow'] = hd
else:
    row('화살표 끝 ↔ 부위', 10, None, '로그·부위 검사 없음', '부위 상자 안', '—')

# ── 9. 자막 빈 곳(말하는데 자막이 없는 구간) ──
gaps = []; run = 0
for i in range(int(W[0][1] * FPS) + 3, min(len(has), int(VOICE_END * FPS) - 3)):
    t = i / FPS
    speaking = any(s + 0.05 <= t <= e - 0.05 for w, s, e in W)
    bign = any(b['t_box'] - 0.3 <= t <= b['t_box'] + 1.6 for b in P.get('bigs', []))   # 큰 숫자가 말 자막을 대신하는 구간
    if speaking and not has[i] and not bign: run += 1
    else:
        if run >= 6: gaps.append((round((i - run) / FPS, 2), round(run / FPS, 2)))
        run = 0
row('자막 빈 곳', 5, 100.0 if not gaps else 0.0, f'{len(gaps)}곳 {gaps[:6]}', '말하는 동안 0.2초 넘게 자막이 사라지지 않음', '완성 영상 노랑·흰 글자')
# 흰 글자만 있는 프레임을 빈 곳으로 잘못 세지 않도록 흰 글자도 본다
wht = ((fr[..., 0] > 235) & (fr[..., 1] > 235) & (fr[..., 2] > 235)).sum((1, 2)) > 60
gaps2 = []; run = 0
for i in range(int(W[0][1] * FPS) + 3, min(len(has), int(VOICE_END * FPS) - 3)):
    t = i / FPS; speaking = any(s + 0.05 <= t <= e - 0.05 for w, s, e in W)
    if speaking and not has[i] and not wht[i]: run += 1
    else:
        if run >= 6: gaps2.append((round((i - run) / FPS, 2), round(run / FPS, 2)))
        run = 0
ROWS[-1].update(score=100.0 if not gaps2 else 0.0, measured=f'{len(gaps2)}곳 {gaps2[:6]}')

# ── 합계 ──
sc = [r for r in ROWS if r['score'] is not None]; tot = sum(r['score'] * r['weight'] for r in sc) / sum(r['weight'] for r in sc)
zero = [r['name'] for r in sc if r['score'] == 0]; skipped = [r['name'] for r in ROWS if r['score'] is None]
ship = tot >= 90 and not zero and not skipped and not gaps2
print(f'[씽크 점수] {A.video.split("/")[-1]}')
for r in ROWS:
    print(f"  {'—' if r['score'] is None else format(r['score'], '5.1f')} / 100  (배점 {r['weight']:>2})  {r['name']}: {r['measured']}")
print(f'  총점 {tot:.1f} / 100   출고 기준(90점 · 0점 항목 없음 · 건너뛴 항목 없음 · 자막 빈 곳 0): {"통과" if ship else "미달"}')
if A.out: json.dump({'video': A.video.split('/')[-1], 'total': round(float(tot), 1), 'ship': bool(ship), 'rows': ROWS, 'detail': DETAIL}, open(A.out, 'w'), ensure_ascii=False, indent=1, default=lambda o: o.item() if hasattr(o, 'item') else str(o))
sys.exit(0 if ship else 1)
