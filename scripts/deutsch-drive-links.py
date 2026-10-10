#!/usr/bin/env python3
"""도이치오토월드 시트의 Drive 사진 링크(사진1~5 Drive)를 읽어 src/prototype/data/deutsch-autoworld-drive-v01.json 으로 만든다.
사용: python3 scripts/deutsch-drive-links.py <시트를 xlsx 로 받은 파일>
- 키 = 시트 「도이치오토월드」 탭의 행 순서(0부터, deutsch-autoworld-all-v01.json 의 번호 n 과 같다), 값 = Drive 파일 ID 5개.
- 사진 5장이 모두 Drive 에 올라간 행만 넣는다. 내부 테스트용(원본은 번호판 · 전화번호 흐림 처리 전)이다.
"""
import json, re, sys
import openpyxl

wb = openpyxl.load_workbook(sys.argv[1], read_only=True)
rows = list(wb["도이치오토월드"].iter_rows(values_only=True))
header = rows[0]
out = {}
for n, row in enumerate(r for r in rows[1:] if r[0]):
    item = dict(zip(header, row))
    ids = []
    for j in range(1, 6):
        m = re.search(r"/d/([^/?]+)", item.get(f"사진{j} Drive") or "")
        if m:
            ids.append(m.group(1))
    if len(ids) == 5:
        out[str(n)] = ids
dst = "src/prototype/data/deutsch-autoworld-drive-v01.json"
json.dump(out, open(dst, "w"), separators=(",", ":"))
print(f"{len(out)}대 Drive 링크 -> {dst}")
