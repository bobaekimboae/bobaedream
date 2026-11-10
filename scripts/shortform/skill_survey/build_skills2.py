"""편집 스킬 라이브러리 v2 만들기 (AS24 네덜란드 200 · 벨기에 198, 2026-11-10)
v1(사람이 본 45개 스킬 설명) + 400개 자동 집계(all.json) + 영상 패턴(patterns.json) + 받아쓰기(probe.json)
→ scripts/shortform/edit_skills/library_v2.json

python3 build_skills2.py SKILLDIR
"""
import json, os, sys, statistics as st
from collections import Counter, defaultdict

D = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
V1 = json.load(open(os.path.join(HERE, '..', 'auto', 'edit_skills_v1.json'), encoding='utf-8'))
A = json.load(open(os.path.join(D, 'all.json')))
PAT = json.load(open(os.path.join(D, 'patterns.json')))
M1, M2, M3 = '① 내레이션형', '② 사람 등장형', '③ 손가락 아이콘형'
ALL = [M1, M2, M3]

def med(xs, nd=3):
    xs = [x for x in xs if x is not None]
    return round(st.median(xs), nd) if xs else None

def q(xs, p):
    xs = sorted(x for x in xs if x is not None)
    return round(xs[min(len(xs) - 1, int(len(xs) * p))], 3) if xs else None

vids = defaultdict(set)
for v, p in PAT.items():
    vids[p['tag']].add(v)
NV = {t: len(s) for t, s in vids.items()}

# ── 1. 하위 유형(자동 묶음)별 통계 ──
by = defaultdict(list)
for r in A:
    if r['vid'] in PAT:
        by[r['sub']].append(r)
dur_of = {v: p['dur'] for v, p in PAT.items()}
SUBSTAT = {}
for sub, rs in by.items():
    vv = defaultdict(set)
    for r in rs:
        vv[r['tag']].add(r['vid'])
    SUBSTAT[sub] = dict(
        n=len(rs), videos_nl=len(vv['NL']), videos_be=len(vv['BE']),
        share_nl=round(len(vv['NL']) / max(1, NV.get('NL', 1)), 3), share_be=round(len(vv['BE']) / max(1, NV.get('BE', 1)), 3),
        per_video=round(len(rs) / max(1, len(vv['NL']) + len(vv['BE'])), 2),
        cy_med=med([r['cy'] for r in rs]), cy_q25=q([r['cy'] for r in rs], .25), cy_q75=q([r['cy'] for r in rs], .75),
        h_med=med([r['h'] for r in rs]), w_med=med([r['w'] for r in rs]), dur_med=med([r['dur'] for r in rs], 2),
        sfx_03=round(sum(1 for r in rs if r['sfx_near'] <= .3) / len(rs), 3),
        first3s=round(sum(1 for r in rs if r['t'] < 3) / len(rs), 3),
        last4s=round(sum(1 for r in rs if r['t'] > dur_of[r['vid']] - 4) / len(rs), 3),
        pos_med=med([r['t'] / max(1, dur_of[r['vid']]) for r in rs], 2),
    )

# ── 2. 스킬 목록: v1 그대로 + v2 통계 + 새 스킬 ──
AUTO = {'S001': 'boxlabel', 'S004': 'bigtext', 'S008': 'tape', 'S030': 'logo', 'S018': 'insert', 'S013': 'icon', 'S038': 'capword'}
skills = []
for s in V1['skills']:
    s = dict(s)
    s['version'] = 'v2'
    k = AUTO.get(s['id'])
    if k and k in SUBSTAT:
        x = SUBSTAT[k]
        s['stats'] = x
        s['cy_med'], s['dur_med'] = x['cy_med'], x['dur_med']
        shared = s['id'] in ('S013', 'S018')
        s['freq'] = (f"자동 집계{'(같은 모양 묶음, 다른 스킬 포함)' if shared else ''}: 네덜란드 {x['videos_nl']}/{NV.get('NL')}개 · 벨기에 {x['videos_be']}/{NV.get('BE')}개 영상, "
                     f"영상 하나에 평균 {x['per_video']}번, 세로 중심 {x['cy_q25']}~{x['cy_q75']}(중간 {x['cy_med']}), 머무는 시간 {x['dur_med']}초, 효과음 붙는 비율 {round(x['sfx_03'] * 100)}%")
        s['video_count'] = x['videos_nl'] + x['videos_be']
    skills.append(s)

