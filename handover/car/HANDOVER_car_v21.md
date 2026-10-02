# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v21`
- 작성일: 2026-10-02 (KST)
- 이전 문서: `HANDOVER_car_v20.md`

## 1) 담당 범위

- 중고차 실제 메인의 차량 카테고리 방향, 크기, 문구를 담당한다.

## 2) 현재 진행 상태

- 완료: 차량 이미지 진행 방향을 모두 왼쪽으로 통일.
- 완료: 차량·브랜드 슬롯 크기 재확인.
- 완료: `차량 카테고리` 하단 설명문구 제거.
- 완료: 로컬 브라우저 시각 검수.

## 3) 결정된 사항과 그 이유

- 차량 슬롯은 좐좐 실측과 맞춘 52×38px을 유지한다.
- 항목 폭 70px, 브랜드 원형 56×56px도 유지한다.
- 국산차·수입차·바이크·캠핑카만 수평 반전하고, 이미 왼쪽을 향한 트럭·전기차는 유지한다.
- 설명문구 제거 후 제목과 카테고리 사이 기존 18px 간격을 유지해 답답하지 않게 한다.

## 4) 미결 사항·막힌 점

- 없음.

## 5) 산출물 목록

- `src/main-home/MainHome.tsx`
- `src/main-home/main-home.css`
- `public/prototypes/autotrader-bobaedream-main/index.html`
- `reports/category-zhuanzhuan-20261002/05-direction-left-no-subtitle.png`
- `reports/category-zhuanzhuan-20261002/06-deployed-direction-left-no-subtitle.png`
- `reports/category-zhuanzhuan-20261002/direction-size-audit.md`
- `handover/car/HANDOVER_car_v21.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-자료 상호 검수 대기.

## 7) 검수 상태

- 로컬 브라우저 시각 검수 완료.
- `npm run build`: 통과.
- `npm run test:sites`: 4건 통과.
- GitHub Pages 공개 배포: 성공 (`3f88601`).
- 공개 접근성 트리에서 카테고리 설명문구 미노출과 11개 항목 노출 확인.

## 8) 다음에 할 일

1. 후속 차량 카테고리 요청을 반영한다.

