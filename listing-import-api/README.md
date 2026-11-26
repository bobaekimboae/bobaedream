# listing-import-api — 매물 링크 가져오기 서버 (Laravel 12 · PHP 8.4 · PostgreSQL)

명세: `../docs/listing-import.md` · 계약: `openapi.yaml`

## 설치
```bash
composer install
cp .env.example .env && php artisan key:generate
# .env: LISTING_IMPORT_TOKEN(서비스 토큰), DB_*, REDIS, LISTING_IMPORT_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_JSON
php artisan migrate
php artisan queue:work      # 가져오기 작업
php artisan serve
```
- 파이썬 3.12+ 와 `../scripts/listing_import/run.py` 가 필요하다(엠파크는 Playwright 크로미움).
- 시트 쓰기: `LISTING_IMPORT_SHEET_DRIVER=google`(서비스 계정 키는 서버에만), 개발은 `log`(storage에 jsonl).
- 비밀값(토큰·서비스 계정 키)은 GitHub·화면에 두지 않는다.

## 시험
```bash
bash tests/smoke.sh     # 가짜 작업기로 21개 점검
```

## 구조
| 파일 | 하는 일 |
|---|---|
| app/Http/Controllers/ListingImportController.php | 접수·조회·다시 확인·흩어진 매물 |
| app/Jobs/RunListingImport.php | 대기열 작업(중복 실행 방지) |
| app/ListingImport/Worker.php | 파이썬 작업기 실행, 사진 저장소로 이동 |
| app/ListingImport/SheetSink.php | 구글 시트 22번 탭에 한 줄 추가 |
| app/ListingImport/Masker.php | 응답의 차량번호·차대번호·연락처 가림 |
| app/ListingImport/CarKey.php | 같은 차 묶기 키 |
| app/ListingImport/Sites.php | 지원 사이트 판별·링크 정규화 |
