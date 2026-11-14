"""대사 낱말 시각(받아쓰기) ↔ 자막 강조 시각·칩 등장 시각 비교. 결과: rows.json"""
import json, re, difflib, sys
R3 = "/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/sk1113/r3/"
A = json.load(open("asr.json"))
def norm(s): return re.sub(r"[^0-9A-Za-z가-힣]", "", s).lower()
def wtimes(words, a, b, src):
    """표시 어절마다 음성 파일 기준 시작 시각. 받아쓰기 글자와 맞춰 보고, 못 맞춘 어절은 앞뒤 사이를 글자 수로 채움"""
    seg = [w for w in src if a - 0.15 <= w[1] <= b + 0.05]
    sc, st = [], []
    for w in seg:
        for ch in norm(w[0]): sc.append(ch); st.append(w[1])
    dc, own = [], []
    for i, w in enumerate(words):
        for ch in norm(w): dc.append(ch); own.append(i)
    t = [None] * len(words)
    sm = difflib.SequenceMatcher(None, dc, sc, autojunk=False)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            i = own[blk.a + k]
            if t[i] is None: t[i] = st[blk.b + k]
    # 앞 글자가 맞은 경우만 믿는다: 어절 첫 글자 위치가 맞지 않으면 보간
    first = {}
    for k, i in enumerate(own): first.setdefault(i, k)
    for blk in sm.get_matching_blocks():
        pass
    s0 = seg[0][1] if seg else a; s1 = seg[-1][2] if seg else b
    tot = sum(len(norm(w)) or 1 for w in words)
    acc = 0; prop = []
    for w in words: prop.append(s0 + (s1 - s0) * acc / tot); acc += len(norm(w)) or 1
    # 단조 증가 강제, 빈칸은 보간
    known = [i for i in range(len(words)) if t[i] is not None]
    for i in range(len(words)):
        if t[i] is None:
            lo = max([j for j in known if j < i], default=None); hi = min([j for j in known if j > i], default=None)
            if lo is not None and hi is not None: t[i] = t[lo] + (t[hi] - t[lo]) * (prop[i] - prop[lo]) / max(1e-6, prop[hi] - prop[lo])
            elif lo is not None: t[i] = max(t[lo], prop[i])
            elif hi is not None: t[i] = min(t[hi], prop[i])
            else: t[i] = prop[i]
    for i in range(1, len(t)): t[i] = max(t[i], t[i - 1] + 0.04)
    return [round(x, 3) for x in t], len(known), len(words)
rows = {}
for n in sys.argv[1:]:
    sp = json.load(open(f"{R3}spec{n}.json")); m = json.load(open(f"{R3}out{n}/manifest.json"))
    src = A[f"{n}_src"]; out = []
    for k, (a, b, st0, st1, disp, tp) in enumerate(m["clips"]):
        d = " ".join(disp.replace("/", " ").replace("|", " ").split()); words = d.split()
        tw, hit, nw = wtimes(words, a, b, src)
        tot = sum(len(w) for w in words); acc = 0
        for i, w in enumerate(words):
            cur = st0 + (st1 - 0.1 - st0) * acc / tot; acc += len(w)
            real = st0 + max(0.0, tw[i] - a) / tp
            out.append({"k": k, "i": i, "w": w, "cur": round(cur, 3), "real": round(real, 3), "src": tw[i], "hit": hit, "nw": nw})
    rows[n] = {"edit": sp["edit"], "words": out}
json.dump(rows, open("rows.json", "w"), ensure_ascii=False, indent=0)
for n, r in rows.items():
    e = [abs(x["cur"] - x["real"]) for x in r["words"]]
    print(n, r["edit"], "어절", len(e), "평균 어긋남 %.2f초 최대 %.2f초 0.2초넘음 %d" % (sum(e) / len(e), max(e), sum(x > 0.2 for x in e)))
