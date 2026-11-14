"""렌더러(render_auto.py 3단계)와 같은 방식으로 문장 배치를 계산해 넘침(다음 문장 자리 침범)과 1.22배 한계를 찾는다.
사용: python schedule_check.py spec01.json ..."""
import json, sys
def sched(s):
    S, END, out, prev = s["sentences"], s["end"], [], 0.0
    for n, c in enumerate(S):
        a, b = c["a"], c["b"]; st = max(c["at"], prev + 0.06)
        nxt = S[n + 1]["at"] if n + 1 < len(S) else END
        tp = max(1.0, min(1.22, (b - a) / max(0.3, nxt - st - 0.06))); e = st + (b - a) / tp
        out.append((n, round(st, 2), round(e, 2), round(nxt, 2), round(tp, 2), c["text"])); prev = e
    return out
if __name__ == "__main__":
    for f in sys.argv[1:]:
        s = json.load(open(f))
        for n, st, e, nxt, tp, t in sched(s):
            flag = "넘침" if e > nxt + 0.05 else ("밀림" if st > s["sentences"][n]["at"] + 0.05 else "")
            if flag: print(f, n, flag, st, e, "다음", nxt, "×", tp, t)
