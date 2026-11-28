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


def phrase(words, act):
    """ExtraBold 60 · 그림자 흰 글자 · 외곽선 없음 · 말하는 어절만 노랑"""
    c = LY['caption']; fnt = FN(c['font'], c['size']); text = ' '.join(words); lh = 80; gap = fnt.getlength(' ')
    tw = fnt.getlength(text); im = Image.new('RGBA', (int(tw + 80), lh + 40)); sh = Image.new('RGBA', im.size)
    ImageDraw.Draw(sh).text((im.width / 2 + 3, 20 + lh / 2 + 5), text, font=fnt, fill=(0, 0, 0, 220), anchor='mm', stroke_width=4, stroke_fill=(0, 0, 0, 220))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6))); d = ImageDraw.Draw(im); x = (im.width - tw) / 2
    for i, w in enumerate(words):
        d.text((x, 20 + lh / 2), w, font=fnt, fill=YEL if i == act else (255, 255, 255), anchor='lm'); x += fnt.getlength(w) + gap
    return im


def brand_emblem(px):
    """보배드림 로고 파일(심벌 + 워드마크)에서 원형 심벌만 잘라 비율 그대로 줄인다. 로고를 정사각형에 눌러 넣지 않는다."""
    lg = Image.open(os.path.join(REPO, 'public/assets/shortform/bobae_logo_600.png')).convert('RGBA')
    alpha = lg.getchannel('A'); w, h = lg.size; x = 0
    while x < w and alpha.crop((x, 0, x + 1, h)).getbbox(): x += 1  # 심벌 뒤 첫 빈 세로줄
    em = lg.crop((0, 0, x, h)); em = em.crop(em.getbbox())
    s = px / max(em.size)
    return em.resize((max(1, round(em.width * s)), max(1, round(em.height * s))), Image.LANCZOS)


