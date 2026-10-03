# HANDOVER_assets_v22

## 1) 담당 범위

- 코덱스-자료(`assets`) 공통 이미지·슬롯·퀵필터 자료
- 이번 범위: 보배드림 차량 카테고리의 초톳식 상위 아이콘·하위 알약칩 구조

## 2) 현재 진행 상태

- 완료: 노션 제공 원본 SVG 7개를 영문 파일명으로 보존
- 완료: 상위 카테고리 7개를 아이콘형 가로 슬롯으로 구성
- 완료: 중고차 하위 12개를 32px 알약칩으로 구성
- 완료: 트럭/특장차의 기존 형식 13개를 하위 알약칩과 실제 형식 필터에 연결
- 완료: 캠핑카 하위 `전체`, `모터홈`, `캐러밴` 구성
- 완료: 바이크·건설기계·자재운반장비·부품/용품은 지시되지 않은 하위를 임의 생성하지 않고 `전체`만 구성
- 완료: PC 1440×900, 모바일 390×844 시각·동작 교차검사
- 미착수: 배포(이번 요청에 배포 지시 없음)

## 3) 결정된 사항과 그 이유

- 상위 카테고리는 44px(모바일 42px) 원형 아이콘 슬롯, 하위는 높이 32px 알약칩을 사용한다. 초톳의 인지 구조를 따르면서 PC·모바일에 같은 컴포넌트를 재사용하기 위함이다.
- 긴 하위 명칭은 말줄임표를 쓰지 않는다. 모바일은 칩 행 가로 스크롤, 바텀시트는 여러 줄 배치로 전체 명칭을 보존한다.
- 노션 SVG는 재작성하지 않고 원본 파일을 그대로 내려받아 사용한다. 아이콘 형태가 달라지는 재가공을 방지하기 위함이다.
- 트럭 형식은 새 분류를 만들지 않고 현재 `truckFormatCatalog` 13개와 연결한다.

## 4) 미결 사항·막힌 점

- 바이크·건설기계·자재운반장비·부품/용품의 세부 하위 명칭은 이번 지시에 없어 `전체`만 표시했다.
- 캠핑카 `모터홈`, `캐러밴`은 선택 상태까지 연결했으나 별도 매물 데이터 분류값은 미확인이다.
- 중고차의 리스/렌트차량·럭셔리카·슈퍼카·브랜드 인증중고차·매매단지별 검색·팔린매물·장애인차는 UI 필터 값은 연결했으나 전용 데이터 판별 필드는 미확인이다.

## 5) 산출물 목록

- `public/assets/category/icons/v01/category_used_car_v01.svg`
- `public/assets/category/icons/v01/category_truck_special_v01.svg`
- `public/assets/category/icons/v01/category_bike_v01.svg`
- `public/assets/category/icons/v01/category_camper_v01.svg`
- `public/assets/category/icons/v01/category_construction_v01.svg`
- `public/assets/category/icons/v01/category_material_handling_v01.svg`
- `public/assets/category/icons/v01/category_parts_v01.svg`
- `src/prototype/listing/bbm-list.tsx`
- `src/prototype/listing/stable-top.css`
- `src/prototype/filters/bbm-filter-parts.css`
- `src/prototype/listing/index.tsx`
- `src/ChoTotFilterSheet.tsx`
- `src/prototype/data/index.tsx`
- `CHANGELOG_assets.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 사용자 제공 노션 아이콘 페이지 7개를 원본 자료로 사용했다.
- 코덱스-중고차 검수 대기.

## 7) 검수 상태

- `vehicle category icon hierarchy / v05`: 미검수
- 자동 검증: `npm run verify:qf` 통과
- 수동 검증: 모바일 바텀시트에서 트럭/특장차 → 활어차 → 선택 후 `활어차` 형식 필터와 매물 1대 연결 확인

## 8) 다음에 할 일

1. 코덱스-중고차 상호 검수
2. 사용자 확정 시 미정 하위 분류와 실제 데이터 판별 규칙 연결
3. 사용자 배포 지시 후 배포·라이브 재검증
