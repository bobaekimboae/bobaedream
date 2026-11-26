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

from common import category_of, fetch, fuel, gear, label_value, price_krw, split_model, strip_corp, text_lines, to_int, year_month, yes_no_unknown

REGISTRY = json.loads((Path(__file__).with_name('complex_sites.json')).read_text(encoding='utf-8'))
SITES = {s['domain']: s for s in REGISTRY['sites']}

DETAIL = {
    'carku': re.compile(r'/car/car_detail\.html\?.*DemoNo=\w+', re.I),
    'emi': re.compile(r'/car/(?:carView|car_detail)\.html\?.*(?:m_no|c_no)=\d+', re.I),
    'aton': re.compile(r'/Model/DetailView\.asp\?.*(?:encOnCarNo=\w+|OnCarNo=\d+)', re.I),
    'attedit': re.compile(r'/(?:carSearch|buy)/(?:detail|detailView)\.asp\?.*DemoNo=\w+', re.I),
    'autobegins': re.compile(r'/buy/view\.do\?.*m_no=\d+', re.I),
    'generic': None,  # 단지마다 다른 자체 화면: 등록부(complex_sites.json)의 detail·photo 정규식으로 읽는다
}
PHOTO = {
    'carku': re.compile(r'https?://photo\.korea-usedcar\.co\.kr/carphoto/large/[^"\'\s)]+?\.(?:jpe?g|png)', re.I),
    'emi': re.compile(r'https?://[\w.-]+/+data/+(?!__)[^"\'\s)]+?_\d+\.(?:jpe?g|png)', re.I),
    'aton': re.compile(r'https?://img\.carmanager\.co\.kr/[^"\'\s)]+?\.(?:jpe?g|png)', re.I),
    'attedit': re.compile(r'/AttEdit/(?:photo|CarPhoto)/(?:Large|large|Small|small)/[^"\'\s)]+?R\d+\.(?:jpe?g|png)', re.I),
    'autobegins': re.compile(r'/uploadFiles/CAR_PHOTO/\d{3}/\d{3}/\d{3}/[^"\'\s)]+?_\d+(?:_s)?\.(?:jpe?g|png)', re.I),
}
REGION_SHORT = [('서울특별시', '서울'), ('부산광역시', '부산'), ('대구광역시', '대구'), ('인천광역시', '인천'), ('광주광역시', '광주'),
                ('대전광역시', '대전'), ('울산광역시', '울산'), ('세종특별자치시', '세종'), ('경기도', '경기'), ('강원특별자치도', '강원'),
                ('강원도', '강원'), ('충청북도', '충북'), ('충청남도', '충남'), ('전북특별자치도', '전북'), ('전라북도', '전북'),
                ('전라남도', '전남'), ('경상북도', '경북'), ('경상남도', '경남'), ('제주특별자치도', '제주')]


def host_of(url: str) -> str:
    return urlparse(url).netloc.lower().removeprefix('www.').removeprefix('m.')


def site_of(url: str) -> dict | None:
    s = SITES.get(host_of(url))
    if s and s.get('family') == 'generic' and not s.get('detail'):
        return None
    return s if s and s.get('family') in DETAIL else None


def is_detail(url: str, family: str, site: dict | None = None) -> bool:
    if family == 'generic':
        return bool(re.search((site or {}).get('detail') or r'(?!)', url, re.I))
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
    return None  # 시·도로 시작하지 않는 값(사이트 이름 등)은 지역으로 쓰지 않는다


LABEL_WORDS = {'이름', '차량명', '차량번호', '변속기', '배기량', '색상', '종사원번호', '전화번호', '연식', '주행거리', '연료', '최초등록일',
               '사고여부', '압류/저당', '세금미납', '제시번호', '상사전화', '소속조합', '조합전화', '주소', '연락처', '보유차량', '사원증번호', '판매자', '상사주소', '구매/상담문의', '닫기', '업체명 :', '성명 :'}
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
        if m and m.group(1).strip().upper() not in ('TIP', '안내', '알림', '공지'):
            mo, tr = split_model(m.group(2).split())
            return l, m.group(1).strip(), mo, tr
    for i, l in enumerate(L):  # 한국연합 carView: 제목 바로 다음 줄이 '2008.11 / 348,533Km 주행 / 경유'
        if re.match(r'^\d{2,4}[./]\d{1,2}\s*/', l) and i > 0:
            p = L[i - 1].split()
            mo, tr = split_model(p[1:])
            return L[i - 1], (p[0] if p else None), mo, tr
    for i, l in enumerate(L):  # 제목 다음 줄이 '￦' 또는 '950만원' 인 화면
        if i > 0 and (l == '￦' or re.fullmatch(r'[\d,]+\s*만원', l)) and re.search(r'[가-힣A-Za-z]', L[i - 1]) and len(L[i - 1].split()) >= 2:
            p = L[i - 1].split()
            mo, tr = split_model(p[1:])
            return L[i - 1], p[0], mo, tr
    return '', None, None, None


