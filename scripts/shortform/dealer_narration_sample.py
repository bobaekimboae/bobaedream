"""딜러 내레이션형 숏폼 샘플: 매물 사진 + 매물 정보 -> 대본 -> TTS(어절 시각) -> 컷 맞춤 -> 자막·그래픽 -> mp4."""
import asyncio, json, math, os, re, subprocess, sys
import certifi
certifi.where = lambda: '/root/.ccr/ca-bundle.crt'
import edge_tts
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = os.environ.get('OUT_DIR', os.path.join(os.getcwd(), 'shortform-out'))
os.makedirs(OUT, exist_ok=True)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PH = os.path.join(ROOT, 'public', 'assets', 'cars', 'seoul-autogallery-v01', 'rr', 'rr-%02d.jpg')
W, H, FPS = 1080, 1920, 30
VOICE, RATE = 'ko-KR-InJoonNeural', '+18%'
SANS = '/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc'
SANS_B = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
SERIF = '/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc'

# ③ 대본 8블록 (매물 정보와 사진에 보이는 사실만)
BLOCKS = [
    dict(key='s1', part='매장 입구', text='안녕하세요, 투제이모터웍스 김태규입니다.', shots=[(1, 'in')]),
    dict(key='s2', part='앞모습', text='오늘 보여드릴 차는 4세대 레인지로버 최상위 트림, SV 오토바이오그래피 롱휠베이스입니다.', shots=[(2, 'R')], title=True),
    dict(key='s4', part='옆모습', text='옆에서 보시면 차가 길죠. 롱바디라 뒷좌석이 훨씬 넓습니다.', shots=[(2, 'L')], label='롱휠베이스 (LWB)'),
    dict(key='s5', part='휠', text='휠 상태 보시고요,', shots=[(9, 'in')]),
    dict(key='s6', part='뒷모습', text='뒤로 돌아갑니다.', shots=[(3, 'R')]),
    dict(key='s7', part='엔진룸', text='보닛 열어보면 5.0 V8 슈퍼차저 가솔린 엔진입니다.', shots=[(5, 'in')], label='5.0 V8 슈퍼차저 · 가솔린'),
    dict(key='s8', part='운전석', text='운전석 문 열어볼게요.', shots=[(11, 'L')]),
    dict(key='s9', part='시트', text='시트는 브라운 다이아몬드 퀼팅 가죽, 상태 직접 보시죠.', shots=[(8, 'R')], label='브라운 다이아몬드 퀼팅 가죽'),
    dict(key='s10', part='핸들', text='핸들은 우드 스티어링 휠이고요,', shots=[(12, 'in')], label='우드 스티어링 휠'),
    dict(key='s11', part='계기판', text='디지털 계기판, 주행거리는 5만 1천 6백 킬로미터입니다.', shots=[(6, 'in')], label='주행거리 51,601km'),
    dict(key='s12', part='헤드업 디스플레이', text='앞 유리에 헤드업 디스플레이도 나오고요,', shots=[(14, 'in')], label='헤드업 디스플레이'),
    dict(key='s13', part='센터페시아', text='가운데 터치스크린이 위아래 두 개,', shots=[(13, 'R')], label='듀얼 터치스크린'),
    dict(key='s14', part='카메라', text='어라운드 뷰 카메라도 들어가 있습니다.', shots=[(16, 'in')], label='어라운드 뷰 카메라'),
    dict(key='s15', part='기어', text='다이얼 기어 옆에 오토바이오그래피 각인 보이시죠.', shots=[(7, 'in')]),
    dict(key='s16', part='트렁크', text='트렁크도 매트까지 깔끔합니다.', shots=[(10, 'in')]),
    dict(key='s17', part='정리', text='2019년식 레인지로버 SV 오토바이오그래피, 자세한 정보는 하단 본문 참고해 주시고, 서울오토갤러리 매장에서 직접 보실 수 있습니다. 감사합니다.',
         shots=[(2, 'out'), (3, 'L')], end=True),
]
HIGHLIGHT = re.compile(r'(\d|V8|SV|슈퍼차저|롱휠베이스|롱바디|퀼팅|우드|헤드업|어라운드|디지털|윗급|두)')


