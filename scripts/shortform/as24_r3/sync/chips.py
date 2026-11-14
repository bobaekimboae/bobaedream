import json, re
R3 = "/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/sk1113/r3/"
rows = json.load(open("rows.json")); res = {}
def norm(s): return re.sub(r"[^0-9A-Za-z가-힣]", "", s).lower()
for n, r in rows.items():
    sp = json.load(open(f"{R3}spec{n}.json")); off = 0.4 if r["edit"] == "nl" else 0.05
    S = sp["sentences"]; W = r["words"]; out = []
    for ci, c in enumerate(sp["chips"]):
        if ci == 0 or c["text"] == "보배드림":   # 첫 화면 제목·끝 로고는 문장 시작 기준
            k = 0 if ci == 0 else len(S) - 1
            ws = [w for w in W if w["k"] == k]; key = ws[0]
        else:
            k = min(range(len(S)), key=lambda j: abs(S[j]["at"] + off - c["t0"]))
            ws = [w for w in W if w["k"] == k]
            core = [norm(x) for x in c["text"].replace("✓", "").replace("·", " ").split() if norm(x)]
            key = None
            if any(re.search(r"\d", x) for x in core):
                key = next((w for w in ws if re.search(r"\d", w["w"])), None)
            if key is None:
                for w in ws:
                    nw_ = norm(w["w"])
                    if any(len(set(x) & set(nw_)) >= 2 or (x and x[:2] in nw_) for x in core): key = w; break
            if key is None: key = ws[0]
        ideal = round(key["real"] + off, 2)
        out.append({"chip": c["text"], "t0": c["t0"], "key": key["w"], "spoken": key["real"], "ideal": ideal, "diff": round(c["t0"] - ideal, 2)})
    res[n] = out
    for o in out: print(n, o)
json.dump(res, open("chips.json", "w"), ensure_ascii=False, indent=0)
