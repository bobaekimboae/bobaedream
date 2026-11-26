"""숏폼 카드 정보 독립 컷 렌더러 (클로드 시안 2, v2 2026-11-26 — 음성·대사·크기 통일·AS24 원본 붓칠/아이콘)

python3 card_info.py samples/g400d.json out/ --script          # 대사(자막)·읽는 글(TTS) 파일만 만든다 → out/script.json, out/tts.txt
python3 card_info.py samples/g400d.json out/ --voice v.mp3    # 목소리에 맞춰 이어진 영상 1개 + 카드별 계획
python3 card_info.py samples/g400d.json out/ --voice v.mp3 --stills   # 확인용 정지컷(카드마다 마지막 줄이 켜진 순간)

규칙은 card_info_rules.json 하나에서만 읽는다. 값은 차량 데이터 파일에서만 가져온다(지어내지 않음).
데이터에 "sample": true 인 카드는 「샘플 값」 표시를 넣는다.
흐름: 카드 등장 → 머리말 문장 → 줄 하나씩 켜짐(줄 = 자막 문장 = 대사 문장 = 효과음) → 다음 카드.
"""
import difflib, io, json, math, os, re, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(ROOT, 'scripts', 'shortform', 'video_listing'))
from speak import speak  # noqa: E402
import g350_v5_lib as L  # noqa: E402  노션 원본 붓칠(103_33) 칩

RULES = json.load(open(os.path.join(HERE, 'card_info_rules.json'), encoding='utf-8'))
S, M, T, V = RULES['style'], RULES['motion'], RULES['types'], RULES['voice']
W, H, FPS = RULES['canvas']['w'], RULES['canvas']['h'], RULES['canvas']['fps']
FONTS = os.path.join(ROOT, 'scripts', 'shortform', 'fonts')
FB = os.path.join(FONTS, 'Pretendard-ExtraBold.otf')
FS = os.path.join(FONTS, 'Pretendard-SemiBold.otf')
FM = os.path.join(FONTS, 'Pretendard-Medium.otf')
SFX = os.path.join(ROOT, 'public', 'assets', 'shortform', 'sfx')
BGM = os.path.join(ROOT, 'public', 'assets', 'shortform', 'bgm', 'bobae_showroom_v1.mp3')
ICON_DIRS = {'as24': os.path.join(ROOT, 'public', 'assets', 'shortform', 'card-info', 'as24-icons')}
KEEP_COLOR = {'checkmark-sale'}
LAYOUT_OVERRIDE = {}  # --layout vehicle=grid2 처럼 실행 때 덮어쓰기  # 원본 색 그대로 쓰는 아이콘(채운 체크 원)


def hexc(h, a=255):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


_font_cache = {}


def F(path, px):
    k = (path, px)
    if k not in _font_cache:
        _font_cache[k] = ImageFont.truetype(path, px)
    return _font_cache[k]


_icon_cache = {}


def icon(ref, px, color):
    """'as24:mileage' → PNG. 노션 원본 SVG 경로는 고치지 않는다. 원본 색 유지 아이콘 외에는 알파만 써서 색을 입힌다."""
    if not ref:
        return None
    if ':' not in ref:
        ref = 'as24:' + ref
    k = (ref, px, color)
    if k in _icon_cache:
        return _icon_cache[k]
    import cairosvg
    kind, name = ref.split(':', 1)
    p = os.path.join(ICON_DIRS[kind], name + '.svg')
    if not os.path.exists(p):
        _icon_cache[k] = None
        return None
    svg = open(p, encoding='utf-8').read().replace('currentColor', '#000000')
    png = cairosvg.svg2png(bytestring=svg.encode(), output_width=px * 2, output_height=px * 2)
    im = Image.open(io.BytesIO(png)).convert('RGBA')
    if name not in KEEP_COLOR:
        col = Image.new('RGBA', im.size, hexc(color))
        col.putalpha(im.split()[3])
        im = col
    _icon_cache[k] = im.resize((px, px), Image.LANCZOS)
    return _icon_cache[k]


_ul_cache = {}


def underline_img(w):
    """노션 원본 밑줄 붓칠(53×5)을 값 폭 w에 맞춰 가로로만 늘린 노랑 RGBA."""
    U = RULES['underline']
    w = max(20, int(w))
    if w not in _ul_cache:
        import cairosvg
        # 가로세로 비율을 지키며 그린 뒤 가로로만 늘림(output_width·height를 같이 주면 SVG가 가운데에 작게 그려짐)
        raw = cairosvg.svg2png(url=os.path.join(ROOT, U['svg']), output_height=U['height_px'] * 4)
        a = Image.open(io.BytesIO(raw)).convert('RGBA').getchannel('A').resize((w, U['height_px']), Image.LANCZOS)
        g = U.get('alpha_gain', 1.0)
        a = a.point(lambda v: min(255, int(v * g)))  # 원본 붓 결의 옅은 끝도 보이게(모양은 그대로)
        im = Image.new('RGBA', a.size, hexc(U['color']))
        im.putalpha(a)
        _ul_cache[w] = im
    return _ul_cache[w]


def wipe(im, p):
    """왼쪽→오른쪽으로 p만큼만 보이게."""
    if p >= 1:
        return im
    out = im.copy()
    w = int(im.width * max(0.0, p))
    m = Image.new('L', im.size, 0)
    m.paste(255, (0, 0, w, im.height))
    out.putalpha(Image.composite(im.getchannel('A'), Image.new('L', im.size, 0), m))
    return out


def fade(im, a):
    if a >= 1:
        return im
    out = im.copy()
    out.putalpha(Image.eval(im.split()[3], lambda v: v * a))
    return out


def ease(x):
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def background():
    top, bot = hexc(S['bg_top']), hexc(S['bg_bottom'])
    g = Image.new('RGBA', (1, H))
    for y in range(H):
        t = y / (H - 1)
        g.putpixel((0, y), tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)) + (255,))
    return g.resize((W, H))


