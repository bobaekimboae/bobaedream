"""사이트별 추출기. 각 함수는 (fields, photo_urls, referer)를 돌려준다.

fields 키는 매물 원장 키(시트 20_매물원장_필드). 사이트가 공개 페이지에 보여 주는 값만 쓴다.
사이트 내부 API를 흉내 내거나 헤더를 꾸미지 않는다.
"""
from __future__ import annotations

import json
import re
from urllib.parse import parse_qs, urlparse

from common import (balanced_json, category_of, fetch, fuel, gear, label_value, price_krw, strip_corp, text_lines,
                    to_int, year_month, yes_no_unknown)


def detect(url: str) -> str | None:
    host = urlparse(url).netloc.lower()
    if 'encar.com' in host:
        return 'encar'
    if 'seoulautogallery.com' in host:
        return 'seoulautogallery'
    if 'charancha.com' in host:
        return 'charancha'
    if 'koreacarmarket.com' in host:
        return 'koreacarmarket'
    if 'm-park.co.kr' in host:
        return 'mpark'
    from johap import site_of
    if site_of(url):          # 전국 조합·매매단지 홈페이지(complex_sites.json)
        return 'johap'
    return None


SITE_NAME = {'encar': '엔카', 'seoulautogallery': '서울오토갤러리', 'charancha': '차란차', 'koreacarmarket': '코리아카마켓', 'mpark': '엠파크', 'johap': '조합·매매단지'}


# ── 엔카: 공개 매물 화면이 쓰는 읽기 API(readside) ──
def encar(url: str):
    q = parse_qs(urlparse(url).query)
    m = re.search(r'(?:carid=|/detail/|/vehicle/)(\d{6,})', url, re.I)
    car_id = (q.get('carid') or q.get('carId') or [None])[0] or (m.group(1) if m else None)
    if not car_id:
        raise ValueError('엔카 매물 번호(carid)를 찾지 못했어요')
    d = json.loads(fetch(f'https://api.encar.com/v1/readside/vehicle/{car_id}'))
    cat, spec, adv = d.get('category', {}), d.get('spec', {}), d.get('advertisement', {})
    dealer = (d.get('partnership') or {}).get('dealer') or {}
    contact = d.get('contact') or {}
    y, fr = year_month(cat.get('yearMonth'))
    p, disp = price_krw(adv.get('price'))
    seize = (d.get('condition') or {}).get('seizing') or {}
    lien = None
    if seize:
        lien = '있음' if (seize.get('seizingCount') or 0) + (seize.get('pledgeCount') or 0) > 0 else '없음'
    fields = {
        'category': category_of(cat.get('modelName'), spec.get('bodyName')), 'plate_no': d.get('vehicleNo'), 'vin': d.get('vin'),
        'make': cat.get('manufacturerName'), 'model': cat.get('modelGroupName') or cat.get('modelName'),
        'generation': cat.get('gradeDetailName'), 'trim': cat.get('gradeName'),
        'year': to_int(cat.get('formYear')) or y, 'first_reg': fr,
        'mileage_km': to_int(spec.get('mileage')), 'fuel': fuel(spec.get('fuelName')), 'transmission': gear(spec.get('transmissionName')),
        'ext_color': spec.get('colorName'), 'seats': to_int(spec.get('seatCount')), 'displacement_cc': to_int(spec.get('displacement')),
        'price_krw': p, 'price_display': disp, 'new_price_krw': (to_int(cat.get('originPrice')) or 0) * 10000 or None,
        'lien': lien, 'official_import': '정식 출고' if cat.get('importType') == 'REGULAR_IMPORT' else None,
        'seller_type': '딜러' if contact.get('userType') == 'DEALER' else '개인' if contact.get('userType') else None,
        'dealer_name': f"{dealer['name']} 딜러" if dealer.get('name') else None,
        'shop_name': strip_corp(((dealer.get('firm') or {}).get('name'))),
        'region': ' '.join((contact.get('address') or '').split()[:2]) or None,
        'contact': contact.get('no'),
    }
    photos = [f"https://ci.encar.com{p['path']}" for p in sorted(d.get('photos') or [], key=lambda x: x.get('code', ''))]
    return fields, photos, 'https://fem.encar.com/'


