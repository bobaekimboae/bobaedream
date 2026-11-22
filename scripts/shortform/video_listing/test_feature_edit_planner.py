"""feature_edit_planner 점검: G350 실제 입력 + 차명이 다른 가상 매물 2대로 '어느 차든 같은 규칙'인지 확인.
python3 test_feature_edit_planner.py
"""
import json, os, tempfile
import feature_edit_planner as F
HERE = os.path.dirname(os.path.abspath(__file__))

def words_file(text):   # 낱말마다 0.4초
    W = [[w, round(i * 0.4, 2), round(i * 0.4 + 0.35, 2)] for i, w in enumerate(text.split())]
    p = tempfile.mktemp(suffix='.json'); json.dump(W, open(p, 'w'), ensure_ascii=False); return p, W

def idx(W, k): return next(i for i, w in enumerate(W) if w[0].startswith(k))

fails = []
def check(name, cond):
    print(('통과 ' if cond else '실패 ') + name); cond or fails.append(name)

# 1) G350 실제
G = json.load(open(os.path.join(HERE, 'samples', 'g350_input.json')))
if os.path.exists(G['words']):
    P = F.plan(G); s = P['summary']
    check('G350 기법 개수 T01·T02·T03·T07=1, T04=4, T05=2, T06=1', s == {'T01': 1, 'T02': 1, 'T03': 1, 'T04': 4, 'T05': 2, 'T06': 1, 'T07': 1})
    v = [t['value'] for c in P['cuts'] for t in c['techniques'] if t['id'] == 'T04']
    check('G350 카운트업 값 = 3,500kg·480L·2,250L·211마력(9.1초·265/60 제외)', v == ['3,500kg', '480L', '2,250L', '211마력'])

# 2) 가상 SUV: 파노라마 선루프(동작 장면 없음) · 디퍼렌셜 락 1개만 말함 · 마력 2개(큰 값만 흔들림)
p, W = words_file('앞은 매트릭스 헤드램프입니다 파노라마 선루프가 있고 디퍼렌셜 락은 뒤만 됩니다 엔진은 340마력 고성능 모드는 380마력 토크는 50kg·m 8단 제로백은 5.9초 메모리 시트도 있습니다')
inp = {'words': p, 'cuts': [{'key': 'a', 'start_word': 0, 'src': [0, 1], 'glow': 40},
                             {'key': 'b', 'start_word': idx(W, '파노라마'), 'src': [0, 1]},
                             {'key': 'c', 'start_word': idx(W, '디퍼렌셜'), 'src': [0, 1]},
                             {'key': 'd', 'start_word': idx(W, '엔진은'), 'src': [0, 1]},
                             {'key': 'e', 'start_word': idx(W, '메모리'), 'src': [0, 1], 'tracked': False}]}
P = F.plan(inp); T = {c['key']: [t['id'] for t in c['techniques']] for c in P['cuts']}
check('빛나지 않는 헤드램프 컷 → 스포트라이트 없음', 'T05' not in T['a'])
check('선루프지만 동작 장면이 없으면 2분할 없음', 'T01' not in T['b'])
check('같은 그룹 1개만 말하면 ✓ 목록 없음', 'T02' not in T['c'])
check('제원 3개(토크·8단·제로백) → 점프컷', 'T03' in T['d'])
shake = [t for c in P['cuts'] for t in c['techniques'] if t['id'] == 'T07']
check('마력이 둘이면 큰 값(380)만 흔들림', len(shake) == 1 and shake[0]['value'] == 380)
check('추적 안 되는 작은 버튼 → 돋보기 없음', 'T06' not in T['e'])

# 3) 가상 세단: 전동 트렁크 동작 장면 있음 · 앰비언트 빛남 · 시트 조절 추적됨
p, W = words_file('트렁크 버튼을 누르면 전동 트렁크가 열립니다 실내는 앰비언트 라이트가 은은하고 시트 조절 버튼은 도어에 있습니다')
inp = {'words': p, 'cuts': [{'key': 'a', 'start_word': 0, 'src': [5, 8], 'action_src': [1, 2]},
                             {'key': 'b', 'start_word': idx(W, '실내는'), 'src': [0, 1], 'glow': 120},
                             {'key': 'c', 'start_word': idx(W, '시트'), 'src': [0, 1], 'tracked': True, 'part_box_frac': 0.012}]}
P = F.plan(inp); T = {c['key']: [t['id'] for t in c['techniques']] for c in P['cuts']}
check('전동 트렁크 + 동작 장면 → 2분할', 'T01' in T['a'])
check('빛나는 앰비언트 → 스포트라이트', 'T05' in T['b'])
check('작은 시트 버튼 + 추적 → 돋보기', 'T06' in T['c'])
print('실패', len(fails), '개' if fails else '개 — 모두 통과')
raise SystemExit(1 if fails else 0)
