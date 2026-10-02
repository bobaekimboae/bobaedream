# 코덱스-중고차 작업 인수인계서

- 코덱스 이름: 코덱스-중고차
- 파일용 코드: `car`
- 문서 버전: `v10`
- 작성일: 2026-10-02 (KST)
- 이전 문서: `HANDOVER_car_v09.md`

## 1) 담당 범위

- 중고차 실제 메인의 모바일 상단 타이틀과 우측 액션 영역을 담당한다.

## 2) 현재 진행 상태

- 완료: 당근중고차 캡처를 기준으로 상단 높이와 우측 액션 크기 교정.
- 완료: 우측 검색 아이콘을 즐겨찾기 아이콘으로 교체.
- 완료: 메뉴·즐겨찾기에 노션 SVG 원본 적용.
- 완료: 실제 메인과 독립 메인 프로토타입에 동일 규격 적용.
- 진행 중: 병렬 비교 캡처의 브라우저 보안 제한 해소 후 최종 디자인 QA.

## 3) 결정된 사항과 그 이유

- 상단 높이는 64px, 보배드림 타이틀 이미지는 114×28px로 사용한다.
- 우측 액션은 당근과 같은 44×44px 터치 영역, 실제 아이콘 24×24px, 아이콘 사이 추가 간격 0px로 통일한다.
- 메인에 통합 검색바가 있으므로 헤더 검색 아이콘은 제거하고 즐겨찾기와 전체 메뉴만 배치한다.
- 아이콘은 노션 원본 `chotot-common-favorite_(즐겨찾기).svg`, `chotot-common-menu_(메뉴).svg`를 사용한다.

## 4) 미결 사항·막힌 점

- 인앱 브라우저가 비교용 `data:` URL을 보안 정책으로 차단해 당근 원본과 수정본의 한 화면 병렬 캡처는 미완료다.
- 즐겨찾기·메뉴의 실제 목적지와 상태 동작은 미확인이다.
- 공개 배포는 이번 요청에 포함되지 않아 미배포 상태다.

## 5) 산출물 목록

- `src/main-home/MainHome.tsx`
- `src/main-home/main-home.css`
- `public/prototypes/autotrader-bobaedream-main/index.html`
- `public/prototypes/autotrader-bobaedream-main/icons/menu.svg`
- `public/prototypes/autotrader-bobaedream-main/icons/favorite.svg`
- `reports/main-header-20261002/karrot-reference.png`
- `handover/car/HANDOVER_car_v10.md`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-자료 상호 검수 대기.

## 7) 검수 상태

- 프로덕션 빌드 완료.
- 로컬 인앱 브라우저에서 보배드림 타이틀, 즐겨찾기, 메뉴 노출 확인.
- 64px 헤더, 44px 터치 영역, 24px 아이콘 적용 확인.
- 원본과 수정본 병렬 캡처는 보안 정책 제한으로 미검수.

## 8) 다음에 할 일

1. 최종 디자인 QA를 통과시킨다.
2. 사용자 요청 시 Pages에 배포하고 공개본 아이콘 404와 모바일 정렬을 확인한다.
3. 목적지가 확정되면 즐겨찾기·메뉴 버튼 동작을 연결한다.
