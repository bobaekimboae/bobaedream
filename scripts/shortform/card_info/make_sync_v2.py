"""대사 매핑(script json) + 받아쓰기 낱말(words.json) → render_cards_v2 용 sync.json."""
import json, sys
sc, words, out, dur = json.load(open(sys.argv[1])), json.load(open(sys.argv[2])), sys.argv[3], float(sys.argv[4])
S = lambda i: words[i]["s"]
order = list(sc["cards"].items())
cards = {}
for k, (cid, c) in enumerate(order):
    st = 0.0 if k == 0 else max(0.0, S(c["first"]) - 0.35)
    en = (S(order[k + 1][1]["first"]) - 0.35) if k + 1 < len(order) else dur
    rows = [S(i) for i in c["rows"]] or [S(c.get("price", c["first"]))]
    cards[cid] = {"start": st, "end": en, "rows": rows}
    if "price" in c:
        cards[cid]["price_t"] = S(c["price"])
ch = sc["chunks"]
chunks = []
for k, c in enumerate(ch):
    s = S(c[0][1])
    e = S(ch[k + 1][0][1]) if k + 1 < len(ch) else words[c[-1][1]]["e"] + 0.6
    chunks.append({"s": s, "e": e, "words": [[t, S(i), words[i]["e"]] for t, i in c]})
json.dump({"duration": dur, "cards": cards, "chunks": chunks}, open(out, "w"), ensure_ascii=False, indent=1)
print("ok", len(cards), len(chunks))
