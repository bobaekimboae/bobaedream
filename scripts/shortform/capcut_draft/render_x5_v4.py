"""차란차 X5 캡컷 재현 4차 에셋: 캡컷 포인터(스티커 'callout line') + 캡컷 글자 라벨 + 매 프레임 트래킹,
휠 원호(허브 추적·크기 키프레임) + 20인치 포인터, 벨기에판 칠 칩(크기 균형) · 말 자막(포인터와 안 겹치는 높이) · 내레이션.
사용: SAG_EDIT=bobae_be python render_x5_v4.py <v2 에셋폴더> <track2.json> <voice.mp3> <words.json> <scripts/shortform 경로> <출력폴더> <extra_track.json>
- 캡컷 스티커는 resource_id만 프로젝트에 적는다(라이브러리 파일을 꺼내지 않음). 스티커 기하: 540px 그림, 캡컷 배율 1에서 1.5배로 그려짐(07:55 실측)
  점 = 중심 + 1.5k(-204, +51), 꺾인 곳 = 중심 + 1.5k(-120, -66), 끝 = 중심 + 1.5k(+217, -66)
"""
import json, os, shutil, subprocess, sys
V2, TRACK, VOICE, WORDS, SAG, OUT, EXTRA = sys.argv[1:8]
REPL = sys.argv[8] if len(sys.argv) > 8 else None  # 6번째 문장 교체 음성('두 단' → '이단', 같은 목소리로 한 번 생성, 앞뒤 무음 잘라냄)
sys.path.insert(0, SAG); sys.argv = ["x", "/tmp/none.mp4", os.path.join(OUT, "_sag_tmp")]
import sag_reel_v1 as s
from PIL import Image
os.makedirs(OUT, exist_ok=True)
ST = s.STYLE; CAP_Y = ST["cap_cy"]; TILT = ST["tilt_fixed"]
m = json.load(open(os.path.join(V2, "manifest.json"), encoding="utf-8"))
trk = json.load(open(TRACK)); extra = json.load(open(EXTRA))
STICKER = "7600764310603730184"  # 캡컷 무료 스티커 'callout line'(점 → 사선 → 가로선)
DOT, CORNER, END_ = (-204, 51), (-120, -66), (217, -66)

def place(im, cx, cy, fn):
    c = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0)); c.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))
    c.save(os.path.join(OUT, fn)); return fn

def text_w(t, size):  # 캡컷 글자 폭 어림(크기 8 ≈ 한글 36px, v2 화면 실측)
    return sum(size * 4.5 * (1.0 if ord(c) > 0x3000 else 0.62) for c in t)

items = []
def pointer(t0, t1, kf, label, sub="", force_fy=None):
    """kf = [[t, 점x, 점y]] (콜아웃 시작 기준). 라벨 폭에 맞춰 선 길이, 화면 밖으로 나가면 좌우 뒤집기, 위쪽이 좁으면 아래로"""
    lw = max(text_w(label, 10), text_w(sub, 7)) + 50
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
        lx = max(lw / 2 + 40, min(1040 - lw / 2, lx))  # 노랑 칩 여백·기울기만큼 화면 안쪽으로
        if fy == 1:
            lab_y, sub_y = ly - 58, (ly + 36 if sub else None)  # 6차: 노랑 칠 칩은 선 위, 보조 글은 선 아래(겹침 없음)
        else:
            lab_y, sub_y = ly + 58, (ly - 36 if sub else None)
        out.append([t, round(cx, 1), round(cy, 1), round(lx, 1), round(lab_y, 1), None if sub_y is None else round(sub_y, 1),
                    round(min(x, cx + 1.5 * k * END_[0] * fx), 1), round(max(x, cx + 1.5 * k * END_[0] * fx), 1)])
    items.append({"kind": "ptr", "t0": t0, "t1": t1, "k": round(k, 3), "fx": fx, "fy": fy, "label": label, "sub": sub, "lw": lw, "kf": out})

