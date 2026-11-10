"""나세르 한국어 SRT(HeyGen 더빙 대본) 모음 → 대사·말투 구조 통계(마크다운).

  python3 -I scripts/shortform/nasser_srt_insights.py <segs.json> <rows.json> <출력.md>

segs.json = {유튜브ID: [[시작초, 끝초, 문장], ...]} (시트 「나사르헤시엔_유튜브」 한국어 SRT 열)
rows.json = 시트 행(id·제목·등록일·조회수·제조사·모델)
숫자는 한국어 더빙 대본 기준이다. 원래 아랍어 말보다 길이·속도가 조금 다를 수 있다.
"""
import collections, json, re, statistics as st, sys

V = json.load(open(sys.argv[1], encoding="utf-8"))
R = {r["id"]: r for r in json.load(open(sys.argv[2], encoding="utf-8"))}
OUT = sys.argv[3]
C = collections.Counter
L = []
w = L.append


def med(xs):
    xs = [x for x in xs if x is not None]
    return round(st.median(xs), 1) if xs else "-"


def views(s):
    s = str(s or "").replace(",", "").strip()
    m = re.match(r"([\d.]+)\s*(만|천)?", s)
    if not m:
        return None
    n = float(m.group(1))
    return n * 10000 if m.group(2) == "만" else n * 1000 if m.group(2) == "천" else n


N = len(V)
dur = {k: s[-1][1] for k, s in V.items()}
segs = [x for s in V.values() for x in s]
seglen = [b - a for a, b, _ in segs if b > a]
gaps = [y[0] - x[1] for s in V.values() for x, y in zip(s, s[1:]) if 0 <= y[0] - x[1] < 3]
talk = [sum(b - a for a, b, _ in s) / dur[k] * 100 for k, s in V.items() if dur[k]]
cps = [len(t.replace(" ", "")) / (b - a) for a, b, t in segs if b - a > 0.8]

w(f"# 나세르 한국어 SRT {N}편 — 대사·말투 구조\n")
w("- 출처: 시트 「SNS 숏폼 레퍼런스 › 나사르헤시엔_유튜브」의 한국어 SRT 링크(HeyGen 한국어 더빙 대본) 전부. 한국어로 옮긴 말이라 원래 아랍어보다 조금 길거나 짧을 수 있다.")
w(f"- 대사 줄 {len(segs)}개 · 영상 길이(마지막 대사 끝) 중앙값 {med(list(dur.values()))}초 · 영상당 줄 {med([len(s) for s in V.values()])}개")
w(f"- 한 줄 길이 중앙값 {med(seglen)}초 · 줄 사이 쉼 중앙값 {med(gaps)}초(쉼 0.3초 이하 {sum(1 for g in gaps if g <= .3) / max(1, len(gaps)) * 100:.0f}%) · 말하는 시간 비율 {med(talk)}%")
w(f"- 말 속도(공백 뺀 글자/초) 중앙값 {med(cps)} · 빠른 25% {med(sorted(cps)[-len(cps) // 4:])} · 느린 25% {med(sorted(cps)[:len(cps) // 4])}\n")

# 길이 분포
w("## 1. 길이 분포\n\n| 길이 | 편수 | 비율 |\n|---|---|---|")
bins = [(0, 30, "30초 미만"), (30, 45, "30~45초"), (45, 60, "45~60초"), (60, 75, "60~75초"), (75, 90, "75~90초"), (90, 999, "90초 이상")]
for a, b, n in bins:
    k = sum(1 for d in dur.values() if a <= d < b)
    w(f"| {n} | {k} | {k / N * 100:.0f}% |")

# 첫 줄(훅)
w("\n## 2. 첫 줄(훅) 유형\n")
first = {k: s[0][2] for k, s in V.items()}
first2 = {k: " ".join(x[2] for x in s[:2]) for k, s in V.items()}
HOOK = [
    ("자기 이름(나세르입니다)", r"나세르|나사르|나수르"),
    ("조건 질문(~원하신다면·~찾으신다면)", r"(원하|찾|있다|좋아하|사랑하|필요하|고민|싶)[^.?!]{0,6}(다면|면)"),
    ("가격·돈", r"파운드|가격|만\s*원|EGP|할인|무이자|가성비|저렴"),
    ("숫자·성능", r"\d+\s*(마력|km|초|인치|가지|대|년|%)"),
    ("최상급(가장·최고·유일)", r"가장|최고|유일|처음|최초|괴물|역대"),
    ("물음표", r"\?"),
]
hc = C()
for k, t in first2.items():
    for n, p in HOOK:
        if re.search(p, t):
            hc[n] += 1
