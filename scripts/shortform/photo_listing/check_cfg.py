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
        if any(tt.endswith(b) for b in BAD_END) and not tt.endswith('주십시오'):
            err.append(f'합니다체 아님: 「{tt}」(컷 {c[1]})')

    # ⑤ 앱 안내 / 딜러 호칭
    if not any('딜러' in t for t, _, _ in items):
        warn.append('내레이션에 딜러 호칭 없음(10장: 「판매는 ○○, ○○○ 딜러가 담당합니다」)')
    if not getattr(C, 'CAPS_ALWAYS', False):
        err.append('CAPS_ALWAYS=True 아님(10장: 자막은 항상 보인다)')

    # ⑥ 독립 컷 자막 위치
    so = os.path.join(car, 'skills_out.json')
    for c in C.CUTS:
        if c[5] == 'reveal' and c[0] not in getattr(C, 'CAP_CY_PHOTOS', {}):
            err.append(f'독립 컷 p{c[0]} 자막 위치(CAP_CY_PHOTOS) 없음 → 카드에 자막이 겹침')

    for e in err:
        print('✗', e)
    for w in warn:
        print('△', w)
    print('통과' if not err else f'고칠 것 {len(err)}개')
    return 0 if not err else 1


if __name__ == '__main__':
    sp = float(sys.argv[sys.argv.index('--speed') + 1]) if '--speed' in sys.argv else float(os.environ.get('BBM_SPEED', '1.1'))
    sys.exit(main(os.path.abspath(sys.argv[1]), sp))
