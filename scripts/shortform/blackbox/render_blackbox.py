#!/usr/bin/env python3
"""보배드림 공식 인스타 블랙박스 제보 릴스 자동 편집 (B안, 2026-11-28).

입력 원장(JSON) 하나로 1080x1920 릴스 + 표지를 만든다.
- 블랙박스 원본은 그대로: 블러·자르기·컷·소리 분리 없음. 원본 소리는 0.40으로 깔고 목소리를 얹는다.
- 값은 blackbox_layout.json 에서만 읽는다.
- 배경음(선택)·효과음(선택)은 오픈소스(CC0·CC BY) 또는 자체 제작 파일만. --bgm none 이 기본.

사용: python3 render_blackbox.py samples/s1.json [--out 폴더] [--bgm none|<파일>] [--sfx on|off]
원장 형식은 README.md 참고.
"""
import argparse, json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); SF = os.path.dirname(HERE); REPO = os.path.dirname(os.path.dirname(SF))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(SF, 'video_listing'))
import g350_v5_lib as L
import lockup as LK
import audio as AU
LY = json.load(open(os.path.join(HERE, 'blackbox_layout.json')))
W, H = LY['canvas']; VT = LY['video']['top']; VH = LY['video']['height']; CAP_CY = LY['caption']['center_y']
FN = lambda n, s: ImageFont.truetype(os.path.join(SF, 'fonts', f'Pretendard-{n}.otf'), s)
YEL = L.YEL


CR = LY.get('caption_rules', {})
_hex = lambda h: tuple(int(h.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))


def _lum(rgb):
    f = lambda v: (v / 255) / 12.92 if v / 255 <= 0.03928 else ((v / 255 + 0.055) / 1.055) ** 2.4
    r, g, b = (f(x) for x in rgb[:3]); return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = sorted((_lum(a), _lum(b)), reverse=True); return (la + 0.05) / (lb + 0.05)


def plan_highlights(T, CH):
    """자막 색 규칙 v1: 덩어리마다 지금 말하는 어절 하나만 강조. 0.12초 미만 강조는 앞 어절에 합침, 덩어리를 넘지 않음."""
    mn = CR.get('min_highlight_s', 0.12); out = []
    for ci, c in enumerate(CH):
        end_c = T[CH[ci + 1][0]][0] if ci + 1 < len(CH) else T[c[-1]][1] + 0.6
        segs = []
        for j, wi in enumerate(c):
            s = T[wi][0]; e = T[c[j + 1]][0] if j + 1 < len(c) else end_c
            if segs and e - s < mn: segs[-1][2] = e; continue   # 너무 짧은 강조는 합침
            segs.append([j, s, e])
        if len(segs) > 1 and segs[0][2] - segs[0][1] < mn: segs[1][1] = segs[0][1]; segs.pop(0)
        out.append((c, segs))
    return out


def phrase(words, act, spk2=(), scale=None):
    """ExtraBold 60 · 그림자 흰 글자 · 외곽선 없음 · 말하는 어절만 노랑 (둘째 화자·원본 대사는 하늘색)"""
    c = LY['caption']; fnt = FN(c['font'], c['size']); text = ' '.join(words); lh = 80; gap = fnt.getlength(' ')
    base = _hex(CR.get('base_color', '#FFFFFF')); hl = _hex(CR.get('highlight_color', c.get('highlight', '#F5F200'))); s2 = _hex(CR.get('speaker2_color', '#00FFFF'))
    sc = CR.get('active_scale', 1.0) if scale is None else scale
    fa = FN(c['font'], round(c['size'] * sc))   # 말하는 어절만 살짝 크게(역동 규칙)
    fs = [fa if i == act else fnt for i in range(len(words))]
    tw = sum(f.getlength(w) for f, w in zip(fs, words)) + gap * (len(words) - 1)
    im = Image.new('RGBA', (int(tw + 120), lh + 60)); sh = Image.new('RGBA', im.size); dsh = ImageDraw.Draw(sh)
    cyy = im.height / 2; x = (im.width - tw) / 2
    for f, w in zip(fs, words):
        dsh.text((x + 3, cyy + 5), w, font=f, fill=(0, 0, 0, 220), anchor='lm', stroke_width=4, stroke_fill=(0, 0, 0, 220)); x += f.getlength(w) + gap
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6))); d = ImageDraw.Draw(im); x = (im.width - tw) / 2
    for i, (f, w) in enumerate(zip(fs, words)):
        d.text((x, cyy), w, font=f, fill=(hl if i == act else (s2 if i in spk2 else base)), anchor='lm'); x += f.getlength(w) + gap
    return im


