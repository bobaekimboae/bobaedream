# 보배드림 차량유형 관리자 전수검수 및 수정 지시문

버전: 1.0  
기준일: 2026-09-23  
적용 대상: 공개 관리자 데모, Node 운영 계약 데모, Laravel 13 + Filament 5 실서버 관리자

## 1. 목표

이 관리자는 기존 중고차 단일 유형을 차량유형별 멀티 카테고리로 확장하기 위한 운영 시스템이다. 화면 시연만 가능한 데모가 아니라, 실서버에서 카테고리·가변 항목·화면 스키마·노출 위치·권한·검수·배포·롤백을 안전하게 운영할 수 있어야 한다.

현재 기준 유형은 아래 9개다.

- VEHICLE_TYPE: CAR, BIKE, TRUCK_SPECIAL, BUS, CAMPING_CARAVAN, CONSTRUCTION, MATERIAL_HANDLING
- ASSET_TYPE: ATTACHMENT, PARTS_GOODS

전기차·수입차·브랜드인증·매매단지·클래식·럭셔리·슈퍼카는 별도 차량유형이 아니다. OVERLAY, THEME_OVERLAY, TRANSACTION_TYPE, SELLER_CHANNEL과 category placement 조합으로 처리한다.

## 2. 전수검수 결론

현재 공개 관리자 화면은 정보 구조와 시각적 방향은 사용할 수 있으나, 실운영 완료 상태로 판정할 수 없다.

주요 이유는 다음과 같다.

1. 공개 페이지의 여러 버튼과 필터가 실제 데이터 동작 없이 팝업 또는 선택 표시만 제공한다.
2. 카테고리 의미 노드와 메뉴 노출 위치가 일부 섞여 있었다.
3. 공개 정적 데모, Node 계약 데모, Laravel 관리자 사이에 데이터 구조와 워크플로 정의 차이가 있다.
4. 화면에 표시된 API 정상·지연시간·배포 일정이 실제 측정값처럼 보였으나 공개 페이지는 정적 데모다.
5. 공개 화면의 Resolver가 결정론적 규칙 결과에 확률형 신뢰도를 표시했다.
6. 자동 검증 중 Sites Worker 테스트 2건이 테스트 환경 누락으로 실패했다.

## 3. 이번 수정에서 반영한 사항

### 3.1 공개 관리자

- 카테고리 노드와 placement를 분리해 표시한다.
- 지게차는 `FORKLIFT` 의미 노드 하나만 유지하고 `CONSTRUCTION/FORKLIFT`를 alias placement로 표시한다.
- 어태치먼트는 `ATTACHMENT` 의미 노드 하나만 유지하고 건설기계·부품용품 양쪽 노출은 placement로 표시한다.
- `FORKLIFT_CROSS_PLACEMENT`, `ATTACHMENT_CROSS_PLACEMENT` 같은 가짜 카테고리 키를 제거한다.
- 카테고리 상세에 매물 도메인, 정본 바인딩, Primary placement, Alias placement, 적용 스키마, 제외 규칙, 판매자 채널, 유료상품을 추가한다.
- Resolver의 신뢰도 표시를 제거하고 적용 규칙, 판정 방식, 상속 경로, fallback, 실제 노출 위치를 표시한다.
- 역할 선택에 따라 설계·승인 버튼 활성 상태가 바뀌도록 수정한다.
- 릴리스, 플랫폼, namespace, 작업 큐, 필드, 스키마 필터가 실제 목록에 반영되도록 수정한다.
- 상세 패널 닫기 버튼이 실제로 닫히도록 수정한다.
- 동적 문자열 출력에 HTML 이스케이프를 적용한다.
- 공개 화면의 `API 정상`, `p95`, 실배포 일정 표현을 정적 데모임이 명확한 문구로 수정한다.
- 운영 현황 숫자와 샘플 작업 수가 서로 맞도록 조정한다.
- Resolver 입력 중 상태·연료·가격·판매자 값이 판정 근거에 반영되도록 하고 DRAFT의 공개 노출을 차단한다.
- 클릭 가능한 사용자 메뉴와 요약 카드 등은 실제 화면 반응 또는 명시적 데모 안내를 제공한다.

### 3.2 자동 검증

