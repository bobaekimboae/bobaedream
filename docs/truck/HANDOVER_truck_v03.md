# 코덱스-특장 인수인계 v03

## 1) 담당 범위

- 화물·특장차 시안의 엔카 기준 형식·세부 형식 퀵필터

## 2) 현재 진행 상태

- 완료: 엔카 형식 13개 및 세부 형식 88개 데이터 정의
- 완료: `형식 → 세부 형식 → 제조사` 선택 흐름, 단계별 해제, 초기화, URL 복원
- 완료: 공개 GitHub Pages 배포 및 배포본 브라우저 검증
- 미착수: 트럭 가상 매물 기반 결과 대수 연동

## 3) 결정된 사항과 그 이유

- 엔카 매핑 자료의 명칭을 그대로 사용한다. 원본 자료와 화면 값의 일치가 우선이기 때문이다.
- 기존 퀵필터 알약 레일을 재사용해 모바일·PC와 접근성 구조를 유지한다.
- 상위 단계 해제 시 하위 단계도 해제해 서로 맞지 않는 선택 조합을 방지한다.

## 4) 미결 사항·막힌 점

- `트렉터`, `로우베드/릴리리` 표기 교정 여부: 미확인
- 트럭 가상 매물과 형식·세부 형식별 결과 수 연결: 미확인
- 전체 `npm run verify`의 관리자 헬스 엔드포인트 테스트 1건이 기존 경로에서 `404`로 실패. 이번 트럭 변경 범위 밖이며 Pages 배포 검증에는 영향 없음.

## 5) 산출물 목록

- `src/prototype/data/truck-format-catalog.ts` / v01 / 형식·세부 형식 데이터
- `src/prototype/listing/index.tsx` / v01 반영 / 화면 동작
- `docs/quick-filter-spec.md` / v01 반영 / 동작 규칙
- `docs/truck/HANDOVER_truck_v03.md` / v03 / 배포 결과
- `docs/truck/CHANGELOG_truck.md` / 변경기록

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-자료의 엔카 매핑 Google Sheet를 기준 자료로 사용
- 이미지·슬롯·가상 매물 30대 자료: 대기 중

## 7) 검수 상태

- `npm run check:runtime`: 통과
- `npm run verify:qf`: 통과
- `npm run build`: 통과
- `npm run test:sites`: 통과
- GitHub Pages 실행 `36953385947`: 성공
- 공개 배포본 브라우저 검증: 형식 13개, `윙바디/탑` 세부 형식 33개, 제조사 단계 전환 성공

## 8) 다음에 할 일

1. 트럭 가상 매물 자료 수신 후 결과 대수 연동
2. 원문 의심 표기 교정 여부 확정

## 배포 정보

- 배포 커밋: `31289b122c5a24e72b330acfc095b264ff4b40e1`
- 배포 실행: `https://github.com/bobaekimboae/bobaedream/actions/runs/36953385947`
- 공개 주소: `https://bobaekimboae.github.io/bobaedream/?qf=guazi&pc=1&category=%ED%8A%B8%EB%9F%AD%20%C2%B7%20%ED%8A%B9%EC%9E%A5&v=31289b1`
- 배포 번들: `index-BF4wsWj6.js`
