"""차란차 X5 모션그래픽(노션 '클로드 매물영상 파이프라인') 캡컷 재현용 에셋·타임라인 만들기.
사용: python render_x5_assets.py <완성 레퍼런스.mp4> <원본.mp4> <출력폴더> <폰트폴더>
- 레퍼런스와 원본의 차이(초당 5장)로 콜아웃(점+점선+라벨) 위치를 찾아 키프레임으로 씀(트래킹 대체)
- 콜아웃은 PNG 스프라이트(우리 그림), 제목·스탯·카운트업은 캡컷 글자(캡컷 기본 애니메이션)로 넘긴다
- 문구는 레퍼런스 화면 그대로(노션 문서 '한계': 트렁크 용량 등 일부는 일반 정보라 발행 전 확인 필요)
"""
import json, os, subprocess, sys
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter
REF, SRC, OUT, FONTS = sys.argv[1:5]
os.makedirs(OUT, exist_ok=True)
W, H = 540, 960
F = lambda w, s: ImageFont.truetype(os.path.join(FONTS, f"Pretendard-{w}.otf"), s)

def frames(p):
    pr = subprocess.Popen(["ffmpeg", "-v", "error", "-i", p, "-vf", "fps=5,scale=540:960", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    while True:
        b = pr.stdout.read(W * H * 3)
        if len(b) < W * H * 3: break
        yield np.frombuffer(b, np.uint8).reshape(H, W, 3)

boxes = []
for a, b in zip(frames(REF), frames(SRC)):
    d = (np.abs(a.astype(int) - b.astype(int)).max(2) > 60).astype(np.uint8)
    d = cv2.morphologyEx(d, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, lab, st, cen = cv2.connectedComponentsWithStats(d)
    boxes.append([list(map(int, s[:4])) for s in st[1:] if s[4] > 150])

# (시작, 끝, 라벨, 보조문구) — 레퍼런스 화면 문구 그대로. 위치는 차이 상자에서 자동
CALL = [(9.8, 11.4, "LED 테일램프", ""), (11.6, 13.2, "M 스포츠 패키지", "전후 범퍼 · 디퓨저"),
        (14.0, 15.8, "전동 트렁크", ""), (20.4, 21.8, "분할 테일게이트", "상·하 2단 오픈"),
        (22.4, 24.1, "파노라마 선루프", ""), (24.2, 25.4, "4존 에어컨", ""), (26.8, 27.8, "헤드업 디스플레이", ""),
        (28.0, 29.6, "12.3인치 디지털 계기판", ""), (29.8, 31.6, "크리스탈 기어 노브", ""),
        (33.2, 35.0, "12.3인치 디스플레이", "터치스크린 · 내비게이션"), (36.6, 37.8, "브라운 가죽 시트", ""),
        (38.0, 39.2, "하만카돈", "서라운드 사운드 시스템"), (40.6, 42.6, "M 스포츠 스티어링 휠", ""),
        (44.0, 46.0, "앰비언트 라이트", "실내 무드 조명"), (46.2, 48.0, "8단 자동변속기", "스텝트로닉"),
        (48.8, 51.0, "에어 서스펜션", "차고 조절 가능"), (52.6, 54.8, "서라운드 뷰", "360° 카메라"),
        (55.2, 57.2, "후진 어시스턴트", "주차 보조 시스템"), (57.2, 58.8, "40:20:40 폴딩", "2열 시트 분할 폴딩")]
NAVY = (21, 35, 63)

def sprite(text, sub, length, up, path):
    """라벨(흰 둥근사각 + 남색 안쪽 링) + 점선 + 맥동 점. up=True면 라벨이 위, 점이 아래."""
    f1, f2 = F("Bold", 46), F("SemiBold", 30)  # 1차 대조: 레퍼런스 라벨이 1.35배 컸음
    tw = max(f1.getlength(text), f2.getlength(sub) if sub else 0)
    lw, lh = int(tw + 72), (128 if sub else 86)
    w, h = max(lw, 60) + 40, lh + length + 40
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    cx = w // 2
    ly = 10 if up else h - 10 - lh
    dy = h - 28 if up else 28
    # 점선
    y0, y1 = (ly + lh, dy - 14) if up else (dy + 14, ly)
    for y in range(int(y0), int(y1), 14): d.line([(cx, y), (cx, min(y + 7, y1))], fill=(255, 255, 255, 235), width=3)
    # 점(바깥 빛 + 흰 점)
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0)); ImageDraw.Draw(glow).ellipse([cx - 22, dy - 22, cx + 22, dy + 22], fill=(255, 255, 255, 120))
    im = Image.alpha_composite(glow.filter(ImageFilter.GaussianBlur(6)), im); d = ImageDraw.Draw(im)
    d.ellipse([cx - 9, dy - 9, cx + 9, dy + 9], fill=(255, 255, 255, 255))
    # 라벨 그림자 + 본체
    sh = Image.new("RGBA", (w, h), (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle([cx - lw // 2, ly + 4, cx + lw // 2, ly + lh + 4], 14, fill=(0, 0, 0, 90))
    im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(6))); d = ImageDraw.Draw(im)
    d.rounded_rectangle([cx - lw // 2, ly, cx + lw // 2, ly + lh], 14, fill=(255, 255, 255, 255))
    d.rounded_rectangle([cx - lw // 2 + 5, ly + 5, cx + lw // 2 - 5, ly + lh - 5], 10, outline=NAVY, width=3)
    d.text((cx, ly + (42 if sub else lh / 2)), text, font=f1, fill=NAVY, anchor="mm")
    if sub: d.text((cx, ly + 92), sub, font=f2, fill=(90, 98, 112), anchor="mm")
    im.save(path)
    return w, h, (ly + lh / 2) - h / 2  # 라벨 중심이 스프라이트 중심에서 얼마나 떨어졌나

items = []
for k, (t0, t1, text, sub) in enumerate(CALL):
    i0, i1 = int(round(t0 / 0.2)), int(round(t1 / 0.2))
    dot = next(((b[0] + b[2] / 2, b[1] + b[3] / 2) for i in range(i0, i0 + 3) for b in boxes[i] if 15 <= b[2] <= 50 and 15 <= b[3] <= 50), None)
    track = []
    for i in range(i0, i1):
        cand = [b for b in boxes[i] if 100 <= b[2] <= 360 and 40 <= b[3] <= 300]
        if cand:
            b = max(cand, key=lambda b: b[2] * b[3]); track.append((round(i * 0.2, 2), b))
    full = [tb for tb in track if tb[1][3] >= 120] or track
    bh = int(np.median([b[3] for _, b in full])) * 2
    if dot is None: dot = (full[0][1][0] + full[0][1][2] / 2, full[0][1][1] + full[0][1][3])
    fb = full[0][1]
    up = dot[1] > fb[1] + fb[3] / 2  # 점이 상자 아래쪽 → 라벨이 위
    sw, sh_, _ = sprite(text, sub, max(80, bh - 120), up, os.path.join(OUT, f"call{k:02d}.png"))
    # 스프라이트 중심 위치 = 점 위치 기준(점은 스프라이트 끝에서 28px)
    kf = []
    for t, b in full:
        dx = (b[0] + b[2] / 2) * 2
        dy_dot = (b[1] + b[3]) * 2 - 20 if up else b[1] * 2 + 20
        cy = dy_dot - (sh_ / 2 - 28) if up else dy_dot + (sh_ / 2 - 28)
        kf.append([round(t - t0, 2), round(dx, 1), round(cy, 1)])
    items.append({"kind": "callout", "file": f"call{k:02d}.png", "t0": t0, "t1": t1, "w": sw, "h": sh_, "kf": kf, "text": text})
    print(k, text, "up" if up else "down", len(kf), sw, sh_)

# 고정 위치 콜아웃: LED 헤드라이트(제목 화면 안), 20인치(큰 라벨) — 레퍼런스 위치 직접
sw, sh_, _ = sprite("LED 헤드라이트", "", 330, False, os.path.join(OUT, "call_led.png"))
items.append({"kind": "callout", "file": "call_led.png", "t0": 1.8, "t1": 3.4, "w": sw, "h": sh_, "kf": [[0, 300, 1100]], "text": "LED 헤드라이트"})
sw, sh_, _ = sprite("20인치", "M 스타 스포크 휠", 260, True, os.path.join(OUT, "call_wheel.png"))
items.append({"kind": "callout", "file": "call_wheel.png", "t0": 7.4, "t1": 9.2, "w": sw, "h": sh_, "kf": [[0, 720, 330], [0.6, 760, 330], [1.4, 600, 330]], "text": "20인치"})
# 휠 원호
ring = Image.new("RGBA", (900, 900), (0, 0, 0, 0)); rd = ImageDraw.Draw(ring)
rd.arc([20, 20, 880, 880], 200, 520, fill=(255, 255, 255, 230), width=6)
ring.save(os.path.join(OUT, "ring.png"))
items.append({"kind": "ring", "file": "ring.png", "t0": 6.4, "t1": 9.0, "w": 900, "h": 900, "kf": [[0, 470, 560], [1.6, 600, 560], [2.6, 700, 560]]})
# 어둡게(비네팅)
dim = Image.new("RGBA", (1080, 1920), (0, 0, 0, 150)); dd = ImageDraw.Draw(dim)
dim.save(os.path.join(OUT, "dim.png"))
for a, b in ((0.3, 6.2), (16.0, 19.0), (61.0, 63.6)):
    items.append({"kind": "dim", "file": "dim.png", "t0": a, "t1": b})
# 캡컷 글자(제목·스탯·카운트업)
T = lambda t0, t1, s, y, size, **k: items.append(dict(kind="text", t0=t0, t1=t1, text=s, y=y, size=size, **k))
for a, b in ((0.3, 3.4), (61.0, 63.6)):
    T(a + 0.6, b, "B M W", 300, 10, spacing=6)
    T(a, b, "X5", 400, 40, bold=True)
    T(a + 0.6, b, "xDrive 30d M Sport", 520, 11, bold=True)
    T(a + 0.9, b, "2021년식", 600, 8, pill=True)
T(3.8, 5.0, "ENGINE", 380, 6, spacing=6); T(3.8, 5.0, "직렬 6기통", 480, 24, bold=True); T(4.0, 5.0, "3.0L 디젤 터보", 580, 9)
T(5.0, 6.2, "DRIVETRAIN", 380, 6, spacing=6); T(5.0, 6.2, "xDrive", 480, 26, bold=True); T(5.2, 6.2, "상시 사륜구동", 580, 9)
T(16.2, 19.0, "트렁크 용량", 760, 8)
steps = [510, 530, 560, 590, 610, 630, 645, 650]
t = 16.3
for i, v in enumerate(steps):
    t_end = 19.0 if i == len(steps) - 1 else t + (0.5 if i == 0 else 0.08)
    T(t, t_end, f"{v}L", 880, 30, bold=True, count=True, first=(i == 0))
    t = t_end
T(17.0, 19.0, "2열 폴딩 시 최대 1,870L", 1000, 8)
json.dump({"items": items}, open(os.path.join(OUT, "manifest.json"), "w"), ensure_ascii=False, indent=1)
print("items", len(items))
