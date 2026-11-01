# 커뮤니티 게시글 옵션 즉시 적용 QA

- Source visual truth:
  - `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/0a1891c3-e0ea-47b6-bb88-b9389465b8bd/1-1000019365.jpg`
  - `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/0a1891c3-e0ea-47b6-bb88-b9389465b8bd/2-1000019363.jpg`
  - `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/0a1891c3-e0ea-47b6-bb88-b9389465b8bd/3-1000019367.jpg`
- Browser-rendered implementation: `http://127.0.0.1:5212/community/naver-cafe-list.html?v=instant-apply-qa&board=aviation-rail`
- Viewport: 393×844 CSS px
- State: 게시글 옵션에서 정렬·보기·말머리·인기 기간을 각각 선택

## Interaction checks

- `인기 → 지난 24시간` 선택 즉시 시트가 닫히고 게시물 수가 62건에서 29건으로 갱신됨.
- `목록형` 선택 즉시 시트가 닫히고 목록형 레이아웃으로 전환됨.
- `테슬라` 말머리 선택 즉시 시트가 닫히고 테슬라 게시물만 노출됨.
- `최신순` 선택 즉시 시트가 닫히고 정렬 상태가 갱신됨.
- 시트를 다시 열었을 때 최신순·목록형·테슬라의 `aria-checked=true` 유지.
- Nuxt 정본에서는 중복되는 하단 `적용` 버튼을 제거하고 동일한 단일 선택·즉시 반영 규칙 적용.
- Browser console errors: 0.

## Required fidelity surfaces

- Typography: passed — 기존 Pretendard 계층과 옵션 행 크기 유지.
- Spacing/layout: passed — 시트 구조와 목록 구조를 변경하지 않고 상호작용만 단순화.
- Colors/tokens: passed — 선택 색상과 중립 색상 유지.
- Assets: passed — 기존 Reddit·치지직 아이콘 자산 유지.
- Copy/content: passed — 정렬·보기·말머리·기간 문구 유지.
- Behavior/accessibility: passed — 한 번의 선택으로 적용과 닫힘이 완료되고 선택 상태가 라디오 의미로 유지됨.

No actionable P0/P1/P2 differences remain.

final result: passed
