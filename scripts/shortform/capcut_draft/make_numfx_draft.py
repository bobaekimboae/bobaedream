"""나세르식 숫자 효과판(v4): 3D 아이콘판(v3 B) 위에서 숫자칩 그림을 캡컷 글자 + 캡컷 기본 글자 애니메이션으로 바꾼다. pycapcut==0.0.4
사용(노트북): python make_numfx_draft.py <에셋폴더> <원본영상> <로고.png> <아이콘폴더> <프로젝트이름>
나세르(VrSZbyPK7ug): '19 inch'·'638L'·'1500 TURBO'처럼 굵은 숫자+단위가 파란 빛과 함께 모이며 등장, 떠 있는 동안 은은히 빛남, 빛이 흩어지며 사라짐.
- 숫자는 매물 정보 그대로만(지어내지 않음). 인치는 매물 정보에 휠 크기가 없어 쓰지 않음.
- 캡컷 무료 글자 애니메이션만 사용(VIP 표시 없는 것). 캡컷 라이브러리 파일을 꺼내지 않는다.
"""
import os, runpy, sys, time
import pycapcut as cc
from pycapcut import trange, SEC, TextIntro, TextLoopAnim, TextOutro, FontType

A, src, logo, icons, name = sys.argv[1:6]
t0 = time.time()
_save = cc.ScriptFile.save
cc.ScriptFile.save = lambda self: None
sys.argv = ["make_3d_draft.py", A, src, logo, icons, name, "B"]
g = runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "make_3d_draft.py"))
cc.ScriptFile.save = _save
s, m = g["s"], g["m"]
us = lambda x: int(round(x * SEC)); tr = lambda a, b: trange(us(a), us(b) - us(a))

# 숫자칩 → 캡컷 글자(매물 사실: 주행 5만 8천 km, 2리터, 3,340만원)
NUM = {"chip10.png": "58,000KM", "chip14.png": "2.0L", "chip15.png": "3,340만원"}
times = {i["file"]: (i["t0"], i["t1"]) for i in m["items"] if i["file"] in NUM}
chips = s.tracks["chips"]
chips.segments = [x for x in chips.segments if os.path.basename(x.material_instance.path) not in NUM]

style = cc.TextStyle(size=26.0, bold=True, color=(1, 1, 1), align=1, letter_spacing=1)
border = cc.TextBorder(color=(0x30 / 255, 0x6B / 255, 0xD9 / 255), width=55.0)
glow = cc.TextShadow(color=(0.25, 0.55, 1.0), alpha=0.95, diffuse=60.0, distance=0.0)
s.add_track(cc.TrackType.text, "numfx")
for f, txt in NUM.items():
    a, b = times[f]
    seg = cc.TextSegment(txt, tr(a, b), font=FontType.Anton, style=style, border=border, shadow=glow,
                         clip_settings=cc.ClipSettings(transform_y=(960 - 520) / 960))
    seg.add_animation(TextIntro.荧光聚合, us(0.5))      # 빛이 모이며 등장
    seg.add_animation(TextOutro.辉光渐隐, us(0.3))      # 빛이 흩어지며 사라짐
    seg.add_animation(TextLoopAnim.漂浮发光, us(max(0.4, b - a - 0.8)))  # 떠 있는 동안 은은히 빛남
    s.add_segment(seg, "numfx")
s.save()
print(f"saved numfx draft '{name}': {len(NUM)} numbers in {time.time() - t0:.2f}s")
