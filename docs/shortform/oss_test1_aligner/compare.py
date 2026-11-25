"""1번 시험 — 도구 결과를 대본 낱말에 맞추고 서로 비교한다 (2026-11-25, 시안 마스터)

  python3 compare.py            → results/compare.json · results/compare.md · results/listen_list.csv

- 도구마다 낸 글자 단위가 다르다(B는 받아쓴 낱말, D는 형태소 조각). 그래서 모두 '읽는 소리 글자'로 바꾼 뒤
  글자 줄끼리 맞춰(difflib), 대본 낱말마다 시작 = 첫 글자 시각, 끝 = 마지막 글자 시각을 얻는다.
- 대본 낱말의 첫 글자가 맞춰지지 않으면 그 낱말은 '못 맞춤'(1:1 맞춤 실패)으로 센다.
- label_sheet.csv 에 사람 정답이 적혀 있으면 정답과의 오차도 낸다. 비어 있으면 도구끼리의 차이만 낸다.
- listen_list.csv = 도구끼리 시작이 0.10초 넘게 갈리는 낱말(사람이 들어서 정할 목록).
"""
import csv
import difflib
import json
import os
import re
import statistics
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(HERE, '..', '..', '..', 'scripts', 'shortform')))
from align_ko import reading  # noqa: E402

TOOLS = [t for t in ('A', 'B', 'C', 'D') if os.path.exists(os.path.join(HERE, 'results', f'{t}.json'))]
NAMES = {'A': 'ElevenLabs Scribe', 'B': 'faster-whisper turbo', 'C': 'CTC(align_ko)', 'D': 'Qwen3-ForcedAligner',
         'H': '사람 정답'}


def norm(s):
    return re.sub(r'[^가-힣a-z]', '', reading(s).lower())


def char_times(tokens):
    chars, times = [], []
    for t, s, e in tokens:
        n = norm(t)
        for i, c in enumerate(n):
            chars.append(c)
            times.append((s + (e - s) * i / len(n), s + (e - s) * (i + 1) / len(n)))
    return ''.join(chars), times


def map_words(words, tokens):
    wn = [norm(w) for w in words]
    script = ''.join(wn)
    tc, tt = char_times(tokens)
    sm = difflib.SequenceMatcher(None, script, tc, autojunk=False)
    m = {}
    for a, b, size in sm.get_matching_blocks():
        for k in range(size):
            m[a + k] = b + k
    out, pos = [], 0
    for w in wn:
        idx = list(range(pos, pos + len(w)))
        pos += len(w)
        hit = [m[i] for i in idx if i in m]
        if not w or idx[0] not in m:
            out.append(None)
        else:
            out.append((round(tt[m[idx[0]]][0], 3), round(tt[hit[-1]][1], 3)))
    return out


def stats(diffs):
    if not diffs:
        return {}
    d = sorted(diffs)
    return {'n': len(d), 'median': round(statistics.median(d), 3), 'p90': round(d[int(0.9 * (len(d) - 1))], 3),
            'max': round(d[-1], 3), 'in_0.10': round(sum(x <= 0.10 for x in d) / len(d), 3),
            'in_0.08': round(sum(x <= 0.08 for x in d) / len(d), 3)}


def main():
    rows = json.load(open(os.path.join(HERE, 'sentences20.json')))
    res = {t: json.load(open(os.path.join(HERE, 'results', f'{t}.json'))) for t in TOOLS}
    human = {}
    with open(os.path.join(HERE, 'label_sheet.csv'), encoding='utf-8-sig') as f:
        for r in csv.DictReader(f):
            if r['human_start_s'].strip():
                human[(r['sentence_id'], int(r['word_no']))] = (float(r['human_start_s']), float(r['human_end_s'] or 0))
    per = {}  # (클립, 낱말번호) → {도구: (시작, 끝) 또는 None}
    for r in rows:
        mapped = {t: map_words(r['words'], res[t][r['id']]['tokens']) for t in TOOLS}
        for i, w in enumerate(r['words'], 1):
            per[(r['id'], i)] = {t: mapped[t][i - 1] for t in TOOLS}
            if (r['id'], i) in human:
                per[(r['id'], i)]['H'] = human[(r['id'], i)]
    total = len(per)
    summary = {'words': total, 'human_labeled': len(human), 'tools': {}}
    for t in TOOLS:
        ok = sum(1 for v in per.values() if v[t] is not None)
        secs = sum(x['seconds'] for x in res[t].values())
        summary['tools'][t] = {'name': NAMES[t], 'matched_1to1': round(ok / total, 3), 'missing': total - ok,
                               'seconds_total': round(secs, 1)}
    pairs = {}
    refs = (['H'] if human else []) + TOOLS
    for i, a in enumerate(refs):
        for b in refs[i + 1:]:
            ds = [abs(v[a][0] - v[b][0]) for v in per.values() if v.get(a) and v.get(b)]
            pairs[f'{a}-{b}'] = stats(ds)
    summary['start_diff'] = pairs
    listen = []
    for (cid, i), v in per.items():
        got = {t: v[t][0] for t in TOOLS if v.get(t)}
        spread = (max(got.values()) - min(got.values())) if len(got) >= 2 else None
        if spread is None or spread > 0.10 or len(got) < len(TOOLS):
            word = next(r['words'][i - 1] for r in rows if r['id'] == cid)
            listen.append([cid, i, word] + [got.get(t, '') for t in TOOLS] + ['' if spread is None else round(spread, 3)])
    with open(os.path.join(HERE, 'results', 'listen_list.csv'), 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.writer(f)
        w.writerow(['sentence_id', 'word_no', 'word'] + [f'{t}_start' for t in TOOLS] + ['spread_s'])
        w.writerows(listen)
    summary['listen_words'] = len(listen)
    json.dump({'summary': summary, 'per_word': {f'{k[0]}#{k[1]}': v for k, v in per.items()}},
              open(os.path.join(HERE, 'results', 'compare.json'), 'w'), ensure_ascii=False, indent=0)
    md = ['| 도구 | 대본 낱말 1:1 맞춤 | 못 맞춘 낱말 | 처리 시간(20문장 합) |', '|---|---|---|---|']
    for t, s in summary['tools'].items():
        md.append(f"| {t}. {s['name']} | {s['matched_1to1'] * 100:.1f}% | {s['missing']} | {s['seconds_total']}초 |")
    md += ['', '| 비교 | 낱말 수 | 시작 차이 중앙값 | 90% 값 | 최대 | 0.08초 안 | 0.10초 안 |', '|---|---|---|---|---|---|---|']
    for k, s in pairs.items():
        if s:
            md.append(f"| {k} | {s['n']} | {s['median']} | {s['p90']} | {s['max']} | {s['in_0.08'] * 100:.0f}% | "
                      f"{s['in_0.10'] * 100:.0f}% |")
    md.append(f"\n사람이 들어 볼 낱말(도구끼리 0.10초 넘게 갈리거나 한 도구라도 못 맞춤): {len(listen)}개 / {total}개")
    open(os.path.join(HERE, 'results', 'compare.md'), 'w').write('\n'.join(md) + '\n')
    print('\n'.join(md))


if __name__ == '__main__':
    main()
