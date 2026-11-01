# 커뮤니티 리뷰 · 연비 게시판 API 계약 (Laravel 12 · PHP 8.4)

화면: `nuxt-review/` (Nuxt 4.6.2 · Vue 3.5.33 · TypeScript 6.0.3, 배포 경로 `/bobaedream/nuxt-review/`)
서버: `community-api/` (Laravel 12 · PHP 8.4 · PostgreSQL 15 · Sanctum)
기계 판독용 원본: `community-api/openapi.yaml`

세 곳이 같은 이름 · 모양을 쓴다. 하나를 바꾸면 셋을 함께 바꾼다.

| 화면 | 서버 |
|---|---|
| `nuxt-review/app/lib/api/contract.ts`(타입) | `community-api/app/Http/Requests/*`(받는 값) |
| `nuxt-review/app/lib/api/client.ts`(`httpApi` 주소) | `community-api/routes/api.php` |
| `nuxt-review/app/lib/data.ts`(`Review` · `FuelPost` · `Comment`) | `community-api/app/Http/Resources/*`(내려주는 값) |

## 1. 공통

- 주소 앞부분: `/api/community`
- 인증: Sanctum 토큰을 `Authorization: Bearer <토큰>` 머리글로 보낸다. 쿠키는 쓰지 않는다. 토큰을 주소(쿼리)에 넣지 않는다.
- 읽기(`GET /me`, `GET /{board}/posts`)는 로그인 없이 된다. 로그인했으면 `can` · `mine`을 그 사람 기준으로 계산한다.
- 성공: `{ "data": … }`(목록은 `meta`도 붙음). 지우기 · 반응은 `204` 본문 없음.
- 오류: 모든 경로가 같은 모양이다.

```json
{ "ok": false, "error": "보낸 값이 올바르지 않아요.", "code": "invalid", "fields": ["ratings.fuel", "purchase.month"] }
```

| 상태 | code | error(화면에 그대로) |
|---|---|---|
| 401 | `unauthenticated` | 로그인이 필요해요. |
| 403 | `forbidden` | 이 작업을 할 권한이 없어요. |
| 404 | `not_found` | 지워졌거나 없는 글이에요. |
| 422 | `invalid` | 보낸 값이 올바르지 않아요. (`fields`에 틀린 칸) |
| 429 | `too_many` | 잠시 뒤에 다시 시도해 주세요. |

- CORS: `COMMUNITY_ORIGINS`(쉼표 목록)에 있는 화면 주소만 연다.
- JSON 한글 · 경로는 `\uXXXX` · `\/` 없이 그대로 보낸다.

## 2. 경로

| 하는 일 | 방법 · 주소 | 로그인 | 제한 |
|---|---|---|---|
| 나와 내 권한 | `GET /me` | 선택 | |
| 글 목록 | `GET /{board}/posts?model_id=&sort=latest\|likes\|comments&owner=1&cursor=` | 선택 | 20건씩 |
| 리뷰 등록 | `POST /review/posts` | 필요 | 1분 3건 |
| 연비 등록 | `POST /fuel/posts` | 필요 | 1분 3건 |
| 글 삭제 | `DELETE /{board}/posts/{post}` | 필요 | |
| 댓글 · 답글 | `POST /{board}/posts/{post}/comments` | 필요 | 1분 10건 |
| 댓글 삭제 | `DELETE /{board}/posts/{post}/comments/{comment}` | 필요 | |
| 반응 켜기 · 끄기 | `PUT` · `DELETE /{board}/posts/{post}/reactions/{like\|dislike\|bookmark}` | 필요 | |
| 임시저장 읽기 · 저장 · 지우기 | `GET` · `PUT` · `DELETE /{board}/draft` | 필요 | 저장 1분 60건 |

`{board}` = `review`(차량 리뷰) · `fuel`(연비 · 전비).

## 3. 권한 (`PostPolicy` · `CommentPolicy`)

| 동작 | 누가 |
|---|---|
| 글쓰기 · 댓글 · 반응 | 로그인했고 정지 중이 아닌 사람(`users.suspended_until`이 비었거나 지났음). 반응 · 댓글은 공개 글에만 |
| 글 수정 | 작성자(수정 경로는 다음 단계) |
| 글 · 댓글 삭제 | 작성자 또는 운영자(`is_moderator`) |
| 신고 | 작성자가 아닌 사람 |

글마다 `can: { update, delete, report }`, 댓글마다 `can: { delete }`를 내려 준다. 화면은 이 값으로만 삭제 · 신고 버튼을 보인다(`mine`은 이전 화면 호환용).

## 4. 리뷰 등록 (`StoreReviewRequest`)

```json
{
  "model_id": "bmw-m3",
  "owner": true,
  "purchase": { "month": "2026.05", "city": "서울", "price": 7800, "paid": null, "metric": 9.4 },
  "ratings": { "exterior": 4.5, "interior": 4, "space": 4, "features": 3.5, "power": 4, "fuel": 3 },
  "body": "30자 이상 5000자 이하 총평",
  "cover_upload_id": null
}
```

