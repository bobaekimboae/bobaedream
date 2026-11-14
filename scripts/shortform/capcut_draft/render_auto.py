"""차란차 매물 숏폼 자동 제작 — 에셋 생성(사양서 JSON 기반, X5 render_x5_v4.py를 일반화).
사용: SAG_EDIT=bobae_be python render_auto.py <spec.json> <track.json> <scripts/shortform 경로> <출력폴더>
사양서: car, end, voice, callouts[t0,t1,label,sub,fy], chips[text,t0,t1,cy,big,tilt], sentences[a,b,at,text], flash[]
"""
import json, math, os, re, shutil, subprocess, sys
FPS = 30
SPEC, TRACK, SAG, OUT = sys.argv[1:5]
SP = json.load(open(SPEC, encoding="utf-8")); VOICE = SP["voice"]; END = SP["end"]
sys.path.insert(0, SAG); sys.argv = ["x", "/tmp/none.mp4", os.path.join(OUT, "_sag_tmp")]
import sag_reel_v1 as s
from PIL import Image
os.makedirs(OUT, exist_ok=True)
ST = s.STYLE
if SP.get("cap_cy"): ST["cap_cy"] = SP["cap_cy"]  # 2026-11-13 교과서 값(NL 62% · BE 64%)으로 덮어쓰기
CAP_Y = ST["cap_cy"]; TILT = ST.get("tilt_fixed", 0.0)
trk = json.load(open(TRACK))
STICKER = "7600764310603730184"  # 캡컷 무료 스티커 'callout line'(점 → 사선 → 가로선)
DOT, CORNER, END_ = (-204, 51), (-120, -66), (217, -66)

def place(im, cx, cy, fn):
    c = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0)); c.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))
    c.save(os.path.join(OUT, fn)); return fn

def text_w(t, size):  # 캡컷 글자 폭 어림(크기 8 ≈ 한글 36px, v2 화면 실측)
    return sum(size * 4.5 * (1.0 if ord(c) > 0x3000 else 0.62) for c in t)

items = []
V2 = SP.get("style") == "as24v2"  # 2026-11-12: 오토스카우트 글자 크기 · 선과 칠을 한 장으로 그린 포인터 · 뜻 묶음 자막(Pretendard PNG)
if V2: ST["cap_size_be"] = SP.get("cap_size", 72)  # 벨기에 말 자막 글자 높이 3~3.5%(as24-caption-rules-v2) → Pretendard 72 = 한글 높이 약 62px(3.2%)
LBL_SIZE, LBL_MAXW, LBL_TILT = (84 if V2 else 64), (760 if V2 else 660), -1.5  # 8차: AS24.be 릴스 칩처럼 — 원본 AS24 붓 칠, 거의 수평, 위아래 넉넉, 중간 굵기 글자
TIDY = bool(SP.get("tidy"))  # 2026-11-12 정돈판: 칩·이름표 기울기 0, 크기 두 단계, 자막 한 자리 고정, 자막·이름표 크기 균형
if TIDY:
    TILT = 0.0; ST["tilt_fixed"] = 0.0; LBL_TILT = 0.0; LBL_SIZE = SP.get("lbl_size", 72)
    ST["cap_size_be"] = SP.get("cap_size", 64)
BE_CLEAN = bool(SP.get("be_clean"))  # 2026-11-12 벨기에 정리판: 포인터 없음, 모든 칩 같은 기울기의 노랑 칠, 글꼴은 원본처럼 중간 굵기(Pretendard SemiBold)
if BE_CLEAN:
    s.BLACK = s.SEMI; s.BOLD = s.SEMI
    TILT = SP.get("be_tilt", 2.7); ST["tilt_fixed"] = TILT
LBL_STYLE = dict(stk_shape="as24", stk_weight="semi", pad=(0.6, 2.7), stk_minw=0, chip_theme=False)
def label_png(label, n):
    sz = LBL_SIZE
    keep = {k: ST.get(k) for k in LBL_STYLE}; ST.update(LBL_STYLE)
    try:
        while True:
            getattr(s, "_cache", {}).clear()
            im = s.sticker(label, sz, LBL_TILT, False); im = im.crop(im.getbbox())
            if im.width <= LBL_MAXW or sz <= 40: break
            sz -= 2
    finally:
        ST.update(keep); getattr(s, "_cache", {}).clear()
    fn = f"lbl{n:02d}.png"; im.save(os.path.join(OUT, fn)); return fn, im.width, im.height
