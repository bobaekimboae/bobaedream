"""이미 만든 내레이션(일레븐랩스 등)에서 대본 일부 구절을 잘라 짧은 판을 만든다 — 다시 녹음하지 않고 길이만 줄일 때.

사용: python3 trim_voice.py <설정.py> <음성.mp3> <어절시각_flat.json> <출력폴더> "<잘라낼 구절1>" "<구절2>" ...
- 설정.py 의 BLOCKS[*]['tts'] 를 받아쓰기 어절 시각에 글자 단위로 맞춘 뒤(렌더러 align_external 과 같은 방식),
  잘라낼 구절(대본에 그대로 있는 문자열)이 차지하는 소리 구간을 빼고 이어 붙인다.
- 이음매마다 20ms 페이드로 딸깍 소리를 막는다. 남은 어절 시각은 새 파일 기준으로 다시 계산해 flat.json 으로 쓴다.
출력: voice_trim.mp3, words_trim_flat.json, cuts.json(잘라낸 구간)
"""
import difflib
import json
import os
import re
import subprocess
import sys

cfg, mp3, words_json, out = sys.argv[1:5]
cuts_text = sys.argv[5:]
os.makedirs(out, exist_ok=True)
g = {}
exec(open(cfg, encoding="utf-8").read(), g)
BLOCKS = g["BLOCKS"]
norm = lambda t: re.sub(r"[^0-9A-Za-z가-힣]", "", t)

sw = json.load(open(words_json, encoding="utf-8"))
sc, st, sidx = [], [], []
for i, w in enumerate(sw):
    t = norm(w["text"])
    for k, ch in enumerate(t):
        sc.append(ch)
        st.append(w["start"] + (w["end"] - w["start"]) * k / max(1, len(t)))
        sidx.append(i)

script = " ".join(b["tts"] for b in BLOCKS)
bc, pos = [], []  # 대본 글자와 원문 위치
for m in re.finditer(r"[0-9A-Za-z가-힣]", script):
    bc.append(m.group())
    pos.append(m.start())
sm = difflib.SequenceMatcher(None, "".join(bc), "".join(sc), autojunk=False)
mp = [None] * len(bc)
for a0, b0, n in sm.get_matching_blocks():
    for k in range(n):
        mp[a0 + k] = b0 + k  # 받아쓰기 글자 번호

ranges = []
for ct in cuts_text:
    s0 = script.find(ct)
    if s0 < 0:
        sys.exit(f"대본에서 못 찾음: {ct}")
    s1 = s0 + len(ct)
    ci = [i for i, p in enumerate(pos) if s0 <= p < s1 and mp[i] is not None]
    if not ci:
        sys.exit(f"소리에 맞춘 글자가 없음: {ct}")
    w0, w1 = sidx[mp[ci[0]]], sidx[mp[ci[-1]]]
    # 잘라낼 구간: 첫 어절 시작 ~ 다음 어절 시작(쉼 포함). 다음 어절이 없으면 끝까지
    a = sw[w0]["start"]
    b = sw[w1 + 1]["start"] if w1 + 1 < len(sw) else None
    ranges.append((a, b, w0, w1, ct))
ranges.sort()

dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3],
                           capture_output=True, text=True).stdout)
keep, t = [], 0.0
for a, b, *_ in ranges:
    if a > t:
        keep.append((t, a))
    t = b if b is not None else dur
if t < dur:
    keep.append((t, dur))

# 이어 붙이기(각 조각 앞뒤 20ms 페이드)
parts, filt = [], []
for i, (a, b) in enumerate(keep):
    d = b - a
    filt.append(f"[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={max(0, d - 0.02):.3f}:d=0.02[p{i}]")
    parts.append(f"[p{i}]")
fc = ";".join(filt) + ";" + "".join(parts) + f"concat=n={len(keep)}:v=0:a=1[o]"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-filter_complex", fc, "-map", "[o]", "-b:a", "192k",
                os.path.join(out, "voice_trim.mp3")], check=True)

dropped = set()
for a, b, w0, w1, _ in ranges:
    dropped.update(range(w0, w1 + 1))


def remap(x):
    acc = 0.0
    for a, b in keep:
        if x < a:
            return acc
        if x <= b:
            return acc + (x - a)
        acc += b - a
    return acc


nw = [{"text": w["text"], "start": round(remap(w["start"]), 3), "end": round(remap(w["end"]), 3)}
      for i, w in enumerate(sw) if i not in dropped]
json.dump(nw, open(os.path.join(out, "words_trim_flat.json"), "w", encoding="utf-8"), ensure_ascii=False)
json.dump([{"from": a, "to": b, "text": c} for a, b, _, _, c in ranges], open(os.path.join(out, "cuts.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
new = sum(b - a for a, b in keep)
print(json.dumps({"before": round(dur, 2), "after": round(new, 2), "cuts": len(ranges)}, ensure_ascii=False))