CALL = [(9.8, 11.4, "LED 테일램프", ""), (11.6, 13.2, "M 스포츠 패키지", "전후 범퍼 · 디퓨저"),
        (14.0, 15.8, "전동 트렁크", ""), (20.4, 21.8, "분할 테일게이트", "상·하 2단 오픈"),
        (22.4, 24.1, "파노라마 선루프", ""), (24.2, 25.4, "4존 에어컨", ""), (26.8, 27.8, "헤드업 디스플레이", ""),
        (28.0, 29.6, "12.3인치 디지털 계기판", ""), (29.8, 31.6, "크리스탈 기어 노브", ""),
        (33.2, 35.0, "12.3인치 디스플레이", "터치스크린 · 내비게이션"), (36.6, 37.8, "브라운 가죽 시트", ""),
        (38.0, 39.2, "하만카돈", "서라운드 사운드 시스템"), (40.6, 42.6, "M 스포츠 스티어링 휠", ""),
        (44.0, 46.0, "앰비언트 라이트", "실내 무드 조명"), (46.2, 48.0, "8단 자동변속기", "스텝트로닉"),
        (48.8, 51.0, "에어 서스펜션", "차고 조절 가능"), (52.6, 54.8, "서라운드 뷰", "360° 카메라"),
        (55.2, 57.2, "후진 어시스턴트", "주차 보조 시스템"), (57.2, 58.8, "40:20:40 폴딩", "2열 시트 분할 폴딩")]
for k, (t0, t1, lab, sub) in enumerate(CALL):
    if str(k) in trk:  # 라벨 방향은 레퍼런스와 같게(위/아래) — 헤드업 디스플레이는 대시보드 위 점, 라벨은 아래
        pointer(t0, t1, trk[str(k)]["kf"], lab, sub, force_fy=1 if trk[str(k)]["up"] else -1)
# LED 헤드라이트(타이틀 화면) — 원본에서 추적
led = [extra["led"][0]]  # 3.3초 장면 바뀜(크게 밀어 들어감)에서 추적이 튀므로 그 뒤는 버림(레퍼런스 점 2.2·2.8초 ≈ (198, 802)와 일치)
for p in extra["led"][1:]:
    if abs(p[1] - led[-1][1]) + abs(p[2] - led[-1][2]) > 60: break
    led.append(p)
pointer(1.8, 1.8 + led[-1][0] + 0.04, led, "LED 헤드라이트", force_fy=-1)  # 위는 타이틀 칩 자리라 라벨을 아래로
# 휠: 허브 추적 → 원호(림 테두리) + 20인치 포인터(림 위쪽 점)
wt = [p for p in extra["wheel"] if 6.4 <= p[0] <= 9.0]
R = lambda t: 550 + (600 - 550) * min(1, max(0, (t - 6.5) / 2.1))  # 림 반지름(레퍼런스 화면 실측 6.5초 550 → 8.6초 600)
items.append({"kind": "ring", "file": "ring_rim.png", "t0": 6.4, "t1": 9.0, "w": 1200, "h": 1200,
              "kf": [[round(t - 6.4, 3), x, y] for t, x, y in wt], "sc": [[round(t - 6.4, 3), round(R(t) / 580, 4)] for t, x, y in wt]})
ring = Image.new("RGBA", (1200, 1200), (0, 0, 0, 0))
from PIL import ImageDraw
ImageDraw.Draw(ring).arc([20, 20, 1180, 1180], -100, 40, fill=(255, 255, 255, 235), width=7)
ring.save(os.path.join(OUT, "ring_rim.png"))
import math
wk = [[round(t - 7.4, 3), x + R(t) * math.cos(math.radians(-80)) * 0.98, y + R(t) * math.sin(math.radians(-80)) * 0.98] for t, x, y in wt if 7.4 <= t <= 9.0]
pointer(7.4, 9.0, wk, "20인치", "M 스타 스포크 휠")
for it in m["items"]:
    if it["kind"] == "dim":
        shutil.copy(os.path.join(V2, it["file"]), os.path.join(OUT, it["file"])); items.append(it)
