"""차란차 X5 모션그래픽 캡컷 재현 프로젝트(render_x5_assets.py 결과 사용). pycapcut==0.0.4
사용(노트북): python make_x5_draft.py <에셋폴더> <원본.mp4> <프로젝트이름>
원본 영상·원본 소리 그대로 + 어둡게 + 휠 원호 + 콜아웃 스프라이트(위치 키프레임=트래킹 대체) + 캡컷 글자(흐림→선명 등장, 카운트업)
"""
import json, os, sys, time
import pycapcut as cc
from pycapcut import trange, SEC, KeyframeProperty as KP, IntroType, OutroType, TextIntro, TextOutro

A, src, name = sys.argv[1:4]
t0 = time.time()
m = json.load(open(os.path.join(A, "manifest.json"), encoding="utf-8"))
root = os.path.expandvars(r"%LOCALAPPDATA%\CapCut\User Data\Projects\com.lveditor.draft")
s = cc.DraftFolder(root).create_draft(name, 1080, 1920, 25, allow_replace=True)
us = lambda x: int(round(x * SEC)); tr = lambda a, b: trange(us(a), us(b) - us(a))
vm = cc.VideoMaterial(src)
s.add_track(cc.TrackType.video, "main")
s.add_segment(cc.VideoSegment(vm, trange(0, vm.duration), volume=1.0), "main")  # 원본 소리 유지

# 겹치지 않게 트랙 나누기
tracks = {}
def put(seg, kind, a, b, ttype):
    lst = tracks.setdefault(kind, [])
    for i, end in enumerate(lst):
        if end <= a + 1e-6:
            lst[i] = b; tn = f"{kind}{i}"; break
    else:
        lst.append(b); tn = f"{kind}{len(lst) - 1}"
        s.add_track(ttype, tn, relative_index=len(s.tracks) + 1)
    s.add_segment(seg, tn)

X = lambda x: (x - 540) / 540
Y = lambda y: (960 - y) / 960
order = {"dim": 0, "ring": 1, "callout": 2, "text": 3}
for it in sorted(m["items"], key=lambda i: (order[i["kind"]], i["t0"])):
    a, b = it["t0"], it["t1"]
    if it["kind"] == "dim":
        seg = cc.VideoSegment(os.path.join(A, it["file"]), tr(a, b))
        seg.add_animation(IntroType.渐显, us(0.4)); seg.add_animation(OutroType.渐隐, us(0.4))
        put(seg, "dim", a, b, cc.TrackType.video); continue
    if it["kind"] in ("callout", "ring"):
        sc = 1 / min(1080 / it["w"], 1920 / it["h"])
        k0 = it["kf"][0]
        seg = cc.VideoSegment(os.path.join(A, it["file"]), tr(a, b),
                              clip_settings=cc.ClipSettings(scale_x=sc, scale_y=sc, transform_x=X(k0[1]), transform_y=Y(k0[2])))
        for t, x, y in it["kf"]:
            if t <= b - a:
                seg.add_keyframe(KP.position_x, us(t), X(x)); seg.add_keyframe(KP.position_y, us(t), Y(y))
        seg.add_animation(IntroType.放大 if it["kind"] == "callout" else IntroType.模糊渐显, us(0.3))
        seg.add_animation(OutroType.渐隐, us(0.25))
        put(seg, it["kind"], a, b, cc.TrackType.video); continue
    # 캡컷 글자
    bg = cc.TextBackground(color="#FFFFFF", alpha=0.95, round_radius=1.0, height=0.2, width=0.25) if it.get("pill") else None
    st = cc.TextStyle(size=it["size"], bold=it.get("bold", False), color=(0.08, 0.14, 0.25) if bg else (1, 1, 1),
                      align=1, letter_spacing=it.get("spacing", 0))
    seg = cc.TextSegment(it["text"], tr(a, b), style=st, background=bg,
                         shadow=cc.TextShadow(alpha=0.45, diffuse=30.0, distance=3.0),
                         clip_settings=cc.ClipSettings(transform_y=Y(it["y"])))
    if not it.get("count") or it.get("first"):
        seg.add_animation(TextIntro.模糊, us(0.45))  # 흐림 → 선명
    if not it.get("count") or b >= 18.9:
        seg.add_animation(TextOutro.渐隐, us(0.3))
    put(seg, "text", a, b, cc.TrackType.text)
s.save()
print(f"saved X5 draft '{name}': {len(m['items'])} items, tracks {sum(len(v) for v in tracks.values())} in {time.time() - t0:.2f}s")
