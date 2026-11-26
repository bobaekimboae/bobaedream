"""성능·상태점검기록부(카모두 출력본) → facts.json 의 inspection 항목 — 2026-11-26 클로드 시안 (카드 정보 v0.2)

python3 cards_from_carmodoo.py <차 폴더> <기록부 번호>
  기록부 화면은 체크 상태를 스크립트로 켜므로 헤드리스 브라우저(playwright)로 열어 '체크된 칸'만 읽는다.
  저장하는 것: 점검일·점검 주행거리·최초등록일·검사 유효기간·사고이력·단순수리·특별이력·용도변경·튜닝·리콜·
             외판/골격 부위 부호(X 교환, W 판금·용접 …)·주요장치 불량/누유 칸·점검자 의견 첫 문장.
  저장하지 않는 것: 차량번호·차대번호·계좌·연락처·서명.
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright

PARTS = {1: '후드', 2: '프론트휀더', 3: '도어', 4: '트렁크리드', 5: '라디에이터 서포트', 6: '쿼터패널', 7: '루프패널', 8: '사이드실 패널',
         9: '프론트패널', 10: '크로스멤버', 11: '인사이드패널', 12: '사이드멤버', 13: '휠하우스', 14: '필러패널', 15: '대쉬패널',
         16: '플로어패널', 17: '트렁크플로어', 18: '리어패널', 19: '패키지트레이'}
MARK = {'X': '교환', 'W': '판금·용접', 'C': '부식', 'A': '흠집', 'U': '요철', 'T': '손상'}
URL = 'https://ck.carmodoo.com/carCheck/carmodooPrint.do?&checkNum={}'


def read(num):
    with sync_playwright() as p:
        kw = {'proxy': {'server': os.environ['HTTPS_PROXY']}} if os.environ.get('HTTPS_PROXY') else {}
        b = p.chromium.launch(**kw); pg = b.new_page()
        pg.goto(URL.format(num), wait_until='load', timeout=60000); pg.wait_for_timeout(2500)
        checked = pg.eval_on_selector_all('input[type=checkbox]', """xs => xs.filter(x => x.checked).map(x => {
            const tr = x.closest('tr'); const th = tr ? tr.querySelector('th') : null;
            return [(th ? th.innerText : '').replace(/\\s+/g, ' ').trim(), (x.parentElement.innerText || '').replace(/\\s+/g, ' ').trim()] })""")
        text = pg.inner_text('body'); html = pg.content(); b.close()
    return checked, text, html


def main(car, num):
    checked, text, html = read(num)
    got = {}
    for th, lab in checked:
        got.setdefault(th, []).append(lab)
    pick = lambda key: next((v for k, v in got.items() if key in k), [])
    first = lambda key: (pick(key) or [None])[0]
    acc = pick('사고이력')   # [사고이력 칸, 단순수리 칸] 순서로 체크된 글자
    out = {
        'source': 'carmodoo', 'check_no_saved': False,
        'date': re.findall(r'(20\d\d)년\s*(\d+)월\s*(\d+)일', text)[-1],
        'km': int(re.search(r'현재 주행거리 \[\s*([\d,]+)\s*Km', text).group(1).replace(',', '')),
        'first_reg': re.search(r'최초등록일\s*(20\d\d-\d\d-\d\d)', text).group(1),
        'inspection_valid': re.search(r'검사유효기간\s*(20\d\d-\d\d-\d\d)\s*~\s*(20\d\d-\d\d-\d\d)', text).groups(),
        'accident': '없음' if acc and acc[0].startswith('없음') else '있음',
        'simple_repair': '있음' if acc and acc[-1].endswith('있음') else '없음',
        'special': first('특별이력'), 'use_change': first('용도변경'), 'tuning': first('튜닝'),
        'recall': pick('리콜대상'),
        'leak_or_bad': sorted({k for k, v in got.items() if any(x in ('불량', '누유', '미세누유', '누수', '미세누수') for x in v)}),
    }
    out['date'] = '{}-{:02d}-{:02d}'.format(*map(int, out['date']))
    parts = []
    for var, zone in (('ucAccOutCheck', '외판'), ('ucAccBoneCheck', '골격')):
        m = re.search(var + r"\s*=\s*'(\{[^']*\})'", html)
        for k, v in (json.loads(m.group(1)) if m else {}).items():
            parts.append({'zone': zone, 'part': PARTS.get(int(k), k), 'mark': v, 'meaning': MARK.get(v, v)})
    out['parts'] = parts
    m = re.search(r'성능ㆍ상태점검자\s*(.+?)(?:,\s*비금속|\s*성능보험)', text)
    out['inspector_note'] = m.group(1).strip() if m else None
    fp = os.path.join(car, 'facts.json'); facts = json.load(open(fp, encoding='utf-8'))
    facts['inspection'] = out
    json.dump(facts, open(fp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps(out, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
