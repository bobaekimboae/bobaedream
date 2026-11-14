"""자막 강조 시각을, 프롬프트 없는 받아쓰기가 글자까지 똑같이 알아들은 낱말에만 대어 본다(추정·보간 없는 비교)."""
import json, re, sys, statistics as S
B = "/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/sk1113/"
A = json.load(open("asr_r5.json"))
def norm(s): return re.sub(r"[^0-9A-Za-z가-힣]", "", s).lower()
def run(rd):
    allv = []; firsts = []
    for n in A:
        m = json.load(open(f"{B}{rd}/out{n}/manifest.json"))
        subs = sorted([i for i in m["items"] if i["kind"] == "sub"], key=lambda i: i["t0"])
        cl = m["clips"]
        for k, (a, b, s0, s1, disp, tp) in enumerate(cl):
            nx = cl[k+1][2] if k+1 < len(cl) else 99
            ins = [s for s in subs if s0 - 0.25 <= s["t0"] < nx - 0.05]
            ref = [w for w in A[n] if s0 - 0.1 <= w[1] < min(nx, s1 + 0.3)]
            for s in ins:
                w = norm(s["text"].replace("|", " ").split()[s["hi"]])
                hit = [r for r in ref if norm(r[0]) == w]
                if len(hit) == 1: allv.append(s["t0"] + 0.1 - hit[0][1])
            if ins: firsts.append(ins[0]["t0"] + 0.1 - s0)
    f = lambda e: dict(n=len(e), 평균절대=round(S.mean(abs(x) for x in e), 3), 중간값=round(S.median(e), 3), 늦음02=sum(x > 0.2 for x in e), 빠름03=sum(x < -0.3 for x in e))
    print(rd, "글자일치 낱말", f(allv), "| 문장 첫 어절-소리시작", f(firsts))
run("r5"); run("r6")
