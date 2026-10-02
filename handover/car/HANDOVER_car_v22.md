# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v22`
- 작성일: 2026-10-02 (KST)
- 이전 문서: `HANDOVER_car_v21.md`

## 1) 담당 범위

- 중고차 실제 메인의 차량 카테고리 이미지와 섹션 경계를 담당한다.

## 2) 현재 진행 상태

- 완료: 차량 카테고리 위 구분선 제거.
- 완료: 차량 이미지 6종을 ImageGen으로 왼쪽 진행 방향의 실제 이미지로 재제작.
- 완료: 6종을 동일한 512×320 투명 캔버스와 52×38px 화면 슬롯으로 통일.
- 완료: CSS 수평 반전 제거.
- 완료: 로컬 빌드·브라우저 검수.
- 진행 중: GitHub Pages 공개 배포.

## 3) 결정된 사항과 그 이유

- 차량 이미지는 CSS 반전이 아닌 원본 자체가 왼쪽을 향하게 제작해 조명·차체 디테일이 자연스럽게 보이도록 했다.
- 모든 이미지 소스는 512×320 투명 PNG로 맞추고 기존 52×38px 슬롯은 유지해 레이아웃 변화 없이 품질만 높였다.
- 검색창과 차량 카테고리는 같은 흰색 흐름이므로 카테고리 섹션의 상단 테두리만 제거했다. 다른 섹션 경계는 유지한다.

## 4) 미결 사항·막힌 점

- 없음.

## 5) 산출물 목록

- `src/main-home/MainHome.tsx`
- `src/main-home/main-home.css`
- `public/prototypes/autotrader-bobaedream-main/index.html`
- `public/prototypes/autotrader-bobaedream-main/category-vehicles-v3/*.png`
- `reports/category-imagegen-20261002/local-mobile.png`
- `reports/category-imagegen-20261002/imagegen-vehicle-audit.md`
- `handover/car/HANDOVER_car_v22.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-자료 상호 검수 대기.

## 7) 검수 상태

- 내장 ImageGen 생성 결과 6종 투명도·방향 확인 완료.
- 로컬 브라우저 시각 검수 완료.
- `npm run build`: 통과.
- `npm run test:sites`: 4건 통과.
- GitHub Pages 공개 배포: 진행 중.

## 8) 다음에 할 일

1. 공개 링크에서 이미지 6종과 상단 구분선 제거 상태를 재확인한다.

