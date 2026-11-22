"""서울오토갤러리 사진 매물 → 숏폼 차 폴더 준비 (2026-11-22)

python3 sag_prep.py <매물상세.html> <성능기록부.html|-> <사진 폴더(K01..K20.jpg)> <차 폴더>

만드는 것
- listing.json : 차명·연식·주행·연료·배기량·색상·등록 옵션(사이트에서 켜진 것만)·상사·딜러
- cards.json   : 성능점검기록부 카드 줄(card_routine 형식). 기록부에서 체크된 값만 쓴다
- src2/pNN.jpg : 서울오토갤러리 촬영 순서(K01~K20)에 맞춘 부위 이름표(photos.json)

넣지 않는 것: 차량번호·제시번호·차대번호·성능번호·딜러 개인 연락처·사원증번호.
옵션: 상세 페이지 「차량옵션」 아이콘 중 class="on"만 등록 옵션이다(목록 전체는 템플릿이라 옵션이 아님).
"""
import html, json, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import inspect_parse  # noqa: E402

# 서울오토갤러리 스튜디오 촬영 순서(2026-11-22, 10대 대조). K10·K15~K17은 차마다 달라 '디테일'로 둔다.
SAG_SHOTS = {
    1: '측전면', 2: '정면', 3: '측후면', 4: '후면', 5: '엔진룸', 6: '휠', 7: '대시보드', 8: '운전석 계기·핸들',
    9: '계기판', 10: '디테일', 11: '앞좌석', 12: '뒷좌석', 13: '대시보드(조수석)', 14: '뒷좌석 전체',
    15: '디테일', 16: '디테일', 17: '디테일', 18: '정면 3/4 낮게', 19: '후면 3/4', 20: '트렁크',
}


def S(x):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', x))).strip()


def listing(det):
    t = re.sub(r'<!--.*?-->', '', det, flags=re.S)
    title = S(re.search(r'<p class="cartitle">(.*?)</p>', t).group(1))
    spec = [S(x) for x in re.findall(r'<span[^>]*>(.*?)</span>', re.search(r'<p class="usedcar-opt">(.*?)</p>', t, re.S).group(1))]
    info = dict((S(a), S(b)) for a, b in re.findall(r'<li><span><em>(.*?)</em></span><span>(.*?)</span></li>', t))
    i = t.find('<ul class="car-option">')
    opts = [S(x) for x in re.findall(r'<li class="on"><img[^>]*><p>(.*?)</p>', t[i:t.find('</ul>', i)])] if i > 0 else []
    m = re.match(r'\[(.*?)\]\s*(.*)', title)
    co = re.search(r'업체명 :</span><span>(.*?)</span>', t)
    de = re.search(r'성명 :</span><span>(.*?)</span>', t)
    ym = re.match(r'(\d{4})\s*/\s*(\d{1,2})', info.get('연식', ''))
    return {
        'maker': m.group(1) if m else '', 'name': m.group(2) if m else title,
        'year': int(ym.group(1)) if ym else None, 'month': ym.group(2).zfill(2) if ym else '',
        'km_text': info.get('주행거리', ''), 'fuel': info.get('연료', ''), 'gear': info.get('변속기', ''),
        'cc': info.get('배기량', ''), 'color': info.get('색상', ''),
        'options': opts, 'options_source': '서울오토갤러리 상세 차량옵션(class=on)',
        'company': co.group(1) if co else '', 'dealer': de.group(1) if de else '',
        'complex': '서울오토갤러리', 'spec_line': spec,
    }


def cards(chk):
    d = inspect_parse.parse(chk)
    c = {}
    for k, v in d['checked']:
        c.setdefault(k, []).append(v)
    has = lambda k, v: any(k in kk and v in vv for kk, vv in c.items())  # noqa: E731
    rows = []
    acc_ok = has('사고이력', '없음')
    rep_ok = has('단순수리', '없음')
    marks = [re.sub(r'^\d+\.', '', p).split('(')[0] for p, _ in d['panel_marks']]
    if acc_ok and rep_ok:
        rows.append(['사고 이력 · 단순 수리', '없음'])
    else:
        rows.append(['사고 이력', '없음' if acc_ok else '있음'] + ([] if acc_ok else ['warn']))
        if not rep_ok:
            rows.append(['단순 수리', '있음' + (f" ({'·'.join(marks)})" if marks else ''), 'warn'])
    rows.append(['침수 · 화재', '없음' if has('특별이력', '없음') else '있음'] + ([] if has('특별이력', '없음') else ['warn']))
    for k, vs in c.items():
        for v in vs:
            if v in ('미세누유', '누유', '미세누수', '누수', '불량', '부족'):
                part = k.split(' · ')[-1].replace(' / ', '·')
                rows.append([part, v, 'warn'])
    if has('리콜대상', '리콜 미이행'):
        rows.append(['리콜', '미이행', 'warn'])
    if has('튜닝', '있음'):
        rows.append(['튜닝', '있음', 'warn'])
    return {'report': {'first': 20, 'rows': rows, 'km': d['km'], 'first_reg': d['first_reg'], 'note': d['note']}}


def main(det_p, chk_p, src_dir, car):
    os.makedirs(os.path.join(car, 'src2'), exist_ok=True)
    det = open(det_p, encoding='utf-8', errors='replace').read()
    L = listing(det)
    json.dump(L, open(os.path.join(car, 'listing.json'), 'w'), ensure_ascii=False, indent=1)
    if chk_p != '-':
        json.dump(cards(open(chk_p, encoding='utf-8', errors='replace').read()), open(os.path.join(car, 'cards.json'), 'w'), ensure_ascii=False, indent=1)
    photos = {}
    for f in sorted(os.listdir(src_dir)):
        m = re.search(r'K(\d+)\.jpg$', f)
        if not m:
            continue
        k = int(m.group(1))
        dst = f'p{k:02d}.jpg'
        shutil.copy(os.path.join(src_dir, f), os.path.join(car, 'src2', dst))
        photos[dst] = SAG_SHOTS.get(k, '디테일')
    json.dump(photos, open(os.path.join(car, 'photos.json'), 'w'), ensure_ascii=False, indent=1)
    print(L['maker'], L['name'], L['year'], L['month'], L['km_text'], L['options'])


if __name__ == '__main__':
    main(*sys.argv[1:5])
