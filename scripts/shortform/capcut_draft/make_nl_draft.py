"""NL형(AS24 네덜란드 편집 뼈대 + 보배드림 칩) 캡컷 프로젝트를 코드로 만든다. pycapcut==0.0.4
사용(노트북): python make_nl_draft.py <에셋폴더> <원본영상> <내레이션.wav> <로고.png> <프로젝트이름>
에셋폴더 = render_nl_assets.py 결과(1080x1920 투명 PNG + manifest.json + ding.wav).
캡컷 라이브러리 자산(스티커·글꼴·효과 그림)은 쓰지 않는다.
"""
import json, os, sys, time
import pycapcut as cc
from pycapcut import trange, SEC

t0 = time.time()
A, src, voice, logo, name = sys.argv[1:6]
m = json.load(open(os.path.join(A, "manifest.json"), encoding="utf-8"))
root = os.path.expandvars(r"%LOCALAPPDATA%\CapCut\User Data\Projects\com.lveditor.draft")
s = cc.DraftFolder(root).create_draft(name, 1080, 1920, 30, allow_replace=True)
us = lambda x: int(round(x * SEC))
tr = lambda a, b: trange(us(a), us(b) - us(a))

vm = cc.VideoMaterial(src)
am = cc.AudioMaterial(voice)
total = min(vm.duration, am.duration)
s.add_track(cc.TrackType.video, "main")
s.add_segment(cc.VideoSegment(vm, trange(0, total), volume=0.0), "main")

s.add_track(cc.TrackType.video, "subs", relative_index=1)
s.add_track(cc.TrackType.video, "chips", relative_index=2)
items = sorted(m["items"], key=lambda i: i["t0"])
for kind in ("sub", "ov"):  # 같은 트랙 안에서 겹치면 앞 조각을 다음 시작에서 끊는다
    L = [i for i in items if (i["kind"] == "sub") == (kind == "sub")]
    for a, b in zip(L, L[1:]):
        a["t1"] = min(a["t1"], b["t0"])
for it in [i for i in items if i["t1"] - i["t0"] >= 0.05]:
    seg = cc.VideoSegment(os.path.join(A, it["file"]), tr(it["t0"], it["t1"]))
    if it["kind"] == "label":
        seg.add_animation(cc.IntroType.放大, duration=us(0.25))
    elif it["kind"] == "number":
        seg.add_animation(cc.IntroType.模糊渐显, duration=us(0.3))
    s.add_segment(seg, "subs" if it["kind"] == "sub" else "chips")

e = m["end_logo"]
s.add_track(cc.TrackType.video, "logo", relative_index=3)
lg = cc.VideoSegment(logo, tr(e["t0"], min(e["t1"], total / SEC)),
                     clip_settings=cc.ClipSettings(scale_x=0.9, scale_y=0.9))
lg.add_animation(cc.IntroType.放大, duration=us(0.5))
s.add_segment(lg, "logo")

s.add_track(cc.TrackType.audio, "voice")
s.add_segment(cc.AudioSegment(am, trange(0, total)), "voice")
s.add_track(cc.TrackType.audio, "sfx")
dm = cc.AudioMaterial(os.path.join(A, "ding.wav"))
for x in m["sfx"]:
    s.add_segment(cc.AudioSegment(dm, trange(us(x["t"]), dm.duration), volume=10 ** (x["gain_db"] / 20)), "sfx")
s.save()
print(f"saved draft '{name}' in {time.time() - t0:.2f}s, {len(m['items'])} overlays")
