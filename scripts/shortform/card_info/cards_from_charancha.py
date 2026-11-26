"""차란차 매물 데이터(net.json) → 카드 정보 사실 파일(facts.json). 원장에 없는 값은 만들지 않는다. 차량번호·연락처는 저장하지 않는다.

python3 cards_from_charancha.py <차 폴더>
  입력: <차 폴더>/raw/net.json  (매물 페이지를 열 때 받은 공개 데이터: summary-info · main-options · group-options ·
                                choice-options · jato-specs · market-prices · used-car-dealers) + raw/rsc.txt(매물 기본 정보)
  출력: <차 폴더>/facts.json
"""
import json, os, re, sys


def _rsc_field(s, k):
    m = re.search(r'"%s":("([^"]*)"|[0-9.]+|null)' % k, s)
    if not m:
        return None
    v = m.group(1)
    return None if v == 'null' else (m.group(2) if v.startswith('"') else float(v) if '.' in v else int(v))


def build(folder):
    raw = json.load(open(os.path.join(folder, 'raw', 'net.json')))
    N = {x['u'].split('?')[0].split('/')[-1]: x['j'] for x in raw}
    for x in raw:
        if '/used-car-dealers/' in x['u']:
            N['used-car-dealers'] = x['j']
    R = open(os.path.join(folder, 'raw', 'rsc.txt'), encoding='utf-8').read()
    f = {k: _rsc_field(R, k) for k in ['makerName', 'modelName', 'modelDetailName', 'gradeName', 'releaseYear', 'firstRegisteredAt',
                                        'mileage', 'sellPrice', 'fuelName', 'regionName', 'displacement', 'transmissionName',
                                        'carTypeName', 'bodyTypeName', 'colorName']}
    S = N['summary-info']['data']
    J = N.get('jato-specs', {}).get('data') or {}
    def jv(k, i=0):
        v = (J.get(k) or '').split(';')
        return v[i] if len(v) > i and v[i] else None
    groups = []
    for g in N['group-options']['data']:
        eq = []
        for sg in g['subGroups']:
            units = [o['subGroupUnitName'] for o in sg['options'] if o['equipped']]
            if units:
                extra = [u for u in units if u and u != sg['subGroupName']]
                eq.append(sg['subGroupName'] + (f"({'·'.join(extra)})" if extra else ''))
        groups.append({'name': g['groupName'], 'count': g['equippedCount'], 'items': eq})
    dealer = N.get('used-car-dealers', {}).get('data') or {}
    mp = N.get('market-prices', {}).get('data') or {}
    fr = f['firstRegisteredAt'] or ''
    F = {
        'source': 'charancha',
        'make': f['makerName'], 'model': f['modelDetailName'], 'trim': f['gradeName'],
        'reg': f"{fr[2:4]}년{fr[4:6]}월" if len(fr) >= 6 else None, 'year': f['releaseYear'],
        'km': f['mileage'], 'fuel': f['fuelName'], 'transmission': f['transmissionName'], 'cc': f['displacement'],
        'color': f['colorName'], 'body': f['bodyTypeName'], 'class': f['carTypeName'], 'region': f['regionName'],
        'price_manwon': f['sellPrice'],
        'performance': {'has': S['performance']['hasPerformance'], 'exchange_or_sheetmetal': True if S['performance']['sourceType']['code'] == 'EXTERNAL_URL' else None,
                        '_note': '차란차 화면 요약 「교환 · 판금 확인」. 부위별 상세는 외부 기록부 링크라 데이터에 없음'},
        'insurance': {k: S['insurance'][k] for k in ['myCarDamageCount', 'otherCarDamageCount', 'hasTotalLoss', 'hasFloodLoss',
                                                       'hasTheftLoss', 'ownerChangeCount', 'carNumberChangeCount']},
        'new_car_save_pct': S.get('newCarComparison', {}).get('savePercent'),
        'main_options': [[o['optionName'], o['equipped']] for o in N['main-options']['data']],
        'option_groups': groups,
        'choice_options': [o for o in N.get('choice-options', {}).get('data', [])],
        'jato': {'price_won': int(J['price']) if J.get('price') else None, 'hp': jv('id15304'), 'torque_kgm': jv('id15307'),
                 'zero100_s': J.get('id13503'), 'top_kmh': J.get('id13502'), 'combined_kml': J.get('complexGasMileage'),
                 'seats': J.get('id702'), 'engine': J.get('id7408'), 'length_mm': J.get('id5802'), 'width_mm': J.get('id5803'),
                 'height_mm': J.get('id5804'), 'wheelbase_mm': J.get('id5806')},
        'market': {'low': mp.get('adjustedMiddlePrice'), 'high': mp.get('adjustedMaxPrice'), 'name': mp.get('trimName')},
        'dealer': {'name': dealer.get('name'), 'company': dealer.get('companyName'), 'estate': dealer.get('tradeEstateName'),
                   'intro': dealer.get('introduction'), 'sale': _rsc_field(R, 'saleCount'), 'sold': _rsc_field(R, 'soldCount')},
        'seller_text': seller_text(folder),
    }
    return F


def seller_text(car):
    """매물 설명이 판매자 고유 글인지, 기본 정보만 되풀이한 틀 글인지(카드 생략 판단용). 글 자체는 저장하지 않는다(차량번호가 섞임)."""
    p = os.path.join(car, 'raw', 'page.txt')
    if not os.path.exists(p):
        return {'kind': 'unknown'}
    t = open(p, encoding='utf-8').read()
    m = re.search(r'판매완료\n[\d,]+\n(.*?)\n더보기', t, re.S)
    if not m:
        return {'kind': 'none'}
    body = m.group(1)
    rest = []
    for ln in body.splitlines():
        ln = ln.strip()
        if not ln or ln.startswith('-') or '안녕하세요' in ln or '지금 보시는 차량은' in ln or '구매 문의' in ln:
            continue
        rest.append(ln)
    return {'kind': 'own' if len(''.join(rest)) >= 20 else 'template', 'own_chars': len(''.join(rest))}


if __name__ == '__main__':
    F = build(sys.argv[1])
    fp = os.path.join(sys.argv[1], 'facts.json')
    if os.path.exists(fp):   # 다른 원장 스크립트가 넣은 항목(inspection · insurance_detail)은 지우지 않는다
        old = json.load(open(fp, encoding='utf-8'))
        F = {**{k: v for k, v in old.items() if k not in F}, **F}
    json.dump(F, open(os.path.join(sys.argv[1], 'facts.json'), 'w'), ensure_ascii=False, indent=1)
    print(json.dumps(F, ensure_ascii=False)[:1500])
