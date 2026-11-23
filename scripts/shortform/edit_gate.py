#!/usr/bin/env python3
"""즉흥 편집 방지 관문 — 판(에디션)·렌더러·편집 기법을 edition_lock.json 하나와 대조한다. 2026-11-22.

  python3 edit_gate.py pre ED-SIMPLE scripts/shortform/video_listing/listing_video_render.py   # 렌더 전: 이 판에 이 렌더러를 써도 되나
  python3 edit_gate.py post 영상.mp4 [--plates]                                              # 렌더 후: 판·렌더러·필수 기법·금지 기법·주행거리=계기판·음성 싱크·안전영역 (+ 칩이 번호판을 덮는지)
  python3 edit_gate.py golden 영상.mp4 [기준영상.mp4]                                          # 기준 영상과 같은 역할 장면 나란히 시트
하나라도 어긋나면 끝 코드 1. post 통과 + check_be.py 통과 전에는 영상을 전달하지 않는다.
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
LOCK = json.load(open(os.path.join(HERE, 'edition_lock.json'), encoding='utf-8'))
FAIL = []
bad = lambda m: (FAIL.append(m), print('  ✗', m))
ok = lambda m: print('  ✓', m)
norm = lambda p: p.replace('\\', '/').split('scripts/shortform/')[-1]


def pre(ed, renderer):
    print(f'[렌더 전] 판 {ed} · 렌더러 {renderer}')
    if ed not in LOCK['editions']:
        bad(f'판 {ed} 없음 (있는 판: {", ".join(LOCK["editions"])})'); return
    want = norm(LOCK['editions'][ed]['renderer'])
    if norm(renderer) in {norm(k) for k in LOCK['compare_only'] if not k.startswith('_')}:
        bad(f'{norm(renderer)}는 비교용(출고 금지) — {LOCK["compare_only"].get("scripts/shortform/" + norm(renderer), "")}')
    (ok if norm(renderer) == want else bad)(f'판 {ed}의 렌더러는 {want} (요청 {norm(renderer)})')


def post(video):
    print(f'[렌더 후] {os.path.basename(video)}')
    p = video + '.plan.json'
    if not os.path.exists(p):
        bad('계획 파일(.plan.json) 없음 — 어떤 판·기법으로 만들었는지 알 수 없음(출고 금지)'); return
    P = json.load(open(p, encoding='utf-8'))
    ed = P.get('edition_code')
    if not ed or ed not in LOCK['editions']:
        bad(f'판 코드 없음/모름: {ed!r} — 렌더러가 판을 적지 않음(옛 렌더러로 만든 영상일 수 있음)'); return
    E = LOCK['editions'][ed]
    (ok if norm(P.get('renderer', '')) == norm(E['renderer']).split('/')[-1] or norm(E['renderer']).endswith(P.get('renderer', '?')) else bad)(
        f'렌더러 {P.get("renderer")} (판 {ed}는 {norm(E["renderer"])})')
    if E.get('order') == 'source':
        (ok if P.get('order') == 'source' else bad)(f'원본 순서·원본 길이 ({P.get("order")})')
    T = set(P.get('techniques') or [])
    if not T:
        bad('쓴 기법 기록 없음'); return
    miss = [t for t in E['required'] if not any(x in T for x in t.split('|'))]   # 「a|b」 = 둘 중 하나(v1.3 끝 화면 로고·딜러 카드)
    (ok if not miss else bad)(f'필수 기법 {len(E["required"])}개' + (f' — 빠짐: {miss}' if miss else ''))
    chips = P.get('chips') or []
    if any(c.get('kind') in ('point', 'callout') for c in chips):
        (ok if T & {'point_chip', 'callout_chip'} else bad)('칩이 있으면 칩 기법 기록')
    if any(c.get('kind') == 'callout' for c in chips):
        (ok if 'callout_arrow' in T else bad)('부위 칩이면 화살표')
    cy = (P.get('caption') or {}).get('center_y_px')
    if cy:
        hit = [c['label'] for c in chips if c.get('box') and c['box'][3] > cy - 60]
        (ok if not hit else bad)('칩이 말 자막 띠와 겹치지 않음' + (f' — 겹침: {hit}' if hit else ''))
    if P.get('sfx'):
        (ok if 'sfx_rules' in T else bad)('효과음이 있으면 규칙 효과음')
    safe_area(P, chips)
    audio_info(video)
    av_sync(video, P)
    mileage_on_cluster(video, P)
    if '--plates' in sys.argv:
        plate_check(video, chips)
    forb = [t for t in E.get('forbidden', []) if t in T]
    (ok if not forb else bad)('금지 기법 없음' + (f' — 들어감: {forb}' if forb else ''))
    ok(f'쓴 기법: {", ".join(sorted(T))}')


# ── 2026-11-22 코덱스 마스터 컨설팅 반영: 설명↔부위 · 음성 싱크 · 안전영역 · 오디오 채널 ──
def safe_area(P, chips):
    """칩·자막이 화면 안전영역 안에 있는가. 좌우 40px, 위 120px, 자막은 아래 20%(1536px)를 넘지 않음(AS24 교본 「아래 20%는 비운다」)."""
    W, H = P.get('frame') or [1080, 1920]
    out = [f"{c['label']}{c['box']}" for c in chips if c.get('box') and (c['box'][0] < 40 or c['box'][2] > W - 40 or c['box'][1] < 120)]
    cb = (P.get('caption') or {}).get('box')
    if cb and (cb[0] < 40 or cb[2] > W - 40 or cb[3] > H * 0.8):
        out.append(f'말 자막{cb}')
    if not cb:
        ok('안전영역: 자막 상자 기록 없음(옛 렌더) — 칩만 검사')
    (ok if not out else bad)('칩·자막 안전영역(좌우 40 · 위 120 · 자막 아래 20% 비움)' + (f' — 벗어남: {out}' if out else ''))


def audio_info(video):
    """오디오 채널·샘플레이트 기록. 음량은 check_be.py가 최종 파일로 잰다(채널이 바뀌면 음량이 3LUFS 달라질 수 있어 같은 파일로 잼)."""
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=channels,sample_rate,codec_name',
                        '-of', 'json', video], capture_output=True, text=True)
    st = (json.loads(r.stdout or '{}').get('streams') or [None])[0]
    if not st:
        bad('오디오 트랙 없음'); return
    ok(f"오디오 {st.get('codec_name')} {st.get('channels')}채널 {st.get('sample_rate')}Hz")


def _pcm(path, sr=8000, dur=None):
    import numpy as np
    cmd = ['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(sr), '-f', 'f32le']
    if dur: cmd[3:3] = ['-t', str(dur)]
    return np.frombuffer(subprocess.run(cmd + ['-'], capture_output=True).stdout, np.float32)


def av_sync(video, P, max_ms=40):
    """최종 영상의 소리가 자막 시간축(voice.wav)과 같은 자리에 있는가 — 둘의 소리 크기 곡선을 맞대어 어긋남(ms)을 잰다.
    자막·칩 시각은 voice.wav 기준이라, 먹스에서 음성이 밀리면(코덱스 실측 652ms) 여기서 걸린다. 배경음이 있어도 말소리 곡선으로 맞춘다."""
    import numpy as np
    vp = os.path.join(os.path.dirname(os.path.abspath(video)), P.get('voice') or 'voice.wav')
    if not os.path.exists(vp):
        bad(f'음성 싱크: 음성 파일 없음 {os.path.basename(vp)}'); return
    sr, hop = 8000, 80                                  # 10ms 단위 곡선
    env = lambda x: np.sqrt(np.convolve(x * x, np.ones(hop) / hop, 'same')[::hop] + 1e-9)
    a, b = env(_pcm(vp, sr, 30)), env(_pcm(video, sr, 30))
    n = min(len(a), len(b)); a, b = np.log(a[:n]), np.log(b[:n]); a -= a.mean(); b -= b.mean()
    lags = range(-100, 101)                             # ±1초
    cc = [float(np.dot(a[max(0, -k):n - max(0, k)], b[max(0, k):n - max(0, -k)])) for k in lags]
    lag_ms = lags[int(np.argmax(cc))] * 10
    (ok if abs(lag_ms) <= max_ms else bad)(f'음성↔자막 시간축 어긋남 {lag_ms:+d}ms (규칙 ±{max_ms}ms)')


KM_LABELS = ('주행거리',)
CLUSTER_TXT = ['a close-up photo of a car digital instrument cluster with speedometer and odometer']
OTHER_TXT = ['a photo of a car center console with gear lever', 'a photo of a car center infotainment screen',
             'a photo of a car glove box and passenger side dashboard', 'a photo of car seats', 'a photo of a car exterior',
             'a photo of a car steering wheel']


def mileage_on_cluster(video, P):
    """주행거리 큰 숫자가 뜬 동안 원본 화면에 계기판이 보이는가(코덱스 ③: 계기판으로 분류한 컷에 센터 콘솔이 섞임).
    큰 숫자가 뜬 순간부터 0.5초 간격 3장을 SigLIP 2로 보고, 계기판이 2장 이상이어야 통과. 아니면 게시 차단."""
    ks = [b for b in P.get('bigs') or [] if b.get('label') in KM_LABELS or str(b.get('text', '')).endswith('km')]
    if not ks:
        if any('km' in str(c.get('label', '')) for c in P.get('chips') or []):
            bad('주행거리 칩이 있는데 큰 숫자 기록(bigs)이 없음 — 옛 렌더러, 계기판 검사 불가'); return
        ok('주행거리 표시 없음(계기판 검사 생략)'); return
    import cv2
    sys.path.insert(0, os.path.join(HERE, 'auto'))
    from vlm import ZeroShot
    from PIL import Image
    src = os.path.join(os.path.dirname(os.path.abspath(video)), P.get('src') or 'src.mp4')
    zs = ZeroShot(); tf = zs.text(CLUSTER_TXT + OTHER_TXT); cap = cv2.VideoCapture(src)
    for b in ks:
        ts = [min(b['src_t'] + 0.5 * i, b.get('src_end', 1e9) - 0.05) for i in range(3)]
        ims = []
        for t in ts:
            cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); okf, f = cap.read()
            if okf: ims.append(Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)))
        pr = zs.probs(zs.image(ims), tf) if ims else []
        hit = [round(float(p[0]), 2) for p in pr]
        n_ok = sum(1 for p in pr if p.argmax() == 0)
        (ok if n_ok >= 2 else bad)(f"주행거리 {b['text']}가 뜬 동안 계기판이 보임 — 원본 {ts[0]:.1f}~{ts[-1]:.1f}초 계기판 판정 {n_ok}/{len(pr)} (확률 {hit})")


def plate_check(video, chips):
    """칩 상자가 번호판을 덮는가 — 칩이 뜬 순간 화면에서 번호판(OWLv2 「plate」)을 찾아 겹치면 실패.
    번호판은 가리지 않는다(사용자 확정). 칩이 덮어도 안 된다. 칩 상자(box)가 기록된 칩만 본다."""
    sys.path.insert(0, os.path.join(HERE, 'photo_listing'))
    import cv2, part_anchor as PA
    from PIL import Image
    # 2026-11-22 G350: 칩이 그려진 화면에서 찾으면 노랑 칩 자체를 번호판으로 잘못 봄(펜더 깜빡이 오탐) →
    # 원본 순서 판(order=source)은 같은 시각의 원본 화면을 영상 크기로 맞춰서 찾는다.
    P = json.load(open(video + '.plan.json', encoding='utf-8')) if os.path.exists(video + '.plan.json') else {}
    srcp = os.path.join(os.path.dirname(os.path.abspath(video)), P.get('src') or '')
    use_src = P.get('order') == 'source' and P.get('src') and os.path.exists(srcp)
    W, H = P.get('frame') or [1080, 1920]
    cap = cv2.VideoCapture(srcp if use_src else video); hit = []
    for c in list(chips) + list(P.get('bigs') or []):   # r03: 큰 숫자(bigs)도 번호판을 덮으면 실패
        if not c.get('box') or 't_box' not in c: continue
        cap.set(cv2.CAP_PROP_POS_MSEC, c['t_box'] * 1000); okf, f = cap.read()
        if not okf: continue
        if use_src: f = cv2.resize(f, (W, H))
        # 칩이 그려진 화면이 아니라 같은 순간의 원본에 가깝게 보려면 칩을 피한 판정이 필요 → 칩 상자 밖의 번호판만 셈하지 않고, 상자와 겹치는 번호판을 찾는다
        _det = PA.detect(Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)), ['plate'], thr=0.2).get('plate', [])
        _best = max([d[0] for d in _det] or [0])
        for sc, (x0, y0, x1, y1) in _det:
            # 2026-11-23 r03: OWLv2 상자는 범퍼까지 넓게 잡음 — 가장 확실한 상자의 60% 미만 점수는 빼고, 상자를 사방 5% 줄여 본다
            if sc < 0.6 * _best: continue
            _dx = (x1 - x0) * 0.05; _dy = (y1 - y0) * 0.05; x0, y0, x1, y1 = x0 + _dx, y0 + _dy, x1 - _dx, y1 - _dy
            bx = c['box']
            iw = min(x1, bx[2]) - max(x0, bx[0]); ih = min(y1, bx[3]) - max(y0, bx[1])
            if iw <= 0 or ih <= 0: continue
            # 2026-11-23 r03: 노랑 칩 자체를 번호판으로 잡는 오탐 — 찾은 상자가 칩 상자와 거의 같으면(IoU ≥ 0.8) 칩이므로 뺀다
            inter = iw * ih; uni = (x1 - x0) * (y1 - y0) + (bx[2] - bx[0]) * (bx[3] - bx[1]) - inter
            if inter / uni >= 0.8: continue
            if True:
                hit.append(f"{c['label']}({c['t_box']:.1f}초)")
    (ok if not hit else bad)('칩이 번호판을 덮지 않음' + (f' — 겹침: {hit}' if hit else ''))


def golden(video, ref=None):
    """같은 역할 순간(첫 화면 · 칩 2개 · 큰 숫자 · 끝 화면)을 새 영상과 기준 영상에서 뽑아 위아래로 붙인 시트."""
    P = json.load(open(video + '.plan.json', encoding='utf-8'))
    def moments(P):
        ch = P.get('chips') or []
        t = [next((c['t_box'] for c in ch if c['kind'] == 'title'), 0.6)]
        t += [c['t_box'] + 0.3 for c in ch if c['kind'] != 'title'][:3]
        t += [P['total'] - 0.5]
        return t
    out = video + '.golden.jpg'
    rows = []
    for v, PP in [(video, P)] + ([(ref, json.load(open(ref + '.plan.json')))] if ref and os.path.exists(ref + '.plan.json') else []):
        files = []
        for k, t in enumerate(moments(PP)):
            f = f'{v}.g{k}.jpg'; subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(max(0, t)), '-i', v, '-frames:v', '1', '-vf', 'scale=270:-1', f], check=True); files.append(f)
        r = f'{v}.grow.jpg'; subprocess.run(['ffmpeg', '-v', 'error', '-y', *sum([['-i', f] for f in files], []), '-filter_complex', ''.join(f'[{i}:v]' for i in range(len(files))) + f'hstack={len(files)}', r], check=True)
        rows.append(r)
    if len(rows) > 1: subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', rows[0], '-i', rows[1], '-filter_complex', 'vstack=2', out], check=True)
    else: os.replace(rows[0], out)
    print(f'  기준 비교 시트: {out}' + ('' if len(rows) > 1 else ' (기준 영상 없음 — 새 영상만)'))


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: print(__doc__); sys.exit(2)
    if a[0] == 'pre': pre(a[1], a[2])
    elif a[0] == 'post': post(a[1])
    elif a[0] == 'golden': golden(a[1], a[2] if len(a) > 2 else None)
    if a[0] != 'golden': print('통과' if not FAIL else f'실패 {len(FAIL)}건')
    sys.exit(1 if FAIL else 0)