TRUCK_CATS = {'중대형화물', '소형화물', '화물', '특장', '특장차', '버스', '승합', '트럭', '건설기계', '캠핑카'}
TRUCK_MAKE = [('메가트럭', '현대'), ('마이티', '현대'), ('포터', '현대'), ('엑시언트', '현대'), ('트라고', '현대'), ('파비스', '현대'),
              ('뉴파워트럭', '현대'), ('카운티', '현대'), ('에어로', '현대'), ('유니버스', '현대'), ('봉고', '기아'), ('라이노', '기아'),
              ('그랜버드', '기아'), ('프리마', '타타대우'), ('노부스', '타타대우'), ('맥쎈', '타타대우'), ('구쎈', '타타대우'), ('더쎈', '타타대우'),
              ('스카니아', '스카니아'), ('볼보', '볼보'), ('만트럭', '만(MAN)'), ('이베코', '이베코')]


def truck_make(text: str) -> str | None:
    return next((mk for k, mk in TRUCK_MAKE if k in text.replace(' ', '')), None)


def title_of(fam: str, h: str, L: list[str]):
    title, make, model, trim = _title_of(fam, h, L)
    if make and make in TRUCK_CATS:  # 카매니저 전산 화물: '[중대형화물] 카고(4.5~5톤) 메가트럭5톤' — 괄호 안은 차종, 제조사는 모델 이름으로
        cat_model = ' '.join(x for x in [model, trim] if x)
        return title, truck_make(cat_model), model, trim
    return title, make, model, trim


