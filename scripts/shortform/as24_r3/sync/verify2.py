"""화면에 실제로 나오는 자막 강조(manifest sub 항목)와 칩을, 그 판의 최종 음성을 따로 받아쓴 낱말 시각과 비교"""
import json, re, sys, statistics as S
sys.argv = ["x"]; exec(open("ana.py").read().split("rows = {}")[0])
B = "/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/sk1113/"
A3 = json.load(open("asr.json")); A4 = json.load(open("asr_r4.json"))
def check(rd, n, tl):
    m = json.load(open(f"{B}{rd}/out{n}/manifest.json"))
    words_all, times_all = [], []
    for k, (a, b, st0, st1, disp, tp) in enumerate(m["clips"]):
        ws = " ".join(disp.replace("/", " ").replace("|", " ").split()).split()
        tw, _, _ = wtimes(ws, st0 - 0.3, st1 + 0.2, tl)
        words_all.append(ws); times_all.append((st0, st1, tw))
    subs = sorted([i for i in m["items"] if i["kind"] == "sub"], key=lambda i: i["t0"])
    errs = []
    for it in subs:
        g = it["text"].replace("|", " ").split(); w = g[it["hi"]]
        k = next(j for j, (s0, s1, _) in enumerate(times_all) if s0 - 0.05 <= it["t0"] <= s1 + 0.3)
        ws = words_all[k]
        for st in range(len(ws) - len(g) + 1):
            if ws[st:st + len(g)] == g and abs(times_all[k][2][st + it["hi"]] - it["t0"]) < 1.5:
                errs.append(round(it["t0"] - times_all[k][2][st + it["hi"]], 3)); break
    return errs
res = {}
for n in ["01", "05", "06", "16", "14", "03", "09", "12", "18", "19"]:
    e3 = check("r3", n, A3[f"{n}_tl"]); e4 = check("r4", n, A4[n])
    f = lambda e: {"n": len(e), "평균절대": round(S.mean(abs(x) for x in e), 3), "중간값": round(S.median(e), 3), "0.2초넘게늦음": sum(x > 0.2 for x in e), "0.3초넘게빠름": sum(x < -0.3 for x in e)}
    res[n] = {"r3": f(e3), "r4": f(e4)}; print(n, "3회차", res[n]["r3"], "\n   4회차", res[n]["r4"])
json.dump(res, open("verify2.json", "w"), ensure_ascii=False, indent=0)
