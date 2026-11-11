"""NL형(보배드림 고정 기준) 오버레이 PNG 만들기: 1080x1920 투명 전체 캔버스 → 캡컷에 위치 0으로 얹음."""
import json, sys, os
from PIL import Image, ImageDraw, ImageFont
D = os.path.dirname(os.path.abspath(__file__))
FB = f"{D}/package/dist/public/static/Pretendard-ExtraBold.otf"
W, H = 1080, 1920
BLUE, YEL = (0x30, 0x6B, 0xD9), (0xEE, 0xEF, 0x05)
tl = json.load(open(f"{D}/timeline.json")); words = json.load(open(f"{D}/words_fixed.json"))
DISP = {"2022년 6월": "22년06월 등록"}
out = []

def canvas(): return Image.new("RGBA", (W, H), (0, 0, 0, 0))

def chip(lines, cy):
    im = canvas(); d = ImageDraw.Draw(im); f = ImageFont.truetype(FB, 54)
    lh = 81; pad = 30
    for i, t in enumerate(lines):
        t = DISP.get(t, t)
        tw = d.textlength(t, font=f); bw = tw + pad * 2
        y = cy * H / 100 - (len(lines) * lh) / 2 + i * (lh + 10)
        x = (W - bw) / 2
        d.rounded_rectangle([x, y, x + bw, y + lh], radius=16, fill=BLUE)
        d.text((W / 2, y + lh / 2), t, font=f, fill="white", anchor="mm")
    return im

def number(lines, cy):
    im = canvas(); d = ImageDraw.Draw(im); f = ImageFont.truetype(FB, 150)
    for i, t in enumerate(lines):
        d.text((W / 2, cy * H / 100 + i * 170), DISP.get(t, t), font=f, fill="white", anchor="mm", stroke_width=10, stroke_fill="black")
    return im

for k, o in enumerate(tl["overlays"]):
    if o["kind"] == "end_logo": continue
    im = number(o["text"], o["cy_pct"]) if o["kind"] == "number" else chip(o["text"], o["cy_pct"])
    p = f"{D}/png/ov{k:02d}.png"; im.save(p)
    out.append({"kind": o["kind"], "file": os.path.basename(p), "t0": o["t0"], "t1": o["t1"]})

# 말 자막: 2~3낱말 묶음, 지금 말하는 낱말만 노랑
hides = tl["hide_speech"]; end_logo_t = [o for o in tl["overlays"] if o["kind"] == "end_logo"]
def hidden(t): return any(a <= t < b for a, b in hides)
groups, cur = [], []
for w in words:
    if hidden(w[0]): 
        if cur: groups.append(cur); cur = []
        continue
    if cur and (len(cur) >= 3 or len("".join(x[2] for x in cur)) + len(w[2]) > 11 or w[0] - cur[-1][1] > 0.6):
        groups.append(cur); cur = []
    cur.append(w)
    if w[2].endswith((".", ",")): groups.append(cur); cur = []
if cur: groups.append(cur)
f = ImageFont.truetype(FB, 70); n = 0
for g in groups:
    txt = [x[2].rstrip(".,") for x in g]
    for i, w in enumerate(g):
        im = canvas(); d = ImageDraw.Draw(im)
        full = " ".join(txt); tw = d.textlength(full, font=f); x = (W - tw) / 2; y = H * 0.62
        for j, t in enumerate(txt):
            d.text((x, y), t, font=f, fill=YEL if j == i else "white", anchor="lm", stroke_width=7, stroke_fill="black")
            x += d.textlength(t + " ", font=f)
        t0 = w[0]; t1 = g[i + 1][0] if i + 1 < len(g) else min(w[1] + 0.25, 53.3)
        p = f"{D}/png/sub{n:03d}.png"; im.save(p); n += 1
        out.append({"kind": "sub", "file": os.path.basename(p), "t0": round(t0, 2), "t1": round(t1, 2)})
json.dump({"items": out, "sfx": tl["sfx"], "end_logo": end_logo_t[0] if end_logo_t else None}, open(f"{D}/png/manifest.json", "w"), ensure_ascii=False, indent=1)
print(len(out), "png")