def pointer_baked(t0, t1, kf, label, force_fy=None):
    """점 → 사선 → 칠을 한 장의 PNG로 그린다(선 끝이 칠 안으로 들어가 있어 떨어져 보이지 않음). 위치 키프레임은 이 한 장에만 건다."""
    from PIL import ImageDraw
    n = len([i for i in items if i["kind"] == "ptr"])
    _, w, h = label_png(label, n); lab = Image.open(os.path.join(OUT, f"lbl{n:02d}.png")).convert("RGBA"); os.remove(os.path.join(OUT, f"lbl{n:02d}.png"))
    xs = [p[1] for p in kf]; ys = [p[2] for p in kf]; DX, DY, IN = 64, 96, 46
    fy = force_fy or (1 if min(ys) - DY - h > 150 else -1)  # 칠을 점 위에(위가 좁으면 아래에)
    def fit(fx):  # 칠 아랫변에서 선이 붙는 자리 a(왼쪽 끝에서 px). 모든 프레임에서 칠이 화면 안(12~1068)에 들어오게 고른다
        lo, hi = max(xs) + fx * DX + w - 1068, min(xs) + fx * DX - 12
        pref = IN if fx == 1 else w - IN
        a = max(IN, min(w - IN, max(lo, min(hi, pref))))
        bad = sum((x + fx * DX - a < 12) or (x + fx * DX - a + w > 1068) for x in xs) / len(xs)
        return bad, abs(a - pref), a
    mx = sum(xs) / len(xs)
    fx = min((1, -1), key=lambda f: (fit(f)[0], fit(f)[1], (f == 1) == (mx > 540)))
    a = fit(fx)[2]
    S2 = 2; C = Image.new("RGBA", (2400 * S2, 1000 * S2), (0, 0, 0, 0)); d = ImageDraw.Draw(C)
    dot = (1200, 500); tip = (dot[0] + fx * DX, dot[1] - fy * DY)            # 선 끝 = 칠 아랫변(또는 윗변)
    end = (tip[0], tip[1] - fy * h * 0.42)                                    # 칠 가운데 가까이까지 들어가 숨는다(칠 가장자리가 거칠어도 틈이 없음)
    P = lambda q: (q[0] * S2, q[1] * S2)
    d.line([P(dot), P(end)], fill=(0, 0, 0, 110), width=10 * S2); d.line([P(dot), P(end)], fill=(255, 255, 255, 255), width=5 * S2)
    r0, r1 = 13, 8
    d.ellipse([P((dot[0] - r0 - 2, dot[1] - r0 - 2)), P((dot[0] + r0 + 2, dot[1] + r0 + 2))], fill=(0, 0, 0, 110))
    d.ellipse([P((dot[0] - r0, dot[1] - r0)), P((dot[0] + r0, dot[1] + r0))], fill=(255, 255, 255, 255))
    d.ellipse([P((dot[0] - r1, dot[1] - r1)), P((dot[0] + r1, dot[1] + r1))], fill=(247, 236, 56, 255))
    C = C.resize((2400, 1000), Image.LANCZOS)
    lx0 = int(round(tip[0] - a)); ly0 = int(round(tip[1] - h if fy == 1 else tip[1]))
    C.alpha_composite(lab, (lx0, ly0))
    bb = C.getbbox(); im = C.crop(bb); fn = f"ptr{n:02d}.png"; im.save(os.path.join(OUT, fn))
    ox, oy = (bb[0] + bb[2]) / 2 - dot[0], (bb[1] + bb[3]) / 2 - dot[1]     # 그림 가운데 − 점
    out = [[t, round(x + ox, 1), round(y + oy, 1)] for t, x, y in kf]
    items.append({"kind": "ptr", "baked": True, "t0": t0, "t1": t1, "fx": fx, "fy": fy, "label": label, "file": fn, "w": im.width, "h": im.height,
                  "dot": [round(-ox, 1), round(-oy, 1)], "kf": out})