# ── 서울오토갤러리: 매물 상세 HTML(라벨/값). 차량 사진은 공개 페이지에 없음 ──
def seoulautogallery(url: str):
    h = fetch(url)
    L = text_lines(h)
    title = re.search(r'class="cartitle">([^<]+)', h)
    t = re.sub(r'&nbsp;|\s+', ' ', title.group(1)).strip() if title else ''
    m = re.match(r'\[([^\]]+)\]\s*((?:(?:더|올|뉴|디|신형)\s+)*[^( ]+)(?:\(([^)]+)\))?\s*(.*)', t)
    y, fr = year_month(label_value(L, '연식'))
    p, disp = price_krw(label_value(L, '차량가격'))
    addr = label_value(L, '상사주소') or ''
    shop = label_value(L, '소속상사')
    dealer = None
    for i, l in enumerate(L):
        if l == '사원증번호' and i > 0:
            dealer = L[i - 1]
            break
    fields = {
        'category': category_of(t), 'plate_no': label_value(L, '차량번호'),
        'make': m.group(1) if m else None, 'model': m.group(2) if m else None,
        'generation': m.group(3) if m else None, 'trim': (m.group(4).strip() if m else t) or None,
        'year': y, 'first_reg': fr, 'mileage_km': to_int(label_value(L, '주행거리')),
        'fuel': fuel(label_value(L, '연료')), 'transmission': gear(label_value(L, '변속기')),
        'ext_color': label_value(L, '색상'), 'displacement_cc': (to_int(label_value(L, '배기량')) or None),
        'price_krw': p, 'price_display': disp,
        'lien': yes_no_unknown(label_value(L, '압류'), label_value(L, '저당')),
        'seller_type': '딜러', 'dealer_name': f'{dealer} 딜러' if dealer else None, 'shop_name': strip_corp(shop), 'complex': '서울오토갤러리',
        'dealer_reg_no': label_value(L, '사원증번호'),
        'region': ' '.join(addr.replace('서울특별시', '서울').split()[:2]) or '서울 서초구',
        'contact': label_value(L, '연락처'), 'presentation_no': label_value(L, '제시번호'),
    }
    note = '사이트 공개 페이지에 차량 사진이 없음(딜러 올리기 필요). 주행거리는 사이트 표기(만 단위 축약)라 약값'
    return fields, [], url, note


# ── 차란차: 공개 페이지 HTML 안 데이터(Next.js RSC) + 대표 사진 ──
def charancha(url: str):
    h = fetch(url)
    chunks = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)', h, flags=re.S)
    s = ''.join(json.loads('"' + c + '"') for c in chunks)
    i = s.find('"carName"')
    if i < 0:
        raise ValueError('차란차 매물 정보를 찾지 못했어요(판매 종료 또는 주소 확인)')
    d = balanced_json(s, s.rfind('{', 0, i)) or {}
    y, fr = year_month(d.get('firstRegisteredAt'))
    p, disp = price_krw(d.get('sellPrice'))
    fields = {
        'category': category_of(d.get('carName'), d.get('carTypeName')), 'plate_no': d.get('carNumber'),
        'make': d.get('makerName'), 'model': d.get('modelName'),
        'generation': d.get('modelDetailName') if d.get('modelDetailName') != d.get('modelName') else None,
        'trim': ' '.join(x for x in [d.get('gradeName'), d.get('gradeDetailName')] if x) or None,
        'year': to_int(d.get('releaseYear')) or y, 'first_reg': fr, 'mileage_km': to_int(d.get('mileage')),
        'fuel': fuel(d.get('fuelName')), 'transmission': gear(d.get('transmissionName')),
        'ext_color': d.get('colorName'), 'body_type': d.get('bodyTypeName'),
        'displacement_cc': None if fuel(d.get('fuelName')) == '전기' else to_int(d.get('displacement')),
        'price_krw': p, 'price_display': disp,
        'lien': yes_no_unknown(d.get('seizureEnabled'), d.get('mortgageEnabled')),
        'seller_type': '딜러' if d.get('dealerInfo') else None, 'region': d.get('regionName'),
        'contact': d.get('virtualNumber'), 'presentation_no': d.get('reportNumber'),
        'status': {'SOLD': '판매완료', 'SOLD_OUT': '판매완료'}.get(str((d.get('status') or {}).get('code') if isinstance(d.get('status'), dict) else d.get('status')), None),
    }
    og = re.search(r'property="og:image" content="([^"]+)"', h)
    note = '사진은 공개 페이지의 대표 1장만(나머지는 딜러 올리기). 딜러 이름은 공개 페이지 데이터에 없음'
    return fields, [og.group(1)] if og else [], url, note


