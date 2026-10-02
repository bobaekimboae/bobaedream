# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v20`
- 작성일: 2026-10-02 (KST)
- 이전 문서: `HANDOVER_car_v19.md`

## 1) 담당 범위

- 중고차 실제 메인의 차량 카테고리 구성과 시각 규격을 담당한다.

## 2) 현재 진행 상태

- 완료: Google Drive 좐좐 원본 1080×2400px 확보.
- 완료: 좐좐 차량·브랜드 2단 카테고리 실측.
- 완료: 차량 분류 6개와 럭셔리 브랜드 5개 구성 적용.
- 완료: 실제 차량 컷아웃과 실제 브랜드 로고 연결.
- 완료: 로컬 브라우저 시각 검수 및 이미지 응답 확인.

## 3) 결정된 사항과 그 이유

- 카테고리는 좐좐처럼 두 행으로 분리한다.
- 첫 행은 차량 이미지형, 둘째 행은 56px 원형 브랜드형을 사용한다.
- 항목 폭은 70px로 고정해 384px에서 다음 항목 일부가 보이도록 한다.
- 차량 분류는 `국산차·수입차·트럭·바이크·전기차·캠핑카` 순서다.
- 럭셔리 브랜드는 `포르쉐·람보르기니·페라리·벤틀리·롤스로이스` 순서다.
- 브랜드 로고는 기존 검수된 `assets/brand/kr` 원본을 사용한다.

## 4) 미결 사항·막힌 점

- 없음.

## 5) 산출물 목록

- `src/main-home/MainHome.tsx`
- `src/main-home/main-home.css`
- `public/prototypes/autotrader-bobaedream-main/index.html`
- `reports/category-zhuanzhuan-20261002/zhuanzhuan-reference.jpg`
- `reports/category-zhuanzhuan-20261002/01-reference-category.png`
- `reports/category-zhuanzhuan-20261002/02-local-applied.png`
- `reports/category-zhuanzhuan-20261002/03-reference-applied-comparison.png`
- `reports/category-zhuanzhuan-20261002/zhuanzhuan-category-measurement.md`
- `handover/car/HANDOVER_car_v20.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-자료 상호 검수 대기.

## 7) 검수 상태

- 로컬 브라우저 시각 검수 완료.
- 이미지 10개 응답 상태 200.
- `npm run build`: 통과.
- `npm run test:sites`: 4건 통과.
- GitHub Pages 공개 배포: 미배포.

## 8) 다음에 할 일

1. 사용자 확인 후 공개 배포한다.

