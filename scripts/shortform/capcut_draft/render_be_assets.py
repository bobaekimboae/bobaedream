"""벨기에판(AS24 BE 원본 재현, 편집 매뉴얼 v4 §9) 캡컷용 에셋 만들기.
칩·자막 그림은 파이프라인 렌더러(sag_reel_v1.py, SAG_EDIT=bobae_be)의 sticker()·phrase_img_be3()를 그대로 불러 써서
자체 렌더본과 캡컷본이 같은 모양이 되게 한다.
사용: SAG_EDIT=bobae_be python render_be_assets.py <작업폴더(timed.json·voice.wav)> <main 체크아웃 scripts/shortform 경로>
- 컷: 구절 경계에서만 바꿈, 장면이 짧으면 느리게(최소 0.5배)
- 칩: 그 부위 컷 위에서만, 핵심 낱말을 말하는 순간 +0.05초 (옵션 = ✓ 칩, 숫자 = 숫자 칩)
- 말 자막: 그림자 흰 글자 · 말하는 어절만 #F7EC38 · 4어절/13자 · y=1283 · 컷 뒤 0.3초 비움 · 숫자 칩 동안 숨김 · 끝 로고 동안 숨김
"""
import json, os, re, sys
W_, SAG = sys.argv[1], sys.argv[2]
sys.path.insert(0, SAG); sys.argv = ["x", "/tmp/none.mp4", os.path.join(W_, "_sag_tmp")]
import sag_reel_v1 as s
from PIL import Image
P = json.load(open(os.path.join(W_, "timed.json")))
OUT = os.path.join(W_, "png"); os.makedirs(OUT, exist_ok=True)
VOICE_END = float(os.environ.get("VOICE_END", "46.56")); TAIL = 2.0; END = VOICE_END + TAIL
ST = s.STYLE; CAP_Y = ST["cap_cy"]; GAP = ST["cap_cut_gap"]; TILT = ST["tilt_fixed"]
P[0]["t0"] = 0.0
starts = [p["t0"] for p in P] + [END]
cuts, items, n = [], [], 0

def place(im, cx, cy, fn):
    c = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0)); c.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))
    c.save(os.path.join(OUT, fn)); return fn

def key_time(p, key):
    """구절 안에서 핵심 낱말의 시각(글자 길이 비례). 없으면 구절 시작"""
    v = p["voice"]; i = v.find(key) if key else -1
    sp = max(0.3, p["t1"] - p["t0"])
    return p["t0"] + (sp * i / max(1, len(v)) if i > 0 else 0)

KEYS = {"✓ LED 헤드램프": "헤드램프", "✓ 듀얼 머플러": "듀얼", "✓ M 스포츠 휠": "엠 스포츠 휠", "✓ 브라운 가죽 시트": "브라운",
        "✓ 전동 시트": "전동", "✓ 뒷좌석 송풍구": "송풍구", "✓ 우드 트림": "우드", "5.8만km": "주행거리", "✓ iDrive 컨트롤러": "아이드라이브",
        "✓ 내비게이션": "내비게이션", "✓ 후방 카메라": "후방", "20년09월 등록": "", "3,340만원": "", "520i M 스포츠": ""}
hide = []
for k, p in enumerate(P):
    a, b = p["shot"]; t0, t1 = starts[k], starts[k + 1]; D = t1 - t0; L = b - a
    if L > D: a, b = a, a + D            # 장면이 길면 앞부분만(정속)
    elif L < 0.5 * D: b = a + 0.5 * D    # 0.5배보다 느려지면 원본을 조금 더 씀
    cuts.append([round(a, 3), round(b, 3), round(t0, 3), round(t1, 3), p["part"]])
    chip = p.get("chip")
    if chip:
        big = p.get("kind") in ("number", "hook")
        ct = max(t0 + 0.05, key_time(p, KEYS.get(chip, "")) + 0.05)
        ce = min(t1, ct + (2.2 if big else 2.0))
        im = s.sticker(chip, ST["big_size"] if big else ST["feat_size"], TILT + (-0.8, 0.6, 0.0)[k % 3], big)
        cy = 520 if big else 900
        fn = place(im, 540, cy, f"chip{k:02d}.png")
        items.append({"kind": "number" if big else "label", "file": fn, "t0": round(ct, 2), "t1": round(ce, 2)})
        if p.get("kind") == "number": hide.append((ct, ce))
# 말 자막: 표시 글(disp)을 구절 말 구간에 글자 비례로 나눔
for k, p in enumerate(P):
    words = p["disp"].split(); tot = sum(len(w) for w in words); acc = 0
    sp0, sp1 = (0.05 if k == 0 else p["t0"]), p["t1"]
    wt = []
    for w in words:
        wt.append([sp0 + (sp1 - sp0) * acc / tot, w]); acc += len(w)
    groups, cur = [], []
    for w in wt:
        if cur and (len(cur) >= ST.get("cap_chunk_words", 4) or len("".join(x[1] for x in cur)) + len(w[1]) > ST.get("cap_chunk_chars", 13)):
            groups.append(cur); cur = []
        cur.append(w)
    if cur: groups.append(cur)
    cut_ok = starts[k] + (GAP if k else 0)
    for gi, g in enumerate(groups):
        txt = " ".join(x[1] for x in g)
        g_end = groups[gi + 1][0][0] if gi + 1 < len(groups) else min(starts[k + 1], sp1 + 0.25)
        for i, (wt0, w) in enumerate(g):
            a = max(wt0, cut_ok); b = g[i + 1][0] if i + 1 < len(g) else g_end
            b = min(b, starts[k + 1], VOICE_END + 0.2)
            if any(h0 < b and a < h1 for h0, h1 in hide):  # 숫자 칩 동안 숨김
                a = max(a, max(h1 for h0, h1 in hide if h0 < b and a < h1))
            if b - a < 0.05: continue
            im = s.phrase_img_be3(txt, i)
            fn = place(im, 540, CAP_Y, f"sub{n:03d}.png"); n += 1
            items.append({"kind": "sub", "file": fn, "t0": round(a, 2), "t1": round(b, 2)})
price = [i for i in items if i["kind"] == "number"]
sfx = [{"t": price[-1]["t0"], "file": "pop.wav", "gain_db": -6}] if price else []   # 음악 있으면 1번(BE)
man = {"cuts": cuts, "items": items, "sfx": sfx, "logo": [VOICE_END, END], "end": END,
       "bgm": {"file": "bgm.mp3", "under_voice": 0.15, "tail": ST.get("bgm_vol", 0.34), "voice_end": VOICE_END}}
json.dump(man, open(os.path.join(OUT, "manifest.json"), "w"), ensure_ascii=False, indent=1)
print(len(cuts), "cuts", len(items), "items")
