# 커뮤니티 글쓰기 키트 API (동처띠 발행 화면 6종)

화면: `nuxt-review/` (Nuxt 4.6.2 · Vue 3.5.33 · TS 6.0.3) — `app/lib/api/publish-client.ts`
서버: `community-api/` (Laravel 12 · PHP 8.4 · PostgreSQL 15 · Sanctum) — 리뷰 · 연비 API(`docs/community-review-api.md`)와 같은 서버 · 같은 표
기계 판독용: `community-api/openapi.yaml` (1.1.0)

## 종류

| 주소 `{board}` | 화면 | 동처띠 원본 | 꼭 있어야 하는 것 |
|---|---|---|---|
| `dynamic` | 일상 | 动态 | 사진(최대 9장) 또는 본문 |
| `ask` | 질문 | 提问 | 본문 5자 이상, 사진 9장 또는 영상 1개 |
| `video` | 영상 | 视频 | 영상 1개 + 제목(30자) |
| `long` | 긴 글 | 长帖 | 제목(40자) + 본문 또는 사진, 부품 카드 10개까지 |
| `sell` | 내 차 팔기 | 卖车帖 | 차량 사진 1~20장 + 차종 + 등록 연월 · 주행거리 · 색상 · 소유자 변경 · 희망 판매가 |
| `price` | 구매가 | 车主价 | 차종 + 차량가 · 실구매가(만원, 소수 둘째 자리) · 구매 시기 · 지역. 실구매가는 차량가의 50% 이상 |

제한값은 `community-api/config/community.php` 의 `publish` · `uploads`. 화면 제한과 같은 값이다.

## 흐름

1. 사진 · 영상을 고르면 화면은 그대로 미리 보여 준다(이 단계에서는 서버로 안 보냄).
2. 등록을 누르면 `POST /uploads` 로 한 장씩 올린다(화면에 「사진 · 영상을 올리는 중이에요 2/5」). 응답 주소의 파일 이름이 곧 upload id.
3. `POST /{board}/posts` 에 upload id 를 화면 순서대로 보낸다(첫 장 = 대표). 서버는 올린 사람이 같은지, 다른 글에 쓴 파일이 아닌지, 종류별 장수를 다시 검사한다.
4. 응답은 화면 `Post` 모양 그대로라 상세 화면(`PostView.vue`)이 바로 그린다. 내 차 팔기 · 구매가의 화면 한 줄(`4.5만km` · `2,350만원` · `할부`)은 서버가 만든다.
5. 등록되면 그 종류의 임시저장은 서버가 지운다.

## 업로드

- 사진: jpeg · png · webp · heic, 15MB. 서버가 다시 저장해 **촬영 위치(GPS) 같은 촬영 정보를 지우고**, 회전 방향만 반영, 긴 변 2560px. GD 로 못 여는 heic 는 그대로 둔다(변환은 다음 과제).
- 영상: mp4 · mov · webm, 300MB, 600초. 표지(`cover`)와 길이(`duration`)를 함께 받는다. 영상 속 번호판은 가리지 않는다.
- 영수증(`purpose=receipt`, 구매가 심사용): 공개 주소 없이 비공개 저장소. 글에는 「제출함(심사용, 공개 안 됨)」만 보인다. 임시저장에는 넣지 않는다.
- 하루 300개, 1분 60개. 글에 안 붙고 하루 지난 파일은 `php artisan community:prune-uploads`(매시간)로 지운다. 임시저장에 든 파일은 남긴다.

## 그 밖의 경로

| 경로 | 설명 |
|---|---|
| `GET /{board}/posts?mine=1` | 목록(내 글만은 `mine=1`). 리뷰 · 연비와 같은 경로 |
| `GET /{board}/posts/{id}` | 상세. 볼 때마다 조회 수 +1 |
| `PUT /{board}/posts/{id}/vote` `{choices:[0]}` | 일상 · 질문 투표. 한 사람 한 번, 다시 보내면 바꿈. 마감 뒤 409 |
| `GET /drafts` | 내 임시저장 전부(「임시저장함」) |
| `GET · PUT · DELETE /{board}/draft` | 종류마다 1건. 키트 6종은 차종 없이도 저장(256KB까지, 사진은 올린 주소만) |
| 댓글 · 공감 · 즐겨찾기 · 삭제 | 리뷰 · 연비와 같은 경로. 비공감은 리뷰에만 |

## 표

- `community_posts` 에 `topic` · `circle` · `claim` · `city` · `media`(jsonb) · `attach`(구매가 · 부품 카드) 추가, `model_id` 는 비어 있을 수 있음
- `community_uploads`(uuid) · `community_sell_details` · `community_price_details` · `community_votes` · `community_vote_ballots`
- 내 차 팔기 · 구매가는 숫자로 따로 두어 Meilisearch 패싯(가격대 · 주행거리 · 차종별 평균 구매가)으로 계산할 수 있게 했다.

## 화면 연결

- 기본은 지금처럼 이 브라우저(localStorage)에 저장(`mockPublishApi`).
- `?api=http://127.0.0.1:8000`(또는 https 주소)를 붙이면 서버로 보낸다(`httpPublishApi`).
- 로그인: 회원 로그인 연동 전 시험용으로 주소 끝 `#token=<Sanctum 토큰>` 을 한 번 붙이면 그 탭(sessionStorage)에만 두고 주소에서 바로 지운다. `#` 뒤 값은 서버로 가지 않는다. 정식 연동 때 보배드림 로그인으로 바꾼다.
- 로그인 없이 등록하면 「로그인한 뒤 다시 등록해 주세요」.

## 시험

```bash
cd community-api
bash tests/smoke.sh            # 리뷰 · 연비 36개
bash tests/publish-smoke.sh    # 글쓰기 키트 69개 (SQLite)
SMOKE_PG="127.0.0.1 db user pw" bash tests/publish-smoke.sh   # 같은 시험을 PostgreSQL 로
```
