"""대사를 바꾼 문장의 칩·효과음 시각을 렌더러가 실제로 문장을 놓는 시각(밀림·빠르기 반영)에 맞춘다.
칩 시각 = 실제 문장 시작 + (키워드 시각 − 문장 시작)/빠르기 + 0.4초(NL) / 0.05초(BE). 사용: python chips_sched.py <r5 폴더>"""
import json, os, sys, importlib.util
from schedule_check import sched
D = sys.argv[1]; H = os.path.dirname(os.path.abspath(__file__))
def L(name):
    src = open(os.path.join(H, name)).read(); ns = {}
    exec(src[src.index("NEW = ["):src.index("]\n", src.index("NEW = [")) + 2], ns); return ns["NEW"]
keys = {}
for row in L("dialog_r5.py") + L("dialog_r5b.py") + L("dialog_r5c.py"): keys[(row[0], row[1])] = row  # 나중 차수가 앞 차수를 덮음
for (n, k), (_, _, text, chip, kw) in sorted(keys.items()):
    if not chip: continue
    p = os.path.join(D, f"spec{n}.json"); s = json.load(open(p)); c = s["sentences"][k]
    _, st, _, _, tp, _ = sched(s)[k]; words = text.split()
    kt = next((c["w"][i] for i, w in enumerate(words) if kw in w), c["w"][0])
    t0 = round(st + (kt - c["a"]) / tp + (0.4 if s["edit"] == "nl" else 0.05), 2)
    for ch in s["chips"]:
        if ch["text"] == chip:
            old = ch["t0"]; d = ch["t1"] - ch["t0"]; ch["t0"] = t0; ch["t1"] = round(t0 + d, 2)
            for x in s["sfx"]:
                if abs(x["t"] - old) < 0.01: x["t"] = t0
            print(n, k, chip, old, "→", t0)
    json.dump(s, open(p, "w"), ensure_ascii=False, indent=1)
