"""타임라인을 영상으로: 바탕(사진 슬라이드 또는 영상) 위에 스킬을 프레임마다 얹고, 자체 효과음을 섞어 mp4로.
python3 -m edit_skills.render plan.json out.mp4 --photos a.jpg b.jpg ... [--video base.mp4] [--voice voice.wav]
- 사진은 고치지 않는다(자르기·천천히 확대만). 번호판도 가리지 않는다(사용자 규칙).
- 효과음은 public/assets/shortform/sfx 의 자체 소리(pop·ding·whoosh·click)만 쓴다.
"""
import argparse, json, os, subprocess, sys, wave
import numpy as np
from PIL import Image
from . import draw as D
from .motion import at, FPS
from .registry import build, SPEC

SFX_DIR = os.path.join(D.ROOT, '..', '..', 'public', 'assets', 'shortform', 'sfx')
SR = 48000
SFX_MAP = dict(pop='pop', ding='ding', whoosh='whoosh', click='click', buzz='click')


def _bg_photos(photos, total, track=None):
    """track = [(start, dur, 사진 경로)] 장면마다 사진(없으면 고르게 나눔)"""
    if not track:
        per = total / len(photos)
        track = [(i * per, per, p) for i, p in enumerate(photos)]
    from PIL import ImageFilter, ImageEnhance
    ZOOM = .06                            # 천천히 당겨 보이기(6%)
    cache = []
    for _, _, p in track:
        im = Image.open(p).convert('RGB')
        if im.width / im.height > D.W / D.H * 1.15:
            # 가로 사진(매물 사진 1120x840 등): 세로 화면에 꽉 채우려고 늘리면 2.5배 확대돼 깨진다.
            # → 사진은 화면 폭에 맞춰 원래 선명도로 가운데 두고, 위아래는 같은 사진을 흐리게 깐다(사진 자체는 고치지 않음)
            fw = int(D.W * (1 + ZOOM))
            fg = im.resize((fw, round(im.height * fw / im.width)), Image.LANCZOS)
            bg = D._cover(im, D.W, D.H).filter(ImageFilter.GaussianBlur(40))
            bg = ImageEnhance.Brightness(bg).enhance(.55)
            cache.append(('wide', bg, fg))
        else:
            cache.append(('cover', D._cover(im, int(D.W * (1 + ZOOM)), int(D.H * (1 + ZOOM))), None))

    def frame(t):
        i = max([k for k, (s0, _, _) in enumerate(track) if s0 <= t + 1e-6] or [0])
        per = track[i][1]
        x = min(1, (t - track[i][0]) / per)
        kind, a, b = cache[i]
        s = 1 + ZOOM * x
        if kind == 'wide':
            w = int(D.W * s)
            fg = b.resize((w, round(b.height * w / b.width)), Image.BICUBIC) if w != b.width else b
            ox = (fg.width - D.W) // 2
            fg = fg.crop((ox, 0, ox + D.W, fg.height))
            out = a.copy()
            out.paste(fg, (0, (D.H - fg.height) // 2))
            return out
        w, h = int(D.W * s), int(D.H * s)
        im = a.resize((w, h), Image.BICUBIC) if w != a.width else a
        ox, oy = (im.width - D.W) // 2, (im.height - D.H) // 2
        return im.crop((ox, oy, ox + D.W, oy + D.H))
    return frame


def _bg_video(path):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'fps={FPS},scale={D.W}:{D.H}:force_original_aspect_ratio=increase,crop={D.W}:{D.H}',
                          '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    last = [Image.new('RGB', (D.W, D.H))]

    def frame(t):
        b = p.stdout.read(D.W * D.H * 3)
        if len(b) == D.W * D.H * 3:
            last[0] = Image.frombytes('RGB', (D.W, D.H), b)
        return last[0]
    return frame


def _sfx_track(tl, total, voice=None):
    n = int(total * SR) + SR
    mix = np.zeros(n)
    if voice:
        a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', voice, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout, np.int16) / 32767
        mix[:min(n, len(a))] += a[:n]
    for e in tl:
        name = SFX_MAP.get(e.get('sfx') or 'none')
        if not name:
            continue
        with wave.open(os.path.join(SFX_DIR, name + '.wav')) as w:
            s = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32767
            if w.getnchannels() == 2:
                s = s.reshape(-1, 2).mean(1)
        i = int(e['start'] * SR)
        mix[i:i + len(s)] += s[:max(0, n - i)] * .55   # 목소리보다 작게
    return np.clip(mix, -1, 1)


def render(plan, out, photos=None, video=None, voice=None, track=None):
    total = plan['duration']
    tl = plan['timeline']
    bg = _bg_video(video) if video else _bg_photos(photos, total, track)
    tmp_v = out + '.v.mp4'
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{D.W}x{D.H}', '-r', str(FPS), '-i', '-',
                            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', tmp_v], stdin=subprocess.PIPE)
    static = {}
    for fi in range(int(total * FPS)):
        t = fi / FPS
        fr = bg(t).convert('RGBA')
        for k, e in enumerate(tl):
            lt = t - e['start']
            m = at(e['motion'], lt, e['dur'])
            if m is None:
                continue
            sc, al, dx, dy = m
            prog = lt / e['dur']
            if e['motion'] in ('count', 'type', 'wipe') or e['id'] in ('S003', 'S024', 'S026', 'S027', 'S038'):
                im = build(e['id'], e['params'], prog)
            else:
                im = static.get(k) or static.setdefault(k, build(e['id'], e['params']))
            if e['zone'] == 'full':
                fr.alpha_composite(im.convert('RGBA').resize((D.W, D.H)))
                continue
            if sc != 1.0:
                im = im.resize((max(1, int(im.width * sc)), max(1, int(im.height * sc))), Image.BILINEAR)
            if al < 1:
                im = im.copy()
                im.putalpha(im.getchannel('A').point(lambda v, a=al: int(v * a)))
            x = int(e['cx'] * D.W - im.width / 2 + dx)
            y = int(e['cy'] * D.H - im.height / 2 + dy)
            fr.alpha_composite(im, (max(-im.width + 1, min(D.W - 1, x)), max(-im.height + 1, min(D.H - 1, y))))
        enc.stdin.write(fr.convert('RGB').tobytes())
    enc.stdin.close()
    enc.wait()
    a = _sfx_track(tl, total, voice)
    tmp_a = out + '.a.wav'
    with wave.open(tmp_a, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((a * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp_v, '-i', tmp_a, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', out], check=True)
    os.remove(tmp_v); os.remove(tmp_a)
    return out


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('plan'); ap.add_argument('out')
    ap.add_argument('--photos', nargs='*'); ap.add_argument('--video'); ap.add_argument('--voice')
    a = ap.parse_args()
    render(json.load(open(a.plan, encoding='utf-8')), a.out, a.photos, a.video, a.voice)