def josa(word, pair):
    """{은}/{이} 자리: 마지막 한글 받침 유무로 고른다."""
    ch = next((c for c in reversed(word) if '가' <= c <= '힣'), None)
    has = ch is not None and (ord(ch) - 0xAC00) % 28 != 0
    return pair[0] if has else pair[1]


def fill(tpl, label, value):
    s = tpl.replace('{label}{은}', label + josa(label, '은는')).replace('{label}{이}', label + josa(label, '이가'))
    return s.format(label=label, value=value).replace(' .', '.').replace(', .', '.')


_chip_cache = {}


def tape_img(label):
    if label not in _chip_cache:
        _chip_cache[label] = L.chip(label, size=S['tape_px'])
    return _chip_cache[label]


def caption(base, text, a=1.0, hi=None, word=None):
    spoken = word
    """하단 자막: 흰 글자 + 그림자, 값(hi)만 노랑."""
    if not text or a <= 0:
        return
    f = F(FB, S['caption_px'])
    d = ImageDraw.Draw(base)
    for h in (hi or []):
        if ' ' in h:
            text = text.replace(h, h.replace(' ', '\u00a0'))
    hi = [h.replace(' ', '\u00a0') for h in (hi or [])]
    lines, cur = [], ''
    for w_ in text.split(' '):
        t = (cur + ' ' + w_).strip()
        if d.textlength(t, font=f) > W - 160 and cur:
            lines.append(cur); cur = w_
        else:
            cur = t
    lines.append(cur)
    lh = int(S['caption_px'] * 1.28)
    y0 = S['caption_cy'] - lh * (len(lines) - 1) / 2
    sh = Image.new('RGBA', base.size, (0, 0, 0, 0))
    ds = ImageDraw.Draw(sh)
    for i, ln in enumerate(lines):
        ds.text((W / 2, y0 + i * lh + 4), ln, font=f, fill=(0, 0, 0, int(200 * a)), anchor='mm')
    base.alpha_composite(sh.filter(ImageFilter.GaussianBlur(7)))
    hw = [x.strip(',.') for h in (hi or []) for x in h.split(' ') if x]
    gidx = [0]  # 문장 안 낱말 번호(줄 바꿈과 상관없이)
    for i, ln in enumerate(lines):
        x = W / 2 - d.textlength(ln, font=f) / 2
        y = y0 + i * lh
        ws = ln.split(' ')
        for j, w_ in enumerate(ws):
            word = w_ + (' ' if j < len(ws) - 1 else '')
            core = re.sub(r'(입니다|합니다|습니다)?[.,]*$', '', w_).strip(',.')
            on = (gidx[0] == spoken) if spoken is not None else any(h and (h == w_.strip(',.') or h == core) for h in hw)
            gidx[0] += 1
            d.text((x, y), word, font=f, fill=hexc(S['accent'], int(255 * a)) if on else (255, 255, 255, int(255 * a)), anchor='lm')
            x += d.textlength(word, font=f)


def man(v):
    """만원 → '1억 3,490만원'"""
    eok, rest = divmod(int(round(v)), 10000)
    if eok and rest:
        return f'{eok}억 {rest:,}만원'
    if eok:
        return f'{eok}억원'
    return f'{rest:,}만원'


def _ev_type(label, rule):
    for p in rule.get('priority', []):
        if any(k in label for k in p['keys']):
            return p['rank'], p['group']
    return 4, '기타'


def timeline_compact(rows, rule):
    """타임라인 사건이 많을 때: 같은 사건 합치기 → 최대 max_events개(처음·마지막 유지, 중요도 순) → 나머지는 「그 밖에」 한 줄."""
    mx = rule.get('max_events')
    if not mx or len(rows) <= mx:
        return rows
    merged, seen = [], {}
    for x in rows:  # [아이콘, 날짜, 사건, ...]
        key = re.sub(r'[\s·\d,km]+', '', x[2].split('·')[0])
        if key in seen:
            m = merged[seen[key]]
            m['n'] += 1; m['last'] = x[1]
        else:
            seen[key] = len(merged); merged.append({'row': list(x), 'n': 1, 'first': x[1], 'last': x[1]})
    def as_row(m):
        x = list(m['row'])
        if m['n'] > 1:
            y0, y1 = m['first'][:4], m['last'][:4]
            x[1] = f'{y0}~{y1[2:]}' if y0 != y1 else y0
            x[2] = f"{x[2].split('·')[0].strip()} ×{m['n']}"
            x = x[:3] + ['', fill(rule['row_merge'].replace('{n}', str(m['n'])), x[1], x[2].split(' ×')[0])]
        return x
    if len(merged) <= mx:
        return [as_row(m) for m in merged]
    keep = {0, len(merged) - 1}
    order = sorted(range(1, len(merged) - 1), key=lambda i: (_ev_type(merged[i]['row'][2], rule)[0], -i))
    must = [i for i in order if _ev_type(merged[i]['row'][2], rule)[0] == 1]
    for i in must + [i for i in order if i not in must]:
        if len(keep) >= mx - 1:
            break
        keep.add(i)
    cnt, rk = {}, {}
    for i, m in enumerate(merged):
        if i not in keep:
            r_, g = _ev_type(m['row'][2], rule)
            cnt[g] = cnt.get(g, 0) + m['n']; rk[g] = r_
    cnt = dict(sorted(cnt.items(), key=lambda kv: rk[kv[0]]))  # 중요한 묶음부터
    out = [as_row(merged[i]) for i in sorted(keep)]
    if cnt:
        val = ' · '.join(f'{g} {n}건' for g, n in cnt.items())
        out.append(['', rule['more_label'], val, 'more', fill(rule['row_more'], rule['more_label'], val)])
    return out


