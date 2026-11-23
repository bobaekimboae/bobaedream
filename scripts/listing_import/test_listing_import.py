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


if __name__ == '__main__':
    unittest.main(verbosity=1)
