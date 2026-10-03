# HANDOVER_assets_v16

## 1) 담당 범위

- 차량 카테고리 실사 퀵필터의 초톳 슬롯 정렬과 오토스카우트24 실사 톤 통일

## 2) 현재 진행 상태

### 완료

- PC 실사 슬롯 76×40·모바일 64×40 적용
- 투명 캔버스 하단 기준선 정렬과 좌향 표시 적용
- 화물/특장을 표준 적재함 비례의 현대 포터 II 탑차 v03으로 교체
- 올드카를 1세대 포드 머스탱 패스트백으로 교체
- 오토스카우트24 흰색·은색 저채도 실사 톤 적용
- PC·모바일 자동 측정과 시각 비교 완료

### 진행 중

- 없음

### 미착수

- 없음

## 3) 결정된 사항과 그 이유

- 배치 규칙은 초톳을 따른다. 모바일 64×40과 PC 76×40은 현재 퀵필터 레일에서 식별성과 밀도를 함께 유지한다.
- 이미지 스타일은 오토스카우트24의 저채도 카탈로그 실사를 따른다. 여러 출처가 섞였을 때 생기는 색감 차이를 줄이기 위해서다.
- 각도는 보배드림의 3/4 시점을 유지하고 화면 방향은 좌향으로 통일한다.
- 원본 v01 파일은 보존하고 새 대상만 v02로 연결한다.

## 4) 미결 사항·막힌 점

- 없음

## 5) 산출물 목록

- `public/assets/category-photo/vehicle_type_cargo_truck_v02.png` (비례 수정 전 보존본)
- `public/assets/category-photo/vehicle_type_cargo_truck_v03.png`
- `public/assets/category-photo/vehicle_type_old_car_v02.png`
- `src/prototype/listing/stable-top.css`
- `src/prototype/listing/bbm-list.tsx`
- `scripts/normalize-category-photo-v02.py`
- `scripts/audit-category-photo-v02.mjs`
- `reports/category-photo-v02/`
- `design-qa.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 없음

## 7) 검수 상태

- 자동 측정 10/10 통과
- 초톳 레이아웃·오토스카우트24 스타일·보배드림 구현을 한 비교판에서 시각 대조
- 최종 디자인 QA 통과

## 8) 다음에 할 일

1. 공개 배포 후 PC·모바일 실주소를 재측정한다.
2. 사용자 실화면 검수에서 크기 보정 요청이 있으면 v03으로 분리한다.