class Card:
    def __init__(self, kind, data, car, idx, total):
        self.kind, self.data, self.car, self.idx, self.total = kind, data, car, idx, total
        self.rule = T[kind]
        self.rows = data.get('rows', [])
        self.sample = bool(data.get('sample'))
        self.segs = []  # (t0, t1, kind, text, hi) — 카드 안 시각
        if kind == 'timeline':
            self.rows = timeline_compact(self.rows, self.rule)
        if kind == 'extra' and self.rows and car.get('_new_price'):
            add = sum(int(re.sub(r'[^0-9]', '', x[2])) for x in self.rows if re.search(r'\d', x[2] or ''))
            self.rows = list(self.rows) + [
                ['', self.rule['sum_label'], '+ ' + man(add), 'sum'],
                ['', self.rule['total_label'], man(car['_new_price'] + add), 'total']]

    def row_order(self):
        """화면 줄 순서(inspect는 ok 먼저, warn 마지막 — 말하는 순서와 같게)."""
        if self.kind == 'inspect':
            return [x for x in self.rows if (x[3] if len(x) > 3 else 'ok') != 'warn'] + \
                   [x for x in self.rows if len(x) > 3 and x[3] == 'warn']
        return self.rows

    def sentences(self):
        r = self.rule
        intro = r['intro_molit'] if self.data.get('source') == 'molit' and r.get('intro_molit') else r['intro']
        self._intro = V.get('say_intro', True) or self.kind == 'price'
        out = [('intro', intro, None)] if self._intro else []
        say = self.data.get('say')
        if say:  # 대사 묶음: 이 문장만 읽고, paint 줄만 칠한다
            warns = {x[1] for x in self.rows if len(x) > 3 and x[3] == 'warn'}
            return out + [('warn' if warns & set(g.get('paint', [])) else 'row', g['text'], None) for g in say]
        if self.kind == 'price':
            dd = self.data
            out.append(('row', fill(r['row'], dd['old_label'], man(dd['old'])), [man(dd['old'])]))
            out.append(('row', fill(r['row'], dd['new_label'], man(dd['new'])), [man(dd['new'])]))
            diff = dd['old'] - dd['new']
            pct = round(diff / dd['old'] * 100)
            out.append(('row', f"{man(diff)}, {pct}% 낮습니다.", [man(diff), f'{pct}%']))
            return out
        for x in self.row_order():
            warn = len(x) > 3 and x[3] == 'warn'
            if len(x) > 3 and x[3] in ('sum', 'total'):
                v = x[2].replace('+ ', '')
                out.append(('row', fill(r['row_' + x[3]], x[1], v), [v]))
            elif warn:
                first = not any(k == 'warn' for k, _, _ in out)
                tpl = r['row_warn'] if first or not r.get('row_warn_next') else r['row_warn_next']
                out.append(('warn', fill(tpl, x[1], x[2]), [x[2]]))
            elif x[2] == '없음' and r.get('row_none'):
                out.append(('row', fill(r['row_none'], x[1], x[2]), ['없습니다']))
            elif len(x) > 4 and x[4]:
                out.append(('row', x[4], [x[2]]))  # 줄 5번째 칸 = 자막·대사 문장(칸 글과 다르게 말할 때)
            else:
                tpl = r.get('row_ok') or r['row']
                out.append(('row', fill(tpl, x[1], x[2]), [x[2]] if x[2] else None))
        return out

    # 그리기
    def draw(self, base, t, total):
        segs = self.segs
        cx, cw = S['card_x'], S['card_w']
        head_h = S['head_h']
        nrows = 3 if self.kind == 'price' else max(1, len(self.row_order()))
        lay = self.layout()
        if self.kind == 'price':
            body_h = 500
        elif lay == 'grid2':
            body_h = math.ceil(nrows / 2) * S['tile_h'] + S['body_pad'] * 2
        elif lay == 'quote':
            body_h = S['dealer_h'] + nrows * S['row_h'] + S['body_pad'] * 3 + 40
        else:
            body_h = nrows * S['row_h'] + S['body_pad'] * 2
        note = self.data.get('source_note')
        if note:
            body_h += S['source_h']
        card_h = head_h + body_h
        ctop = int(S['card_center_y'] - card_h / 2)
        a_in = ease(t / M['card_in_s'])
        a_out = 1 - ease((t - (total - M['card_out_s'])) / M['card_out_s'])
        a = min(a_in, a_out)
        if a <= 0:
            return
        dy = int((1 - a_in) * M['card_in_rise_px'])
        # 붓칠 제목(노션 원본 103_33) — 카드 왼쪽 위
        tp = fade(tape_img(self.rule['tape']), a)
        base.alpha_composite(tp, (cx - 15, ctop - S['tape_gap_px'] - tp.height + 30 + dy))
        layer = Image.new('RGBA', (cw + 80, card_h + 80), (0, 0, 0, 0))
        sh = Image.new('L', layer.size, 0)
        ImageDraw.Draw(sh).rounded_rectangle((40, 58, 40 + cw, 40 + card_h + 18), S['card_radius'], fill=150)
        layer.paste((0, 0, 0, 255), (0, 0), sh.filter(ImageFilter.GaussianBlur(20)))
        ld = ImageDraw.Draw(layer)
        ld.rounded_rectangle((40, 40, 40 + cw, 40 + card_h), S['card_radius'], fill=hexc(S['card']))
        ox, oy, pad = 40, 40, 56
        # 머리: 유형 아이콘(노랑 원) + 차 이름 + 카탈로그 그림
        ic = icon(self.rule['icon'], 56, S['ink'])
        ld.ellipse((ox + pad - 14, oy + 44, ox + pad + 80, oy + 138), fill=hexc(S['accent']))
        if ic:
            layer.alpha_composite(ic, (ox + pad + 5, oy + 63))
        car = self.car
        ld.text((ox + pad + 112, oy + 88), f"{car['maker']} {car['model']}", font=F(FB, S['title_px']), fill=hexc(S['ink']), anchor='ls')
        sub = f"{car['code']} · {car['trim']}" if car.get('code') else car['trim']
        ld.text((ox + pad + 112, oy + 134), sub, font=F(FM, S['sub_px']), fill=hexc(S['label']), anchor='ls')
        cat = car.get('_cat')
        if cat is not None:
            layer.alpha_composite(cat, (ox + cw - pad - cat.width + 10, oy + 22))
        if self.sample:
            bf = F(FS, 24)
            bw = int(ld.textlength('샘플 값', font=bf)) + 28
            bx, by = ox + cw - pad - bw, oy + 154
            ld.rounded_rectangle((bx, by, bx + bw, by + 36), 18, outline=hexc(S['sample_badge']), width=2)
            ld.text((bx + bw / 2, by + 18), '샘플 값', font=bf, fill=hexc(S['sample_badge']), anchor='mm')
        ld.line((ox + pad, oy + head_h - 6, ox + cw - pad, oy + head_h - 6), fill=hexc(S['line']), width=2)
        if note:  # 출처 줄(신뢰 장치): 카드 맨 아래 회색 작은 글자
            ld.text((ox + pad, oy + card_h - S['source_h'] / 2 - 4), note, font=F(FM, S['source_px']), fill=hexc(S['label']), anchor='lm')
        if self.kind == 'price':
            self._draw_price(ld, ox, oy + head_h, cw, pad, body_h, t)
        elif lay == 'grid2':
            self._draw_grid(layer, ld, ox, oy + head_h, cw, pad, t)
        elif lay == 'quote':
            self._draw_quote(layer, ld, ox, oy + head_h, cw, pad, t)
        else:
            rows = self.row_order()
            n = max(1, len(rows))
            rh = S['row_h']
            by0 = oy + head_h + S['body_pad']
            for i, x in enumerate(rows):
                st = self.row_t(i)
                ra = ease((t - st) / M['row_in_s'])
                if ra <= 0:
                    continue
                y = by0 + i * rh + (1 - ra) * M['row_in_rise_px']
                cy = y + rh / 2
                warn = len(x) > 3 and x[3] == 'warn'
                tagx = x[3] if len(x) > 3 else ''
                al = int(255 * ra)
                ixx = ox + pad
                ref = x[0]
                if self.kind == 'inspect':
                    ref = self.rule['warn_icon'] if warn else self.rule['ok_icon']
                elif (len(x) > 3 and x[3] in ('sum', 'total')) or self.kind == 'timeline':
                    ref = None
                elif not ref:
                    ref = self.rule.get('row_icon')
                ri = icon(ref, S['icon_px'], S['warn'] if warn else S['ink']) if ref else None
                if (len(x) > 3 and x[3] in ('sum', 'total')) or self.kind == 'timeline':
                    pass
                elif ri:
                    layer.alpha_composite(fade(ri, ra), (int(ixx), int(cy - S['icon_px'] / 2)))
                else:
                    ld.ellipse((ixx + 14, cy - 8, ixx + 30, cy + 8), fill=hexc(S['ink'], al))
                if self.kind == 'timeline' and tagx == 'more':
                    ld.text((ixx, cy), x[1], font=F(FS, S['label_px']), fill=hexc(S['label'], al), anchor='lm')
                    ld.text((ox + cw - pad, cy), x[2], font=F(FS, S['label_px']), fill=hexc(S['label'], al), anchor='rm')
                    continue
                if self.kind == 'timeline':
                    lx = ixx + 22
                    if i < len(rows) - 1 and (rows[i + 1][3] if len(rows[i + 1]) > 3 else '') != 'more':
                        nra = ease((t - self.row_t(i + 1)) / M['row_in_s'])
                        ld.line((lx, cy, lx, cy + rh * nra), fill=hexc(S['ink'], al), width=4)
                    ld.ellipse((lx - 13, cy - 13, lx + 13, cy + 13), fill=hexc(S['accent'], al), outline=hexc(S['ink'], al), width=4)
                    ld.text((ixx + 72, cy), x[1], font=F(FS, S['label_px']), fill=hexc(S['label'], al), anchor='lm')
                    up, ua = self.ul_progress(x[1], t)
                    if up > 0 and ua > 0:
                        vb = ld.textbbox((ox + cw - pad, cy), x[2], font=F(FB, S['value_px']), anchor='rm')
                        layer.alpha_composite(fade(wipe(underline_img(vb[2] - vb[0] + 8), up), ua), (int(vb[0] - 4), int(vb[3] - RULES['underline']['height_px'] / 2 + RULES['underline']['gap_px'])))
                        ld = ImageDraw.Draw(layer)
                    ld.text((ox + cw - pad, cy), x[2], font=F(FB, S['value_px']), fill=hexc(S['ink'], al), anchor='rm')
                    continue
                tx = ixx + 72
                tag = x[3] if len(x) > 3 else ''
                if tag in ('sum', 'total'):
                    if tag == 'sum':
                        ld.line((ixx, y + 2, ox + cw - pad, y + 2), fill=hexc(S['ink'], al), width=3)
                    vf = F(FB, S['value_px'] + (6 if tag == 'total' else 0))
                    if tag == 'total':
                        vw = ld.textlength(x[2], font=vf)
                        ld.rounded_rectangle((ox + cw - pad - vw - 22, cy - 34, ox + cw - pad + 10, cy + 34), 14, fill=hexc(S['accent'], al))
                    ld.text((ixx, cy), x[1], font=F(FB, S['label_px']), fill=hexc(S['ink'], al), anchor='lm')
                    ld.text((ox + cw - pad - (6 if tag == 'total' else 0), cy), x[2], font=vf, fill=hexc(S['ink'], al), anchor='rm')
                    continue
                has_val = bool(x[2])
                lf = F(FS if has_val else FB, S['label_px'] if has_val else S['value_px'] - 2)
                ld.text((tx, cy), x[1], font=lf, fill=hexc(S['label'] if has_val else S['ink'], al), anchor='lm')
                if tag == 'check':
                    vw = ld.textlength(x[2], font=F(FB, S['value_px']))
                    cf = F(FS, 22); cwid = ld.textlength('확인 전', font=cf) + 22
                    bx = ox + cw - pad - vw - 16 - cwid
                    ld.rounded_rectangle((bx, cy - 17, bx + cwid, cy + 17), 17, outline=hexc(S['sample_badge'], al), width=2)
                    ld.text((bx + cwid / 2, cy), '확인 전', font=cf, fill=hexc(S['sample_badge'], al), anchor='mm')
                up, ua = self.ul_progress(x[1], t) if has_val else (0, 0)
                if up > 0 and ua > 0:
                    vb = ld.textbbox((ox + cw - pad, cy), x[2], font=F(FB, S['value_px']), anchor='rm')
                    ul = underline_img(vb[2] - vb[0] + 8)
                    layer.alpha_composite(fade(wipe(ul, up), ua), (int(vb[0] - 4), int(vb[3] - RULES['underline']['height_px'] / 2 + RULES['underline']['gap_px'])))
                    ld = ImageDraw.Draw(layer)
                if has_val:
                    ld.text((ox + cw - pad, cy), x[2], font=F(FB, S['value_px']), fill=hexc(S['warn'] if warn else S['ink'], al), anchor='rm')
                if i < len(rows) - 1:
                    ld.line((tx, y + rh, ox + cw - pad, y + rh), fill=hexc(S['line'], al), width=2)
        layer = fade(layer, a)
        base.alpha_composite(layer, (cx - 40, ctop - 40 + dy))
        cur = next(((j, st, en, s) for j, (st, en, k, s, hi) in enumerate(segs) if st <= t < en), None)
        if cur:
            j, st, en, s = cur
            wts = getattr(self, 'wt', None)
            wi = -1
            if wts:
                wi = max([q for q, x in enumerate(wts[j]) if x <= t + 0.02] or [0])
            caption(base, s, a, word=wi)  # 벨기에판: 바로 뜨고(instant), 말하는 낱말만 노랑

    def row_t(self, i):
        """줄 등장 시각. rows_mode=all이면 카드와 함께 한꺼번에(짧은 계단), 아니면 말할 때."""
        if M.get('rows_mode') == 'all':
            return M['rows_all_delay_s'] + i * M['rows_all_stagger_s']
        return self.segs[i + 1][0] if i + 1 < len(self.segs) else 1e9

    def ul_progress(self, label, t):
        """밑줄 칠 상태 (진행 0~1, 투명도 0~1).
        sync: 말이 그 줄의 값에 닿을 때 값 길이만큼 왼쪽→오른쪽으로 칠한다. keep=true면 설명한 줄은 칠이 남아 쌓이고, false면 다음 줄이 칠해질 때 사라짐.
        keys: 데이터 underline 항목을 줄이 다 나온 뒤 차례로 칠하고 그대로 둠(이전 방식)."""
        U = RULES['underline']
        rows = self.row_order()
        idx = next((i for i, x in enumerate(rows) if x[1] == label), None)
        if idx is None:
            return 0.0, 0.0
        if U.get('mode', 'keys') == 'sync':
            win = self.paint_win(idx)
            if not win:
                return 0.0, 0.0
            t0, dur = win
            nxt = next((w for w in (self.paint_win(k) for k in range(idx + 1, len(rows))) if w), None)
            al = 1.0 if (U.get('keep') or not nxt) else 1 - ease((t - nxt[0]) / U['fade_out_s'])
            return ease((t - t0) / dur), al
        keys = self.data.get('underline') or []
        if label not in keys:
            return 0.0, 0.0
        if M.get('rows_mode') == 'all':
            t0 = self.row_t(len(rows) - 1) + M['row_in_s'] + U['start_after_s'] + keys.index(label) * U['stagger_s']
        else:
            t0 = self.segs[-1][0] + U['start_after_s'] + keys.index(label) * U['stagger_s']
        return ease((t - t0) / U['wipe_s']), 1.0

    def paint_win(self, i):
        """i번째 줄 값을 말하는 시각 (시작, 칠 길이). 자막 낱말 시각(self.wt)에서 값 첫 낱말~끝 낱말을 찾는다."""
        cache = self.__dict__.setdefault('_pw', {})
        if i in cache:
            return cache[i]
        U = RULES['underline']
        rows = self.row_order()
        off = 1 if getattr(self, '_intro', True) else 0
        say = self.data.get('say')
        if say:
            g = next((k for k, gg in enumerate(say) if rows[i][1] in gg.get('paint', [])), None)
            j = None if g is None else g + off
        else:
            j = i + off
        res = None
        if j is not None and j < len(self.segs) and len(rows[i]) > 2 and rows[i][2] and (len(rows[i]) < 4 or rows[i][3] not in ('sum', 'total')):
            st, en, _, sent, _ = self.segs[j]
            words = sent.split(' ')
            key = lambda w: ''.join(c for c in w if c.isalnum())
            toks = [key(x) for x in re.split(r'[\s·,]+', rows[i][2]) if key(x)]
            k0 = next((k for k, w in enumerate(words) if toks and toks[0][:2] in key(w)), None)
            k1 = next((k for k in range(len(words) - 1, -1, -1) if toks and toks[-1][:2] in key(words[k])), k0)
            wts = (getattr(self, 'wt', None) or [])
            wt = wts[j] if j < len(wts) else None
            if k0 is not None and wt and k0 < len(wt):
                k1 = max(k0, k1 or k0)
                t0 = wt[k0]
                t1 = wt[k1 + 1] if k1 + 1 < len(wt) else en - 0.12
            else:
                t0, t1 = st + 0.25, st + 0.25 + U['wipe_s']
            res = (t0 - U['lead_s'], max(U['wipe_min_s'], min(U['wipe_max_s'], t1 - t0)))
        cache[i] = res
        return res

    def layout(self):
        return self.data.get('layout') or LAYOUT_OVERRIDE.get(self.kind) or self.rule.get('layout', 'list')

    def _draw_grid(self, layer, ld, ox, oy, cw, pad, t):
        """2열 타일(AS24 웹 상세 「Basisdaten」식): 아이콘 + 라벨(위, 회색) + 값(아래, 굵게)."""
        rows, segs = self.row_order(), self.segs
        th, gap = S['tile_h'], S['tile_gap']
        tw = (cw - pad * 2 - gap) / 2
        for i, x in enumerate(rows):
            ra = ease((t - self.row_t(i)) / M['row_in_s'])
            if ra <= 0:
                continue
            al = int(255 * ra)
            col, row = i % 2, i // 2
            tx0 = ox + pad + col * (tw + gap)
            ty0 = oy + S['body_pad'] + row * th + (1 - ra) * M['row_in_rise_px']
            ld.rounded_rectangle((tx0, ty0 + 8, tx0 + tw, ty0 + th - 8), S['tile_radius'], fill=hexc(S['tile_bg'], al))
            ri = icon(x[0], S['icon_px'], S['ink']) if x[0] else None
            if ri:
                layer.alpha_composite(fade(ri, ra), (int(tx0 + 22), int(ty0 + th / 2 - S['icon_px'] / 2)))
            lx = tx0 + 22 + S['icon_px'] + 18
            ld.text((lx, ty0 + th / 2 - 6), x[1], font=F(FS, S['tile_label_px']), fill=hexc(S['label'], al), anchor='ls')
            v = x[2]
            vf = F(FB, S['tile_value_px'])
            while ld.textlength(v, font=vf) > tw - (lx - tx0) - 18 and vf.size > 26:
                vf = F(FB, vf.size - 2)
            up, ua = self.ul_progress(x[1], t)
            if up > 0 and ua > 0:
                vb = ld.textbbox((lx, ty0 + th / 2 + 6), v, font=vf, anchor='lt')
                ul = underline_img(vb[2] - vb[0] + 8)
                layer.alpha_composite(fade(wipe(ul, up), ua), (int(vb[0] - 4), int(vb[3] - RULES['underline']['height_px'] / 2 + RULES['underline']['gap_px'])))
                ld = ImageDraw.Draw(layer)
            ld.text((lx, ty0 + th / 2 + 6), v, font=vf, fill=hexc(S['ink'], al), anchor='lt')
            if len(x) > 3 and x[3] == 'check':
                cf = F(FS, 20); cwid = ld.textlength('확인 전', font=cf) + 18
                bx = tx0 + tw - cwid - 14
                ld.rounded_rectangle((bx, ty0 + 20, bx + cwid, ty0 + 50), 15, outline=hexc(S['sample_badge'], al), width=2)
                ld.text((bx + cwid / 2, ty0 + 35), '확인 전', font=cf, fill=hexc(S['sample_badge'], al), anchor='mm')

    def _draw_quote(self, layer, ld, ox, oy, cw, pad, t):
        """판매자 카드: 딜러 줄 + 회색 말풍선 안 인용 줄."""
        rows, segs, dl = self.row_order(), self.segs, self.data.get('dealer', {})
        a0 = ease(t / M['card_in_s'])
        y = oy + S['body_pad']
        cyd = y + S['dealer_h'] / 2
        ld.ellipse((ox + pad, cyd - 40, ox + pad + 80, cyd + 40), fill=hexc('#ECEDEF'))
        pi = icon('person', 48, S['label'])
        if pi:
            layer.alpha_composite(pi, (int(ox + pad + 16), int(cyd - 24)))
        ld.text((ox + pad + 104, cyd - 6), dl.get('name', '판매자'), font=F(FB, S['label_px']), fill=hexc(S['ink']), anchor='ls')
        ld.text((ox + pad + 104, cyd + 8), dl.get('place', ''), font=F(FM, 28), fill=hexc(S['label']), anchor='lt')
        if dl.get('stats'):
            ld.text((ox + cw - pad, cyd), dl['stats'], font=F(FS, 26), fill=hexc(S['label']), anchor='rm')
        by = y + S['dealer_h'] + S['body_pad']
        bh = len(rows) * S['row_h'] + 40
        ld.rounded_rectangle((ox + pad, by, ox + cw - pad, by + bh), 28, fill=hexc('#F5F6F8'))
        ld.polygon([(ox + pad + 60, by), (ox + pad + 92, by), (ox + pad + 70, by - 22)], fill=hexc('#F5F6F8'))
        ld.text((ox + pad + 28, by + 4), '“', font=F(FB, 96), fill=hexc(S['accent']), anchor='lt')
        for i, x in enumerate(rows):
            ra = ease((t - self.row_t(i)) / M['row_in_s'])
            if ra <= 0:
                continue
            cy = by + 20 + i * S['row_h'] + S['row_h'] / 2 + (1 - ra) * M['row_in_rise_px']
            ld.text((ox + pad + 100, cy), x[1], font=F(FB, S['value_px'] - 4), fill=hexc(S['ink'], int(255 * ra)), anchor='lm')

    def _draw_price(self, ld, ox, oy, cw, pad, body_h, t):
        dd, segs = self.data, self.segs
        bar_w = cw - pad * 2
        top = oy + (body_h - 500) / 2
        items = [(dd['old_label'], dd['old'], hexc('#C9CCD1'), segs[1][0]),
                 (dd['new_label'], dd['new'], hexc(S['accent']), segs[2][0])]
        for i, (lab, v, col, st) in enumerate(items):
            p = ease((t - st) / 0.7)
            if p <= 0:
                continue
            y = top + 60 + i * 190
            ld.text((ox + pad, y), lab, font=F(FS, S['label_px']), fill=hexc(S['label'], int(255 * min(1, p * 2))), anchor='ls')
            ld.text((ox + cw - pad, y), man(v * p), font=F(FB, S['value_px'] + 8), fill=hexc(S['ink']), anchor='rs')
            w = int(bar_w * (v / dd['old']) * p)
            ld.rounded_rectangle((ox + pad, y + 28, ox + pad + bar_w, y + 92), 16, fill=hexc('#F3F4F6'))
            if w > 32:
                ld.rounded_rectangle((ox + pad, y + 28, ox + pad + w, y + 92), 16, fill=col)
        p = ease((t - segs[3][0]) / 0.35)
        if p > 0:
            diff = dd['old'] - dd['new']
            pct = round(diff / dd['old'] * 100)
            y = top + 60 + 2 * 190 + 10
            s = f"− {man(diff)}  ·  {pct}%"
            f = F(FB, 54)
            tw = ld.textlength(s, font=f)
            bx = ox + cw / 2 - tw / 2 - 30
            ld.rounded_rectangle((bx, y, bx + tw + 60, y + 88), 44, fill=hexc(S['ink'], int(255 * p)))
            ld.text((ox + cw / 2, y + 44), s, font=f, fill=hexc(S['accent'], int(255 * p)), anchor='mm')