async def tts(text, path):
    c = edge_tts.Communicate(text, VOICE, rate=RATE, boundary='WordBoundary')
    words = []
    with open(path, 'wb') as f:
        async for ch in c.stream():
            if ch['type'] == 'audio':
                f.write(ch['data'])
            elif ch['type'] == 'WordBoundary':
                words.append((ch['offset'] / 1e7, (ch['offset'] + ch['duration']) / 1e7, ch['text']))
    return words


def dur(path):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]))


def build_audio():
    t, gap, timeline, parts = 0.3, 0.18, [], []
    for i, b in enumerate(BLOCKS):
        p = os.path.join(OUT, f'b{i}.mp3')
        words = asyncio.run(tts(b['text'], p))
        d = (words[-1][1] + 0.15) if words else dur(p)
        b['start'], b['end'] = t, t + d
        b['words'] = [(t + s, t + e, w) for s, e, w in words]
        parts.append((p, t))
        t += d + gap
    total = t + (2.6 if BLOCKS[-1].get('end') else 0.4)
    # 블록 음성을 시각에 맞게 겹치지 않게 놓기
    inputs, filt = [], []
    for k, (p, st) in enumerate(parts):
        inputs += ['-i', p]
        filt.append(f'[{k}:a]adelay={int(st*1000)}|{int(st*1000)},aformat=channel_layouts=stereo[a{k}]')
    mix = ''.join(f'[a{k}]' for k in range(len(parts)))
    filt.append(f'{mix}amix=inputs={len(parts)}:normalize=0,apad=whole_dur={total}[v]')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', ';'.join(filt), '-map', '[v]',
                    '-t', f'{total}', '-ar', '44100', os.path.join(OUT, 'voice.wav')], check=True)
    return total


def load_photo(n):
    im = Image.open(PH % n).convert('RGB')
    s = H / im.height * 1.12
    return im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)


def frame_bg(im, move, p):
    """사진을 세로 화면에 꽉 채워 천천히 움직이기(켄 번스). p = 0..1"""
    e = p * p * (3 - 2 * p)
    iw, ih = im.size
    if move in ('in', 'out'):
        z = 1.0 + 0.10 * (e if move == 'in' else 1 - e)
        ch = ih / z
        cw = ch * W / H
        x, y = (iw - cw) / 2, (ih - ch) / 2
    else:
        ch, cw = ih, ih * W / H
        span = iw - cw
        x = span * (0.25 + 0.5 * (e if move == 'R' else 1 - e))
        y = 0
    return im.crop((int(x), int(y), int(x + cw), int(y + ch))).resize((W, H), Image.BILINEAR)


F_CAP = ImageFont.truetype(SANS, 92)
F_LABEL = ImageFont.truetype(SANS_B, 40)
F_NOTICE = ImageFont.truetype(SANS_B, 38)
F_T1 = ImageFont.truetype(SERIF, 120, index=0)
F_T2 = ImageFont.truetype(SERIF, 64, index=0)
F_END1 = ImageFont.truetype(SANS, 64)
F_END2 = ImageFont.truetype(SANS_B, 40)


def text_c(d, y, s, font, fill, stroke=0, sfill='#000'):
    w = d.textlength(s, font=font)
    d.text(((W - w) / 2, y), s, font=font, fill=fill, stroke_width=stroke, stroke_fill=sfill)


