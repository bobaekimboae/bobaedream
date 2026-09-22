# AI Codex 실행 계약

## 1. 목적

이 저장소의 주 구현자는 AI Codex다. 목표는 데모가 아니라 보배드림 실서버에 단계적으로 연결 가능한 차량유형별 멀티 카테고리 관리자, Release Engine, 공개 설정 API를 만드는 것이다.

## 2. 작업 순서

항상 `PLAN → IMPLEMENT → VERIFY → COMMIT → REPORT` 순서로 작업한다.

1. 변경 전 `README.md`, 본 문서, `docs/decision-log.md`, 관련 ADR·OpenAPI를 읽는다.
2. 요구사항 충돌은 임의 해석하지 않고 `BLOCKED` 이슈와 선택지를 기록한다.
3. DB 변경은 forward migration, rollback, backfill, 예상 잠금 시간을 함께 작성한다.
4. API 변경은 `docs/openapi.yaml`을 먼저 또는 같은 커밋에서 수정한다.
5. 기능은 권한 테스트·감사 로그 테스트·실패 테스트를 포함한다.
6. 완료는 설명이 아니라 CI, 테스트, migration rehearsal, 보안 검사 증거로 판단한다.

## 3. 절대 금지

- 운영 DB 구조와 Laravel 버전을 확인하지 않고 기존 시스템 통합을 가정하지 않는다.
- 기존 매물 원장을 신규 관리자 DB로 복제하지 않는다.
- 운영용 `listings_stub`를 만들지 않는다.
- 사용자 입력 SQL, PHP 표현식, `eval`, 동적 클래스명을 실행하지 않는다.
- Draft 또는 미승인 Release Bundle을 공개 API에서 반환하지 않는다.
- Published 레코드를 직접 수정하지 않는다. 새 버전을 생성한다.
- 매핑 실패를 `CAR`나 `ALL_VEHICLES`로 조용히 폴백하지 않는다.
- 운영 비밀값, 실사용자·딜러·매물 정보, 내부 URL을 커밋하지 않는다.
- 테스트 skip, 임시 mock, 빈 API, TODO를 남긴 상태로 완료 처리하지 않는다.
- 회사 또는 권리자 승인 없이 임의의 오픈소스 라이선스를 적용하지 않는다.

## 4. 경계

- 기존 매물 시스템: 매물 CRUD, 심사, 가격, 사진, 판매자, 상태의 Source of Truth.
- 본 시스템: vehicle type, category node, field schema, predicate, placement, seller policy, release bundle의 Source of Truth.
- 연결: `App\\Contracts\\ListingGateway`와 `App\\Domain\\Listing\\ListingContract`만 사용한다.
- 기존 테이블명·컬럼명은 `config/listing-contract.php` 외부로 누출하지 않는다.

## 5. 버전·배포

- PHP 8.4, Laravel 13, Filament 5, Livewire 4를 composer.lock으로 고정한다.
- 운영 플랫폼 버전이 다르면 `docs/adr/001-platform-integration.md`를 갱신하고 승인 전 통합을 중단한다.
- Publish는 한 트랜잭션에서 candidate 검증, immutable snapshot, current pointer 전환, outbox 기록을 수행한다.
- 배포 후 smoke 실패 시 previous pointer로 자동 복귀할 수 있어야 한다.

## 6. 완료 기준

```bash
composer validate --strict
vendor/bin/pint --test
vendor/bin/phpstan analyse
php artisan test
php artisan migrate:fresh --seed
php artisan route:list
```

위 명령과 Docker health check, secret scan, 공개 API의 Draft 비노출, 권한 분리, rollback rehearsal이 모두 성공해야 한다.

## 7. 보고 형식

- 변경 목적
- 변경 파일
- 실행 명령과 결과
- migration·배포·rollback 영향
- 보안 및 개인정보 영향
- 남은 HOLD 또는 BLOCKED 결정
