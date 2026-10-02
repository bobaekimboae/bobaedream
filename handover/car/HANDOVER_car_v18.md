# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v18`
- 작성일: 2026-10-02 (KST)
- 이전 문서: `HANDOVER_car_v17.md`

## 1) 담당 범위

- 중고차 실제 메인의 콘텐츠 섹션 타이틀 위계와 명칭을 담당한다.

## 2) 현재 진행 상태

- 완료: Google Drive 에어비앤비 원본 1080×2340px 확보.
- 완료: 384px/2.8125배 기준 섹션 타이틀 픽셀 실측.
- 완료: `인기 카테고리`, `인기 제조사`, `추천 매물` 타이틀 균형 교정.

## 3) 결정된 사항과 그 이유

- 섹션 제목은 20px/28px/700을 사용한다.
- 에어비앤비 원본과 보배드림 교정본의 가시 글자 높이는 각각 약 17.42px, 17.78px로 차이가 0.36px다.
- 우측 보조 링크는 13px/700으로 낮춰 제목보다 약한 위계를 유지한다.
- 첫 섹션 명칭은 `인기 카테고리`로 사용한다.

## 4) 미결 사항·막힌 점

- 없음.

## 5) 산출물 목록

- `src/main-home/MainHome.tsx`
- `src/main-home/main-home.css`
- `public/prototypes/autotrader-bobaedream-main/index.html`
- `reports/main-header-20261002/airbnb-section-reference.png`
- `reports/main-header-20261002/bobaedream-airbnb-title-match.png`
- `reports/main-header-20261002/airbnb-bobae-title-comparison.png`
- `reports/main-header-20261002/airbnb-title-measurement.md`
- `handover/car/HANDOVER_car_v18.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-자료 상호 검수 대기.

## 7) 검수 상태

- 로컬 동일 배율 비교 완료.
- 콘솔 오류 0건.
- 공개 배포 검수 예정.

## 8) 다음에 할 일

1. 공개 화면에서 세 섹션 제목의 계산 스타일을 확인한다.
