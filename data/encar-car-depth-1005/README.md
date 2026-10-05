# 엔카 승용 공통 시드 원천 1005

`encar-car-depth.normalized.json`이 이 작업의 정본이다. Laravel, Node SQLite, GitHub 시안용 JSON은 모두 이 파일에서 생성한다.

## 원본

- `Encar_Car_AllMakers_Depth_1004.xlsx`
- `Encar_Car_Catalog_Fill_1004.xlsx`
- 현대 모델그룹 바디타입 보조값: `grandeur_test_1005/hyundai_models_bodytype.csv`

원본 파일은 사용자 제공 폴더에서 읽고 저장소에는 복제하지 않는다. 정본 JSON에는 원본 파일명, SHA-256, 스냅숏 날짜와 제외 근거가 기록된다.

## 다시 생성

Python 3.11 이상과 `requirements.txt`의 `openpyxl`이 필요하다.

```powershell
python data/encar-car-depth-1005/generate_source.py `
  --source-dir "C:\Users\bobae\Downloads\Claude outputs" `
  --body-type-csv "C:\Users\bobae\Downloads\Claude outputs\grandeur_test_1005\hyundai_models_bodytype.csv"
```

생성기는 목표 건수와 부모 경로를 먼저 검증한다. 수동 교정은 생성 결과인 `encar-car-depth.normalized.json`에서만 하고, 파생 결과물을 직접 고치지 않는다.

엔카 원문은 `sourceName`에 공백까지 그대로 보존하고, 시안 표시는 공백을 정리한 `displayName`을 사용한다.

## 파생 결과물 생성

```powershell
npm run encar:build:catalog
$env:ADMIN_DB_PATH = ".tmp/encar-full-depth.sqlite"
npm run admin:seed:encar-full-depth
```

- 시안 공개 데이터: `public/data/encar-car-depth-1005/catalog.json`
- Node SQLite fixture: `admin-server/seed-encar-full-depth.mjs`

공개 JSON에는 엔카 코드·엔카 이미지 경로를 넣지 않는다. SQLite fixture는 같은 파일에 두 번 실행해도 추가 행이 생기지 않는다.

## 확정 건수

| 단계 | 건수 |
|---|---:|
| 제조사 | 63 |
| 모델그룹 | 663 |
| 세부모델(세대) | 1,256 |
| 연료·구동 | 2,158 |
| 등급 | 5,976 |
| 세부등급 | 3,297 |

원본 Catalog 시트의 연료·구동 2,160행과 등급 5,978행 중 각 2행은 원문명이 비어 있는 `쉐보레 › 기타 › 기타`, `기타 수입차 › 기타 › 기타` 행이다. 선택 가능한 노드가 아니므로 정규화 대상에서 제외하고 `meta.exclusions`에 원본 경로와 사유를 남긴다.