# ── 코리아카마켓(한국연합): 매물 상세 HTML(EUC-KR) ──
def koreacarmarket(url: str):
    h = fetch(url, encoding='cp949')
    L = text_lines(h)
    t = re.search(r'<title>\s*([^<>]+?)\s*>', h)
    title = t.group(1).strip() if t else ''
    parts = title.split()
    y, fr = year_month(label_value(L, '연식'))
    price = next((l for l in L if re.fullmatch(r'[\d,]+\s*만원', l)), None) or ('상담' if '가격문의' in L else None)
    p, disp = price_krw(price)
    addr = label_value(L, '주소') or ''
    fields = {
        'category': category_of(title), 'plate_no': label_value(L, '차량번호'),
        'make': parts[0] if parts else None, 'model': parts[1] if len(parts) > 1 else None,
        'trim': ' '.join(parts[2:]) or None, 'year': y, 'first_reg': fr,
        'mileage_km': to_int(label_value(L, '주행거리')), 'fuel': fuel(label_value(L, '연료')), 'transmission': gear(label_value(L, '변속기')),
        'ext_color': label_value(L, '색상'), 'displacement_cc': (to_int(label_value(L, '배기량')) or None),
        'price_krw': p, 'price_display': disp, 'seller_type': '딜러',
        'dealer_name': f"{label_value(L, '이름')} 딜러" if label_value(L, '이름') else None,
        'shop_name': strip_corp(label_value(L, '상사명')), 'region': ' '.join(addr.split()[:2]) or None,
        'complex': next((x.strip() for x in re.split(r'[(),]', addr) if re.search(r'단지|센타|센터|타워|월드|오토', x)), None),
        'contact': label_value(L, '연락처'), 'dealer_reg_no': label_value(L, '종사원번호'), 'presentation_no': label_value(L, '제시번호'),
    }
    photos = []
    for u in re.findall(r'(https?://[^"\s]+?\.(?:jpg|jpeg|png))(?:__THUM)?"', h, flags=re.I):
        u = u.replace('http://', 'https://')
        if '/data/' in u and u not in photos:
            photos.append(u)
    return fields, photos, url


# ── 엠파크: 공개 페이지가 그리는 데이터(window.__NUXT__)를 브라우저 안에서 읽음 ──
def mpark(url: str):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page()
        pg.goto(url, wait_until='domcontentloaded', timeout=45000)
        data = pg.evaluate("() => { const n = window.__NUXT__; const d = (n && (n.data || [])).find(x => x && x.summaryItem) || {}; return JSON.parse(JSON.stringify({ title: document.title, summary: d.summaryItem, basic: d.basicItem, seller: d.sellerItem, company: d.placeItem || d.companyUnionInfoItem, images: d.imageItems, check: d.checkItem, total: d.totalCostItem, start: (d.smsItems || {}).yymm })) }")
        b.close()
    s, bs, sl, co = data.get('summary') or {}, data.get('basic') or {}, data.get('seller') or {}, data.get('company') or {}
    title = (s.get('name') or data.get('title') or '').split('|')[0].strip()
    parts = title.split()
    p, disp = price_krw((data.get('total') or {}).get('price') or s.get('price'))
    fields = {
        'category': category_of(title, bs.get('type')), 'plate_no': bs.get('no'),
        'make': parts[0] if parts else None, 'model': ' '.join(parts[1:3]) if len(parts) > 2 else (parts[1] if len(parts) > 1 else None),
        'trim': ' '.join(parts[3:]) or None, 'year': to_int(s.get('year') or bs.get('year')),
        'first_reg': year_month(bs.get('year'))[1] or (f"{to_int(s.get('year'))}-{s.get('month')}" if s.get('year') and s.get('month') else None),
        'mileage_km': to_int(s.get('mileage') or bs.get('mileage')), 'fuel': fuel(s.get('fuel') or bs.get('fuel')), 'transmission': gear(bs.get('gear')),
        'ext_color': bs.get('color'), 'displacement_cc': to_int(bs.get('displacement')), 'body_type': bs.get('type'),
        'price_krw': p, 'price_display': disp,
        'lien': yes_no_unknown(bs.get('seizure'), bs.get('mortgage')),
        'seller_type': '딜러', 'dealer_name': f"{sl['name']} 딜러" if sl.get('name') else None,
        'shop_name': strip_corp(co.get('companyName')), 'complex': '엠파크',
        'region': ' '.join(str(co.get('companyAddress') or '').replace('인천광역시', '인천').replace('서울특별시', '서울').replace('경기도', '경기').split()[:2]) or None,
        'contact': s.get('phone'), 'dealer_reg_no': sl.get('no'),
    }
    imgs = data.get('images') or []
    photos = [i if isinstance(i, str) else (i.get('url') or i.get('imageUrl')) for i in imgs]
    return fields, [u for u in photos if u], url


def johap(url: str):
    from johap import read
    return read(url)


ADAPTERS = {'encar': encar, 'seoulautogallery': seoulautogallery, 'charancha': charancha, 'koreacarmarket': koreacarmarket, 'mpark': mpark, 'johap': johap}
