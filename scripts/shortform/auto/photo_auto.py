"""사진 매물 → 벨기에판 사진 쇼츠 설정(cfg.py) 자동 생성. 사람이 컷·자막·칩을 손으로 적던 일을 대신한다.

1) python3 -I photo_auto.py script 차폴더     → facts.json · script.json · tts.txt (대본은 원장 값만)
   (음성: tts.txt 를 일레븐랩스로 → 차폴더/voice_a.mp3,  받아쓰기: photo_listing/tr.py 차폴더)
2) python3 -I photo_auto.py cfg 차폴더        → cfg.py (photo_listing/common.py 가 읽는 형식)

입력 원장(사용자 지시 2026-11-21 「매물정보와 상세설명을 원장으로」):
  info.json    = 차란차 매물 서버 데이터(차명·최초등록·주행·가격·색상·바디). 차량번호·050 번호는 저장 단계에서 뺌
  scrape.json  = 매물 화면의 기본옵션 켜짐/꺼짐(off)·보증·보험 이력·사진 목록
  photo_tags.json = photo_tagger.py 결과(사진마다 부위)
원장에 없는 값(마력·제로백·무사고)은 말하지 않는다. 「보험 사고 없음」은 무사고와 다르다(차란차 화면 안내 그대로).
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from auto_edit import josa, km_show, price_parts  # noqa: E402

# 차란차 기본옵션 → (칩, 말할 이름, 합니다체 설명, 이 옵션을 보여 줄 사진 부위 순서). 뜻이 1:1인 것만
OPTIONS = {
    '후방카메라': ('후방 카메라', '후방 카메라', '후진할 때 뒤가 화면에 그대로 보입니다', ['screen_camera']),
    '선루프': ('선루프', '선루프', '천장을 열어 바람을 맞을 수 있습니다', ['interior_ceiling']),
    '통풍시트': ('통풍 시트', '통풍 시트', '여름에도 등이 끈적이지 않게 바람이 나옵니다', ['seats_front', 'seats_rear']),
    '열선 스티어링 휠': ('열선 핸들', '열선 핸들', '겨울에도 핸들이 따뜻합니다', ['steering_wheel', 'interior_dash']),
    'LED헤드램프': ('LED 헤드램프', 'LED 헤드램프', '밤길이 훨씬 밝게 보입니다', ['exterior_front']),
    '스마트키': ('스마트키', '스마트키', '주머니에 넣고 그대로 타면 됩니다', ['key']),
    '자동에어컨': ('자동 에어컨', '자동 에어컨', '온도만 맞춰 두면 알아서 조절합니다', ['console']),
}
OPTION_ORDER = ['후방카메라', '선루프', '통풍시트', '열선 스티어링 휠', '자동에어컨', 'LED헤드램프', '스마트키']
MAX_OPTIONS = 3
MIN_PHOTO_SCORE = 0.35   # 이보다 자신 없는 사진은 그 옵션 장면으로 쓰지 않는다(그러면 옵션도 말하지 않음)
MIN_MARGIN = 0.25        # 1위-2위 점수 차 최소

EN_MODEL = {'푸로산게': 'Purosangue', '로마': 'Roma', '포르토피노': 'Portofino', '우루스': 'Urus', '720S': '720S',
            '296': '296', 'SF90': 'SF90', '812': '812', 'F8': 'F8', '레부엘토': 'Revuelto', '우라칸': 'Huracán'}
EN_WORD = {'스파이더': 'Spider', '퍼포만테': 'Performante', 'M': 'M', 'S': 'S'}
MARKS = {'주행': '🛣️', '등록': '🗓️', '보험': '🛡️', '보증': '⚙️', '만원': '💰', '후방 카메라': '📷', '선루프': '☀️',
         '통풍 시트': '❄️', '열선 핸들': '🔥', 'LED 헤드램프': '⚡', '스마트키': '🔑', '자동 에어컨': '🌬️'}


def model_en(I):
    name = I['modelName']
    base = EN_MODEL.get(name, name)
    extra = [EN_WORD[w] for w in I.get('gradeName', '').split() if w in EN_WORD]
    out = []
    for w in [base] + extra:
        if w not in out:
            out.append(w)
    return ' '.join(out)


def facts(car):
    I = json.load(open(os.path.join(car, 'info.json'), encoding='utf-8'))
    S = json.load(open(os.path.join(car, 'scrape.json'), encoding='utf-8'))
    fr = I.get('firstRegisteredAt') or ''
    allopt = list(OPTIONS)
    on = [o for o in allopt if o not in S.get('off', [])]
    return dict(id=os.path.basename(os.path.normpath(car)), make=I['makerName'], model=I['modelName'], model_en=model_en(I),
                grade=I.get('gradeName'), reg=f'{fr[2:4]}년{fr[4:6]}월' if len(fr) >= 6 else None, yy=int(fr[2:4]), mm=int(fr[4:6]),
                km=I['mileage'], price=I['sellPrice'], color=I.get('colorName'), body=I.get('bodyTypeName'),
                options_on=on, options_off=S.get('off', []), warranty=S.get('warranty'), ins=S.get('ins'),
                _note='원장: 차란차 매물 페이지(서버 데이터 + 기본옵션 켜짐/꺼짐·보증·보험 이력). 기본옵션 12개는 화면에 늘 보이고 없는 것만 흐리게 나오므로 흐린 것(off)은 뺐다.')


def pick_photo(tags, parts, used, min_score=MIN_PHOTO_SCORE):
    for p in parts:
        # 2위 부위와 차이(MIN_MARGIN)가 작으면 헷갈린 사진 → 쓰지 않음(우루스 p19: 천장 0.47 / 뒷좌석 0.37 = 실제는 시트)
        cand = [t for t in tags if t['part'] == p and t['score'] >= min_score and t['n'] not in used and not t.get('dup_of')
                and t['score'] - (t['top3'][1][1] if len(t['top3']) > 1 else 0) >= MIN_MARGIN]
        if cand:
            return max(cand, key=lambda t: t['score'])
    return None


def rank_view(tags, view, used, allow_reuse=False):
    """그 방향으로 판정된 외관 사진 → 없으면 남은 외관 사진 → 없으면 점수 높은 아무 사진"""
    free = [t for t in tags if (allow_reuse or t['n'] not in used) and not t.get('dup_of') and t['part'] != 'other']
    exact = [t for t in free if t.get('view', [None])[0] == view]
    if exact:
        return exact[0]
    ext = [t for t in free if t.get('view')]
    return ext[0] if ext else max(free, key=lambda t: t['score'])


def warranty_left(w):
    if not w or '만료' in w:
        return None
    m = re.search(r'보증 ([^(]+?) 남음', w) or re.search(r'(\d+년 ?\d*개월|\d+개월|\d+년) 남음', w)
    return m.group(1).split('·')[0].strip() if m else None


def script(car):
    F = facts(car)
    tags = json.load(open(os.path.join(car, 'photo_tags.json'), encoding='utf-8'))
    used = set()
    cuts = []

    def cut(photo, label, tts, show, chip=None, chip_key=None, part=None):
        used.add(photo['n'])
        cuts.append(dict(photo=photo['n'], label=label, tts=tts, show=show, chip=chip, chip_key=chip_key,
                         part=part or photo['part'], score=photo['score']))

    name = f"{F['make']} {F['model']} {F['grade']}입니다."
    cut(rank_view(tags, 'front_3_4', used), '앞 45°', name, name)
    km = F['km']
    cut(rank_view(tags, 'rear_3_4', used), '뒤 45°', f"{F['yy']}년 {F['mm']}월 등록, 주행거리는 {km:,}킬로미터입니다.",
        f"{F['yy']}년 {F['mm']}월 등록, 주행거리는 {km:,}km입니다.", chip=f'주행 {km_show(km)}', chip_key=f'{km:,}')
    ins = F.get('ins')
    if ins and ins.get('내차피해') == '없음' and ins.get('상대차피해') == '없음':
        cut(rank_view(tags, 'rear', used), '뒷모습', '보험 사고 이력은 없습니다.', '보험 사고 이력은 없습니다.', chip='보험 사고 없음', chip_key='보험')
    # 외장 색상은 말하지 않는다: 차란차 색상은 큰 묶음이라 실제와 다를 수 있음(맥라렌 주황 = 원장 「빨간색」)
    front = rank_view(tags, 'front', used)   # 가격 컷 사진을 먼저 잡아 둔다(옵션이 정면 사진을 가져가지 않게)
    used.add(front['n'])
    n_opt = 0
    for o in OPTION_ORDER:
        if n_opt >= MAX_OPTIONS or o not in F['options_on']:
            continue
        chip, say, desc, parts = OPTIONS[o]
        ph = pick_photo(tags, parts, used)
        if not ph:
            continue  # 그 옵션을 보여 줄 사진이 없으면 말하지도 띄우지도 않는다
        lead = josa(say, '이 있어', '가 있어')
        label = {'후방 카메라': '후방 카메라 화면'}.get(chip, chip)   # 라벨에 부위 낱말이 있어야 부위 당기기(매뉴얼 14장)가 걸린다
        cut(ph, label, f'{lead} {desc}.', f'{lead} {desc}.', chip=chip, chip_key=say.split()[0], part=ph['part'])
        n_opt += 1
    left = warranty_left(F.get('warranty'))
    if left:
        eng = pick_photo(tags, ['engine_bay'], used) or pick_photo(tags, ['wheel'], used)
        if eng:
            cut(eng, '엔진룸' if eng['part'] == 'engine_bay' else '휠', f'제조사 보증은 {left} 남아 있습니다.', f'제조사 보증은 {left} 남아 있습니다.',
                chip=f'보증 {left} 남음', chip_key='보증')
    say, show = price_parts(F['price'])
    cut(front, '정면', f"가격은 {' '.join(show)}원입니다.", f"가격은 {' '.join(show)}원입니다.", chip=' '.join(show) + '원', chip_key='가격')
    end = pick_photo(tags, ['wheel'], used) or rank_view(tags, 'front_3_4', used, allow_reuse=True)
    cuts.append(dict(photo=end['n'], label='휠' if end['part'] == 'wheel' else '앞 45°', tts='자세한 정보는 보배드림 앱에서 확인해 주십시오.', show='자세한 정보는 보배드림 앱에서 확인해 주십시오.',
                     chip=None, chip_key=None, part=end['part'], score=end['score']))
    json.dump(F, open(os.path.join(car, 'facts.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump(cuts, open(os.path.join(car, 'script.json'), 'w'), ensure_ascii=False, indent=1)
    txt = ' '.join(c['tts'] for c in cuts)
    open(os.path.join(car, 'tts.txt'), 'w').write(txt)
    return F, cuts, txt


NORM = lambda t: re.sub(r'[^0-9A-Za-z가-힣]', '', t)
FIX = [('킬로미터', 'km'), ('만 원', '만원')]
TRANS = [None, 'whip_l', 'whip_r', 'push_up', 'whip_l', 'zoom', 'whip_r', 'push_up', 'whip_l', 'whip_r', 'zoom']


def cfg(car):
    import difflib
    F = json.load(open(os.path.join(car, 'facts.json'), encoding='utf-8'))
    cuts = json.load(open(os.path.join(car, 'script.json'), encoding='utf-8'))
    W = json.load(open(os.path.join(car, 'voice_a_words.json'), encoding='utf-8'))  # [[start, end, text], ...]
    # 자막 글자는 받아쓰기가 아니라 대본 원문에서 가져온다(받아쓰기는 푸로산게→프로상계, 3,900만→3천 9백만처럼 틀림).
    # 받아쓰기 낱말마다 「그 낱말이 덮는 대본 구간」을 글자 맞춤(difflib)으로 구해 원문을 그 시각에 자른다.
    full = ' '.join(c['show'] for c in cuts)
    tts_full = ' '.join(c['tts'] for c in cuts)
    sc, sorig, scut = [], [], []          # 대본(소리 기준 tts) 정규화 글자, 원문 위치, 컷 번호
    pos = 0
    for k, c in enumerate(cuts):
        for j, ch in enumerate(c['tts']):
            if NORM(ch):
                sc.append(ch); sorig.append(pos + j); scut.append(k)
        pos += len(c['tts']) + 1
    wc, wstart = [], []
    for i, w in enumerate(W):
        wstart.append(len(wc))
        wc.extend(NORM(w[2]))
    wstart.append(len(wc))
    sm = difflib.SequenceMatcher(None, ''.join(wc), ''.join(sc), autojunk=False)
    m = [0] * (len(wc) + 1)                # 받아쓰기 글자 위치 → 대본 글자 위치
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        for x in range(i1, i2):
            m[x] = j1 + ((x - i1) * (j2 - j1)) // max(1, i2 - i1) if tag != 'insert' else j1
    m[len(wc)] = len(sc)
    seg = []                               # 받아쓰기 낱말 → 대본 원문 조각
    for i in range(len(W)):
        s0, s1 = m[wstart[i]], m[wstart[i + 1]]
        o0 = sorig[s0] if s0 < len(sorig) else len(tts_full)
        o1 = sorig[s1] if s1 < len(sorig) else len(tts_full)
        glued = o0 > 0 and o0 < len(tts_full) and tts_full[o0 - 1] != ' ' and o1 > o0   # 한 어절이 둘로 들린 경우(6.5 → 6 / .5)
        seg.append((tts_full[o0:o1].strip(), scut[min(s0, len(scut) - 1)], glued))
    # 비어 버린 조각(받아쓰기가 한 낱말을 둘로 쪼갠 경우)은 앞 조각과 같은 컷에 두고 글자는 비운다
    owner = [c for _, c, _ in seg]
    for i in range(1, len(owner)):
        owner[i] = max(owner[i], owner[i - 1])
    out = []
    for k, c in enumerate(cuts):
        idx = [i for i, o in enumerate(owner) if o == k]
        if not idx:
            raise SystemExit(f'컷 {k} 「{c["tts"]}」에 해당하는 받아쓰기 낱말이 없음')
        caps, n = [], 0
        for i in idx:
            t = seg[i][0]
            for a_, b_ in FIX:
                t = t.replace(a_, b_)
            if seg[i][2] and caps and caps[-1] != '|':   # 앞 자막에 붙여 한 어절로(받아쓰기 낱말 번호는 앞 것 그대로)
                caps[-1] = (caps[-1][0] + t, caps[-1][1])
                continue
            if not t:
                if caps:  # 앞 자막에 붙인다(점검기는 앞 자막이 이 낱말을 덮으면 통과)
                    continue
                t = W[i][2]
            if n and n % 3 == 0:
                caps.append('|')
            caps.append((t, i)); n += 1
        chip = None
        if c['chip']:
            key = NORM(c['chip_key'] or '')
            hit = next((i for x in caps if x != '|' for t, i in [x] if key and key in NORM(t)), idx[0])   # 자막(대본 원문)에서 찾는다
            chip = (c['chip'], hit)
        tr = TRANS[min(k, len(TRANS) - 1)] if k < len(cuts) - 1 else 'blur'
        if c['label'] == '정면':
            tr = 'flash'
        kb = (.5, .5, 1.0, 1.06, .5) if k % 2 == 0 else (.5, .5, 1.06, 1.0, .5)
        out.append((c['photo'], c['label'], idx[0], caps, chip, tr, kb))
    marks = {}
    for c in cuts:
        if c['chip']:
            marks[c['chip']] = next((v for kk, v in MARKS.items() if kk in c['chip']), '✓')
    reg_km = f"{F['reg']} · {km_show(F['km'])}"
    C = dict(OUT=f"bobae_be_cha_{F['id']}.mp4", HOOK=(F['make'], F['model_en'], reg_km), HOOK_ZOOM=None,
             FIT=sorted({c['photo'] for c in cuts if str(c['part']).startswith('exterior')}),   # 차 전체 외관만 맞춤, 실내는 부위 당기기
             AUTO_ZOOM=True, WHOOSH_AT=[i for i, x in enumerate(out) if x[5] in ('whip_l', 'whip_r')][:2],
             MARKS=marks, CAPS_ALWAYS=True, CAPS_UNDER_PHOTO=True, SPEED=1.1, CUTS=out)
    with open(os.path.join(car, 'cfg.py'), 'w') as f:
        f.write(f"# 자동 생성: photo_auto.py (차란차 사진 매물 {F['make']} {F['model']}) — 내부 테스트용\n")
        for kk, v in C.items():
            f.write(f'{kk}={v!r}\n')
    return C


if __name__ == '__main__':
    cmd, car = sys.argv[1], os.path.abspath(sys.argv[2])
    if cmd == 'script':
        F, cuts, txt = script(car)
        for c in cuts:
            print(f"p{c['photo']:02d} {c['part']:18} {c['score']:.2f} | {c['show']} | 칩 {c['chip']}")
        print('TTS:', txt)
    elif cmd == 'cfg':
        C = cfg(car)
        for x in C['CUTS']:
            print(x[0], x[1], x[2], ' '.join(t[0] for t in x[3] if t != '|'), x[4], x[5])
