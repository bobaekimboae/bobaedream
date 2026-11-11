"""AS24 원본(분석 전용)을 기준 레이어로 깐 캡컷 견본 작업용 프로젝트를 만든다. pycapcut==0.0.4
- 맨 위 트랙: AS24 원본, 투명도 50% (눈금 맞추기용 — 내보내기 전에 지운다)
- 아래: 우리 그랜저 영상 + 내레이션
기준 영상: NL XUF4hHbka9A (VW Polo R-Line, 35초, 차 소개/가격 공개, 효과음 10)
           BE p9WZ94a5Iv8 (BMW X7, 30초, 차 소개, 효과음 8)
"""
import os
import pycapcut as cc
from pycapcut import trange

root = os.path.expandvars(r"%LOCALAPPDATA%\CapCut\User Data\Projects\com.lveditor.draft")
base = r"C:\Users\Thinkbook\Documents\autostudio_analysis\capcut_nasser"
refs = {
    "AS24_NL_sample": r"G:\내 드라이브\SNS레퍼런스_원본영상\오토_네덜란드\XUF4hHbka9A.mp4",
    "AS24_BE_sample": r"G:\내 드라이브\SNS레퍼런스_원본영상\오토_벨기에\p9WZ94a5Iv8.mp4",
}
for name, ref in refs.items():
    s = cc.DraftFolder(root).create_draft(name, 1080, 1920, 30, allow_replace=True)
    mm = cc.VideoMaterial(os.path.join(base, "src_09_grandeur.mp4"))
    s.add_track(cc.TrackType.video, "main")
    s.add_segment(cc.VideoSegment(mm, trange(0, mm.duration), volume=0.0), "main")
    rm = cc.VideoMaterial(ref)
    s.add_track(cc.TrackType.video, "REF_AS24_delete_before_export", relative_index=9)
    s.add_segment(cc.VideoSegment(rm, trange(0, rm.duration), volume=1.0,
                                  clip_settings=cc.ClipSettings(alpha=0.5)), "REF_AS24_delete_before_export")
    am = cc.AudioMaterial(os.path.join(base, "bobae_grandeur_narration_v1.wav"))
    s.add_track(cc.TrackType.audio, "voice")
    s.add_segment(cc.AudioSegment(am, trange(0, am.duration)), "voice")
    s.save()
    print("saved", name, round(rm.duration / 1e6, 1), "s ref")
