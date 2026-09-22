# 운영서

## 배포 전

1. 백업과 복구 시점을 확인한다.
2. 빈 DB와 운영 크기 사본에서 migration 시간을 측정한다.
3. `composer install --no-dev --classmap-authoritative`를 수행한다.
4. `php artisan config:cache`, `route:cache`, `view:cache`를 수행한다.
5. queue worker와 scheduler의 배포 버전이 웹과 같은지 확인한다.
6. 관리자 역할별 로그인과 권한 거부를 점검한다.
7. Draft 비노출과 Publish/Rollback을 staging에서 재연한다.

## Publish

- 작성자와 QA 승인자는 분리한다.
- QA 승인 후 내용이 바뀌면 승인을 자동 무효화한다.
- 후보 번들을 smoke test한 뒤 current pointer를 전환한다.
- Outbox consumer는 `event_id`로 중복 처리를 막는다.
- 캐시는 pointer 전환 후 무효화한다.

## 관측 지표

- API p50/p95/p99와 5xx
- Resolver 성공·실패·미매핑
- Release별 `resolved_hash` 분포
- Shadow Diff 불일치율
- Outbox 지연과 재시도 횟수
- 관리자 권한 거부와 비정상 Publish 시도
- 검색 결과 0건 비율과 등록 폼 이탈률

## 보안

- SSO 또는 회사 인증을 우선하고 로컬 계정은 비상용으로 제한한다.
- super_admin, category_manager, qa_approver, viewer를 분리한다.
- 운영 DB와 레거시 DB 자격증명을 분리한다.
- 감사 로그 보존 주기와 접근 권한을 별도 승인한다.
- 실데이터를 공개 GitHub Issue, 로그, 테스트 fixture에 첨부하지 않는다.
