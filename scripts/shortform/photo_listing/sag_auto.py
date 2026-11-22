"""서울오토갤러리 매물 → 사진판 숏폼 무인 흐름 (마스터 문서 12장 K9, 2026-11-22)

사람이 쓰던 「대본 · 카드 · cfg」를 매물 정보와 고정 촬영 순서로 자동 생성한다.

  python3 sag_auto.py prep <차폴더> <성능기록부.html>   # sag_prep.py 다음: 카드 그림 + 대본(script.json · script.txt)
  (음성)  script.txt 를 일레븐랩스로 한 번 생성 → <차폴더>/voice_a.mp3
  python3 tr.py <차폴더>                               # 낱말 시각
  python3 sag_auto.py cfg <차폴더>                      # 받아쓰기 ↔ 대본 문장 맞춰 cfg.py 생성
  → check_cfg.py · common.py · check_render.py

원칙: 문장은 listing.json(등록 옵션 · 연식 · 색 · 상사 · 딜러)과 cards.json(성능기록부 체크값)에만 기댄다.
휠 인치 · 타이어 규격은 매물 정보에 없어서 휠 컷은 넣지 않는다(사람 확인 대상으로 보고).
"""
import difflib, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import card_routine  # noqa: E402

CARD_FIRST = 40           # 카드 그림 번호(서울오토갤러리 사진 K01~K20과 겹치지 않게)
CHK_BASE = 'http://check.korea-usedcar.co.kr/'
CTA = '보배드림 앱에서 자세한 정보를 보시거나 구글·애플 스토어에서 다운받으세요!'
COLOR = {'검정': '블랙', '흰색': '화이트', '회색': '그레이', '은색': '실버', '파랑': '블루', '빨강': '레드', '진주': '펄 화이트'}


def model_name(name):
    t = re.sub(r'\([^)]*\)', '', name).split()
    if len(t) > 1 and re.search(r'(클래스|시리즈)$', t[0]):
        t = t[1:]
    return ' '.join(t[:3])


def company(s):
    return re.sub(r'\(주\)|주식회사', '', s).strip()


def seat_phrase(opts):
    """등록 옵션의 괄호(운전석 · 앞)를 그대로 살려 말한다 — 「앞좌석 통풍」처럼 넓혀 말하지 않음"""
    feats = []
    for key, word in (('전동시트', '전동'), ('열선시트', '열선'), ('통풍시트', '통풍'), ('안마시트', '마사지'), ('메모리시트', '메모리')):
        for o in opts:
            if o.startswith(key):
                m = re.search(r'\(([^)]*)\)', o)
                q = {'앞': '앞좌석', '뒤': '뒷좌석'}.get(m.group(1), m.group(1)) if m else ''
                feats.append((q, word))
    if not feats:
        return None
    groups = {}
    for q, w in feats:
        groups.setdefault(q, []).append(w)
    parts = [f"{q} {'과 '.join(ws) if len(ws) == 2 else ', '.join(ws)}".strip() for q, ws in groups.items()]
    head = '가죽에 ' if any(o.startswith('가죽시트') for o in opts) else ''
    return f"{head}{', '.join(parts)}까지 됩니다."


def build_script(L, cards):
    km = cards['report'].get('km') or L['km_text'].replace('km', '')
    sents = []
    sents.append(dict(p=1, label='측전면', text=f"{L['maker']} {model_name(L['name'])}, 서울오토갤러리 매물입니다."))
    sents.append(dict(p=2, label='정면', text=f"{L['year']}년 {int(L['month'])}월 등록, 주행거리 {km}km입니다.", chip=f'{km}km'))
    col = COLOR.get(L['color'], L['color'])
    sents.append(dict(p=3, label='측후면', text=f"{col} 외장입니다.", chip=f'{col} 외장'))
    sp = seat_phrase(L['options'])
    if sp:
        sents.append(dict(p=11, label='앞좌석', text=f"시트는 {sp}", seat=True))
    conv = [w for k, w in (('네비게이션', '내비게이션'), ('후방카메라', '후방 카메라'), ('스마트키', '스마트키'), ('버튼시동', '버튼 시동')) if k in L['options']][:3]
    if conv:
        sents.append(dict(p=7, label='대시보드', text=f"{', '.join(conv)}까지 갖췄습니다."))
    for st, t, img in card_routine.script(dict(cards['report'], first=CARD_FIRST)):
        sents.append(dict(p=img, label='성능점검', text=t, card=st))
    sents.append(dict(p=18, label='정면 3/4', text=f"판매는 {company(L['company'])} {L['dealer']} 딜러가 담당합니다.", chip=f"{L['dealer']} 딜러"))
    sents.append(dict(p=19, label='후면 3/4', text=CTA))
    return sents


