"""어절마다: 프롬프트 없는 받아쓰기가 글자까지 같게 들은 낱말의 '가운데 시각'이 그 어절이 노랑인 구간 안에 있는지."""
import json, re, sys
B = "/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/sk1113/"
A = json.load(open("asr_r5.json"))
def norm(s): return re.sub(r"[^0-9A-Za-z가-힣]", "", s).lower()
rd = sys.argv[1]; ok = bad = 0; rows = []
for n in A:
    m = json.load(open(f"{B}{rd}/out{n}/manifest.json")); cl = m["clips"]
    subs = [i for i in m["items"] if i["kind"] == "sub"]
    for k, (a, b, s0, s1, disp, tp) in enumerate(cl):
        nx = cl[k+1][2] if k+1 < len(cl) else 99
        ref = [w for w in A[n] if s0 - 0.1 <= w[1] < min(nx, s1 + 0.3)]
        for s in [s for s in subs if s0 - 0.25 <= s["t0"] < nx - 0.05]:
            w = norm(s["text"].replace("|", " ").split()[s["hi"]]); hit = [r for r in ref if norm(r[0]) == w]
            if len(hit) != 1: continue
            mid = (hit[0][1] + hit[0][2]) / 2
            if s["t0"] <= mid < s["t1"]: ok += 1
            else: bad += 1; rows.append((n, round(mid, 2), w, s["t0"], s["t1"], disp))
print(rd, "가운데 시각 안에 듦", ok, "벗어남", bad)
if "-v" in sys.argv:
    for r in rows: print(r)
