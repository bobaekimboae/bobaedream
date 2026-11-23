# listing_import — 매물 링크 가져오기 작업기

딜러 본인 매물 링크 1건 → 매물 원장 칸(JSON) + 원본 사진. 명세: `docs/listing-import.md`

```bash
python3 scripts/listing_import/run.py <링크> [--dealer 김태규] [--shop 투제이모터웍스] [--out data/import-out] [--no-photos]
python3 scripts/listing_import/group.py data/import-out     # 흩어진 매물 묶기
python3 scripts/listing_import/test_listing_import.py       # 자동 시험(네트워크 없음)
```

- 결과: `<out>/<사이트-해시>/ledger.json`, `photos/p01.jpg…`, `row.json`(시트 22번 탭 열 순서)
- 줄마다 요약 JSON 한 줄을 출력한다(서버 Worker가 읽음).
- 엠파크는 Playwright(크로미움)가 필요하다.
- 결과 폴더에는 차량번호·연락처가 들어 있으므로 커밋하지 않는다(.gitignore).

| 파일 | 하는 일 |
|---|---|
| common.py | 요청(1초 간격)·값 정리·원장 칸 만들기·사진 저장 |
| sites.py | 사이트 판별 + 사이트별 읽기(엔카·서울오토갤러리·차란차·코리아카마켓·엠파크) |
| run.py | 명령줄 실행, 본인 매물 판정, 결과 파일 쓰기 |
| group.py | 같은 차 묶기 |
| sheet_columns.json | 시트 열 순서(93칸) |
