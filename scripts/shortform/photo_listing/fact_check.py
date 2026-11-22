"""대본 사실 검사기 (마스터 문서 12장 K1, 2026-11-22)

python3 fact_check.py <차 폴더>      # 단독 실행
check_cfg.py가 ⑧로 부른다.

대본(받아쓰기 낱말) · 칩 · LISTING_OPTIONS에 나온 옵션이 근거가 있는지 본다.
근거 = listing.json 등록 옵션(서울오토갤러리 class="on") 또는 cfg의 FACT_SOURCES {옵션 id: '근거(예: 사진 p04 타이어 옆면)'}.
근거 없는 옵션 = 실패. 주행거리 숫자는 listing.json km_text와 맞아야 한다.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
RULES = json.load(open(os.path.join(HERE, 'option_visual_rules.json'), encoding='utf-8'))

# 옵션 규칙 id → 서울오토갤러리 등록 옵션 이름에 들어가는 글자
LISTING_NAME = {
    'seat_heat': ('열선',), 'seat_vent': ('통풍',), 'seat_massage': ('안마', '마사지'), 'seat_memory': ('메모리',),
    'seat_power': ('전동시트',), 'seat_material': ('가죽시트', '알칸', '나파'), 'camera': ('카메라', '어라운드'),
    'sunroof': ('썬루프', '선루프'), 'light': ('LED', 'HID'), 'wireless_charge': ('무선',), 'speaker': ('오디오', '스피커', '사운드'),
    'hud': ('HUD', '헤드업'), 'screen': ('네비', '디스플레이', '모니터'), 'climate': ('에어컨', '공조'),
}
# 매물 정보에 칸이 따로 있는 것(옵션 목록이 아님)
FIELD_OK = {'engine': 'cc', 'trunk': None, 'wheel': None, 'ambient': None}


def _opts(car):
    p = os.path.join(car, 'listing.json')
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else None


def _num(s):
    s = s.replace(',', '')
    m = re.match(r'(\d+(?:\.\d+)?)(만)?', s)
    if not m:
        return None
    return float(m.group(1)) * (1e4 if m.group(2) else 1)


def check(C, words, car):
    """돌려줌 (오류, 경고)"""
    err, warn = [], []
    L = _opts(car)
    src = dict(getattr(C, 'FACT_SOURCES', {}) or {})
    if L is None:
        warn.append('사실 검사: listing.json 없음 → 옵션 근거를 대조하지 못함(sag_prep.py로 만들기)')
        return err, warn
    reg = L.get('options', [])
    text = ' '.join(w[2] for w in words)
    chips = ' '.join(c[4][0] for c in C.CUTS if c[4])
    lo = getattr(C, 'LISTING_OPTIONS', {}) or {}
    for r in RULES['options']:
        oid = r['id']
        said = [k for k in r['keywords'] if k in text or k in chips]
        if not said and oid not in lo:
            continue
        names = LISTING_NAME.get(oid)
        in_listing = bool(names) and any(any(n in o for n in names) for o in reg)
        if in_listing or oid in src:
            continue
        if oid in FIELD_OK and FIELD_OK[oid] and L.get(FIELD_OK[oid]):
            continue
        where = f"대본 「{'·'.join(said)}」" if said else 'LISTING_OPTIONS'
        err.append(f"사실 검사: {r['name']}({oid}) — {where}에 나오지만 등록 옵션({len(reg)}개)에도 FACT_SOURCES에도 근거 없음")
    km = L.get('km_text', '')
    kmv = _num(re.sub(r'[^\d,.만]', '', km)) if km else None
    if kmv:
        # 받아쓰기가 「57」「,998km」처럼 숫자를 나눠 적으므로 이어 붙여 본다
        joined = re.sub(r'(\d)\s+([,.]?\d)', r'\1\2', text)
        for m in re.finditer(r'([\d,]+(?:\.\d+)?만?)\s*(?:km|킬로)', joined):
            v = _num(m.group(1))
            if v and abs(v - kmv) / kmv > 0.05:
                err.append(f"사실 검사: 주행거리 「{m.group(0)}」 ≠ 매물 {km}")
    return err, warn


if __name__ == '__main__':
    car = os.path.abspath(sys.argv[1])
    import importlib.util
    sp = importlib.util.spec_from_file_location('cfg', os.path.join(car, 'cfg.py'))
    C = importlib.util.module_from_spec(sp); sp.loader.exec_module(C)
    words = json.load(open(os.path.join(car, 'voice_a_words.json'), encoding='utf-8'))
    e, w = check(C, words, car)
    for x in e:
        print('✗', x)
    for x in w:
        print('△', x)
    print('통과' if not e else f'실패 {len(e)}건')
    sys.exit(1 if e else 0)
