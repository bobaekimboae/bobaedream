"""보배드림 자동 편집기 — 매물 정보 + 원본 장면 목록 → 네덜란드판/벨기에판 편집 설정 (사람 없이).

규칙: auto_edit_rules.json (옵션 칩 노출 규칙·옵션 사전·부위별 칩 자리·대본 순서·재교정 목표)
렌더: ../sag_reel_v1.py (EDIT_PRESETS bobae_nl · bobae_be)

순서
  1) python3 auto_edit.py script facts.json --style bobae_nl --out OUT
       → OUT/tts.txt (일레븐랩스에 넣을 대본), OUT/plan.json
  2) 일레븐랩스로 음성 만들기 → OUT/voice.mp3, 받아쓰기 → OUT/words.json ([{text,start,end}] 또는 [[s,e,text]])
  3) python3 auto_edit.py build facts.json shots.json --style bobae_nl --out OUT
       → OUT/config.py (CAR · HOOK · BLOCKS · SHOW · MARKS · STYLE), 장면은 실제 말 길이에 맞춰 고름
  4) SAG_CONFIG=OUT/config.py SAG_VOICE_FILE=OUT/voice.mp3 SAG_VOICE_WORDS=OUT/words_flat.json python3 ../sag_reel_v1.py SRC OUT/render
  5) python3 calibrate.py OUT  → 원본 측정값과 비교

facts.json: {"id","make","model","gen","trim","color","reg":"23년06월","year":2023,"km":1480,"fuel":"가솔린",
             "engine":"4.0 V8 트윈터보","power_ps":510,"price_manwon":17390,"options":["통풍시트",...],"region":"경기"}
shots.json: [{"t0":0.0,"t1":1.6,"part":"exterior_3_4","score":0.9}, ...]  (원본 영상 장면 + 부위, shot_tagger.py가 만듦)
"""
import json, os, re, sys, argparse, hashlib, difflib

HERE = os.path.dirname(os.path.abspath(__file__))
RULES = json.load(open(os.path.join(HERE, 'auto_edit_rules.json'), encoding='utf-8'))
CAT = {o['name']: o for o in RULES['option_catalog']}

# ── 숫자 읽기 (TTS는 한글, 화면은 숫자) ──
DIG = '영일이삼사오육칠팔구'
def _four(n):
    s = ''
    for v, u in ((1000, '천'), (100, '백'), (10, '십'), (1, '')):
        d = n // v % 10
        if d:
            s += ('' if d == 1 and u else DIG[d]) + u
    return s
def num_ko(n):
    n = int(n)
    if n == 0:
        return '영'
    out = ''
    for v, u in ((10 ** 8, '억'), (10 ** 4, '만'), (1, '')):
        q = n // v % 10000
        if q:
            out += ('' if q == 1 and u == '만' else _four(q)) + u
    return out

ABC = dict(A='에이', B='비', C='씨', D='디', E='이', F='에프', G='지', H='에이치', I='아이', J='제이', K='케이', L='엘', M='엠', N='엔',
           O='오', P='피', Q='큐', R='알', S='에스', T='티', U='유', V='브이', W='더블유', X='엑스', Y='와이', Z='제트')
def read_ko(tok):
    """TTS용 읽기: 4.0 → 사점영, V8 → 브이에잇, 510 → 오백십. 한글은 그대로"""
    def numread(m):
        a, _, b = m.group(0).partition('.')
        return num_ko(int(a)) + ('점' + ''.join(DIG[int(c)] for c in b) if b else '')
    def latin(m):
        w = m.group(0)
        if w.upper() == 'V' and m.end() < len(tok) and tok[m.end()].isdigit():
            return '브이'
        return ''.join(ABC.get(c.upper(), c) for c in w)
    out = re.sub(r'[A-Za-z]+', latin, tok)
    out = re.sub(r'(?<=브이)(\d+)', lambda m: {'6': '식스', '8': '에잇', '10': '텐', '12': '트웰브'}.get(m.group(1), num_ko(int(m.group(1)))), out)
    return re.sub(r'\d+(?:\.\d+)?', numread, out)

def has_final(word):
    ch = word.rstrip()[-1]
    if '가' <= ch <= '힣':
        return (ord(ch) - 0xAC00) % 28 != 0
    lw = re.search(r'[A-Za-z]+$', word.rstrip())
    if lw:  # 로마자로 끝나는 차명: 단어처럼 읽히는 끝말은 규칙표(josa_latin), 아니면 마지막 글자 읽기(엘·엠·엔·알만 받침)
        for suf, fin in RULES['script'].get('josa_latin', {}).items():
            if lw.group(0).upper().endswith(suf):
                return fin
    return ch.lower() in 'lmnr136780' or ch in 'LMNR'
def josa(word, a, b):  # a = 받침 있을 때(이에요/은/이), b = 없을 때(예요/는/가)
    return word + (a if has_final(word) else b)

def km_show(km):
    return f'{km:,}km'
def price_parts(manwon):
    eok, man = divmod(int(manwon), 10000)
    say, show = [], []
    if eok:
        say.append(num_ko(eok) + '억'); show.append(f'{eok}억')
    if man:
        say.append(num_ko(man) + '만'); show.append(f'{man:,}만')
    return say, show

def pick(variants, key):
    h = int(hashlib.md5(key.encode()).hexdigest(), 16)
    return variants[h % len(variants)]


def line(o, field, key):
    """2026-11-10 대사 은행(노션 「숏폼 편집 자동화, 발음 대사 설명 자동화」): 옵션마다 같은 설명을 5~10가지로.
    option_catalog 항목에 `<field>_variants`(목록)가 있으면 매물 번호(key)로 하나를 고르고, 없으면 기존 한 문장(`<field>`)을 쓴다.
    같은 매물은 늘 같은 문장(다시 만들어도 바뀌지 않음), 매물이 다르면 다른 문장이 나온다"""
    vs = [v for v in (o.get(field + '_variants') or []) if v]
    return pick(vs, f'{key}:{o.get("name", "")}:{field}') if vs else o.get(field)