if 'S041' in [s['id'] for s in skills]:
    s41 = next(s for s in skills if s['id'] == 'S041')
    s41['note'] = '첫 화면 차명 묶음(공식 차명 타이틀)'
    s41['when'] = '첫 1~2초 차를 소개할 때: 작은 노랑 상자 첫 말(「이건」·「제 뒤에」·「신형」) + 흰 큰 차명, 필요하면 아래 가격 줄'
    s41['example_ids'] = s41.get('example_ids', []) + ['N3#25', 'N3#54', 'N3#64', 'N3#185']

NEW = [
    ('S046', '판매점 표시', '칠', ALL, '매장·상사를 소개할 때: 📍 + 상사명 칩, 또는 상사 로고를 화면 위·가운데 잠깐(보배드림 상사 정보만)', '끝 로고',
     '📍칩 세로 0.62~0.75 / 로고 세로 0.2~0.35, 1.2초', ['N3#15', 'N3#86', 'N3#375', 'N3#432'], '📍 + 상사명(매물 상사 정보) · 상사 로고(상사가 올린 것만)'),
    ('S047', '화면 2분할', '화면 전환', ALL, '두 대를 견주거나 같은 차의 앞·뒤를 한 번에 보여줄 때 위아래 두 장면 + 가운데 가격 칩', '바탕 없는 큰 노랑 숫자',
     '2분할 1.5~2초', ['N3#26', 'N3#79'], '2분할 레이아웃'),
    ('S048', '설명용 그림 컷', '화면 삽입', ALL, '서비스·제도(안전 거래·서류·이전 등)를 설명할 때 그림 컷 + 초록 체크가 그려지며 나타남', '초록 체크 칩',
     '컷 1~2초, 체크 그려짐 0.4초', ['N3#43', 'N3#44', 'N3#45', 'N3#46'], '보배드림이 그린 설명 일러스트(남의 스톡 영상 쓰지 않음)'),
    ('S049', '차 브랜드 로고 배지', '아이콘·기호', ALL, '브랜드 이야기(같은 그룹·원산지)를 할 때 브랜드 로고를 작게 띄움', '국기',
     '로고 높이 화면 6%, 세로 0.6~0.75, 1.2초', ['N3#381', 'N3#382', 'N3#383'], '보배드림 퀵필터 브랜드 로고(public/assets/brand)'),
    ('S050', '캠페인 끝 문구 카드', '마무리', ALL, '영상 맨 끝 로고 바로 앞에 한 줄 캠페인 문구(「내 차 찾기는 보배드림」)', '끝 로고',
     '마지막 2~3초, 가운데', ['N3#177', 'N3#178', 'N3#179'], '보배드림 캠페인 문구 + 로고'),
    ('S051', '단색 배경 진행자', '사람 연출', [M2], '서비스 설명·공지처럼 차가 없는 영상: 단색(브랜드색) 배경 앞 진행자', '설명용 그림 컷',
     '전체 화면', ['N3#41', 'N3#42'], '보배드림 파랑 배경 스튜디오 촬영'),
    ('S052', '시리즈 타이틀 카드', '첫 화면', ALL, '정기 코너(대담·연재)의 첫 화면: 진한 둥근 판 + 원 아이콘 + 코너 이름 + 로고, 1~2초', '인용 문장 카드',
     '가운데, 화면 폭 60%, 2초', ['N4#42', 'N4#246', 'N4#302'], '보배드림 코너 이름 + 보배드림 로고(원본 코너명·로고 쓰지 않음)'),
    ('S053', '인용 문장 카드', '자막', ALL, '대담·인터뷰에서 핵심 한 문장을 노랑 판에 크게 띄울 때(말한 그대로, 지어내지 않음)', '사람 이름표',
     '가운데, 화면 폭 85%, 2~3초', ['N4#241', 'N4#242', 'N4#243'], '말한 문장 그대로 + 말한 사람 이름'),
]
for sid, note, typ, modes, when, pair, geo, ex, asset in NEW:
    skills.append(dict(id=sid, version='v2', title=f'편집 스킬 {int(sid[1:])} — 명칭 미정', note=note, type=typ, modes=modes, when=when, pair=pair,
                       geometry=geo, freq=f'관찰 예 {len(ex)}건 이상(400개 확대 조사에서 새로 본 장면, 자동 집계 아님)', video_count=None,
                       sources=['네덜란드', '벨기에'], examples=[], example_ids=ex, asset=asset))
