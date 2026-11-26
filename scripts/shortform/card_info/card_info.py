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
KEEP_COLOR = {'checkmark-sale'}  # 원본 색 그대로 쓰는 아이콘(채운 체크 원)


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


def caption(base, text, a=1.0, hi=None):
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
    for i, ln in enumerate(lines):
        x = W / 2 - d.textlength(ln, font=f) / 2
        y = y0 + i * lh
        ws = ln.split(' ')
        for j, w_ in enumerate(ws):
            word = w_ + (' ' if j < len(ws) - 1 else '')
            core = re.sub(r'(입니다|합니다|습니다)?[.,]*$', '', w_).strip(',.')
            on = any(h and (h == w_.strip(',.') or h == core) for h in hw)
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


class Card:
    def __init__(self, kind, data, car, idx, total):
        self.kind, self.data, self.car, self.idx, self.total = kind, data, car, idx, total
        self.rule = T[kind]
        self.rows = data.get('rows', [])
        self.sample = bool(data.get('sample'))
        self.segs = []  # (t0, t1, kind, text, hi) — 카드 안 시각
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
        out = [('intro', intro, None)]
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
        body_h = 500 if self.kind == 'price' else nrows * S['row_h'] + S['body_pad'] * 2
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
        if self.kind == 'price':
            self._draw_price(ld, ox, oy + head_h, cw, pad, body_h, t)
        else:
            rows = self.row_order()
            n = max(1, len(rows))
            rh = S['row_h']
            by0 = oy + head_h + S['body_pad']
            for i, x in enumerate(rows):
                st = segs[i + 1][0]
                ra = ease((t - st) / M['row_in_s'])
                if ra <= 0:
                    continue
                y = by0 + i * rh + (1 - ra) * M['row_in_rise_px']
                cy = y + rh / 2
                warn = len(x) > 3 and x[3] == 'warn'
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
                if self.kind == 'timeline':
                    lx = ixx + 22
                    if i < len(rows) - 1:
                        nra = ease((t - segs[i + 2][0]) / M['row_in_s']) if i + 2 < len(segs) else 0
                        ld.line((lx, cy, lx, cy + rh * nra), fill=hexc(S['ink'], al), width=4)
                    ld.ellipse((lx - 13, cy - 13, lx + 13, cy + 13), fill=hexc(S['accent'], al), outline=hexc(S['ink'], al), width=4)
                    ld.text((ixx + 72, cy), x[1], font=F(FS, S['label_px']), fill=hexc(S['label'], al), anchor='lm')
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
                if has_val:
                    ld.text((ox + cw - pad, cy), x[2], font=F(FB, S['value_px']), fill=hexc(S['warn'] if warn else S['ink'], al), anchor='rm')
                if i < len(rows) - 1:
                    ld.line((tx, y + rh, ox + cw - pad, y + rh), fill=hexc(S['line'], al), width=2)
        layer = fade(layer, a)
        base.alpha_composite(layer, (cx - 40, ctop - 40 + dy))
        cur = next(((st, en, s, hi) for st, en, k, s, hi in segs if st <= t < en), None)
        if cur:
            st, en, s, hi = cur
            ca = min(ease((t - st) / 0.12), 1 - ease((t - (en - 0.08)) / 0.08))
            caption(base, s, max(0.0, ca) * a, hi)

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
    return starts, words[-1]['end']


def loud2(path):
    """2단계 loudnorm(−14 LUFS · TP −1.5). 영상은 그대로 복사."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json',
                        '-f', 'null', '-'], capture_output=True, text=True)
    txt = r.stderr
    j = json.loads(txt[txt.rindex('{'):txt.rindex('}') + 1])
    f = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
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
    starts, vend = align([s for _, _, s, _ in flat], words)
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
        print(render(a[0], a[1], a[a.index('--voice') + 1], '--stills' in a))