def static_layer(job):
    st = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(st)
    b = LY['brand']; lg = brand_emblem(b['logo_px'])
    bf = FN(b['font'], b['size']); bw = int(d.textlength(b['text'], font=bf)); x0 = (W - (b['logo_px'] + 10 + bw)) // 2
    st.alpha_composite(lg, (x0, b['logo_y'])); d.text((x0 + b['logo_px'] + 10, b['text_y']), b['text'], font=bf, fill=tuple(b['color']), anchor='lm')
    t = job['title']; TD = LY['title']
    style = t.get('style') or TD['default_style']; shape = t.get('shape') or TD['default_shape'][style]
    if style == 'allchip':     # 모든 줄 원본 칩
        lk = LK.lockup_allchip([t['chip'] + ' ' + t['rest'], t['line2']], size=t.get('size', TD['allchip_size']), shape=shape)
    else:                      # onechip: 첫 낱말만 원본 칩(벨기에)
        lk = LK.lockup(t['chip'], t['rest'], t['line2'], shape=shape)
    job['_title_used'] = {'style': style, 'shape': lk.info.get('shapes', shape)}
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
    lines = [(t['chip'] + ' ' + t['rest']).strip(), t['line2']]; size = T['size']
    while size > 48 and max(FN(T['font'], size).getlength(x) for x in lines) > T['max_w']: size -= 2
    f = FN(T['font'], size); acc = T['accent']; acc = tuple(int(acc[i:i + 2], 16) for i in (1, 3, 5))
    sh = Image.new('RGBA', (W, H)); sd = ImageDraw.Draw(sh)
    ys = [T['center_y'] - T['line_gap'] / 2, T['center_y'] + T['line_gap'] / 2]
    for y, x in zip(ys, lines): sd.text((W / 2 + 2, y + 4), x, font=f, fill=(0, 0, 0, 150), anchor='mm')
    st.alpha_composite(sh.filter(ImageFilter.GaussianBlur(5)))
    for y, x, col in zip(ys, lines, [acc, tuple(T['line2_color'])]): d.text((W / 2, y), x, font=f, fill=col, anchor='mm')
    b = NF['brand']; lg = brand_emblem(b['logo_px']); bf = FN(b['font'], b['size']); txt = LY['brand']['text']
    bw = d.textlength(txt, font=bf); x0 = int((W - (lg.width + b['gap'] + bw)) / 2)
    st.alpha_composite(lg, (x0, int(b['center_y'] - lg.height / 2))); d.text((x0 + lg.width + b['gap'], b['center_y']), txt, font=bf, fill=tuple(b['color']), anchor='lm')
    c = NF['credit']; d.text((W / 2, c['y']), LY['credit']['text'], font=FN(LY['credit']['font'], c['size']), fill=tuple(c['color']), anchor='mm')
    job['_title_used'] = {'style': 'news', 'size': size}
    return st


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('job'); ap.add_argument('--out')
    ap.add_argument('--bgm', default=None); ap.add_argument('--title-style', choices=['onechip', 'allchip']); ap.add_argument('--chip-shape'); ap.add_argument('--sfx', default=None); ap.add_argument('--frame', choices=['default', 'news'])
    a = ap.parse_args(); jp = os.path.abspath(a.job); jd = os.path.dirname(jp); job = json.load(open(jp))
    if a.title_style: job['title']['style'] = a.title_style
    if a.chip_shape: job['title']['shape'] = a.chip_shape
    P = lambda p: p if os.path.isabs(p) else os.path.join(jd, p)
    out = os.path.abspath(a.out or os.path.join(jd, 'out_' + job['id'])); os.makedirs(out, exist_ok=True)
    src, voice = P(job['source']), P(job['voice']); dly = job.get('voice_delay_s', 1.0); tot = job['duration_s']
    global VT, VH, CAP_CY
    frame = a.frame or job.get('frame', 'default'); NF = LY['frames'].get(frame, {}); job['frame'] = frame
    if frame == 'news':
        VT, VH, CAP_CY = NF['video']['top'], NF['video']['height'], NF['caption']['center_y']
        st = static_layer_news(job, NF); gradient(NF['bg_top'], NF['bg_bottom']).save(f'{out}/bg.png')
    else:
        st = static_layer(job)
    st.save(f'{out}/static.png')
    WJ = json.load(open(P(job['words']))); TXT = [w.strip('.,') for w, _, _ in WJ]; T = [(x, y) for _, x, y in WJ]
    CH = job['chunks']; ev = []; k = 0
    for ci, c in enumerate(CH):
        end_c = T[CH[ci + 1][0]][0] if ci + 1 < len(CH) else T[c[-1]][1] + 0.6
        for j, wi in enumerate(c):
            s = T[wi][0]; e = T[c[j + 1]][0] if j + 1 < len(c) else end_c
            im = phrase([TXT[i] for i in c], j); im.save(f'{out}/c{k}.png'); ev.append((k, s + dly, e + dly, im.size)); k += 1
    inp = ['-i', src, '-i', voice, '-loop', '1', '-i', f'{out}/static.png']
    for e in ev: inp += ['-loop', '1', '-i', f'{out}/c{e[0]}.png']
    if frame == 'news':   # 단색 그라데이션 배경 + 영상 가운데 자르기(YTN 비율)
        inp += ['-loop', '1', '-i', f'{out}/bg.png']; bgi = 3 + len(ev)
        fc = (f"[0:v]trim=0:{tot},setpts=PTS-STARTPTS,scale=-2:{VH},crop={W}:{VH}[fg];"
              f"[{bgi}:v][fg]overlay=0:{VT}:shortest=1[v1];[v1][2:v]overlay=0:0:shortest=1[v2]")
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
                            sfx=sfx, voice_words=T, layout=LY['audio'])
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
        fg = sc.crop(((sc.width - W) // 2, 0, (sc.width - W) // 2 + W, VH))
    else:
        fg = fr.resize((W, VH))
    bg.alpha_composite(fg.convert('RGBA'), (0, VT)); bg.alpha_composite(st)
    bg.convert('RGB').save(f"{out}/bobae_blackbox_{job['id']}_cover.jpg", quality=92)
    # check_be.py 형식 계획 파일(제목 칩 상자 = 정적 레이어의 노랑 칠 범위)
    import numpy as np
    al = np.asarray(st); yl = (al[..., 3] > 200) & (al[..., 0] > 200) & (al[..., 1] > 200) & (al[..., 2] < 90)
    ys, xs = np.where(yl[:LY['title']['zone'][1]]); box = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1] if len(xs) else None
    used = [h for h in sorted(sfx, key=lambda h: h['t'])][:LY['audio']['sfx']['max']]
    plan = {'edition_code': 'ED-BLACKBOX', 'layout_version': LY['version'], 'frame': [W, H], 'total': tot,
            'cuts': [], 'voice': voice, 'words': P(job['words']),
            'chips': [{'label': job['title']['chip'], 'kind': 'title', 't0': 0.0, 't1': tot, 'box': box,
                       'font_px_blackbox': LY['title']['size'], 'note': '블랙박스 제목은 영상 내내 고정(형식 예외)'}] if frame != 'news' else [],
            'sfx': [{'t': h['t'], 'sound': h['kind']} for h in used],
            'bgm': bgm, 'title_used': job.get('_title_used'), 'job': {k: v for k, v in job.items() if not k.startswith('_')}}
    json.dump(plan, open(mp4 + '.plan.json', 'w'), ensure_ascii=False, indent=1)
    print(mp4)


if __name__ == '__main__':
    main()