def inspect_shots(car, chk_html):
    """성능기록부 웹 화면에서 사고 부위 그림 · 점검 장면 사진만 찍는다(번호 칸은 찍지 않음)"""
    from playwright.sync_api import sync_playwright
    h = open(chk_html, encoding='utf-8', errors='replace').read()
    h = re.sub(r'<head>', f'<head><base href="{CHK_BASE}">', h, count=1, flags=re.I)
    tmp = os.path.join(car, '_chk.html')
    open(tmp, 'w', encoding='utf-8').write(h)
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 1000, 'height': 1400})
        pg.goto('file://' + tmp, wait_until='networkidle')
        dg = pg.locator('img[src*="repair_img"]').first
        dg.locator('xpath=..').screenshot(path=os.path.join(car, 'diag.png'))
        imgs = pg.locator('img[src*="carcheck"]')
        shots = []
        for i in range(min(2, imgs.count())):
            fp = os.path.join(car, f'_scene{i}.png')
            imgs.nth(i).screenshot(path=fp)
            shots.append(fp)
        b.close()
    os.remove(tmp)
    if shots:
        from PIL import Image
        ims = [Image.open(f).convert('RGB') for f in shots]
        hgt = min(i.height for i in ims)
        ims = [i.resize((int(i.width * hgt / i.height), hgt)) for i in ims]
        out = Image.new('RGB', (sum(i.width for i in ims) + 12 * (len(ims) - 1), hgt), 'white')
        x = 0
        for i in ims:
            out.paste(i, (x, 0)); x += i.width + 12
        out.save(os.path.join(car, 'scene.jpg'), quality=92)
        for f in shots:
            os.remove(f)
    return bool(shots)


def prep(car, chk_html):
    L = json.load(open(os.path.join(car, 'listing.json'), encoding='utf-8'))
    cards = json.load(open(os.path.join(car, 'cards.json'), encoding='utf-8'))
    has_scene = inspect_shots(car, chk_html)
    from PIL import Image
    dw, dh = Image.open(os.path.join(car, 'diag.png')).size
    rp = cards['report']
    rp.update(first=CARD_FIRST, doc='diag.png', diagram_box=[0, 0, dw, dh], compact=True,
              car=f"{L['maker']} {model_name(L['name'])} · {str(L['year'])[2:]}년{L['month']}월",
              stamp=None if any('단순 수리' in r[0] and r[1].startswith('있음') for r in rp['rows']) else '표시 없음',
              foot='중고자동차 성능·상태점검기록부 기준')
    if has_scene:
        sw, sh = Image.open(os.path.join(car, 'scene.jpg')).size
        rp['scene'] = dict(doc='scene.jpg', box=[0, 0, sw, sh], label='점검 장면 사진')
    cards['bg'] = 2
    json.dump(cards, open(os.path.join(car, 'cards.json'), 'w'), ensure_ascii=False, indent=1)
    for f in os.listdir(os.path.join(car, 'src2')):   # 렌더러는 pNN.png를 읽는다
        if f.endswith('.jpg'):
            Image.open(os.path.join(car, 'src2', f)).convert('RGB').save(os.path.join(car, 'src2', f[:-4] + '.png'))
    subprocess.run([sys.executable, os.path.join(HERE, 'report_cut.py'), car], check=True)
    S = build_script(L, cards)
    json.dump(S, open(os.path.join(car, 'script.json'), 'w'), ensure_ascii=False, indent=1)
    open(os.path.join(car, 'script.txt'), 'w').write(' '.join(s['text'] for s in S))
    print(' '.join(s['text'] for s in S))


def _norm(s):
    return re.sub(r'[^0-9A-Za-z가-힣]', '', s)


