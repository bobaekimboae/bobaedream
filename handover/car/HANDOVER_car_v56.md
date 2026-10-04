# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v56`
- 작성일: 2026-10-04 (KST)
- 이전 문서: `HANDOVER_car_v55.md`

## 1) 담당 범위

- 트럭·특장 퀵필터의 2뎁스 표시 방식과 정확한 적재중량 연결.

## 2) 현재 진행 상태

- 완료: 2뎁스 반복 실사 이미지를 제거하고 2줄 카드형 칩 레일로 교체.
- 완료: 카고 6개 차급의 대표 적재 범위를 연속 구간으로 정리.
- 완료: 새 차급 키와 구형 적재중량 데이터 키의 불일치 교정.
- 완료: 모바일·PC·긴 세부 형식·다음 톤수 단계·콘솔 오류 검수.

## 3) 결정된 사항과 그 이유

- 1뎁스는 차량 형식을 이미지로 빠르게 인지하는 단계이므로 실사 이미지를 유지한다.
- 2뎁스는 이미 선택한 형식 안에서 명칭을 비교하는 단계이므로 이미지보다 텍스트 칩의 정보 밀도가 높다.
- 카고는 차급명과 대표 적재 범위를 함께 표시하고 실제 승인 톤수는 다음 단계에서 고른다.

## 4) 미결 사항·막힌 점

- 없음.

## 5) 산출물 목록

- `docs/truck/truck_depth2_chip_rail_plan_v01.md`
- `src/prototype/quick-filter/index.tsx`
- `src/prototype/listing/index.tsx`
- `src/prototype/listing/qf-model-images.css`
- `src/prototype/data/truck-format-catalog.ts`
- `src/prototype/data/truck-depth4-catalog.ts`
- `tests/truck-payload-classification.spec.ts`
- `design-qa.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 새 요청 없음.

## 7) 검수 상태

- 검수완료: 390×844 모바일, 1280×900 PC.
- 검수완료: Playwright 관련 테스트 5건.
- 검수완료: `npm run verify:qf`, 브라우저 콘솔 오류 0건.

## 8) 다음에 할 일

1. 운영 API 연결 시 차급별 실제 매물 수를 두 번째 줄 또는 보조 배지로 표시할지 검토.
2. 사용자 확인 후 2뎁스 칩의 최소 너비와 배경 농도만 미세 조정.
