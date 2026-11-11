"""v2 캡컷 프로젝트 생성: 원본 한 컷 영상을 대본 순서대로 잘라 붙이고(cuts) 내레이션·칩·자막·딩·끝 로고를 얹는다. pycapcut==0.0.4
사용(노트북): python make_v2_draft.py <에셋폴더(manifest.json·voice.wav·ding.wav)> <원본영상> <로고.png> <프로젝트이름>
"""
import json, os, sys, time
import pycapcut as cc
from pycapcut import trange, SEC
t0 = time.time()
A, src, logo, name = sys.argv[1:5]
m = json.load(open(os.path.join(A, "manifest.json"), encoding="utf-8"))
root = os.path.expandvars(r"%LOCALAPPDATA%\CapCut\User Data\Projects\com.lveditor.draft")
s = cc.DraftFolder(root).create_draft(name, 1080, 1920, 30, allow_replace=True)
us = lambda x: int(round(x * SEC)); tr = lambda a, b: trange(us(a), us(b) - us(a))
vm = cc.VideoMaterial(src)
s.add_track(cc.TrackType.video, "main"); pos = 0.0
for a, b in m["cuts"]:
    s.add_segment(cc.VideoSegment(vm, tr(pos, pos + b - a), source_timerange=tr(a, b), volume=0.0), "main"); pos += b - a
s.add_track(cc.TrackType.video, "subs", relative_index=1)
s.add_track(cc.TrackType.video, "chips", relative_index=2)
items = sorted(m["items"], key=lambda i: i["t0"])
for kind in ("sub", "ov"):
    L = [i for i in items if (i["kind"] == "sub") == (kind == "sub")]
    for x, y in zip(L, L[1:]): x["t1"] = min(x["t1"], y["t0"])
for it in [i for i in items if i["t1"] - i["t0"] >= 0.05]:
    seg = cc.VideoSegment(os.path.join(A, it["file"]), tr(it["t0"], it["t1"]))
    if it["kind"] == "label": seg.add_animation(cc.IntroType.放大, duration=us(0.25))
    if it["kind"] == "number": seg.add_animation(cc.IntroType.模糊渐显, duration=us(0.3))
    s.add_segment(seg, "subs" if it["kind"] == "sub" else "chips")
s.add_track(cc.TrackType.video, "logo", relative_index=3)
lg = cc.VideoSegment(logo, tr(*m["logo"]), clip_settings=cc.ClipSettings(scale_x=0.9, scale_y=0.9))
lg.add_animation(cc.IntroType.放大, duration=us(0.5)); s.add_segment(lg, "logo")
am = cc.AudioMaterial(os.path.join(A, "voice.wav"))
s.add_track(cc.TrackType.audio, "voice"); s.add_segment(cc.AudioSegment(am, trange(0, am.duration)), "voice")
dm = cc.AudioMaterial(os.path.join(A, "ding.wav")); s.add_track(cc.TrackType.audio, "sfx")
for x in m["sfx"]:
    s.add_segment(cc.AudioSegment(dm, trange(us(x["t"]), dm.duration), volume=10 ** (x["gain_db"] / 20)), "sfx")
s.save(); print(f"saved draft '{name}' in {time.time()-t0:.2f}s, {len(m['cuts'])} cuts, {len(items)} overlays")
