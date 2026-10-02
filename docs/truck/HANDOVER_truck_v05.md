# 코덱스-특장 인수인계 v05

## 1) 담당 범위

- 화물·특장차 시안의 엔카 기준 형식·세부 형식·적재용량/규격 뎁스와 가상 매물 목록

## 2) 현재 진행 상태

- 완료: Google Sheet 형식별 탭 13개 직접 대조
- 완료: 형식 13개·세부 형식 89개·4뎁스 1,944개 연결
- 완료: `형식 → 세부 형식 → 적재용량·규격 → 제조사 → 모델` 선택 흐름
- 완료: 승용 샘플을 트럭 전용 가상 매물 30대로 교체
- 완료: GitHub Pages 배포 및 공개 화면 클릭 검증

## 3) 결정된 사항과 그 이유

- `카테고리요약`뿐 아니라 `01_카고(화물)트럭`부터 `13_기타`까지 개별 탭을 기준으로 4뎁스를 구성했다.
- 4뎁스 요약 자리표시자(`n톤`, `n㎥` 등)는 화면 선택값에서 제외했다.
- 원본의 `기타기타`는 화면에서 `기타`로 정규화했다.
- 4뎁스가 없는 버스·트렉터 조합은 제조사 단계로 바로 이동한다.

## 4) 미결 사항·막힌 점

- `트렉터`, `로우베드/릴리리` 표기 교정 여부: 미확인
- 실제 매물 사진 수신 여부: 미확인. 현재 기존 트럭·버스·캠핑카·덤프 아이콘을 임시 사용한다.
- 가상 매물 30대는 UI 검증용이며 실제 판매 차량·가격·주소가 아니다.
- 전체 `npm run verify`의 관리자 헬스 경로 1건과 `test:sites` 관리자 제목 문구 1건은 다른 작업 범위의 기존 상태로 실패했다. 트럭 전용 빌드와 공개 화면 검증은 통과했다.

## 5) 산출물 목록

- `src/prototype/data/truck-format-catalog.ts` / v02 / 형식 13개·세부 형식 89개
- `src/prototype/data/truck-depth4-catalog.ts` / v01 / 4뎁스 1,944개
- `src/prototype/truck/scenario-v01.ts` / v01 / 가상 매물 30대
- `src/prototype/data/index.tsx` / v02 반영 / 트럭 전용 목록 데이터
- `src/prototype/listing/index.tsx` / v02 반영 / 전체 뎁스 선택·URL·목록 연동
- `docs/quick-filter-spec.md` / v02 반영 / 동작 규칙
- `docs/truck/HANDOVER_truck_v05.md` / v05 / 배포 완료 인수인계

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-자료의 엔카 매핑 Google Sheet 형식별 탭 13개를 기준 자료로 사용
- 실제 매물 이미지·슬롯 자료: 대기 중

## 7) 검수 상태

- `npm run check:runtime`: 통과
- `npm run verify:qf`: 통과
- 가상 매물 30대와 4뎁스 값 일치 검증: 통과
- 로컬 Playwright 클릭 검증: 통과
- GitHub Pages 실행 `36966769278`: 성공
- 공개 화면 검증: 형식 13개, 카고 4뎁스 60개, `1톤 → 현대 → 포터2` 결과 연동 통과

## 8) 다음에 할 일

1. 코덱스-자료의 실제 매물 이미지 수신 후 임시 썸네일 교체
2. 원문 의심 표기 교정 여부 확정

## 배포 정보

- 기능 배포 커밋: `1617af36e414b25aeb8e255801be28493bce7fbd`
- 배포 실행: `https://github.com/bobaekimboae/bobaedream/actions/runs/36966769278`
- 공개 주소: `https://bobaekimboae.github.io/bobaedream/?qf=guazi&pc=1&category=%ED%8A%B8%EB%9F%AD%20%C2%B7%20%ED%8A%B9%EC%9E%A5&v=1617af3`
- 배포 번들: `index-dL0KeCEc.js`
