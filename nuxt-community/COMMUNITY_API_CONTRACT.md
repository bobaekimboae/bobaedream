# 커뮤니티 공통 API 계약 초안

Nuxt PC/모바일웹과 Flutter 네이티브 앱이 공동 사용한다. 업무 로직의 정본은 Laravel 12다.

## 안정 ID

- `boardId`: 게시판의 영구 문자열 ID. 표시명 변경과 무관하다.
- `postId`, `commentId`, `draftId`, `attachmentId`: UUID 또는 동등한 전역 고유 ID.
- 배열 순서나 한글 표시명을 식별자로 사용하지 않는다.

## 엔드포인트

| 기능 | 메서드 | 경로 |
| --- | --- | --- |
| 게시판 트리 | GET | `/v1/community/boards` |
| 게시글 목록 | GET | `/v1/community/posts?boardId=&headword=&sort=&cursor=` |
| 게시글 상세 | GET | `/v1/community/posts/{postId}` |
| 게시글 등록 | POST | `/v1/community/posts` |
| 임시글 저장 | PUT | `/v1/community/drafts/{draftId}` |
| 첨부 업로드 준비 | POST | `/v1/community/attachments/presign` |
| 댓글 등록 | POST | `/v1/community/posts/{postId}/comments` |
| 추천·비추천 | PUT | `/v1/community/posts/{postId}/reaction` |

게시글 등록에는 `Idempotency-Key` 헤더를 필수로 사용한다. API 오류는 `{ code, message, fieldErrors?, retryable }` 형식으로 통일한다. PC 웹·모바일웹·Flutter는 같은 정렬 의미와 페이지네이션 커서를 사용한다.

## 운영 검증

- 게시판 쓰기 권한, 차단·도배·금칙어, MIME·확장자·용량, HTML sanitize는 서버가 판정한다.
- 이미지 재인코딩, 악성 파일 검사, EXIF 개인정보 제거 후에만 첨부를 확정한다.
- PostgreSQL 원본과 Meilisearch 색인은 outbox/event 방식으로 동기화하며 색인 지연 상태를 추적한다.
- 임시글과 게시글은 서로 다른 권한·보존 정책을 갖는다.

## 검색 (2026-11-02 시안)

화면: `/search?q=&type=&sort=&t=&board=` (기본값 `type=posts` · `sort=relevance` · `t=all`은 주소에서 뺀다). 시안은 서버 없이 `app/utils/communitySearch.ts`가 같은 규칙으로 계산한다.

| 기능 | 메서드 | 경로 |
| --- | --- | --- |
| 통합 검색 | GET | `/v1/community/search?q=&type=posts\|boards\|comments\|people&sort=&t=&boardId=&cursor=` |
| 입력 중 추천 | GET | `/v1/community/search/suggest?q=&boardId=` (게시판 3 · 사람 2 · 게시글 4) |
| 인기 검색어 | GET | `/v1/community/search/trending` |

- 정렬 `sort`: `relevance` · `hot` · `top`(추천−비추천) · `new` · `comments`. 댓글은 `relevance` · `top` · `new`만.
- 기간 `t`: `hour` 1시간 · `day` 24시간 · `week` 7일 · `month` 31일 · `year` 366일 · `all`. 모든 정렬에 등록 시각으로 적용한다.
- 검색어 문법은 Laravel이 먼저 떼어 거르기 조건으로 바꾼다: `게시판:`/`board:` → `boardId`, `작성자:`/`author:` → `authorName`, `제목:`/`title:` → 제목만 검색(`attributesToSearchOn: ["title"]`), `말머리:`/`flair:` → `headword`, `-낱말` → 빼기, `"구절"` → 붙은 구절. 모르는 게시판 이름이면 `422 { code: "unknown_board" }`.
- 응답: `{ hits[], facets: { boardId: { [id]: count } }, total, nextCursor }`. 찾은 글자는 Meilisearch `_formatted`를 HTML로 넣지 않고 `[{ text, hit }]` 조각으로 바꿔 보낸다.

### Meilisearch 색인 (Laravel Scout)

- 색인: `community_posts` · `community_comments` · `community_boards` · `community_people`. 한 번 요청으로 함께 찾는다(multi-search).
- `community_posts` searchable(순서 = 가중치): `title` → `headword` → `boardName` → `excerpt` → `authorName`.
- filterable: `boardId` · `authorId` · `authorName` · `headword` · `createdAtTs` · `status` · `visibility` · `hasMedia`. 비공개 · 삭제 · 숨김 글은 서버가 항상 `status = published AND visibility = public` 조건을 붙인다(회원별 권한은 tenant token).
- sortable: `hotScore` · `score`(추천−비추천) · `createdAtTs` · `commentCount`.
- 인기 점수 `hotScore = sign(s) × log10(max(|s|,1)) + (createdAtTs − 1134028003) / 45000`, `s = likes − dislikes`. 추천 · 비추천이 바뀌면 그 글만 다시 계산해 색인한다. 레딧 공개 코드(reddit-archive/reddit `_sorts.pyx`, CPAL 1.0)의 식을 참고해 새로 작성했다.
- 한국어: 띄어쓰기가 다른 이름("그랜저IG" ↔ "그랜저 IG")은 색인할 때 공백을 뺀 `compactTitle`을 searchable 끝에 함께 넣는다. 오타 허용은 Meilisearch 기본값을 쓴다.
- 갱신: 글 · 댓글 저장 후 outbox → Scout queue로 색인. 인기 검색어는 Redis 정렬 집합(`community:search:trending:{yyyymmdd}`)에 검색어를 쌓아 순위를 낸다.
- 다음 단계: 낱말 검색 + 의미 검색(하이브리드, Meilisearch embedder)으로 "겨울 시동 안 걸림" → "배터리 방전" 글도 찾는다.