# ── 1단계: 대본 ──
def make_script(F, style, shots=None):
    long = bool(shots) and max(x['t1'] for x in shots) >= RULES['script'].get('long_source_s', 40)
    """블록 목록: dict(sec, words=[(tts어절, 화면어절)], caps=[어절수...], stickers=[(칩, 구절번호, {band,part,list})], parts=[구절별 원하는 부위 목록])"""
    name = car_name(F)
    key = F.get('id', name)
    blocks = []

    def blk(sec, phrases, stickers=(), parts=None, **kw):
        # phrases: [[(say, show), ...], ...] 구절마다 어절 묶음
        words = [w for ph in phrases for w in ph]
        blocks.append(dict(sec=sec, words=words, caps=[len(ph) for ph in phrases], phrases=phrases,
                           stickers=list(stickers), parts=parts or [RULES['script']['parts_for_section'].get(sec, ['other'])] * len(phrases), **kw))

    W = lambda s: [(w, w) for w in s.split()]
    digits = RULES['voice'].get('numbers') == 'digits'  # eleven_v4: 숫자는 글로 쓴 그대로 넘겨야 사람처럼 읽는다(한글로 풀면 또박또박 기계처럼 읽음)
    N = lambda ko, d: d if digits else ko
    # 첫 화면
    color = F.get('color')
    FM = RULES['script'].get('speech') == 'formal'  # 2026-11-10 사용자 지시 「입니다로」: 합니다체(나사르 한국어 자막 말투)
    hook_end = (F['model'] + '입니다!') if FM else josa(F['model'], '이에요!', '예요!')
    first = (W('자,') if RULES['script'].get('tone') == 'young' else W('보배드림 여러분,')) if style == 'bobae_nl' else []
    phrases = ([first] if first else []) + [W(f"오늘은 {color}" if color else '오늘은'), W(f"{F['make']} {hook_end}")]
    blk('hook', phrases, hook=True)
    # 외관·주행
    st = []
    if F.get('km') is not None:
        km = int(F['km'])
        say = N(num_ko(km), f'{km:,}')
        tail_s, tail_d = ('킬로밖에', 'km밖에') if km < 30000 else (('킬로입니다.', 'km입니다.') if FM else ('킬로예요.', 'km예요.'))
        num = [(say + tail_s, f'{km:,}' + tail_d)] if digits else [(say, f'{km:,}'), (tail_s, tail_d)]
        ph = [[('주행은', '주행은')] + num] + ([W('안 탔습니다.' if FM else '안 탔거든요.')] if km < 30000 else [])
        st.append((f'주행 {km_show(km)}', 0, {}))
        blk('exterior', ph, st)
    # 동력
    if style == 'bobae_nl' and (F.get('engine') or F.get('power_ps')):
        ph, st = [], []
        if F.get('engine'):
            eng = F['engine']
            ew = eng.split()
            tail = '에' if F.get('power_ps') else ('입니다.' if FM else '예요.')
            rk = (lambda w: w) if digits else read_ko
            ph.append([(rk(w), w) for w in ew[:-1]] + [(rk(ew[-1]) + tail, ew[-1] + tail)])
            st.append((eng, 0, {}))
        if F.get('power_ps'):
            ps = int(F['power_ps'])
            _mt = ('마력이고,' if long and F.get('drive') else '마력입니다.') if FM else '마력이고요.'
            ph.append([(f'{ps}{_mt}', f'{ps}{_mt}')] if digits else [(num_ko(ps), str(ps)), (_mt, _mt)])
            st.append((f'{ps}마력', len(ph) - 1, {}))
        if long and F.get('drive'):  # 긴 원본: 구동 방식 한 구절 더(매물 정보에 있을 때만)
            ph.append(W(f"{F['drive']} 구동입니다." if FM else f"{F['drive']} 구동이에요."))
            st.append((f"{F['drive']} 구동", len(ph) - 1, {}))
        blk('power', ph, st)
    # 옵션 (가장 중요): 고르기 → 한 옵션 = 한 구절 = 한 장면
    opts = select_options(F, style, shots, long)
    if opts:
        ph, st, parts = [], [], []
        n = len(opts)
        ends = RULES['script'].get('option_sentence_ends', ['들어가 있고요.', '있어요.'])
        young = RULES['script'].get('tone') == 'young'
        for i, o in enumerate(opts):
            sw = o['say'].split()
            if young and o.get('benefit') and not o.get('feature'):
                # 나사르식(2026-11-10): 옵션 이름 + 그게 뭘 해 주는지 한 문장. 연결은 「~가 있어서」·「~는」을 번갈아
                last = josa(sw[-1], '이 있어서', '가 있어서') if i % 2 == 0 else josa(sw[-1], '은', '는')
                ws = [(w, w) for w in sw[:-1]] + [(last.split()[0], last.split()[0])] + [(w, w) for w in last.split()[1:]] + W(line(o, 'benefit', key))
                ph.append(ws)
                st.append((o['chip'], i, {'part': o['parts'][0], 'list': True, 'option': o['name']}))
                parts.append(o['parts'])
                continue
            if long and n > 1:  # 긴 원본: 옵션마다 한 문장(장면을 길게 보여 줄 말), 끝말은 돌려 쓴다
                if i == n - 1:
                    tail, more = '까지', W('다 들어가 있어요.')
                else:  # 끝말 돌려쓰기: [조사, 끝말] — 「~가 들어가 있고요 / ~도 있어요」처럼 같은 끝말이 이어지지 않게
                    jp, en = ends[i % len(ends)]
                    tail = josa(sw[-1], '이', '가')[len(sw[-1]):] if jp == '이가' else jp
                    more = W(en)
                ws = [(w, w) for w in sw[:-1]] + [(sw[-1] + tail, sw[-1] + tail)] + more
                ph.append(ws)
                st.append((o['chip'], i, {'part': o['parts'][0], 'list': True, 'option': o['name']}))
                parts.append(o['parts'])
                continue
            tail = '까지' if i == n - 1 and n > 1 else ('에' if i < n - 1 else '')
            ws = [(w, w) for w in sw[:-1]] + [(sw[-1] + tail, sw[-1] + tail)]
            ph.append(ws)
            st.append((o['chip'], i, {'part': o['parts'][0], 'list': True, 'option': o['name']}))
            parts.append(o['parts'])
        only_feat = all(o.get('feature') for o in opts)
        if not (long and n > 1) and not (young and all(o.get('benefit') and not o.get('feature') for o in opts)):
          ph.append(W('갖췄어요.' if only_feat else ('다 들어가 있어요.' if n > 1 else '들어가 있어요.')))
          parts.append(['interior_dash', 'seats_front', 'console'])
        blk('options', ph, st, parts=parts)
    # 판매 조건
    ph, st = [], []
    if F.get('reg'):
        m = re.match(r'(\d+)년(\d+)월', F['reg'])
        if m:
            y, mo = int(m.group(1)), int(m.group(2))
            ph.append([(N(num_ko(y), str(y)) + '년', f'{y}년'), (N(num_ko(mo), str(mo)) + '월에', f'{mo}월에'), ('등록됐고,', '등록됐고,')])
            st.append((f'{int(m.group(1))}년 {int(m.group(2))}월 등록', 0, {}))
    if F.get('price_manwon'):
        say, show = price_parts(F['price_manwon'])
        if digits:
            say = show
        ws = [('가격은', '가격은')] + list(zip(say, show)) + ([('원입니다.', '원입니다')] if FM else [('원이에요.', '원이에요')])
        ph.append(ws)
        st.append((' '.join(show) + '원', len(ph) - 1, {}))
    if ph:
        blk('condition', ph, st)
    # 마무리
    cta = pick(['자세한 건 보배드림 앱에서 확인하세요!', '보배드림 앱에서 바로 확인하세요!'] if FM else ['자세한 건 보배드림 앱에서 확인해 보세요!', '보배드림 앱에서 바로 확인해 보세요!'], key)
    cw = W(cta)
    half = max(1, len(cw) // 2)
    blk('cta', [cw[:half], cw[half:]], [('보배드림 앱', 0, {})] if '앱' in cta else [], end=True)
    return blocks


def gen_name(F):
    """세대 표기. 2026-11-10 사용자 지시 「BMW·벤츠·포르쉐 말고는 코드네임 안 쓴다」:
    그 밖의 제조사는 세대 글자에서 코드네임(L460·(W213)·G30 같은 영문+숫자)을 지우고 「5세대」만 남긴다(규칙 script.codename_makes)"""
    g = F.get('gen') or ''
    if not g or F['make'] in RULES['script'].get('codename_makes', []):
        return g
    g = re.sub(r'\([^)]*\)', '', g)
    g = ' '.join(w for w in g.split() if not re.fullmatch(r'[A-Za-z]{1,3}\d{1,4}[A-Za-z]?', w))
    return g.strip()


def car_name(F):
    """차 이름. 2026-11-10 사용자 지시 「랜드로버는 한국서 뺀다」: 한국에서 모델명만 부르는 제조사는 규칙 script.name_drop_make"""
    if F['make'] in RULES['script'].get('name_drop_make', []):
        return F['model']
    return f"{F['make']} {F['model']}"


def make_script_nasser(F, style, shots=None):
    """2026-11-10 사용자 지시 「나세르처럼 대사 바꿔」 「입니다로」 「AI 티 제거」.
    근거: 시트 「나사르헤시엔_유튜브」 한국어 자막(reports/shortform/as24-reviewer-nasser 130편).
    나사르 말투: ① 첫 줄에 「~를 원하신다면… 차 이름!」 ② 합니다체, 끝을 「~입니다/~죠/~됩니다」로 섞음
    ③ 옵션마다 그게 뭘 해 주는지 한 문장 ④ 숫자 제원은 기능 뒤에 몰아서 ⑤ 끝은 「~에서 만나보세요」.
    사실만 쓴다: 옵션은 매물 옵션표, benefit은 그 옵션의 일반 기능, 첫 줄 「~를 원하신다면」은 차종(body)으로만 고른다"""
    long = bool(shots) and max(x['t1'] for x in shots) >= RULES['script'].get('long_source_s', 40)
    name = car_name(F)
    blocks = []

    def blk(sec, phrases, stickers=(), parts=None, **kw):
        words = [w for ph in phrases for w in ph]
        blocks.append(dict(sec=sec, words=words, caps=[len(ph) for ph in phrases], phrases=phrases,
                           stickers=list(stickers), parts=parts or [RULES['script']['parts_for_section'].get(sec, ['other'])] * len(phrases), **kw))
    W = lambda t: [(w, w) for w in t.split()]
    def ro(word):  # 으로/로
        if not has_final(word):
            return word + '로'
        c = word[-1]
        return word + ('로' if ('가' <= c <= '힣' and (ord(c) - 0xAC00) % 28 == 8) else '으로')
    # ① 첫 줄
    angle = RULES['script'].get('nasser_hook', {}).get(F.get('body', ''), '')
    color = F.get('color')
    ph = []
    if angle:
        ph.append(W(angle + '…'))
    LUX = os.environ.get('SAG_TONE', RULES['script'].get('tone_override', '')) == 'luxury'
    if LUX:
        # 2026-11-10 사용자 지시 「고급스럽게, 오토스카우트 영상 보는 것처럼」: 첫 줄은 차종 질문 대신 차 이름을 또박또박
        # (세대·트림은 매물 정보 그대로, 읽기만 rules luxury.trim_say로 풀어 읽음)
        lx = RULES['script'].get('luxury', {})
        ph = [W(f"{color} {name}." if color else f"{name}.")]
        tr = ' '.join(x for x in (gen_name(F), F.get('trim')) if x)
        if tr:
            say = ' '.join(lx.get('trim_say', {}).get(w, w) for w in tr.split())
            ph.append(list(zip((say + '.').split(), (tr + '.').split())))  # 말은 풀어 읽고, 자막은 매물 표기 그대로(P530 AB LWB)
    else:
        ph.append(W(f"{color} {name}!" if color else f"{name}!"))
    blk('hook', ph, hook=True)
    # 주행거리
    if F.get('km') is not None:
        km = int(F['km'])
        if LUX and km < RULES['script'].get('luxury', {}).get('new_km', 1000):
            nl_ = os.environ.get('SAG_NEW_LINE', RULES['script'].get('luxury', {}).get('new_line', '사실상 새 차입니다.'))  # 60초판은 빈 값(SAG_NEW_LINE=)
            blk('exterior', [[('주행거리', '주행거리'), (f'{km:,}km.', f'{km:,}km.')]] + ([W(nl_)] if nl_ else []), [(f'주행 {km_show(km)}', 0, {})])
            km = None
    if F.get('km') is not None and not (LUX and int(F['km']) < RULES['script'].get('luxury', {}).get('new_km', 1000)):
        km = int(F['km'])
        tail = 'km밖에 안 됩니다.' if km < 30000 else 'km입니다.'
        blk('exterior', [[('주행거리는', '주행거리는')] + [(f'{km:,}' + tail.split()[0], f'{km:,}' + tail.split()[0])] + W(' '.join(tail.split()[1:]))] if len(tail.split()) > 1 else [[('주행거리는', '주행거리는'), (f'{km:,}{tail}', f'{km:,}{tail}')]],
            [(f'주행 {km_show(km)}', 0, {})])
    # ③ 옵션: 한 옵션 = 한 문장 = 한 장면
    opts = select_options(F, style, shots, long)
    if opts:
        ph, st, parts = [], [], []
        for i, o in enumerate(opts):
            sw = o['say'].split()
            if o.get('line'):
                # 2026-11-10 사용자 지시 「기능 옵션 설명 자연스럽게」: 영상에 보이는 특징은 facts features[].line 문장 그대로 말한다
                ws = W(o['line'])
            elif o.get('feature') or not o.get('benefit_f'):
                ws = [(w, w) for w in sw] + W('도 갖췄습니다.' if not has_final(sw[-1]) else '도 갖췄습니다.')
                ws = [(w, w) for w in sw[:-1]] + [(sw[-1] + '도', sw[-1] + '도'), ('갖췄습니다.', '갖췄습니다.')]
            else:
                lastw = josa(sw[-1], '이', '가') + ' 있어' if i % 2 == 0 else josa(sw[-1], '은', '는')  # 「~가 있어」·「~는」 번갈아
                head = [(w, w) for w in sw[:-1]] + [(x, x) for x in lastw.split()]
                ws = head + W(line(o, 'benefit_f', F.get('id', name)))
            ph.append(ws)
            st.append((o['chip'], i, {'part': o['parts'][0], 'list': True, 'option': o['name']}))
            parts.append(o['parts'])
        blk('options', ph, st, parts=parts)
    # ④ 제원(기능 뒤에)
    if style == 'bobae_nl' and (F.get('engine') or F.get('power_ps')):
        ph, st = [], []
        eng, ps = F.get('engine'), F.get('power_ps')
        if eng and ps:
            ew = eng.split()
            tail = ('을' if has_final(ew[-1]) else '를') if False else ''
            _e = ew[-1] if '엔진' in eng else ew[-1] + ' 엔진'
            ph.append([(w, w) for w in ew[:-1]] + [(x, x) for x in (_e.split()[:-1] + [ro(_e.split()[-1])])])
            st.append((eng, 0, {}))
            last = f'{int(ps)}마력을 내고,' if long and F.get('drive') else f'{int(ps)}마력을 냅니다.'
            ph.append(W(last))
            st.append((f'{int(ps)}마력', len(ph) - 1, {}))
        elif ps:
            ph.append(W(f'최고출력은 {int(ps)}마력입니다.'))
            st.append((f'{int(ps)}마력', 0, {}))
        elif eng:  # 2026-11-10 차란차 매물: 마력 정보 없음 → 배기량·연료(매물 정보)만, 구동이 있으면 이어서
            ph.append(W(f"{eng} 엔진에, {F['drive']} 구동입니다." if F.get('drive') else f'{eng} 엔진입니다.'))
            st.append((eng, 0, {}))
        if long and F.get('drive') and ps:
            ph.append(W(f"{F['drive']} 구동입니다."))
            st.append((f"{F['drive']} 구동", len(ph) - 1, {}))
        if ph:
            blk('power', ph, st)
    # 등록·가격
    ph, st = [], []
    if F.get('reg'):
        m = re.match(r'(\d+)년(\d+)월', F['reg'])
        if m:
            y, mo = int(m.group(1)), int(m.group(2))
            ph.append([(f'{y}년', f'{y}년'), (f'{mo}월', f'{mo}월'), ('등록이고,', '등록이고,')])
            st.append((f'{y}년 {mo}월 등록', 0, {}))
    if F.get('price_manwon'):
        say, show = price_parts(F['price_manwon'])
        ph.append([('가격은', '가격은')] + list(zip(show, show)) + [('원입니다.', '원입니다.')])
        st.append((' '.join(show) + '원', len(ph) - 1, {}))
    if ph:
        blk('condition', ph, st)
    # ⑤ 끝
    blk('cta', [W('보배드림 앱에서 자세한 정보를 보시거나,'), W('구글·애플 스토어에서 다운받으세요!')], [('보배드림 앱', 0, {})], end=True)  # 2026-11-10 사용자 지시
    return blocks


def select_options(F, style, shots, long=False):
    ex = RULES['option_exposure']
    cap = ex['max_per_video'][style] + (ex.get('long_extra', {}).get(style, 0) if long else 0)
    if os.environ.get('SAG_TONE', RULES['script'].get('tone_override', '')) == 'luxury' and long:
        cap = max(cap, RULES['script'].get('luxury', {}).get('max_options_long', cap))  # 긴 원본(66초)을 기능 설명으로 채운다
    have = set(s['part'] for s in (shots or []))
    cand = []
    for nm in F.get('options', []):
        o = CAT.get(nm)
        if not o:
            continue
        if shots is not None:
            if o['visible'] and not (have & set(o['parts'])):
                continue  # 그 부위 장면이 없으면 칩을 띄우지 않는다
            if not o['visible'] and not (have & {'screen', 'interior_dash', 'steering_wheel'} | (have & set(o['parts']))):
                continue
        cand.append(o)
    for f in F.get('features', []):  # 영상에 보이는 특징(옵션표 밖): 그 부위 장면이 있을 때만
        if shots is not None and f['part'] not in have:
            continue
        cand.append(dict(name=f['chip'], chip=f['chip'], say=f.get('say', f['chip']), line=f.get('line'), parts=[f['part']], tier=1, visible=True, feature=True))
    cand.sort(key=lambda o: (o['tier'], not o['visible']))
    out, used, rest = [], set(), []
    for o in cand:  # 같은 부위만 몰리지 않게: 원본에 있는 부위 중 아직 안 쓴 부위를 그 옵션의 장면으로
        ps = [p for p in o['parts'] if shots is None or p in have] or o['parts']
        free = [p for p in ps if p not in used]
        if not free:
            rest.append(dict(o, parts=ps)); continue
        out.append(dict(o, parts=[free[0]] + [p for p in ps if p != free[0]])); used.add(free[0])
        if len(out) >= cap:
            return out
    for o in rest:  # 부위가 겹쳐도 자리가 남으면 넣는다(같은 부위 다른 구간)
        if len(out) >= cap:
            break
        out.append(o)
    out.sort(key=lambda o: (o['tier'], not o['visible']))
    return out


DIG = '공일이삼사오육칠팔구'


def pron(tok):
    """화면 낱말 → 목소리 읽기(규칙 pronounce). 끝 문장부호·조사는 그대로 둔다"""
    P = RULES.get('pronounce', {})
    m = re.match(r'^(.*?)([!?.,…]*)$', tok)
    core, punc = m.group(1), m.group(2)
    for k in sorted(P.get('words', {}), key=len, reverse=True):
        if k in core:
            core = core.replace(k, P['words'][k])
    def dec(x):  # 2026-11-10: 13.7인치가 「1삼점칠」로 읽히던 문제 → 정수부는 십삼, 소수부는 한 자리씩
        n = int(x.group(1))
        ip = DIG[n] if n < 10 else ('' if n // 10 == 1 else DIG[n // 10]) + '십' + (DIG[n % 10] if n % 10 else '')
        return ip + '점' + ''.join('영' if d == '0' else DIG[int(d)] for d in x.group(2))
    core = re.sub(r'(?<![\d,])(\d{1,2})\.(\d+)', dec, core)
    def model(x):
        return ''.join(P['letters'].get(c, c) for c in x.group(1)) + ''.join(DIG[int(d)] for d in x.group(2))
    core = re.sub(r'\b([A-Z]{1,3})(\d{2,3})\b', model, core)
    return core + punc


def apply_pron(blocks):
    """모든 블록의 (목소리, 화면) 쌍에서 목소리 쪽만 바꾼다. 두 낱말짜리 규칙(씨라이언 7 → 세븐)은 앞 낱말과 함께 본다"""
    big = RULES.get('pronounce', {}).get('bigrams', {})
    def fix(ws):
        out = []
        for i, w in enumerate(ws):
            t = w[0]
            if i and big:
                prev = re.sub(r'[!?.,…]+$', '', ws[i - 1][1]); cur = re.sub(r'[!?.,…]+$', '', t); punc = t[len(cur):]
                key = f'{prev} {cur}'
                if key in big:
                    out.append((big[key].split(' ', 1)[1] + punc, w[1])); continue
            out.append((pron(t), w[1]))
        return out
    for b in blocks:
        b['words'] = fix(b['words'])
        b['phrases'] = [fix(ph) for ph in b['phrases']]
        if b['words'] and len(b['words']) > 1:  # 구절 경계를 넘는 두 낱말 규칙은 words 기준으로 phrases에 반영
            flat = [w for ph in b['phrases'] for w in ph]
            if len(flat) == len(b['words']):
                k = 0
                for ph in b['phrases']:
                    for j in range(len(ph)):
                        ph[j] = b['words'][k]; k += 1
    return blocks


def tts_text(blocks):
    """일레븐랩스에 넘길 글. 감정 태그는 바뀌는 곳에만(규칙 voice.tags) — 자막·낱말 시각에는 들어가지 않는다"""
    tags = RULES['voice'].get('tags', {})
    out = []
    for b in blocks:
        t = ' '.join(w[0] for w in b['words'])
        out.append((tags[b['sec']] + ' ' + t) if tags.get(b['sec']) else t)
    return ' '.join(out)


def chip_budget(blocks, style, dur_s):
    """칩 수를 원본 범위(재교정 목표 chips_per_min 위 끝) 안으로. 지우는 순서: 낮은 우선순위부터.
    옵션 칩은 가장 나중에 지운다(가장 중요). 우선순위 = 규칙 chip_priority"""
    lo, hi = RULES['calibration'][style]['chips_per_min']
    cap = int(((lo + hi) / 2 + hi) / 2 * dur_s / 60)  # 가운데 절반의 위쪽 3/4 지점: 위 끝에 붙으면 길이 오차로 넘친다
    pri = RULES['chip_priority']
    allc = [(bi, si) for bi, b in enumerate(blocks) for si, _ in enumerate(b['stickers'])]
    def rank(k):
        b = blocks[k[0]]; txt, _, m = b['stickers'][k[1]]
        if m.get('option'): return pri['option']
        if '만원' in txt: return pri['price']
        if 'km' in txt: return pri['km']
        if '마력' in txt: return pri['power']
        if '등록' in txt: return pri['reg']
        if '앱' in txt: return pri['app']
        return pri['other']
    drop = sorted(allc, key=rank)[:max(0, len(allc) - cap)]
    for bi, si in sorted(drop, reverse=True):
        del blocks[bi]['stickers'][si]
    return [blocks[bi]['sec'] for bi, _ in drop]


# ── 2단계: 말 길이에 맞춰 장면 고르기 ──
def load_words(path):
    d = json.load(open(path, encoding='utf-8'))
    d = d.get('words', d) if isinstance(d, dict) else d
    out = []
    for w in d:
        if isinstance(w, dict):
            out.append((float(w['start']), float(w['end']), w['text']))
        else:
            out.append((float(w[0]), float(w[1]), w[2]))
    return [w for w in out if w[2].strip()]

def phrase_times(blocks, words):
    norm = lambda t: re.sub(r'[^0-9A-Za-z가-힣]', '', t)
    sc, st = [], []
    for s, e, t in words:
        t = norm(t)
        for k, ch in enumerate(t):
            sc.append(ch); st.append(s + (e - s) * k / max(1, len(t)))
    bc, own = [], []
    for bi, b in enumerate(blocks):
        pi = 0
        for ph in b['phrases']:
            for w in ph:
                for ch in norm(w[0]):
                    bc.append(ch); own.append((bi, pi))
            pi += 1
    sm = difflib.SequenceMatcher(None, ''.join(bc), ''.join(sc), autojunk=False)
    mp = [None] * len(bc)
    for a0, b0, n in sm.get_matching_blocks():
        for k in range(n):
            mp[a0 + k] = st[b0 + k]
    known = [i for i, v in enumerate(mp) if v is not None]
    for i in range(len(mp)):
        if mp[i] is None:
            lo = max([k for k in known if k < i], default=None); hi = min([k for k in known if k > i], default=None)
            mp[i] = mp[hi] if lo is None else (mp[lo] + 0.08 * (i - lo) if hi is None else mp[lo] + (mp[hi] - mp[lo]) * (i - lo) / (hi - lo))
    first = {}
    for i, o in enumerate(own):
        first.setdefault(o, mp[i])
    keys = sorted(first)
    end_t = words[-1][1] if words else 0
    out = {}
    for j, k in enumerate(keys):
        out[k] = (first[k], first[keys[j + 1]] if j + 1 < len(keys) else end_t)
    return out

STYLE_MIN = {k: v[0] for k, v in ((k, RULES['calibration'][k]['shot_med_s']) for k in ('bobae_nl', 'bobae_be'))}
# 장면을 이어 쓰는 기준: 원본 장면 길이 가운데(p25~p75의 중간). 최소값으로 자르면 장면이 원본보다 짧아진다(GLE 긴 원본 시험 1.8초)
STYLE_TARGET = {k: round(sum(RULES['calibration'][k]['shot_med_s']) / 2, 3) for k in ('bobae_nl', 'bobae_be')}
def style_of(blocks):
    return blocks[0].get('_style', 'bobae_nl')


def merge_shots(shots):
    """붙어 있는 같은 부위 장면을 하나로 합친다(트렁크 2.6초 + 2.7초 → 5.3초). 장면이 짧게 쪼개져 있으면
    구절이 장면 끝을 넘어 다음 부위(바퀴·트렁크)가 비쳐 칩·말과 화면이 어긋난다(2026-11-10 차란차 02 「2.5 가솔린」이 바퀴 위)"""
    SF = RULES.get('shot_fit', {})
    out = []
    for s in sorted(shots, key=lambda x: x['t0']):
        if SF.get('merge_same_part', True) and out and out[-1]['part'] == s['part'] and abs(out[-1]['t1'] - s['t0']) < SF.get('merge_gap_s', 0.05):
            out[-1] = dict(out[-1], t1=s['t1'], score=max(out[-1].get('score', 0.5), s.get('score', 0.5)))
        else:
            out.append(dict(s))
    return out


def fit_in_shot(s, start, need, fit):
    """장면 끝을 넘지 않게 (시작, 속도)를 정한다. 남은 길이가 모자라면 천천히(최저 MIN_SPEED) 틀고,
    그래도 모자라면 같은 장면 안에서 시작을 앞으로 당긴다. 장면 밖(다음 부위·영상 끝 검은 화면)으로 넘치지 않음"""
    SF = RULES.get('shot_fit', {})
    left = s['t1'] - start
    sp = min(1.0, max(fit, left / need))
    if not SF.get('clamp_to_part', True):
        return round(start, 2), round(sp, 2)
    m = SF.get('edge_margin_s', 0.04)
    if need * sp > left - m:
        sp = max(SF.get('min_speed', 0.4), min(1.0, (left - m) / need))
        if need * sp > left - m and SF.get('pull_start_when_short', True):  # 시작을 당겨 장면 안에서 끝나게
            start = max(s['t0'], s['t1'] - m - need * sp)
    return round(start, 2), round(sp, 2)


def apply_missing(blocks, shots):
    """원하는 첫 부위가 원본 영상에 없을 때의 처리(규칙 shot_fit.missing_part)와 촬영 필요 부위 목록(shot_fit.required_shots).
    drop_phrase(그 문장 빼기)는 대본을 만들 때 옵션 문장에 이미 적용된다(보이지 않는 옵션은 말하지 않음). 그 밖 구간에서는 drop_chip으로 처리"""
    if not shots:
        return []
    SF = RULES.get('shot_fit', {})
    have = {s['part'] for s in shots}
    for b in blocks:
        pol = SF.get('missing_part', {}).get(b['sec'], 'fallback')
        for pi, want in enumerate(b.get('parts', [])):
            if want and want[0] not in have:
                b.setdefault('missing', []).append(want[0])
                if pol in ('drop_chip', 'drop_phrase'):
                    b['stickers'] = [x for x in b['stickers'] if x[1] != pi]
    return [p for p in SF.get('required_shots', {}).get('list', []) if p not in have]


def assign_shots(blocks, shots, times):
    """구절마다 원하는 부위 장면을 고른다(규칙 script.shot_cost). 말보다 짧으면 천천히(최소 0.6배) 튼다.
    2026-11-10: 장면은 절대 그 부위 구간 밖으로 넘치지 않는다(넘치면 칩·말과 화면이 어긋남)"""
    shots = merge_shots(shots)
    global FIT
    FIT = dict({'option': 0.5, 'default': 0.6}, **RULES.get('shot_fit', {}).get('fit_speed', {}))
    used = {}   # 장면 번호 → 다음에 쓸 수 있는 원본 시각
    prev = None
    run = 0.0   # 지금 장면이 이어진 길이(블록을 넘어 이어짐)
    for bi, b in enumerate(blocks):
        b['shot_tuples'], b['shot_parts'] = [], []
        optp = {x[1] for x in b['stickers'] if len(x) > 2 and x[2].get('option')}
        for pi, want in enumerate(b['parts']):
            s0, s1 = times.get((bi, pi), (0, 1.5))
            # 렌더러가 컷을 앞 낱말로 당기면(cut_early) 이 장면이 그만큼 일찍 시작해 길어진다 → 원본 장면을 넘쳐 다음 장면이 비치지 않게 여유를 잡는다
            need = max(0.6, s1 - s0)
            pad = 0 if bi == 0 and pi == 0 else RULES['script'].get('cut_early_pad', {}).get(style_of(blocks), 0)  # 새 장면에만(이어 쓰는 구절·영상 첫 장면은 당길 컷이 없다)
            # 장면 최소 길이(원본 중간값 아래로 자르지 않음): 짧은 구절은 앞 장면을 이어 쓴다. 옵션 구절은 예외(옵션 = 장면 하나)
            first_hold = bi == 0 and s0 < RULES['learned_l1'][style_of(blocks)]['first_cut_s'] - 0.3  # 원본: 첫 컷은 3.4~3.7초
            # 블록 경계에서도(앞 블록 끝 장면이 아직 짧으면) 이어 쓴다: 원본 컷의 60%는 구절 중간이고 블록마다 자르지 않는다
            prev_opt = (pi - 1) in optp if pi else bool(bi and any(x[1] == len(blocks[bi - 1]['parts']) - 1 and len(x) > 2 and x[2].get('option') for x in blocks[bi - 1]['stickers']))
            # 옵션 구절도 앞 장면이 그 옵션 부위를 이미 보여 주고 있으면 이어 쓴다(칩이 장면 중간에 뜸 — 원본 칩의 2/3는 장면 시작이 아닌 곳)
            opt_same = pi in optp and prev is not None and shots[prev]['part'] in want and run < STYLE_TARGET[style_of(blocks)] * 1.3
            if prev is not None and (pi or bi) and ((pi not in optp and not prev_opt) or opt_same) and (run < STYLE_TARGET[style_of(blocks)] or first_hold or opt_same):
                s = shots[prev]
                start = used[prev]
                if s['t1'] - start >= need * FIT['default']:
                    start, sp = fit_in_shot(s, start, need, FIT['default'])
                    b['shot_tuples'].append((start, sp, 0)); b['shot_parts'].append(s['part'])
                    used[prev] = start + need * sp; run += need
                    b.setdefault('cont', []).append(pi)
                    continue
            run = need
            need = need + pad
            # 앞을 내다본다: 이 장면이 이어서 덮을 짧은 구절(옵션 아님, 장면 목표 길이까지)도 들어갈 만큼 남은 원본 장면을 고른다
            # (GLE 시험: 「4륜 구동이에요.」 1.1초 구절이 새 장면이 되어 1.07초 장면이 생김)
            ahead, k = need, pi + 1
            while k < len(b['parts']) and k not in optp and ahead - pad < STYLE_TARGET[style_of(blocks)]:
                t_ = times.get((bi, k))
                if not t_:
                    break
                ahead += t_[1] - t_[0]; k += 1
            best = None
            for si, s in enumerate(shots):
                rank = want.index(s['part']) if s['part'] in want else (len(want) + 2)
                start = used.get(si, s['t0'] + (0 if s['t0'] == 0 else 0.15))  # 영상 맨 앞 장면은 앞 여유가 필요 없다
                left = s['t1'] - start
                reuse = 0 if si not in used else (0.5 if si == prev and left >= need * 0.6 else 5)
                fit = FIT['option'] if pi in optp else FIT['default']  # 옵션 구절은 그 부위 장면을 조금 더 천천히(0.5배까지) 틀어서라도 쓴다
                cost = rank * 2 + reuse - s.get('score', 0.5) + (0 if left >= need * fit else 14)  # 다 쓴 장면은 거의 마지막 수단
                if pi in optp and s['part'] not in want:
                    cost += 30  # 2026-11-10: 나사르식 긴 옵션 문장에서 「통풍 시트」 칩이 그릴 장면에 뜸 → 옵션 칩은 반드시 그 부위 장면 위에
                cost += 0 if left >= ahead * 0.6 else 3  # 다음 짧은 구절까지 못 덮으면 조금 불리
                if best is None or cost < best[0]:
                    best = (cost, si)
            si = best[1]
            s = shots[si]
            start = used.get(si, s['t0'] + (0 if s['t0'] == 0 else 0.15))
            fit = FIT['option'] if pi in optp else FIT['default']
            if s['t1'] - start < need * fit:  # 다 써 버린 장면: 처음부터 다시(어쩔 수 없을 때)
                start = s['t0'] + 0.15
            start, sp = fit_in_shot(s, start, need, fit)
            b['shot_tuples'].append((start, sp, 0))
            b['shot_parts'].append(s['part'])
            used[si] = start + need * sp
            prev = si
    return blocks


def write_config(F, blocks, style, path, segs=None):
    show, caps_out, B = {}, [], []
    for b in blocks:
        caps = []
        i = 0
        for ph in b['phrases']:
            caps.append(' '.join(w[1] for w in ph))
            for say, sh in ph:
                if say != sh:
                    show[say] = sh
        stickers = []
        for txt, pidx, meta in b['stickers']:
            band = RULES['part_band'].get(b.get('shot_parts', [None] * 99)[pidx] if b.get('shot_parts') else meta.get('part'), None) or RULES['part_band'].get(meta.get('part', ''), None)
            if style == 'bobae_be' and band == 'mid':
                band = 'top'  # BE 원본 칩: 위 44% · 아래 42% · 가운데 15%(1차 재학습)
            m = {k: v for k, v in meta.items() if k in ('list', 'option')}
            if band:
                m['band'] = band
            stickers.append((txt, pidx, m) if m else (txt, pidx))
        d = dict(sec=b['sec'], tts=' '.join(w[0] for w in b['words']), caps=caps, shots=b.get('shot_tuples') or [(0.2, 1.0, 0)] * len(caps), stickers=stickers)
        if b.get('hook'): d['hook'] = True
        if b.get('end'): d['end'] = True
        B.append(d)
    name = car_name(F)
    price = ' '.join(price_parts(F['price_manwon'])[1]) + '원' if F.get('price_manwon') else ''
    line2 = ' · '.join(x for x in [f"주행 {km_show(int(F['km']))}" if F.get('km') is not None else '', price] if x)
    # 원본 NL: 첫 화면 칩은 브랜드·모델 한 낱말(「LEXUS」)
    hook = dict(title=(name if F['make'] in RULES['script'].get('name_drop_make', []) else f"{F['make']} {F['model'].split()[0]}") if style == 'bobae_nl' else name, line1=' · '.join(x for x in [gen_name(F), F.get('engine', '')] if x) or (F.get('reg') or ''), line2=line2, size=100)
    car = dict(name=name, year=str(F.get('year', '')), reg=F.get('reg', ''), km=km_show(int(F['km'])) if F.get('km') is not None else '',
               km_short=km_show(int(F['km'])) if F.get('km') is not None else '', fuel=F.get('fuel', ''), price=price, region=F.get('region', ''),
               drive=F.get('engine', ''), gen=gen_name(F), color=F.get('color', ''))
    marks = {txt: '✓' for b in blocks for txt, _, m in b['stickers'] if m.get('list') and style == 'bobae_nl'}
    src = f"""# 자동 편집기(auto_edit.py)가 만든 설정. 손으로 고치지 말고 facts.json·shots.json·규칙을 고친 뒤 다시 만든다
exec(open('scripts/shortform/reels/vantage_s3.py', encoding='utf-8').read())  # 공통 STYLE 바탕(글꼴·칠·크기)
CAR = {json.dumps(car, ensure_ascii=False)}
HOOK = {json.dumps(hook, ensure_ascii=False)}
CAP_RULES = {json.dumps({k: v for k, v in RULES.get('captions', {}).items() if not k.startswith('_') and k != 'voice_check'})}  # 가변 규칙 captions(자막 빠짐 방지)
SHOT_FIT = {json.dumps({k: v for k, v in RULES.get('shot_fit', {}).items() if not k.startswith('_') and k in ('clamp_to_part', 'min_speed', 'pull_start_when_short', 'edge_margin_s', 'swap_same_part', 'hold_at_end')})}  # 가변 규칙 shot_fit(auto_edit_rules.json)
SEGS = {json.dumps([dict(t0=g['t0'], t1=g['t1'], part=g['part']) for g in (merge_shots(segs) if segs else [])], ensure_ascii=False)}  # 부위 구간: 렌더러가 장면을 이 안에서만 튼다(2026-11-10)
BLOCKS = {json.dumps(B, ensure_ascii=False, indent=1)}
SHOW = {json.dumps(show, ensure_ascii=False)}
MARKS = {json.dumps(marks, ensure_ascii=False)}
STYLE.update(edit_style={style!r}, band_y={json.dumps(RULES['band_y_be'] if style == 'bobae_be' else RULES['band_y'])}, option_hold={RULES['option_exposure']['hold_s'][style]}, chip_hold_max={RULES['option_exposure']['chip_hold_max'][style]},
             checklist={json.dumps(RULES['option_exposure']['checklist'][style])})
"""
    src = src.replace('true', 'True').replace('false', 'False')
    open(path, 'w', encoding='utf-8').write(src)


def post_voice(src, dst):
    """AI 티 줄이기(규칙 voice.post): 너무 깨끗한 디지털 무음 대신 아주 작은 방 소리, 낮은 웅웅 거리 자르기, 치찰음 살짝 누르기, 부드러운 압축.
    목소리 자체(속도·높이)는 바꾸지 않는다"""
    import subprocess
    P = RULES['voice']['post']
    fl = f"highpass=f={P['highpass_hz']},deesser=i={P['deess']},acompressor=threshold={P['comp_threshold']}dB:ratio={P['comp_ratio']}:attack=8:release=120"
    ln = f"loudnorm=I={P['lufs']}:TP=-1.5:LRA=11"
    # 2026-11-10 고침: loudnorm을 amix 앞에 두면 loudnorm 지연(약 3초) 때문에 amix가 목소리 끝 3초를 잘라 버렸다(마지막 문장 소리·자막 사라짐).
    # 방 소리를 섞은 뒤 loudnorm, 방 소리는 넉넉히 길게 만들고 길이는 목소리(first)에 맞춘다
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-f', 'lavfi', '-t', f'{dur + 5:.2f}', '-i', f"anoisesrc=color=pink:amplitude={P['room_tone_amp']}:r=44100",
                    '-filter_complex', f"[0:a]aresample=44100,{fl}[v];[1:a]lowpass=f=3000[n];[v][n]amix=inputs=2:duration=first:normalize=0,{ln}", '-ar', '44100', dst], check=True)
    out = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dst], capture_output=True, text=True).stdout)
    if out < dur - 0.15:  # 목소리가 잘리면 멈춘다(자막·장면이 소리 없이 남는 사고 방지)
        raise SystemExit(f'후처리 뒤 목소리가 짧아짐 {dur:.2f} → {out:.2f}초')


