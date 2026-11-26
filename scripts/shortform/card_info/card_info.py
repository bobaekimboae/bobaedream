"""숏폼 카드 정보 독립 컷 렌더러 (클로드 시안 2, v1 2026-11-26)

python3 card_info.py samples/g400d.json out/            # 카드 유형마다 mp4 + 전체 이어 붙인 mp4
python3 card_info.py samples/g400d.json out/ --only vehicle,price
python3 card_info.py samples/g400d.json out/ --stills   # 확인용 정지컷(카드마다 마지막 상태 PNG)

규칙은 card_info_rules.json 하나에서만 읽는다. 값은 차량 데이터 파일에서만 가져온다(지어내지 않음).
데이터에 "sample": true 인 카드는 「샘플 값」 표시를 넣는다.
흐름: 카드 등장(아래에서 올라옴) → 머리말 문장 → 줄 하나씩 켜짐(줄 = 자막 문장 = 효과음) → 잠깐 멈춤 → 퇴장.
"""
import io, json, math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
RULES = json.load(open(os.path.join(HERE, 'card_info_rules.json'), encoding='utf-8'))
S, M, T = RULES['style'], RULES['motion'], RULES['types']
W, H, FPS = RULES['canvas']['w'], RULES['canvas']['h'], RULES['canvas']['fps']
FONTS = os.path.join(ROOT, 'scripts', 'shortform', 'fonts')
FB = os.path.join(FONTS, 'Pretendard-ExtraBold.otf')
FS = os.path.join(FONTS, 'Pretendard-SemiBold.otf')
FM = os.path.join(FONTS, 'Pretendard-Medium.otf')
SFX = os.path.join(ROOT, 'public', 'assets', 'shortform', 'sfx')
BGM = os.path.join(ROOT, 'public', 'assets', 'shortform', 'bgm', 'bobae_showroom_v1.mp3')
ICON_DIRS = {
    'detail': os.path.join(ROOT, 'public', 'assets', 'bbm', 'detail-icons'),
    'reddit': os.path.join(ROOT, 'public', 'icons', 'reddit-shoot'),
    'ui': os.path.join(ROOT, 'public', 'community', 'assets', 'reddit-ui'),
}


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
    """'detail:mileage' 같은 참조 → 단색 PNG. 원본 SVG 경로는 고치지 않고 색만 입힌다."""
    k = (ref, px, color)
    if k in _icon_cache:
        return _icon_cache[k]
    import cairosvg
    kind, name = (ref.split(':', 1) + [''])[:2] if ':' in ref else ('detail', ref)
    p = os.path.join(ICON_DIRS[kind], name + '.svg')
    if not os.path.exists(p):
        _icon_cache[k] = None
        return None
    svg = open(p, encoding='utf-8').read()
    png = cairosvg.svg2png(bytestring=svg.encode(), output_width=px * 2, output_height=px * 2)
    im = Image.open(io.BytesIO(png)).convert('RGBA')
    alpha = im.split()[3]
    col = Image.new('RGBA', im.size, hexc(color))
    col.putalpha(alpha)
    _icon_cache[k] = col.resize((px, px), Image.LANCZOS)
    return _icon_cache[k]


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


def text_w(d, s, f):
    return d.textlength(s, font=f)


