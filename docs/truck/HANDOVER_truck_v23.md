# 코덱스-특장 인수인계 v23

## 1) 담당 범위

- 트럭·특장 형식·세부형식 퀵필터의 이미지 카드 시안
- 경형·1톤 트럭의 하위 적재중량 펼침

## 2) 현재 진행 상태

- 완료: 형식·세부형식 카드를 FINN형 연회색 이미지 카드로 변경
- 완료: 선택 상태를 에어비앤비형 흰 배경·검정 외곽선으로 변경
- 완료: 모바일 88×96px, PC 112×108px 카드 규격 적용
- 완료: 긴 명칭 최대 2줄 표시 및 카드 전체 클릭·터치 영역 적용
- 완료: PC 좌측 필터에서 경형·1톤 하위 적재중량 펼침
- 완료: 모바일·PC 로컬 시각 검수 및 자동 회귀검수
- 미착수: GitHub Pages 배포

## 3) 결정된 사항과 그 이유

- 기본 카드는 FINN처럼 이미지와 명칭을 같은 면에 넣어 클릭 대상을 명확하게 했다.
- 선택 상태는 사용자 수정 요청에 따라 파란 배경 대신 에어비앤비형 흰 배경과 `#222222` 2px 외곽선을 사용한다.
- 긴 트럭 형식명은 정보 손실을 막기 위해 말줄임표 대신 최대 2줄로 표시한다.

## 4) 미결 사항·막힌 점

- 공개 주소 반영은 사용자의 배포 지시 대기 중이다.
- 엔카 현재 원문 필터의 경형 세부 톤수 전체 목록은 자동 접속 제한으로 미확인이다.

## 5) 산출물 목록

- `src/prototype/listing/qf-model-images.css` / v11 / FINN형 기본 카드와 에어비앤비형 선택 상태
- `src/prototype/listing/pc-bbmuseum.tsx` / v11 / 경형·1톤 적재중량 펼침 동작
- `src/prototype/listing/pc-bbmuseum.css` / v11 / PC 펼침 영역 스타일
- `src/prototype/filters/bbm-filter-parts.css` / v11 / 모바일 필터 펼침 스타일
- `tests/truck-payload-classification.spec.ts` / v02 / 카드 규격·색상·선택 상태 포함 5건 검수
- `docs/truck/truck_image_card_spec_v01.md` / v01 / 색상·크기·상태 기준
- `docs/truck/audits/2026-10-02/truck_finn_airbnb_cards_mobile_v01.png` / v01 / 모바일 기본 상태
- `docs/truck/audits/2026-10-02/truck_airbnb_selected_mobile_v01.png` / v01 / 모바일 선택 상태
- `docs/truck/audits/2026-10-02/truck_finn_airbnb_cards_pc_v01.png` / v01 / PC 세부형식 상태
- `docs/truck/HANDOVER_truck_v23.md` / v23 / 로컬 시안 인수인계

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 사용자 제공 FINN 모바일 참고 이미지 사용
- 사용자 확정: 선택 상태는 에어비앤비 방향
- 다른 코덱스 파일은 수정하지 않음
- 공개 배포 지시 대기 중

## 7) 검수 상태

- `npm run verify:qf`: 통과
- `npx playwright test tests/truck-payload-classification.spec.ts`: 5건 통과
- 390×844 모바일 기본·선택 상태 시각 검수: 완료
- 1280×900 PC 세부형식 시각 검수: 완료
- 공개 배포 검수: 미검수

## 8) 다음에 할 일

1. 사용자 시안 확인
2. 승인 시 GitHub Pages 배포
3. 공개 모바일·PC 주소에서 카드와 적재중량 펼침 최종 검수

