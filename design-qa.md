# 제조사·모델 뎁스 화면 Design QA

- source visual truth: https://www.encar.com/dc/dc_carsearchlist.do?carType=kor (현대 → 그랜저 → 더 뉴 그랜저 IG → 가솔린 2500cc → 2.5 상태, Codex 인앱 브라우저 tab 76 캡처)
- implementation: http://127.0.0.1:4193/maker-model-skeleton-v01.html (Codex 인앱 브라우저 tab 77 캡처)
- viewport: 384×820 CSS px, density 1
- source pixels: 384×820 viewport capture
- implementation pixels: 384×820 viewport capture
- normalization: 동일 CSS viewport와 동일한 제조사·모델·세대·연료·등급 상태로 비교. 브라우저 크롬은 비교에서 제외.
- state: 현대 → 그랜저 → 더 뉴 그랜저 IG → 가솔린 2500cc → 2.5, 세부등급 펼침

## Full-view comparison evidence

- 엔카의 선택 경로는 제조사·모델·세대를 각각 한 줄과 X로 표시한다. 구현도 같은 정보 구조를 사용하며 하단 중복 칩과 브레드크럼을 제거했다.
- 엔카의 연료 → 등급 → 세부등급 인라인 전개를 유지하면서 보배드림의 검정 사각 체크박스, 52px 하단 액션 버튼, Pretendard 타이포그래피를 적용했다.
- 384px에서 선택 경로, 매물 수, X 버튼, 체크박스, 하단 고정 액션이 잘리거나 가로로 넘치지 않는다.

## Focused region comparison evidence

- 선택 경로: `현대`, `그랜저`, `더 뉴 그랜저 IG + 19년11월~22년11월`을 독립 행으로 확인했다.
- 세대 목록: 기존 `그랜저 전체` 중복 행이 없어지고 `세대 · 최신순` 바로 아래 세대 목록이 시작한다.
- 연료 영역: 가솔린 2500cc 선택 시 2.5 등급만 펼쳐지고 자동 선택되지 않는다.
- 등급 영역: 2.5 선택 시 르블랑·프리미엄 초이스·익스클루시브 등 세부등급이 독립 체크 상태로 펼쳐진다.
- 해제 상태: 가솔린 2500cc를 해제해도 등급·세부등급 목록이 접히지 않고 체크만 해제된다.
- 단계 해제: `그랜저 X`를 누르면 현대는 유지되고 모델 화면으로 돌아간다.

## Required fidelity surfaces

- Fonts and typography: Pretendard Variable 로딩 유지. 제목 20/26·700, 선택명 15/22·400, 연식 13/18·400, 목록 16/22 계층이 충돌하지 않는다.
- Spacing and layout rhythm: 선택 행 44px, 세대 선택 행 56px, 행 사이 1px 구분선, 선택 영역 아래 8px 구분 바탕으로 단계가 명확하다.
- Colors and tokens: #222 주 텍스트·선택, #8A8F97 보조, #E8E8E8 구분선, #F5F6F7 구간 바탕을 사용해 기존 보배드림/핀노 계열과 일관된다.
- Image quality and asset fidelity: 기존 승인된 세대 PNG와 제조사 로고를 그대로 사용하며 크롭·해상도·방향을 변경하지 않았다.
- Copy and content: `세대 · 최신순`, `연료 · 배기량`, `등급`, `세부등급`으로 현재 뎁스가 명확하며 동일 제조사·모델 문구를 중복 노출하지 않는다.

## Findings

- P0/P1/P2 없음.
- P3: 세부등급 연결선의 가로 가지선은 추후 실기기 캡처에서 필요성이 확인되면 추가할 수 있다. 현재 세로 연결선과 들여쓰기만으로 관계 식별이 가능하다.

## Comparison history

1. Earlier findings: `현대 · 그랜저` 한 줄 요약, `그랜저 전체`, 하단 `현대/그랜저` 칩이 중복되어 같은 정보가 세 번 노출됐다. 연료 선택이 모든 하위 등급을 자동 선택하고, 연료 해제 시 하위 목록이 접혔다.
2. Fixes made: 선택 경로를 단계별 행+X로 변경, 하단 선택 칩과 `그랜저 전체` 제거, 연료·등급·세부등급의 선택 상태를 분리, 해제 후 확장 상태 유지.
3. Post-fix evidence: 384×820 인앱 브라우저에서 전체 흐름과 단계별 X 해제를 직접 수행했고, 콘솔 error/warning 로그는 0건이었다.

## Implementation checklist

- [x] 제조사·모델·세대 선택 경로를 한 위치에만 표시
- [x] 단계별 X 해제
- [x] 세대 전체 중복 행 제거
- [x] 하단 중복 칩 제거
- [x] 연료·등급·세부등급 독립 체크
- [x] 해제 후 하위 목록 유지
- [x] 384px 모바일 검수
- [x] 콘솔 오류 확인
- [x] `npm run verify:qf` 통과

final result: passed