def pointer(t0, t1, kf, label, sub="", force_fy=None):
    if V2: return pointer_baked(t0, t1, kf, label, force_fy)
    """kf = [[t, 점x, 점y]] (콜아웃 시작 기준). 라벨 폭에 맞춰 선 길이, 화면 밖으로 나가면 좌우 뒤집기, 위쪽이 좁으면 아래로"""
    lfile, lwid, lh = label_png(label, len([i for i in items if i["kind"] == "ptr"]))
    lw = max(lwid - 30, text_w(sub, 7.5) + 40)
    k = max(0.45, min(0.9, lw / (1.5 * 337)))
    xs = [p[1] for p in kf]; ys = [p[2] for p in kf]
    mx = sum(xs) / len(xs)
    def over(fx, k):  # 선 끝이 화면(20~1060) 밖으로 나간 양의 합
        span = 1.5 * k * (END_[0] - DOT[0])
        return sum((x + span - 1060 if fx == 1 else 20 - (x - span)) > 10 for x in xs) / len(xs)  # 넘치는 프레임 비율
    fx = min((1, -1), key=lambda f: (over(f, k), (f == 1) == (mx > 540)))
    while over(fx, k) > 0.15 and k > 0.5: k = round(k - 0.02, 3)  # 15%가 넘는 프레임에서 넘치면 선을 줄인다(카메라가 크게 움직여 점이 가장자리로 가는 잠깐은 허용)
    rise = 1.5 * k * (DOT[1] - END_[1]) + (100 if sub else 60)
    fy = force_fy or (-1 if min(ys) - rise < 120 else 1)
    out = []
    for t, x, y in kf:
        cx, cy = x - 1.5 * k * DOT[0] * fx, y - 1.5 * k * DOT[1] * fy
        ly = cy + 1.5 * k * END_[1] * fy
        lx = cx + 1.5 * k * (CORNER[0] + END_[0]) / 2 * fx
        lx = max(lwid / 2 + 8, min(1072 - lwid / 2, lx))  # 노랑 칠 PNG가 화면 안에 들어오게
        if fy == 1:  # 노랑 칠은 선 끝 위에 살짝 걸치게(선과 붙어 보임), 보조 글은 선 아래
            lab_y, sub_y = ly - (lh / 2 - 10), (ly + 36 if sub else None)
        else:
            lab_y, sub_y = ly + (lh / 2 - 10), (ly - 36 if sub else None)
        out.append([t, round(cx, 1), round(cy, 1), round(lx, 1), round(lab_y, 1), None if sub_y is None else round(sub_y, 1),
                    round(min(x, cx + 1.5 * k * END_[0] * fx), 1), round(max(x, cx + 1.5 * k * END_[0] * fx), 1)])
    items.append({"kind": "ptr", "t0": t0, "t1": t1, "k": round(k, 3), "fx": fx, "fy": fy, "label": label, "sub": sub, "lw": lw, "file": lfile, "w": lwid, "h": lh, "kf": out})


for k, c in enumerate(SP["callouts"]):
    if str(k) in trk:
        pointer(c["t0"], c["t1"], trk[str(k)]["kf"], c["label"], c.get("sub", ""), force_fy=c.get("fy"))

# 2) 벨기에판 칠 칩: 폭 820px 안, 위계(큰 줄 1 · 작은 줄)를 같은 크기로 맞춘다
MAXW = 820
def chip(txt, t0, t1, cy, fn, size, tilt=0.0, hide_cap=False):
    sz = size
    im = s.sticker(txt, sz, TILT + tilt, True)
    while im.width > MAXW and sz > 30:
        sz -= 4; im = s.sticker(txt, sz, TILT + tilt, True)
    items.append({"kind": "chip", "file": place(im, 540, cy, fn), "t0": t0, "t1": t1, "text": txt, "big": size == BIG, "cy": cy,
                  "tilt": TILT + tilt, "w": im.width, "h": im.height, "hide_cap": hide_cap})
    return im.size