OBSERVED_ONLY = [dict(name='대중문화 캐릭터 스티커', why='영화·드라마 주인공 일러스트를 붙임(N3#313, N4#798 「Magnum P.I.」). 남의 캐릭터라 쓰지 않는다. 필요하면 보배드림 자체 일러스트로.'),
                 dict(name='다른 서비스 로고 띄우기', why='차 화면의 넷플릭스 등 다른 회사 로고를 크게 띄움(N4#28, N4#29). 남의 로고라 쓰지 않는다. 기능 이름은 글자 칩(S008)으로.')]

# ── 3. 패턴 유형 프로필 ──
P = defaultdict(list)
for v, p in PAT.items():
    P[p['pattern']].append(p)
profiles = {}
for code, ps in sorted(P.items()):
    subs = Counter()
    first = Counter()
    last = Counter()
    for p in ps:
        subs.update(p['subs'])
        first.update(set(p['first3s']))
        last.update(set(p['last4s']))
    n = len(ps)
    profiles[code] = dict(
        name=ps[0]['pattern_name'], n=n, nl=sum(p['tag'] == 'NL' for p in ps), be=sum(p['tag'] == 'BE' for p in ps),
        dur_med=med([p['dur'] for p in ps], 1), cuts_per_s=med([p['cuts_per_s'] for p in ps], 2),
        overlays_per_10s=med([p['overlays_per_10s'] for p in ps], 2), sfx_per_s=med([p['sfx_per_s'] for p in ps], 2),
        words_per_s=med([p.get('words_per_s') for p in ps], 2), person_rate=round(sum(1 for p in ps if p.get('person')) / n, 2) if any(p.get('person') is not None for p in ps) else None,
        end_logo_rate=round(sum(1 for p in ps if p['end_logo']) / n, 2),
        top_subs={k: round(v / n, 2) for k, v in subs.most_common(6)},
        first3s={k: round(v / n, 2) for k, v in first.most_common(4)},
        last4s={k: round(v / n, 2) for k, v in last.most_common(4)},
        examples=[f"https://youtube.com/shorts/{v.split('_', 1)[1]}" for v, p in list(PAT.items()) if p['pattern'] == code][:4],
    )

# ── 4. 패턴별 흐름(장면 순서 → 장면마다 쓰는 레시피) ──
FLOWS = {
    'P01': ['intro', 'spec', 'option', 'option', 'price', 'ending'],
    'P02': ['intro', 'spec', 'option', 'option', 'sound', 'price', 'ending'],
    'P03': ['quiz_hook', 'hint', 'hint', 'reveal', 'comment', 'ending'],
    'P04': ['quiz_hook', 'spec', 'count_reveal', 'comment', 'ending'],
    'P05': ['quiz_hook', 'hint', 'price_reveal', 'comment', 'ending'],
    'P06': ['budget_hook', 'listing', 'listing', 'listing', 'comment', 'ending'],
    'P07': ['intro', 'spec', 'option', 'price_tease', 'price', 'ending'],
    'P08': ['compare_hook', 'compare', 'compare', 'choice', 'comment', 'ending'],
    'P09': ['tip_hook', 'point', 'point', 'ending'],
    'P10': ['fact_hook', 'story', 'story', 'ending'],
    'P11': ['list_hook', 'rank', 'rank', 'rank', 'ending'],
    'P12': ['asmr_hook', 'sound', 'sound', 'ending'],
    'P13': ['interview_hook', 'answer', 'answer', 'comment', 'ending'],
    'P14': ['question_hook', 'answer', 'comment', 'ending'],
    'P15': ['sold_hook', 'intro', 'spec', 'cta', 'ending'],
    'P16': ['service_hook', 'app', 'explain', 'cta', 'ending'],
    'P17': ['news_hook', 'explain', 'explain', 'ending'],
    'P18': ['why_hook', 'point', 'point', 'spec', 'ending'],
}
RECIPES = dict(V1['recipes'])
RECIPES.update(
    intro=['S041', 'S001', 'S046'], spec=['S004', 'S007', 'S003'], option=['S002', 'S008', 'S045'], price=['S042', 'S004', 'S011'],
    price_tease=['S042'], quiz_hook=['S025'], hint=['S008', 'S002'], reveal=['S037', 'S001', 'S009'], count_reveal=['S005', 'S004'],
    price_reveal=['S042', 'S004'], comment=['S028'], ending=['S050', 'S030'], budget_hook=['S025', 'S004'], listing=['S021', 'S047', 'S004'],
    compare_hook=['S025'], compare=['S018', 'S047'], choice=['S027'], tip_hook=['S025', 'S013'], point=['S008', 'S020', 'S036'],
    fact_hook=['S025', 'S040'], story=['S049', 'S014', 'S015'], list_hook=['S025', 'S043'], rank=['S043', 'S001'],
    asmr_hook=['S032'], interview_hook=['S052', 'S025', 'S033'], answer=['S033', 'S053', 'S004', 'S027'], question_hook=['S025'],
    sold_hook=['S010', 'S001'], cta=['S029', 'S046'], service_hook=['S025', 'S051'], app=['S019', 'S020'], explain=['S048', 'S045'],
    news_hook=['S025', 'S006'], why_hook=['S025', 'S014'], sound=['S012', 'S032'], point_m3=['S035', 'S020'],
)