def brand_emblem(px):
    """보배드림 로고 파일(심벌 + 워드마크)에서 원형 심벌만 잘라 비율 그대로 줄인다. 로고를 정사각형에 눌러 넣지 않는다."""
    lg = Image.open(os.path.join(REPO, 'public/assets/shortform/bobae_logo_600.png')).convert('RGBA')
    alpha = lg.getchannel('A'); w, h = lg.size; x = 0
    while x < w and alpha.crop((x, 0, x + 1, h)).getbbox(): x += 1  # 심벌 뒤 첫 빈 세로줄
    em = lg.crop((0, 0, x, h)); em = em.crop(em.getbbox())
    s = px / max(em.size)
    return em.resize((max(1, round(em.width * s)), max(1, round(em.height * s))), Image.LANCZOS)


def title_lockup(job, size=None):
    """벨기에 원본 붓칠 칩 제목(onechip 기본 · allchip 선택)."""
    t = job['title']; TD = LY['title']
    style = t.get('style') or TD['default_style']; shape = t.get('shape') or TD['default_shape'][style]
    if style == 'allchip':     # 모든 줄 원본 칩
        lk = LK.lockup_allchip([t['chip'] + ' ' + t['rest'], t['line2']], size=t.get('size', TD['allchip_size']), shape=shape)
    else:                      # onechip: 첫 낱말만 원본 칩(벨기에)
        lk = LK.lockup(t['chip'], t['rest'], t['line2'], size=size or TD['size'], shape=shape)
    job['_title_used'] = {'style': style, 'shape': lk.info.get('shapes', shape)}
    return lk