w("| 첫 두 줄에 들어간 요소(겹침 허용) | 편수 | 비율 |\n|---|---|---|")
for n, _ in HOOK:
    w(f"| {n} | {hc[n]} | {hc[n] / N * 100:.0f}% |")
name_then = C()
for k, s in V.items():
    if re.search(r"나세르|나사르", s[0][2]):
        rest = re.sub(r".*?(나세르|나사르)(입니다|이고|고|예요)?[.,!]?\s*", "", s[0][2], count=1).strip()
        name_then["이름 뒤 같은 줄에 바로 본론" if rest else "이름만 말하고 다음 줄에 본론"] += 1
w("\n" + ", ".join(f"{a} {b}편" for a, b in name_then.most_common()))
w("\n첫 줄 예시(조회수 높은 순 15편)\n")
ranked = sorted(V, key=lambda k: -(views(R.get(k, {}).get("views")) or 0))
for k in ranked[:15]:
    w(f"- 「{first[k]}」 — {R.get(k, {}).get('views', '')} · {R.get(k, {}).get('title_ko', '')[:30]}")

# 위치별 내용
w("\n## 3. 영상 안 위치별로 나오는 말\n")
TOP = [
    ("가격", r"파운드|가격|EGP|만\s*원|할인|무이자|할부|분할"),
    ("보증", r"보증"),
    ("마력·토크·성능", r"마력|토크|Nm|제로백|\d+초 만에|가속"),
    ("주행거리(전기·연비)", r"주행거리|km를|연비|충전"),
    ("안전(에어백·보조)", r"에어백|주행 ?보조|ADAS|안전|사각지대|차선"),
    ("실내 편의(시트·화면)", r"시트|열선|통풍|마사지|화면|스크린|디스플레이|카플레이|무선 ?충전|냉장"),
    ("외관·휠·라이트", r"휠|라이트|램프|그릴|디자인|도어 ?핸들|스포일러"),
    ("공간·트렁크·뒷좌석", r"트렁크|뒷좌석|2열|공간|적재|넓"),
    ("매장·딜러·연락", r"매장|쇼룸|지점|딜러|문의|핫라인|전화|주소|만나보|방문"),
]
w("| 내용 | 나온 영상 | 처음 나오는 위치(영상 길이 대비) 중앙값 |\n|---|---|---|")
for n, p in TOP:
    pos = []
    for k, s in V.items():
        for a, b, t in s:
            if re.search(p, t):
                pos.append(a / dur[k] * 100 if dur[k] else None)
                break
    w(f"| {n} | {len(pos) / N * 100:.0f}% | {med(pos)}% |")

# 마지막 줄
w("\n## 4. 마지막 줄(닫는 말)\n")
END = [("매장·딜러 위치·연락", r"매장|쇼룸|지점|딜러|문의|핫라인|전화|주소|만나보|방문|에서 구매|계정"),
       ("가격·조건 마무리", r"파운드|가격|할인|무이자|보증"),
       ("감탄·한마디", r"!$"), ("질문", r"\?$"), ("구독·팔로우·댓글", r"구독|팔로우|댓글|좋아요")]
ec = C()
for k, s in V.items():
    t = s[-1][2]
    for n, p in END:
        if re.search(p, t):
            ec[n] += 1
            break
    else:
        ec["기타"] += 1
w("| 닫는 말 | 편수 | 비율 |\n|---|---|---|")
for n, c in ec.most_common():
    w(f"| {n} | {c} | {c / N * 100:.0f}% |")
w("\n예시\n")
for k in ranked[:8]:
    w(f"- 「{V[k][-1][2]}」")

# 말투
w("\n## 5. 말투\n")
sent = [x for t in (s[2] for s in segs) for x in re.split(r"(?<=[.!?])\s+", t) if x.strip()]
ends = C()
for x in sent:
    x2 = re.sub(r"[.!?…~\"'”’)]+$", "", x.strip())
    m = re.search(r"(습니다|입니다|합니다|됩니다|니다|죠|요|다|까|네요|세요|해요|예요|어요|아요)$", x2)
    ends[m.group(1) if m else "기타(명사·끊김)"] += 1
