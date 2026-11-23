"""딜러 매물 링크 → 사진 저장 + 매물 원장 JSON(+ 시트 한 줄).

사용:
  python3 scripts/listing_import/run.py <링크> [<링크> ...] [--out data/import-out] [--no-photos] [--dealer "이름" --shop "상사"]

- 결과: <out>/<사이트-해시>/ledger.json, photos/p01.jpg …, row.json(시트 22_매물원장_데이터 한 줄)
- --dealer/--shop 을 주면 페이지 판매자와 비교해 본인 매물인지 판정(다르면 '확인 필요')
- 결과 폴더는 GitHub에 올리지 않는다(.gitignore). 차량번호·연락처가 들어 있다.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import ROOT, build_ledger, download_photos, listing_key  # noqa: E402
from sites import ADAPTERS, SITE_NAME, detect  # noqa: E402
from catalog_map import match as catalog_match  # noqa: E402

SHEET_COLUMNS = json.loads((Path(__file__).resolve().parent / 'sheet_columns.json').read_text(encoding='utf-8'))


def owner_check(fields: dict, dealer: str | None, shop: str | None) -> str:
    if not dealer and not shop:
        return '미판정'
    norm = lambda s: (s or '').replace(' ', '').replace('딜러', '').replace('(주)', '').replace('주식회사', '')
    hit_d = dealer and norm(dealer) and norm(dealer) in norm(fields.get('dealer_name'))
    hit_s = shop and norm(shop) and norm(shop) in norm(fields.get('shop_name'))
    return '본인 매물' if (hit_d or hit_s) else '확인 필요'


def to_row(key: str, led: dict) -> list:
    """시트 열 순서대로 값. 출처·확인·시각은 K01~K03에."""
    cells = led['cells']
    row = [key] + [cells.get(c, {}).get('value', '') for c in SHEET_COLUMNS[1:-3]]
    cat = led.get('catalog') or {}
    meta = led.get('source_meta') or {}
    return row + [led.get('source_word') or f"다른 사이트({led['site']})", led.get('verify_word') or '미확인', led['checked_at'], led.get('photo_zip') or '',
                  cat.get('make') or '', cat.get('model') or '', cat.get('generation') or '', MATCH_WORD.get(cat.get('match'), '연결 안 됨'),
                  meta.get('union') or '', meta.get('federation') or '']


MATCH_WORD = {'exact': '세대까지(이름)', 'by_date': '세대까지(등록연월)', 'model': '모델까지', 'make': '제조사만', 'none': '연결 안 됨'}


def run_one(url: str, out: Path, photos: bool, dealer: str | None, shop: str | None) -> dict:
    site = detect(url)
    if not site:
        return {'url': url, 'error': '지원하지 않는 사이트예요(엔카·서울오토갤러리·차란차·코리아카마켓·엠파크·전국 조합·매매단지 홈페이지)'}
    res = ADAPTERS[site](url)
    fields, photo_urls, referer = res[:3]
    note = res[3] if len(res) > 3 else ''
    meta = res[4] if len(res) > 4 else {}
    name = meta.get('site_name') or SITE_NAME[site]
    key = listing_key(site, url)
    led = build_ledger(name, url, fields, photo_urls)
    if meta:
        led['source_meta'] = meta
    led['catalog'] = catalog_match(fields.get('make'), fields.get('model'), fields.get('trim'), fields.get('first_reg'), fields.get('year'))
    led['listing_id'] = key
    led['owner_check'] = owner_check(fields, dealer, shop)
    led['note'] = note
    d = out / key
    d.mkdir(parents=True, exist_ok=True)
    if photos and photo_urls:
        led['photos_saved'] = download_photos(photo_urls, d / 'photos', referer)
    (d / 'ledger.json').write_text(json.dumps(led, ensure_ascii=False, indent=1), encoding='utf-8')
    row = to_row(key, led)
    (d / 'row.json').write_text(json.dumps(row, ensure_ascii=False), encoding='utf-8')
    return {'url': url, 'site': name, 'family': meta.get('family'), 'key': key, 'filled': len(led['cells']), 'photos': len(photo_urls),
            'saved': sum(1 for p in led.get('photos_saved', []) if 'file' in p), 'owner': led['owner_check'], 'catalog': led['catalog']['match'], 'note': note}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('urls', nargs='+')
    ap.add_argument('--out', default=str(ROOT / 'data/import-out'))
    ap.add_argument('--no-photos', action='store_true')
    ap.add_argument('--dealer')
    ap.add_argument('--shop')
    a = ap.parse_args()
    out = Path(a.out)
    for u in a.urls:
        try:
            r = run_one(u, out, not a.no_photos, a.dealer, a.shop)
        except Exception as e:
            r = {'url': u, 'error': f'{type(e).__name__}: {e}'[:200]}
        print(json.dumps(r, ensure_ascii=False))


if __name__ == '__main__':
    main()
