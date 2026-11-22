"""옵션 비주얼 자동 배치 — 매뉴얼 13장 / option_visual_rules.json (2026-11-18, v1.5)

cfg에 AUTO_VISUALS = True, LISTING_OPTIONS = {'seat_vent': {}, 'wheel': {'inch': 21}, ...} 만 적으면
대본 낱말에서 옵션을 찾아 → 그 낱말이 든 컷 → 그 컷 사진에 Fluent 3D 스티커 또는 3D 글자를 자동으로 만든다.
값({inch} 등)이 매물 정보에 없으면 그 그림은 만들지 않는다. 손으로 적은 STICKERS·TAGS가 같은 옵션을 다루면 손 것을 우선한다.
"""
import json
import os

RULES = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'option_visual_rules.json')))
SCREEN_H = 1920
SEAT_IDS = ('seat_heat', 'seat_vent', 'seat_massage')
# 컷 부위 이름(사람이 cfg에 적은 한국어)에 이 낱말이 있으면 그 옵션 그림을 부위 찾기로 얹는다
PART_WORDS = {
    'backrest': ('시트', '좌석'), 'cushion': ('시트', '좌석'), 'wheel': ('휠', '타이어', '45°', '옆'),
    'trunk': ('트렁크', '적재'), 'headlight': ('라이트', '헤드', '정면', '앞 45°'), 'speaker': ('스피커', '도어'),
    'screen': ('화면', '센터', '대시', '디스플레이'), 'console': ('콘솔', '버튼'), 'roof': ('루프', '선루프'),
    'engine_or_full': ('엔진', '45°', '정면', '옆'), 'dash': ('대시', '실내'),
}
CONTROL_WORDS = ('버튼', '콘솔', '다이얼', '레버')   # 조작부 사진: 부위가 달라도 그 컷에 그림을 띄움(버튼이 보이므로)


def _manual_ids(C):
    txt = json.dumps(getattr(C, 'STICKERS', []) + getattr(C, 'TAGS', []), ensure_ascii=False)
    out = set()
    for r in RULES['options']:
        if any(k in txt for k in r['keywords']) or (r['id'] == 'wheel' and '인치' in txt) or (r['id'] == 'trunk' and 'L' in txt and 'text' in txt):
            out.add(r['id'])
    return out


