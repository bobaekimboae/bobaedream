"""차량번호 → 매물 원장 채우기 (Python 쪽, 숏폼 파이프라인용).

nuxt-register/app/lib/vehicle-lookup.ts 와 같은 표(vehicle-ledger-map.json)를 읽는다.
사용:
  python3 scripts/vehicle_lookup/normalize.py data/ledger/<id>.json [응답.json]
  - 응답 파일을 주면 기관 값으로 덮어쓰고 '서로 다름'을 표시한 결과를 출력한다.
차량번호·차대번호는 GitHub 파일에 쓰지 않는다(원장 시트 내부 칸만).
"""
import json, re, sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MAP = json.loads((ROOT / 'nuxt-register/app/lib/vehicle-ledger-map.json').read_text(encoding='utf-8'))


def pick(obj, path):
    for k in path.split('.'):
        obj = obj.get(k) if isinstance(obj, dict) else None
    return obj


def cast(t, v):
    if v in (None, ''):
        return None
    if t == 'int':
        s = re.sub(r'[^\d.-]', '', str(v))
        return round(float(s)) if s not in ('', '-', '.') else None
    if t == 'yyyymm':
        d = re.sub(r'\D', '', str(v))
        return f'{d[:4]}-{d[4:6]}' if len(d) >= 6 else None
    if t == 'fuel':
        s = re.sub(r'\s', '', str(v)); return MAP['fuel'].get(s, s)
    if t == 'gear':
        s = re.sub(r'\s', '', str(v)); return MAP['gear'].get(s, s)
    s = str(v).strip()
    return s or None


def normalize(resp):
    out = {}
    for m in MAP['api_to_ledger']:
        v = cast(m.get('type'), pick(resp, m['api']))
        if v is None and m.get('fallback'):
            v = cast(m.get('type'), pick(resp, m['fallback']))
        if v is not None:
            out[m['key']] = {'value': v, 'source': m['source'], 'verify': '확인됨'}
    return out


def merge(ledger, api):
    cells = dict(ledger['cells'])
    for k, c in api.items():
        prev = cells.get(k) or {}
        pv = prev.get('value')
        if pv is not None and str(pv).replace(' ', '') != str(c['value']).replace(' ', ''):
            cells[k] = {**c, 'verify': '서로 다름', 'other': pv}
        else:
            cells[k] = c
    return {**ledger, 'checked_at': datetime.now(timezone.utc).isoformat(timespec='seconds'), 'cells': cells}


def facts_for_shorts(ledger):
    """숏폼 facts.json 에 넣을 값만: 값 있고 '서로 다름'이 아닌 칸. 무사고 같은 단정어는 넣지 않는다."""
    out = {}
    for k, c in ledger['cells'].items():
        if c.get('value') is None or c.get('verify') == '서로 다름' or k in ('plate_no', 'vin'):
            continue
        if any(w in str(c['value']) for w in MAP['never_write']):
            continue
        out[k] = c['value']
    return out


if __name__ == '__main__':
    led = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    if len(sys.argv) > 2:
        led = merge(led, normalize(json.loads(Path(sys.argv[2]).read_text(encoding='utf-8'))))
    print(json.dumps({'ledger': led, 'facts': facts_for_shorts(led)}, ensure_ascii=False, indent=1))
