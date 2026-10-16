# 커뮤니티 게시판 전용 테이블

전용 테이블이 있는 게시판은 공용 시나리오 글(`scenario-data.js`) 대신 이 테이블의 글만 보여 준다.
현재 `car-news`(자동차뉴스)와 `vehicle-review`(차량리뷰)가 독립 테이블을 사용한다.

## 데이터 넣는 순서
1. 구글 시트에서 아래 열 이름 그대로 첫 줄을 맞춘다.
2. CSV로 내려받아 `data/boards/car-news.csv`에 덮어쓴다.
3. `node scripts/community-board-table.mjs car-news` 실행 → `public/community/data/board-car-news.js`가 다시 만들어진다
   (id 중복·숫자 아님·제목 없음·날짜 형식 오류가 있으면 멈추고 줄 번호를 알려 준다).

차량리뷰는 `data/boards/vehicle-review.csv`를 편집한 뒤 `node scripts/community-board-table.mjs vehicle-review`를 실행한다. 공통 열 뒤에 `reviewId`, `modelId`, `brand`, `model`, `trim`, `powertrain`, `rating`, `owner`, `ownershipLabel`, `benchmark`, `location`, `ratings`, `brandLogo` 열을 유지한다.

## 열
| 열 | 내용 |
|---|---|
| id | 숫자, 비우면 9100001부터 자동. 상세 주소 `chzzk-detail.html?id=` 에 쓰므로 한 번 정하면 바꾸지 않는다 |
| category | 말머리 (신차 · 산업 · 정책 · 모빌리티 · 전기차 · 리콜 · 해외 · 모터스포츠 …) |
| title | 제목 (대괄호 말머리 넣지 않음) |
| summary | 목록·피드 요약 1~3문장 |
| body | 상세 본문, 문단은 줄바꿈. 비우면 summary |
| source / sourceUrl | 출처 언론사 / 원문 주소 (상세 「원문 보기」) |
| author | 글쓴이 닉네임 (비우면 source) |
| publishedAt | `2026-10-16T09:30:00+09:00` 형식 (최신순 정렬·「N시간 전」 표시) |
| thumbnail | 목록 썸네일 주소 (http 주소 또는 `public/community/` 기준 경로) |
| images | 상세 사진 주소들, `\|` 로 구분 |
| views / comments / likes | 숫자 |
| tags | 태그, `\|` 로 구분 |

기사 본문 전문은 넣지 않고 요약 + 원문 링크로 둔다(저작권).