- Sites Worker 테스트에 ASSETS 바인딩 모의를 추가한다.
- SPA fallback은 HTML 요청에만 적용되고 API·POST·정적 자산 404는 앱 셸로 바뀌지 않도록 검증한다.
- 카테고리와 placement 분리, 결정론적 Resolver, 필터 식별자를 계약 테스트에 추가한다.
- GitHub Pages 배포 워크플로가 전체 검증을 통과한 빌드만 배포하도록 게이트를 강화한다.
- 감사 해시 체인은 빈 테이블의 첫 기록까지 직렬화되도록 PostgreSQL transaction advisory lock을 적용한다.
- Node 분류 Projection의 `category_node_keys`와 `placement_keys`를 분리하고 수입차 전문관·트럭 통합 메뉴·지게차·어태치먼트 양쪽 노출을 alias placement로 저장한다.
- 기존 SQLite 파일은 `placement_keys_json` 컬럼을 자동 보강하고 신규 분류부터 의미 카테고리와 노출 위치를 각각 저장한다.
- Laravel 카테고리 깊이와 말단 여부는 운영자 수기 입력에서 제거하고 부모 변경 시 하위 트리까지 자동 재계산한다. 순환 참조, 다른 유형의 부모, 최대 8단계 초과를 저장 전에 차단한다.

## 4. 실서버 전환 전 P0 수정 지시

### P0-1. 정본 백엔드 하나로 통합

현재 Node 운영 계약 데모와 Laravel 실서버 코드가 별도 스키마를 사용한다. 두 구현을 동시에 정본으로 운영하면 필드·상태·배포 규칙이 달라진다.

조치:

1. Laravel/PostgreSQL을 실서버 정본으로 확정한다.
2. Node SQLite는 계약 테스트와 공개 데모 fixture 생성 용도로만 사용한다.
3. 공개 데모의 모든 seed는 Laravel 정본 스키마 또는 공통 seed manifest에서 자동 생성한다.
4. 같은 차량유형·카테고리·필드·스키마를 JS 배열과 PHP Seeder에 수동 중복 작성하지 않는다.
5. CI에서 공통 manifest와 Laravel seed, Node fixture, 공개 데모 snapshot의 해시 일치를 검증한다.

완료 기준:

- CAR 한 건을 수정하면 세 구현의 키·명칭·namespace가 같은 빌드에서 자동 갱신된다.
- 수동 복사 없이 공개 데모가 생성된다.

### P0-2. 카테고리 노드와 placement 영구 분리

카테고리 노드는 매물의 의미 분류이고 placement는 메뉴·탭·전문관의 노출 위치다.

필수 구조:

- category_node: 의미 키, 부모, 저장 depth, listing_domain, 등록·검색·목록·상세 가능 여부
- placement: 플랫폼, 메뉴 경로, 표시명, 순서, 공개 여부
- category_placement_binding: category_node_id, placement_id, PRIMARY 또는 ALIAS, 유효 버전
- registry_binding: VEHICLE_TYPE, ASSET_TYPE, OVERLAY, THEME, TRANSACTION, SELLER_CHANNEL 연결
- exclusion_rule: `ALL_VEHICLES`에서 `PARTS_GOODS` 제외 같은 규칙

금지:

- `FORKLIFT_CROSS_PLACEMENT`처럼 노출 방식을 category_node_key로 생성하지 않는다.
- 동일 의미의 수입차를 `IMPORTED_CAR`, `IMPORT_CAR` 두 노드로 복제하지 않는다.
- `TRUCK_SPECIAL_BUS`처럼 메뉴 묶음 이름을 차량 의미 노드로 저장하지 않는다.

완료 기준:

- 지게차 한 매물이 MATERIAL_HANDLING/FORKLIFT와 CONSTRUCTION/FORKLIFT에 노출되지만 category 의미 키는 FORKLIFT 하나다.
- 캠핑카와 버스도 독립 유형을 유지하면서 트럭·특장 통합 메뉴에 alias placement로 노출된다.
- 어태치먼트는 PARTS_LISTING 도메인을 유지하면서 건설기계와 부품용품 메뉴에 동시에 노출된다.

### P0-3. 스키마 종류와 운영 설계축 분리

실제 화면 스키마는 다음 네 종류를 기본으로 한다.

- FILTER
- REGISTRATION_FORM
- LIST_META
- DETAIL

다음 항목은 화면 스키마가 아니라 별도 운영 설계축 또는 정책 도메인이다.

- OPTION
- SELLER
- PAID_PRODUCT
- MAKE_MODEL
- QA_CHECKLIST
- PLATFORM_DIFF

조치:

- DB의 `schema_type`에 전부 넣지 말고 `definition_kind` 또는 별도 테이블로 분리한다.
- 화면 매트릭스에서는 같은 표에 나란히 볼 수 있지만 API와 DB 타입은 구분한다.
- 필수 완료율은 4개 화면 스키마와 필수 판매자 정책을 별도 계산한다.

### P0-4. Published 불변성과 버전 관리

현재 Laravel의 VehicleType, CategoryNode, FieldDefinition, Placement는 Published 상태와 버전이 없고 category_manager가 직접 수정할 수 있다. 공개 화면의 `Published는 Draft 복사본으로만 변경` 설명과 실제 동작이 일치하지 않는다.

