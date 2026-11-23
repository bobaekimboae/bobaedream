"""매물 가져오기 자동 시험(네트워크 없음). 실행: python3 scripts/listing_import/test_listing_import.py
실제 사이트 HTML은 차량번호·연락처가 들어 있어 커밋하지 않는다. 여기서는 같은 구조의 가짜 조각으로 시험한다.
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import balanced_json, build_ledger, category_of, label_value, price_krw, text_lines, to_int, year_month, yes_no_unknown  # noqa: E402
from group import group  # noqa: E402
from sites import detect  # noqa: E402


class Values(unittest.TestCase):
    def test_year_month(self):
        self.assertEqual(year_month('2019 / 08식 (년형)'), (2019, '2019-08'))
        self.assertEqual(year_month('2016년 01월'), (2016, '2016-01'))
        self.assertEqual(year_month('202201'), (2022, '2022-01'))
        self.assertEqual(year_month('20250901'), (2025, '2025-09'))
        self.assertEqual(year_month('20년08월(20년형)'), (2020, '2020-08'))
        self.assertEqual(year_month('2019'), (2019, None))
        self.assertEqual(year_month(None), (None, None))

    def test_numbers(self):
        self.assertEqual(to_int('5.2만km'), 52000)
        self.assertEqual(to_int('193,994Km'), 193994)
        self.assertEqual(to_int('2,497cc'), 2497)

    def test_price(self):
        self.assertEqual(price_krw('780 만원'), (7800000, '공개'))
        self.assertEqual(price_krw(3550), (35500000, '공개'))
        self.assertEqual(price_krw(12490000), (12490000, '공개'))
        self.assertEqual(price_krw('상담'), (None, '가격 상담'))
        self.assertEqual(price_krw(None), (None, '가격 상담'))

    def test_category_lien(self):
        self.assertEqual(category_of('현대 포터II 하이내장탑차'), '트럭·특장')
        self.assertEqual(category_of('기아 K7 프리미어'), '승용')
        self.assertEqual(yes_no_unknown('없음', '없음'), '없음')
        self.assertEqual(yes_no_unknown('정보없음'), '미확인')
        self.assertEqual(yes_no_unknown(0, 2), '있음')
        self.assertIsNone(yes_no_unknown(None))

    def test_parse(self):
        L = text_lines('<td>차량번호</td><td>00가0000</td><td>연식</td><td>2019 / 08식</td>')
        self.assertEqual(label_value(L, '연식'), '2019 / 08식')
        s = 'x{"a":{"b":"}"},"c":1}y'
        self.assertEqual(balanced_json(s, 1), {'a': {'b': '}'}, 'c': 1})

    def test_detect(self):
        self.assertEqual(detect('https://fem.encar.com/cars/detail/1'), 'encar')
        self.assertEqual(detect('https://www.m-park.co.kr/buy/detail/1'), 'mpark')
        self.assertEqual(detect('https://www.koreacarmarket.com/car/carView.html?m_no=1'), 'koreacarmarket')
        self.assertIsNone(detect('https://www.kbchachacha.com/x'))


class Ledger(unittest.TestCase):
    def test_never_write_and_url(self):
        led = build_ledger('엔카', 'https://x', {'make': '기아', 'accident': '무사고', 'trim': ''}, [])
        self.assertNotIn('accident', led['cells'])
        self.assertNotIn('trim', led['cells'])
        self.assertEqual(led['cells']['listing_url']['verify'], '확인됨')
        self.assertEqual(led['cells']['make']['verify'], '미확인')

    def test_group(self):
        a = build_ledger('엔카', 'u1', {'plate_no': '00가0000', 'make': '기아', 'model': 'K7', 'year': 2020, 'mileage_km': 100000, 'price_krw': 12000000}, [])
        b = build_ledger('엠파크', 'u2', {'plate_no': '00가 0000', 'make': '기아', 'model': 'K7 프리미어', 'year': 2020, 'mileage_km': 100300, 'price_krw': 12490000}, [])
        c = build_ledger('차란차', 'u3', {'make': '기아', 'model': 'K7 프리미어', 'year': 2020, 'mileage_km': 100500}, [])
        d = build_ledger('차란차', 'u4', {'make': 'BMW', 'model': '5시리즈', 'year': 2020, 'mileage_km': 100000}, [])
        g = group([a, b, c, d])
        self.assertEqual(len(g), 2)               # a·b 차량번호로 묶임, c는 번호 없어 사양으로 a 묶음에 합류
        self.assertEqual(len(g[0]['sites']), 3)
        self.assertEqual(g[0]['price_gap_krw'], 490000)


class Johap(unittest.TestCase):
    """조합·매매단지 전산 3종(가짜 조각, 네트워크 없음)."""

    def run_html(self, url, html, get_html=None):
        import johap
        orig = johap.fetch
        self.calls = []
        johap.fetch = lambda u, **kw: (self.calls.append((u, kw)), html if (get_html is None or kw.get('data') is not None) else get_html)[1]
        try:
            return johap.read(url)
        finally:
            johap.fetch = orig

    def test_detect_registry(self):
        self.assertEqual(detect('https://www.djcar.org/car/car_detail.html?DemoNo=0261400761'), 'johap')
        self.assertEqual(detect('http://www.cnauto.co.kr/Model/DetailView.asp?encOnCarNo=ABC123'), 'johap')
        self.assertEqual(detect('https://gayangag.co.kr/car/carView.html?m_no=1'), 'johap')
        self.assertIsNone(detect('http://ggauto.co.kr/x'))          # robots 금지 사이트는 제외

    def test_not_detail(self):
        with self.assertRaises(ValueError):
            self.run_html('https://www.djcar.org/', '<html></html>')

    def test_carku(self):
        h = ('<div class="cartitle">[현대] 팰리세이드&nbsp;2.2 디젤&nbsp;프레스티지</div><span>3,050</span><span>만원</span>'
             '<td>차량번호</td><td>00가0000</td><td>연식</td><td>2020 / 10식 (년형)</td><td>주행거리</td><td>7.1만km</td>'
             '<td>연료</td><td>경유</td><td>압류</td><td>없음</td><td>저당</td><td>없음</td>'
             '<p>성명 :</p><p>홍길동</p><td>소속상사</td><td>시험자동차</td><td>상사주소</td><td>대전광역시 유성구 복용동로 35 (복용동,디오토몰)</td>'
             '<img src="http://photo.korea-usedcar.co.kr/carphoto/large/20260210/0261400761K01.jpg">')
        f, p, _, _, meta = self.run_html('https://www.djcar.org/car/car_detail.html?DemoNo=0261400761', h)
        self.assertEqual((f['make'], f['model'], f['year'], f['first_reg']), ('현대', '팰리세이드', 2020, '2020-10'))
        self.assertEqual((f['price_krw'], f['fuel'], f['lien'], f['dealer_name'], f['region']), (30500000, '디젤', '없음', '홍길동 딜러', '대전 유성구'))
        self.assertEqual(len(p), 1)
        self.assertEqual(meta['family'], 'carku')

    def test_attedit_motorium(self):
        h = ('<p>상세보기</p><p>기아 더 뉴 셀토스(SP2) 1.6 T-GDI 2WD</p><p>입고완료</p><p>판매가격</p><p>3,350</p><p>만원</p>'
             '<td>차량번호</td><td>00가0000</td><td>연식</td><td>2026년 05월</td><td>주행거리</td><td>5,951 km</td>'
             '<p>판매자명</p><p>홍길동</p><p>업체명</p><p>: 시험모터스(주)</p><p>연락처</p><p>010-0000-0000</p>'
             '<p>서울특별시 강서구 양천로53길 30</p><p>소속조합</p><p>서서울자동차매매사업조합 ()</p>'
             '<img src="/AttEdit/photo/Small/6111100/6111100448R2.jpg"><img src="/AttEdit/photo/Small/6111100/6111100448R1.jpg">')
        f, p, _, _, meta = self.run_html('https://www.motorium.co.kr/carSearch/detail.asp?DemoNo=6111100448', h)
        self.assertEqual((f['make'], f['model'], f['price_krw'], f['dealer_name'], f['shop_name'], f['region']),
                         ('기아', '더 뉴 셀토스(SP2)', 33500000, '홍길동 딜러', '시험모터스', '서울 강서구'))
        self.assertEqual(p[0], 'https://www.motorium.co.kr/AttEdit/photo/Large/6111100/6111100448R1.jpg')
        self.assertEqual((meta['family'], meta['union']), ('attedit', '서서울자동차매매사업조합'))

    def test_autobegins_own_photos_only(self):
        h = ("<script>var x = {title : '르노(삼성) SM6 2.0 GDe RE'};</script><p>700만원</p>"
             '<td>차량번호</td><td>00가0000</td><dl><dt>시험모터스  홍길동 카매니저</dt><dd>보유차량</dd></dl><p>매매사원증</p><p>20-000-00000</p>'
             '<img src="/uploadFiles/CAR_PHOTO/000/074/400/a_2_s.jpg"><img src="/uploadFiles/CAR_PHOTO/000/074/400/a_1_s.jpg">'
             '<img src="/uploadFiles/CAR_PHOTO/000/011/111/b_1_s.jpg">')
        f, p, *_ = self.run_html('https://www.kyungdongautofield.com/buy/view.do?m_no=74400', h)
        self.assertEqual((f['make'], f['model'], f['price_krw'], f['shop_name'], f['dealer_name'], f['dealer_reg_no']),
                         ('르노(삼성)', 'SM6', 7000000, '시험모터스', '홍길동 딜러', '20-000-00000'))
        self.assertEqual(p, ['https://www.kyungdongautofield.com/uploadFiles/CAR_PHOTO/000/074/400/a_1.jpg',
                             'https://www.kyungdongautofield.com/uploadFiles/CAR_PHOTO/000/074/400/a_2.jpg'])

    def test_aton_oncarno_post_and_truck_make(self):
        h = '<h3>[중대형화물] 카고(4.5~5톤)&nbsp;메가트럭5톤&nbsp;초장축</h3><p>4,650</p><p>만원</p><td>차량번호</td><td>00가0000</td>'
        f, *_ = self.run_html('http://carcb.co.kr/Model/DetailView.asp?OnCarNo=202660022456', h, get_html='<p>빈 화면</p>')
        self.assertEqual(self.calls[0][0], 'http://carcb.co.kr/Model/DetailView.asp?OnCarNo=202660022456')  # 주소 그대로 먼저
        self.assertEqual(self.calls[1][0], 'http://carcb.co.kr/Model/DetailView.asp')  # 안 열리면 공개 폼(POST)
        self.assertEqual(self.calls[1][1]['data'], {'OnCarNo': '202660022456'})
        self.assertEqual((f['make'], f['model'], f['price_krw']), ('현대', '카고(4.5~5톤)', 46500000))

    def test_aton_seoul_three_line_title_and_carphoto(self):
        h = ('<p>서울특별시 자동차매매사업조합</p><p>현대</p><p>캐스퍼 1.0 가솔린 터보</p><p>디 에센셜 라이트</p><p>차량번호 :</p><p>00가0000</p>'
             '<p>판매가 :</p><p>1,580</p><p>만원</p><img src="../CARPHOTO/20261029/20262007095410_1.jpg"><img src="../CARPHOTO/20261029/99999999999910_1.jpg">')
        f, p, *_ = self.run_html('http://www.seoulauto.org/model/DetailView.asp?ShopNo=&MemberNo=&OnCarNo=202620070954', h)
        self.assertEqual((f['make'], f['model'], f['price_krw']), ('현대', '캐스퍼', 15800000))
        self.assertEqual(p, ['http://www.seoulauto.org/CARPHOTO/20261029/20262007095410_1.jpg'])  # 이 매물 번호 사진만

    def test_generic_registry_regex(self):
        h = ('<p>[현대]</p><p>쏘나타 DN8 2.0 프리미엄 플러스</p><p>판매가격</p><p>1,500만원</p><p>판매자</p><p>(주)시험 모터스 / 홍길동</p>'
             '<img src="/shop_contents/multi_file_img_view.php?type=myboard&data_idx=1&col_num=2&dir_name=car1&thum_w=1000">')
        f, p, *_ = self.run_html('http://www.cleancar.or.kr/shop_contents/myboard_read.htm?myboard_code=car1&myboard_idx=1&idx=1', h)
        self.assertEqual((f['make'], f['model'], f['price_krw'], f['dealer_name'], f['shop_name']), ('현대', '쏘나타', 15000000, '홍길동 딜러', '시험 모터스'))
        self.assertEqual(len(p), 1)

    def test_emi_relative_photos_and_sold_hidden(self):
        h = ('<div class="nocar dp_none"><span>현재 판매중인 차량이 아닙니다</span></div>'
             '<h3>[기아] 더 뉴K9(RJ) 3.8 가솔린</h3><p>4,790</p><p>만원</p><td>차량번호</td><td>00가0000</td>'
             '<img src="/data/JB085-12/20210513/1_1.jpg"><img src="/data/JB085-12/20210513/1_0.jpg"><img src="/data/__dealer/x-1.jpg">')
        f, p, *_ = self.run_html('https://carfull.kr/car/car_detail.html?m_no=167152', h)
        self.assertIsNone(f['status'])
        self.assertEqual(p, ['https://carfull.kr/data/JB085-12/20210513/1_0.jpg', 'https://carfull.kr/data/JB085-12/20210513/1_1.jpg'])

    def test_aton_dealer_from_summary(self):
        h = ('<b>[기아] 더 뉴 K5&nbsp;2.0&nbsp;디럭스</b><p>245</p><p>만원</p><p>시험상사</p><p>홍길동</p><p>010-0000-0000</p>'
             '<td>차량번호</td><td>00가0000</td><td>상사명</td><td>시험상사</td><td>상사주소</td><td>충청남도 보령시 주교면</td>'
             '<img src="https://img.carmanager.co.kr/temp/photo/20221027/AB.jpg">')
        f, p, *_ = self.run_html('http://www.cnauto.co.kr/Model/DetailView.asp?encOnCarNo=ABC123', h)
        self.assertEqual((f['dealer_name'], f['shop_name'], f['region'], f['contact']), ('홍길동 딜러', '시험상사', '충남 보령시', '010-0000-0000'))
        self.assertEqual(len(p), 1)


class Catalog(unittest.TestCase):
    """보배드림 차량 기준표 연결(public/data/vehicle-catalog/cars-index-v1.json)."""

    def test_make_alias_and_generation(self):
        from catalog_map import match
        m = match('르노(삼성)', 'SM6', '2.0 GDe RE', '2017-02', 2017)
        self.assertEqual((m['make'], m['model']), ('르노코리아(삼성)', 'SM6'))
        m = match('현대', '더 뉴그랜저IG', '가솔린 2.5', '2021-04', 2021)
        self.assertEqual((m['match'], m['generation']), ('exact', '더 뉴 그랜저 IG'))

    def test_by_date_beats_generic_name(self):
        from catalog_map import match
        m = match('기아', '더 뉴쏘렌토', '하이브리드(MQ4) 1.6 HEV', '2025-03', 2025)
        self.assertEqual((m['match'], m['generation']), ('by_date', '더 뉴 쏘렌토 4세대'))

    def test_truck_not_in_car_catalog(self):
        from catalog_map import match
        self.assertEqual(match('현대', '포터II', '슈퍼캡', '2019-01', 2019)['match'], 'make')


if __name__ == '__main__':
    unittest.main(verbosity=1)
