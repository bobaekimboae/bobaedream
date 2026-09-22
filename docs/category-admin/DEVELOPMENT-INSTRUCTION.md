# 보배드림 차량유형별 멀티 카테고리 관리자 개발 지시문

문서 상태: 개발 착수 정본 1차 구현본  
적용 코드: `admin-server/`, `public/category-admin/`  
최초 구현 범위: `CAR`, `TRUCK_SPECIAL`, `PARTS_GOODS`

## 1. 개발 목표

기존 중고차 중심 관리자 구조를 폐기하지 않고 매물 운영 정본으로 유지한다. 신규 관리자는 차량유형별 카테고리, 화면 스키마, 제조사·모델, 판매채널, 유료상품과 배포 버전을 관리하는 Control Plane으로 구현한다.

두 관리자 시스템은 DB 테이블을 임의로 공유하는 방식이 아니라 다음 계약으로 연결한다.

1. 기존 매물 관리자는 `listing_id`, 매물 상태, 가격, 판매자, 사진과 거래 상태의 정본이다.
2. 신규 설정 관리자는 Published 스키마와 카테고리 판정 규칙의 정본이다.
3. `legacy_field_mappings`가 기존 컬럼을 신규 `variable_item.item_key`로 변환한다.
4. 매물 변경 이벤트를 받은 Projection Builder가 다중 카테고리와 검색 필드를 계산한다.
5. PC웹·모바일웹·앱은 운영 DB를 실시간 다중 JOIN하지 않고 Published snapshot과 검색 Projection을 사용한다.

## 2. 절대 분리할 개념

| 개념 | 의미 | 예시 |
|---|---|---|
| `VEHICLE_TYPE` | 매물의 기본 차량유형 | CAR, BIKE, TRUCK_SPECIAL |
| `ASSET_TYPE` | 차량 본체가 아닌 거래 자산 | ATTACHMENT, PARTS_GOODS |
| `CATEGORY_NODE` | 사용자에게 보이는 분류 | 수입차, 전기차, 캠핑카 |
| `CATEGORY_PLACEMENT` | 플랫폼별 메뉴 노출 위치 | 모바일앱 수입차 전문관 |
| `OVERLAY` | 기본 유형 위에 겹치는 속성 | EV_OVERLAY, IMPORT_OVERLAY |
| `THEME_OVERLAY` | 테마 전문관 조건 | CLASSIC_OLD, SUPERCAR |
| `TRANSACTION_TYPE` | 거래 방식 | LEASE_TAKEOVER |
| `SELLER_CHANNEL` | 판매자·공급 채널 | 개인, 딜러, 매매단지 |
| `SERVICE_BM` | 서비스와 과금 모델 | 상단노출, 리드 과금 |

금지 규칙:

- `IMPORT_CAR`, `EV_OVERLAY`, `PARTS_GOODS`, `ATTACHMENT`, 매매단지, 딜러를 `VEHICLE_TYPE`으로 생성하지 않는다.
- 매물에 단일 `category_id`를 저장해 다중 노출을 표현하지 않는다.
- `variable_items`에 화면별 순서·필수 여부를 저장하지 않는다.
- Draft 스키마를 공개 API로 반환하지 않는다.
- `PARTS_GOODS`를 차량 등록폼으로 처리하지 않는다.

## 3. 기존 중고차 관리자와의 조인 계약

### 3.1 정본 소유권

| 데이터 | 정본 시스템 |
|---|---|
| 매물 ID·판매상태·삭제상태 | 기존 매물 관리자 |
| 판매자·가격·사진·문의 | 기존 매물 관리자 |
| 차량유형·자산유형 정의 | 신규 설정 관리자 |
| 카테고리·중복 노출 규칙 | 신규 설정 관리자 |
| 필터·등록·리스트·상세 스키마 | 신규 설정 관리자 |
| 제조사·모델 표준키 | 신규 설정 관리자 |
| 기존 제조사·모델 코드 | 기존 매물 관리자 |
| 검색 Projection | 검색/조회 계층 |

### 3.2 조인 키