def draw_overlays(img, t, total):
    d = ImageDraw.Draw(img, 'RGBA')
    blk = next((b for b in BLOCKS if b['start'] - 0.2 <= t <= b['end'] + 0.28), None)
    # 사양 라벨(흰 박스)
    if blk and blk.get('label'):
        s = blk['label']; w = d.textlength(s, font=F_LABEL)
        y = int(H * 0.645)
        d.rectangle(((W - w) / 2 - 22, y - 8, (W + w) / 2 + 22, y + 58), fill=(255, 255, 255, 240))
        text_c(d, y, s, F_LABEL, '#1F3A2E')
    if blk and blk.get('part') and not blk.get('title'):
        s = blk['part']; w = d.textlength(s, font=F_NOTICE)
        y = int(H * 0.17)
        d.rectangle(((W - w) / 2 - 20, y - 8, (W + w) / 2 + 20, y + 56), fill=(255, 255, 255, 240))
        text_c(d, y, s, F_NOTICE, '#222')
    # 타이틀 카드 + 빛 줄기
    if blk and blk.get('title'):
        p = (t - blk['start']) / max(0.1, blk['end'] - blk['start'])
        if 0 <= p <= 1:
            a = int(255 * min(1, p * 5, (1 - p) * 5))
            layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            ld = ImageDraw.Draw(layer)
            for yy in range(0, int(H * 0.42)):
                ld.line((0, yy, W, yy), fill=(0, 0, 0, int(a * 0.55 * (1 - yy / (H * 0.42)))))
            for (y, s, f) in ((int(H * 0.12), 'RANGE ROVER', F_T1), (int(H * 0.215), 'SV Autobiography LWB', F_T2)):
                w = ld.textlength(s, font=f)
                ld.text(((W - w) / 2, y), s, font=f, fill=(255, 255, 255, a), stroke_width=3, stroke_fill=(0, 0, 0, a // 2))
                fx = int(-200 + (W + 400) * p)
                fl = Image.new('RGBA', (W, H), (0, 0, 0, 0))
                fd = ImageDraw.Draw(fl)
                cy = y + int(f.size * 0.62)
                fd.line((fx - 260, cy, fx + 260, cy), fill=(255, 220, 235, int(a * 0.8)), width=3)
                fd.ellipse((fx - 9, cy - 9, fx + 9, cy + 9), fill=(255, 255, 255, a))
                fl = fl.filter(ImageFilter.GaussianBlur(3))
                layer = Image.alpha_composite(layer, fl)
                ld = ImageDraw.Draw(layer)
            img.paste(layer.convert('RGB'), (0, 0), layer)
    # 어절 자막: 지금 말하는 어절 하나
    for b in BLOCKS:
        for (s, e, w) in b['words']:
            if s - 0.02 <= t < e + 0.12:
                col = '#FFD60A' if HIGHLIGHT.search(w) else '#FFFFFF'
                text_c(d, int(H * 0.71), w.strip('.,'), F_CAP, col, stroke=6)
                break
    # 끝 명함
    end_t = BLOCKS[-1]['end'] + 0.3
    if t >= end_t:
        a = int(min(1, (t - end_t) / 0.4) * 225)
        d.rectangle((0, 0, W, H), fill=(0, 0, 0, a))
        if a > 120:
            text_c(d, int(H * 0.40), '김태규 딜러', F_END1, '#FFFFFF')
            text_c(d, int(H * 0.40) + 96, '투제이모터웍스 · 서울오토갤러리', F_END2, '#DDDDDD')
            text_c(d, int(H * 0.40) + 170, '보배드림에서 매물 보기', F_END2, '#FFD60A')


def main():
    total = build_audio()
    # ⑥ 컷 맞추기: 블록 시간 안에서 사진 컷을 고르게 나눔
    cuts = []
    for i, b in enumerate(BLOCKS):
        st = b['start'] if i else 0.0
        en = BLOCKS[i + 1]['start'] if i + 1 < len(BLOCKS) else total
        n = len(b['shots'])
        for k, (ph, mv) in enumerate(b['shots']):
            cuts.append((st + (en - st) * k / n, st + (en - st) * (k + 1) / n, ph, mv))
    photos = {ph: load_photo(ph) for _, _, ph, _ in cuts}
    nf = int(total * FPS)
    out = os.path.join(OUT, 'bobae_shortform_sample_rangerover.mp4')
    enc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                            '-i', '-', '-i', os.path.join(OUT, 'voice.wav'), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21',
                            '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    for f in range(nf):
        t = f / FPS
        c = next(c for c in cuts if c[0] <= t < c[1]) if t < cuts[-1][1] else cuts[-1]
        p = (t - c[0]) / max(0.01, c[1] - c[0])
        img = frame_bg(photos[c[2]], c[3], min(1, p))
        draw_overlays(img, t, total)
        enc.stdin.write(img.tobytes())
    enc.stdin.close(); enc.wait()
    json.dump({'total': total, 'cuts': len(cuts), 'blocks': [{k: b[k] for k in ('key', 'start', 'end', 'text')} for b in BLOCKS]},
              open(os.path.join(OUT, 'sample_meta.json'), 'w'), ensure_ascii=False, indent=1)
    print('done', out, round(total, 1), 's', len(cuts), 'cuts')


if __name__ == '__main__':
    main()
