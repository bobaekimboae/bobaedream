"""대본 어절에 받아쓰기 시각을 글자 비율로 맞춤(어절 수가 달라도 대본 글자 그대로)."""
import sys, json, re
words, script, out = sys.argv[1], sys.argv[2], sys.argv[3]
W = json.load(open(words)); S = script.split()
clean = lambda s: re.sub(r'[^\w]', '', s)
ct = []   # 받아쓰기 글자마다 (시작, 끝)
for w, s, e in W:
    c = clean(w) or '_'; n = len(c)
    for i in range(n): ct.append((s + (e - s) * i / n, s + (e - s) * (i + 1) / n))
tot = sum(len(clean(x)) for x in S); k = 0; res = []
for x in S:
    n = max(1, len(clean(x))); a = int(round(k * len(ct) / tot)); b = max(a + 1, int(round((k + n) * len(ct) / tot)))
    res.append([x, round(ct[min(a, len(ct) - 1)][0], 3), round(ct[min(b, len(ct)) - 1][1], 3)]); k += n
json.dump(res, open(out, 'w'), ensure_ascii=False); print(len(res), res[:3])
