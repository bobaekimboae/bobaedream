"""벨기에판 캡컷 프로젝트 생성(render_be_assets.py 결과 사용). pycapcut==0.0.4
사용(노트북): python make_be_draft.py <에셋폴더> <원본영상> <로고.png> <프로젝트이름>
컷마다 원본 구간→타임라인 구간(길이가 다르면 캡컷이 속도로 맞춤), 칩·자막 PNG, 목소리, 배경음(목소리 동안 작게·끝에서 크게), 팝 1번, 끝 로고 커짐.
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
s.add_track(cc.TrackType.video, "main")
for a, b, x, y, _part in m["cuts"]:
    s.add_segment(cc.VideoSegment(vm, tr(x, y), source_timerange=tr(a, b), volume=0.0), "main")
s.add_track(cc.TrackType.video, "subs", relative_index=1)
s.add_track(cc.TrackType.video, "chips", relative_index=2)
items = sorted(m["items"], key=lambda i: i["t0"])
for kind in ("sub", "ov"):
    L = [i for i in items if (i["kind"] == "sub") == (kind == "sub")]
    for x, y in zip(L, L[1:]): x["t1"] = min(x["t1"], y["t0"])
for it in [i for i in items if i["t1"] - i["t0"] >= 0.05]:
    seg = cc.VideoSegment(os.path.join(A, it["file"]), tr(it["t0"], it["t1"]))
    if it["kind"] != "sub": seg.add_animation(cc.IntroType.放大, duration=us(0.2))  # 톡
    s.add_segment(seg, "subs" if it["kind"] == "sub" else "chips")
s.add_track(cc.TrackType.video, "logo", relative_index=3)
lg = cc.VideoSegment(logo, tr(*m["logo"]), clip_settings=cc.ClipSettings(scale_x=0.8, scale_y=0.8))
lg.add_animation(cc.IntroType.放大, duration=us(0.6)); s.add_segment(lg, "logo")
am = cc.AudioMaterial(os.path.join(A, "voice.wav"))
s.add_track(cc.TrackType.audio, "voice"); s.add_segment(cc.AudioSegment(am, trange(0, am.duration)), "voice")
b = m["bgm"]; bm = cc.AudioMaterial(os.path.join(A, b["file"])); s.add_track(cc.TrackType.audio, "bgm")
ve = b["voice_end"]
s.add_segment(cc.AudioSegment(bm, tr(0, ve), source_timerange=tr(0, ve), volume=b["under_voice"]), "bgm")
tail = cc.AudioSegment(bm, tr(ve, m["end"]), source_timerange=tr(ve, m["end"]), volume=b["tail"])
tail.add_fade(0, us(0.8)); s.add_segment(tail, "bgm")
s.add_track(cc.TrackType.audio, "sfx")
for x in m["sfx"]:
    dm = cc.AudioMaterial(os.path.join(A, x["file"]))
    s.add_segment(cc.AudioSegment(dm, trange(us(x["t"]), dm.duration), volume=10 ** (x["gain_db"] / 20)), "sfx")
s.save(); print(f"saved draft '{name}' in {time.time()-t0:.2f}s, {len(m['cuts'])} cuts, {len(items)} overlays")
