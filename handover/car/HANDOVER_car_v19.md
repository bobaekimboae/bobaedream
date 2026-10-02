# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v19`
- 작성일: 2026-10-02 (KST)
- 이전 문서: `HANDOVER_car_v18.md`

## 1) 담당 범위

- 중고차 실제 메인의 차량 카테고리와 콘텐츠 섹션 타이포그래피를 담당한다.

## 2) 현재 진행 상태

- 완료: Google Drive 초톳 메인 원본 1080×2340px 확보.
- 완료: 초톳 `Toyota` 타이틀과 하단 설명문구 실측.
- 완료: 인기 제조사 섹션 전체 제거.
- 완료: `차량 카테고리`와 `추천 매물` 제목·서브 타이틀 규격 통일.
- 완료: 차량 카테고리명이 차량 이미지 아래에 유지되는지 확인.

## 3) 결정된 사항과 그 이유

- 섹션 제목은 초톳 Toyota와 동급인 20px/28px/700을 사용한다.
- 섹션 설명은 14px/20px/400, `#8A8A8A`를 공통 사용한다.
- 제목과 설명 사이는 2px 여백을 사용한다. 원본 가시 글자 간격 약 6 CSS px를 글꼴 자체 여백과 함께 재현하기 위한 값이다.
- 첫 섹션 명칭은 사용자 요청대로 `차량 카테고리`를 사용한다.
- 차량명은 이미지 하단에 유지하고 이미지와 7px 간격을 둔다.

## 4) 미결 사항·막힌 점

- 없음.

## 5) 산출물 목록

- `src/main-home/MainHome.tsx`
- `src/main-home/main-home.css`
- `public/prototypes/autotrader-bobaedream-main/index.html`
- `reports/main-header-20261002/chot-main-reference.png`
- `reports/main-header-20261002/bobaedream-chot-title-match.png`
- `reports/main-header-20261002/deployed-chot-title-match.png`
- `reports/main-header-20261002/chot-bobae-title-comparison.png`
- `reports/main-header-20261002/chot-title-measurement.md`
- `handover/car/HANDOVER_car_v19.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-자료 상호 검수 대기.

## 7) 검수 상태

- 로컬 동일 폭·배율 비교 완료.
- 제조사 섹션 미노출 확인.
- 차량 이미지 하단 카테고리명 8개 확인.
- 콘솔 오류 및 이미지 404 0건.
- `npm run build`: 통과.
- `npm run test:sites`: 4건 통과.
- GitHub Pages 공개 배포: 성공 (`2f15e47`).
- 공개 계산 스타일: 제목 20px/28px/700, 설명 14px/20px/400, `#8A8A8A`.
- 공개 콘솔 오류 및 이미지 404: 0건.

## 8) 다음에 할 일

1. 후속 메인 화면 요청을 반영한다.

