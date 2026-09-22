# 구현 요구사항

## 시스템 책임

본 시스템은 기존 매물의 원장이 아니다. 차량유형, 카테고리 노드, 필드 정의, 등록·상세·검색 스키마, Placement, 안전한 검색 조건, 판매자 정책, Release Bundle을 관리한다.

## 필수 기능

1. 차량유형과 카테고리 노드를 독립 모델로 관리한다.
2. 동일 노출 위치에 여러 차량유형을 배치할 수 있다.
3. `ALL_VEHICLES`는 공통 필드와 운영자 포함·제외 정책을 지원한다.
4. 유형별 등록·검색·리스트·상세 필드 집합을 버전 관리한다.
5. 개인·업체·전문 판매자를 `seller_type`, `business_category`, `certification`으로 분리한다.
6. Predicate는 허용 연산자와 필드만 사용하는 JSON AST다.
7. Draft 변경은 Publish 전까지 런타임에 영향을 주지 않는다.
8. Publish는 QA 승인, 스냅샷, 원자적 포인터 전환, Outbox, 감사 로그를 포함한다.
9. 기존 매물은 Listing Contract로만 접근한다.
10. 매핑 불가 매물은 검수 큐로 보내고 기본 카테고리로 숨겨서 처리하지 않는다.

## 비기능 요구사항

- 공개 API p95 200ms 이하(캐시 적중 기준)
- Publish API와 Resolver는 멱등성을 보장한다.
- 모든 변경은 actor, request ID, before/after, hash chain을 남긴다.
- 공개 API는 Published 데이터만 반환한다.
- 운영 DB 접근 계정은 최소 권한이며 레거시 연결은 읽기 전용이다.
- 카테고리·필드 삭제는 soft delete 또는 참조 차단을 사용한다.
- GitHub 공개 저장소에 개인정보·시크릿·내부 URL을 저장하지 않는다.

## 완료 판정

- 빈 PostgreSQL에서 migration과 seed를 재실행할 수 있다.
- 동일 Release를 재배포해도 중복 side effect가 발생하지 않는다.
- 실패한 Publish는 current pointer를 바꾸지 않는다.
- Rollback 후 previous bundle이 current가 된다.
- Draft·미승인 스키마가 공개 API에 노출되지 않는다.
- 레거시 결과와 신규 Resolver 결과의 Shadow Diff를 산출할 수 있다.
- 실서버 배포 전 migration·publish·rollback rehearsal을 staging에서 통과한다.
