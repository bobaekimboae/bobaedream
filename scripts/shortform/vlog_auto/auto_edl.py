"""받아쓰기(stt.json)로 브이로그 편집표(edl.json)를 자동으로 만든다.

원칙
- 원본 목소리·대사가 중심: 말이 있는 구간만 쓰고, 자막은 받아쓰기 글자 그대로(지어내지 않음).
- 이야기 순서 = 촬영 순서(클립 번호 순). 길이별 판은 점수 높은 구간을 고른 뒤 시간순으로 다시 놓는다.
- 짧은 판은 긴 판의 부분집합(1분 ⊂ 1분30초 ⊂ 2분)이라 내용이 엇갈리지 않는다.
- 장소 칩은 사람이 준 힌트(--chips)만 쓴다. 칩 글자를 지어내지 않는다.
"""
import re

END_S = 2.2           # 끝 화면
MAX_UNIT = 9.0        # 한 장면 최대
MIN_UNIT = 1.4
FILLER = {'어', '음', '아', '네', '예', '응', '그', '저', '뭐', '이제'}


def _clean(w):
    return re.sub(r'[^\w가-힣!?~]', '', w)


def chunks(words, max_words=4, max_chars=13):
    out, cur = [], []
    for w in words:
        t = _clean(w)
        if not t: continue
        if cur and (len(cur) >= max_words or sum(len(x) for x in cur) + len(t) > max_chars):
            out.append(' '.join(cur)); cur = []
        cur.append(t)
    if cur: out.append(' '.join(cur))
    return out


def units_from_stt(stt, clips):
    units = []
    for c in sorted(stt):
        segs = [s for s in stt[c] if s.get('w')]
        i = 0
        while i < len(segs):
            g = [segs[i]]
            while i + 1 < len(segs) and segs[i + 1]['s'] - g[-1]['e'] < 0.5 and segs[i + 1]['e'] - g[0]['s'] <= MAX_UNIT:
                i += 1; g.append(segs[i])
            i += 1
            ws = [w for s in g for w in s['w']]
            s0 = max(0.0, ws[0][1] - 0.25)
            e0 = min(clips.get(c, {}).get('dur', ws[-1][2] + 0.4), ws[-1][2] + 0.35)
            dur = e0 - s0
            text = ' '.join(_clean(w[0]) for w in ws if _clean(w[0]))
            core = [x for x in text.split() if x not in FILLER]
            if dur < MIN_UNIT or sum(len(x) for x in core) < 4:
                continue
            if dur > MAX_UNIT + 1.5:   # 너무 긴 말은 앞부분만
                cut = [w for w in ws if w[2] - s0 <= MAX_UNIT]
                ws, e0 = cut, cut[-1][2] + 0.35; dur = e0 - s0
            cps = sum(len(x) for x in core) / dur
            score = min(cps, 6) / 6 + (0.3 if 2.5 <= dur <= 7 else 0) + (0.2 if re.search(r'[!?]', ''.join(s['t'] for s in g)) else 0)
            units.append(dict(clip=c, s=round(s0, 2), e=round(e0, 2), dur=round(dur, 2), cap='|'.join(chunks([w[0] for w in ws])), score=round(score, 3)))
    # 같은 말 되풀이 제거
    seen, uniq = set(), []
    for u in units:
        key = u['cap'].replace('|', '')
        if key in seen: continue
        seen.add(key); uniq.append(u)
    return uniq


def build(stt, clips, chips=None, title='브이로그', title_chip='브이로그', subtitle='', out_prefix='bobae_vlog_auto', versions=(60, 90, 120)):
    chips = chips or {}
    U = units_from_stt(stt, clips)
    if not U:
        raise SystemExit('말이 있는 구간이 없어 편집표를 만들 수 없음')
    order = list(range(len(U)))
    title_i = 0
    picks = {}
    chosen = {title_i}
    for v in sorted(versions):
        budget = v - END_S - sum(U[i]['dur'] for i in chosen)
        for i in sorted(order, key=lambda i: -U[i]['score']):
            if i in chosen: continue
            if U[i]['dur'] <= budget:
                chosen.add(i); budget -= U[i]['dur']
        picks[v] = sorted(chosen)
    items, vers = {}, {}
    grade = {}
    for gi, v in enumerate(sorted(versions), 1):
        for i in picks[v]: grade.setdefault(i, gi)
    for i in sorted(grade):
        u = U[i]
        items[str(i)] = dict(clip=u['clip'], s=u['s'], e=u['e'], cap=u['cap'], grade=grade[i],
                             chip=chips.get(u['clip']), fx='title' if i == title_i else '')
    for v in versions:
        vers[str(v)] = [str(i) for i in picks[v]]
    meta = dict(title_chip=title_chip, title=title, subtitle=subtitle, end_text='다음 브이로그도 기대해 주세요!',
                out_prefix=out_prefix, flip_clips=[], icons={}, auto=True)
    return dict(meta=meta, items=items, versions=vers, points={})
