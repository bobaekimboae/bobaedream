"""나세르(Nasser Hessien) 쇼츠 분석 JSON 모음 → 영상 제작 구조 인사이트(마크다운) + 대사 SRT 묶음.

  python3 scripts/shortform/nasser_insights.py <분석폴더> <출력.md>

분석폴더 = as24_analyze.py 결과(reports/shortform/as24-reviewer-nasser300). 숫자는 모두 분석 JSON에서
센 값이고, 영상마다 sure=false 가 섞여 있으니 경향으로만 읽는다.
"""
import collections, glob, json, os, re, statistics as st, sys

SRC, OUT = sys.argv[1], sys.argv[2]
C = collections.Counter
vids = []
for p in sorted(glob.glob(os.path.join(SRC, "*.json"))):
    try:
        d = json.load(open(p, encoding="utf-8"))
        a = d["analysis"]
        if isinstance(a, list):
            a = a[0]
        a["_id"] = os.path.basename(p)[:-5]
        a["_url"] = d.get("url", "")
        vids.append(a)
    except Exception:
        pass
N = len(vids)
if not N:
    sys.exit("분석 JSON이 없습니다")


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def med(xs):
    xs = [x for x in xs if x is not None]
    return round(st.median(xs), 1) if xs else "-"


def pct(n, base=None):
    return f"{n / (base or N) * 100:.0f}%"


def top(counter, k=10, base=None):
    tot = base or sum(counter.values()) or 1
    return "\n".join(f"| {name} | {n} | {n / tot * 100:.0f}% |" for name, n in counter.most_common(k))


def norm(s):
    return re.sub(r"\s+", " ", str(s or "")).strip()


L = []
w = L.append

# 1. 기본 ─────────────────────────────────────
dur = [num((v.get("basic") or {}).get("duration_sec")) for v in vids]
shots = [v.get("shots") or [] for v in vids]
shot_len = [num(s.get("end")) - num(s.get("start")) for ss in shots for s in ss
            if num(s.get("end")) is not None and num(s.get("start")) is not None and num(s.get("end")) > num(s.get("start"))]
w(f"# {os.environ.get('TITLE', '나세르 쇼츠')} {N}편 — 영상 제작 구조 인사이트\n")
w(f"- 길이 중앙값 {med(dur)}초 (짧은 25% {med(sorted(x for x in dur if x)[:max(1, N // 4)])}초 · 긴 25% {med(sorted(x for x in dur if x)[-max(1, N // 4):])}초)")
w(f"- 컷 수 중앙값 {med([len(s) for s in shots])}개, 컷 길이 중앙값 {med(shot_len)}초")
w(f"- 사람 출연 {pct(sum(1 for v in vids if (v.get('basic') or {}).get('person_on_screen')))}, "
  f"음성 {dict(C((v.get('basic') or {}).get('voice') for v in vids).most_common(3))}\n")

# 2. 구성(구간 순서·비율) ─────────────────────
w("## 1. 구성 — 구간 순서와 시간 비율\n")
stage_share = collections.defaultdict(list)
stage_vids = C()
seqs = C()
for v in vids:
    d = num((v.get("basic") or {}).get("duration_sec")) or 0
    seq = []
    for s in v.get("structure") or []:
        a, b = num(s.get("start")), num(s.get("end"))
        if d and a is not None and b is not None:
            stage_share[s.get("stage")].append((b - a) / d * 100)
        if not seq or seq[-1] != s.get("stage"):
            seq.append(s.get("stage"))
    seqs[" → ".join(str(x) for x in seq)] += 1
    stage_vids.update(set(seq))
w("| 구간 | 나온 영상 | 길이 비율 중앙값 |\n|---|---|---|")
for stg, xs in sorted(stage_share.items(), key=lambda kv: -len(kv[1])):
    w(f"| {stg} | {pct(stage_vids[stg])} | {med(xs)}% |")
w("\n자주 나온 구간 순서 TOP 8\n\n| 순서 | 편수 | 비율 |\n|---|---|---|")
w(top(seqs, 8, N))