def words_local(mp3, out):
    """일레븐랩스 받아쓰기(creative_transcribe_audio)가 없을 때: 내 컴퓨터의 faster-whisper로 낱말 시각을 잰다"""
    from faster_whisper import WhisperModel
    m = WhisperModel(os.environ.get('SAG_WHISPER', 'small'), device='cpu', compute_type='int8')
    import subprocess, numpy as np  # av 판이 안 맞는 환경이 있어 ffmpeg로 직접 풀어 넘긴다
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True, check=True).stdout
    audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    segs, _ = m.transcribe(audio, language='ko', word_timestamps=True)
    ws = [dict(text=w.word.strip(), start=round(w.start, 3), end=round(w.end, 3)) for sg in segs for w in sg.words]
    json.dump(ws, open(out, 'w'), ensure_ascii=False)
    return ws


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['script', 'build'])
    ap.add_argument('facts'); ap.add_argument('shots', nargs='?')
    ap.add_argument('--style', default='bobae_nl', choices=['bobae_nl', 'bobae_be'])
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    F = json.load(open(a.facts, encoding='utf-8'))
    shots = json.load(open(a.shots, encoding='utf-8')) if a.shots else None
    blocks = (make_script_nasser if RULES['script'].get('speech') == 'formal' else make_script)(F, a.style, shots)
    for b in blocks:
        b['_style'] = a.style
    apply_pron(blocks)  # 2026-11-10 한국어 발음 교정(G80 → 지팔공), 화면 글자는 그대로
    required = apply_missing(blocks, shots)  # 2026-11-10 원본에 없는 부위 처리(가변 규칙 shot_fit)
    if a.cmd == 'script':
        open(os.path.join(a.out, 'tts.txt'), 'w', encoding='utf-8').write(tts_text(blocks))
        json.dump(RULES['voice']['settings'], open(os.path.join(a.out, 'voice_settings.json'), 'w'))
        json.dump(dict(style=a.style, blocks=blocks, required_shots=required), open(os.path.join(a.out, 'plan.json'), 'w'), ensure_ascii=False, indent=1)
        print(tts_text(blocks))
        return
    raw = os.path.join(a.out, 'voice.mp3')
    vn = os.path.join(a.out, 'voice_n.wav')
    if RULES['voice'].get('post', {}).get('on') and os.path.exists(raw):  # 늘 다시 만든다(예전 잘린 voice_n.wav를 다시 쓰던 사고)
        post_voice(raw, vn)
    wp = os.path.join(a.out, 'words.json')
    if not os.path.exists(wp):
        words_local(os.path.join(a.out, 'voice.mp3'), wp)
    words = load_words(wp)
    times = phrase_times(blocks, words)
    dropped = chip_budget(blocks, a.style, words[-1][1] + 2.4)
    if dropped:
        print('칩 예산 때문에 뺀 칩:', dropped)
    # 렌더러에 넘길 낱말 시각: 받아쓰기 글자(1480kg 같은 오인식)가 아니라 대본 어절에 시각을 붙인다
    flat = []
    for bi, b in enumerate(blocks):
        for pi, ph in enumerate(b['phrases']):
            t0, t1 = times[(bi, pi)]
            ends = [w for w in words if t0 + 0.05 < w[1] <= t1 + 0.15]
            t1 = min(t1, max([w[1] for w in ends], default=t1))  # 구절 뒤 쉼은 빼고
            L = [max(1, len(re.sub(r'[^0-9A-Za-z가-힣]', '', w[0]))) for w in ph]
            acc = t0
            for (say, _), l in zip(ph, L):
                d = (t1 - t0) * l / sum(L)
                flat.append(dict(text=say, start=round(acc, 3), end=round(acc + d, 3)))
                acc += d
    json.dump(flat, open(os.path.join(a.out, 'words_flat.json'), 'w'), ensure_ascii=False)
    assign_shots(blocks, shots, times)
    json.dump(dict(style=a.style, blocks=blocks, required_shots=required, times={f'{k[0]}:{k[1]}': v for k, v in times.items()}), open(os.path.join(a.out, 'plan.json'), 'w'), ensure_ascii=False, indent=1)
    write_config(F, blocks, a.style, os.path.join(a.out, 'config.py'), shots)
    print('config', os.path.join(a.out, 'config.py'))


if __name__ == '__main__':
    main()
