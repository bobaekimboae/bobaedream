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
