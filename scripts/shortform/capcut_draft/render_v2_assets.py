"""v2 오버레이 PNG: 노션 자막 규정 v1 반영(Pretendard Bold 56px · 의미 단위 2~3낱말 · 줄 14자 안팎 · y≈1240 · 말하는 낱말만 #EEEF05)
+ 파란 칩 #306BD9(높이 106·글자 64) · 큰 숫자 · 끝 로고 구간 자막 숨김.
사용: python render_v2_assets.py <작업폴더>  (plan.json · words.json · Pretendard 폴더 필요) → <작업폴더>/png/
"""
import json, os, re, sys
from PIL import Image, ImageDraw, ImageFont
D = sys.argv[1]; FD = os.path.join(D, "package/dist/public/static")
FB, FX = os.path.join(FD, "Pretendard-Bold.otf"), os.path.join(FD, "Pretendard-ExtraBold.otf")
W, H, BLUE, YEL = 1080, 1920, (0x30, 0x6B, 0xD9), (0xEE, 0xEF, 0x05)
plan = json.load(open(os.path.join(D, "plan.json"))); words = json.load(open(os.path.join(D, "words.json")))
os.makedirs(os.path.join(D, "png"), exist_ok=True); out = []
cv = lambda: Image.new("RGBA", (W, H), (0, 0, 0, 0))
for k, o in enumerate(plan["overlays"]):
    im = cv(); d = ImageDraw.Draw(im); y = o["cy"] * H / 100
    if o["kind"] == "number":
        d.text((W / 2, y), o["text"], font=ImageFont.truetype(FX, 150), fill="white", anchor="mm", stroke_width=10, stroke_fill="black")
    else:
        f = ImageFont.truetype(FB, 64); tw = d.textlength(o["text"], font=f); bw, bh = tw + 76, 106
        d.rounded_rectangle([(W - bw) / 2, y - bh / 2, (W + bw) / 2, y + bh / 2], radius=22, fill=BLUE)
        d.text((W / 2, y), o["text"], font=f, fill="white", anchor="mm")
    fn = f"ov{k:02d}.png"; im.save(os.path.join(D, "png", fn))
    out.append({"kind": o["kind"], "file": fn, "t0": o["t0"], "t1": o["t1"]})
# 의미 단위 묶음: 문장부호에서 끊고, 3낱말·14자 넘으면 끊음
groups, cur = [], []
for w in words:
    if cur and (len(cur) >= 3 or len("".join(x[2] for x in cur)) + len(w[2]) > 14):
        groups.append(cur); cur = []
    cur.append(w)
    if re.search(r"[.,]$", w[2]): groups.append(cur); cur = []
if cur: groups.append(cur)
f = ImageFont.truetype(FB, 56); n = 0; cut = plan["logo"][0]
for g in groups:
    txt = [x[2].rstrip(".") if not re.match(r"^\d", x[2]) else x[2].rstrip(".,") for x in g]
    txt = [t.rstrip(",") for t in txt]
    for i, w in enumerate(g):
        t0 = w[0]; t1 = g[i + 1][0] if i + 1 < len(g) else w[1] + 0.25
        t1 = min(t1, cut)
        if t1 - t0 < 0.05: continue
        im = cv(); d = ImageDraw.Draw(im); full = " ".join(txt); x = (W - d.textlength(full, font=f)) / 2
        for j, t in enumerate(txt):
            d.text((x, 1240), t, font=f, fill=YEL if j == i else "white", anchor="lm", stroke_width=6, stroke_fill="black")
            x += d.textlength(t + " ", font=f)
        fn = f"sub{n:03d}.png"; im.save(os.path.join(D, "png", fn)); n += 1
        out.append({"kind": "sub", "file": fn, "t0": round(t0, 2), "t1": round(t1, 2)})
sfx = [{"t": o["t0"], "gain_db": -6} for o in plan["overlays"] if o["kind"] == "label"]
json.dump({"items": out, "cuts": plan["cuts"], "logo": plan["logo"], "end": plan["end"], "sfx": sfx},
          open(os.path.join(D, "png/manifest.json"), "w"), ensure_ascii=False, indent=1)
print(len(out), "png")
