#!/usr/bin/env python3
"""차란차 매물 링크 → 원자료(JSON) + 사진(PNG) 내려받기. 카드 JSON은 MANUAL.md 매핑표대로 작성.
사용법: python3 fetch_charancha.py <매물URL> <저장폴더>"""
import json, re, sys, os, urllib.request, io
from PIL import Image
url, out = sys.argv[1], sys.argv[2]
cid = re.search(r'cars/([0-9a-f-]{36})', url).group(1)
os.makedirs(f"{out}/api", exist_ok=True); os.makedirs(f"{out}/photos", exist_ok=True)
H = {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://charancha.com/'}
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=30).read()
for ep in ['basic-info', 'images', 'main-options', 'group-options', 'choice-options', 'performance-checks', 'summary-info', 'new-car-comparison']:
    open(f"{out}/api/{ep}.json", 'wb').write(get(f"https://svc.charancha.com/cars/buy-cars/{cid}/{ep}"))
imgs = json.load(open(f"{out}/api/images.json"))['data']['images']
for i, x in enumerate(imgs, 1):
    try:
        Image.open(io.BytesIO(get(x['fullPath']))).convert('RGB').save(f"{out}/photos/p{i:02d}.png")
    except Exception as e:
        print('skip', i, e)
perf = json.load(open(f"{out}/api/performance-checks.json"))['data']
print('ok', cid, len(imgs), 'photos', '| 성능점검 원문:', perf.get('sourceUrl'))
