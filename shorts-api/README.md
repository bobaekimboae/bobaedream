# shorts-api — 보배드림 숏폼 보기 API

Laravel 12 · PHP 8.4 · PostgreSQL 15. 계약은 `../docs/shorts-api.md`, 기계 판독용은 `openapi.yaml`.

보배드림 리뉴얼 백엔드의 숏폼 매물(`/v2/cars/shorts`)을 따라가며 여러 장을 모아 화면 모양으로 주고(BFF), 원본에 없는 **비디오 투어 부위 시각**과 **숏폼 시청 기록**만 PostgreSQL에 저장한다.

```bash
composer install                 # vendor 는 커밋하지 않는다
cp .env.example .env && php artisan key:generate
php artisan migrate              # short_video_chapters · short_video_views
php -S 127.0.0.1:8789 -t public public/index.php   # http://127.0.0.1:8789/api/health
bash tests/smoke.sh              # 가짜 원본 + SQLite 시험 30개
```

운영(PHP-FPM · nginx)은 `public/index.php` 를 그대로 쓴다. 무료 임시 서버가 필요하면 촬영 키트 API 와 같이 Vercel PHP 런타임(`vercel.json`)으로 올릴 수 있다(DB 없이 피드 · 찜만, 부위 · 시청 기록은 `DB_*` 설정 필요).
