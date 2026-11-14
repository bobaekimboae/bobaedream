"""캡컷 초안과 같은 내용(manifest)을 ffmpeg로 바로 mp4로 만든다: 컷 이어붙이기 + 자막·칩 PNG(0.2초 페이드) + 목소리·효과음·배경음."""
import json, os, subprocess, sys
n, name = sys.argv[1], sys.argv[2]
A = f"out{n}"; m = json.load(open(f"{A}/manifest.json"))
src = f"/mnt/user-data/uploads/autostudio_analysis/sk1113/src/{n}_shortform.mp4"
END = m["end"]
# 1) 컷 이어붙인 영상
parts = []
for i, (a, b) in enumerate(m["cuts"]):
    parts.append(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS,scale=1080:1920,fps=30[c{i}]")
cat = "".join(f"[c{i}]" for i in range(len(m["cuts"]))) + f"concat=n={len(m['cuts'])}:v=1:a=0,tpad=stop_mode=clone:stop_duration=5,trim=0:{END}[base]"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-filter_complex", ";".join(parts + [cat]), "-map", "[base]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", f"{A}/_base.mp4"], check=True)
# 2) 겹침(PNG) — 시간 순, 칩 아래·자막 위
items = sorted([i for i in m["items"] if i["t1"] - i["t0"] >= 0.05], key=lambda i: (0 if i["kind"] == "chip" else 1, i["t0"]))
inputs, flt, last = ["-i", f"{A}/_base.mp4"], [], "[0:v]"
for k, it in enumerate(items):
    a, b = it["t0"], it["t1"]; d = b - a
    inputs += ["-loop", "1", "-t", f"{b + 0.1:.3f}", "-i", f"{A}/{it['file']}"]
    fd = 0.2 if it["kind"] == "chip" else 0.0
    fl = f"[{k + 1}:v]format=rgba"
    if fd: fl += f",fade=t=in:st={a:.3f}:d={fd}:alpha=1,fade=t=out:st={max(a + fd, b - fd):.3f}:d={fd}:alpha=1"
    flt.append(fl + f"[o{k}]")
    flt.append(f"{last}[o{k}]overlay=0:0:enable='between(t,{a:.3f},{b:.3f})'[v{k}]"); last = f"[v{k}]"
# 3) 소리
ai = len(items) + 1; ain = ["-i", f"{A}/{m['voice']}"]; mix = [f"[{ai}:a]volume=1.0[va]"]; lab = ["[va]"]; j = ai + 1
if m.get("bgm"):
    ain += ["-stream_loop", "-1", "-i", f"{A}/{m['bgm']}"]
    mix.append(f"[{j}:a]volume={m.get('bgm_vol', 0.3) * 0.5:.3f},atrim=0:{END},afade=t=out:st={END - 1.2}:d=1.2[bg]"); lab.append("[bg]"); j += 1
for q in m.get("sfx", []):
    ain += ["-i", f"{A}/{q['file']}"]; ms = int(q["t"] * 1000)
    mix.append(f"[{j}:a]volume={q.get('vol', 0.5)},adelay={ms}|{ms}[s{j}]"); lab.append(f"[s{j}]"); j += 1
mix.append("".join(lab) + f"amix=inputs={len(lab)}:normalize=0,atrim=0:{END}[aout]")
subprocess.run(["ffmpeg", "-v", "error", "-y"] + inputs + ain + ["-filter_complex", ";".join(flt + mix), "-map", last, "-map", "[aout]",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-t", f"{END}", f"final/{name}.mp4"], check=True)
print(name, "ok")
