# 보배드림 차량유형별 멀티 카테고리 관리자

기존 중고차 매물 관리자와 분리된 **분류·등록 스키마·검색 필터·노출 정책 관리자**입니다. 매물 원장은 기존 시스템이 계속 소유하며, 이 저장소는 `Listing Contract`를 통해 읽고 Published Release Bundle만 런타임에 제공합니다.

## 구현 범위

- 차량유형과 계층형 카테고리 관리
- 유형별 등록·상세·검색 필드 정의
- Placement와 안전한 JSON 조건식 기반 Resolver
- Draft → QA Approved → Published → Rolled Back 릴리스 흐름
- 기존 매물 코드 매핑과 Listing Contract 어댑터
- 판매자 유형·사업자 업종·인증 상태 정책
- 불변 감사 로그와 Outbox Event
- Filament 관리자 패널 및 공개 API
- Docker Compose, Pest, Larastan, Pint, GitHub Actions
- GitHub Pages용 무데이터 관리자 화면 데모

## 기술 기준

- PHP 8.4
- Laravel 13
- Filament 5 / Livewire 4
- PostgreSQL 16
- Redis 7
- Nginx

## 빠른 실행

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec app composer install
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed
docker compose exec app php artisan make:filament-user
```

- 관리자: `http://localhost:8080/admin`
- API 상태: `http://localhost:8080/api/v1/health`
- 정적 데모: `http://localhost:8080/admin-demo/`

## 기존 관리자 연결

1. `LEGACY_LISTING_CONNECTION`에 기존 매물 DB의 **읽기 전용 계정**을 설정합니다.
2. `config/listing-contract.php`에서 실제 테이블과 컬럼을 매핑합니다.
3. `/api/v1/resolver/preview/{listingId}`로 Shadow Read 결과를 비교합니다.
4. 불일치율과 누락률이 기준 이하가 된 뒤에만 신규 등록 화면과 연결합니다.

실서버 연결 전 필수 절차는 [통합 실행서](docs/INTEGRATION.md), [운영서](docs/OPERATIONS.md), [롤백서](docs/ROLLBACK.md)를 따릅니다.

## 안전 원칙

- 이 공개 저장소에 실데이터, 운영 URL, 토큰, 비밀번호, 내부 코드표를 커밋하지 않습니다.
- 운영 매물을 복제한 `listings_stub` 테이블을 만들지 않습니다.
- 임의 SQL 조건을 저장하거나 실행하지 않습니다.
- Draft 설정은 공개 API에 노출하지 않습니다.
- 모든 Publish는 QA 승인, 스냅샷, 감사 로그, 원자적 포인터 전환을 거칩니다.

## 구현 정본

- `AGENTS.md`: Codex 실행 지시문
- `docs/spec/requirements.md`: 기능·비기능 요구사항
- `docs/openapi.yaml`: 외부 API 계약
- `docs/erd.md`: 데이터 모델
- `docs/decision-log.md`: 확정 결정과 HOLD 항목

## 라이선스

회사의 권리자 승인 전 라이선스를 임의 확정하지 않습니다. 현재 저장소는 `UNLICENSED`이며 외부 사용·재배포 권한을 부여하지 않습니다.

## Verification gates

The pull request runs Composer validation, Pint, PHPStan level 7, PostgreSQL migration and seeding, Pest, route registration, contract tests, and JavaScript syntax checks. Local PHP 8.4 verification has confirmed Pint, PHPStan, Laravel boot, schema migration, seeding, and route registration.