tot = sum(ends.values())
w("| 문장 끝 | 개수 | 비율 |\n|---|---|---|")
for e, c in ends.most_common(10):
    w(f"| ~{e} | {c} | {c / tot * 100:.0f}% |")
num = sum(1 for _, _, t in segs if re.search(r"\d", t))
q = sum(1 for _, _, t in segs if "?" in t)
ex = sum(1 for _, _, t in segs if "!" in t)
w(f"\n- 숫자가 든 줄 {num / len(segs) * 100:.0f}% · 물음표 줄 {q / len(segs) * 100:.0f}% · 느낌표 줄 {ex / len(segs) * 100:.0f}%")
lists = sum(1 for _, _, t in segs if t.count(",") >= 2)
w(f"- 쉼표 2개 이상(기능 나열) 줄 {lists / len(segs) * 100:.0f}%")

# 자주 쓰는 말 덩어리
w("\n## 6. 자주 쓰는 말 덩어리(3어절, 20편 이상)\n")
grams = C()
for s in V.values():
    seen = set()
    for _, _, t in s:
        ws = re.sub(r"[^\w가-힣 ]", " ", t).split()
        for i in range(len(ws) - 2):
            g = " ".join(ws[i:i + 3])
            if not re.search(r"\d", g):
                seen.add(g)
    grams.update(seen)
for g, c in grams.most_common(60):
    if c >= 20:
        w(f"- {g} ({c}편)")

# 접속·전환 표현
w("\n## 7. 구간을 넘기는 말(전환어)\n")
TR = ["그리고", "또한", "게다가", "하지만", "근데", "그런데", "무엇보다", "특히", "뿐만 아니라", "이제", "그럼", "자,", "마지막으로", "솔직히", "참고로", "그래서", "여기에"]
tc = C()
for s in V.values():
    seen = set()
    for _, _, t in s:
        for x in TR:
            if t.startswith(x) or f" {x}" in t[:12]:
                seen.add(x)
    tc.update(seen)
w("| 전환어 | 쓴 영상 | 비율 |\n|---|---|---|")
for x, c in tc.most_common():
    w(f"| {x} | {c} | {c / N * 100:.0f}% |")

# 조회수
w("\n## 8. 조회수 상위 25% vs 하위 25%\n")
vv = [(k, views(R.get(k, {}).get("views"))) for k in V if views(R.get(k, {}).get("views"))]
vv.sort(key=lambda x: -x[1])
q4 = max(1, len(vv) // 4)
top, bot = [k for k, _ in vv[:q4]], [k for k, _ in vv[-q4:]]


def prof(ks):
    return {
        "길이": med([dur[k] for k in ks]),
        "줄 수": med([len(V[k]) for k in ks]),
        "글자/초": med([len("".join(t for _, _, t in V[k]).replace(" ", "")) / max(1, dur[k]) for k in ks]),
        "이름 훅": f"{sum(1 for k in ks if re.search(r'나세르|나사르', V[k][0][2])) / len(ks) * 100:.0f}%",
        "조건 질문 훅": f"{sum(1 for k in ks if re.search(HOOK[1][1], first2[k])) / len(ks) * 100:.0f}%",
        "가격 언급": f"{sum(1 for k in ks if any(re.search(TOP[0][1], t) for _, _, t in V[k])) / len(ks) * 100:.0f}%",
        "숫자 줄 비율": f"{med([sum(1 for _, _, t in V[k] if re.search(chr(92) + 'd', t)) / len(V[k]) * 100 for k in ks])}%",
    }


pt, pb = prof(top), prof(bot)
w(f"(조회수 있는 {len(vv)}편 · 상위 {q4}편 조회수 {vv[q4 - 1][1]:,.0f} 이상 · 하위 {q4}편 {vv[-q4][1]:,.0f} 이하)\n")
w("| 항목 | 상위 25% | 하위 25% |\n|---|---|---|")
for k in pt:
    w(f"| {k} | {pt[k]} | {pb[k]} |")

open(OUT, "w", encoding="utf-8").write("\n".join(L) + "\n")
print(N, "→", OUT)
