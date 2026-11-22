#!/usr/bin/env python3
"""CLAP으로 고른 CC0 효과음을 저장소 효과음 폴더로 내보낸다.

손보는 것(기존 효과음과 같은 규칙): 앞뒤 무음 자름(-50dB), 최대 3초(넘으면 끝 0.15초 페이드),
최고 -1dB, 모노 48kHz 16bit wav. 소리 자체(음색)는 바꾸지 않는다.

사용: python3 export_library.py <후보폴더> <저장소>/public/assets/shortform/sfx/opensource
결과: <kind>_os<N>.wav + manifest.json(출처·작성자·라이선스·CLAP 점수)
"""
import json, os, subprocess, sys


def main():
    src, dst = sys.argv[1], sys.argv[2]
    os.makedirs(dst, exist_ok=True)
    sc = json.load(open(os.path.join(src, "scores.json")))
    rows = [r for r in sc["rows"] if r.get("chosen") and r["verdict"] == "맞음"]
    counter, manifest = {}, []
    for r in sorted(rows, key=lambda r: (r["kind"], -r["z"])):
        n = counter.get(r["kind"], 0) + 1
        counter[r["kind"]] = n
        name = f"{r['kind']}_os{n}.wav"
        af = ("silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.01,"
              "areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05,areverse,"
              "atrim=0:3.0,afade=t=out:st=2.85:d=0.15")
        tmp = os.path.join(dst, "_tmp.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(src, r["file"]), "-af", af,
                        "-ac", "1", "-ar", "48000", tmp], check=True)
        # 최고값을 -1dB로
        vol = subprocess.run(["ffmpeg", "-i", tmp, "-af", "volumedetect", "-f", "null", "-"],
                             capture_output=True, text=True).stderr
        peak = float(vol.split("max_volume:")[1].split("dB")[0])
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", f"volume={-1.0 - peak:.2f}dB",
                        "-c:a", "pcm_s16le", os.path.join(dst, name)], check=True)
        os.remove(tmp)
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
                                    "csv=p=0", os.path.join(dst, name)], capture_output=True, text=True).stdout)
        manifest.append({
            "file": name, "kind": r["kind"], "duration_s": round(dur, 3),
            "title": r.get("title"), "creator": r.get("creator"), "source": r.get("source"),
            "url": r.get("foreign_landing_url"), "license": "CC0 1.0", "license_url": r.get("license_url"),
            "clap": {"model": sc["model"], "desc": r["desc"], "sim": r["sim"], "z": r["z"], "verdict": r["verdict"]},
            "processing": "앞뒤 무음 자름, 최대 3초(끝 0.15초 페이드), 최고 -1dB, 모노 48kHz",
        })
        print(f"{name:24s} {dur:5.2f}s z={r['z']:.2f} {r.get('title','')[:40]}")
    json.dump({"note": "CC0 효과음만. 표기 의무 없음. 기본 효과음(be_locked_rules sfx.kinds)은 바뀌지 않음 — 예비·대체용.",
               "sounds": manifest}, open(os.path.join(dst, "manifest.json"), "w"), ensure_ascii=False, indent=1)
    print(f"{len(manifest)}개 → {dst}")


if __name__ == "__main__":
    main()
