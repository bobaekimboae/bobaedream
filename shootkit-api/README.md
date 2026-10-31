# shootkit-api — 촬영 키트 임시 업로드 서버

리뉴얼 스택(Laravel 12 · PHP 8.4) 그대로 만든 **임시 무료 서버**다. Vercel Hobby(무료)의 PHP 런타임(`vercel-php`)에서 돈다.

## 어떻게 올라가나

```
폰(nuxt-shootkit) ──① 촬영 만들기 POST /api/shoots──────────▶ Laravel
                  ──② 파일마다 허가표 POST /api/blob/upload──▶ Laravel (경로·종류·크기만 허락, 1시간)
                  ──③ 파일 본체 PUT ─────────────────────────▶ Vercel Blob (서버를 거치지 않음, 큰 영상도 OK)
                  ──④ 등록 확인 POST /api/shoots/{id}/submit─▶ Laravel (저장소에 다 있는지 대조)
보기 화면 ?shoot=  ──⑤ GET /api/shoots/{id} ───────────────────▶ Laravel (사진·영상 주소)
```

- 무료 서버는 요청 하나에 4.5MB까지라서 파일은 폰 → Blob 직접 업로드(③)로 보낸다.
- 임시 서버는 DB 없이 기록을 Blob에 JSON으로 둔다(`SHOOT_STORE=blob`). 운영은 `SHOOT_STORE=db` + PostgreSQL 15(`database/migrations`).
- 읽기·쓰기 토큰(`BLOB_READ_WRITE_TOKEN`)은 서버 환경 변수에만 있다. 화면에는 1시간짜리 허가표만 간다.

## 한도

| 종류 | 개수 | 한 개 크기 | 형식 |
|---|---|---|---|
| 사진 | 30 | 15MB | jpg · png · webp |
| 영상 | 12 | 300MB | mp4 · webm · mov |

허락하는 화면 주소(`SHOOT_ORIGINS`): `https://bobaekimboae.github.io`, `http://localhost:5191`.

## Vercel에 올리기

1. Vercel 프로젝트 `bobaedream-shootkit-api`, Root Directory = `shootkit-api`, Framework = Other.
2. Storage → Blob 저장소(공개) 만들고 이 프로젝트에 연결 → `BLOB_READ_WRITE_TOKEN`이 자동으로 들어간다.
3. 배포 후 `https://<주소>/api/health`가 `"storage":true`면 끝. 그 주소를 `nuxt-shootkit/lib/upload.ts`의 `DEFAULT_API`에 넣는다.

## 내 컴퓨터에서 시험

```
composer install
BLOB_READ_WRITE_TOKEN=... php -S 127.0.0.1:7799 -t public public/index.php
```
화면은 `?api=http://127.0.0.1:7799`를 붙이면 이 서버로 올린다(내 컴퓨터 주소만 허락).
