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


def static_layer(job):
    st = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(st)
    b = LY['brand']; lg = Image.open(os.path.join(REPO, 'public/assets/shortform/bobae_logo_600.png')).convert('RGBA').resize((b['logo_px'],) * 2)
    bf = FN(b['font'], b['size']); bw = int(d.textlength(b['text'], font=bf)); x0 = (W - (b['logo_px'] + 10 + bw)) // 2
    st.alpha_composite(lg, (x0, b['logo_y'])); d.text((x0 + b['logo_px'] + 10, b['text_y']), b['text'], font=bf, fill=tuple(b['color']), anchor='lm')
    t = job['title']; lk = LK.lockup(t['chip'], t['rest'], t['line2'])
    z0, z1 = LY['title']['zone']; st.alpha_composite(lk, ((W - lk.width) // 2, (z0 + z1 - lk.height) // 2))
    c = LY['credit']; d.text((W / 2, c['y']), c['text'], font=FN(c['font'], c['size']), fill=tuple(c['color']), anchor='mm')
    return st


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('job'); ap.add_argument('--out')
    ap.add_argument('--bgm', default=None); ap.add_argument('--sfx', default=None)
    a = ap.parse_args(); jp = os.path.abspath(a.job); jd = os.path.dirname(jp); job = json.load(open(jp))
    P = lambda p: p if os.path.isabs(p) else os.path.join(jd, p)
    out = os.path.abspath(a.out or os.path.join(jd, 'out_' + job['id'])); os.makedirs(out, exist_ok=True)
    src, voice = P(job['source']), P(job['voice']); dly = job.get('voice_delay_s', 1.0); tot = job['duration_s']
    st = static_layer(job); st.save(f'{out}/static.png')
    WJ = json.load(open(P(job['words']))); TXT = [w.strip('.,') for w, _, _ in WJ]; T = [(x, y) for _, x, y in WJ]
    CH = job['chunks']; ev = []; k = 0
    for ci, c in enumerate(CH):
        end_c = T[CH[ci + 1][0]][0] if ci + 1 < len(CH) else T[c[-1]][1] + 0.6
        for j, wi in enumerate(c):
            s = T[wi][0]; e = T[c[j + 1]][0] if j + 1 < len(c) else end_c
            im = phrase([TXT[i] for i in c], j); im.save(f'{out}/c{k}.png'); ev.append((k, s + dly, e + dly, im.size)); k += 1
    inp = ['-i', src, '-i', voice, '-loop', '1', '-i', f'{out}/static.png']
    for e in ev: inp += ['-loop', '1', '-i', f'{out}/c{e[0]}.png']
    fc = (f"[0:v]trim=0:{tot},setpts=PTS-STARTPTS,split=2[a][b];"
          f"[a]scale=-2:{H},crop={W}:{H},boxblur=30:2,eq=brightness=-0.22[bg];[b]scale={W}:{VH}[fg];"
          f"[bg][fg]overlay=0:{VT}[v1];[v1][2:v]overlay=0:0:shortest=1[v2]")
    last = 'v2'
    for n, (k, s, e, (w, h)) in enumerate(ev):
        fc += f";[{last}][{n + 3}:v]overlay={(W - w) // 2}:{CAP_CY - h // 2}:enable='between(t,{s:.3f},{e - 0.001:.3f})'[c{n}]"; last = f'c{n}'
    bgm = a.bgm if a.bgm is not None else job.get('bgm', 'none')
    sfx = job.get('sfx', []) if (a.sfx or job.get('sfx_on', 'on')) == 'on' else []
    ain, afc, amap = AU.mix(base_index=3 + len(ev), tot=tot, dly=dly, bgm=None if bgm in (None, 'none') else P(bgm),
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
    bg = Image.eval(bg, lambda v: int(v * 0.72)).convert('RGBA'); bg.alpha_composite(fr.resize((W, VH)).convert('RGBA'), (0, VT)); bg.alpha_composite(st)
    bg.convert('RGB').save(f"{out}/bobae_blackbox_{job['id']}_cover.jpg", quality=92)
    json.dump({'job': job, 'layout_version': LY['version'], 'bgm': bgm, 'sfx': sfx}, open(mp4 + '.plan.json', 'w'), ensure_ascii=False, indent=1)
    print(mp4)


if __name__ == '__main__':
    main()