- 매물: 기존 `listing_id`를 전 구간에서 유지한다.
- 설정: 외부 연동에는 변경 가능한 숫자 PK가 아니라 `namespace:system_key`를 사용한다.
- 제조사·모델: 신규 master ID와 기존 코드를 매핑 테이블로 연결한다.
- 등록 데이터: 저장 시 사용한 `schema_version`과 `schema_hash`를 함께 기록한다.
- 카테고리: 단일 컬럼이 아니라 `listing_category_resolutions`에 다중 행으로 저장한다.

### 3.3 연동 이벤트

필수 이벤트:

- `ListingCreated`
- `ListingUpdated`
- `ListingStatusChanged`
- `ListingDeleted`
- `SchemaPublished`
- `SchemaRolledBack`
- `MakeModelMasterPublished`
- `CategoryRulePublished`

생산 환경에서는 Transactional Outbox와 Inbox 멱등성 검증을 적용한다. 현재 구현은 `outbox_events`에 배포 및 Projection 이벤트를 저장한다.

## 4. 관리자 기능 완료 기준

### 4.1 유형 레지스트리

- namespace별 추가·수정·보관
- `system_key` 중복 차단
- 금지된 vehicle type 조합 차단
- 출시 단계 `P1_LAUNCH`, `P2_NEXT`, `HOLD`, `RESEARCH`
- 표시 범위 `PC_WEB`, `MOBILE_WEB`, `MOBILE_APP`, `ADMIN`

### 4.2 카테고리와 Placement

- 부모·자식 트리
- 하나의 유형을 여러 카테고리에 연결
- 하나의 카테고리를 플랫폼별 여러 메뉴 위치에 배치
- 전체 차량에서 특정 자산유형 제외
- 검색·등록·리스트·상세 활성화 상태 개별 관리

### 4.3 가변 항목 사전

- 항목 키·한국어 화면명·데이터 타입·UI 컴포넌트
- 단위·검증 규칙·선택값 참조
- 원본 레퍼런스 사이트와 URL
- 한국 적용 판단
- 참조 중인 항목 삭제 시 물리 삭제 대신 `ARCHIVED`

### 4.4 화면 스키마

독립 배포 단위:

- FILTER
- REGISTRATION_FORM
- LIST_META
- DETAIL
- OPTION
- SELLER
- PAID_PRODUCT
- MAKE_MODEL

해석 우선순위:

1. `category_node` 전용 Published 스키마
2. `vehicle_type` 또는 `asset_type` 기본 Published 스키마
3. Global fallback

### 4.5 승인과 배포

상태 흐름:

```text
DRAFT → REVIEW_REQUESTED → QA_APPROVED → PUBLISHED
                                      └→ ROLLED_BACK
PUBLISHED → ARCHIVED
```

권한:

- `SUPER_ADMIN`: 전체
- `PRODUCT_OWNER`: 작성·검수 요청
- `CATEGORY_MANAGER`: 카테고리·항목 작성·검수 요청
- `QA_REVIEWER`: QA 승인
- `PUBLISHER`: 배포·롤백
- `READ_ONLY`: 조회

배포 시 수행할 일:

1. 항목 참조와 레퍼런스 URL 검증
2. 한국 적용 판단 누락 검증
3. 등록폼 필수항목 검증
4. canonical JSON 생성
5. SHA-256 `schema_hash` 생성
6. `publish_versions.published_json_snapshot` 저장
7. 이전 활성 버전 비활성화
8. `SchemaPublished` outbox 이벤트 저장

## 5. 첫 구현 시드

### CAR 등록 필수

- 제조사
- 모델
- 연식
- 최초등록
- 가격
- 주행거리
- 연료·동력
- 변속기
- 지역
- 판매자 유형
- 사고 여부

### TRUCK_SPECIAL 등록 필수

- 트럭·특장 유형
- 제조사
- 모델
- 연식
- 가격
- 주행거리
- 적재중량
- 차고지·보관지

### PARTS_GOODS 등록 필수

