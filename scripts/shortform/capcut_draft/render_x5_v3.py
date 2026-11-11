"""차란차 X5 캡컷 재현 3차 에셋: 매 프레임 트래킹 콜아웃 + 벨기에판 타이틀·말 자막 + 내레이션 음성 트랙.
사용: SAG_EDIT=bobae_be python render_x5_v3.py <v2 에셋폴더(render_x5_assets 결과)> <track2.json> <voice.mp3> <words.json> <scripts/shortform 경로> <출력폴더>
- 콜아웃: v2 스프라이트 그대로, 위치 = 원본에서 매 프레임(25fps) 추적한 점(track2.py) → 키프레임 0.04초 간격
- 타이틀·스탯: 벨기에판 노랑 붓띠 스티커(sag_reel_v1.sticker big), 말 자막: phrase_img_be3(그림자 흰 글자 · 말하는 어절만 노랑 · y=1283)
- 음성: 일레븐랩스 한 번 생성본을 문장 단위로 잘라 장면 시작에 맞춰 배치(겹치면 뒤로 밀고, 전체를 1.08배 빠르게)
"""
import json, os, shutil, subprocess, sys
V2, TRACK, VOICE, WORDS, SAG, OUT = sys.argv[1:7]
sys.path.insert(0, SAG); sys.argv = ["x", "/tmp/none.mp4", os.path.join(OUT, "_sag_tmp")]
import sag_reel_v1 as s
from PIL import Image
os.makedirs(OUT, exist_ok=True)
ST = s.STYLE; CAP_Y = ST["cap_cy"]; TILT = ST["tilt_fixed"]
m = json.load(open(os.path.join(V2, "manifest.json"), encoding="utf-8"))
trk = json.load(open(TRACK))

def place(im, cx, cy, fn):
    c = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0)); c.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))
    c.save(os.path.join(OUT, fn)); return fn

items = []
# 1) 콜아웃: 점 위치 → 스프라이트 중심(점은 스프라이트 위/아래 끝에서 28px)
calls = [i for i in m["items"] if i["kind"] == "callout" and i["file"].startswith("call") and i["file"][4:6].isdigit()]
for it in calls:
    k = str(int(it["file"][4:6]))
    shutil.copy(os.path.join(V2, it["file"]), os.path.join(OUT, it["file"]))
    if k not in trk: items.append(it); continue
    up, h = trk[k]["up"], it["h"]
    off = (h / 2 - 28) * (-1 if up else 1)
    it = dict(it, kf=[[t, x, y + off] for t, x, y in trk[k]["kf"]])
    items.append(it)
for it in m["items"]:
    if it["kind"] in ("ring", "dim") or it.get("file") in ("call_led.png", "call_wheel.png"):
        if it.get("file"): shutil.copy(os.path.join(V2, it["file"]), os.path.join(OUT, it["file"]))
        items.append(it)
# 트렁크 카운트업(캡컷 글자)은 그대로
items += [i for i in m["items"] if i["kind"] == "text" and (i.get("count") or "트렁크" in i["text"] or "1,870" in i["text"])]

# 2) 벨기에판 타이틀·스탯 스티커
def big(txt, t0, t1, cy, fn, size=None, tilt=0.0):
    im = s.sticker(txt, size or ST["big_size"], TILT + tilt, True)
    items.append({"kind": "chip", "file": place(im, 540, cy, fn), "t0": t0, "t1": t1})
big("BMW X5", 0.3, 3.4, 430, "t_title1.png")
big("xDrive30d M 스포츠", 0.6, 3.4, 560, "t_title2.png", ST["feat_size"], -0.8)
big("2021년식", 0.9, 3.4, 670, "t_title3.png", ST["feat_size"], 0.6)
big("직렬 6기통 3.0L 디젤", 3.8, 5.0, 520, "t_engine.png")
big("xDrive 상시 사륜구동", 5.0, 6.2, 520, "t_awd.png")
big("BMW X5", 61.0, 63.6, 430, "t_end1.png")
big("xDrive30d M 스포츠", 61.3, 63.6, 560, "t_end2.png", ST["feat_size"], -0.8)

# 3) 음성: 문장 경계(받아쓰기 낱말 시각) → 장면 시작에 배치
W = json.load(open(WORDS))
SENT = [  # (장면 시작, 첫 낱말 위치, 표시 자막)
    (0.3, "BMW", "BMW X5 xDrive30d M 스포츠예요"),
    (3.8, "직렬", "직렬 6기통 3리터 디젤에 상시 사륜구동이고요"),
    (6.6, "휴는", "휠은 20인치 M 스타 스포크"),
    (9.8, "뒤쪽엔", "뒤쪽엔 LED 테일램프 범퍼와 디퓨저는 M 스포츠 패키지입니다"),
    (14.0, "트렁크는", "트렁크는 전동으로 열리고 2열을 접으면 공간이 더 넓어져요"),
    (20.4, "테일게이트는", "테일게이트는 위아래 두 단으로 나뉘어 열리고"),
    (22.4, "천장엔", "천장엔 파노라마 선루프 공조는 4존입니다"),
    (26.8, "헤드업", "헤드업 디스플레이에 12.3인치 디지털 계기판 기어 노브는 크리스탈이에요"),
    (33.2, "가운데에도", "가운데에도 12.3인치 터치 디스플레이가 들어가고"),
    (36.6, "시트는", "시트는 브라운 가죽 오디오는 하만카돈입니다"),
    (40.6, "스티어링", "스티어링 휠도 M 스포츠 전용이고요"),
    (44.0, "실낸", "실내엔 앰비언트 라이트 변속기는 8단 자동이에요"),
    (48.8, "에어", "에어 서스펜션이라 차고도 조절됩니다"),
    (52.6, "주차는", "주차는 360도 서라운드 뷰랑 후진 어시스턴트가 도와주고"),
    (57.2, "이열", "2열 시트는 40:20:40으로 나눠 접혀요"),
    (61.0, "자세한", "자세한 건 보배드림에서 확인해 보세요"),
]
idx, j = [], 0
for _, w0, _ in SENT:
    while W[j][2] != w0: j += 1
    idx.append(j); j += 1
