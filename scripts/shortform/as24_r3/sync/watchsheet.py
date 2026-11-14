"""완성 영상을 0.1초마다 자막 줄만 잘라 시간·실제 들리는 낱말(받아쓰기)과 함께 한 장에 모아 사람이 보는 것처럼 확인한다."""
import json, sys, subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFont
VID, N, OUT, Y0, Y1 = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
A = json.load(open("asr_r5.json"))[N]
F = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", 18)
W, H = 1080, 1920
p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", VID, "-vf", "fps=10", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
crops = []; i = 0
while True:
    b = p.stdout.read(W * H * 3)
    if len(b) < W * H * 3: break
    t = i / 10; i += 1
    a = np.frombuffer(b, np.uint8).reshape(H, W, 3)[Y0:Y1, 140:940]
    im = Image.fromarray(a).resize((400, (Y1 - Y0) // 2))
    sp = [w[0] for w in A if w[1] <= t + 0.05 < w[2]]
    crops.append((t, im, sp[0] if sp else ""))
CW, CH = 400, (Y1 - Y0) // 2 + 26; cols = 4; per = 48
for s in range(0, len(crops), per):
    part = crops[s:s + per]; rows = (len(part) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * CW, rows * CH), (40, 40, 40)); d = ImageDraw.Draw(sheet)
    for k, (t, im, sp) in enumerate(part):
        x, y = (k % cols) * CW, (k // cols) * CH
        sheet.paste(im, (x, y + 26)); d.text((x + 4, y + 2), f"{t:5.1f}s  들림: {sp}", fill=(120, 255, 120), font=F)
    sheet.save(f"{OUT}_{s // per:02d}.jpg", quality=80)
print(len(crops))