- 부품 카테고리
- 호환 차량유형
- 호환 제조사·모델·연식
- OEM 번호
- 순정·애프터마켓·탈거품 구분
- 상태
- 장착 위치
- 가격
- 배송·직거래
- 개인·업체 판매자 구분

## 6. API 계약

공개 조회:

```http
GET /api/v1/placements
GET /api/v1/placements/{placement_key}/schemas/{schema_type}?platform=MOBILE_APP
```

관리자:

```http
GET|POST /api/admin/registry
PATCH|DELETE /api/admin/registry/{id}
GET|POST /api/admin/categories
PATCH|DELETE /api/admin/categories/{id}
GET|POST /api/admin/variables
PATCH|DELETE /api/admin/variables/{id}
GET|POST /api/admin/schemas
POST /api/admin/schemas/{id}/actions/request-review
POST /api/admin/schemas/{id}/actions/approve
POST /api/admin/schemas/{id}/actions/publish
POST /api/admin/schemas/{id}/actions/rollback
GET|POST /api/admin/manufacturers
GET|POST /api/admin/models
```

기존 관리자 연동:

```http
POST /api/internal/v1/listings/{listing_id}/classify?dry_run=true
POST /api/internal/v1/listings/{listing_id}/classify
GET  /api/internal/v1/listings/{listing_id}/projection
```

## 7. 배포 전 필수 교체

현재 GitHub 구현은 계약 검증과 통합 개발을 바로 시작할 수 있는 실행형 수직 절편이다. 보배드림 운영망 반영 전 다음 항목을 반드시 교체한다.

1. SQLite 저장소를 운영 PostgreSQL/MySQL repository로 교체한다.
2. `X-Admin-Email`, `X-Admin-Role` 직접 입력을 금지하고 사내 SSO/OIDC와 API Gateway 검증값을 사용한다.
3. 기존 매물 관리자 실제 테이블과 `legacy_field_mappings`를 대조한다.
4. Kafka/SQS/RabbitMQ 또는 사내 메시지 인프라에 Outbox publisher를 연결한다.
5. 검색 Projection을 Elasticsearch/OpenSearch 인덱스 문서로 연결한다.
6. 운영 캐시 키에 `schema_hash`를 포함하고 배포 이벤트로 무효화한다.
7. 관리자 모든 쓰기 API에 CSRF, rate limit, IP 정책과 보안 로그를 적용한다.
8. 공개 저장소에는 실서버 URL, 계정, 토큰, 판매자 개인정보와 실제 매물 데이터를 저장하지 않는다.

## 8. 마이그레이션 단계

1. **Shadow Read**: 기존 매물을 읽어 신규 분류 결과만 저장한다.
2. **Mapping QA**: 기존 제조사·모델·연료·변속기 코드 매핑 불일치를 수정한다.
3. **Dual Validation**: 기존 검증과 신규 스키마 검증을 동시에 실행하되 초기에는 로그만 남긴다.
4. **CAR Canary**: 내부 운영자 및 일부 트래픽만 신규 Projection을 사용한다.
5. **Read Switch**: 검색 목록을 신규 Projection으로 전환한다.
6. **New Type Launch**: TRUCK_SPECIAL, PARTS_GOODS부터 신규 등록을 시작한다.
7. **Legacy Config Retirement**: 하드코딩 필터와 등록 설정을 단계적으로 제거한다.

## 9. 완료 판정 명령

```bash
npm run admin:seed
npm run test:admin
npm run admin:start
npm run verify
docker compose -f deploy/category-admin/compose.yaml up --build
```

다음 테스트가 실패하면 배포 금지:

- IMPORT_CAR·EV_OVERLAY·딜러·매매단지가 VEHICLE_TYPE으로 저장되는지
- Draft가 공개 API에 노출되는지
- 필터 배포가 등록폼 버전을 덮어쓰는지
- Rollback이 이전 snapshot으로 돌아가지 않는지
- PARTS_GOODS가 전체 차량에 섞이는지
- 동일 매물이 수입차·전기차·테마관에 중복 노출되지 않는지
- READ_ONLY 사용자가 설정을 수정할 수 있는지