# ── 5. 박자(원본 실측) ──
first_t = med([min((r['t'] for r in A if r['vid'] == v), default=None) for v in list(PAT)[:400]], 2)
gaps = []
byv = defaultdict(list)
for r in A:
    if r['vid'] in PAT and r['sub'] not in ('capword',):
        byv[r['vid']].append(r['t'])
for v, ts in byv.items():
    ts.sort()
    gaps += [b - a for a, b in zip(ts, ts[1:]) if b - a > .3]
timing = dict(first_overlay_delay=min(first_t or .5, 1.0), gap_between_overlays=med(gaps, 2), gap_q25=q(gaps, .25), gap_q75=q(gaps, .75),
              _note='원본 400개: 첫 요소가 뜨는 시각 중간값, 요소 사이 간격(0.3초 미만 제외) 중간값')

out = dict(
    _note=f"편집 스킬 라이브러리 v2. 스킬 번호 고정, 고치면 version만 올린다. 측정: AS24 네덜란드 {NV.get('NL')} · 벨기에 {NV.get('BE')} 쇼츠(2026-11-10).",
    collision=V1['collision'], korean=V1['korean'], timing=timing,
    sfx=dict(V1['sfx'], every_n_overlays=4, max_ratio=.35,
             _note='칠·칩 등장 0.3초 안에 효과음이 붙은 비율: ' + ' · '.join(f"{ko} {round(SUBSTAT[k]['sfx_03'] * 100)}%" for k, ko in
                   (('tape', '띠'), ('boxlabel', '이름표'), ('bigtext', '큰 숫자'), ('insert', '삽입'), ('logo', '로고')) if k in SUBSTAT)
                   + ' (2kHz 위 소리 급증 기준, 말소리 섞일 수 있음). 모든 등장에 효과음을 붙이지 않는다.'),
    mode_rules=dict(V1['mode_rules'], **{M1: '사람 이름표·놀람 선·가리키기·덮개 공개·단색 배경 진행자(S033·S034·S035·S037·S051)와 둘 중 하나(S027)는 쓰지 않는다'}),
    auto_check=V1['auto_check'] + ['효과음 붙는 요소 35% 이하', '끝 로고 마지막 4초 안'],
    recipes=RECIPES, pattern_flows=FLOWS, patterns=profiles, substats=SUBSTAT, observed_only=OBSERVED_ONLY,
    skills=skills,
)
for s in out['skills']:
    if s['id'] in ('S033', 'S034', 'S035', 'S037', 'S027', 'S051'):
        s['modes'] = [m for m in s['modes'] if m != M1] or s['modes']
dst = os.path.join(HERE, '..', 'edit_skills', 'library_v2.json')
json.dump(out, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('skills', len(skills), 'patterns', len(profiles), 'videos', NV, 'timing', timing)
