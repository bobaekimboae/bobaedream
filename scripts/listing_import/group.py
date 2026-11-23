"""흩어진 매물 묶기: 여러 사이트에 올라간 같은 차를 한 줄로.

같은 차 판정 순서(앞에서 맞으면 끝):
  1) 차량번호  2) 차대번호  3) 제조사+모델+연식 + 주행거리 차이 1% 이내
사용: python3 scripts/listing_import/group.py data/import-out  → 묶음 목록 JSON
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path


def _v(led: dict, k: str):
    return (led.get('cells', {}).get(k) or {}).get('value')


def _norm(s) -> str:
    return re.sub(r'\s', '', str(s or '')).lower()


def same_car(a: dict, b: dict) -> bool:
    pa, pb = _norm(_v(a, 'plate_no')), _norm(_v(b, 'plate_no'))
    if pa and pb:
        return pa == pb
    va, vb = _norm(_v(a, 'vin')), _norm(_v(b, 'vin'))
    if va and vb:
        return va == vb
    if not all(_v(x, k) for x in (a, b) for k in ('make', 'model', 'year', 'mileage_km')):
        return False
    if _norm(_v(a, 'make')) != _norm(_v(b, 'make')) or _v(a, 'year') != _v(b, 'year'):
        return False
    ma, mb = _norm(_v(a, 'model')), _norm(_v(b, 'model'))
    if not (ma in mb or mb in ma):
        return False
    ka, kb = float(_v(a, 'mileage_km')), float(_v(b, 'mileage_km'))
    return abs(ka - kb) <= max(ka, kb) * 0.01


def group(ledgers: list[dict]) -> list[dict]:
    groups: list[list[dict]] = []
    for led in ledgers:
        for g in groups:
            if same_car(g[0], led):
                g.append(led)
                break
        else:
            groups.append([led])
    out = []
    for g in groups:
        prices = [(x['site'], _v(x, 'price_krw')) for x in g]
        known = [p for _, p in prices if p]
        out.append({
            'car': ' '.join(str(_v(g[0], k)) for k in ('make', 'model', 'trim') if _v(g[0], k)),
            'year': _v(g[0], 'year'), 'mileage_km': _v(g[0], 'mileage_km'),
            'sites': [{'site': x['site'], 'url': _v(x, 'listing_url'), 'price_krw': _v(x, 'price_krw'),
                       'price_display': _v(x, 'price_display'), 'status': _v(x, 'status') or '판매중',
                       'checked_at': x.get('checked_at'), 'listing_id': x.get('listing_id')} for x in g],
            'price_gap_krw': (max(known) - min(known)) if len(known) > 1 else 0,
            'match_by': 'plate' if _v(g[0], 'plate_no') else 'vin' if _v(g[0], 'vin') else 'spec',
        })
    return out


if __name__ == '__main__':
    base = Path(sys.argv[1] if len(sys.argv) > 1 else 'data/import-out')
    leds = [json.loads(p.read_text(encoding='utf-8')) for p in sorted(base.glob('*/ledger.json'))]
    print(json.dumps(group(leds), ensure_ascii=False, indent=1))
