# 촬영 키트 ↔ 보배드림 Laravel 서버 연결 안내 (2026-11-06)

개발자용 안내입니다. 화면은 `nuxt-shootkit/`, 서버는 `shootkit-api/`(Laravel 12 · PHP 8.4)입니다.
지금 `shootkit-api`는 Vercel 무료 서버에서 돌리던 **임시판**이라, 보배드림 서버에 붙이려면 아래 1~6을 해야 합니다.

## 0. 지금 구조(그대로 유지할 부분)

```
폰(nuxt-shootkit)
 ① POST /api/shoots              촬영 한 건 만들기 → id(ULID 소문자 26자)
 ② POST /api/blob/upload         파일마다 "올려도 된다" 허가 받기(경로 · 종류 · 크기 · 1시간)
 ③ PUT  (저장소로 직접)          파일 본체 — 서버를 거치지 않음(영상 300MB까지)
 ④ POST /api/shoots/{id}/submit  "다 올렸다" → 서버가 저장소에 다 있는지 대조
 ⑤ GET  /api/shoots/{id}         보기 화면(사진 · 영상 주소, 칸 이름표)
 +  GET  /api/health             상태 확인
```

- 파일 경로 규칙: `shoots/{id}/{photo|video}/{두 자리 번호}-{칸 키}.{확장자}`(예: `shoots/01jd.../photo/01-s3.jpg`)
- 한도: 사진 60장(원본 30 + 쇼룸 30) · 장당 15MB · jpg/png/webp, 영상 12개 · 개당 300MB · mp4/webm/mov(`config/shoot.php`)
- 오류 응답 모양: `{ ok:false, error:"사람이 읽는 문구", code:"missing|too_many|..." }`. 화면이 `error`를 그대로 보여 줍니다.
- 표: `database/migrations/2026_10_31_000000_create_shoots_tables.php`(`shoots`, `shoot_files`, PostgreSQL 15 jsonb 사용)

## 1. 파일 저장소를 보배드림 것으로 바꾸기(필수)

지금은 **Vercel Blob 전용**입니다(서버 `app/Shoot/BlobClient.php`, 화면 `@vercel/blob/client`의 `upload()`).
보배드림 저장소(S3 호환: AWS S3 · NCP Object Storage 등)로 바꿀 때:

- 서버: `BlobClient` 자리에 S3 서명 주소 발급 클래스를 둡니다(`league/flysystem-aws-s3-v3` 또는 `aws/aws-sdk-php`).
  - ② 응답을 `{ ok:true, url:"서명된 PUT 주소", headers:{...}, pathname }`으로 바꿉니다. 서명 주소는 이 경로 · Content-Type · 크기 상한만 허락하고 유효 시간은 1시간입니다.
  - 50MB가 넘는 영상은 S3 멀티파트(파트별 서명 주소 + 완료 요청)로 받는 것을 권합니다.
- 화면: `nuxt-shootkit/lib/upload.ts`의 `upload()` 호출 한 곳만 바꾸면 됩니다. ②에서 받은 주소로 `PUT` 하고, 진행률은 `XMLHttpRequest.upload.onprogress`로 보냅니다. 나머지(3개씩 동시에 · 3번 다시 시도 · 남은 것만 다시)는 그대로 둡니다.
- 저장소 CORS에 화면 주소의 `PUT`을 허락하고, 응답 헤더 `ETag`를 노출해야 합니다(멀티파트일 때).

## 2. DB 모드 켜기 + 빠진 기록 한 줄 채우기(필수)

- `.env`: `SHOOT_STORE=db`, `DB_CONNECTION=pgsql` …, 그리고 `php artisan migrate`
- **주의:** 지금 DB 모드는 파일 기록(`shoot_files`)을 넣는 곳이 없습니다. 그대로 두면 ④가 늘 `missing`을 돌려줍니다.
  S3로 바꾸면서 둘 중 하나를 넣어 주세요.
  - (권장) ④ `submit`에서 폰이 보낸 경로마다 저장소에 `HEAD` 요청을 보내 크기를 확인한 뒤 `shoot_files`에 넣습니다.
  - 또는 저장소의 업로드 완료 알림(S3 Event → 큐)을 받아 넣습니다.

