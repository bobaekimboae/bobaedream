# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v15`
- 작성일: 2026-10-02 (KST)
- 이전 문서: `HANDOVER_car_v14.md`

## 1) 담당 범위

- 중고차 실제 메인의 모바일 콘텐츠 섹션 제목 위계를 담당한다.

## 2) 현재 진행 상태

- 완료: `차량 카테고리`, `인기 제조사`, `추천 매물` 제목 크기와 굵기 통일.

## 3) 결정된 사항과 그 이유

- 콘텐츠 섹션 제목은 20px/28px/800로 통일한다.
- 기존 23px/900 이상 표현은 상단 보배드림 타이틀보다 강해 정보 위계가 뒤집히므로 낮춘다.
- 우측 보조 링크와 카드 본문, 차량 이미지 크기는 변경하지 않는다.

## 4) 미결 사항·막힌 점

- 없음.

## 5) 산출물 목록

- `src/main-home/main-home.css`
- `public/prototypes/autotrader-bobaedream-main/index.html`
- `handover/car/HANDOVER_car_v15.md`
- 공개 URL: `https://bobaekimboae.github.io/bobaedream/`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-자료 상호 검수 대기.

## 7) 검수 상태

- `npm run build`: 통과.
- `npm run test:sites`: 4건 통과.
- GitHub Pages 공개 배포: 성공.
- 공개 384px 화면 실측: 세 제목 모두 20px/28px/800 확인.

## 8) 다음에 할 일

1. 후속 메인 화면 균형 요청을 반영한다.