def norm(s):
    return [c for c in speak(s) if c.isalnum()]


def align(sents, words):
    """문장 목록(자막 글) ↔ faster-whisper 낱말 시각. 읽는 글을 글자 단위로 맞춰 각 문장 소리 시작 시각을 돌려준다."""
    sc, bounds = [], []
    for s in sents:
        bounds.append(len(sc)); sc += norm(s)
    wc, wt = [], []
    for w in words:
        cs = norm(w['word'])
        for i, c in enumerate(cs):
            wc.append(c); wt.append(w['start'] + (w['end'] - w['start']) * i / max(1, len(cs)))
    sm = difflib.SequenceMatcher(None, sc, wc, autojunk=False)
    m = {}
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            m[a + k] = b + k
    starts = []
    for i, b0 in enumerate(bounds):
        b1 = bounds[i + 1] if i + 1 < len(bounds) else len(sc)
        hit = next((m[j] for j in range(b0, b1) if j in m), None)
        starts.append(wt[hit] if hit is not None else None)
    for i in range(len(starts)):  # 못 맞춘 문장은 앞뒤 사이로
        if starts[i] is None:
            prev = starts[i - 1] if i else 0.0
            nxt = next((x for x in starts[i + 1:] if x is not None), words[-1]['end'])
            starts[i] = (prev + nxt) / 2
    # 글자마다 시각(맞은 글자는 그 시각, 못 맞춘 글자는 앞뒤 사이로) → 자막 낱말마다 소리 시작 시각
    ct = [wt[m[j]] if j in m else None for j in range(len(sc))]
    last = 0.0
    for j in range(len(ct)):
        if ct[j] is None:
            nxt = next((ct[k] for k in range(j + 1, len(ct)) if ct[k] is not None), words[-1]['end'])
            ct[j] = last + (nxt - last) * 0.5
        last = ct[j]
    wtimes = []
    for i, snt in enumerate(sents):
        p, row = bounds[i], []
        for w in snt.replace('\u00a0', ' ').split(' '):
            row.append(ct[min(p, len(ct) - 1)] if ct else 0.0)
            p += len(norm(w))
        row[0] = starts[i]
        wtimes.append(row)
    return starts, words[-1]['end'], wtimes


