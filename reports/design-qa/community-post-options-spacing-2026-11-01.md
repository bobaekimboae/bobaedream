# 커뮤니티 게시글 옵션 시트 간격 교정 QA

- Source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0f512-065a-7300-9ce1-d86601ce6384/08a618ca-8e31-4801-b642-863eadcbc08d/1-1000019351.jpg`
- Density references: Reddit feed options `.../56441b75-c796-4bbc-a2d8-8494c650afaf/1-1000019249.jpg`, Naver Band post options `.../56441b75-c796-4bbc-a2d8-8494c650afaf/3-1000019253.jpg`
- Browser-rendered implementation: `http://127.0.0.1:5212/community/naver-cafe-list.html?v=spacing-balance&board=aviation-rail&header=community-profile` (Codex in-app browser capture)
- Viewport: 393×844 CSS px, DPR 1
- Source pixels: 591×1280 px
- Implementation CSS size: 393×844 px
- Density normalization: source is approximately 1.5× density; implementation was inspected at the equivalent 393px CSS width.
- State: 게시글 옵션 열림, 최신순·피드형·전체 선택. 목록형 별도 선택 상태도 확인.

## Full-view comparison evidence

- Header rhythm was reduced from 84px to 68px including handle.
- Each sort/view section was reduced from roughly 255px to 215px.
- The headword section and three chip rows are visible without the oversized blank bands shown in the source screenshot.
- Sheet contents fit the 393×844 mobile viewport with no horizontal overflow.

## Focused comparison evidence

- Header: handle 44×4px, 8px top margin, 56px title row.
- Sections: 18px top, 14px bottom, 6px heading gap.
- Rows: 52px minimum height, 12px icon/text gap.
- Headword chips: 36px minimum height, 8px wrap gap.
- Small phones (≤370px): 16px section top, 50px rows, 34px chips.

## Interaction checks

- Sort: `최신 댓글순` selected and `aria-checked=true` verified.
- View: `간결형` and `목록형` selected and `aria-checked=true` verified.
- Headword: `테슬라` selected and `aria-checked=true` verified.
- List mode: first rendered thumbnail is to the right of the text (`bodyRight 244.4px`, `thumbX 250.4px`), and `thumbLeft` cards are zero.
- Browser console warnings/errors: 0.

## Required fidelity surfaces

- Fonts and typography: passed — Pretendard, existing 14–22px hierarchy and weights preserved.
- Spacing and layout rhythm: passed — excess vertical whitespace removed while 50–52px touch rows remain usable.
- Colors and visual tokens: passed — neutral sheet, black selection and gray dividers unchanged.
- Image quality and assets: passed — existing Reddit/Chzzk icon assets remain vector-based and unchanged.
- Copy and content: passed — all sort, view and headword labels preserved.

## Comparison history

- Pass 1 [P2]: header plus two sections consumed too much of the viewport, pushing headwords below the fold. Reduced header, section and row spacing as one system.
- Pass 2: 393×844 recapture showed all three sections and multiple headword rows without crowding; selection behavior and right-side list thumbnail were verified.

No actionable P0/P1/P2 findings remain.

final result: passed