def make_cfg(car):
    L = json.load(open(os.path.join(car, 'listing.json'), encoding='utf-8'))
    cards = json.load(open(os.path.join(car, 'cards.json'), encoding='utf-8'))
    S = json.load(open(os.path.join(car, 'script.json'), encoding='utf-8'))
    W = json.load(open(os.path.join(car, 'voice_a_words.json'), encoding='utf-8'))
    # 문자 단위로 맞춰 문장 경계 → 낱말 번호
    wchars, wid = [], []
    for i, w in enumerate(W):
        for ch in _norm(w[2]):
            wchars.append(ch); wid.append(i)
    schars, sid = [], []
    for k, s in enumerate(S):
        for ch in _norm(s['text']):
            schars.append(ch); sid.append(k)
    sm = difflib.SequenceMatcher(None, ''.join(schars), ''.join(wchars), autojunk=False)
    first = {}
    for a, b, n in sm.get_matching_blocks():
        for j in range(n):
            k, i = sid[a + j], wid[b + j]
            first[k] = min(first.get(k, 10 ** 9), i)
    starts = []
    prev = -1
    for k in range(len(S)):
        st = first.get(k)
        if st is None or st <= prev:
            raise SystemExit(f'문장 {k} 「{S[k]["text"]}」을 받아쓰기에서 못 찾음 — 음성을 확인')
        starts.append(st); prev = st
    starts.append(len(W))
    cuts, marks, whoosh = [], {}, []
    card_ids = [s['p'] for s in S if s.get('card')]
    for k, s in enumerate(S):
        a, b = starts[k], starts[k + 1]
        ids = list(range(a, b))
        caps = []
        for i in ids:
            t = W[i][2].rstrip('.,')
            if not t:
                continue
            m = re.fullmatch(r'(\d{4})년', t)
            if m and i + 1 < b and re.fullmatch(r'(\d{1,2})월,?', W[i + 1][2]):   # 차란차 표기: 2020년 1월 → 20년01월
                caps.append((f"{m.group(1)[2:]}년{int(W[i + 1][2].rstrip(',')[:-1]):02d}월", i))
                continue
            if caps and re.fullmatch(r'\d{1,2}월', t) and re.fullmatch(r'\d{2}년\d{2}월', caps[-1][0]):
                continue
            caps.append((t, i))
        if len(caps) > 3:
            caps.insert((len(caps) + 1) // 2, '|')
        chip = None
        if s.get('chip'):
            key = _norm(s['chip'].split()[0])
            ci = next((i for i in ids if key[:3] and key[:3] in _norm(W[i][2])), a)
            chip = (s['chip'], ci)
            marks[s['chip']] = {'km': '🛣️', '외장': '🎨', '딜러': '🤝'}[next(x for x in ('km', '외장', '딜러') if x in s['chip'])]
        if s.get('card'):
            trans = 'flash' if s['card'] == 'intro' else 'reveal'
        elif s['p'] == 18:
            trans = 'whip_l'
        elif s['p'] == 19:
            trans = 'blur'
        elif s.get('seat') or s['p'] == 7:
            trans = 'zoom' if not any(c[5] == 'zoom' for c in cuts) else None
        else:
            trans = None
        kb = (.5, .5, 1.0, 1.0, .5) if s.get('card') else ((.5, .5, 1.0, 1.10, .5) if k % 2 == 0 else (.5, .5, 1.10, 1.0, .5))
        cuts.append((s['p'], s['label'], a, caps, chip, trans, kb))
    for idx, c in enumerate(cuts):   # 구간 경계에서만 휙(외관→실내, 실내→카드, 카드→딜러)
        if idx and (c[5] in ('zoom', 'flash', 'whip_l')):
            whoosh.append(idx)
    opts = L['options']
    lo = {}
    if any(s.get('seat') for s in S):
        for key, oid in (('열선시트', 'seat_heat'), ('통풍시트', 'seat_vent'), ('전동시트', 'seat_power'), ('안마시트', 'seat_massage'), ('메모리시트', 'seat_memory')):
            if any(o.startswith(key) for o in opts):
                lo[oid] = {}
        if any(o.startswith('가죽시트') for o in opts):
            lo['seat_material'] = {'material': '가죽'}
    km = cards['report'].get('km', '')
    tag = re.sub(r'[^a-z0-9]', '', os.path.basename(car.rstrip('/')).lower())
    cfg = f'''# 자동 생성(sag_auto.py, {L['maker']} {L['name']}) — 사실 출처: listing.json(서울오토갤러리 등록 옵션 class="on") · cards.json(성능기록부 체크값)
OUT = 'bobae_sag_auto_{tag}.mp4'
SPEED = 1.1
HOOK = ({L['maker']!r}, {model_name(L['name'])!r}, {f"{str(L['year'])[2:]}년{L['month']}월 · {km}km"!r})
HOOK_HIDE_CAPS = False
HOOK_DROP = True
CAPS_ALWAYS = True
CAPS_UNDER_PHOTO = True
CHIP_Y = 470
FIT = [1, 2, 3, 18, 19]
WHOOSH_AT = {whoosh!r}
SFX_RICH = True
AUTO_VISUALS = True
AUTO_ZOOM = True
PUNCH = 0.06
BEAT_SNAP = True
LISTING_OPTIONS = {lo!r}
DEALER_LOGO = None
DEALER_CHIP = '서울오토갤러리'
DEALER_CHIP_LINES = ['서울오토갤러리', {f"{company(L['company'])} {L['dealer']} 딜러"!r}]
DEALER_FOOTER = True
DEALER_FOOTER_STYLE = 'text'
MARKS = {marks!r}
SECTIONS = [({card_ids!r}, '성능점검', 282)]
SECTION_TOP = True
CAP_CY_PHOTOS = {dict((p, 1730) for p in card_ids)!r}
B = '|'
CUTS = [
'''
    for c in cuts:
        cfg += f'    {c!r},\n'
    cfg += ']\n'
    open(os.path.join(car, 'cfg.py'), 'w').write(cfg)
    print(f'cfg.py: 컷 {len(cuts)}개, 휙 {whoosh}, 옵션 {list(lo)}')


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'prep':
        prep(os.path.abspath(sys.argv[2]), sys.argv[3])
    elif cmd == 'cfg':
        make_cfg(os.path.abspath(sys.argv[2]))