def build(C, words, cuts):
    """words: [[start, end, text], ...], cuts: cfg CUTS. 돌려줌: (stickers, report)"""
    opts = getattr(C, 'LISTING_OPTIONS', {})
    lay = RULES['layout']
    starts = [c[2] for c in cuts]
    manual = _manual_ids(C)
    stickers, report = [], []
    seat_n = {}
    for r in RULES['options']:
        if r['id'] not in opts:
            continue
        if r['id'] in manual:
            report.append(f"손 설정 우선: {r['name']}")
            continue
        vals = opts[r['id']] or {}
        if r['visual']['type'] == 'text3d':   # 값이 매물 정보에 없으면 그림도 말도 없음(필수 검사도 하지 않음)
            try:
                r['visual']['text3d'].format(**vals)
            except KeyError:
                report.append(f"값 없음(그림·필수 검사 생략): {r['name']}")
                continue
        kws = list(r['keywords']) + [str(v).split()[0] for v in vals.values() if isinstance(v, str) and v.strip()]   # v1.8.3: 매물 값 낱말(「서라운드 뷰」)로 말해도 그 옵션을 말한 것
        wi = next((i for i, w in enumerate(words) if any(k in w[2] for k in kws)), None)
        if wi is None:
            report.append(('⛔ 필수 옵션 대본에 없음: ' if r.get('required') else '대본에 없음(그림 생략): ') + r['name'])
            continue
        ci = max(i for i, s in enumerate(starts) if s <= wi)
        photo, label = cuts[ci][0], cuts[ci][1]
        if r['id'] == 'seat_memory' or (r['id'] in SEAT_BUNDLE + ('seat_material',) and any(k in label for k in FRONT_SEAT) and '뒷' not in label):
            continue   # 시트 사진에서는 시트 묶음(_seat_bundle)이 한꺼번에 그림
        v = r['visual']
        sk = {'w': wi, 'photo': photo, 'auto': r['id']}
        if 'emo' in v and v['type'] != 'pointer+text3d':
            sk.update(emo=v['emo'], h=200)
        if 'text3d' in v and (v['type'] == 'text3d' or v.get('text3d_if') in vals):
            try:
                txt = v['text3d'].format(**vals)
            except KeyError:
                report.append(f"값 없음(그림 생략): {r['name']} {v['text3d']}")
                continue
            is_num = txt[:1].isdigit()
            sk = {'w': wi, 'photo': photo, 'auto': r['id'], 'text3d': txt, 'fixed': True,
                  'h': int(SCREEN_H * lay['text3d_height_pct']['number' if is_num else 'word'] / 100)}
        chip = cuts[ci][4]
        if 'emo' in sk and chip and getattr(C, 'MARKS', {}).get(chip[0]) == sk['emo']:
            report.append(f"칩과 같은 이모지라 생략: {r['name']} — 칩 「{chip[0]}」에 이미 {sk['emo']}")
            continue
        if 'emo' not in sk and 'text3d' not in sk:
            report.append(f"그림 없음(손가락만 해당): {r['name']}")
            continue
        part_ok = any(k in label for k in PART_WORDS.get(r['part'], ()))
        if part_ok and r['part'] in ('backrest', 'cushion', 'wheel', 'trunk', 'headlight', 'speaker', 'screen', 'console', 'roof'):
            sk['part'] = r['part']
            if r['part'] == 'trunk':
                sk['place'] = 'inside'     # 2026-11-18 사용자: 트렁크 수치는 트렁크 안(적재 공간 가운데)에
            elif r['part'] == 'wheel':
                sk['place'] = 'tire_top'   # 나세르 19"·18"처럼 타이어 윗부분에 걸쳐(문·차체 위로 올리지 않음)
                sk['fit'] = tuple(lay['wheel_fit'])   # v1.6 사용자: 「대문짝 만하다」 → 휠 크기에 맞춤(휠 상자 높이의 비율)
            elif 'text3d' in sk or r['part'] not in ('backrest', 'cushion'):
                sk['above'] = True   # 부위를 가리지 않게 위에(시트 아이콘만 시트 위에 얹음 — 나세르 방식)
        elif part_ok or any(k in label for k in CONTROL_WORDS):
            # 조작부 사진: 부위 찾기가 버튼을 못 찾으므로(전수조사 2026-11-18) 가운데 물체(기어 등)를 가리지 않게 칩 바로 아래 한 줄
            sk.update(x=540, y=int(SCREEN_H * r['v_pct'] / 100), under_chip=True)
        else:
            report.append(f"부위 사진 아님(칩으로만): {r['name']} — 컷 {photo} {label}")
            continue
        if r['id'] in SEAT_IDS:   # 시트 3종: 같은 사진에서 말할 때마다 옆으로 쌓기
            sk['seat_k'] = seat_n.get(photo, 0)
            seat_n[photo] = sk['seat_k'] + 1
        sk['appear'] = r['appear']
        stickers.append(sk)
        report.append(f"자동: {r['name']} → 낱말 {wi}「{words[wi][2]}」 컷 {photo}({label}) {sk.get('text3d') or sk.get('emo')}")
        sub = r['visual'].get('sub_text3d')
        if sub and sk.get('place') == 'tire_top':   # v1.7: 타이어 규격 — 휠 인치 바로 아래 작은 3D 글자(값이 있을 때만)
            try:
                stxt = sub.format(**vals)
            except KeyError:
                stxt = None
            if stxt:
                # v1.7.2: 앞·뒤 규격이 다르면 두 줄(줄마다 림 지름까지) — 한 줄로 길게 늘이면 글자가 작아짐
                lines = [x.strip() for x in stxt.split('·')]
                rim = next((m.group(0) for x in lines for m in [re.search(r'R\d+$', x)] if m), None)
                if rim:
                    lines = [x if re.search(r'R\d+$', x) else f'{x} {rim}' for x in lines]
                sk['grp_sub'] = tuple(lay['tire_sub_fit'])
                sk['sub_n'] = len(lines)
                sk['phase'] = 7
                for li, ln in enumerate(lines):
                    stickers.append({**sk, 'auto': r['id'] + f'@tire{li}', 'text3d': ln, 'fit': tuple(lay['tire_sub_fit']),
                                     'tire_sub': True, 'sub_idx': li, 'sub_n': len(lines), 'grp_fit': sk['fit'], 'grp_sub': None, 'h': 48})
                report.append(f"자동: 타이어 규격 → 휠 인치 아래 {len(lines)}줄 「{' / '.join(lines)}」")
    stickers += _seat_bundle(C, words, cuts, opts, lay, report)
    stickers += _climate_bundle(words, cuts, lay, report)
    stickers += _numbers_on_screen(C, words, cuts, stickers, report)
    for sk in stickers:   # 같은 사진의 시트 아이콘들을 부위 가운데 기준으로 고르게 벌림
        if 'seat_k' in sk:
            n = seat_n[sk['photo']]
            sk['dx'] = int((sk.pop('seat_k') - (n - 1) / 2) * sk['h'] * lay['row_spacing_ratio'])
            same = [o for o in stickers if o['photo'] == sk['photo'] and 'y' in o and o.get('auto') in SEAT_IDS]
            if 'y' in sk and same:
                sk['y'] = min(o['y'] for o in same)   # 한 줄로
    return stickers, report


