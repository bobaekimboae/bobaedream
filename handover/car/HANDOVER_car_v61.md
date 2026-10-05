# HANDOVER_car_v61

## 1) 담당 범위

코덱스-중고차가 제조사·모델 바텀시트 뼈대에 PR #144의 엔카 6뎁스 `catalog.json`을 연결했다.

## 2) 현재 진행 상태

- 완료: 6뎁스 건수 검증, 화면 0~4 연결, 검색, 바디타입, 등급 묶음 선택, 매물 수 테스트 표기, 반응형 검수.
- 진행 중: 없음.
- 미착수: `gen_*.png` 실제 AI 이미지 연결.

## 3) 결정된 사항과 이유

- 화면 문구는 `displayName`, 정렬은 `sortOrder`, 숨김은 `isVisible=false`, 수입 인기는 `isPopular`를 원본 그대로 사용한다.
- 현대 바디타입만 DB 연결하고 검토 8건은 🟡로 노출한다.
- 이미지 필드가 없어 404를 만들지 않는 회색 실루엣과 파일 키 자리만 둔다.

## 4) 미결 사항·막힌 점

- 이미지 제작과 실제 파일 연결은 별도 PR 범위다.
- 머지·배포는 사용자 지시의 정지 조건이므로 미수행했다.

## 5) 산출물 목록

- `public/maker-model-skeleton-v01.html`
- `public/maker-model-skeleton-v01.css`
- `public/maker-model-skeleton-v01.js`
- `reports/maker-model-skeleton-db-qa-v01.md`
- `handover/car/HANDOVER_car_v61.md`

## 6) 다른 코덱스와 주고받은 자료

- 클로드 마스터 검수 완료 데이터: `public/data/encar-car-depth-1005/catalog.json`.
- 데이터 출처: `feat/encar-full-depth-1005`, PR #144.

## 7) 검수 상태

- 자체 검수 완료.
- 클로드 마스터 최종 감수 대기.

## 8) 다음에 할 일

1. 클로드 마스터가 실제 DB 연결 화면을 최종 감수한다.
2. 승인 후 별도 PR에서 그랜저 AI `gen_*.png`를 제작·연결한다.
3. 사용자 승인 전에는 머지·배포하지 않는다.

