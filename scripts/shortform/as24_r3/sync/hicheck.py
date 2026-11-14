"""0.05초마다: 화면에서 노랑으로 강조된 어절 ↔ 그 순간 실제로 말하는 낱말(프롬프트 없는 받아쓰기) 비교. 겹침·빈 강조·두 자막 동시 표시도 센다."""
import json, re, sys
B = "/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/sk1113/"
A = json.load(open("asr_r5.json"))
def norm(s): return re.sub(r"[^0-9A-Za-z가-힣]", "", s).lower()
def same(a, b):
    a, b = norm(a), norm(b)
    return bool(a and b) and (a in b or b in a or len(set(a) & set(b)) >= max(1, min(len(a), len(b)) * 0.6))
rd = sys.argv[1]; tot = dict(t=0, ok=0, bad=0, overlap=0, none=0); show = "-v" in sys.argv
for n in A:
    m = json.load(open(f"{B}{rd}/out{n}/manifest.json"))
    subs = [i for i in m["items"] if i["kind"] == "sub"]
    t = 0.0; bad = []
    while t < m["end"]:
        on = [s for s in subs if s["t0"] <= t < s["t1"]]
        sp = [w for w in A[n] if w[1] <= t < w[2]]
        if len(on) > 1: tot["overlap"] += 1; bad.append((round(t, 2), "겹침", [s["text"] for s in on]))
        if sp and norm(sp[0][0]):
            tot["t"] += 1
            if not on: tot["none"] += 1; bad.append((round(t, 2), "자막없음", sp[0][0]))
            else:
                hw = on[-1]["text"].replace("|", " ").split()[on[-1]["hi"]]
                if same(hw, sp[0][0]): tot["ok"] += 1
                else:
                    # 직전·직후 어절이면 '한 칸 어긋남'
                    tot["bad"] += 1; bad.append((round(t, 2), "강조:" + hw, "말:" + sp[0][0]))
        t += 0.05
    if show: print(n, bad[:60])
print(rd, tot, "일치율", round(tot["ok"] / tot["t"] * 100, 1), "%")
