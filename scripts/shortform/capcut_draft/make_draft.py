"""템플릿 JSON(견본에서 읽은 시점·위치)으로 새 캡컷 프로젝트를 코드로 만든다. pycapcut==0.0.4
사용(노트북): python make_draft.py <템플릿.json> <새프로젝트이름>
캡컷 스티커(라이브러리 자산)는 옮기지 않는다 — 우리 칩·로고·자막만.
"""
import json, os, sys, time
import pycapcut as cc
from pycapcut import trange, SEC

t0 = time.time()
tpl = json.load(open(sys.argv[1], encoding="utf-8"))
name = sys.argv[2]
root = os.path.expandvars(r"%LOCALAPPDATA%\CapCut\User Data\Projects\com.lveditor.draft")
s = cc.DraftFolder(root).create_draft(name, 1080, 1920, 30, allow_replace=True)


def tr(a, d):
    return trange(int(round(a * SEC)), int(round(d * SEC)))


vtracks = [t for t in tpl["tracks"] if t["type"] == "video"]
main = vtracks[0]["segs"][0]
s.add_track(cc.TrackType.video, "main")
mm = cc.VideoMaterial(main["path"])
s.add_segment(cc.VideoSegment(mm, trange(int(round(main["start"] * SEC)),
                                         min(int(round(main["dur"] * SEC)), mm.duration)), volume=0.0), "main")

s.add_track(cc.TrackType.video, "chips", relative_index=1)
for c in vtracks[1]["segs"]:
    v = cc.VideoSegment(c["path"], tr(c["start"], c["dur"]),
                        clip_settings=cc.ClipSettings(transform_x=c["x"], transform_y=c["y"],
                                                      scale_x=c["scale"], scale_y=c["scale"]))
    if c.get("anim"):
        v.add_animation(cc.IntroType.放大, duration=int(0.5 * SEC))  # 캡컷 '확대'
    s.add_segment(v, "chips")

style = cc.TextStyle(size=16.0, bold=True, color=(1, 1, 1), align=1, auto_wrapping=True, max_line_width=0.82)
border = cc.TextBorder(color=(0, 0, 0), width=45.0)
s.add_track(cc.TrackType.text, "subs")
for t in [t for t in tpl["tracks"] if t["type"] == "text"][0]["segs"]:
    s.add_segment(cc.TextSegment(t["text"], tr(t["start"], t["dur"]), style=style, border=border,
                                 clip_settings=cc.ClipSettings(transform_y=t["y"])), "subs")

a = [t for t in tpl["tracks"] if t["type"] == "audio"][0]["segs"][0]
s.add_track(cc.TrackType.audio, "voice")
am = cc.AudioMaterial(a["path"])
s.add_segment(cc.AudioSegment(am, trange(0, min(int(round(a["dur"] * SEC)), am.duration)),
                              volume=a.get("volume") or 1.0), "voice")
s.save()
print(f"saved draft '{name}' in {time.time() - t0:.1f}s")
