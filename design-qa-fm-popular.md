# Design QA — 네이버 카페 인기글 FM 스타일

- Final result: passed
- Viewport: 384 × 812 CSS px
- State: `naver-cafe-popular-left` / 인기글 탭
- Source visual truth: `C:/Users/bobae/OneDrive/문서/ChatGPT/퀵필터 제작/.codex-remote-attachments/01a0fe77-a06f-7a82-91f7-7cb79bab19bf/0f4e7439-d664-4209-a835-0b0d74a43a00/1-1000018781.jpg`
- Implementation evidence: CUA Chrome capture

## Full-view comparison

- 목록 최상단 3개 항목만 연한 파란 배경으로 묶었다.
- 사용자의 정정에 따라 `인기` 문구 대신 `1·2·3` 순위 아이콘을 제목 앞에 배치했다.
- 기존 좌측 썸네일, 우측 댓글 칸, 메타데이터 타이포와 행 높이는 유지했다.

## Focused region checks

| Check | Expected | Actual | Result |
|---|---:|---:|---|
| 순위 배지 수 | 3 | 3 | passed |
| 순위 배지 값 | 1·2·3 | 1·2·3 | passed |
| 인기 배경 행 수 | 3 | 3 | passed |
| 배지 크기 | 22×22px | 22×22px | passed |
| 배지 글자 크기 | 13px | 13px | passed |
| 배지 배경 | blue | `rgb(59, 130, 230)` | passed |
| 행 배경 | pale blue | `rgb(234, 245, 255)` | passed |
| 댓글TOP 전환 시 배지 | 0 | 0 | passed |
| 인기글 복귀 시 배지 | 3 | 3 | passed |
| 썸네일 누락 | 0 | 0 | passed |
| 신규 빨간 점 | 0 | 0 | passed |

## Findings

- P0/P1/P2 없음.
- P3: 원본 참고 화면은 텍스트형 목록이지만 현재 시안은 사용자가 확정한 좌측 썸네일형을 유지했다.
