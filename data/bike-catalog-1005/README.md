# 바이크 공통 시드 원천 1005

원본 5개를 보존하고 `bike-catalog.normalized.json`을 공통 시드 원천으로 생성한다.

## 원본

- `bike_catalog_1005.json`
- `bike_makers_v2_1005.csv`
- `bike_models_v2_1005.csv`
- `bike_maker_order_rw_names_1005.csv` (10/5 라이트바겐 표시명·정렬 최신본)
- `bike_logo_manifest_1005.csv` (노출 제조사 65개 로고 파일 연결표)

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

대림/디앤에이모터스는 사용자 확정에 따라 `BKM029 디앤에이모터스(대림)` 하나로 유지한다. 매물 수는 182+48=230이며 `대림`, `디앤에이모터스`를 별칭으로 둔다. 공개 제조사에는 `code`와 `logoFile`을 제공하며 숨김 제조사의 `logoFile`은 `null`이다.

## 배기량 구간

`bike_models_v2_1005.csv`의 구바이크 기준 `cc_band`를 그대로 사용한다.

| 구간 | 모델 수 |
|---|---:|
| 751cc 이상 | 1,117 |
| 401~750cc | 403 |
| 251~400cc | 229 |
| 126~250cc | 237 |
| 51~125cc | 645 |
| 50cc 이하 | 141 |
| 전기 | 92 |
| 없음 | 46 |

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

SQLite fixture는 승용과 같은 `manufacturers`·`models` 테이블을 사용하고 `scope_key=BIKE`로 분리한다. 바이크 BMW와 승용 BMW는 서로 다른 행이다. 장르·배기량·배기량 구간·연료·연식·이미지 경로는 `bike_model_specs`에 둔다. 기존 `bike_*` 테이블 정의는 삭제하지 않지만 더 이상 시드하지 않는다.