def static_layer(job):
    st = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(st)
    b = LY['brand']; lg = brand_emblem(b['logo_px'])
    bf = FN(b['font'], b['size']); bw = int(d.textlength(b['text'], font=bf)); x0 = (W - (b['logo_px'] + 10 + bw)) // 2
    st.alpha_composite(lg, (x0, b['logo_y'])); d.text((x0 + b['logo_px'] + 10, b['text_y']), b['text'], font=bf, fill=tuple(b['color']), anchor='lm')
    lk = title_lockup(job)
    z0, z1 = LY['title']['zone']; st.alpha_composite(lk, ((W - lk.width) // 2, (z0 + z1 - lk.height) // 2))
    c = LY['credit']; d.text((W / 2, c['y']), c['text'], font=FN(c['font'], c['size']), fill=tuple(c['color']), anchor='mm')
    return st


def gradient(top, bottom):
    import numpy as np
    t = np.linspace(0, 1, H)[:, None, None]; a = (np.array(top) * (1 - t) + np.array(bottom) * t).astype('uint8')
    return Image.fromarray(np.repeat(a, W, axis=1), 'RGB')


def static_layer_news(job, NF):
    """뉴스형: JTBC식 두 줄 글자 제목(첫 줄 강조색) + YTN식 균형 + 큰 보배드림 로고."""
    st = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(st); T = NF['title']; t = job['title']
    look = t.get('look') or NF.get('title_look', 'chip'); NF['_brand_chip'] = (look == 'text')   # 칩은 한 화면에 한 곳만: 글자 제목이면 「보배드림」에 칩
    if look == 'chip':   # 기본: 벨기에 붓칠 칩 제목(사용자 확정 2026-11-28)
        lk = title_lockup(job, NF.get('chip_size'))
        st.alpha_composite(lk, ((W - lk.width) // 2, int(T['center_y'] - lk.height / 2)))
    else:                                                          # 선택: JTBC식 두 줄 글자 제목
        _text_title(st, d, T, t)
    _news_brand(st, d, NF)
    return st


def _text_title(st, d, T, t):
    lines = [(t['chip'] + ' ' + t['rest']).strip(), t['line2']]; size = T['size']
    while size > 48 and max(FN(T['font'], size).getlength(x) for x in lines) > T['max_w']: size -= 2
    f = FN(T['font'], size); acc = T['accent']; acc = tuple(int(acc[i:i + 2], 16) for i in (1, 3, 5))
    sh = Image.new('RGBA', (W, H)); sd = ImageDraw.Draw(sh)
    ys = [T['center_y'] - T['line_gap'] / 2, T['center_y'] + T['line_gap'] / 2]
    for y, x in zip(ys, lines): sd.text((W / 2 + 2, y + 4), x, font=f, fill=(0, 0, 0, 150), anchor='mm')
    st.alpha_composite(sh.filter(ImageFilter.GaussianBlur(5)))
    for y, x, col in zip(ys, lines, [acc, tuple(T['line2_color'])]): d.text((W / 2, y), x, font=f, fill=col, anchor='mm')
    t['_text_size'] = size


def _credit(st, d, NF, y):
    """영상제보 안내: 「영상제보」 + [인스타 아이콘] 인스타 DM @bobaedream · [메일 아이콘] 이메일 (아이콘은 저장소 원본 SVG를 그린 PNG)"""
    c = NF['credit']; cd = c.get('dm')
    if not cd:
        d.text((W / 2, y), LY['credit']['text'], font=FN(LY['credit']['font'], c['size']), fill=tuple(c['color']), anchor='mm'); return
    lf = FN(cd['label_font'], cd['label_size']); f = FN(cd['font'], cd['size']); col = tuple(c['color'])
    if cd.get('label_chip'):   # 노션 원본 칠 모양에 흰색만 칠한 칩(원본 파일은 그대로, 색만 렌더러가 칠함)
        lc = cd['label_chip']; ch, _ = LK.chip(cd['label'], lc['size'], lc.get('weight', 'Bold'), lc.get('shape', '126_40'), ink=tuple(lc['ink']), fill_rgb=lc['fill'])
        st.alpha_composite(ch, (int(W / 2 - ch.width / 2), int(y - ch.height / 2)))
    else:
        d.text((W / 2, y), cd['label'], font=lf, fill=tuple(cd['label_color']), anchor='mm')
    items = []
    for it in cd['items']:
        ic = Image.open(os.path.join(REPO, it['icon'])).convert('RGBA'); ic = ic.crop(ic.getbbox())
        sc = cd['icon_px'] / max(ic.size); ic = ic.resize((round(ic.width * sc), round(ic.height * sc)), Image.LANCZOS)
        items.append((ic, it['text']))
    gap_i, gap = cd['icon_gap'], cd['item_gap']
    if cd.get('layout') == 'stack':   # 한 줄에 하나씩 세로로, 아이콘 왼쪽선을 맞춘 묶음을 가운데에
        bw = max(ic.width + gap_i + d.textlength(t, font=f) for ic, t in items); x0 = (W - bw) / 2
        icw = max(ic.width for ic, _ in items)
        for k, (ic, t) in enumerate(items):
            ry = y + cd['row_dy'] + k * cd['line_dy']
            st.alpha_composite(ic, (int(x0 + (icw - ic.width) / 2), int(ry - ic.height / 2)))
            d.text((x0 + icw + gap_i, ry), t, font=f, fill=col, anchor='lm')
        return
    tot = sum(ic.width + gap_i + d.textlength(t, font=f) for ic, t in items) + gap * (len(items) - 1)
    x = (W - tot) / 2; ry = y + cd['row_dy']
    for ic, t in items:
        st.alpha_composite(ic, (int(x), int(ry - ic.height / 2))); x += ic.width + gap_i
        d.text((x, ry), t, font=f, fill=col, anchor='lm'); x += d.textlength(t, font=f) + gap


def _news_brand(st, d, NF):
    if NF.get('_top_label'):   # 제목 위 작은 채널 표시(JTBC·MBC식) + 아래는 제보 주소만
        tl = NF['top_label']; lg = brand_emblem(tl['logo_px']); f = FN(tl['font'], tl['size']); txt = LY['brand']['text']
        tw = d.textlength(txt, font=f); x0 = int((W - (lg.width + tl['gap'] + tw)) / 2); cy = tl['center_y']
        st.alpha_composite(lg, (x0, int(cy - lg.height / 2))); d.text((x0 + lg.width + tl['gap'], cy), txt, font=f, fill=tuple(tl['color']), anchor='lm')
        _credit(st, d, NF, tl['credit_y'])
        return
    b = NF['brand']; lg = brand_emblem(b['logo_px']); bf = FN(b['font'], b['size']); txt = LY['brand']['text']; cy = b['center_y']
    if NF.get('_brand_chip'):   # 「보배드림」만 벨기에 원본 칩(430_239), 「블랙박스」는 흰 글자
        head, tail = txt.split(' ', 1); ch, _ = LK.chip(head, size=b['size'], weight=b['font'], shape=LY['title']['default_shape']['onechip'])
        tw = d.textlength(tail, font=bf); x0 = int((W - (lg.width + b['gap'] + ch.width + b['gap'] + tw)) / 2)
        st.alpha_composite(lg, (x0, int(cy - lg.height / 2))); x = x0 + lg.width + b['gap']
        _credit(st, d, NF, NF['credit']['y'])
        st.alpha_composite(ch, (x, int(cy - ch.height / 2))); NF['_chip_box'] = [x, int(cy - ch.height / 2), x + ch.width, int(cy - ch.height / 2) + ch.height]; d.text((x + ch.width + b['gap'], cy), tail, font=bf, fill=tuple(b['color']), anchor='lm')
        return
    bw = d.textlength(txt, font=bf); x0 = int((W - (lg.width + b['gap'] + bw)) / 2)
    st.alpha_composite(lg, (x0, int(cy - lg.height / 2))); d.text((x0 + lg.width + b['gap'], cy), txt, font=bf, fill=tuple(b['color']), anchor='lm')
    _credit(st, d, NF, NF['credit']['y'])


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('job'); ap.add_argument('--out')
    ap.add_argument('--bgm', default=None); ap.add_argument('--title-style', choices=['onechip', 'allchip']); ap.add_argument('--chip-shape'); ap.add_argument('--sfx', default=None); ap.add_argument('--frame', choices=['default', 'news']); ap.add_argument('--title-look', choices=['chip', 'text']); ap.add_argument('--top-label', action='store_true')
    a = ap.parse_args(); jp = os.path.abspath(a.job); jd = os.path.dirname(jp); job = json.load(open(jp))
    if a.title_style: job['title']['style'] = a.title_style
    if a.chip_shape: job['title']['shape'] = a.chip_shape
    if a.title_look: job['title']['look'] = a.title_look
    P = lambda p: p if os.path.isabs(p) else os.path.join(jd, p)
    out = os.path.abspath(a.out or os.path.join(jd, 'out_' + job['id'])); os.makedirs(out, exist_ok=True)
    src, voice = P(job['source']), P(job['voice']); dly = job.get('voice_delay_s', 1.0); tot = job['duration_s']
    global VT, VH, CAP_CY
    frame = a.frame or job.get('frame') or LY.get('default_frame', 'default'); NF = LY['frames'].get(frame, {}); job['frame'] = frame
    if frame == 'news':
        import copy; NF = copy.deepcopy(NF)
        fit_mode = job.get('video_fit', 'auto')
        if fit_mode == 'auto':   # 원본 비율로 정함: 가로(16:9) = 기본 자르기, 정사각·세로 = 세로로 크게(tall)
            pr = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', P(job['source'])], capture_output=True, text=True).stdout.strip().split(',')
            asp = int(pr[0]) / int(pr[1]); fit_mode = 'tall' if asp < NF['tall_layout']['max_aspect'] else 'crop'
        if fit_mode in ('tall', 'contain'):   # 고정 블박 크기 대신 원본 세로 크기를 살려 크게, 자막은 영상 아래쪽 위에(JTBC식)
            tl = NF['tall_layout']; pr = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', P(job['source'])], capture_output=True, text=True).stdout.strip().split(',')
            asp = int(pr[0]) / int(pr[1]); vh = min(tl['video_max_height'], round(W / asp / 2) * 2)
            NF['video'].update(top=tl['video_top'], height=vh, fit='contain')
            NF['caption']['center_y'] = tl['video_top'] + vh - tl['caption_from_bottom']
            NF['brand']['center_y'] = tl['video_top'] + vh + tl['brand_below']; NF['credit']['y'] = NF['brand']['center_y'] + tl['credit_below_brand']
        if job.get('video_fit') == 'full':   # 사고 장면이 가장자리에 있을 때: 원본 16:9 전체
            fl = NF['full_layout']; NF['video'].update(top=fl['video_top'], height=fl['video_height'], fit='full')
            NF['title']['center_y'] = fl['title_center_y']; NF['caption']['center_y'] = fl['caption_center_y']
            NF['brand']['center_y'] = fl['brand_center_y']; NF['credit']['y'] = fl['credit_y']
        NF['_top_label'] = bool(job.get('top_label', a.top_label))
        VT, VH, CAP_CY = NF['video']['top'], NF['video']['height'], NF['caption']['center_y']
        pal = NF.get('bg_palettes', {}).get(job.get('bg', ''), {}); NF['bg_top'] = pal.get('top', NF['bg_top']); NF['bg_bottom'] = pal.get('bottom', NF['bg_bottom'])
        st = static_layer_news(job, NF); gradient(NF['bg_top'], NF['bg_bottom']).save(f'{out}/bg.png')
    else:
        st = static_layer(job)
    st.save(f'{out}/static.png')
    WJ = json.load(open(P(job['words']))); TXT = [w.strip('.,') for w, _, _ in WJ]; T = [(x, y) for _, x, y in WJ]
    CH = job['chunks']; ev = []; k = 0; S2 = set(job.get('speaker2_words', []))
    for c, segs in plan_highlights(T, CH):
        sp = [j for j, wi in enumerate(c) if wi in S2]
        pop = CR.get('pop_s', 0.0)
        for j, s, e in segs:
            if pop and e - s > pop + 0.08:   # 어절이 바뀌는 순간 한 번 튀었다가 제 크기로(0.07초)
                im = phrase([TXT[i] for i in c], j, sp, CR.get('pop_scale', 1.2)); im.save(f'{out}/c{k}.png'); ev.append((k, s + dly, s + pop + dly, im.size)); k += 1; s = s + pop
            im = phrase([TXT[i] for i in c], j, sp); im.save(f'{out}/c{k}.png'); ev.append((k, s + dly, e + dly, im.size)); k += 1
    # 대비 점검: 자막 띠 뒤 배경 평균색 대비 글자색 (WCAG 4.5:1)
    try:
        band = st.convert('RGB').crop((0, CAP_CY - 50, W, CAP_CY + 50)) if frame != 'news' else Image.open(f'{out}/bg.png').convert('RGB').crop((0, CAP_CY - 50, W, CAP_CY + 50))
        avg = tuple(int(sum(px[i] for px in band.getdata()) / (band.width * band.height)) for i in range(3))
        cr = {n: round(contrast(_hex(CR.get(k2, d2)), avg), 2) for n, k2, d2 in (('base', 'base_color', '#FFFFFF'), ('highlight', 'highlight_color', '#F5F200'), ('speaker2', 'speaker2_color', '#00FFFF'))}
        json.dump({'bg_avg': avg, 'contrast': cr, 'min': CR.get('min_contrast', 4.5), 'pass': all(v >= CR.get('min_contrast', 4.5) for v in cr.values()), 'events': len(ev)}, open(f'{out}/caption_check.json', 'w'))
        print('자막 대비', cr, '통과' if all(v >= CR.get('min_contrast', 4.5) for v in cr.values()) else '실패')
    except Exception as ex: print('자막 대비 점검 생략:', ex)
    inp = ['-i', src, '-i', voice, '-loop', '1', '-i', f'{out}/static.png']
    for e in ev: inp += ['-loop', '1', '-i', f'{out}/c{e[0]}.png']
    if frame == 'news':   # 단색 그라데이션 배경 + 영상 가운데 자르기(YTN 비율)
        inp += ['-loop', '1', '-i', f'{out}/bg.png']; bgi = 3 + len(ev)
        fit = NF['video'].get('fit'); vf = 'scale=-2:%d,crop=%d:%d' % (VH, W, VH) if fit == 'crop' else ('scale=-2:%d' % VH if fit == 'contain' else 'scale=%d:%d' % (W, VH))
        ox = '(W-w)/2' if fit == 'contain' else '0'   # contain: 정사각·세로 원본은 자르지 않고 높이 맞춰 가운데
        fc = (f"[0:v]trim=0:{tot},setpts=PTS-STARTPTS,{vf}[fg];"
              f"[{bgi}:v][fg]overlay={ox}:{VT}:shortest=1[v1];[v1][2:v]overlay=0:0:shortest=1[v2]")
    else:
        fc = (f"[0:v]trim=0:{tot},setpts=PTS-STARTPTS,split=2[a][b];"
              f"[a]scale=-2:{H},crop={W}:{H},boxblur=30:2,eq=brightness=-0.22[bg];[b]scale={W}:{VH}[fg];"
              f"[bg][fg]overlay=0:{VT}[v1];[v1][2:v]overlay=0:0:shortest=1[v2]")
    last = 'v2'
    for n, (k, s, e, (w, h)) in enumerate(ev):
        fc += f";[{last}][{n + 3}:v]overlay={(W - w) // 2}:{CAP_CY - h // 2}:enable='between(t,{s:.3f},{e - 0.001:.3f})'[c{n}]"; last = f'c{n}'
    bgm = a.bgm if a.bgm is not None else job.get('bgm', 'none')
    sfx = job.get('sfx', []) if (a.sfx or job.get('sfx_on', 'on')) == 'on' else []
    ain, afc, amap = AU.mix(base_index=3 + len(ev) + (1 if frame == 'news' else 0), tot=tot, dly=dly, bgm=None if bgm in (None, 'none') else P(bgm),
                            sfx=sfx, voice_words=T, layout=dict(LY['audio'], original_volume=job.get('original_volume', LY['audio']['original_volume'])))   # 이미 편집된 게시물(기존 음성 있음)은 0
    fc += ';' + afc
    mp4 = f"{out}/bobae_blackbox_{job['id']}.mp4"
    subprocess.run(['ffmpeg', '-y', '-v', 'error'] + inp + ain + ['-filter_complex', fc, '-map', f'[{last}]', '-map', amap, '-t', str(tot),
                    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30',
                    '-c:a', 'aac', '-ar', str(LY['audio']['rate']), '-b:a', '160k', mp4], check=True)
    AU.normalize(mp4, LY['audio'])
    # 표지: cover_t초 장면
    ct = job.get('cover_t', 3)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', str(ct), '-i', src, '-frames:v', '1', f'{out}/f.png'], check=True)
    fr = Image.open(f'{out}/f.png').convert('RGB'); bg = fr.resize((int(fr.width * H / fr.height), H))
    bg = bg.crop(((bg.width - W) // 2, 0, (bg.width - W) // 2 + W, H)).filter(ImageFilter.GaussianBlur(28))
    bg = Image.eval(bg, lambda v: int(v * 0.72)).convert('RGBA')
    if frame == 'news':
        bg = Image.open(f'{out}/bg.png').convert('RGBA'); sc = fr.resize((round(fr.width * VH / fr.height), VH))
        fg = sc.crop(((sc.width - W) // 2, 0, (sc.width - W) // 2 + W, VH)) if NF['video'].get('fit') == 'crop' else (sc if NF['video'].get('fit') == 'contain' else fr.resize((W, VH)))
    else:
        fg = fr.resize((W, VH))
    bg.alpha_composite(fg.convert('RGBA'), ((W - fg.width) // 2, VT)); bg.alpha_composite(st)
    bg.convert('RGB').save(f"{out}/bobae_blackbox_{job['id']}_cover.jpg", quality=92)
    g0, g1 = LY['safe_zone']['grid_crop_3x4']   # 인스타 프로필 격자(3:4)에서 보이는 부분
    bg.convert('RGB').crop((0, g0, W, g1)).save(f"{out}/bobae_blackbox_{job['id']}_cover_grid.jpg", quality=90)
    # check_be.py 형식 계획 파일(제목 칩 상자 = 정적 레이어의 노랑 칠 범위)
    import numpy as np
    al = np.asarray(st); yl = (al[..., 3] > 200) & (al[..., 0] > 200) & (al[..., 1] > 200) & (al[..., 2] < 90)
    if frame == 'news' and not NF.get('_chip_box'): yl[VT:, :] = False   # 제목 칩만(아래 영상제보 노랑 글자 제외)
    if NF.get('_chip_box'): yl[:] = False; x0b, y0b, x1b, y1b = NF['_chip_box']; yl[y0b:y1b, x0b:x1b] = ((al[..., 3] > 200) & (al[..., 0] > 200) & (al[..., 1] > 200) & (al[..., 2] < 90))[y0b:y1b, x0b:x1b]
    ys, xs = np.where(yl); box = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1] if len(xs) else None
    used = [h for h in sorted(sfx, key=lambda h: h['t'])][:LY['audio']['sfx']['max']]
    plan = {'edition_code': 'ED-BLACKBOX', 'layout_version': LY['version'], 'frame': [W, H], 'total': tot,
            'cuts': [], 'voice': voice, 'words': P(job['words']),
            'chips': [{'label': job['title']['chip'], 'kind': 'title', 't0': 0.0, 't1': tot, 'box': box,
                       'font_px_blackbox': LY['title']['size'], 'note': '블랙박스 제목은 영상 내내 고정(형식 예외)'}] if box else [],
            'sfx': [{'t': h['t'], 'sound': h['kind']} for h in used],
            'bgm': bgm, 'title_used': job.get('_title_used'), 'job': {k: v for k, v in job.items() if not k.startswith('_')}}
    json.dump(plan, open(mp4 + '.plan.json', 'w'), ensure_ascii=False, indent=1)
    print(mp4)


if __name__ == '__main__':
    main()
