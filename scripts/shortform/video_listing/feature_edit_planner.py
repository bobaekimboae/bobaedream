"""영상 매물 옵션·기능 편집 자동 계획 — 어느 차든 대본(낱말 시각)과 컷 목록만 주면 컷마다 쓸 기법(T01~T07)을 고른다.

규칙: feature_edit_rules.json (차종·브랜드 이름은 코드에 없음, 옵션 낱말 사전과 장면 정보로만 판단)
입력(JSON):
  {"words": "낱말 시각 json 경로(받아쓰기 결과 [[낱말, 시작, 끝], ...])",
   "src": "원본 영상 경로(어두운 장면 판단용, 없으면 cuts[].dark 사용)",
   "cuts": [{"key": "c2", "start_word": 6, "src": [100.4, 103.2], "tracked": true, "part_box_frac": 0.0144,
             "action_src": [69.6, 71.0]   # 동작 장면이 따로 있으면(2분할용)
            }, ...]}
출력: {"cuts": [{"key", "t0", "t1", "options", "chip", "techniques": [{"id", "at", ...}]}], "summary": {...}}
사용:  python3 feature_edit_planner.py input.json [--out plan.json]
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
RULES = json.load(open(os.path.join(HERE, 'feature_edit_rules.json'), encoding='utf-8'))
TECH = {t['id']: t for t in RULES['techniques']}
NUM_RE = re.compile(r'^([\d][\d,]*)(' + '|'.join(re.escape(u) for u in RULES['count_up_units']) + r')')


def norm(w):
    return w.strip(' ,.?!').replace(' ', '')


def glow(src, s0, s1):
    """빛나는 부위 대비 = 밝은 쪽(상위 5%) 밝기 − 가운데(중앙값) 밝기, 구간 5장 평균(0~255). cv2가 없거나 실패하면 None.
    평균 밝기는 램프에 가까이 찍으면 오히려 올라가서 판단이 안 됨(G350 실측: 헤드램프 컷 평균 79.9 · 도어스텝 77.4) → 대비로 판단."""
    try:
        import cv2, numpy as np
    except ImportError:
        return None
    cap = cv2.VideoCapture(src); vals = []
    for k in range(5):
        cap.set(cv2.CAP_PROP_POS_MSEC, (s0 + (s1 - s0) * k / 4) * 1000)
        ok, f = cap.read()
        if ok:
            g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY); vals.append(float(np.percentile(g, 95) - np.median(g)))
    return sum(vals) / len(vals) if vals else None


def match_word(o, text):
    """옵션 낱말 중 대본에 가장 먼저 나오는 것 (위치, 원래 낱말)."""
    m = [(text.find(w.replace(' ', '')), w) for w in o['words'] if w.replace(' ', '') in text]
    return min(m) if m else None


def find_options(text):
    """컷 대본에서 옵션 사전 낱말을 찾는다. 나온 순서대로."""
    hits = [(match_word(o, text), o) for o in RULES['options']]
    return [o for mw, o in sorted([h for h in hits if h[0]], key=lambda x: x[0][0])]


def plan(inp):
    W = json.load(open(inp['words'], encoding='utf-8'))
    cuts = inp['cuts']; out = []; used = {k: 0 for k in TECH}
    starts = [W[c['start_word']][1] - 0.12 if c['start_word'] else 0.0 for c in cuts]
    end_word = len(W)
    power = None   # 영상에서 가장 큰 마력
    for j, (w, s, e) in enumerate(W):
        m = NUM_RE.match(norm(w))
        if m and m.group(2) == '마력':
            v = int(m.group(1).replace(',', ''))
            if power is None or v > power[0]: power = (v, j)
    for k, c in enumerate(cuts):
        a = c['start_word']; b = cuts[k + 1]['start_word'] if k + 1 < len(cuts) else end_word
        ws = W[a:b]; text = ''.join(norm(x[0]) for x in ws)
        opts = find_options(text); T = []
        t0 = starts[k]; t1 = starts[k + 1] if k + 1 < len(cuts) else W[-1][2]
        def word_at(key, after=0):
            for j in range(a + after, b):
                if norm(W[j][0]).startswith(key): return j
            return None
        cls = {o['class'] for o in opts}
        # T01 위아래 2분할: 동작→결과 기능 + 동작 장면이 따로 있음
        o1 = next((o for o in opts if o['class'] == 'action_result'), None)
        if o1 and c.get('action_src') and used['T01'] < TECH['T01']['max_per_video']:
            T.append({'id': 'T01', 'at': round(t0, 2), 'action_src': c['action_src'], 'result_src': c['src']}); used['T01'] += 1
        # T02 ✓ 목록: 같은 그룹 항목을 2개 이상 말함
        o2 = next((o for o in opts if o['class'] == 'group_list'), None)
        if o2:
            rows = []
            for it in o2.get('items', []):
                j = word_at(it)
                if j is not None: rows.append({'item': it, 'word': j, 'at': round(W[j][1] - TECH['T02']['params']['appear_before_word_s'], 2)})
            if len(rows) >= 2 and used['T02'] < TECH['T02']['max_per_video']:
                T.append({'id': 'T02', 'option': o2['key'], 'rows': rows[:TECH['T02']['params']['max_rows']]}); used['T02'] += 1
        # T03 점프컷: 제원 낱말 3개 이상
        steps = []
        for j in range(a, b):
            n = norm(W[j][0])
            if any(n.startswith(sw) or (sw == '단' and re.match(r'^\d+단', n)) for sw in RULES['spec_words']):
                steps.append({'word': j, 'at': round(W[j][1] - TECH['T03']['params']['before_word_s'], 2)})
        if len(steps) >= 3 and used['T03'] < TECH['T03']['max_per_video']:
            T.append({'id': 'T03', 'steps': steps[:TECH['T03']['params']['max_steps']]}); used['T03'] += 1
        # T04 카운트업: 큰 숫자 정수 + 단위(소수·규격·연식 제외)
        for j in range(a, b):
            n = norm(W[j][0]); m = NUM_RE.match(n)
            if not m or '.' in n or '/' in n: continue
            if used['T04'] < TECH['T04']['max_per_video']:
                T.append({'id': 'T04', 'word': j, 'value': m.group(1) + m.group(2), 'at': round(W[j][1] - TECH['T04']['params']['start_before_word_s'], 2)}); used['T04'] += 1
        # T05 스포트라이트: 조명 + 어두운 장면
        o5 = next((o for o in opts if o['class'] == 'lighting'), None)
        if o5:
            lu = c.get('glow')
            if lu is None and inp.get('src'): lu = glow(inp['src'], *c['src'])
            c['glow'] = lu
            j = word_at(match_word(o5, text)[1].split()[0])
            if lu is not None and lu >= RULES['glow_contrast'] and used['T05'] < TECH['T05']['max_per_video'] and j is not None:
                nxt = next((x for x in opts[opts.index(o5) + 1:] if x['key'] != o5['key']), None)   # 다음에 말하는 다른 부위에서 다시 밝게
                jn = word_at(match_word(nxt, text)[1].split()[0], after=j - a + 1) if nxt else None
                T.append({'id': 'T05', 'option': o5['key'], 'glow': round(lu, 1), 'at': round(W[j][1] - 0.06 - TECH['T05']['params']['start_before_chip_s'], 2),
                          'fade_out_at': round(W[jn][1] - 0.1, 2) if jn is not None else None}); used['T05'] += 1
        # T06 돋보기: 작은 버튼 + 추적됨 + 부위 상자 3% 미만
        o6 = next((o for o in opts if o['class'] == 'small_control'), None)
        if o6 and c.get('tracked') and c.get('part_box_frac', 1) < RULES['small_part_frac'] and used['T06'] < TECH['T06']['max_per_video']:
            T.append({'id': 'T06', 'option': o6['key'], 'at': round(W[a][1] - 0.06 + TECH['T06']['params']['start_after_chip_s'], 2)}); used['T06'] += 1
        # T07 마력 흔들림: 가장 큰 마력 한 번
        if power and a <= power[1] < b and used['T07'] < TECH['T07']['max_per_video']:
            T.append({'id': 'T07', 'word': power[1], 'value': power[0], 'at': round(W[power[1]][2] - 0.05, 2), 'sfx': 'neigh.wav'}); used['T07'] += 1
        out.append({'key': c['key'], 't0': round(t0, 2), 't1': round(t1, 2), 'options': [o['key'] for o in opts],
                    'chip': opts[0]['ko'] if opts else None, 'techniques': T})
    return {'cuts': out, 'summary': {k: v for k, v in used.items() if v}}


if __name__ == '__main__':
    inp = json.load(open(sys.argv[1], encoding='utf-8'))
    P = plan(inp)
    if '--out' in sys.argv: json.dump(P, open(sys.argv[sys.argv.index('--out') + 1], 'w'), ensure_ascii=False, indent=1)
    for c in P['cuts']:
        ts = ' · '.join(TECH[t['id']]['name'] + ('@' + str(t.get('at')) if 'at' in t else '') for t in c['techniques'])
        print(f"{c['key']:5} {c['t0']:6.2f}~{c['t1']:6.2f} 옵션={','.join(c['options']) or '-':28} {ts}")
    print('합계', P['summary'])
