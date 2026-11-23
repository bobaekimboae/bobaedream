"""조합·매매단지 홈페이지 공용 읽기.

전국 조합·매매단지 홈페이지는 대부분 세 가지 전산(솔루션) 위에 지어져 있다. 같은 전산은 매물 상세 화면의 모양이 같아
한 읽기 함수로 여러 사이트를 처리한다. 어느 사이트가 어느 전산인지는 complex_sites.json 이 정한다.

  carku : 전국연합 전산(korea-usedcar)   /car/car_detail.html?DemoNo=…      사진 photo.korea-usedcar.co.kr
  emi   : 한국연합 전산(이엠아이앤씨)       /car/carView.html?m_no=… · /car/car_detail.html?m_no=…  사진 koreacarmarket.com/data
  aton  : 카매니저 전산(아톤모빌리티)       /Model/DetailView.asp?encOnCarNo=…  사진 img.carmanager.co.kr

공개 매물 상세 화면의 글자만 읽는다. 한 번에 한 건, 요청 사이 1초(common.fetch).
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from common import category_of, fetch, fuel, gear, label_value, price_krw, strip_corp, text_lines, to_int, year_month, yes_no_unknown

REGISTRY = json.loads((Path(__file__).with_name('complex_sites.json')).read_text(encoding='utf-8'))
SITES = {s['domain']: s for s in REGISTRY['sites']}

DETAIL = {
    'carku': re.compile(r'/car/car_detail\.html\?.*DemoNo=\w+', re.I),
    'emi': re.compile(r'/car/(?:carView|car_detail)\.html\?.*(?:m_no|c_no)=\d+', re.I),
    'aton': re.compile(r'/Model/DetailView\.asp\?.*encOnCarNo=\w+', re.I),
}
PHOTO = {
    'carku': re.compile(r'https?://photo\.korea-usedcar\.co\.kr/carphoto/large/[^"\'\s)]+?\.(?:jpe?g|png)', re.I),
    'emi': re.compile(r'https?://[\w.-]+/+data/+(?!__)[^"\'\s)]+?_\d+\.(?:jpe?g|png)', re.I),
    'aton': re.compile(r'https?://img\.carmanager\.co\.kr/[^"\'\s)]+?\.(?:jpe?g|png)', re.I),
}
REGION_SHORT = [('서울특별시', '서울'), ('부산광역시', '부산'), ('대구광역시', '대구'), ('인천광역시', '인천'), ('광주광역시', '광주'),
                ('대전광역시', '대전'), ('울산광역시', '울산'), ('세종특별자치시', '세종'), ('경기도', '경기'), ('강원특별자치도', '강원'),
                ('강원도', '강원'), ('충청북도', '충북'), ('충청남도', '충남'), ('전북특별자치도', '전북'), ('전라북도', '전북'),
                ('전라남도', '전남'), ('경상북도', '경북'), ('경상남도', '경남'), ('제주특별자치도', '제주')]


def host_of(url: str) -> str:
    return urlparse(url).netloc.lower().removeprefix('www.').removeprefix('m.')


def site_of(url: str) -> dict | None:
    s = SITES.get(host_of(url))
    return s if s and s.get('family') in DETAIL else None


def is_detail(url: str, family: str) -> bool:
    return bool(DETAIL[family].search(url))


def first(L: list[str], *labels: str) -> str | None:
    for lb in labels:
        v = label_value(L, lb)
        if v and v not in labels and v not in (':', '-') and v not in LABEL_WORDS:
            return v.replace('\xa0', ' ').strip(' :')
    for lb in labels:  # '판매상사 : (주)안모터스' 처럼 한 줄에 라벨과 값
        key = lb.rstrip(' :')
        for l in L:
            m = re.match(rf'^{re.escape(key)}\s*:\s*(.+)$', l)
            if m:
                return m.group(1).strip()
    return None


def short_region(addr: str | None) -> str | None:
    if not addr:
        return None
    a = addr
    for full, short in REGION_SHORT:
        a = a.replace(full, short)
    m = re.match(r'^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)\s*([가-힣]+?(?:시|군|구))', a)
    if m:
        return f'{m.group(1)} {m.group(2)}'
    parts = a.split()
    return ' '.join(parts[:2]) or None


LABEL_WORDS = {'상사전화', '소속조합', '조합전화', '주소', '연락처', '보유차량', '사원증번호', '판매자', '상사주소', '구매/상담문의', '닫기', '업체명 :', '성명 :'}
FUELS = {'휘발유', '가솔린', '경유', '디젤', 'LPG', 'LPI', '하이브리드', '전기', '수소', 'CNG', '가솔린+전기', '디젤+전기', 'LPG+전기'}
PLATE = re.compile(r'^\d{2,3}\s?[가-힣]\s?\d{4}$')


def sold_of(h: str) -> bool:
    """'판매중인 차량이 아닙니다' 문구가 숨김(dp_none·display:none) 상자 안이면 판매중으로 본다."""
    for m in re.finditer(r'판매중인 차량이 아닙니다|판매가 완료된 차량', h):
        before = h[max(0, m.start() - 300):m.start()]
        if not re.search(r'dp_none|display\s*:\s*none|hidden', before[-200:], re.I):
            return True
    return False


def parse_title(L: list[str]) -> tuple[str, str | None, str | None, str | None]:
    """'[기아] 오피러스프리미엄 GH270' / '기아 봉고Ⅲ화물 내장탑차 1톤 킹캡' → (원문, 제조사, 모델, 등급)"""
    for l in L:
        m = re.match(r'^\[([^\]]{1,20})\]\s*(.+)$', l.replace('\xa0', ' '))
        if m:
            rest = m.group(2).split()
            return l, m.group(1).strip(), (rest[0] if rest else None), (' '.join(rest[1:]) or None)
    for i, l in enumerate(L):  # 한국연합 carView: 제목 바로 다음 줄이 '2008.11 / 348,533Km 주행 / 경유'
        if re.match(r'^\d{2,4}[./]\d{1,2}\s*/', l) and i > 0:
            p = L[i - 1].split()
            return L[i - 1], (p[0] if p else None), (p[1] if len(p) > 1 else None), (' '.join(p[2:]) or None)
    for i, l in enumerate(L):  # 제목 다음 줄이 '￦' 또는 '950만원' 인 화면
        if i > 0 and (l == '￦' or re.fullmatch(r'[\d,]+\s*만원', l)) and re.search(r'[가-힣A-Za-z]', L[i - 1]) and len(L[i - 1].split()) >= 2:
            p = L[i - 1].split()
            return L[i - 1], p[0], p[1], (' '.join(p[2:]) or None)
    return '', None, None, None


def price_near_title(L: list[str], title: str) -> tuple[int | None, str]:
    start = L.index(title) if title in L else 0
    win = L[start:start + 40]
    for i, l in enumerate(win):
        m = re.search(r'([\d,]{2,})\s*</?\w*.*?만원', l)  # '<span ...>470</span> 만원' 이 글자로 남는 경우
        if m:
            return price_krw(m.group(1) + '만원')
        if l == '만원' and i > 0 and re.fullmatch(r'[\d,]+', win[i - 1]):
            return price_krw(win[i - 1] + '만원')
        if re.fullmatch(r'[\d,]+\s*만원', l):
            return price_krw(l)
        if re.search(r'가격\s*문의|상담', l):
            return None, '가격 상담'
    return None, '가격 상담'


def read(url: str):
    site = site_of(url)
    if not site:
        raise ValueError('등록된 조합·매매단지 전산 사이트가 아니에요')
    fam = site['family']
    if not is_detail(url, fam):
        raise ValueError('매물 상세 화면 주소가 아니에요(목록·메인 주소 대신 매물을 연 화면의 주소를 넣어 주세요)')
    h = fetch(url, encoding=site.get('encoding'))
    L = [l.replace('\xa0', ' ').strip() for l in text_lines(h)]
    title, make, model, trim = parse_title(L)
    if not title:
        raise ValueError('매물 정보를 찾지 못했어요(판매 종료 또는 주소 확인)')
    y, fr = year_month(first(L, '최초등록일', '연식', '최초등록'))
    p, disp = price_near_title(L, title)
    lien = first(L, '압류/저당')
    lien_v = None
    if lien:
        a, _, b = lien.partition('/')
        lien_v = yes_no_unknown(a.strip(), b.strip())
    else:
        lien_v = yes_no_unknown(first(L, '압류'), first(L, '저당'))
    addr = first(L, '상사주소', '주소')
    dealer = first(L, '성명 :', '판매자', '성명', '판매자정보')
    if dealer and (re.search(r'\d{3}', dealer) or len(dealer) > 12):
        dealer = None
    shop = first(L, '소속상사', '상사명', '상사', '업체명 :', '판매상사')
    if shop:
        shop = re.sub(r'\(\s*[\d-]{7,}\s*\)', '', shop).strip()
    sold = sold_of(h)
    if shop and not dealer:  # 카매니저 전산: 요약 상자에 '상사명 / 딜러 / 전화' 순서
        for i, l in enumerate(L[:-1]):
            if l == shop and re.fullmatch(r'[가-힣]{2,4}', L[i + 1]):
                dealer = L[i + 1]
                break
    union = first(L, '소속조합', '조합정보')
    complex_ = site.get('complex') or next((x.strip() for x in re.split(r'[(),#]', addr or '') if re.search(r'단지|오토|몰|매매장|센타|센터|타워|월드|갤러리|파크|랜드', x) and len(x.strip()) <= 20), None)
    fields = {
        'category': category_of(title, first(L, '차종')),
        'plate_no': next((v for v in [first(L, '차량번호', '차량 번호')] if v and PLATE.match(v)), None) or next((l for l in L if PLATE.match(l)), None),
        'make': make, 'model': model, 'trim': trim, 'year': y, 'first_reg': fr,
        'mileage_km': to_int(first(L, '주행거리')), 'fuel': fuel(first(L, '연료') or next((v for v in [first(L, '차종')] if v in FUELS), None)), 'transmission': gear(first(L, '변속기')),
        'ext_color': first(L, '색상'), 'displacement_cc': to_int(first(L, '배기량')), 'body_type': next((v for v in [first(L, '차종')] if v and v not in FUELS), None),
        'price_krw': p, 'price_display': disp, 'status': '판매완료' if sold else None, 'lien': lien_v,
        'seller_type': '딜러', 'dealer_name': f'{dealer} 딜러' if dealer else None, 'shop_name': strip_corp(shop),
        'complex': complex_, 'region': short_region(addr) or site.get('region_short'),
        'contact': first(L, '연락처', '발급기관 :') or next((l for l in L if re.fullmatch(r'01[016789]-?\d{3,4}-?\d{4}', l)), None),
        'dealer_reg_no': first(L, '사원증번호', '사원증.No', '사원증번호 :', '종사원번호'),
        'presentation_no': first(L, '제시번호'),
    }
    photos = photos_of(h, url, fam)
    meta = {'site_name': site['name'], 'family': fam, 'union': union or site.get('union'), 'federation': site.get('federation')}
    note = f"{site['name']}({fam_name(fam)}) 공개 매물 화면에서 읽음" + (' · 판매가 끝난 매물' if sold else '')
    return fields, photos, url, note, meta


EMI_REL = re.compile(r'["\'](/+data/+(?!__)[^"\'\s)]+?_\d+\.(?:jpe?g|png))', re.I)
CARPHOTO = re.compile(r'img_url=(https?://[^"\'\s&)]+/carphoto/[^"\'\s&)]+?\.(?:jpe?g|png))', re.I)


def photos_of(h: str, url: str, fam: str) -> list[str]:
    """원본 사진 주소(가공 없음). 순서는 화면 순서, 한국연합 전산은 _번호 순."""
    from urllib.parse import urljoin
    found = list(PHOTO[fam].findall(h))
    if fam == 'emi':
        found += [urljoin(url, u) for u in EMI_REL.findall(h)]
        found += CARPHOTO.findall(h)  # 모또 등: /imageview.html?img_url=…/carphoto/original/…
    out: list[str] = []
    for u in found:
        u = u.replace('http://', 'https://') if 'koreacarmarket' in u else u
        u = re.sub(r'(?<!:)/{2,}', '/', u)
        if u not in out:
            out.append(u)
    def order(u: str) -> int:
        m = re.search(r'(?:_|R)(\d+)\.\w+$', u)
        return int(m.group(1)) if m else 0
    if fam == 'emi':
        out.sort(key=order)
    return out


def fam_name(f: str) -> str:
    return {'carku': '전국연합 전산', 'emi': '한국연합 전산', 'aton': '카매니저 전산'}.get(f, f)