SEAT_BUNDLE = ('seat_heat', 'seat_vent', 'seat_massage', 'seat_memory')
FRONT_SEAT = ('앞좌석', '운전석', '시트')


def _seat_bundle(C, words, cuts, opts, lay, report):
    """v1.6 사용자 지시(2026-11-18): 시트 사진에 재질(가죽 등) 3D 글자 + 열선·통풍·마사지·메모리 아이콘을 한 줄로.
    매물 정보(LISTING_OPTIONS)에 있는 것만. 재질 값이 없으면 글자는 빼고(지어내지 않음) 아이콘만."""
    ci = next((i for i, c in enumerate(cuts) if any(k in c[1] for k in FRONT_SEAT) and '뒷' not in c[1]), None)
    if ci is None:
        report.append('시트 사진 없음: 시트 묶음 생략')
        return []
    sb = lay['seat_bundle']
    photo, a = cuts[ci][0], cuts[ci][2]
    b = cuts[ci + 1][2] - 1 if ci + 1 < len(cuts) else len(words) - 1
    rules = {r['id']: r for r in RULES['options']}
    icons = [i for i in SEAT_BUNDLE if i in opts]
    seat_words = ' '.join(w[2] for w in words[a:b + 1])
    for oid in icons + (['seat_material'] if (opts.get('seat_material') or {}).get('material') else []):
        r = rules[oid]
        if not any(kw in seat_words for kw in r['keywords']):   # 나세르 방식: 시트 컷에서 그 기능을 말로도 설명해야 함
            report.append(f"⛔ 시트 컷 대본에 없음: {r['name']} — 시트 사진 컷(사진 {photo}) 문장에 「{r['keywords'][0]}」을 넣어 다시 녹음")
    common = {'photo': photo, 'part': 'backrest', 'place': 'seat_row', 'fixed': True, 'appear': 'pop',
              'row_fit': tuple(sb['icon_fit']), 'seat_n': max(1, len(icons)), 'row_v': sb['row_v'], 'row_gap': lay['row_spacing_ratio']}
    out, k = [], 0
    for idx, oid in enumerate(icons):
        r = rules[oid]
        wi = next((i for i in range(a, b + 1) if any(kw in words[i][2] for kw in r['keywords'])), None)
        if wi is None:
            wi = min(a + k, b)   # 말하지 않은 기능(대본 수정 전)은 컷 첫머리부터 하나씩 톡
            k += 1
        out.append({**common, 'w': wi, 'auto': oid + '@seat', 'emo': r['visual']['emo'], 'h': 130,
                    'fit': tuple(sb['icon_fit']) + ('w',), 'seat_idx': idx})
    mat = (opts.get('seat_material') or {}).get('material')
    if 'seat_material' in opts and not mat:
        report.append('시트 재질 값 없음: 재질 글자 생략(매물 정보에 재질을 넣으면 표시)')
    if mat:
        wi = next((i for i in range(a, b + 1) if any(kw in words[i][2] for kw in rules['seat_material']['keywords'])), a)
        out.append({**common, 'w': wi, 'auto': 'seat_material@seat', 'text3d': mat, 'h': 100,
                    'fit': tuple(sb['material_fit']) + ('w',)})
    if out:
        report.append(f"시트 묶음: 컷 {photo}({cuts[ci][1]}) " + ' '.join(o.get('text3d') or o['emo'] for o in out))
    return out


