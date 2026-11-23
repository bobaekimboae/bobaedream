"""시험용 가짜 추출 일꾼: run.py 와 같은 출력 모양. 네트워크 없음, 가짜 번호."""
import json, sys, hashlib
from pathlib import Path
a = sys.argv[1:]; url = a[0]; out = Path(a[a.index('--out') + 1])
dealer = a[a.index('--dealer') + 1] if '--dealer' in a else ''
if 'fail' in url:
    print(json.dumps({'url': url, 'error': '매물 정보를 찾지 못했어요'}, ensure_ascii=False)); sys.exit(0)
site = 'encar' if 'encar' in url else 'mpark'
key = f"{site}-{hashlib.sha1(url.encode()).hexdigest()[:10]}"
d = out / key; (d / 'photos').mkdir(parents=True, exist_ok=True)
(d / 'photos' / 'p01.jpg').write_bytes(b'\xff\xd8' + b'0' * 3000)
price = 12000000 if site == 'encar' else 12490000
c = lambda v: {'value': v, 'source': '다른 사이트', 'verify': '미확인'}
led = {'site': '엔카' if site == 'encar' else '엠파크', 'checked_at': '2026-11-23T02:00:00+00:00', 'listing_id': key,
       'owner_check': '본인 매물' if dealer == '홍길동' else '확인 필요', 'note': '',
       'cells': {'plate_no': c('00가1234'), 'contact': c('010-1234-5678'), 'make': c('기아'), 'model': c('K7 프리미어'),
                 'year': c(2020), 'mileage_km': c(114833), 'price_krw': c(price), 'listing_url': c(url)},
       'photos_saved': [{'order': 1, 'file': 'p01.jpg', 'bytes': 3002, 'sha256': 'abc'}]}
(d / 'ledger.json').write_text(json.dumps(led, ensure_ascii=False), encoding='utf-8')
print(json.dumps({'url': url, 'key': key, 'filled': 8}, ensure_ascii=False))