## 3. 로그인 붙이기(필수)

지금은 누구나 올릴 수 있습니다. 보배드림 회원 인증(Sanctum 토큰)을 ①②④에 걸어 주세요.

- `shoots` 표에 `user_id`(올린 회원)와 `listing_id`(연결할 매물, 나중) 칸을 더합니다.
- ②④는 "이 촬영을 만든 회원만" 허락합니다.
- ⑤ 보기는 공개로 둘지 회원만 볼지 정해 주세요(정책 결정 필요).
- 화면은 `Authorization: Bearer <토큰>`을 붙여 보내도록 `upload.ts`의 `api()`에 한 줄 더하면 됩니다.

## 4. 서버 위치 · 주소 정하기

둘 중 하나를 고릅니다.
- **(권장) 보배드림 리뉴얼 Laravel 안에 넣기:** `app/Shoot/*`, `ShootController`, 마이그레이션, `config/shoot.php`를 모듈로 옮기고, 주소를 리뉴얼 규칙(`/v1/...`)에 맞춥니다. 예: `/v1/shoots`, `/v1/shoots/{id}/upload-urls`, `/v1/shoots/{id}/submit`. 바뀐 주소는 화면 `upload.ts`의 경로 문자열 5곳만 고치면 됩니다.
- 따로 띄우기: `shootkit-api`를 그대로 PHP-FPM에 올립니다(문서 루트 `public/`). `vercel.json`은 지웁니다.

## 5. 허락할 화면 주소(CORS)

`.env`: `SHOOT_ORIGINS=https://dev.bbmuseum.co.kr,https://bobaekimboae.github.io,http://localhost:5191`
(쉼표로 구분. 지금 미들웨어는 GET · POST · OPTIONS와 `Content-Type`만 허락하니, 3번을 하면 `Authorization`도 허락 헤더에 더해야 합니다 — `app/Http/Middleware/Cors.php`.)

## 6. 화면에 서버 주소 넣기

- 지금은 `nuxt-shootkit/lib/upload.ts`의 `DEFAULT_API = ""`(빈칸이면 업로드 꺼짐 · 「시안 화면」 안내만)입니다.
- 서버 주소를 정하면 여기에 넣거나, `runtimeConfig.public.shootApi`(환경 변수 `NUXT_PUBLIC_SHOOT_API`)로 받게 바꿉니다.
- 시험할 때는 주소 끝에 `?api=http://127.0.0.1:7799`를 붙이면 내 컴퓨터 서버로 올립니다(내 컴퓨터 주소만 허락).

## 7. 연결 확인 순서

1. `GET /api/health` → `"ok":true, "store":"db", "storage":true`
2. 폰에서 촬영 키트로 사진 4장 + 영상 1개 찍고 「등록하기」 → 진행률이 100%까지 오르고 「등록했어요」 화면이 뜨는지
3. 저장소에 `shoots/{id}/photo/…`, `…/video/…` 파일이 생겼는지, DB `shoots.submitted_at`이 채워졌는지
4. 보기 화면 `nuxt-shootkit/?shoot={id}`에서 사진 · 영상 · 칸 이름표가 보이는지
5. 실패 시험: 비행기 모드로 올리다 끊기 → 「다시 시도」가 남은 파일만 올리는지 / 16MB 사진 → 「이 파일은 올릴 수 없어요」 / 남의 토큰으로 ② → 거절

## 8. 정책으로 정해야 할 것(개발 전에)

- 보기 화면(⑤) 공개 범위 · 파일 보관 기간 · 등록 안 하고 버린 촬영 파일 지우는 주기
- 영상 번호판 가림(지금은 사진만 가림, 영상은 안내만 함)
- 매물 등록과 연결하는 시점(촬영 먼저 vs 매물 먼저)
