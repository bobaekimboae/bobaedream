"""4회차 사양서: 3회차 사양서에 (1) 문장별 어절 시작 시각 w(받아쓰기) (2) 칩 등장 시각을 그 낱말을 실제로 말하는 순간 + 규칙 값으로 옮김
(3) 칩에 붙은 효과음도 같이 옮김 (4) 자막 강조 선행 cap_lead 를 넣는다."""
import json, re
R3 = "/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/sk1113/r3/"
R4 = "/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/sk1113/r4/"
rows = json.load(open("rows.json")); report = {}
def norm(s): return re.sub(r"[^0-9A-Za-z가-힣]", "", s).lower()
def has_d(s): return bool(re.search(r"\d", s))
def keyword(c, ws):
    t = c["text"].replace("✓", "")
    if "km" in t and "·" not in t:                     # 주행거리: '킬로' 앞 숫자 구절의 첫 어절
        j = next((i for i, w in enumerate(ws) if "킬로" in w["w"]), None)
        if j is not None:
            while j > 0 and has_d(ws[j - 1]["w"]) and not re.search(r"년|월", ws[j - 1]["w"]): j -= 1
            return ws[j]
    if "kWh" in t: return next((w for w in ws if "킬로와트" in w["w"]), None)
    if "만 원" in t or "억" in t: return next((w for w in ws if has_d(w["w"])), None)
    core = [norm(x) for x in t.replace("·", " ").split() if norm(x)]
    if any(has_d(x) for x in core): return next((w for w in ws if has_d(w["w"])), None)
    for w in ws:
        nw_ = norm(w["w"])
        if any(x and (x[:2] in nw_ or nw_[:2] in x) for x in core if len(x) >= 2): return w
    return None
for n, r in rows.items():
    sp = json.load(open(f"{R3}spec{n}.json")); be = sp["edit"] == "be"; off = 0.05 if be else 0.4
    W = r["words"]; S = sp["sentences"]
    for k, s in enumerate(S): s["w"] = [x["src"] for x in W if x["k"] == k]
    sp["cap_lead"] = 0.1
    log = []
    for ci, c in enumerate(sp["chips"]):
        if ci == 0: k = 0
        elif c["text"] == "보배드림": k = len(S) - 1
        else: k = min(range(len(S)), key=lambda j: abs(S[j]["at"] + off - c["t0"]))
        ws = [w for w in W if w["k"] == k]
        key = ws[0] if ci == 0 or c["text"] == "보배드림" else (keyword(c, ws) or ws[0])
        new = round(key["real"] + off, 2); old = c["t0"]; d = c["t1"] - c["t0"]
        for q in sp.get("sfx", []):
            if abs(q["t"] - old) < 0.02: q["t"] = new
        c["t0"], c["t1"] = new, round(min(sp["end"], new + d), 2)
        log.append({"chip": c["text"], "key": key["w"], "old": old, "new": new, "diff": round(old - new, 2)})
    report[n] = log
    json.dump(sp, open(f"{R4}spec{n}.json", "w"), ensure_ascii=False, indent=1)
json.dump(report, open("chipfix.json", "w"), ensure_ascii=False, indent=0)
for n, l in report.items(): print(n, [(x["chip"], x["key"], x["diff"]) for x in l if abs(x["diff"]) >= 0.1])
