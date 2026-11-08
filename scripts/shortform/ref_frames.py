"""레퍼런스 쇼츠를 받아 장면표·대표 장면·컷·소리 수치를 만든다 (분석용, 영상 파일은 저장하지 않음).
사용: python ref_frames.py <목록 "코드 유튜브ID"> <출력 폴더>"""
import json, os, subprocess, sys
import numpy as np

lst, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
def sh(*a, **k): return subprocess.run(list(a), capture_output=True, text=True, **k)
done = 0
for line in open(lst):
    p = line.split()
    if len(p) < 2: continue
    code, vid = p[0], p[1]
    d = os.path.join(out, f"{code}_{vid}")
    if os.path.exists(os.path.join(d, "facts.json")): continue
    os.makedirs(d, exist_ok=True)
    mp4 = os.path.join(d, "v.mp4")
    r = sh("yt-dlp", "-q", "--no-warnings", "-f", "bv*[height<=1920][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b",
           "--merge-output-format", "mp4", "-o", mp4, f"https://www.youtube.com/shorts/{vid}")
    if not os.path.exists(mp4):
        json.dump({"id": vid, "error": (r.stderr or "")[-300:]}, open(os.path.join(d, "facts.json"), "w"), ensure_ascii=False)
        print(code, vid, "FAIL", (r.stderr or "")[-160:], flush=True); continue
    info = json.loads(sh("ffprobe", "-v", "error", "-show_entries", "format=duration:stream=width,height,codec_type",
                         "-of", "json", mp4).stdout)
    dur = float(info["format"]["duration"])
    vs = [s for s in info["streams"] if s.get("codec_type") == "video"][0]
    rows = int(np.ceil(dur / 8))
    sh("ffmpeg", "-v", "error", "-y", "-i", mp4, "-vf",
       f"fps=1,scale=160:-2,drawtext=text='%{{pts\\:gmtime\\:0\\:%M\\\\\\:%S}}':x=4:y=4:fontsize=14:fontcolor=yellow:box=1:boxcolor=black@0.7,tile=8x{rows}",
       "-frames:v", "1", os.path.join(d, "sheet.jpg"))
    for i, t in enumerate(np.linspace(1, max(1.5, dur - 1), 6)):
        sh("ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", mp4, "-frames:v", "1", "-vf", "scale=720:-2",
           "-q:v", "4", os.path.join(d, f"f{i}_{t:05.1f}.jpg"))
    cuts = [float(x.split(":")[1]) for x in sh("ffmpeg", "-hide_banner", "-i", mp4, "-vf", "select='gt(scene,0.30)',showinfo",
            "-f", "null", "-").stderr.split() if x.startswith("pts_time:")]
    lufs = None
    for l in sh("ffmpeg", "-hide_banner", "-i", mp4, "-af", "ebur128", "-f", "null", "-").stderr.splitlines():
        if l.strip().startswith("I:"): lufs = l.split()[1]
    onsets, tempo, on_beat = [], None, None
    try:
        import librosa
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", mp4, "-ac", "1", "-ar", "22050", "-f", "f32le", "-"],
                             capture_output=True).stdout
        y = np.frombuffer(raw, np.float32)
        if len(y):
            env = librosa.onset.onset_strength(y=y, sr=22050)
            on = librosa.onset.onset_detect(onset_envelope=env, sr=22050, units="time", delta=0.6)
            onsets = [round(float(t), 2) for t in on]
            tempo, beats = librosa.beat.beat_track(onset_envelope=env, sr=22050, units="time")
            tempo = float(np.atleast_1d(tempo)[0])
            if cuts and len(beats):
                on_beat = round(sum(min(abs(b - c) for b in beats) < 0.12 for c in cuts) / len(cuts), 2)
    except Exception as e:
        print("audio", e, flush=True)
    facts = {"id": vid, "code": code, "duration": round(dur, 2), "w": vs["width"], "h": vs["height"],
             "cuts": [round(c, 2) for c in cuts], "avg_shot": round(dur / (len(cuts) + 1), 2),
             "lufs": lufs, "tempo": tempo, "cuts_on_beat": on_beat, "strong_onsets": onsets}
    json.dump(facts, open(os.path.join(d, "facts.json"), "w"), ensure_ascii=False, indent=1)
    os.remove(mp4)
    done += 1
    print(code, vid, "ok", round(dur, 1), len(cuts), flush=True)
print("done", done)