# 트렁크 카운트업(캡컷 글자)은 그대로
items += [i for i in m["items"] if i["kind"] == "text" and (i.get("count") or "트렁크" in i["text"] or "1,870" in i["text"])]

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
chip("BMW X5", 0.3, 3.4, 440, "t_title1.png", BIG)
chip("xDrive30d M 스포츠", 0.6, 3.4, 585, "t_title2.png", SMALL, -0.8)
chip("2021년식", 0.9, 3.4, 705, "t_title3.png", SMALL, 0.6)
chip("직렬 6기통", 3.8, 5.0, 470, "t_engine1.png", BIG)
chip("3.0L 디젤 터보", 4.0, 5.0, 615, "t_engine2.png", SMALL, -0.8)
chip("xDrive", 5.0, 6.2, 470, "t_awd1.png", BIG)
chip("상시 사륜구동", 5.2, 6.2, 615, "t_awd2.png", SMALL, -0.8)
chip("BMW X5", 61.0, 63.6, 440, "t_end1.png", BIG)
chip("xDrive30d M 스포츠", 61.3, 63.6, 585, "t_end2.png", SMALL, -0.8)

# 3) 음성: 문장 경계(받아쓰기 낱말 시각) → 장면 시작에 배치
W = json.load(open(WORDS))
SENT = [  # (장면 시작, 첫 낱말 위치, 표시 자막)
    (0.3, "BMW", "BMW X5 xDrive30d M 스포츠예요"),
    (3.8, "직렬", "직렬 6기통 3리터 디젤에 상시 사륜구동이고요"),
    (6.6, "휴는", "휠은 20인치 M 스타 스포크"),
    (9.8, "뒤쪽엔", "뒤쪽엔 LED 테일램프 범퍼와 디퓨저는 M 스포츠 패키지입니다"),
    (14.0, "트렁크는", "트렁크는 전동으로 열리고 2열을 접으면 공간이 더 넓어져요"),
    (20.4, "테일게이트는", "테일게이트는 위아래 이단으로 나뉘어 열리고"),
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
    if REPL and n == 5:
        a, b = 0.0, float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", REPL],
                                         capture_output=True, text=True).stdout) + 0.05
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
    src_in = "[1:a]" if REPL and n == 5 else "[0:a]"
    flt.append(f"{src_in}atrim={a}:{b},asetpts=PTS-STARTPTS,atempo={tp},adelay={int(st0 * 1000)}|{int(st0 * 1000)}[s{n}]")
    parts.append(f"[s{n}]")
flt.append("".join(parts) + f"amix=inputs={len(parts)}:normalize=0,apad,atrim=0:{END},loudnorm=I=-16:TP=-1.5:LRA=11[out]")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", VOICE] + (["-i", REPL] if REPL else []) + ["-filter_complex", ";".join(flt), "-map", "[out]", "-ar", "48000", "-ac", "2",
                os.path.join(OUT, "voice.wav")], check=True)

# 자막이 콜아웃·스티커와 겹치지 않게: 그 시간 동안 비어 있는 높이를 고른다
def rects_at(t):
    out = []
    for it in items:
        if not (it["t0"] <= t <= it["t1"]): continue
        if it["kind"] == "ptr":
            kf = it["kf"]; rt = t - it["t0"]; q = min(kf, key=lambda p: abs(p[0] - rt))
            lx, lab_y, sub_y, x0, x1 = q[3], q[4], q[5], q[6], q[7]
            ys = [lab_y - 42, lab_y + 42] + ([sub_y - 26, sub_y + 26] if sub_y else [])
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
            items.append({"kind": "sub", "file": fn, "t0": round(wt0, 2), "t1": round(t1, 2), "text": txt, "hi": i, "cy": cy})
json.dump({"items": items, "voice": "voice.wav", "end": END, "clips": clips}, open(os.path.join(OUT, "manifest.json"), "w"), ensure_ascii=False, indent=1)
print("items", len(items), "subs", n_sub, "moved groups", moved, "voice end", clips[-1][3])
for c in clips: print(c[2], "→", c[3], "x", c[5], c[4])