# 문장마다 속도: 다음 장면 전에 끝나도록 1.05~1.22배(그래도 넘치면 뒤로 밀림). 첫 문장은 0초부터
clips, prev_end = [], 0.0
END_T = 63.6
for n, (scene, _, disp) in enumerate(SENT):
    a = W[idx[n]][0] - 0.04
    b = (W[idx[n + 1]][0] - 0.04) if n + 1 < len(SENT) else W[-1][1] + 0.25
    start = max(0.05 if n == 0 else scene, prev_end + 0.06)
    nxt = SENT[n + 1][0] if n + 1 < len(SENT) else END_T
    tempo = max(1.05, min(1.22, (b - a) / max(0.3, nxt - start - 0.06)))
    dur = (b - a) / tempo
    clips.append((round(a, 3), round(b, 3), round(start, 3), round(start + dur, 3), disp, round(tempo, 3)))
    prev_end = start + dur
END = 63.6
assert clips[-1][3] <= END + 0.05, clips[-1]
for c in clips:
    if c[3] > (SENT[clips.index(c) + 1][0] if clips.index(c) + 1 < len(SENT) else END) + 0.05: print('늦음', c)
# 음성 트랙 한 파일(63.6초): 문장 조각을 1.08배로 바꿔 제자리에
parts, flt = [], []
for n, (a, b, st0, _, _, tp) in enumerate(clips):
    flt.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,atempo={tp},adelay={int(st0 * 1000)}|{int(st0 * 1000)}[s{n}]")
    parts.append(f"[s{n}]")
flt.append("".join(parts) + f"amix=inputs={len(parts)}:normalize=0,apad,atrim=0:{END},loudnorm=I=-16:TP=-1.5:LRA=11[out]")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", VOICE, "-filter_complex", ";".join(flt), "-map", "[out]", "-ar", "48000", "-ac", "2",
                os.path.join(OUT, "voice.wav")], check=True)

# 자막이 콜아웃·스티커와 겹치지 않게: 그 시간 동안 비어 있는 높이를 고른다
def rects_at(t):
    out = []
    for it in items:
        if it["kind"] in ("callout",) and it["t0"] <= t <= it["t1"]:
            kf = it["kf"]; rt = t - it["t0"]
            x, y = kf[0][1], kf[0][2]
            for q in range(len(kf) - 1):
                if kf[q][0] <= rt <= kf[q + 1][0]:
                    f = (rt - kf[q][0]) / max(1e-6, kf[q + 1][0] - kf[q][0])
                    x = kf[q][1] + f * (kf[q + 1][1] - kf[q][1]); y = kf[q][2] + f * (kf[q + 1][2] - kf[q][2]); break
                if rt > kf[q + 1][0]: x, y = kf[q + 1][1], kf[q + 1][2]
            out.append((x - it["w"] / 2, y - it["h"] / 2, x + it["w"] / 2, y + it["h"] / 2))
        elif it["kind"] == "chip" and it["t0"] <= t <= it["t1"]:
            bb = Image.open(os.path.join(OUT, it["file"])).getbbox()
            if bb: out.append(bb)
    return out
CAND_Y = [CAP_Y, 1560, 1700, 1180]
def pick_y(t0, t1, w):
    for cy in CAND_Y:
        box = (540 - w / 2, cy - 70, 540 + w / 2, cy + 70)
        t, hit = t0, False
        while t <= t1 and not hit:
            hit = any(r[0] < box[2] and box[0] < r[2] and r[1] < box[3] and box[1] < r[3] for r in rects_at(t)); t += 0.04
        if not hit: return cy
    return CAP_Y
moved = 0
# 4) 말 자막(벨기에판): 표시 자막을 말 구간에 글자 비례로 나눠 4어절/13자 묶음, 말하는 어절만 노랑
n_sub = 0
for k, (a, b, st0, st1, disp, _tp) in enumerate(clips):
    words = disp.split(); tot = sum(len(w) for w in words); acc, wt = 0, []
    sp1 = st1 - 0.1
    for w in words:
        wt.append([st0 + (sp1 - st0) * acc / tot, w]); acc += len(w)
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
            items.append({"kind": "sub", "file": fn, "t0": round(wt0, 2), "t1": round(t1, 2)})
json.dump({"items": items, "voice": "voice.wav", "end": END, "clips": clips}, open(os.path.join(OUT, "manifest.json"), "w"), ensure_ascii=False, indent=1)
print("items", len(items), "subs", n_sub, "moved groups", moved, "voice end", clips[-1][3])
for c in clips: print(c[2], "→", c[3], "x", c[5], c[4])
