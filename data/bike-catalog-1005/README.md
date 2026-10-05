# 바이크 공통 시드 원천 1005

원본 4개를 보존하고 `bike-catalog.normalized.json`을 공통 시드 원천으로 생성한다.

## 원본

- `bike_catalog_1005.json`
- `bike_makers_v2_1005.csv`
- `bike_models_v2_1005.csv`
- `bike_maker_order_rw_names_1005.csv` (10/5 라이트바겐 표시명·정렬 최신본)

생성 결과의 `meta.sourceFiles`에 각 원본 파일의 SHA-256을 기록한다. 원천 추적 필드 `reitwagenId`, `naverUrl`, `danawaPcodes`는 정규화 원천에만 두고 공개 JSON에서는 제외한다.

## 생성

```powershell
python data/bike-catalog-1005/generate_source.py
npm run bike:build:catalog
```

- 공통 원천: `data/bike-catalog-1005/bike-catalog.normalized.json`
- 시안 공개 데이터: `public/data/bike-catalog-1005/catalog.json`
- Node SQLite fixture: `admin-server/seed-bike-catalog.mjs`

```powershell
$env:ADMIN_DB_PATH = ".tmp/bike-catalog.sqlite"
npm run admin:seed:bike-catalog
```

원문은 `sourceName`에 보존하고 화면 이름은 `displayName`을 사용한다. 그룹을 쓰지 않는 제조사도 모델이 있으면 `isImplicit=true`인 그룹 노드 하나를 유지한다.

제조사는 국산/수입 구역으로 나누지 않는다. `listingCount` 상위 12개를 매물순으로 먼저 두고, 나머지는 한글 읽기 기준 가나다순, `기타`는 맨 뒤에 둔다. `origin`은 별도 구분 필터에만 사용한다. `isVisible`은 매물등록 화면 노출, `isSearchVisible`은 검색 필터 노출을 뜻하며 매물 0건 제조사는 검색에서만 숨긴다.

대림/디앤에이모터스는 결정 전이므로 `BKM029 디앤에이모터스(대림)` 하나로 유지한다. 매물 수는 182+48=230이며 `대림`, `디앤에이모터스`를 별칭으로 둔다.

## 확정 건수

| 항목 | 건수 |
|---|---:|
| 제조사 | 86 |
| 노출 제조사 | 65 |
| 숨김 제조사 | 21 |
| 검색 노출 제조사 | 62 |
| 모델그룹 | 973 |
| 실제 모델그룹 | 920 |
| implicit 모델그룹 | 53 |
| 모델 | 2,910 |
| 다나와 pcode 연결 | 135 |
| 검수 필요 모델 | 278 |

SQLite fixture는 차량 기준표 통합 결정을 앞서가지 않도록 `bike_manufacturers`, `bike_model_groups`, `bike_models`에 분리했다. 최종 운영 구조는 승용과 같은 테이블에 `vehicle_scope`를 추가하는 방식을 권장한다.