BIG, SMALL = (118, 68) if V2 else (104, 56)
if TIDY: BIG, SMALL = SP.get("chip_big", 96), SP.get("chip_small", 64)  # 오토스카우트 제목 글자 높이 5~10% · 작은 줄 약 3%

# 2026-11-13 3회차: 원본 16편 픽셀 실측 스타일(바탕 칠 없는 글자 칩)
#  outline     = 노랑 글자 + 검정 외곽선, 바탕 없음(NL 차명·숫자·가격, BE 사양 숫자)
#  check       = 흰 ✓ + 노랑 글자 + 검정 외곽선(NL 옵션, 두 줄까지)
#  title_tape  = 첫 낱말만 노랑 붓띠(검정 글자) + 나머지 흰 큰 글자(BE 첫 화면)
#  tape        = 기존 노랑 붓띠 칠(BE 옵션·기능)
from PIL import ImageDraw, ImageFont, ImageFilter
OUT_YEL = tuple(SP.get("chip_yellow", [244, 242, 9]))
def _wrap(txt, fnt, maxw):
    if fnt.getlength(txt) <= maxw or " " not in txt: return [txt]
    sp = [i for i, ch in enumerate(txt) if ch == " "]
    cut = min(sp, key=lambda i: abs(i - len(txt) / 2))
    return [txt[:cut], txt[cut + 1:]]