- `model_id`: 차종 기준표(`community_vehicle_models`)에 있어야 한다.
- `owner=true`면 `purchase` 네 칸(월 `YYYY.MM` · 17개 시 · 도 · 가격 만원 · 실측 값)이 필수. 실측 단위는 전기 계열 km, 내연 계열 km/L.
- `ratings`(`RatingRules`): 동력 방식별 필수 항목은 모두, 선택 항목은 있어도 됨, 그 밖의 항목은 거절. 점수는 0.5 단위 0.5~5.0.

| 동력 방식 | 필수 | 선택 |
|---|---|---|
| `ev` · `phev` · `erev` | 외관 · 실내 · 공간 · 편의·안전 사양 · 주행감 · 주행거리·전비 | 주행 보조 · 인포테인먼트 |
| `hybrid` · `ice` | 외관 · 실내 · 공간 · 편의·안전 사양 · 동력·핸들링 · 연비 | 없음 |

- 평균(`rating`)은 서버가 계산한다(보낸 항목 평균, 소수 둘째 자리).
- 등록하면 그 사람의 리뷰 임시저장을 지운다.

## 5. 연비 · 전비 등록 (`StoreFuelRequest`)

```json
{ "model_id": "porsche-taycan", "title": null, "body": "출퇴근 위주", "city": "경기",
  "odometer_km": 12000, "fuel_km_per_l": null, "energy_km_per_kwh": 5.0, "full_charge_km": 410, "temperature_c": 15, "upload_ids": [] }
```

- 제목 30자 이하(비우면 `「모델」 연비·전비 공유`), 본문 1~2000자, 지역 17개 시 · 도.
- 동력 방식에 없는 값은 거절: 내연 · 하이브리드 = 연비만, 전기 = 전비 · 완충 주행거리 · 온도, 플러그인 · 연장형 = 연비 · 전비.
- 전비는 km/kWh로 받아 저장한다. 내려줄 때 `energy`는 화면 호환을 위해 kWh/100km(`100 ÷ km/kWh`), `energyKmPerKwh`는 저장 값 그대로.

## 6. 임시저장

- 게시판마다 한 사람 1건(`users × board` 유일). 원본 懂车分의 「○○의 리뷰 임시저장이 있어요. 불러올까요?」(不读取 / 读取)와 같은 동작.
- 화면은 입력이 바뀌고 0.8초 뒤 저장, 쓰기 화면에 들어올 때 읽어서 묻는다. 「저장 안 함」 · 등록 성공 때 지운다.
- `payload`는 화면 상태 그대로(최대 64KB). 내용 검사는 등록 때만 한다. 사진은 넣지 않는다(업로드는 따로).

## 7. 반응

- 공감 ↔ 비공감은 한쪽만(공감을 켜면 비공감이 꺼짐). 즐겨찾기는 따로. 같은 요청을 여러 번 보내도 결과가 같다.
- 비공감은 리뷰 게시판에만 있다(원본 懂车分에만 「不赞同」). 연비 게시판은 404.
- `community_posts.likes` · `dislikes`는 반응 표를 세어 맞춘다(목록 정렬용).

## 8. 표 (PostgreSQL 15)

| 표 | 내용 |
|---|---|
| `community_vehicle_models` | 차종 기준표: 제조사 · 모델 · 트림 · 동력 방식 · 로고 · 사진 · 차급 평균(「SUV 평균 4.36」) |
| `community_posts` | 두 게시판 공통 글(제목 · 본문 · 사진 · 조회 · 공감 · 댓글 수 · 상태 · soft delete) |
| `community_review_details` | 리뷰: 오너 · 구매 정보 · 항목별 별점(jsonb) · 평균 |
| `community_fuel_details` | 연비: 지역 · 누적 주행 · 연비 · 전비 · 완충 주행거리 · 측정 온도 |
| `community_comments` | 댓글 · 답글(`parent_id`) |
| `community_reactions` | 공감 · 비공감 · 즐겨찾기(`post × user × kind` 유일) |
| `community_drafts` | 임시저장(`user × board` 유일) |
| `community_follows` | 팔로우 |

`users` · `personal_access_tokens`는 보배드림 회원 DB가 있으면 그것을 쓰고, 없을 때만 만든다(마이그레이션이 `hasTable`로 건너뜀).

## 9. 화면 쪽 연결

- 기본은 서버 없이 이 브라우저에서 계약과 똑같이 흉내 내는 `mockApi`(localStorage).
- 주소 끝에 `?api=http://127.0.0.1:8000`(내 컴퓨터) 또는 `?api=https://…`를 붙이면 `httpApi`로 서버에 보낸다. 그 밖의 주소는 무시한다.
- 지금 화면에는 보배드림 로그인이 없어 서버 모드는 읽기만 된다. 쓰기는 회원 로그인 연동(토큰 발급) 뒤에 열린다.

## 10. 시험

```bash
cd community-api && composer install && bash tests/smoke.sh   # SQLite로 36개 확인
```

## 11. 아직 없는 것(다음 단계)

- 글 수정(`PATCH /{board}/posts/{post}`) · 신고 접수 · 사진 업로드(`upload_ids` 연결) · 조회 수 올리기 · 팔로우 경로 · 대댓글 목록 경로.
- 검색 · 정렬 대수를 Meilisearch 패싯으로 옮기기(지금은 DB 정렬).
- 회원 로그인 연동(Sanctum 토큰을 보배드림 회원 인증에서 발급).
