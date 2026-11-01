# 커뮤니티 레딧형 인기 기간 선택 QA

- Source visual truth:
  - `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/0a1891c3-e0ea-47b6-bb88-b9389465b8bd/1-1000019365.jpg`
  - `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/0a1891c3-e0ea-47b6-bb88-b9389465b8bd/2-1000019363.jpg`
  - `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/0a1891c3-e0ea-47b6-bb88-b9389465b8bd/3-1000019367.jpg`
- Browser-rendered implementation: `http://127.0.0.1:5212/community/naver-cafe-list.html?v=popular-period&board=aviation-rail&header=community-profile`
- Viewport: 393×844 CSS px, DPR 1
- State: 게시글 옵션 → 인기 → 지난 24시간 선택 → 메인 옵션 복귀

## Full-view comparison evidence

- 메인 옵션의 `인기`는 즉시 적용 버튼이 아니라 우측 화살표가 있는 2단계 진입 행으로 변경했다.
- 현재 선택 기간을 `인기` 아래 보조문구로 표시한다.
- 기간 선택 화면은 뒤로가기·중앙 제목·닫기·구분선·세로 라디오 목록을 Reddit 화면과 동일한 정보 구조로 구성했다.
- 기간 항목은 `지난 1시간`, `지난 24시간`, `지난 1주`, `지난 1개월`, `지난 1년`, `전체 기간` 여섯 개다.

## Interaction checks

- `인기` 진입 후 여섯 기간 항목 노출 확인.
- `지난 24시간` 선택 후 메인 옵션으로 복귀하고 보조문구가 `지난 24시간`으로 갱신됨.
- 기간 화면 재진입 시 `지난 24시간`의 `aria-checked=true` 유지.
- 뒤로가기는 게시글 옵션으로 복귀하고 닫기는 전체 시트를 종료함.
- 실제 피드 데이터가 전체 62건에서 24시간 범위 29건으로 축소됨.
- 공개 시안과 Nuxt 4 정본 모두 기간 필터 로직을 구현함.
- Browser console warnings/errors: 0.

## Required fidelity surfaces

- Typography: passed — 기존 Pretendard 계층을 유지하고 기간 행을 17px로 구성함.
- Spacing/layout: passed — 72px 기간 행과 24px 라디오 컨트롤로 Reddit의 여유 있는 터치 영역을 재현함.
- Colors/tokens: passed — 흰색 시트, 검정 아이콘, 중립 구분선과 회색 닫기 버튼을 유지함.
- Assets: passed — 기존 Reddit 뒤로가기·화살표·체크 SVG를 재사용함.
- Copy/content: passed — 사용자 제공 Reddit 한국어 기간 문구를 그대로 적용함.
- Behavior/accessibility: passed — dialog 진입, radio semantics, 선택 유지, 실제 시간 범위 필터를 검증함.

No actionable P0/P1/P2 differences remain.

final result: passed