# 3. 훅 ───────────────────────────────────────
w("\n## 2. 훅(처음 3초)\n\n| 종류 | 편수 | 비율 |\n|---|---|---|")
w(top(C((v.get("hook") or {}).get("type") for v in vids), 10, N))
w("\n훅 대사 예시(한국어)\n")
for v in vids[:: max(1, N // 15)][:15]:
    h = v.get("hook") or {}
    if h.get("ko"):
        w(f"- 「{norm(h['ko'])}」 ({h.get('type')})")

# 4. 촬영 부위 순서 ───────────────────────────
w("\n## 3. 촬영 부위\n")
first_part, parts = C(), C()
for v in vids:
    order = [norm(x) for x in ((v.get("shooting") or {}).get("part_order") or []) if x]
    if order:
        first_part[order[0]] += 1
    parts.update(set(order))
w("| 첫 부위 | 편수 | 비율 |\n|---|---|---|")
w(top(first_part, 8, N))
w("\n| 부위(영상당 1회로 셈) | 나온 영상 | 비율 |\n|---|---|---|")
w(top(parts, 15, N))
w("\n| 컷 카메라 움직임 | 컷 수 | 비율 |\n|---|---|---|")
w(top(C(s.get("camera") for ss in shots for s in ss), 8))
w("\n| 컷 전환 | 컷 수 | 비율 |\n|---|---|---|")
w(top(C(s.get("transition_in") for ss in shots for s in ss), 8))

# 5. 옵션 보여주기 ─────────────────────────────
w("\n## 4. 옵션·기능 보여 주는 법\n")
oh = [o for v in vids for o in (v.get("option_highlights") or []) if isinstance(o, dict)]
w(f"영상당 옵션 설명 중앙값 {med([len(v.get('option_highlights') or []) for v in vids])}개, 한 옵션 길이 중앙값 "
  f"{med([num(o.get('end')) - num(o.get('start')) for o in oh if num(o.get('end')) is not None and num(o.get('start')) is not None])}초\n")
w("| 방식 | 횟수 | 비율 |\n|---|---|---|")
w(top(C(o.get("shown_how") for o in oh), 10))
w("\n| 많이 설명한 기능 | 횟수 | 비율 |\n|---|---|---|")
w(top(C(norm(o.get("feature")) for o in oh), 20))
w("\n| 함께 난 효과음 | 횟수 | 비율 |\n|---|---|---|")
w(top(C(norm(o.get("sfx_with")) for o in oh), 8))

# 6. 대사 포인트 ───────────────────────────────
w("\n## 5. 말로 설명한 포인트\n\n| 분류 | 횟수 | 비율 |\n|---|---|---|")
w(top(C(p.get("category") for v in vids for p in (v.get("narration_points") or []) if isinstance(p, dict)), 10))
beats = C(b.get("beat") for v in vids for b in (v.get("script_beats") or []) if isinstance(b, dict))
if beats:
    w("\n| 대사 비트 | 횟수 | 비율 |\n|---|---|---|")
    w(top(beats, 12))

# 7. 말투(SRT 음성) ────────────────────────────
ss_ = [v.get("speech_style") for v in vids if isinstance(v.get("speech_style"), dict)]
w("\n## 6. 말투 — 대사 SRT 기준\n")
tr_rows = [(num(r.get("start")), num(r.get("end")), norm(r.get("text")), norm(r.get("ko")))
           for v in vids for r in (v.get("transcript") or []) if isinstance(r, dict)]
seglen = [b - a for a, b, *_ in tr_rows if a is not None and b is not None and b > a]
gaps = []
for v in vids:
    rows = [r for r in (v.get("transcript") or []) if isinstance(r, dict)]
    for x, y in zip(rows, rows[1:]):
        g = (num(y.get("start")) or 0) - (num(x.get("end")) or 0)
        if 0 <= g < 3:
            gaps.append(g)
talk = []
for v in vids:
    d = num((v.get("basic") or {}).get("duration_sec"))
    t = sum(max(0, (num(r.get("end")) or 0) - (num(r.get("start")) or 0)) for r in (v.get("transcript") or []) if isinstance(r, dict))
    if d:
        talk.append(min(100, t / d * 100))
w(f"- 대사 줄 {len(tr_rows)}개, 한 줄 길이 중앙값 {med(seglen)}초, 줄 사이 쉼 중앙값 {med(gaps)}초, 영상에서 말하는 시간 비율 중앙값 {med(talk)}%")
if ss_:
    w(f"- 말 속도: {dict(C(s.get('speed') for s in ss_).most_common())}, 초당 낱말 중앙값 {med([num(s.get('words_per_sec')) for s in ss_])}")
    w(f"- 어조: {dict(C(s.get('tone') for s in ss_).most_common(5))}")
    w(f"- 카메라 보고 말함 {pct(sum(1 for s in ss_ if s.get('speaks_to_camera')), len(ss_))}, 자막과 말 관계 {dict(C(s.get('caption_vs_speech') for s in ss_).most_common())}")
    w("\n자주 쓰는 문장 틀(빈도순)\n")
    for pat, n in C(norm(p) for s in ss_ for p in (s.get("sentence_patterns") or []) if p).most_common(25):
        w(f"- {pat} ({n})")
    w("\n여는 말 · 닫는 말 예시\n")
    for s in ss_[:: max(1, len(ss_) // 10)][:10]:
        o, c = s.get("opening_line") or {}, s.get("closing_line") or {}
        w(f"- 시작 「{norm(o.get('ko'))}」 / 끝 「{norm(c.get('ko'))}」")
    w("\n강조하는 법\n")
    for e, n in C(norm(s.get("emphasis_how")) for s in ss_ if s.get("emphasis_how")).most_common(8):
        w(f"- {e} ({n})")
    w("\n말버릇(원문)\n")
    w(", ".join(f"{f}({n})" for f, n in C(norm(f) for s in ss_ for f in (s.get("filler_words") or []) if f).most_common(20)))

# 8. 자막·그래픽·효과음·음악 ─────────────────────
w("\n## 7. 자막 · 그래픽 · 효과음 · 음악\n")
caps = [c for v in vids for c in (v.get("captions") or []) if isinstance(c, dict)]
w(f"영상당 자막 {med([len(v.get('captions') or []) for v in vids])}개, 그래픽 {med([len(v.get('graphics') or []) for v in vids])}개, 효과음 {med([len(v.get('sfx') or []) for v in vids])}개\n")
w("| 자막 종류 | 개수 | 비율 |\n|---|---|---|")
w(top(C(c.get("kind") for c in caps), 8))
w(f"\n자막 높이 중앙값 {med([num(c.get('text_height_pct')) for c in caps])}% · 세로 위치 중앙값 {med([num(c.get('y_pct')) for c in caps])}%\n")
w("| 자막 바탕 | 개수 | 비율 |\n|---|---|---|")
w(top(C(c.get("background") for c in caps), 6))
w("\n| 효과음 | 개수 | 비율 |\n|---|---|---|")
w(top(C(s.get("type") for v in vids for s in (v.get("sfx") or []) if isinstance(s, dict)), 10))
w("\n| 그래픽 3D 여부 | 개수 |\n|---|---|")
g = [x for v in vids for x in (v.get("graphics") or []) if isinstance(x, dict)]
w(f"| 3D | {sum(1 for x in g if x.get('is_3d'))} |\n| 2D·글자 | {sum(1 for x in g if not x.get('is_3d'))} |")
mus = [v.get("music") or {} for v in vids]
w(f"\n음악: 장르 {dict(C(m.get('genre') for m in mus).most_common(4))}, BPM 중앙값 {med([num(m.get('bpm_est')) for m in mus])}, "
  f"말 밑으로 줄임 {pct(sum(1 for m in mus if m.get('ducks_under_voice')))}, 박자에 컷 {dict(C(m.get('cuts_on_beat') for m in mus).most_common())}")

# 9. 행동 유도 · 규칙 ─────────────────────────
w("\n## 8. 행동 유도(CTA)\n\n| 방법 | 편수 | 비율 |\n|---|---|---|")
w(top(C((v.get("cta") or {}).get("method") for v in vids), 8, N))
w("\n## 9. 분석가가 뽑은 편집 규칙(빈도순 TOP 30)\n")
for r, n in C(norm(r) for v in vids for r in (v.get("rules") or []) if r).most_common(30):
    w(f"- {r} ({n})")

open(OUT, "w", encoding="utf-8").write("\n".join(L) + "\n")

# 대사 SRT 한 파일(한국어) — 문장 틀 학습·대본 생성용
corp = os.path.splitext(OUT)[0] + "-transcript-ko.txt"
with open(corp, "w", encoding="utf-8") as f:
    for v in vids:
        rows = [norm(r.get("ko")) for r in (v.get("transcript") or []) if isinstance(r, dict) and r.get("ko")]
        if rows:
            f.write(f"## {v['_id']} {v['_url']} {(v.get('basic') or {}).get('car', '')}\n" + "\n".join(rows) + "\n\n")
print(f"{N}편 → {OUT}, {corp}")