def outline_png(txt, size, col=OUT_YEL, check=False, maxw=900, stroke=None):
    while True:
        fnt = ImageFont.truetype(s.BLACK if os.path.exists(s.BLACK) else s.BOLD, size)
        lines = _wrap(txt, fnt, maxw)
        ck = int(size * 0.9) if check else 0
        tw = max(fnt.getlength(l) for l in lines) + ck
        if tw <= 980 or size <= 40: break
        size -= 4
    sw = stroke or max(4, round(size * 0.1))
    lh = int(size * 1.12)
    im = Image.new("RGBA", (int(tw + sw * 4 + 20), lh * len(lines) + sw * 4 + 20), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    y0 = sw * 2 + 10
    for i, l in enumerate(lines):
        lw = fnt.getlength(l) + (ck if i == 0 else 0)
        x = (im.width - lw) / 2
        y = y0 + lh * i + lh / 2
        if check and i == 0:  # ✓: 글꼴에 없을 수 있어 선으로 그린다
            p = [(x + ck * 0.08, y - size * 0.02), (x + ck * 0.36, y + size * 0.26), (x + ck * 0.8, y - size * 0.34)]
            d.line(p, fill=(0, 0, 0), width=int(size * 0.13) + sw * 2, joint="curve")
            d.line(p, fill=(255, 255, 255), width=int(size * 0.13), joint="curve")
            x += ck
        d.text((x, y), l, font=fnt, fill=col, anchor="lm", stroke_width=sw, stroke_fill=(0, 0, 0))
    return im.crop(im.getbbox())
def title_tape_png(txt, size):
    first, _, rest = txt.partition(" ")  # 첫 낱말(브랜드)만 붓띠
    tape = s.sticker(first, int(size * 0.92), TILT, True)
    fnt = ImageFont.truetype(s.BOLD, size)
    if rest:
        rw = int(fnt.getlength(rest)) + 40
        txt_im = Image.new("RGBA", (rw, int(size * 1.6)), (0, 0, 0, 0))
        sh = Image.new("RGBA", txt_im.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).text((22, txt_im.height / 2 + 4), rest, font=fnt, fill=(0, 0, 0, 230), anchor="lm", stroke_width=6, stroke_fill=(0, 0, 0, 230))
        txt_im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(5)))
        ImageDraw.Draw(txt_im).text((18, txt_im.height / 2), rest, font=fnt, fill=(255, 255, 255), anchor="lm", stroke_width=2, stroke_fill=(40, 40, 40))  # 밝은 천장 위에서도 읽히게 짙은 그림자 + 얇은 테두리
    else:
        txt_im = Image.new("RGBA", (1, 1), (0, 0, 0, 0))
    W = tape.width + txt_im.width; H = max(tape.height, txt_im.height)
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out.alpha_composite(tape, (0, (H - tape.height) // 2)); out.alpha_composite(txt_im, (tape.width - 6, (H - txt_im.height) // 2))
    if out.width > 980: out = out.resize((980, int(out.height * 980 / out.width)), Image.LANCZOS)
    return out
def styled_chip(c, fn):
    st, size = c["style"], c.get("size", 80)
    if st == "outline": im = outline_png(c["text"], size, maxw=c.get("maxw", 900))
    elif st == "check": im = outline_png(c["text"].lstrip("✓ ").strip(), size, check=True, maxw=c.get("maxw", 620))
    elif st == "title_tape": im = title_tape_png(c["text"], size)
    else: im = s.sticker(c["text"], size, TILT, True)
    items.append({"kind": "chip", "file": place(im, 540, c["cy"], fn), "t0": c["t0"], "t1": c["t1"], "text": c["text"], "big": bool(c.get("big")),
                  "cy": c["cy"], "tilt": TILT if st in ("tape", "title_tape") else 0.0, "w": im.width, "h": im.height, "hide_cap": bool(c.get("hide_cap")), "style": st})
for n, c in enumerate(SP["chips"]):
    if c.get("style"):
        styled_chip(c, f"t_chip{n:02d}.png"); continue
    chip(c["text"], c["t0"], c["t1"], c["cy"], f"t_chip{n:02d}.png", c.get("size") or (BIG if c.get("big") else SMALL), 0.0 if TIDY else c.get("tilt", 0.0), bool(c.get("hide_cap")))

# 네덜란드 말 자막: 흰 굵은 글자 + 검정 외곽선(그림자 아님), 말하는 어절만 노랑(원본 16편 실측)
if SP.get("cap_outline"):
    _csz = SP.get("cap_size", 60); _kw = tuple(SP.get("cap_kw", [244, 242, 9])); _pc = {}
    def _nl_phrase(text, act=-1):
        k = (text, act)
        if k in _pc: return _pc[k]
        fnt = ImageFont.truetype(s.BLACK, _csz); sw = max(4, round(_csz * 0.11))
        text = text.strip(" ,.")
        lines = [l.strip() for l in text.split("|")] if "|" in text else _wrap(text, fnt, 900)
        lh, gap = int(_csz * 1.25), fnt.getlength(" ")
        tw = max(fnt.getlength(l) for l in lines)
        im = Image.new("RGBA", (int(tw + 80), lh * len(lines) + 40), (0, 0, 0, 0)); d = ImageDraw.Draw(im); wi = 0
        for i, l in enumerate(lines):
            x = (im.width - fnt.getlength(l)) / 2; y = 20 + lh * i + lh / 2
            for w in l.split(" "):
                d.text((x, y), w, font=fnt, fill=_kw if wi == act else (255, 255, 255), anchor="lm", stroke_width=sw, stroke_fill=(0, 0, 0))
                wi += 1; x += fnt.getlength(w) + gap
        _pc[k] = im; return im
    s.phrase_img_be3 = _nl_phrase

# 3) 음성: 문장 조각(a~b초)을 장면 시작에, 다음 장면 전에 끝나게 1.0~1.22배
clips, prev_end = [], 0.0
S = SP["sentences"]
for n, c in enumerate(S):
    a, b = c["a"], c["b"]
    start = max(c["at"], prev_end + 0.06)
    nxt = S[n + 1]["at"] if n + 1 < len(S) else END
    tempo = max(1.0, min(1.22, (b - a) / max(0.3, nxt - start - 0.06)))
    dur = (b - a) / tempo
    clips.append((round(a, 3), round(b, 3), round(start, 3), round(start + dur, 3), c["text"], round(tempo, 3)))
    prev_end = start + dur
for n, c in enumerate(clips):
    if c[3] > (clips[n + 1][2] if n + 1 < len(clips) else END) + 0.05: print("늦음", c)
# 문장별로 다른 음성 파일을 쓸 수 있다(sentences[n].file — 대사를 고쳐 그 문장만 같은 목소리로 다시 만든 경우)
files = [VOICE] + sorted({c["file"] for c in S if c.get("file")})
src = [files.index(c.get("file", VOICE)) for c in S]
parts, flt = [], []
for n, (a, b, st0, _, _, tp) in enumerate(clips):
    flt.append(f"[{src[n]}:a]atrim={a}:{b},asetpts=PTS-STARTPTS,atempo={tp},adelay={int(st0 * 1000)}|{int(st0 * 1000)}[s{n}]"); parts.append(f"[s{n}]")
# 2026-11-14 싱크 버그 수정: amix 는 입력 중 가장 이른 시각부터 내보내서, 첫 문장 adelay(0.25초)만큼 모든 대사가 앞당겨졌다.
# 0초부터 시작하는 무음 입력을 맨 앞에 넣어 타임라인을 0초에 고정한다.
flt.append(f"anullsrc=r=48000:cl=stereo,atrim=0:{END}[z]")
flt.append("[z]" + "".join(parts) + f"amix=inputs={len(parts) + 1}:normalize=0,apad,atrim=0:{END},loudnorm=I=-16:TP=-1.5:LRA=11[out]")
subprocess.run(["ffmpeg", "-y", "-v", "error"] + sum([["-i", f] for f in files], []) + ["-filter_complex", ";".join(flt), "-map", "[out]", "-ar", "48000", "-ac", "2",
                os.path.join(OUT, "voice.wav")], check=True)

# 자막이 콜아웃·스티커와 겹치지 않게: 그 시간 동안 비어 있는 높이를 고른다
def rects_at(t):
    out = []
    for it in items:
        if not (it["t0"] <= t <= it["t1"]): continue
        if it["kind"] == "ptr" and it.get("baked"):
            q = min(it["kf"], key=lambda p: abs(p[0] - (t - it["t0"])))
            out.append((q[1] - it["w"] / 2, q[2] - it["h"] / 2, q[1] + it["w"] / 2, q[2] + it["h"] / 2))
        elif it["kind"] == "ptr":
            kf = it["kf"]; rt = t - it["t0"]; q = min(kf, key=lambda p: abs(p[0] - rt))
            lx, lab_y, sub_y, x0, x1 = q[3], q[4], q[5], q[6], q[7]
            ys = [lab_y - it["h"] / 2, lab_y + it["h"] / 2] + ([sub_y - 26, sub_y + 26] if sub_y else [])
            dot_y = q[2] - 1.5 * it["k"] * DOT[1] * -it["fy"]
            out.append((min(x0, lx - it["lw"] / 2), min(ys + [dot_y]), max(x1, lx + it["lw"] / 2), max(ys + [dot_y])))
        elif it["kind"] == "chip":
            bb = Image.open(os.path.join(OUT, it["file"])).getbbox()
            if bb: out.append(bb)
    return out
CAND_Y = [CAP_Y] if TIDY else [CAP_Y, 1180, 1420, 1560, 1700]
def pick_y(t0, t1, w):  # 겹치는 시간이 가장 적은 높이(같으면 기본 높이 우선). 카메라가 크게 움직이면 0이 안 될 수 있다
    best = None
    for cy in CAND_Y:
        box = (540 - w / 2, cy - 70, 540 + w / 2, cy + 70)
        t, hits = t0, 0
        while t <= t1:
            hits += any(r[0] < box[2] and box[0] < r[2] and r[1] < box[3] and box[1] < r[3] for r in rects_at(t)); t += 0.04
        if best is None or hits < best[0]: best = (hits, cy)
        if hits == 0: break
    return best[1]
moved = 0
# 4) 말 자막(벨기에판): 표시 자막을 말 구간에 글자 비례로 나눠 4어절/13자 묶음, 말하는 어절만 노랑
n_sub = 0
for k, (a, b, st0, st1, disp, _tp) in enumerate(clips):
    brk = set()                       # " / " 로 나눈 뜻 묶음의 시작 어절 번호
    if "/" in disp:
        n_ = 0
        for part in disp.split("/"):
            brk.add(n_); n_ += len(part.replace("|", " ").split())
        disp = " ".join(disp.replace("/", " ").split())
    lbrk = set()                      # " | " = 한 묶음 안에서 줄을 나눌 자리(그 뒤 어절 번호)
    if "|" in disp:
        n_ = 0
        for part in disp.split("|")[:-1]:
            n_ += len(part.split()); lbrk.add(n_)
        disp = " ".join(disp.replace("|", " ").split())
    words = disp.split(); tot = sum(len(w) for w in words); acc, wt = 0, []
    sp1 = st1 - 0.1
    wsrc = S[k].get("w")  # 받아쓰기에서 얻은 어절별 시작 시각(음성 파일 기준 초). 있으면 글자 비례 대신 이 값을 쓴다
    lead = float(SP.get("cap_lead", 0.0))  # 2026-11-14 규칙 값: 강조 낱말을 말보다 이만큼 먼저 켠다(첫 어절은 문장 시작보다 앞서지 않음)
    for i, w in enumerate(words):
        if wsrc and len(wsrc) == len(words): wt.append([max(st0, st0 + max(0.0, wsrc[i] - a) / _tp - lead), w])
        else: wt.append([st0 + (sp1 - st0) * acc / tot, w])
        acc += len(w)
    # 2026-11-14 자막 누락 수정: 받아쓰기가 두 어절에 거의 같은 시각을 주면(0.04초 차이) 앞 어절이 0초가 되어 화면에서 빠졌다.
    # 어절마다 최소 표시 시간(글자당 0.065초, 0.14~0.32초)을 보장한다. 앞에서 밀고, 문장 끝을 넘으면 뒤에서 당긴다.
    if SP.get("cap_min_word", True):
        mind = [min(0.32, max(0.14, 0.065 * len(w))) for _, w in wt]
        for i in range(1, len(wt)):
            wt[i][0] = max(wt[i][0], wt[i - 1][0] + mind[i - 1])
        lim = max(st0, st1 + 0.15 - mind[-1])
        for i in range(len(wt) - 1, -1, -1):
            cap_i = lim if i == len(wt) - 1 else wt[i + 1][0] - mind[i]
            wt[i][0] = max(st0 - 0.1, min(wt[i][0], cap_i))
    groups, cur = [], []
    for wi_, w in enumerate(wt):
        if brk:
            if cur and wi_ in brk: groups.append(cur); cur = []
            cur.append(w); continue
        if cur and (len(cur) >= ST.get("cap_chunk_words", 4) or len("".join(x[1] for x in cur)) + len(w[1]) > ST.get("cap_chunk_chars", 13)):
            groups.append(cur); cur = []
        cur.append(w)
    if cur: groups.append(cur)
    nxt = clips[k + 1][2] if k + 1 < len(clips) else END
    for gi, g in enumerate(groups):
        g0 = sum(len(q) for q in groups[:gi])
        txt = "".join(("" if j == 0 else ("|" if g0 + j in lbrk else " ")) + x[1] for j, x in enumerate(g))
        gs = g[0][0]; ge = groups[gi + 1][0][0] if gi + 1 < len(groups) else min(nxt, st1 + 0.25)
        cy = pick_y(gs, ge, s.phrase_img_be3(txt, -1).width)
        if SP.get("cap_keep"):  # 2026-11-14: 숫자 칩 동안에도 말 자막을 지우지 않는다. 칩과 겹치면 칩 바로 위로 올린다
            sh = s.phrase_img_be3(txt, -1).height
            for ch in items:
                if ch["kind"] != "chip" or not (ch["t0"] < ge and gs < ch["t1"]): continue
                bb = Image.open(os.path.join(OUT, ch["file"])).getbbox()
                if bb and bb[1] < cy + sh / 2 + 6 and cy - sh / 2 - 6 < bb[3]:
                    cy = int(bb[1] - sh / 2 - 14)
        moved += cy != CAP_Y
        g_end = groups[gi + 1][0][0] if gi + 1 < len(groups) else min(nxt, st1 + 0.25)
        for i, (wt0, w) in enumerate(g):
            t1 = g[i + 1][0] if i + 1 < len(g) else g_end
            if t1 - wt0 < 0.05: continue
            fn = place(s.phrase_img_be3(txt, i), 540, cy, f"sub{n_sub:03d}.png"); n_sub += 1
            # 2026-11-14 강조 색 재발 방지: 영상 프레임(30fps) 경계에 맞춘다. 경계가 프레임 중간이면 AE·캡컷이 한 프레임 늦게 바꿔 앞 어절이 노랑으로 남았다
            f0, f1 = (math.floor(wt0 * FPS + 1e-6) / FPS, math.floor(t1 * FPS + 1e-6) / FPS) if SP.get("cap_frame_snap", True) else (wt0, t1)
            items.append({"kind": "sub", "file": fn, "t0": round(f0, 4), "t1": round(f1, 4), "text": txt, "hi": i, "cy": cy})
# 2026-11-14 AS24 원본 20편 시청 규칙: 칩 글자가 지금 말하는 낱말과 같으면 칩이 떠 있는 동안 말 자막을 숨긴다(칩이 자막 역할).
# 칩이 말과 다른 정보면 자막을 그대로 두고 칩 위로 올린다(cap_keep). 숨긴 자막은 hidden_subs 에 남겨 자막 검사가 대사 순서·시각을 계속 확인한다.
HIDDEN = []
def _norm(t): return re.sub(r"[^0-9A-Za-z가-힣]", "", t).lower()
def _knum(t):
    """'2만 1천' '5,800만' '8천' '82.5' 같은 말 속 숫자를 값으로 읽는다."""
    t = t.replace(",", ""); vals = []
    for m in re.finditer(r"(\d+(?:\.\d+)?)\s*(만|천|백)?(?:\s*(\d+(?:\.\d+)?)\s*(천|백)?)?", t):
        u = {"만": 1e4, "천": 1e3, "백": 1e2, None: 1}
        v = float(m.group(1)) * u[m.group(2)]
        if m.group(3): v += float(m.group(3)) * u[m.group(4)]
        vals.append(v)
    return vals
def _said(chip_txt, spoken):
    toks = [w for w in re.split(r"[\s·✓()/]+", chip_txt) if len(_norm(w)) >= 2]
    sp = _norm(spoken)
    if any(_norm(w) in sp for w in toks if not re.search(r"\d", w)): return True
    cn = _knum(chip_txt)
    return any(abs(a - b) <= 0.05 * max(a, b) for a in cn for b in _knum(spoken) if a >= 10 and b >= 10)
if SP.get("cap_chip_said"):
    for ch in [i for i in items if i["kind"] == "chip"]:
        ov = [i for i in items if i["kind"] == "sub" and i["t0"] < ch["t1"] and ch["t0"] < i["t1"]]
        spoken = " ".join(sorted({i["text"].replace("|", " ") for i in ov}))
        ch["said"] = bool(ov) and _said(ch["text"], spoken)
        if ch["said"]:
            HIDDEN += ov; items = [i for i in items if i not in ov]
# 2026-11-13 벨기에 교과서: 숫자 칩(가격·주행)이 떠 있는 동안 말 자막을 숨긴다
for ch in [i for i in items if i["kind"] == "chip" and i.get("hide_cap") and not SP.get("cap_keep")]:
    items = [i for i in items if not (i["kind"] == "sub" and i["t0"] < ch["t1"] and ch["t0"] < i["t1"])]
for f in [SP.get("bgm")] + [q.get("file") for q in SP.get("sfx", [])]:
    if f and os.path.exists(f): shutil.copy(f, os.path.join(OUT, os.path.basename(f)))
extra = {k: SP[k] for k in ("cuts", "src_vol", "hard_cuts", "bgm_vol", "edit") if k in SP}
if SP.get("bgm"): extra["bgm"] = os.path.basename(SP["bgm"])
if SP.get("sfx"): extra["sfx"] = [dict(q, file=os.path.basename(q["file"])) for q in SP["sfx"]]
json.dump({**extra, "items": items, "voice": "voice.wav", "end": END, "clips": clips, "fx": SP.get("flash", []), "car": SP.get("car", ""), "sub_png": V2, "hidden_subs": HIDDEN}, open(os.path.join(OUT, "manifest.json"), "w"), ensure_ascii=False, indent=1)
print("items", len(items), "subs", n_sub, "moved groups", moved, "voice end", clips[-1][3])
for c in clips: print(c[2], "→", c[3], "x", c[5], c[4])