def loud2(path):
    """2단계 loudnorm(−14 LUFS · TP −1.5). 영상은 그대로 복사."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'loudnorm=I=-14:TP=-2.0:LRA=11:print_format=json',
                        '-f', 'null', '-'], capture_output=True, text=True)
    txt = r.stderr
    j = json.loads(txt[txt.rindex('{'):txt.rindex('}') + 1])
    f = (f"loudnorm=I=-14:TP=-2.0:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
         f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    tmp = path + '.tmp.mp4'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', path, '-af', f, '-c:v', 'copy', '-c:a', 'aac',
                    '-b:a', '160k', '-ar', '48000', tmp], check=True)
    os.replace(tmp, path)


def build(data_path):
    data = json.load(open(data_path, encoding='utf-8'))
    car = dict(data['car'])
    if car.get('catalog_img'):
        im = Image.open(os.path.join(ROOT, car['catalog_img'])).convert('RGBA')
        im = im.crop(im.getbbox())
        sc = 120 / im.height
        car['_cat'] = im.resize((int(im.width * sc), 120), Image.LANCZOS)
    if 'price' in data['cards']:
        car['_new_price'] = data['cards']['price']['old']  # 추가 옵션 카드 총액 계산용 신차가
    pick = [k for k in data['order'] if k in data['cards']]
    base = RULES.get('default_order', pick)
    order = [k for k in base if k in pick] + [k for k in pick if k not in base]  # 기본 순서(2차 제안) 우선
    cards = [Card(k, data['cards'][k], car, i, len(order)) for i, k in enumerate(order)]
    for c in cards:
        txt = ' '.join(s for _, s, _ in c.sentences())
        if c.layout() == 'grid2':
            long_ = [x[2] for x in c.row_order() if len(x[2]) > S.get('grid_value_max_chars', 99)]
            if long_:
                raise SystemExit(f'그리드 칸 값이 {S["grid_value_max_chars"]}자를 넘음: {long_} — {c.kind}')
        bad = [w for w in RULES['never'] if w in txt]
        if bad:
            raise SystemExit(f'금지어 {bad} — {c.kind}')
    return data, cards


def write_script(cards, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    rows, paras = [], []
    for c in cards:
        ss = c.sentences()
        for k, s, hi in ss:
            rows.append({'card': c.kind, 'type': k, 'caption': s, 'say': speak(s)})
        paras.append(' '.join(speak(s) for _, s, _ in ss))
    tts = V['tag'] + ' ' + '\n\n'.join(paras)
    open(os.path.join(out_dir, 'tts.txt'), 'w', encoding='utf-8').write(tts)
    json.dump(rows, open(os.path.join(out_dir, 'script.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return tts


def words_of(voice):
    wj = os.path.splitext(voice)[0] + '_words.json'
    if not os.path.exists(wj):
        import numpy as np
        from faster_whisper import WhisperModel
        model = WhisperModel('mobiuslabsgmbh/faster-whisper-large-v3-turbo', device='cpu', compute_type='int8')
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', voice, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True).stdout
        seg, _ = model.transcribe(np.frombuffer(raw, np.int16).astype(np.float32) / 32768, language='ko', word_timestamps=True)
        ws = [{'word': w.word, 'start': w.start, 'end': w.end} for s in seg for w in s.words]
        json.dump(ws, open(wj, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    return json.load(open(wj, encoding='utf-8'))


def render(data_path, out_dir, voice, stills=False):
    data, cards = build(data_path)
    write_script(cards, out_dir)
    sp = V.get('speed', 1.0)
    if sp and sp != 1.0:
        fast = os.path.join(out_dir, os.path.splitext(os.path.basename(voice))[0] + f'_x{sp:g}.mp3')
        if not os.path.exists(fast):
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', voice, '-af', f'atempo={sp}', '-b:a', '192k', fast], check=True)
        voice = fast
    words = words_of(voice)
    flat = [(c, k, s, hi) for c in cards for k, s, hi in c.sentences()]
    starts, vend, wtimes = align([s for _, _, s, _ in flat], words)
    lead = V['lead_s']
    starts = [x + lead for x in starts]  # 목소리를 lead_s 늦춰 붙인다(첫 카드가 먼저 올라오게)
    # 카드 구간: 머리말 소리 시작 lead_s 전 ~ 다음 카드 머리말 lead_s 전
    begins, i = [], 0
    for c in cards:
        begins.append(max(0.0, starts[i] - lead)); i += len(c.sentences())
    total = vend + lead + M['outro_hold_s'] + M['card_out_s']
    ends = begins[1:] + [total]
    i = 0
    for c, b, e in zip(cards, begins, ends):
        n = len(c.sentences())
        st = starts[i:i + n]
        c.segs = []
        c.wt = [[x + lead - b for x in row] for row in wtimes[i:i + n]]  # 자막 낱말 소리 시작(카드 안 시각)
        for j, (k, s, hi) in enumerate(c.sentences()):
            t0 = st[j] - b - 0.05
            t1 = (st[j + 1] - b - 0.05) if j + 1 < n else (e - b - M['card_out_s'])
            c.segs.append((t0, t1, k, s, hi))
        c.span = (b, e)
        i += n
    bg = background()
    os.makedirs(out_dir, exist_ok=True)
    if stills:
        made = []
        for c in cards:
            b, e = c.span
            fr = bg.copy(); c.draw(fr, c.segs[-1][0] + 0.5, e - b)
            p = os.path.join(out_dir, f'still_{c.idx + 1:02d}_{c.kind}.png')
            fr.convert('RGB').save(p); made.append(p)
        return made
    vid = os.path.join(out_dir, '_v.mp4')
    p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                          '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
                          '-pix_fmt', 'yuv420p', vid], stdin=subprocess.PIPE)
    for f_ in range(int(math.ceil(total * FPS))):
        tt = f_ / FPS
        fr = bg.copy()
        c = next((c for c in cards if c.span[0] <= tt < c.span[1]), cards[-1])
        c.draw(fr, tt - c.span[0], c.span[1] - c.span[0])
        p.stdin.write(fr.convert('RGB').tobytes())
    p.stdin.close(); p.wait()
    # 소리: 목소리(lead_s 늦춤) + 카드 등장 1번 + 줄마다 1번 + 배경음
    ev = []
    for c in cards:
        b = c.span[0]
        ev.append((b + 0.02, RULES['sfx']['intro']))
        ev += [(b + st, RULES['sfx']['row_warn' if k == 'warn' else 'row']) for st, en, k, s, hi in c.segs if k != 'intro']
    inputs = ['-i', vid, '-i', voice, '-i', BGM]
    filt = [f'[1:a]adelay={int(lead * 1000)}|{int(lead * 1000)},highpass=f=70[v]',
            f'[2:a]atrim=0:{total:.2f},volume={V["bgm_db"]}dB,afade=t=out:st={max(0, total - 0.8):.2f}:d=0.8[b]']
    for k, (tt, fn) in enumerate(ev):
        inputs += ['-i', os.path.join(SFX, fn)]
        filt.append(f'[{k + 3}:a]volume={RULES["sfx"]["gain_db"]}dB,adelay={int(tt * 1000)}|{int(tt * 1000)}[s{k}]')
    mix = '[v][b]' + ''.join(f'[s{k}]' for k in range(len(ev)))
    filt.append(f'{mix}amix=inputs={len(ev) + 2}:normalize=0[a]')
    outp = os.path.join(out_dir, 'card_info_voice.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', ';'.join(filt),
                    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000',
                    '-t', f'{total:.2f}', outp], check=True)
    os.remove(vid)
    loud2(outp)
    for c in cards:  # 카드 한 장씩 따로(차량 편집 영상에 1장부터 여러 장까지 끼워 넣는 용도)
        b, e = c.span
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{b:.3f}', '-i', outp, '-t', f'{e - b:.3f}',
                        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k',
                        os.path.join(out_dir, f'card_{c.idx + 1:02d}_{c.kind}.mp4')], check=True)
    json.dump({'version': RULES['version'], 'duration': round(total, 2), 'voice': {k: V[k] for k in ('voice_id', 'voice_name', 'model_id')},
               'cards': [{'kind': c.kind, 'sample': c.sample, 'start': round(c.span[0], 2), 'end': round(c.span[1], 2),
                          'segments': [{'t0': round(c.span[0] + a, 2), 't1': round(c.span[0] + b, 2), 'type': k, 'caption': s, 'say': speak(s)}
                                       for a, b, k, s, h in c.segs]} for c in cards]},
              open(outp + '.plan.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return outp


if __name__ == '__main__':
    a = sys.argv[1:]
    if '--script' in a:
        _, cards = build(a[0])
        print(write_script(cards, a[1]))
    else:
        if '--layout' in a:
            for kv in a[a.index('--layout') + 1].split(','):
                k, v = kv.split('='); LAYOUT_OVERRIDE[k] = v
        print(render(a[0], a[1], a[a.index('--voice') + 1], '--stills' in a))
