# community-api

보배드림 커뮤니티 차량 리뷰 · 연비 게시판 + 동처띠 글쓰기 키트 6종(일상 · 질문 · 영상 · 긴 글 · 내 차 팔기 · 구매가) API. Laravel 12 · PHP 8.4 · PostgreSQL 15 · Sanctum.
계약은 `../docs/community-review-api.md` · `../docs/community-publish-api.md`, 기계 판독용은 `openapi.yaml`.

```bash
composer install            # vendor 는 커밋하지 않는다
cp .env.example .env && php artisan key:generate
php artisan migrate && php artisan db:seed   # 차종 기준표(database/data/vehicle-models.json)
php artisan serve           # http://localhost:8000/api/community/health
bash tests/smoke.sh         # SQLite 시험 36개
bash tests/publish-smoke.sh # 글쓰기 키트 69개 (SMOKE_PG="host db user pw" 로 PostgreSQL)
php artisan storage:link    # 올린 사진 · 영상 공개 주소(/storage)
php artisan schedule:work   # 매시간 community:prune-uploads
```
