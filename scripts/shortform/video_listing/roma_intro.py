# 로마 스파이더 인트로(r23, 2026-11-24 사용자 「인트로 만들고」) — 본편(벨기에판) 앞에 붙이는 약 1.6초 훅
#  ① 하이라이트 4컷 번쩍 넘김(휠 → 엔진 → 운전석 → 뒷모습, 컷마다 흰 섬광 2프레임 + 1.08배 → 1배 당김)
#  ② 차 전체 장면 뒤에 큰 흰 글자 「ROMA」 — 차 윤곽(u2netp로 찾음)을 글자 위에 다시 얹어 글자가 차 뒤에 있게 함. 차 픽셀은 그대로(반사기 원칙)
#  색: 흰 글자만(벨기에판 노랑 한 색 규칙, 금색 미사용). 효과음: 첫 컷 휙 · ROMA 쿵, 자체 효과음만
#  실행: python3 roma_intro.py 원본src.mp4 본편.mp4 결과.mp4
import os, sys, subprocess, json
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from g350_v5_lib import BK
from rembg import new_session, remove

SRC, MAIN, OUT = sys.argv[1:4]
REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
SFX = os.path.join(REPO, 'public', 'assets', 'shortform', 'sfx')
W, H, FPS = 1080, 1920, 30
FLASH = [14.5, 201.0, 52.5, 173.5]   # 휠 · 엔진 · 운전석 · 뒷모습 (원본 초)
FN = 7                                # 컷당 7프레임 = 0.23초
ROMA_T0, ROMA_N = 217.6, 21           # 차 전체 장면 0.7초
WORD = os.environ.get('INTRO_WORD', 'ROMA')

def grab(t, n):
    cap = cv2.VideoCapture(SRC); cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); out = []
    for _ in range(n):
        ok, f = cap.read()
        if not ok: break
        out.append(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    return out

def punch(img, k):   # 가운데 기준 k배 확대 후 자르기
    if k <= 1.0001: return img
    h, w = img.shape[:2]; r = cv2.resize(img, (int(w * k), int(h * k)), interpolation=cv2.INTER_LINEAR)
    y0, x0 = (r.shape[0] - h) // 2, (r.shape[1] - w) // 2
    return r[y0:y0 + h, x0:x0 + w]

frames = []
for t in FLASH:
    for i, f in enumerate(grab(t, FN)):
        f = punch(f, 1.08 - 0.08 * min(1, i / (FN - 1)))
        if i < 2: f = (f * (1 - (0.75, 0.35)[i]) + 255 * (0.75, 0.35)[i]).astype('uint8')
        frames.append(f)

sess = new_session('u2netp'); fs = grab(ROMA_T0, ROMA_N)
m0 = np.array(remove(Image.fromarray(fs[0]), session=sess, only_mask=True))
n_, lab_, st_, _ = cv2.connectedComponentsWithStats((m0 > 128).astype('uint8')); big_ = 1 + int(np.argmax(st_[1:, 4]))   # 가장 큰 덩어리 = 이 차
car_top = int(st_[big_, 1]); car_h = int(st_[big_, 3])
m0 = cv2.morphologyEx(np.where(lab_ == big_, 255, 0).astype('uint8'), cv2.MORPH_OPEN, np.ones((25, 25), np.uint8))   # 옆 차와 붙은 가는 다리 끊기
n_, lab_, st_, _ = cv2.connectedComponentsWithStats((m0 > 128).astype('uint8')); big_ = 1 + int(np.argmax(st_[1:, 4]))
CAR0 = cv2.dilate(np.where(lab_ == big_, 255, 0).astype('uint8'), np.ones((61, 61), np.uint8)) > 0   # 첫 장면 이 차 자리(+30px) — 카메라가 조금 움직여도 덮음
car_top = int(st_[big_, 1]); car_h = int(st_[big_, 3])
font = BK(330); bb = font.getbbox(WORD); tw, th = bb[2] - bb[0], bb[3] - bb[1]
base_y = car_top - int(th * 0.38)     # 글자 아래 약 60%가 차 지붕·앞유리·후드 뒤로 숨음
txt = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(txt)
sh = Image.new('RGBA', (W, H)); ImageDraw.Draw(sh).text(((W - tw) // 2 - bb[0] + 8, base_y - bb[1] + 14), WORD, font=font, fill=(0, 0, 0, 150))
txt.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
d.text(((W - tw) // 2 - bb[0], base_y - bb[1]), WORD, font=font, fill=(255, 255, 255, 255))
for i, f in enumerate(fs):
    mr = np.array(remove(Image.fromarray(f), session=sess, only_mask=True))
    nn, lb, stt, _ = cv2.connectedComponentsWithStats((mr > 128).astype('uint8')); bi = 1 + int(np.argmax(stt[1:, 4]))
    m = np.where((lb == bi) & CAR0, mr, 0).astype(np.float32) / 255.0   # 이 차만(뒤에 선 다른 차는 글자를 가리지 않음)
    m = cv2.GaussianBlur(m, (5, 5), 0)[..., None]
    k = 1.25 - 0.25 * min(1, i / 4)   # 0.13초에 쾅 내려앉음
    t2 = txt.resize((int(W * k), int(H * k)), Image.LANCZOS); cx, cy = W // 2, base_y + th // 2
    lay = Image.new('RGBA', (W, H)); lay.alpha_composite(t2, (int(cx - cx * k), int(cy - cy * k)))
    a = min(1.0, (i + 1) / 3)
    la = np.array(lay).astype(np.float32); al = la[..., 3:4] / 255.0 * a
    comp = f * (1 - al) + la[..., :3] * al
    comp = comp * (1 - m) + f * m        # 차 윤곽은 원본 그대로 글자 위로
    frames.append(punch(comp.astype('uint8'), 1.04 - 0.04 * i / (ROMA_N - 1)))

n = len(frames); dur = n / FPS
tmpv = OUT + '.intro_v.mp4'
p = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', tmpv], stdin=subprocess.PIPE)
for f in frames: p.stdin.write(np.ascontiguousarray(f).tobytes())
p.stdin.close(); p.wait()
t_roma = len(FLASH) * FN / FPS
fc = (f"[1:a]adelay=0|0,volume=0.9[w];[2:a]adelay={int(t_roma*1000)}|{int(t_roma*1000)},volume=1.0[k];"
      f"[w][k]amix=inputs=2:normalize=0,apad,atrim=0:{dur:.3f},aformat=sample_rates=48000:channel_layouts=stereo[ia];"
      f"[0:v]setsar=1[iv];[3:v]setsar=1[mv];[3:a]aformat=sample_rates=48000:channel_layouts=stereo[ma];"
      f"[iv][ia][mv][ma]concat=n=2:v=1:a=1[v][a]")
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', tmpv, '-i', os.path.join(SFX, 'whoosh.wav'), '-i', os.path.join(SFX, 'impact.wav'), '-i', MAIN,
                '-filter_complex', fc, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p',
                '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', OUT], check=True)
os.remove(tmpv)
json.dump({'intro_s': round(dur, 3), 'flash_src_s': FLASH, 'roma_src_s': [ROMA_T0, ROMA_T0 + ROMA_N / FPS], 'word': WORD, 'car_top_px': car_top,
           'sfx': [{'t': 0.0, 'sound': 'whoosh'}, {'t': round(t_roma, 3), 'sound': 'impact'}]}, open(OUT + '.intro.json', 'w'), ensure_ascii=False, indent=1)
print(OUT, round(dur, 3))