def _title_of(fam: str, h: str, L: list[str]):
    if fam == 'aton':  # 카매니저 새 화면(전북카·제주카): '등록일 : …' 다음 줄이 제조사 / 모델 / 등급
        for i, l in enumerate(L[:-3]):
            if l.startswith('등록일') and re.fullmatch(r'[가-힣A-Za-z()]{1,12}', L[i + 1]) and '판매가' in ' '.join(L[i + 2:i + 6]):
                mo, tr = split_model(L[i + 2].split())
                trim_line = L[i + 3] if not L[i + 3].startswith('판매가') else None
                tr = ' '.join(x for x in [tr, trim_line] if x) or None
                return ' '.join(L[i + 1:i + 3 + (1 if trim_line else 0)]), L[i + 1], mo, tr
        one = r'[가-힣A-Za-z()]{1,12}'
        for i, l in enumerate(L[2:-1], start=2):  # 서울강남중고차 '제조사 / 모델 등급 / 차량번호 :' · 서울조합 '제조사 / 모델 / 등급 / 차량번호 :'
            if not (l.startswith('차량번호') and '판매가' in ' '.join(L[i + 1:i + 5])):
                continue
            if re.fullmatch(one, L[i - 2]):
                mo, tr = split_model(L[i - 1].split())
                return f'{L[i - 2]} {L[i - 1]}', L[i - 2], mo, tr
            if i >= 3 and re.fullmatch(one, L[i - 3]):
                mo, tr = split_model(L[i - 2].split())
                tr = ' '.join(x for x in [tr, L[i - 1]] if x) or None
                return f'{L[i - 3]} {L[i - 2]} {L[i - 1]}', L[i - 3], mo, tr
    if fam == 'autobegins':  # 공유 상자에 쓰는 title : '르노(삼성) SM6 2.0 GDe RE'
        m = re.search(r"title\s*:\s*'([^']{3,80})'", h)
        if m:
            p = m.group(1).split()
            mo, tr = split_model(p[1:])
            return m.group(1), p[0], mo, tr
    if fam == 'attedit':
        mk, nm = first(L, '제조사'), first(L, '차량명')
        if nm:  # 도이치오토월드·강서오토플렉스: 제조사 / 차량명 칸(제조사 칸이 빈 매물도 있다 → 차량 기준표가 모델 이름으로 찾음)
            mo, tr = split_model(nm.split())
            return ' '.join(x for x in [mk, nm] if x), mk, mo, tr
        for i, l in enumerate(L):  # 서서울모터리움: '상세보기' 다음 줄이 '제조사 모델 등급'
            if l == '상세보기' and i + 1 < len(L) and len(L[i + 1].split()) >= 2:
                p = L[i + 1].split()
                mo, tr = split_model(p[1:])
                return L[i + 1], p[0], mo, tr
    if fam == 'generic':
        for i, l in enumerate(L[:-1]):  # 깨끗한자동차: '[현대]' 한 줄 다음 줄이 '모델 등급'
            m = re.fullmatch(r'\[([^\]]{1,12})\]', l)
            if m and len(L[i + 1].split()) >= 1 and not L[i + 1].startswith(('판매', '차량', '#')) and m.group(1) not in ('한줄광고', '안내사항', '장착', '미장착', 'TIP'):
                mo, tr = split_model(L[i + 1].split())
                return f'{m.group(1)} {L[i + 1]}', m.group(1), mo, tr
        for i, l in enumerate(L[2:], start=2):  # 대전오토몰: '현대 스타리아  (21년~현재) / 디젤 2WD 카고 3인승 / 2022년 10월(2023년식)'
            if re.match(r'^\d{2,4}년\s*\d{1,2}월', l) and len(L[i - 2].split()) >= 2 and not re.search(r'\d{2,4}년', L[i - 2]):  # KC월드카프라자: 'BMW X6 (G06) / M50i / 21년 02월'
                head = re.sub(r'\s*\([^)]*\)', '', L[i - 2]).split()
                mo, tr = split_model(head[1:])
                tr = ' '.join(x for x in [tr, L[i - 1]] if x) or None
                return f'{L[i - 2]} {L[i - 1]}', head[0], mo, tr
        for i, l in enumerate(L[1:], start=1):  # 원주 태평양: 제목 다음 줄들에 '할부가능' / '차량가격'
            if l in ('할부가능', '차량가격', '판매가격') and len(L[i - 1].split()) >= 2 and re.search(r'[가-힣A-Za-z]', L[i - 1]) and not re.match(r'\d', L[i - 1]):
                p = L[i - 1].split()
                mo, tr = split_model(p[1:])
                return L[i - 1], p[0], mo, tr
        kind = first(L, '차종')  # 카서울닷컴: 차종 칸에 '볼보  EX90  Twin Motor Perf 6s'
        if kind and len(kind.split()) >= 2:
            p = kind.split()
            mo, tr = split_model(p[1:])
            return ' '.join(p), p[0], mo, tr
    return parse_title(L)


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
    if not is_detail(url, fam, site):
        raise ValueError('매물 상세 화면 주소가 아니에요(목록·메인 주소 대신 매물을 연 화면의 주소를 넣어 주세요)')
    q = parse_qs(urlparse(url).query)
    if site.get('post'):  # 카서울닷컴: 목록 화면에서 받은 세션으로, 목록의 공개 폼을 그대로 보내야 상세가 열린다
        warm = site['post']['warm']
        fetch(warm, encoding=site.get('encoding'))
        h = fetch(url, encoding=site.get('encoding'), referer=warm, data=site['post'].get('data') or {})
    elif fam == 'aton' and 'OnCarNo' in q and 'encOnCarNo' not in q:
        # 서울조합·서울강남: 주소 그대로(GET) 열림. 충북카·인천차: 목록에서 OnCarNo 를 폼(POST)으로 보낸다 → 안 열리면 같은 공개 폼을 보낸다.
        h = fetch(url, encoding=site.get('encoding'))
        if not title_of(fam, h, [l.replace('\xa0', ' ').strip() for l in text_lines(h)])[0]:
            base = url.split('?', 1)[0]
            h = fetch(base, encoding=site.get('encoding'), referer=f"{urlparse(url).scheme}://{urlparse(url).netloc}/model/NewModel.asp", data={'OnCarNo': q['OnCarNo'][0]})
    else:
        h = fetch(url, encoding=site.get('encoding'))
    L = [l.replace('\xa0', ' ').strip() for l in text_lines(h)]
    title, make, model, trim = title_of(fam, h, L)
    if not title:
        raise ValueError('매물 정보를 찾지 못했어요(판매 종료 또는 주소 확인)')
    y, fr = year_month(first(L, '최초등록일', '연식', '최초등록'))
    if fam == 'generic':  # '2023 년식 / 최초등록일: 2022-08-24'
        yv = first(L, '연식') or ''
        mfr = re.search(r'최초등록일\s*:?\s*(\d{4}[-./]\d{1,2})', yv)
        if mfr:
            fr = year_month(mfr.group(1))[1]
            y = to_int(re.match(r'\d{4}', yv).group(0)) if re.match(r'\d{4}', yv) else y
    if not y and '년형|등록' in L:  # 카매니저 새 화면: '년형|등록 / 2024 / 년형 | / 2023.08'
        i = L.index('년형|등록')
        my = to_int(L[i + 1]) if i + 1 < len(L) else None
        fy, ffr = year_month(L[i + 3]) if i + 3 < len(L) else (None, None)
        y, fr = (my or fy), ffr
    fam_price_done = False
    p, disp = (None, '가격 상담') if fam in ('attedit', 'autobegins') else price_near_title(L, title)
    if fam == 'attedit':  # 강서오토플렉스·오토허브: 가격 상자(reckoning) 안 '<b>4,750</b>만원' (할부 계산기 숫자보다 먼저)
        m = re.search(r'class="reckoning".{0,400}?<em>\s*<b>\s*([^<]{1,12}?)\s*</b>', re.sub(r'<!--.*?-->', '', h, flags=re.S), re.S)
        if m:
            reck = m.group(1).strip()
            p, disp = price_krw(reck + '만원') if re.fullmatch(r'[\d,]{2,}', reck) else (None, '가격 상담')
            fam_price_done = True
    if fam == 'generic' and p is None:
        pv = first(L, '차량가격', '판매가격', '판매가')
        if pv and re.fullmatch(r'[\d,]+', pv):  # 북부카: '판매가 / 2,500 / 만원'
            pv += '만원'
        if pv and re.search(r'\d', pv):
            p, disp = price_krw(pv.replace(' ', ''))
        elif pv:
            p, disp = None, '가격 상담'
    if p is None and '판매가 :' in L:
        i = L.index('판매가 :')
        if i + 1 < len(L) and re.fullmatch(r'[\d,]+', L[i + 1]):
            p, disp = price_krw(L[i + 1] + '만원')
    if p is None and not fam_price_done and fam in ('attedit', 'autobegins'):  # 단지 전산: 제목과 떨어진 '5,500 / 만원' 또는 '700만원'
        for i, l in enumerate(L):
            m = re.fullmatch(r'([\d,]{2,})\s*만원', l)
            num = m.group(1) if m else (L[i - 1] if l == '만원' and i and re.fullmatch(r'[\d,]{2,}', L[i - 1]) else None)
            if num:
                p, disp = price_krw(num + '만원')
                break
    lien = first(L, '압류/저당') or first(L, '압류|저당')
    lien_v = None
    if lien:
        a, _, b = lien.replace('|', '/').partition('/')
        lien_v = yes_no_unknown(a.strip(), b.strip())
    else:
        lien_v = yes_no_unknown(first(L, '압류'), first(L, '저당'))
    addr = first(L, '상사주소', '주소')
    dealer = first(L, '성명 :', '판매자명', '판매자', '성명', '판매자정보')
    if dealer and (re.search(r'\d{3}', dealer) or len(dealer) > 12):
        dealer = None
    shop = first(L, '소속상사', '상사명', '상사', '업체명 :', '업체명', '판매상사')
    if shop:
        shop = re.sub(r'\(\s*[\d-]{7,}\s*\)', '', shop).split(' / ')[0].strip(' |')
    sold = sold_of(h) or (fam == 'generic' and disp == '가격 상담' and (first(L, '판매가격', '차량가격') or '') == '판매완료')
    gen_fuel = None
    if fam == 'generic':
        raw = first(L, '성명', '판매자', '이름') or ''
        if ' / ' in raw:  # '(주)깨끗한 모터스 / 노정금'
            shop, dealer = shop or raw.split(' / ')[0], raw.split(' / ')[-1].strip()
        elif not dealer and re.fullmatch(r'[가-힣]{2,4}', raw):
            dealer = raw
        ms = next((re.sub(r'^판매상사\s*:\s*', '', l) for l in L if l.startswith('판매상사 :')), None)  # 북부카
        shop = first(L, '소속상사명', '매매상사') or ms or shop
        if shop:
            shop = re.split(r'\s*[|/]\s*', shop)[0].strip()
        if not dealer and '매장대표' in L:  # 대전오토몰: '최용석 / 매장대표'
            i = L.index('매장대표')
            dealer = L[i - 1] if re.fullmatch(r'[가-힣]{2,4}', L[i - 1]) else None
        if '판매자사진' in L:  # KC월드카프라자: '판매자사진 / 239,268호, 뉴히트,히트모터스 / 김재은'
            i = L.index('판매자사진')
            if i + 2 < len(L):
                shop = re.split(r'\s*,\s*', L[i + 1])[-1] or shop
                dealer = L[i + 2] if re.fullmatch(r'[가-힣]{2,4}', L[i + 2]) else dealer
        if '판매자 다른 매물 보기' in L:  # 대전오토몰: '2F 216 (주)서희디오토'
            i = L.index('판매자 다른 매물 보기')
            if i + 1 < len(L):
                shop = re.sub(r'^[\w-]*\d+F\s+\S+\s+', '', L[i + 1]) or shop
        mf = re.search(r'checked(?:="checked")?\s*>\s*<label class="on">\s*([^<]{2,8})\s*<', h)  # 연료 체크 상자
        gen_fuel = mf.group(1) if mf else None
    if fam == 'attedit' and not dealer:  # 도이치오토월드: 'photo' 다음 줄이 딜러, 그 뒤 전화·'상사 / 호수'
        for i, l in enumerate(L[:-1]):
            if l == 'photo' and re.fullmatch(r'[가-힣]{2,4}', L[i + 1]):
                dealer = L[i + 1]
                shop = shop or next((x.split(' / ')[0] for x in L[i + 2:i + 6] if ' / ' in x), None)
                break
    if fam == 'autobegins':  # 경동오토필드: <dt>상사  딜러 …</dt> 다음 '보유차량'
        m = re.search(r'<dt>\s*([^<]{2,40}?)\s*</dt>\s*(?:<[^>]+>\s*)*보유차량', h)
        if m:
            parts = re.split(r'\s{2,}', m.group(1).strip())
            shop = shop or parts[0]
            if len(parts) > 1 and not dealer:
                dealer = parts[1].split()[0]
        dealer_reg = next((L[i + 1] for i, l in enumerate(L[:-1]) if l == '매매사원증'), None)
    if shop and not dealer:  # 카매니저 전산: 요약 상자에 '상사명 / 딜러 / 전화' 순서
        for i, l in enumerate(L[:-1]):
            if l == shop and re.fullmatch(r'[가-힣]{2,4}', L[i + 1]) and L[i + 1] not in LABEL_WORDS:
                dealer = L[i + 1]
                break
    union = first(L, '소속조합', '조합정보', '조합명')
    if union:
        union = re.sub(r'\(\s*[\d-]*\s*\)|☎.*$', '', union).strip()
        if site['name'] in union or '조합' not in union:  # '전북카 ☎ …' 처럼 사이트 이름만 적힌 칸
            union = None
    if not addr:
        addr = next((l for l in L if re.match(r'^(서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|경기도|강원|충청|전라|전북|경상|제주)', l)), None)
    complex_ = site.get('complex') or next((x.strip() for x in re.split(r'[(),#]', addr or '') if re.search(r'단지|오토|몰|매매장|센타|센터|타워|월드|갤러리|파크|랜드', x) and len(x.strip()) <= 20), None)
    fields = {
        'category': category_of(title, first(L, '차종')),
        'plate_no': next((v for v in [first(L, '차량번호', '차량 번호')] if v and PLATE.match(v)), None) or next((l for l in L if PLATE.match(l)), None),
        'make': make, 'model': model, 'trim': trim, 'year': y, 'first_reg': fr,
        'mileage_km': to_int(first(L, '주행거리')), 'fuel': fuel(gen_fuel or first(L, '연료') or next((v for v in [first(L, '차종')] if v in FUELS), None)), 'transmission': gear(first(L, '변속기')),
        'ext_color': first(L, '색상'), 'displacement_cc': next((c for c in [to_int(first(L, '배기량'))] if c and c >= 50), None),  # '2.0 CC' 같은 리터 표기는 비움
        'body_type': next((v for v in [first(L, '차종')] if v and v not in FUELS and ' ' not in v.strip()), None),  # 차종 칸에 차 이름이 든 화면은 비움
        'price_krw': p, 'price_display': disp, 'status': '판매완료' if sold else None, 'lien': lien_v,
        'seller_type': '딜러', 'dealer_name': f'{dealer} 딜러' if dealer else None, 'shop_name': strip_corp(shop),
        'complex': complex_, 'region': short_region(addr) or site.get('region_short'),
        'contact': first(L, '연락처', '발급기관 :') or next((l for l in L if re.fullmatch(r'01[016789]-?\d{3,4}-?\d{4}', l)), None),
        'dealer_reg_no': first(L, '사원증번호', '사원증.No', '사원증번호 :', '종사원번호') or (dealer_reg if fam == 'autobegins' else None),
        'presentation_no': first(L, '제시번호'),
    }
    photos = photos_of(h, url, fam, site)
    meta = {'site_name': site['name'], 'family': fam, 'union': union or site.get('union'), 'federation': site.get('federation')}
    note = f"{site['name']}({fam_name(fam)}) 공개 매물 화면에서 읽음" + (' · 판매가 끝난 매물' if sold else '')
    return fields, photos, url, note, meta