조치:

- 위 엔터티에도 draft revision 또는 release-bound snapshot을 적용한다.
- Published 데이터의 직접 UPDATE·DELETE를 서비스와 DB 제약 양쪽에서 차단한다.
- 모든 변경은 Draft → Review Requested → QA Approved → Candidate → Publish 순서로 처리한다.
- 작성자와 QA 승인자, 배포자를 분리한다. 동일 사용자의 자기 승인 정책을 명시적으로 차단한다.
- rollback은 포인터만 바꾸는지 상태도 바꾸는지 정책을 한 가지로 통일한다.

### P0-5. 자산 매물 저장 구조

Laravel의 `listing_taxonomy_assignments.vehicle_type_id`가 필수이면 PARTS_GOODS와 ATTACHMENT를 정상 저장할 수 없다.

조치:

- vehicle_type_id와 asset_type_id를 nullable로 분리한다.
- 정확히 하나만 값이 있도록 CHECK 제약을 둔다.
- PARTS_GOODS는 `PARTS_LISTING + asset_type_id`로 저장하고 ALL_VEHICLES에서 제외한다.
- ATTACHMENT도 ASSET_TYPE을 유지하고 VEHICLE_TYPE으로 승격하지 않는다.

### P0-6. 인증·권한·감사

- 공개 데모의 역할 선택은 화면 미리보기일 뿐 실권한이 아니다.
- 실서버는 세션 인증과 서버 정책만 신뢰한다.
- UI disabled 여부와 무관하게 모든 API에서 권한을 재검증한다.
- 감사 해시 체인 생성은 동일 DB 트랜잭션과 직렬화 잠금 안에서 수행한다.
- 승인·배포·롤백에는 사유, 요청 ID, before/after, actor, source IP 정책을 기록한다.

### P0-7. 배포 게이트와 공개 데모 경계

- GitHub Pages 배포 전에 관리자 API 테스트, 정적 계약 테스트, Sites 라우팅 테스트, 전체 빌드를 모두 통과시킨다.
- 공개 데모는 정적 snapshot임을 상단과 상태 영역에 표시하고 실제 API 상태·지연시간·배포 성공으로 오인될 표현을 사용하지 않는다.
- 데모의 추가·수정·승인 버튼은 실제 저장이 아니라는 안내를 반드시 제공한다.
- Google Fonts 등 외부 UI 의존성은 사내망·장애 상황에도 핵심 조작을 방해하지 않도록 아이콘을 자체 번들하거나 텍스트 fallback을 둔다.

## 5. P1 기능 보강

### 5.1 카테고리 관리자

- 드래그 정렬 결과를 sort_order로 저장
- 부모 변경 시 depth 자동 계산
- 자기 자신 또는 하위 노드를 부모로 선택하는 순환 참조 차단
- 다른 VEHICLE_TYPE/ASSET_TYPE의 부모 연결 차단
- 말단 여부 자동 계산
- 자식·Published placement·매물 참조가 있으면 보관만 허용
- Primary placement 1개 필수, Alias placement 0개 이상
- PC 웹·모바일 웹·앱별 노출 여부와 순서
- 접근 URL 또는 route key 중복 검증

### 5.2 가변 항목 사전

- 필드 키 형식: `scope.field_name`
- 데이터형, UI 컴포넌트, 단위, 필수 수준, 검증 규칙, 조건부 노출, 선택값 집합
- 한국어 화면명과 영문 관리명
- 원본 근거 URL과 한국 적용 판단
- 개인정보·민감정보·법정고지 여부
- 폐기 대신 ARCHIVED 처리와 참조 영향도 표시

### 5.3 화면 스키마

- 화면의 실제 노출 순서 변경
- 섹션 단위 정렬
- 기본 노출과 더보기 노출 구분
- 필수·권장·선택·조건부 입력
- PC 웹·모바일 웹·앱·관리자 차이
- Draft 미리보기와 current 비교
- JSON 계약과 실제 화면 미리보기를 동시에 제공

### 5.4 차량유형별 최소 필드

다음 값은 추상 설명이 아니라 실제 스키마 항목으로 존재해야 한다.

