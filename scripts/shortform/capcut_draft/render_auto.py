"""차란차 매물 숏폼 자동 제작 — 에셋 생성(사양서 JSON 기반, X5 render_x5_v4.py를 일반화).
사용: SAG_EDIT=bobae_be python render_auto.py <spec.json> <track.json> <scripts/shortform 경로> <출력폴더>
사양서: car, end, voice, callouts[t0,t1,label,sub,fy], chips[text,t0,t1,cy,big,tilt], sentences[a,b,at,text], flash[]
"""
import json, os, shutil, subprocess, sys
SPEC, TRACK, SAG, OUT = sys.argv[1:5]
SP = json.load(open(SPEC, encoding="utf-8")); VOICE = SP["voice"]; END = SP["end"]
sys.path.insert(0, SAG); sys.argv = ["x", "/tmp/none.mp4", os.path.join(OUT, "_sag_tmp")]
import sag_reel_v1 as s
from PIL import Image
os.makedirs(OUT, exist_ok=True)
ST = s.STYLE; CAP_Y = ST["cap_cy"]; TILT = ST["tilt_fixed"]
trk = json.load(open(TRACK))
STICKER = "7600764310603730184"  # 캡컷 무료 스티커 'callout line'(점 → 사선 → 가로선)
DOT, CORNER, END_ = (-204, 51), (-120, -66), (217, -66)

def place(im, cx, cy, fn):
    c = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0)); c.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))
    c.save(os.path.join(OUT, fn)); return fn

def text_w(t, size):  # 캡컷 글자 폭 어림(크기 8 ≈ 한글 36px, v2 화면 실측)
    return sum(size * 4.5 * (1.0 if ord(c) > 0x3000 else 0.62) for c in t)

items = []
LBL_SIZE, LBL_MAXW, LBL_TILT = 64, 660, -1.5  # 8차: AS24.be 릴스 칩처럼 — 원본 AS24 붓 칠, 거의 수평, 위아래 넉넉, 중간 굵기 글자
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
def pointer(t0, t1, kf, label, sub="", force_fy=None):
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
def chip(txt, t0, t1, cy, fn, size, tilt=0.0):
    sz = size
    im = s.sticker(txt, sz, TILT + tilt, True)
    while im.width > MAXW and sz > 30:
        sz -= 4; im = s.sticker(txt, sz, TILT + tilt, True)
    items.append({"kind": "chip", "file": place(im, 540, cy, fn), "t0": t0, "t1": t1, "text": txt, "big": size == BIG, "cy": cy,
                  "tilt": TILT + tilt, "w": im.width, "h": im.height})
    return im.size
BIG, SMALL = 104, 56
for n, c in enumerate(SP["chips"]):
    chip(c["text"], c["t0"], c["t1"], c["cy"], f"t_chip{n:02d}.png", BIG if c.get("big") else SMALL, c.get("tilt", 0.0))

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
flt.append("".join(parts) + f"amix=inputs={len(parts)}:normalize=0,apad,atrim=0:{END},loudnorm=I=-16:TP=-1.5:LRA=11[out]")
subprocess.run(["ffmpeg", "-y", "-v", "error"] + sum([["-i", f] for f in files], []) + ["-filter_complex", ";".join(flt), "-map", "[out]", "-ar", "48000", "-ac", "2",
                os.path.join(OUT, "voice.wav")], check=True)

# 자막이 콜아웃·스티커와 겹치지 않게: 그 시간 동안 비어 있는 높이를 고른다
def rects_at(t):
    out = []
    for it in items:
        if not (it["t0"] <= t <= it["t1"]): continue
        if it["kind"] == "ptr":
            kf = it["kf"]; rt = t - it["t0"]; q = min(kf, key=lambda p: abs(p[0] - rt))
            lx, lab_y, sub_y, x0, x1 = q[3], q[4], q[5], q[6], q[7]
            ys = [lab_y - it["h"] / 2, lab_y + it["h"] / 2] + ([sub_y - 26, sub_y + 26] if sub_y else [])
            dot_y = q[2] - 1.5 * it["k"] * DOT[1] * -it["fy"]
            out.append((min(x0, lx - it["lw"] / 2), min(ys + [dot_y]), max(x1, lx + it["lw"] / 2), max(ys + [dot_y])))
        elif it["kind"] == "chip":
            bb = Image.open(os.path.join(OUT, it["file"])).getbbox()
            if bb: out.append(bb)
    return out
CAND_Y = [CAP_Y, 1180, 1420, 1560, 1700]
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
    words = disp.split(); tot = sum(len(w) for w in words); acc, wt = 0, []
    sp1 = st1 - 0.1
    wsrc = S[k].get("w")  # 받아쓰기에서 얻은 어절별 시작 시각(음성 파일 기준 초). 있으면 글자 비례 대신 이 값을 쓴다
    for i, w in enumerate(words):
        if wsrc and len(wsrc) == len(words): wt.append([st0 + max(0.0, wsrc[i] - a) / _tp, w])
        else: wt.append([st0 + (sp1 - st0) * acc / tot, w])
        acc += len(w)
    groups, cur = [], []
    for w in wt:
        if cur and (len(cur) >= ST.get("cap_chunk_words", 4) or len("".join(x[1] for x in cur)) + len(w[1]) > ST.get("cap_chunk_chars", 13)):
            groups.append(cur); cur = []
        cur.append(w)
    if cur: groups.append(cur)
    nxt = clips[k + 1][2] if k + 1 < len(clips) else END
    for gi, g in enumerate(groups):
        txt = " ".join(x[1] for x in g)
        gs = g[0][0]; ge = groups[gi + 1][0][0] if gi + 1 < len(groups) else min(nxt, st1 + 0.25)
        cy = pick_y(gs, ge, s.phrase_img_be3(txt, -1).width)
        moved += cy != CAP_Y
        g_end = groups[gi + 1][0][0] if gi + 1 < len(groups) else min(nxt, st1 + 0.25)
        for i, (wt0, w) in enumerate(g):
            t1 = g[i + 1][0] if i + 1 < len(g) else g_end
            if t1 - wt0 < 0.05: continue
            fn = place(s.phrase_img_be3(txt, i), 540, cy, f"sub{n_sub:03d}.png"); n_sub += 1
            items.append({"kind": "sub", "file": fn, "t0": round(wt0, 2), "t1": round(t1, 2), "text": txt, "hi": i, "cy": cy})
json.dump({"items": items, "voice": "voice.wav", "end": END, "clips": clips, "fx": SP.get("flash", []), "car": SP.get("car", "")}, open(os.path.join(OUT, "manifest.json"), "w"), ensure_ascii=False, indent=1)
print("items", len(items), "subs", n_sub, "moved groups", moved, "voice end", clips[-1][3])
for c in clips: print(c[2], "→", c[3], "x", c[5], c[4])
