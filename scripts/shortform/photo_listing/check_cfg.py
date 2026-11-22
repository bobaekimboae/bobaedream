"""렌더 전 매뉴얼 점검 (파이프라인 v1.4) — 걸리면 렌더하지 않는다

python3 check_cfg.py <차 폴더> [--speed 1.1]
매뉴얼 근거: 8장(첫 컷) · 10장(자막 항상 보임 · 합니다체 · 딜러 호칭) · 7장(근거 없는 숫자) · 12장(독립 컷)
종료 코드 0 = 통과, 1 = 고칠 것 있음. common.py는 렌더 시작 때 이 점검을 먼저 돌린다(--plan 제외, BBM_SKIP_CHECK=1이면 건너뜀).
"""
import importlib.util, json, os, re, sys

BAD_END = ['죠?', '죠', '고요', '거든요', '어요', '해요', '세요', '딱!', '야', '지?', '네요']  # 합니다체가 아닌 끝말
YEAR_OK = re.compile(r'^(\d{2}년\d{2}월(\(\d{2}년형\))?|20\d{2})$')


def load(car):
    sp = importlib.util.spec_from_file_location('cfg', os.path.join(car, 'cfg.py'))
    m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m)
    return m


def main(car, speed=1.1):
    C = load(car)
    W = json.load(open(os.path.join(car, 'voice_a_words.json')))
    err, warn = [], []
    items = []
    for c in C.CUTS:
        for it in c[3]:
            if it != '|':
                items.append((it[0], it[1], c))
    used = {i for _, i, _ in items}

    # ① 말하는 낱말마다 자막(숫자 조각 「,770km」처럼 앞 숫자에 붙은 조각은 허용)
    for i, w in enumerate(W):
        if i in used:
            continue
        frag = re.match(r'^[,.\d]', w[2]) and ((i - 1) in used or ((i - 2) in used and re.match(r'^[,.\d]', W[i - 1][2])))
        clean = re.sub(r'[^0-9A-Za-z가-힣]', '', w[2])
        pj = max([j for j in used if j < i], default=None)  # 바로 앞 자막 어절(여러 어절을 한 자막으로 붙여 쓴 경우: 서울 오토 갤러리에)
        prev = [t for t, j, _ in items if j == pj]
        joined = any(clean and clean in re.sub(r'[^0-9A-Za-z가-힣]', '', t) for t in prev)  # 앞 자막 낱말이 이 말까지 붙여 씀(성능점검 · 서울오토갤러리에)
        joined = joined or any(len(clean) >= 3 and clean[:2] in re.sub(r'[^0-9A-Za-z가-힣]', '', t) for t in prev)  # 받아쓰기 끝 글자 오타(기록부→기록도), 자막은 대본 글자
        if not frag and not joined:
            err.append(f'자막 빠짐: {i}번 「{w[2]}」 ({w[0] / speed:.2f}초)')

    # ② 첫 컷 자막 숨김: 숨기는 동안 하는 말이 타이틀(HOOK)에 있어야 함
    hide = getattr(C, 'HOOK_HIDE_CAPS', False)
    hook = ' '.join(getattr(C, 'HOOK', ('', '', '')))
    if hide:
        first = [t for t, _, c in items if c is C.CUTS[0]]
        miss = [t for t in first if not any(k in hook.replace(' ', '') for k in [t.rstrip('입니다.!').replace(' ', '')]) and len(t) > 1]
        if miss:
            err.append(f'첫 컷 자막을 숨기는데 타이틀에 없는 말: {miss} → 타이틀에 있는 말만 하거나 HOOK_HIDE_CAPS=False')
    hk = tuple(getattr(C, 'HOOK', ())) + ('', '', '')
    if not hk[0].strip() or not hk[1].strip():  # 2026-11-17 사용자: 첫 컷 브랜드·모델명은 필수
        err.append('첫 컷 제목에 브랜드(HOOK[0])와 모델명(HOOK[1])이 둘 다 있어야 함')
    elif not re.search(r'[A-Za-z0-9]', hk[1]):
        warn.append(f'첫 컷 모델명 「{hk[1]}」 → 영문 모델명 권장(브랜드는 한국어, 모델은 영문)')
    if getattr(C, 'HOOK_DELAY', 0.0) > 0.3:
        warn.append('첫 컷 제목이 늦게 나옴(HOOK_DELAY) → 처음부터 띄우기(HOOK_DELAY=0, HOOK_DROP=True)')
    if not getattr(C, 'HOOK_ZOOM', None):
        warn.append('첫 컷 엠블럼 확대(HOOK_ZOOM) 없음 — 엠블럼이 작거나 흐린 경우만 생략(8장)')

    # ③ 연식 표기(차란차): 22년04월 / 22년04월(23년형) / 2022
    sub = getattr(C, 'HOOK', ('', '', ''))[2]
    yr = sub.split('·')[0].strip() if sub else ''
    if yr and not YEAR_OK.match(yr):
        err.append(f'연식 표기 「{yr}」 → 차란차 표기(22년04월 / 월 모르면 2022)')
    for t, _, c in items:
        if re.search(r'\d{4}년식', t):
            err.append(f'자막 연식 「{t}」 → 차란차 표기')
    for ch in [c[4][0] for c in C.CUTS if c[4]] + [x[0] for x in getattr(C, 'EXTRA_CHIPS', [])]:
        if re.search(r'\d{4}년식', ch):
            err.append(f'칩 연식 「{ch}」 → 차란차 표기')

    # ④ 합니다체: 문장 끝 낱말 검사
    for t, _, c in items:
        tt = t.strip()
        if tt.rstrip('!.') == '다운받으세요':   # 사용자 확정 CTA 문장(끝말 고정)
            continue
        if any(tt.endswith(b) for b in BAD_END) and not tt.endswith('주십시오'):
            err.append(f'합니다체 아님: 「{tt}」(컷 {c[1]})')

    # ⑤ 앱 안내 / 딜러 호칭
    if not any('딜러' in t for t, _, _ in items):
        warn.append('내레이션에 딜러 호칭 없음(README 6장 사진판: 「판매는 ○○, ○○○ 딜러가 담당합니다」)')
    import fact_check   # ⑧ 대본 사실 검사(마스터 12장 K1)
    _fe, _fw = fact_check.check(C, W, car)
    err += _fe; warn += _fw
    if getattr(C, 'AUTO_VISUALS', False) and any(('휠' in c[1] or '타이어' in c[1]) for c in C.CUTS):
        wv = (getattr(C, 'LISTING_OPTIONS', {}) or {}).get('wheel') or {}
        if not (wv.get('inch') and wv.get('tire')):   # 2026-11-22 사용자 「휠은 인치와 타이어크기 고정」
            err.append("휠 컷이 있는데 LISTING_OPTIONS['wheel']에 inch · tire 값이 없음 → 매물 정보나 사진 속 타이어 옆면 글자로 확인해 넣기(지어내지 않음)")
    if not getattr(C, 'CAPS_ALWAYS', False):
        err.append('CAPS_ALWAYS=True 아님(README 6장 사진판 예외: 자막은 항상 보인다)')

    # ⑥ 독립 컷 자막 위치
    so = os.path.join(car, 'skills_out.json')
    for c in C.CUTS:
        if c[5] == 'reveal' and c[0] not in getattr(C, 'CAP_CY_PHOTOS', {}):
            err.append(f'독립 컷 p{c[0]} 자막 위치(CAP_CY_PHOTOS) 없음 → 카드에 자막이 겹침')

    # ⑦ 카드 컷 루틴(card_routine_rules.json): 「성능점검기록부 요약합니다」로 시작 · 줄은 reveal · warn은 「다만」
    try:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import card_routine
        e2, w2 = card_routine.check(C, None)
        err += e2; warn += w2
    except FileNotFoundError:
        pass

    for e in err:
        print('✗', e)
    for w in warn:
        print('△', w)
    print('통과' if not err else f'고칠 것 {len(err)}개')
    return 0 if not err else 1


if __name__ == '__main__':
    sp = float(sys.argv[sys.argv.index('--speed') + 1]) if '--speed' in sys.argv else float(os.environ.get('BBM_SPEED', '1.1'))
    sys.exit(main(os.path.abspath(sys.argv[1]), sp))
