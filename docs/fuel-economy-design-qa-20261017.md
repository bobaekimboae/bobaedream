# 연비·전비 게시판 디자인 QA

## 비교 기준

- 원본 동처띠 전기차 작성 화면: `artifacts/fuel-economy-crosscheck-20261017/09-dongchedi-ev-form.png`
- 원본 동처띠 내연기관 작성 화면: `artifacts/fuel-economy-crosscheck-20261017/07-dongchedi-ice-form.png`
- 원본 동처띠 플러그인 하이브리드 작성 화면: `artifacts/fuel-economy-crosscheck-20261017/01-dongchedi-current.png`
- 구현 전기차 상단: `artifacts/community-fuel-economy-gate-1017/03-writer-ev-top.png`
- 구현 전기차 입력 항목: `artifacts/community-fuel-economy-gate-1017/03-writer-ev-fields.png`
- 구현 피드: `artifacts/community-fuel-economy-gate-1017/01-list-mobile.png`
- 구현 상세: `artifacts/community-fuel-economy-gate-1017/02-detail-mobile.png`

## 최종 비교 결과

- 레이아웃: 원본의 사진 3열, 제목·본문 카드, 차량 정보 카드, 연료별 가변 행 순서를 유지했다. 보배드림 버전은 동처띠 노랑 대신 요청된 검정 CTA와 중립 회색 토큰을 사용했다.
- 타이포그래피: Pretendard를 유지하고 모바일 본문 14~15px, 제목 16~22px, 보조문구 10~13px 계층을 확인했다.
- 차량 선택: 브랜드 → 차종 → 세부 모델 3단계와 뒤로가기, 검색, 선택 상태를 확인했다.
- 지역 선택: 한국 17개 시·도 검색과 선택 상태를 확인했다.
- 연료별 입력: 내연기관, 하이브리드, 전기차, 플러그인 하이브리드 네 가지 조합을 각각 검증했다. 전기차는 측정 온도 15℃와 완충 실주행거리를 같은 행에 표시한다.
- 이미지: 업로드 슬롯과 실제 계기판 참고 이미지 2장을 사용하며 가짜 SVG 대체 이미지는 없다.
- 아이콘: 기존 레딧·초톳·오토스카우트 계열 자산만 사용했다.
- 상세 화면: 브랜드 엠블럼을 54×54px 원형으로 고정했고, 전기차 상세에 측정 온도가 유지된다.
- 반응형: 390×844 모바일과 1440×900 PC에서 가로 넘침이 없고, 모바일 내부 스크롤이 실제로 동작한다.
- 접근성: 모델·지역 선택은 의미 있는 버튼/대화상자로 구성했고, 온도와 완충거리에 별도 접근성 이름을 부여했다.

## 자동 검증

- `npm run community:verify:fuel-economy`: PASS 25 / FAIL 0 / 브라우저 오류 0
- `npm run verify`: 통과
- 모바일 런타임 보호 파일 28개 무결성 검사: 통과

## 수정 반복

1. 모바일 스크롤 불가, 차량 단일 선택, 지역 8개 제한, 전기차 온도 누락, 참고 이미지 누락을 수정했다.
2. 카드가 좌측으로 잘리는 inline label 문제를 수정하고 좌우 10px 여백과 카드 반경을 원본 구조에 맞췄다.
3. 상세 브랜드 엠블럼이 가로로 늘어나는 flex 충돌을 수정하고 54px 원형 회귀 검사를 추가했다.

final result: passed


## 50대 차량 확장 검증 · 2026-10-17

- deployed list: `/community/naver-cafe-list.html?board=fuel-economy&v=79f6c63c`
- deployed writer: `/?community=fuel-economy&fuel=write&from=community&v=79f6c63c`
- source/implementation combined comparison: `artifacts/fuel-economy-crosscheck-20261017/99-writer-ev-side-by-side.png`.
- data completeness: 목록 50건, 모델 ID 50개, 중복 0건, 필수값 누락 0건, 잘못된 날짜 0건.
- powertrain coverage: 내연기관 17대, 전기차 14대, 플러그인 하이브리드 11대, 하이브리드 8대.
- writer catalog: BMW 25개, 벤츠 22개, 포르쉐·람보르기니·렉서스 각 1개로 목록과 동일한 50개 차종을 제공한다.
- list QA: 전체 50건, 전기차 필터 14건, 모델별 실제 이미지, 깨진 이미지 0건, 콘솔 오류 0건.
- detail QA: 모델·동력원에 따른 연비/전비/완충거리·온도·주행거리·지역·측정일, 갤러리, 댓글과 반응 영역을 확인했다.
- writer QA: 전기차는 전비+완충 실주행거리+온도, PHEV는 전비+연비, 하이브리드·내연기관은 연비만 노출되는지 확인했다.
- persistence: 공유 브라우저에는 테스트 글을 등록하지 않아 삭제할 테스트 데이터가 없다. 자동 게이트는 격리 저장소에서 등록→상세 흐름을 검증한다.
- commit: `79f6c63c76ca7e6ae3cf6f5bfc8a8518b48dfed7`.

final result: passed
