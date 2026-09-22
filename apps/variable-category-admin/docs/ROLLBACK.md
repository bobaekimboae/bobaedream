# 롤백 실행서

## 정책 롤백

정책 오류는 코드를 재배포하지 않고 `release_pointers.current_release_bundle_id`를 `previous_release_bundle_id`와 원자적으로 교환한다.

1. 신규 Publish 중지
2. 장애 Release와 영향 Placement 식별
3. `ReleaseBundlePublisher::rollback()` 실행
4. 설정 캐시 무효화
5. 공개 API ETag와 current version 확인
6. 검색 인덱스·Placement snapshot 재생성
7. 감사 로그와 사고 기록 확인

## 애플리케이션 롤백

- 이전 GHCR 이미지 태그로 웹·worker를 함께 되돌린다.
- migration이 additive라면 DB는 유지한다.
- destructive migration은 expand/contract 완료 전 배포하지 않는다.
- 구버전 코드가 신규 컬럼을 무시할 수 있는지 staging에서 확인한다.

## 자동 롤백 조건

- 공개 API 5xx 1% 초과
- Resolver 오류 0.5% 초과
- 미매핑률이 승인 기준 초과
- post-deploy smoke 실패
- current bundle 또는 ETag 불일치

## 금지

- 운영 DB에서 임의 UPDATE로 pointer 수정
- 감사 로그 삭제 또는 수정
- 데이터 백업 없이 down migration 실행
- 실패 원인 확인 전 동일 Release 재배포