def tape(base, y, label, a=1.0):
    """AS24 BE 릴스식 노랑 테이프 제목(살짝 기울어진 판, 글자는 수평)."""
    f = F(FB, S['tape_px'])
    d = ImageDraw.Draw(base)
    tw = text_w(d, label, f)
    pad = int(S['tape_px'] * 0.55)
    bw, bh = int(tw + pad * 2), int(S['tape_px'] * 1.75)
    plate = Image.new('RGBA', (bw + 20, bh + 20), (0, 0, 0, 0))
    ImageDraw.Draw(plate).rectangle((10, 10, 10 + bw, 10 + bh), fill=hexc(S['accent'], int(255 * a)))
    plate = plate.rotate(-1.6, resample=Image.BICUBIC, expand=True)
    x = S['card_x']
    base.alpha_composite(plate, (x - 6, y - plate.height // 2))
    d.text((x + pad + 4, y), label, font=f, fill=hexc(S['ink'], int(255 * a)), anchor='lm')


def caption(base, text, a=1.0, hi=None):
    """하단 자막: 흰 글자 + 그림자, 값(hi)만 노랑."""
    if not text or a <= 0:
        return
    f = F(FB, S['caption_px'])
    d = ImageDraw.Draw(base)
    words = text.split(' ')
    lines, cur = [], ''
    for w_ in words:
        t = (cur + ' ' + w_).strip()
        if text_w(d, t, f) > W - 160 and cur:
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
    for i, ln in enumerate(lines):
        x = W / 2 - text_w(d, ln, f) / 2
        y = y0 + i * lh
        for j, w_ in enumerate(ln.split(' ')):
            word = w_ + (' ' if j < len(ln.split(' ')) - 1 else '')
            hw = [x for h in (hi or []) for x in h.split(' ') if x]
            col = hexc(S['accent'], int(255 * a)) if hw and any(h.strip(',.') == w_.strip(',.') for h in hw) else (255, 255, 255, int(255 * a))
            d.text((x, y), word, font=f, fill=col, anchor='lm')
            x += text_w(d, word, f)


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

    # 문장과 시각
    def sentences(self):
        r = self.rule
        out = [('intro', r['intro'], None)]
        if self.kind == 'price':
            dd = self.data
            out.append(('row', f"{dd['old_label']} {man(dd['old'])}.", [man(dd['old']).split(' ')[0]]))
            out.append(('row', f"{dd['new_label']} {man(dd['new'])}.", [man(dd['new']).split(' ')[0]]))
            diff = dd['old'] - dd['new']
            pct = round(diff / dd['old'] * 100)
            out.append(('row', f"{man(diff)}, {pct}% 낮습니다.", [man(diff).split(' ')[0], f'{pct}%']))
            return out
        rows = self.rows
        if self.kind == 'inspect':
            oks = [x for x in rows if (x[3] if len(x) > 3 else 'ok') != 'warn']
            warns = [x for x in rows if len(x) > 3 and x[3] == 'warn']
            for x in oks:
                out.append(('row', r['row_ok'].format(label=x[1], value=x[2]), [x[2]]))
            for x in warns:
                out.append(('warn', r['row_warn'].format(label=x[1], value=x[2]), [x[2]]))
            return out
        for x in rows:
            s = r['row'].format(label=x[1], value=x[2]).replace(' .', '.').replace(', .', '.')
            out.append(('row', s, [x[2]] if x[2] else None))
        return out

    def row_order(self):
        """화면 줄 순서(inspect는 ok 먼저, warn 마지막 — 말하는 순서와 같게)."""
        if self.kind == 'inspect':
            return [x for x in self.rows if (x[3] if len(x) > 3 else 'ok') != 'warn'] + \
                   [x for x in self.rows if len(x) > 3 and x[3] == 'warn']
        return self.rows

    def timeline(self):
        sents = self.sentences()
        t = M['card_in_s']
        segs = []
        for i, (k, s, hi) in enumerate(sents):
            dur = M['intro_hold_s'] if k == 'intro' else M['row_hold_s']
            dur += max(0, len(s) - 14) * 0.035  # 긴 문장은 조금 더 머문다
            segs.append((t, t + dur, k, s, hi))
            t += dur
        t += M['outro_hold_s']
        return segs, t + M['card_out_s']

    # 그리기
    def draw(self, base, t, segs, total):
        cx, cw = S['card_x'], S['card_w']
        n_rows = len(segs) - 1
        rh = S['row_h']
        head_h = 210
        card_h = head_h + (n_rows * rh if self.kind != 'price' else 520) + 60
        ctop = int(S['card_center_y'] - card_h / 2)  # 카드는 테이프·자막 사이 가운데
        a_in = ease(t / M['card_in_s'])
        a_out = 1 - ease((t - (total - M['card_out_s'])) / M['card_out_s'])
        a = min(a_in, a_out)
        if a <= 0:
            return
        dy = int((1 - a_in) * M['card_in_rise_px'])
        tape(base, ctop - 96 + dy, self.rule['tape'], a)
        # 진행 점
        d = ImageDraw.Draw(base)
        dots_w = (self.total - 1) * 26
        for i in range(self.total):
            x = W / 2 - dots_w / 2 + i * 26
            r_ = 7 if i == self.idx else 5
            d.ellipse((x - r_, ctop + card_h + 70 - r_, x + r_, ctop + card_h + 70 + r_),
                      fill=(255, 255, 255, int((235 if i == self.idx else 90) * a)))
        layer = Image.new('RGBA', (cw + 80, card_h + 80), (0, 0, 0, 0))
        sh = Image.new('L', layer.size, 0)
        ImageDraw.Draw(sh).rounded_rectangle((40, 58, 40 + cw, 40 + card_h + 18), S['card_radius'], fill=150)
        layer.paste((0, 0, 0, 255), (0, 0), sh.filter(ImageFilter.GaussianBlur(20)))
        ld = ImageDraw.Draw(layer)
        ld.rounded_rectangle((40, 40, 40 + cw, 40 + card_h), S['card_radius'], fill=hexc(S['card']))
        ox, oy = 40, 40
        pad = 56
        # 머리: 유형 아이콘 + 차 이름 + 카탈로그 그림
        ic = icon(self.rule['icon'], 60, S['ink'])
        if ic:
            ld.ellipse((ox + pad - 14, oy + 58 - 14, ox + pad + 74, oy + 58 + 74), fill=hexc(S['accent']))
            layer.alpha_composite(ic, (ox + pad + 1, oy + 59))
        car = self.car
        ld.text((ox + pad + 104, oy + 72), f"{car['maker']} {car['model']}", font=F(FB, S['title_px']), fill=hexc(S['ink']), anchor='ls')
        sub = f"{car['code']} · {car['trim']}" if car.get('code') else car['trim']
        ld.text((ox + pad + 104, oy + 120), sub, font=F(FM, S['sub_px']), fill=hexc(S['label']), anchor='ls')
        cat = car.get('_cat')
        if cat is not None:
            layer.alpha_composite(cat, (ox + cw - pad - cat.width + 10, oy + 26))
        if self.sample:
            bf = F(FS, 24)
            bw = int(ld.textlength('샘플 값', font=bf)) + 28
            bx, by = ox + cw - pad - bw, oy + 160
            ld.rounded_rectangle((bx, by, bx + bw, by + 36), 18, outline=hexc(S['sample_badge']), width=2)
            ld.text((bx + bw / 2, by + 18), '샘플 값', font=bf, fill=hexc(S['sample_badge']), anchor='mm')
        ld.line((ox + pad, oy + head_h - 6, ox + cw - pad, oy + head_h - 6), fill=hexc(S['line']), width=2)
        if self.kind == 'price':
            self._draw_price(layer, ld, ox, oy + head_h, cw, pad, t, segs)
        else:
            rows = self.row_order()
            for i, x in enumerate(rows):
                st = segs[i + 1][0]
                ra = ease((t - st) / M['row_in_s'])
                if ra <= 0:
                    continue
                y = oy + head_h + i * rh + int((1 - ra) * M['row_in_rise_px'])
                warn = len(x) > 3 and x[3] == 'warn'
                al = int(255 * ra)
                ixx = ox + pad
                if self.kind in ('inspect',):
                    col = S['warn'] if warn else S['ok']
                    cc = hexc(col, al)
                    ld.ellipse((ixx, y + rh / 2 - 22, ixx + 44, y + rh / 2 + 22), fill=cc)
                    if warn:
                        ld.text((ixx + 22, y + rh / 2), '!', font=F(FB, 32), fill=(255, 255, 255, al), anchor='mm')
                    else:
                        ld.line((ixx + 12, y + rh / 2 + 1, ixx + 20, y + rh / 2 + 9, ixx + 33, y + rh / 2 - 8), fill=(255, 255, 255, al), width=5)
                elif x[0]:
                    ri = icon('detail:' + x[0], S['icon_px'], S['ink'])
                    if ri:
                        tmp = ri.copy(); tmp.putalpha(Image.eval(ri.split()[3], lambda v: v * ra))
                        layer.alpha_composite(tmp, (ixx, int(y + rh / 2 - S['icon_px'] / 2)))
                else:
                    ld.ellipse((ixx + 14, y + rh / 2 - 8, ixx + 30, y + rh / 2 + 8), fill=hexc(S['ink'], al))
                tx = ixx + 72
                has_val = bool(x[2])
                lf = F(FS if has_val else FB, S['label_px'] if has_val else S['value_px'] - 2)
                ld.text((tx, y + rh / 2), x[1], font=lf, fill=hexc(S['label'] if has_val else S['ink'], al), anchor='lm')
                if has_val:
                    vc = S['warn'] if warn else S['ink']
                    ld.text((ox + cw - pad, y + rh / 2), x[2], font=F(FB, S['value_px']), fill=hexc(vc, al), anchor='rm')
                if i < len(rows) - 1:
                    ld.line((tx, y + rh, ox + cw - pad, y + rh), fill=hexc(S['line'], al), width=2)
        if a < 1:
            layer.putalpha(Image.eval(layer.split()[3], lambda v: v * a))
        base.alpha_composite(layer, (cx - 40, ctop - 40 + dy))
        # 자막
        cur = None
        for st, en, k, s, hi in segs:
            if st <= t < en:
                cur = (st, en, s, hi)
        if cur:
            st, en, s, hi = cur
            ca = min(ease((t - st) / 0.12), 1 - ease((t - (en - 0.08)) / 0.08))
            caption(base, s, max(0.0, ca) * a, hi)

    def _draw_price(self, layer, ld, ox, oy, cw, pad, t, segs):
        dd = self.data
        bar_w = cw - pad * 2
        items = [(dd['old_label'], dd['old'], hexc('#C9CCD1'), segs[1][0]),
                 (dd['new_label'], dd['new'], hexc(S['accent']), segs[2][0])]
        for i, (lab, v, col, st) in enumerate(items):
            p = ease((t - st) / 0.7)
            if p <= 0:
                continue
            y = oy + 50 + i * 190
            ld.text((ox + pad, y), lab, font=F(FS, S['label_px']), fill=hexc(S['label'], int(255 * min(1, p * 2))), anchor='ls')
            ld.text((ox + cw - pad, y), man(v * p), font=F(FB, S['value_px'] + 8), fill=hexc(S['ink']), anchor='rs')
            w = int(bar_w * (v / dd['old']) * p)
            ld.rounded_rectangle((ox + pad, y + 28, ox + pad + bar_w, y + 92), 16, fill=hexc('#F3F4F6'))
            if w > 32:
                ld.rounded_rectangle((ox + pad, y + 28, ox + pad + w, y + 92), 16, fill=col)
        st = segs[3][0]
        p = ease((t - st) / 0.35)
        if p > 0:
            diff = dd['old'] - dd['new']
            pct = round(diff / dd['old'] * 100)
            y = oy + 50 + 2 * 190 + 10
            s = f"− {man(diff)}  ·  {pct}%"
            f = F(FB, 54)
            tw = ld.textlength(s, font=f)
            bx = ox + cw / 2 - tw / 2 - 30
            ld.rounded_rectangle((bx, y, bx + tw + 60, y + 88), 44, fill=hexc(S['ink'], int(255 * p)))
            ld.text((ox + cw / 2, y + 44), s, font=f, fill=hexc(S['accent'], int(255 * p)), anchor='mm')


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


def render(data_path, out_dir, only=None, stills=False):
    data = json.load(open(data_path, encoding='utf-8'))
    car = dict(data['car'])
    if car.get('catalog_img'):
        im = Image.open(os.path.join(ROOT, car['catalog_img'])).convert('RGBA')
        bb = im.getbbox(); im = im.crop(bb)
        sc = 120 / im.height
        car['_cat'] = im.resize((int(im.width * sc), 120), Image.LANCZOS)
    order = [k for k in data['order'] if k in data['cards'] and (not only or k in only)]
    os.makedirs(out_dir, exist_ok=True)
    bg = background()
    made = []
    for idx, kind in enumerate(order):
        card = Card(kind, data['cards'][kind], car, idx, len(order))
        segs, total = card.timeline()
        name = f'card_{idx + 1:02d}_{kind}'
        if stills:
            fr = bg.copy(); card.draw(fr, segs[-1][0] + 0.6, segs, total)
            fr.convert('RGB').save(os.path.join(out_dir, name + '.png')); made.append(name + '.png')
            continue
        vid = os.path.join(out_dir, name + '_v.mp4')
        p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                              '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
                              '-pix_fmt', 'yuv420p', vid], stdin=subprocess.PIPE)
        nf = int(math.ceil(total * FPS))
        for f_ in range(nf):
            fr = bg.copy(); card.draw(fr, f_ / FPS, segs, total)
            p.stdin.write(fr.convert('RGB').tobytes())
        p.stdin.close(); p.wait()
        # 소리: 카드 등장 1번 + 줄마다 1번
        ev = [(0.05, RULES['sfx']['intro'])] + [(st, RULES['sfx']['row_warn' if k == 'warn' else 'row'])
                                                for st, en, k, s, hi in segs if k != 'intro']
        inputs, filt = ['-i', vid, '-i', BGM], []
        for i, (tt, fn) in enumerate(ev):
            inputs += ['-i', os.path.join(SFX, fn)]
            filt.append(f'[{i + 2}:a]volume={RULES["sfx"]["gain_db"]}dB,adelay={int(tt * 1000)}|{int(tt * 1000)}[s{i}]')
        filt.append(f'[1:a]atrim=0:{total:.2f},volume=-20dB,afade=t=out:st={max(0, total - 0.6):.2f}:d=0.6[b]')
        mix = ''.join(f'[s{i}]' for i in range(len(ev))) + '[b]'
        filt.append(f'{mix}amix=inputs={len(ev) + 1}:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]')
        outp = os.path.join(out_dir, name + '.mp4')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', ';'.join(filt),
                        '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000',
                        '-t', f'{total:.2f}', outp], check=True)
        os.remove(vid)
        loud2(outp)
        made.append(name + '.mp4')
        json.dump({'kind': kind, 'duration': round(total, 2), 'sample': card.sample,
                   'segments': [{'t0': round(a, 2), 't1': round(b, 2), 'type': k, 'text': s} for a, b, k, s, h in segs]},
                  open(os.path.join(out_dir, name + '.plan.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    if not stills and len(made) > 1:
        lst = os.path.join(out_dir, 'concat.txt')
        open(lst, 'w').write(''.join(f"file '{m}'\n" for m in made))
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst,
                        '-c', 'copy', os.path.join(out_dir, 'card_info_all.mp4')], check=True)
        os.remove(lst)
        loud2(os.path.join(out_dir, 'card_info_all.mp4'))
    return made


if __name__ == '__main__':
    a = sys.argv[1:]
    only = None
    if '--only' in a:
        only = a[a.index('--only') + 1].split(',')
    print(render(a[0], a[1], only, '--stills' in a))
