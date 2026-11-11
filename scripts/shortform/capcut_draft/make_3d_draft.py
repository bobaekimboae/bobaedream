"""나세르식 3D 아이콘판 캡컷 프로젝트(v3). make_be_draft.py(벨기에판 v2) 위에 3D 아이콘 트랙만 더한다. pycapcut==0.0.4
사용(노트북): python make_3d_draft.py <에셋폴더> <원본영상> <로고.png> <아이콘폴더> <프로젝트이름> [B|A]
- B판: 우리가 Blender로 만든 3D 아이콘 PNG(icon_*.png)를 영상 조각으로 올리고 키프레임으로 '톡 튀어나오기 + 흔들림 + 쏙 들어가기'
- A판(내부 비교 전용): 캡컷 스티커 resource_id(icons_a.json)로 같은 자리·같은 키프레임. 캡컷 라이브러리 자산을 파일로 꺼내지 않는다.
나세르 실측(VrSZbyPK7ug 10fps): 폭 화면의 약 25%, 부위 위쪽 1/3, 등장 0.2~0.3초 확대, 유지 중 살짝 흔들림, 퇴장 0.1~0.2초 축소.
"""
import json, os, sys, time
import pycapcut as cc
from pycapcut import trange, SEC, KeyframeProperty as KP

A, src, logo, icons, name = sys.argv[1:6]
mode = sys.argv[6] if len(sys.argv) > 6 else "B"
t0 = time.time()
# 1) 벨기에판 v2를 그대로 만든다(같은 대본·목소리·자막·컷·칩). 저장은 아이콘까지 넣은 뒤 한 번만.
import runpy
_save = cc.ScriptFile.save
cc.ScriptFile.save = lambda self: None
sys.argv = ["make_be_draft.py", A, src, logo, name]
g = runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "make_be_draft.py"))
cc.ScriptFile.save = _save
s, m = g["s"], g["m"]
us = lambda x: int(round(x * SEC)); tr = lambda a, b: trange(us(a), us(b) - us(a))

# 칩 파일 → 아이콘(같은 부위). chip10은 숫자칩(5.8만km) 아래, 나머지는 옵션칩(cy 900) 바로 위.
ICON = {"chip01.png": "icon_led_headlamp", "chip03.png": "icon_dual_muffler", "chip04.png": "icon_m_wheel",
        "chip06.png": "icon_brown_leather_seat", "chip07.png": "icon_power_seat", "chip08.png": "icon_rear_vent",
        "chip09.png": "icon_wood_trim", "chip10.png": "icon_digital_cluster", "chip11.png": "icon_idrive",
        "chip12.png": "icon_navigation", "chip13.png": "icon_rear_camera"}
CY = {"chip10.png": 790}
SCALE = 0.27  # 600x600 PNG가 캔버스 폭(1080)에 맞춰지므로 0.27 = 약 290px
res = json.load(open(os.path.join(icons, "icons_a.json"), encoding="utf-8")) if mode == "A" else {}

s.add_track(cc.TrackType.sticker if mode == "A" else cc.TrackType.video, "icons3d", relative_index=4)
n = 0
for it in sorted([i for i in m["items"] if i["file"] in ICON], key=lambda i: i["t0"]):
    key = ICON[it["file"]]
    a, b = it["t0"], it["t1"]
    d = b - a
    y = (960 - CY.get(it["file"], 625)) / 960
    side = 1 if n % 2 == 0 else -1  # 좌우 번갈아 살짝 비켜서(칩과 겹치지 않게)
    cs = cc.ClipSettings(transform_x=0.30 * side, transform_y=y)
    if mode == "A":
        if key not in res:
            continue
        seg = cc.StickerSegment(res[key], tr(a, b), clip_settings=cs)
    else:
        seg = cc.VideoSegment(os.path.join(icons, key + ".png"), tr(a, b), clip_settings=cs)
    k = lambda p, t, v: seg.add_keyframe(p, us(min(t, d)), v)
    # 등장: 작게 → 115% → 100% (0.24초), -10도 → 0도
    k(KP.uniform_scale, 0, SCALE * 0.15); k(KP.uniform_scale, 0.12, SCALE * 1.15); k(KP.uniform_scale, 0.24, SCALE)
    k(KP.rotation, 0, -10 * side); k(KP.rotation, 0.24, 0)
    # 유지: 살짝 흔들림(±3도, 0.35초 간격) + 위아래 2px
    t, sgn = 0.24, 1
    while t + 0.35 < d - 0.18:
        t += 0.35
        k(KP.rotation, t, 3 * sgn); k(KP.position_y, t, y + 0.002 * sgn); sgn = -sgn
    k(KP.position_y, 0.24, y); k(KP.position_x, 0, 0.30 * side)
    # 퇴장: 0.15초 쏙
    k(KP.uniform_scale, d - 0.15, SCALE); k(KP.uniform_scale, d, SCALE * 0.05)
    s.add_segment(seg, "icons3d")
    n += 1
s.save()
print(f"saved 3D draft '{name}' mode {mode}: {n} icons in {time.time() - t0:.2f}s")