EMI_REL = re.compile(r'["\'](/+data/+(?!__)[^"\'\s)]+?_\d+\.(?:jpe?g|png))', re.I)
CARPHOTO = re.compile(r'img_url=(https?://[^"\'\s&)]+/carphoto/[^"\'\s&)]+?\.(?:jpe?g|png))', re.I)


def photos_of(h: str, url: str, fam: str, site: dict | None = None) -> list[str]:
    """원본 사진 주소(가공 없음). 순서는 화면 순서, 한국연합 전산은 _번호 순."""
    from urllib.parse import urljoin
    if fam == 'generic':  # 등록부의 photo 정규식 · photo_sub(작은 사진 → 원본 주소 바꾸기)
        hh = h.replace('\\/', '/').replace('\\https', 'https')
        ms = list(re.finditer((site or {}).get('photo') or r'(?!)', hh, re.I))
        if ms and ms[0].groups() and (site or {}).get('photo_group') == 'most':  # 대전오토몰: 이 매물 폴더(가장 많이 나온 폴더)만, 추천 매물 사진 제외
            from collections import Counter
            top = Counter(m.group(1) for m in ms).most_common(1)[0][0]
            ms = [m for m in ms if m.group(1) == top]
        found = [m.group(0) for m in ms]
        for a, b in (site or {}).get('photo_sub') or []:
            found = [re.sub(a, b, u) for u in found]
        found = [urljoin(url, u.replace('&amp;', '&')) for u in found]
    else:
        found = list(PHOTO[fam].findall(h))
    if fam == 'attedit':  # 상대 주소 · 큰 사진으로
        found = [urljoin(url, re.sub(r'/(?:Small|small)/', lambda m: '/Large/' if 'photo/' in u else '/large/', u)) for u in found]
    if fam == 'autobegins':  # 이 매물 번호 폴더만(추천 매물 사진 제외), 큰 사진으로
        mno = (parse_qs(urlparse(url).query).get('m_no') or ['0'])[0].zfill(9)
        own = f'/uploadFiles/CAR_PHOTO/{mno[:3]}/{mno[3:6]}/{mno[6:]}/'
        found = [urljoin(url, u.replace('_s.', '.')) for u in found if u.startswith(own)]
    if fam == 'aton':  # 서울강남중고차: 작은 사진(_TH)은 큰 사진으로 · 서울조합: 사이트 안 ../CARPHOTO/날짜/{매물번호}{순번}_1.jpg
        found = [re.sub(r'_TH(\.\w+)$', r'\1', u) for u in found]
        no = (parse_qs(urlparse(url).query).get('OnCarNo') or [''])[0]
        if no:
            found += [urljoin(url, u) for u in re.findall(rf'["\'](\.\./CARPHOTO/\d{{8}}/{no}\d{{1,2}}_1\.jpe?g)', h)]
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
    if fam in ('emi', 'attedit', 'autobegins'):
        out.sort(key=order)
    return out


def fam_name(f: str) -> str:
    return {'carku': '전국연합 전산', 'emi': '한국연합 전산', 'aton': '카매니저 전산', 'attedit': '단지 자체 전산(AttEdit)', 'autobegins': '단지 자체 전산(오토비긴즈)', 'generic': '단지 자체 화면'}.get(f, f)
