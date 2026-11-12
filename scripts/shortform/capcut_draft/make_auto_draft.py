"""차란차 매물 숏폼 자동 제작 — 캡컷 초안(make_x5_v7_draft.py 일반화: 효과 시각·끝을 manifest의 fx·end에서 읽음). 원본 설명:
차란차 X5 캡컷 재현 7차: 포인터 라벨·타이틀 칩 = 벨기에 원본 노랑 칠 PNG(고화질, 크게). 캡컷 기능을 직접 쓴다(render_x5_v4.py 결과 사용). pycapcut==0.0.4
사용(노트북): python make_auto_draft.py <에셋폴더> <원본.mp4> <프로젝트이름>
- 4차와 달라진 점: 칠 칩 = 캡컷 글자(노랑 바탕·검정 굵은 글자·기울기·튀어나오기 등장), 말 자막 = 캡컷 글자(흰 글자·검정 테두리, 말하는 어절만 노랑),
  장면 효과 = 캡컷 효과(첫 화면 흐림 열림, 큰 장면 바뀜에 짧은 번쩍임, 끝 흐림), 라벨·보조 글 = 캡컷 등장·퇴장 애니메이션
- 원본 영상의 색·화질은 바꾸지 않는다(필터 없음). 휠 원호와 어둡게 깔기만 PNG
- 포인터: 캡컷 무료 스티커 'callout line'(resource_id만 기록) + 캡컷 글자 라벨(흰 바탕 남색 굵은 글자) · 보조 글(그림자 흰 글자), 매 프레임 위치 키프레임
- 휠: 원호 PNG(위치·크기 키프레임) + 20인치 포인터
- 벨기에판 칠 칩(크기 균형) · 말 자막(포인터와 안 겹치는 높이) · 트렁크 카운트업 · 내레이션(원본 소리 25%)
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
s.add_segment(cc.VideoSegment(vm, trange(0, vm.duration), volume=0.25), "main")
am = cc.AudioMaterial(os.path.join(A, m["voice"]))
s.add_track(cc.TrackType.audio, "voice")
s.add_segment(cc.AudioSegment(am, trange(0, min(am.duration, vm.duration))), "voice")

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

class HiText(cc.TextSegment):
    """한 글자 범위만 다른 색(말하는 어절 노랑). 캡컷 글자 스타일 범위를 여러 개로 나눠 적는다"""
    def __init__(self, *a, hi=None, hi_color=(0.97, 0.93, 0.22), **k):
        super().__init__(*a, **k); self.hi = hi; self.hi_color = hi_color
    def export_material(self):
        ret = super().export_material()
        if not self.hi: return ret
        c = json.loads(ret["content"]); base = c["styles"][0]; a, b = self.hi; n = len(self.text); out = []
        for r0, r1, col in ((0, a, None), (a, b, self.hi_color), (b, n, None)):
            if r1 <= r0: continue
            st = json.loads(json.dumps(base)); st["range"] = [r0, r1]
            if col: st["fill"]["content"]["solid"]["color"] = list(col)
            out.append(st)
        c["styles"] = out; ret["content"] = json.dumps(c, ensure_ascii=False); return ret

def char_w(t):  # 캡컷 글자 크기 1당 대략 폭(px)
    return sum(4.5 * (1.0 if ord(ch) > 0x3000 else 0.62) for ch in t)

X = lambda x: (x - 540) / 540
Y = lambda y: (960 - y) / 960
NAVY = (0.08, 0.14, 0.25)

def fade(seg, d):  # 투명도 0 → 1(0.2초) … 1 → 0(마지막 0.2초)
    seg.add_keyframe(KP.alpha, 0, 0.0); seg.add_keyframe(KP.alpha, us(0.2), 1.0)
    seg.add_keyframe(KP.alpha, us(max(0.25, d - 0.2)), 1.0); seg.add_keyframe(KP.alpha, us(d), 0.0)

def pointer(it):
    a, b = it["t0"], it["t1"]; d = b - a; kf = [q for q in it["kf"] if 0 <= q[0] <= d]
    k = it["k"]; q0 = kf[0]
    st = cc.StickerSegment(it.get("resource_id", "7600764310603730184"), tr(a, b), clip_settings=cc.ClipSettings(
        scale_x=k, scale_y=k, transform_x=X(q0[1]), transform_y=Y(q0[2]),
        flip_horizontal=it["fx"] == -1, flip_vertical=it["fy"] == -1))
    for q in kf:
        st.add_keyframe(KP.position_x, us(q[0]), X(q[1])); st.add_keyframe(KP.position_y, us(q[0]), Y(q[2]))
    fade(st, d)
    put(st, "ptr", a, b, cc.TrackType.sticker)
    lsc = 1 / min(1080 / it["w"], 1920 / it["h"])  # 원본 픽셀 크기 그대로
    lab = cc.VideoSegment(os.path.join(A, it["file"]), tr(a, b),
                          clip_settings=cc.ClipSettings(scale_x=lsc, scale_y=lsc, transform_x=X(q0[3]), transform_y=Y(q0[4])))
    for q in kf:
        lab.add_keyframe(KP.position_x, us(q[0]), X(q[3])); lab.add_keyframe(KP.position_y, us(q[0]), Y(q[4]))
    lab.add_animation(IntroType.放大, us(0.25)); lab.add_animation(OutroType.渐隐, us(0.2))
    put(lab, "labimg", a, b, cc.TrackType.video)
    if it.get("sub"):
        sb = cc.TextSegment(it["sub"], tr(a, b), style=cc.TextStyle(size=7.5, bold=True, color=(1, 1, 1), align=1),
                            border=cc.TextBorder(color=(0, 0, 0), width=30.0, alpha=0.9),
                            clip_settings=cc.ClipSettings(transform_x=X(q0[3]), transform_y=Y(q0[5])))
        for q in kf:
            sb.add_keyframe(KP.position_x, us(q[0]), X(q[3])); sb.add_keyframe(KP.position_y, us(q[0]), Y(q[5]))
        sb.add_animation(TextIntro.模糊, us(0.3)); sb.add_animation(TextOutro.渐隐, us(0.2))
        put(sb, "lab", a, b, cc.TrackType.text)

order = {"dim": 0, "ring": 1, "ptr": 2, "text": 3, "chip": 4, "sub": 5}
for it in sorted(m["items"], key=lambda i: (order[i["kind"]], i["t0"])):
    a, b = it["t0"], it["t1"]
    if b - a < 0.05: continue
    kind = it["kind"]
    if kind == "ptr":
        pointer(it); continue
    if kind == "dim":
        seg = cc.VideoSegment(os.path.join(A, it["file"]), tr(a, b))
        seg.add_animation(IntroType.渐显, us(0.4)); seg.add_animation(OutroType.渐隐, us(0.4))
        put(seg, "dim", a, b, cc.TrackType.video); continue
    if kind == "chip":  # 벨기에판 원본 칠 칩(PNG, 원본 해상도)
        seg = cc.VideoSegment(os.path.join(A, it["file"]), tr(a, b)); seg.add_animation(IntroType.放大, us(0.2))
        put(seg, "chip", a, b, cc.TrackType.video); continue
    if kind == "sub":  # 말 자막 → 캡컷 글자, 말하는 어절만 노랑
        words = it["text"].split(); st0 = sum(len(w) + 1 for w in words[:it["hi"]]); hi = (st0, st0 + len(words[it["hi"]]))
        seg = HiText(it["text"], tr(a, b), style=cc.TextStyle(size=12, bold=True, color=(1, 1, 1), align=1),
                     border=cc.TextBorder(color=(0, 0, 0), width=35.0, alpha=1.0),
                     shadow=cc.TextShadow(alpha=0.5, diffuse=20.0, distance=4.0),
                     clip_settings=cc.ClipSettings(transform_y=Y(it["cy"])), hi=hi)
        put(seg, "sub", a, b, cc.TrackType.text); continue
    if kind == "ring":
        sc = 1 / min(1080 / it["w"], 1920 / it["h"]); k0 = it["kf"][0]
        seg = cc.VideoSegment(os.path.join(A, it["file"]), tr(a, b),
                              clip_settings=cc.ClipSettings(scale_x=sc * it["sc"][0][1], scale_y=sc * it["sc"][0][1],
                                                            transform_x=X(k0[1]), transform_y=Y(k0[2])))
        for (t, x, y), (_, r) in zip(it["kf"], it["sc"]):
            if 0 <= t <= b - a:
                seg.add_keyframe(KP.position_x, us(t), X(x)); seg.add_keyframe(KP.position_y, us(t), Y(y))
                seg.add_keyframe(KP.scale_x, us(t), sc * r); seg.add_keyframe(KP.scale_y, us(t), sc * r)  # uniform_scale 키프레임만 쓰면 캡컷에서 원호가 안 보였다(4차 1회)
        seg.add_animation(IntroType.模糊渐显, us(0.3)); seg.add_animation(OutroType.渐隐, us(0.25))
        put(seg, "ring", a, b, cc.TrackType.video); continue
    st = cc.TextStyle(size=it["size"], bold=it.get("bold", False), color=(1, 1, 1), align=1, letter_spacing=it.get("spacing", 0))
    seg = cc.TextSegment(it["text"], tr(a, b), style=st, shadow=cc.TextShadow(alpha=0.45, diffuse=30.0, distance=3.0),
                         clip_settings=cc.ClipSettings(transform_y=Y(it["y"])))
    if not it.get("count") or it.get("first"): seg.add_animation(TextIntro.模糊, us(0.45))
    if not it.get("count") or b >= 18.9: seg.add_animation(TextOutro.渐隐, us(0.3))
    put(seg, "text", a, b, cc.TrackType.text)
# 캡컷 장면 효과(영상 전체에 짧게): 첫 화면 흐림 열림 · 큰 장면 바뀜 번쩍임 · 끝 흐림
s.add_track(cc.TrackType.effect, "fx", relative_index=len(s.tracks) + 1)
def fx(eff, a, b): s.add_effect(eff, tr(a, b), track_name="fx")
fx(cc.VideoSceneEffectType.模糊开幕, 0.0, 0.8)
for t in m.get("fx", []):
    fx(cc.VideoSceneEffectType.闪光灯, t - 0.05, t + 0.25)
E = m["end"]
fx(cc.VideoSceneEffectType.模糊, E - 0.7, E)
s.save()
print(f"saved auto draft '{name}': {len(m['items'])} items in {time.time() - t0:.2f}s")
