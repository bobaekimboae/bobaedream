"""칩·말 ↔ 장면 맞음 검사(2026-11-10). build 뒤 plan.json과 장면 라벨(*_shots.json)로, 구절마다 실제로 화면에 비치는
원본 구간이 어떤 부위를 지나가는지 계산해 어긋난 곳을 줄로 낸다.

python3 check_match.py PLAN.json SHOTS.json [--tsv]
어긋남 종류
  넘침    장면이 그 부위 구간 끝을 넘어 다음 부위(또는 영상 끝 검은 화면)가 비침
  부위    칩·말이 원하는 부위 장면이 아님(예: 엔진 칩이 바퀴 위)
  없음    원본 영상에 원하는 부위 장면 자체가 없음(엔진룸 등) → 대신한 장면을 적음
"""
import argparse
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
RULES = json.load(open(os.path.join(HERE, 'auto_edit_rules.json'), encoding='utf-8'))


def spans(shots, a, b):
    """원본 a~b초가 지나가는 부위 목록(순서대로, 0.15초 미만 스침은 뺌)"""
    out = []
    for s in shots:
        o = min(b, s['t1']) - max(a, s['t0'])
        if o > 0.15 and (not out or out[-1] != s['part']):
            out.append(s['part'])
    end = max(s['t1'] for s in shots)
    if b > end + 0.15:
        out.append('영상끝(검은 화면)')
    return out


def check_render(out, shots, name):
    """렌더 뒤(OUT/render/match.json): 칩이 뜬 순간 실제 화면 부위, 장면 넘침(실제 컷 기준)"""
    P = json.load(open(os.path.join(out, 'plan.json'), encoding='utf-8'))
    M = json.load(open(os.path.join(out, 'render', 'match.json'), encoding='utf-8'))
    have = {s['part'] for s in shots}
    style = P['style'].replace('bobae_', '')
    want_of = {}
    for b in P['blocks']:
        for st in b.get('stickers', []):
            want_of[(b['sec'], st[0])] = b['parts'][st[1]] if st[1] < len(b['parts']) else []
    rows = []
    for c in M['chips']:
        want = want_of.get((c['sec'], c['chip']), [])
        if want and c['part'] not in want[:1] and not (want[0] not in have and c['part'] in want):
            rows.append([name, style, c['sec'], f"{c['t']}초", c['chip'], want[0], c['part'], '부위' if want[0] in have else '없음'])
    for sh in M['shots']:
        seen = spans(shots, sh['src'], sh['src'] + (sh['b'] - sh['a']) * sh['sp'])
        if len(seen) > 1:
            rows.append([name, style, f"컷{sh['bi']}-{sh['k']}", f"{sh['a']:.2f}초", '', sh.get('part') or '', ' → '.join(seen), '넘침'])
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--render', help='OUT 폴더: 렌더 뒤 실제 컷 기준으로 검사')
    ap.add_argument('plan'); ap.add_argument('shots'); ap.add_argument('--tsv', action='store_true'); ap.add_argument('--name', default='')
    a = ap.parse_args()
    if a.render:
        rows = check_render(a.render, sorted(json.load(open(a.shots, encoding='utf-8')), key=lambda s: s['t0']), a.name)
        for r in rows:
            print('\t'.join(r))
        if not a.tsv:
            print(f'어긋남 {len(rows)}곳')
        return
    P = json.load(open(a.plan, encoding='utf-8'))
    shots = sorted(json.load(open(a.shots, encoding='utf-8')), key=lambda s: s['t0'])
    have = {s['part'] for s in shots}
    style = P['style']
    pad = RULES['script'].get('cut_early_pad', {}).get(style, 0)
    rows = []
    for bi, b in enumerate(P['blocks']):
        cont = set(b.get('cont', []))
        for pi, ph in enumerate(b['phrases']):
            if pi >= len(b.get('shot_tuples', [])):
                continue
            t0, t1 = P['times'][f'{bi}:{pi}']
            need = max(0.6, t1 - t0) + (0 if (pi in cont or (bi == 0 and pi == 0)) else pad)
            st, sp, _ = b['shot_tuples'][pi]
            seen = spans(shots, st, st + need * sp)
            want = b['parts'][pi]
            chips = [x[0] for x in b.get('stickers', []) if x[1] == pi]
            text = ''.join(w[1] + ' ' for w in ph).strip()
            kinds = []
            if len(seen) > 1:
                kinds.append('넘침')
            if seen and seen[0] not in want[:1] and not (set(want) & have and seen[0] in want):
                kinds.append('부위' if want[0] in have else '없음')
            if b['sec'] in ('power',) and 'engine_bay' not in have:
                kinds.append('없음') if '없음' not in kinds else None
            if kinds:
                rows.append([a.name, style.replace('bobae_', ''), b['sec'], text, ' · '.join(chips), want[0], ' → '.join(seen), '·'.join(kinds)])
    hdr = ['영상', '판', '구간', '말(화면 글자)', '칩', '원하는 부위', '실제 비친 부위', '종류']
    if a.tsv:
        for r in rows:
            print('\t'.join(r))
    else:
        print(' | '.join(hdr))
        for r in rows:
            print(' | '.join(r))
        print(f'어긋남 {len(rows)}곳')


if __name__ == '__main__':
    main()
