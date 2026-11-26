import sys, json
sys.path.insert(0, '/home/claude/rr/scripts/shortform/card_info')
import card_info as C
from PIL import Image
rows = [["", "2015년 03월", "신규 등록"], ["", "2016년 08월", "정비 · 엔진오일 교환"], ["", "2017년 03월", "정기 검사"],
        ["", "2017년 11월", "소유자 변경"], ["", "2018년 06월", "내 차 보험 수리 · 120만원"], ["", "2019년 03월", "정기 검사"],
        ["", "2019년 09월", "정비 · 브레이크 패드"], ["", "2020년 05월", "번호판 변경"], ["", "2021년 03월", "정기 검사"],
        ["", "2022년 01월", "상대 차 보험 처리"], ["", "2023년 03월", "정기 검사"], ["", "2024년 07월", "정비 · 타이어 교환"],
        ["", "2026년 10월", "성능 점검 · 98,210km"]]
car = {"maker": "벤츠", "model": "E-클래스", "code": "W213", "trim": "E220d"}
c = C.Card('timeline', {"rows": rows}, car, 0, 1)
for x in c.rows: print(x)
ss = c.sentences()
for k, s, h in ss: print(k, s)
c.segs = [(0.2 + 2.0 * j, 0.2 + 2.0 * (j + 1), k, s, h) for j, (k, s, h) in enumerate(ss)]
base = C.background().copy() if callable(getattr(C, 'background', None)) else Image.new('RGBA', (1080, 1920), (20, 20, 20, 255))
base = base.convert('RGBA')
c.draw(base, 2.0 * len(ss) - 0.5, 2.0 * len(ss) + 1)
base.convert('RGB').resize((540, 960)).save('/tmp/tl/tl_many.png')