def _climate_bundle(words, cuts, lay, report):
    """v1.7 사용자 지시(2026-11-18 「뒤 공조도 아이콘, 공조에서 나오는 거」): 공조 사진 컷에서 말한 기능(온도·바람·열선 …)만
    송풍구 위에 한 줄. 크기·자리는 OWLv2 공조 상자 기준(시트 묶음과 같은 줄 배치 코드)."""
    cb = lay['climate_bundle']
    out = []
    for ci, c in enumerate(cuts):
        if not any(k in c[1] for k in cb['label_words']):
            continue
        photo, a = c[0], c[2]
        b = cuts[ci + 1][2] - 1 if ci + 1 < len(cuts) else len(words) - 1
        found, seen = [], set()
        for f in cb['features']:
            wi = next((i for i in range(a, b + 1) if any(kw in words[i][2] for kw in f['keywords'])), None)
            if wi is not None and f['emo'] not in seen:
                found.append((wi, f)); seen.add(f['emo'])
        found.sort(key=lambda t: t[0])
        n = len(found)
        for idx, (wi, f) in enumerate(found):
            out.append({'w': wi, 'photo': photo, 'part': cb['part'], 'place': 'seat_row', 'fixed': True, 'appear': 'pop',
                        'auto': 'climate_' + f['id'], 'emo': f['emo'], 'h': 130, 'row_fit': tuple(cb['icon_fit']),
                        'fit': tuple(cb['icon_fit']) + ('w',), 'seat_n': n, 'seat_idx': idx, 'row_v': cb['row_v'],
                        'row_gap': cb.get('row_gap', lay['row_spacing_ratio'])})
        if found:
            report.append(f"공조 묶음: 컷 {photo}({c[1]}) " + ' '.join(f"{f['emo']}「{words[wi][2]}」" for wi, f in found))
    return out


import re
NUM = RULES['numbers_on_screen']


def _val(tok):
    """'7,450만원' → 74500000, '3만' → 30000, '12.3인치' → 12.3"""
    m = re.match(r'^(\d[\d,]*(?:\.\d+)?)(만|천|백)?', tok)
    if not m:
        return None
    v = float(m.group(1).replace(',', ''))
    return v * {'만': 1e4, '천': 1e3, '백': 1e2}.get(m.group(2) or '', 1)


def _vals_in(text):
    return [_val(t) for t in re.findall(r'\d[\d,]*(?:\.\d+)?(?:만|천|백)?', text)]


def _label(tok):
    m = re.match(r'^(\d[\d,]*(?:\.\d+)?)(.*)$', tok.rstrip('.,!?'))
    num, rest = m.group(1), m.group(2)
    for u, show in NUM['units']:
        if rest.startswith(u):
            return num, show, u
    return num, '', ''