- CAR: 제조사, 모델, 세대, 세부모델·트림, 연식, 최초등록, 가격, 주행거리, 연료, 변속기, 차체형식, 색상, 지역, 판매자, 사고·보험·성능점검
- BIKE: 제조사, 모델, 배기량, 연식, 가격, 주행거리, 기어방식, ABS, 차체유형, 용도, 엔진형식, 전기오토바이, 튜닝, 지역, 판매자
- TRUCK_SPECIAL: 유형, 제조사, 모델, 연식, 가격, 주행거리, 적재중량, 총중량, 축 구성, 구동, 특장 구조, 검사 유효기간, 차고지, 판매자
- BUS: 버스 유형, 제조사, 모델, 승차정원, 좌석배치, 용도, 연식, 가격, 주행거리, 연료, 변속기, 지역, 판매자
- CAMPING_CARAVAN: 형태, 베이스차량, 승차·취침 인원, 침상, 화장실, 샤워, 주방, 전기설비, 태양광, 확장, 연식, 가격, 주행거리, 지역, 판매자
- CONSTRUCTION: 장비유형, 제조사, 모델, 연식, 가격, 사용시간, 작업중량, 버킷용량, 궤도·휠, 상태, 어태치먼트 포함, 보관지, 판매자
- MATERIAL_HANDLING: 장비유형, 동력원, 인양능력, 인양높이, 마스트, 제조사, 모델, 연식, 가격, 사용시간, 배터리상태, 보관지, 판매자
- ATTACHMENT: 유형, 호환 장비, 호환 제조사·모델, 규격, 중량, 연결방식, 상태, 가격, 지역, 판매자
- PARTS_GOODS: 부품분류, 호환 차량유형·제조사·모델·연식, OEM 번호, 순정·애프터마켓·탈거품, 상태, 장착 위치, 가격, 배송·직거래, 개인·업체

## 6. 화면별 QA 순서

1. 운영 현황: 숫자와 실제 작업 큐 수 일치, 클릭 시 해당 필터가 적용된 작업 큐로 이동
2. 작업 큐: 전체·검수·매핑·담당자 필터, 빈 상태, SLA 정렬, 다음 행동 권한
3. 차량유형 관리: 검색, namespace 필터, 정렬, 중복 키, 금지 키, 상태 전환
4. 카테고리·배치: 트리 depth, 부모 관계, Primary/Alias, 양쪽 노출, 제외 규칙, 플랫폼별 노출
5. 정책 매트릭스: 상태·출시단계·플랫폼·릴리스 필터, 누락 계산, 상세 패널, 상속·fallback
6. 가변 항목 사전: 필수·선택·검수 필터, 데이터형과 UI 호환, 원본 링크, 참조 중 보관 차단
7. 화면 스키마: 검색·종류·상태 필터, 항목 순서, Draft 비교, 플랫폼 차이, 실제 JSON
8. 릴리스: 변경 목록 필터, 영향 매물, 자동 검증, QA 권한, 배포 권한, 롤백 가능 버전
9. Resolver: 입력 변경에 따른 유형·카테고리·placement·overlay 결과, 규칙 키·버전·fallback, dry-run 무변경
10. 기존 관리자 연동: source/outbox lag, dead letter, schema mismatch, 체크포인트, 재처리와 멱등성
11. 감사 로그: before/after, actor, role, request ID, 해시 체인, 필터·내보내기, 수정·삭제 불가
12. 반응형·접근성: 1440/1280/1024/768/390 너비, 키보드 이동, 포커스, 표 가로 스크롤, dialog, 명도 대비

## 7. 개발 완료 판정

다음 조건을 모두 충족해야 개발 완료로 판정한다.

- 공개 데모가 실서버 연결 상태를 허위로 표시하지 않는다.
- 모든 버튼은 실제 동작, 명시적 비활성, 또는 `공개 데모 제한` 중 하나다.
- 필터를 누르면 목록 또는 상세가 실제로 바뀐다.
- category_node와 placement가 DB, API, UI에서 분리된다.
- 9개 유형·자산 모두 FILTER, REGISTRATION_FORM, LIST_META, DETAIL과 판매자 정책을 가진다.
- 양쪽 노출은 복제 노드가 아닌 alias placement로 검증된다.
- 결정론적 Resolver에 확률형 신뢰도를 표시하지 않는다.
- Published 직접 수정이 서버에서 차단된다.
- 역할별 허용·거부 API 테스트가 있다.
- 배포 전 자동 테스트, 계약 테스트, 마이그레이션 테스트, 스모크 테스트가 전부 통과한다.
- 실패 시 current 릴리스를 유지하고 이전 버전으로 원자적 롤백할 수 있다.
- 기존 중고차 관리자 원본 데이터는 전환 완료 전까지 legacy authoritative로 유지한다.

## 8. 남은 작업 우선순위

1. P0: Laravel 정본과 Node/public fixture 자동 생성 통합
2. P0: category-placement binding 테이블과 API 구현
3. P0: Published revision·승인 분리·자산 assignment 구조 수정
4. P1: 실제 필드·스키마 편집기와 비교 화면
5. P1: 플랫폼별 화면 스키마 미리보기와 실 프런트 계약 테스트
6. P1: 기존 관리자 shadow read → dual read → 단계적 전환
7. P2: 대량 업로드, 일괄 수정, 운영 리포트, 판매자 상품 실험
