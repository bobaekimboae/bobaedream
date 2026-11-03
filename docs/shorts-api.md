# 숏폼 보기 API 계약 (shorts-api)

보배드림 숏폼 매물 보기 화면(`nuxt-shorts`)이 쓰는 API. Laravel 12 · PHP 8.4 · PostgreSQL 15. 기계 판독용은 `shorts-api/openapi.yaml`.

## 구조

```
화면(nuxt-shorts) ──GET /api/shorts──▶ shorts-api ──POST /v2/cars/shorts──▶ 보배드림 리뉴얼 백엔드(staging)
                                        │                                   (한 번에 한 매물 + 앞·뒤 번호)
                                        └─ PostgreSQL: 비디오 투어 부위 시각 · 시청 기록
```

- 실매물 · 가격 · 판매자 · 찜은 **원본 백엔드가 기준**이다. shorts-api 는 원본을 따라가며 여러 장을 모아 화면 모양으로 바꾸고(BFF), 원본에 없는 두 가지(비디오 투어 부위 시각, 숏폼 시청 기록)만 직접 저장한다.
- 원본은 `meta.navigation.next.public_id` 로 다음 매물을 알려 준다. shorts-api 는 이 번호를 따라가 `limit` 장을 모으고, 영상이 없는 매물은 건너뛴다.
- 화면이 원본과 같은 도메인(dev.bbmuseum 등)에 있으면 `?source=live` 로 원본 BFF(`/api/bff/v2/cars/shorts`)를 바로 부를 수도 있다. 다른 도메인(GitHub Pages)은 원본이 막으므로(CORS) shorts-api 또는 실매물 사본을 쓴다.

## 응답 공통

성공 `{ "ok": true, ... }`, 실패 `{ "ok": false, "error": "사람이 읽는 한국어 문장", "code": "기계용 이름", "fields"?: [...] }`.

| code | HTTP | 뜻 |
|---|---|---|
| invalid | 422 | 보낸 값이 틀림(`fields` 에 칸 이름) |
| not_found | 404 | 그 매물 숏폼이 없음(판매 끝 포함) |
| unauthenticated | 401 | 로그인 필요(찜) |
| forbidden | 403 | 관리자 토큰 필요(부위 저장) |
| rate_limited | 429 | 너무 자주 보냄 |
| upstream_unreachable · upstream_error | 502 | 원본 백엔드가 응답하지 않음 |

## 엔드포인트

### GET /api/shorts
쿼리: `category`(cars · trucks · bikes · campers · machinery · parts, 기본 cars) · `after`(이 매물 다음부터) · `limit`(1~20, 기본 8).
응답: `{ ok, data: ShortItem[], next: string | null }` — `next` 를 다음 요청의 `after` 로 넣는다. 끝이면 `null`.

### GET /api/shorts/{id}
한 매물. 응답 `{ ok, data: ShortItem, next, previous }`. 공유 링크(`?id=`)로 열 때 쓴다.

### PUT · DELETE /api/shorts/{id}/like
찜 · 찜 풀기. `Authorization: Bearer <보배드림 로그인 토큰>` 을 원본 `/v2/cars/{id}/like` 로 그대로 넘긴다. 응답 `{ ok, liked, likes }`.
로그인 전에는 화면이 이 기기에만 찜을 기억하고 "로그인하면 계정에 저장돼요"를 알린다.

### POST /api/shorts/{id}/views
`{ "watched": 초 }`. 한 장에서 실제로 본 시간을 다른 장으로 넘길 때 한 번 보낸다. 2초 미만은 세지 않고, 같은 사람(로그인 토큰 또는 IP+브라우저의 해시)·같은 매물은 30분 안에 한 번만 센다. 응답 `{ ok, counted }`.

### PUT /api/shorts/{id}/chapters
비디오 투어 부위 시각 저장(관리자 · 촬영 키트 업로드 단계). 헤더 `X-Shorts-Admin: <SHORTS_ADMIN_TOKEN>`.
`{ "video_url": "...", "chapters": [{ "key": "tour-walk", "from": 0, "to": 18.9 }, ...] }` — `key` 는 촬영 키트 `video.tour.stages` 의 8부위, 시각은 앞에서 뒤로 겹치지 않게.

### GET /api/health
`{ ok, upstream }`.

## ShortItem

| 칸 | 예 | 비고 |
|---|---|---|
| id | `99xiqhfhs6` | 원본 public_id |
| title · maker · model | `롤스로이스 던 6.6 V12` | |
| year · registered | `2021` · `2021.02` | 최초 등록 연월(없으면 연식 월) |
| mileage · fuel · transmission | `1만km` · `가솔린` · `자동` | 원본 표시값 그대로 |
| price | `35,900만원` | 없으면 화면에 `가격 상담` |
| region · complex | `서울 서초구` · 단지명 | |
| hashtags | `["인증중고차","1년보증"]` | |
| video | `{kind:"file",url}` · `{kind:"youtube",id,url}` | mp4 · webm · mov · HLS, 유튜브 쇼츠 주소 |
| poster · images | 첫 사진 · 사진 목록 | |
| likes · liked · views | | 원본 값 |
| seller | `{id,name,company,type:"dealer"|"private",avatar,selling,sold,phone,can_inquire}` | `phone` = 안심번호 숫자(tel 링크용). 차량번호는 넣지 않음 |
| chapters | `[{key,from,to}]` | shorts-api 에 저장된 부위 시각, 없으면 `[]` |

## 환경 변수

`SHORTS_UPSTREAM`(기본 https://staging.bbmuseum.co.kr) · `SHORTS_ORIGINS`(쉼표로 허락할 화면 주소) · `SHORTS_ADMIN_TOKEN` · `SHORTS_CACHE_TTL`(초, 기본 60) · `DB_CONNECTION=pgsql` 외 Laravel 기본값.

## 화면 쪽 데이터 고르기(nuxt-shorts)

| 조건 | 데이터 |
|---|---|
| `NUXT_PUBLIC_SHORTS_API` 또는 `?api=https://…` | shorts-api |
| 원본과 같은 도메인 또는 `?source=live` | 원본 BFF(로그인 쿠키로 찜) |
| 그 밖(GitHub Pages) | `app/data/shorts-snapshot.json` 실매물 사본(`pnpm snapshot` 으로 갱신, 안심번호는 뺌) |
