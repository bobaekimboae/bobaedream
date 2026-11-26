"""가져온 매물 원장 + 차량이력 조회(국토부·카히스토리, 보배드림 서버) 조인.

사용:
  python3 scripts/listing_import/history_join.py data/import-out/<묶음>/<매물키> [...]
  - 각 폴더의 ledger.json 의 차량번호로 서버 차량이력 API 를 부르고, 응답을 history.json 으로 저장한 뒤
    ledger.json · row.json 을 다시 쓴다(원래 사이트 값은 덮어쓰기 전 'other' 로 보관).
서버 주소: 환경변수 VEHICLE_HISTORY_URL (기본: 보배드림 스테이징 OpenAPI 주소).
인증: 환경변수 VEHICLE_HISTORY_API_KEY 를 X-API-Key 머리글로 보낸다. 키는 파일·깃허브·화면에 쓰지 않는다.
한도: 분당 30회 · 24시간 500회 → 호출 사이 2.5초, 429면 한 번 기다렸다가 다시 부른다.
기관 키·인증서는 서버에만 있다. 이 스크립트는 차량번호만 보내고, 응답은 가린 번호만 담는다.
'무사고' 같은 단정어는 쓰지 않는다. 사고는 '보험 처리 사고 N건'처럼 숫자로만 적는다.
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from run import to_row  # noqa: E402

URL = os.environ.get('VEHICLE_HISTORY_URL', 'https://staging.bbmuseum.co.kr/v1/openapi/vehicle-history')
API_KEY = os.environ.get('VEHICLE_HISTORY_API_KEY', '')
GAP = 2.5  # 분당 30회 한도
SRC = '차량이력(카히스토리)'
_last = [0.0]


def lookup(plate: str, tries: int = 2) -> dict:
    if not API_KEY:
        return {'error': 'VEHICLE_HISTORY_API_KEY 환경변수가 없어 조회하지 않음', 'status': 0}
    body = {'plate': plate, 'consentId': str(uuid.uuid4()), 'purpose': 'USED_CAR_DEALER_LISTING_CHECK',
            'molitLookupType': 'SALE_VEHICLE_OR_OWNER_UNCONSENTED'}
    for i in range(tries):
        wait = GAP - (time.time() - _last[0])
        if wait > 0:
            time.sleep(wait)
        _last[0] = time.time()
        req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers={
            'Content-Type': 'application/json', 'Accept': 'application/json', 'X-API-Key': API_KEY})
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            if e.code in (429, 502, 503, 504) and i + 1 < tries:
                time.sleep(int(e.headers.get('Retry-After') or 0) or (30 if e.code == 429 else 5))
                continue
            raw = e.read().decode('utf-8', 'ignore')
            try:
                return {'error': json.loads(raw), 'status': e.code}
            except ValueError:
                return {'error': raw[:200], 'status': e.code}
        except (urllib.error.URLError, ConnectionError, TimeoutError) as e:  # 접속이 끊기면 잠시 뒤 한 번 더
            if i + 1 < tries:
                time.sleep(5)
                continue
            return {'error': f'접속 실패: {e}', 'status': 0}
    return {'error': 'no response'}


def won(n) -> str:
    return f'{int(n):,}원' if n else '0원'


def history_cells(h: dict) -> dict:
    v, reg, ins = h.get('vehicle') or {}, h.get('registration') or {}, h.get('insurance') or {}
    out = {}
    def put(k, val):
        if val not in (None, ''):
            out[k] = val
    put('make', v.get('manufacturer'))
    put('year', v.get('modelYear'))
    put('mileage_km', v.get('mileage'))
    put('fuel', v.get('fuel'))
    put('transmission', v.get('transmission'))
    put('ext_color', v.get('color'))
    put('displacement_cc', v.get('displacementCc'))
    fr = v.get('firstRegistration') or v.get('firstRegisteredAt')
    if fr:
        d = ''.join(ch for ch in str(fr) if ch.isdigit())
        put('first_reg', f'{d[:4]}-{d[4:6]}' if len(d) >= 6 else None)
    if 'accidentCount' in ins:
        put('accident', f"보험 처리 사고 {ins.get('accidentCount') or 0}건")
        put('insurance', ' · '.join([
            f"내차 피해 {ins.get('ownDamageCount') or 0}건 {won(ins.get('ownDamageTotal'))}",
            f"상대차 피해 {ins.get('otherDamageCount') or 0}건 {won(ins.get('otherDamageTotal'))}",
            f"전손 {ins.get('totalLossCount') or 0} · 침수 {ins.get('floodCount') or 0} · 도난 {ins.get('theftCount') or 0}",
        ]))
    use = reg.get('usage') or {}
    parts = []
    if reg.get('ownerChangeCount') is not None:
        parts.append(f"소유자 변경 {reg['ownerChangeCount']}회")
    if use:
        hit = [n for k, n in (('rental', '렌트'), ('commercial', '영업용'), ('government', '관용')) if use.get(k)]
        parts.append(('용도 이력 ' + '·'.join(hit)) if hit else '렌트·영업용·관용 이력 없음')
    put('usage_history', ' · '.join(parts))
    lien = reg.get('lien') or {}
    if lien.get('seizure') is not None or lien.get('mortgage') is not None:
        put('lien', f"압류 {lien.get('seizure') or 0} · 저당 {lien.get('mortgage') or 0}")
    return out


def same(a, b) -> bool:
    return str(a).replace(' ', '') == str(b).replace(' ', '')


def join(folder: Path) -> dict:
    led = json.loads((folder / 'ledger.json').read_text(encoding='utf-8'))
    plate = (led['cells'].get('plate_no') or {}).get('value')
    if not plate:
        return {'key': led.get('listing_id'), 'error': '차량번호가 없어 조회하지 않음'}
    h = lookup(plate)
    (folder / 'history.json').write_text(json.dumps(h, ensure_ascii=False, indent=1), encoding='utf-8')
    if 'error' in h:
        return {'key': led.get('listing_id'), 'error': h['error'], 'status': h.get('status')}
    got = history_cells(h)
    diff = []
    for k, val in got.items():
        prev = led['cells'].get(k) or {}
        pv = prev.get('value')
        cell = {'value': val, 'source': SRC, 'verify': '확인됨'}
        if pv not in (None, '') and not same(pv, val):
            if k == 'mileage_km':
                cell['verify'] = '확인됨(사이트는 약값)'
            else:
                cell['verify'] = '서로 다름'
                diff.append(k)
            cell['other'] = pv
        led['cells'][k] = cell
    led['history'] = {'report_id': h.get('reportId'), 'queried_at': h.get('queriedAt'), 'mode': h.get('mode'),
                      'source_status': h.get('sourceStatus'), 'vehicle_name': (h.get('vehicle') or {}).get('name'),
                      'trim': (h.get('vehicle') or {}).get('trim')}
    led['source_word'] = f"다른 사이트({led['site']}) + {SRC}"
    led['verify_word'] = '일부 확인(차량이력)' + (f" · 서로 다름 {', '.join(diff)}" if diff else '')
    led['checked_at'] = datetime.now(timezone.utc).isoformat(timespec='seconds')
    (folder / 'ledger.json').write_text(json.dumps(led, ensure_ascii=False, indent=1), encoding='utf-8')
    row = to_row(led['listing_id'], led)
    (folder / 'row.json').write_text(json.dumps(row, ensure_ascii=False), encoding='utf-8')
    return {'key': led['listing_id'], 'filled_from_history': sorted(got), 'differs': diff,
            'source_status': h.get('sourceStatus'), 'name': led['history']['vehicle_name']}


if __name__ == '__main__':
    for a in sys.argv[1:]:
        print(json.dumps(join(Path(a)), ensure_ascii=False))
