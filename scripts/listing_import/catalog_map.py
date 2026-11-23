"""가져온 매물의 차량 정보 → 보배드림 차량 기준표(public/data/vehicle-catalog/cars-index-v1.json) 연결.

사이트마다 차 이름 표기가 다르다('[기아] 더 뉴쏘렌토 하이브리드(MQ4)', '르노(삼성) SM6', '봉고Ⅲ화물').
제조사 → 모델 → 세대 순서로 기준표 id 를 찾고, 어떻게 찾았는지(match)와 확신 정도를 함께 남긴다.

match: exact(이름·코드로 세대까지) · by_date(모델은 이름, 세대는 최초등록 연월로) · model(모델까지만) · make(제조사만) · none
원장 칸 값은 바꾸지 않는다. 기준표 연결은 led['catalog'] 에 따로 둔다.
"""
from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / 'public/data/vehicle-catalog/cars-index-v1.json'

MAKE_ALIAS = {
    '르노삼성': '르노코리아(삼성)', '르노(삼성)': '르노코리아(삼성)', '르노코리아': '르노코리아(삼성)', '삼성': '르노코리아(삼성)',
    '쌍용': 'KG모빌리티(쌍용)', 'KG모빌리티': 'KG모빌리티(쌍용)', 'KGM': 'KG모빌리티(쌍용)', '쌍용자동차': 'KG모빌리티(쌍용)',
    '대우': '쉐보레(GM대우)', 'GM대우': '쉐보레(GM대우)', '쉐보레(대우)': '쉐보레(GM대우)', '한국GM': '쉐보레(GM대우)',
    '메르세데스-벤츠': '벤츠', '메르세데스벤츠': '벤츠', 'Mercedes-Benz': '벤츠', 'BENZ': '벤츠',
    '토요타': '도요타', '미쓰비시': '미쯔비시', '마쓰다': '마쯔다', '닛싼': '닛산', '시트로엥': '시트로엥/DS', 'DS': '시트로엥/DS',
    '랜드로버': '랜드로버', '레인지로버': '랜드로버', '크라이슬러': '크라이슬러', '롤스로이스': '롤스로이스', '애스턴마틴': '애스턴마틴',
    '알파로메오': '알파 로메오', '재규어': '재규어', '포르쉐': '포르쉐', '폭스바겐': '폭스바겐', '아우디': '아우디', '볼보': '볼보',
}
DOMESTIC_CHEVY = {'스파크', '말리부', '트랙스', '트레일블레이저', '크루즈', '올란도', '캡티바', '다마스', '라보', '마티즈', '젠트라', '라세티', '아베오', '윈스톰', '알페온', '임팔라', '이쿼녹스', '볼트 EV', '볼트 EUV'}
PREFIX = re.compile(r'^(?:디\s?올\s?뉴|더\s?뉴|올\s?뉴|뉴|신형|THE\s?NEW|ALL\s?NEW|NEW)\s*', re.I)
ROMAN = {'Ⅱ': '2', 'Ⅲ': '3', 'Ⅳ': '4', 'Ⅴ': '5', 'III': '3', 'II': '2', 'IV': '4'}


def norm(s: str | None) -> str:
    s = str(s or '')
    for k, v in ROMAN.items():
        s = s.replace(k, v)
    s = re.sub(r'\(.*?\)', ' ', s)
    return re.sub(r'[\s\-_·./]', '', s).lower()


@lru_cache(maxsize=1)
def catalog() -> dict:
    d = json.loads(INDEX.read_text(encoding='utf-8'))
    makes = {norm(m['name']): m for m in d['manufacturers']}
    for m in d['manufacturers']:  # '르노코리아(삼성)' 은 '르노코리아' 로도 찾게
        base = norm(re.sub(r'\(.*?\)', '', m['name']))
        makes.setdefault(base, m)
        if m.get('englishName'):
            makes.setdefault(norm(m['englishName']), m)
    groups: dict[str, list] = {}
    for g in d['modelGroups']:
        groups.setdefault(g['makeId'], []).append(g)
    gens: dict[str, list] = {}
    for g in d['generations']:
        gens.setdefault(g['groupId'], []).append(g)
    return {'makes': makes, 'groups': groups, 'gens': gens, 'version': d.get('generatedAt')}


def find_make(make: str | None, title: str) -> dict | None:
    c = catalog()
    raw = (make or '').strip()
    name = MAKE_ALIAS.get(raw) or MAKE_ALIAS.get(re.sub(r'\s', '', raw)) or raw
    if name == '쉐보레' and any(norm(x) in norm(title) for x in DOMESTIC_CHEVY):
        name = '쉐보레(GM대우)'
    m = c['makes'].get(norm(name))
    if not m and '(' in raw:  # '르노(삼성)' → '르노' 아니면 '삼성'
        for part in re.split(r'[()]', raw):
            m = c['makes'].get(norm(MAKE_ALIAS.get(part.strip(), part.strip())))
            if m:
                break
    return m


def ym_num(ym: str | None) -> int | None:
    m = re.match(r'(\d{4})\D?(\d{1,2})?', str(ym or ''))
    return int(m.group(1)) * 100 + int(m.group(2) or 6) if m else None


def match(make: str | None, model: str | None, trim: str | None, first_reg: str | None = None, year: int | None = None) -> dict:
    title = ' '.join(x for x in [model, trim] if x)
    out = {'match': 'none', 'make_id': None, 'make': None, 'model_id': None, 'model': None, 'generation_id': None, 'generation': None,
           'catalog_version': catalog()['version']}
    mk = find_make(make, title)
    if not mk:
        return out
    out.update(match='make', make_id=mk['id'], make=mk['name'])
    t = norm(PREFIX.sub('', title))
    t_full = norm(title)
    best = None
    for g in catalog()['groups'].get(mk['id'], []):
        n = norm(PREFIX.sub('', g['name']))
        if n and (t.startswith(n) or n in t_full):
            if not best or len(n) > len(norm(best['name'])):
                best = g
    if not best:
        return out
    out.update(match='model', model_id=best['id'], model=best['name'])
    when = ym_num(first_reg) or (year * 100 + 6 if year else None)
    scored = []
    for gen in catalog()['gens'].get(best['id'], []):
        s = 0
        code = (gen.get('generationCode') or '').lower()
        if code and re.search(rf'(?<![a-z0-9]){re.escape(code)}(?![a-z0-9])', title.lower()):
            s += 6
        gname = norm(PREFIX.sub('', gen['name'] or ''))
        if gname and gname in t_full:
            s += 4 + len(gname) / 20          # 더 긴(구체적인) 세대 이름이 이긴다
        if ('하이브리드' in gen['name']) == ('하이브리드' in title or 'hev' in title.lower()):
            s += 1
        if PREFIX.match(gen['name'] or '') and PREFIX.match(title or ''):
            s += 1
        start, end = ym_num(gen.get('releaseYm')), ym_num(gen.get('endYm')) or 999912
        in_range = bool(when and start and start <= when <= end)
        if in_range:
            s += 3
        elif when and start:                  # 최초등록이 판매 기간 밖이면 감점
            s -= 3
        scored.append((s, in_range, gen))
    if not scored:
        return out
    scored.sort(key=lambda x: -x[0])
    top_s, in_range, gen = scored[0]
    tie = len(scored) > 1 and scored[1][0] == top_s
    if top_s >= 6 and not tie:
        out.update(match='exact', generation_id=gen['id'], generation=gen['name'])
    elif in_range and not tie:
        out.update(match='by_date', generation_id=gen['id'], generation=gen['name'])
    return out