def _numbers_on_screen(C, words, cuts, stickers, report):
    """v1.6.1 사용자 지시(2026-11-18): 대본의 숫자 치수는 예외가 없으면 화면에 띄운다(「뒷좌석 40:20:40」).
    칩·자동 그림에 이미 같은 숫자가 있으면 생략. 예외는 option_visual_rules.json numbers_on_screen.skip."""
    out = []
    sk_txt = {}
    for sk in stickers:
        sk_txt.setdefault(sk['photo'], []).append(sk.get('text3d') or '')
    for ci, c in enumerate(cuts):
        if ci == 0 and NUM['skip_first_cut']:
            continue
        a = c[2]
        b = cuts[ci + 1][2] - 1 if ci + 1 < len(cuts) else len(words) - 1
        shown = ' '.join([c[4][0] if c[4] else ''] + [t for t, wi in getattr(C, 'EXTRA_CHIPS', []) if a <= wi <= b] + sk_txt.get(c[0], []))
        have = [v for v in _vals_in(shown) if v]
        toks = [(i, words[i][2]) for i in range(a, b + 1) if re.match(r'^\d', words[i][2])
                and not re.match(NUM['skip_token_re'], words[i][2].rstrip('.,!?'))]
        # 「3만 2천」처럼 한국어 단위로 이어 읽은 숫자는 한 값으로 합쳐 비교(32,000 ≈ 32,770 칩)
        merged, j = [], 0
        while j < len(toks):
            i, t = toks[j]
            v, k2 = _val(t), j
            while re.match(r'^\d+(만|천|백)', toks[k2][1]) and k2 + 1 < len(toks) and toks[k2 + 1][0] == toks[k2][0] + 1 and re.match(r'^\d+(천|백)', toks[k2 + 1][1]):
                k2 += 1
                v += _val(toks[k2][1])
            merged.append((i, t, v, toks[j:k2 + 1]))
            j = k2 + 1
        groups = []
        for i, t, v, src in merged:
            if any(abs(v - h) <= max(0.051 * h, 0.01) for h in have):
                continue   # 칩·그림에 이미 있음
            num0 = re.match(r'^\d[\d,.]*', t).group(0)
            if groups and i == groups[-1][-1][0] + 1:
                groups[-1].append((i, t))
            elif groups and any(t.startswith(num0 + cs) for cs in NUM['count_suffix']) and i - groups[-1][-1][0] <= 2:
                groups[-1].append((i, t))
            else:
                groups.append([(i, t)])
        for g in groups[:NUM['max_per_cut']]:
            parts = [_label(t) for _, t in g]
            raw = [t.rstrip('.,!?') for _, t in g]
            ratio_bare = len(g) >= 3 and all(not p[1] and re.fullmatch(re.escape(p[0]) + r'(으로|로)?', r) for r, p in zip(raw, parts))   # v1.8.3: 「사십, 이십, 사십으로」(단위 없는 숫자 3개 연속) = 분할 비율
            if ratio_bare or (len(g) >= 2 and all(r.startswith(p[0] + '대') or r == p[0] or not p[1] for r, p in zip(raw, parts)) and all('대' in r for r in raw[:-1])):
                txt = ' : '.join(p[0] for p in parts)          # 40대 20대 40 → 40 : 20 : 40 (분할 비율)
            else:
                txt = parts[0][0] + parts[0][1]
                for (num, show, u), r in zip(parts[1:], raw[1:]):
                    txt += f" x{num}" if any(r.startswith(num + cs) for cs in NUM['count_suffix']) else f" {num}{show}"
            sk = {'w': g[0][0], 'photo': c[0], 'auto': 'number', 'text3d': txt, 'fixed': True,
                  'h': int(SCREEN_H * NUM['h_pct'] / 100), 'appear': 'pop', 'fit_w': NUM.get('fit_w'), 'min_h': NUM.get('min_h', 64)}
            # v1.6.2 사용자 「숫자 위치 매핑해라, 벗어난다」: 숫자가 말하는 부위(앞뒤 낱말)를 찾아 그 부위에 붙임
            part, dist = None, 99
            for i in range(g[0][0] - 1, max(a, g[0][0] - 6) - 1, -1):   # 문장 주어(「계기판은」·「뒷좌석은」)가 부위면 그 부위가 우선
                if words[i][2].rstrip('.,!?')[-1:] in '.!?' or words[i][2].endswith(('.', '!', '?')):
                    break
                if words[i][2].rstrip(',').endswith(('은', '는')):
                    hit = next((key for key, wds in NUM['part_words'].items() if any(wd in words[i][2] for wd in wds)), None)
                    if hit:
                        part, dist = hit, -1
                        break
            for i in ([] if dist == -1 else range(max(a, g[0][0] - NUM['part_window']), min(b, g[-1][0] + NUM['part_window']) + 1)):
                for key, wds in NUM['part_words'].items():
                    if any(wd in words[i][2] for wd in wds):
                        d0 = min(abs(i - g[0][0]), abs(i - g[-1][0]))
                        if d0 < dist:
                            part, dist = key, d0
            if part:
                sk.update(part=part, place='inside' if part in NUM['inside_parts'] else None, above=part not in NUM['inside_parts'])
                where = f'부위 {part}'
            else:
                sk.update(x=540, y=0, under_chip=True)
                where = '칩 아래(부위 낱말 없음)'
            out.append(sk)
            report.append(f"숫자 화면 표기: 컷 {c[0]}({c[1]}) 「{' '.join(raw)}」 → {txt} · {where}")
    return out
