# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v16`
- 작성일: 2026-10-02 (KST)
- 이전 문서: `HANDOVER_car_v15.md`

## 1) 담당 범위

- 중고차 실제 메인의 상단 타이틀, 알약형 GNB, 단일 검색창 규격을 담당한다.

## 2) 현재 진행 상태

- 완료: Google Drive 당근 원본 1080×2340px 확보.
- 완료: 384px/2.8125배 기준 픽셀 실측.
- 완료: 보배드림 상단 타이틀·알약칩·검색창 교정.

## 3) 결정된 사항과 그 이유

- 상단은 56px, 타이틀은 20px/700로 사용한다.
- 알약칩은 최소 53×36px, 글자 15px/700, 좌측 16px, 간격 8px로 사용한다.
- 비활성 칩은 `#F5F5F5` 배경과 투명 테두리, 활성 칩은 `#252A30` 배경을 사용한다.
- 검색창은 48px 높이와 좌우 16px를 유지하고 radius 12px, 아이콘 22px, 글자 15px/400으로 조정한다.

## 4) 미결 사항·막힌 점

- 첨부 당근 원본에는 검색 입력창이 없어 검색창 높이의 직접 실측은 불가능하다. 기존 단일 검색창 48px 규격을 유지했다.

## 5) 산출물 목록

- `src/main-home/main-home.css`
- `public/prototypes/autotrader-bobaedream-main/index.html`
- `reports/main-header-20261002/karrot-current-reference.png`
- `reports/main-header-20261002/bobaedream-before-karrot-match.png`
- `reports/main-header-20261002/bobaedream-after-karrot-match.png`
- `reports/main-header-20261002/karrot-bobae-top-comparison.png`
- `reports/main-header-20261002/karrot-header-measurement.md`
- `handover/car/HANDOVER_car_v16.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-자료 상호 검수 대기.

## 7) 검수 상태

- 로컬 384px/2.8125배 캡처 비교 완료.
- `npm run build`: 통과.
- `npm run test:sites`: 4건 통과.
- GitHub Pages 공개 배포: 성공.
- 공개 실측: 상단 56px, 타이틀 20px/700, 활성 칩 53×36px·15px/700, 검색창 352×48px·radius 12px.
- 공개 콘솔 오류: 0건.

## 8) 다음에 할 일

1. 첨부 원본에 검색 입력창이 포함된 화면이 제공되면 검색창도 직접 재실측한다.
