# 차량이력 이식·검증 결과

확인일: 2026-11-04 (Asia/Seoul). 기준: origin/main `d0551c82`, 작업 브랜치 `codex/vehicle-history-nuxt`.

## 판정

- 기존 API 게이트웨이의 연결·CORS·오류 JSON은 확인.
- 실차 정상 조회는 미확인. 정상 dealer/owner 테스트 차량·명의 데이터가 제공되지 않음.
- 번호판 단독 목적·유형 요청에서도 소유자명 필수 오류를 반환하여 입력 계약 확인 필요.
- 신규 프런트엔드 Nuxt 4.6.2 / Vue 3.5.33 / TypeScript 6.0.3 이식본 작성 및 정적 빌드 검증.
- 기존 서버 API의 Laravel 12/PHP 8.4 구현 여부·업무 로직·운영 권한은 서버 소스가 없어 미확인. API 서버를 변경하거나 기관 인증정보를 가져오지 않음.
- 공개 페이지 교체·운영 배포·PR 병합은 수행하지 않음.

## 실서버 검증

실제 Chrome의 `https://bobaekimboae.github.io` Origin에서 `POST https://staging.bbmuseum.co.kr/v1/test/vehicle-history`를 검사함.

| 케이스 | HTTP | 응답/확인 |
| --- | --- | --- |
| OPTIONS | 204 | Allow-Origin `*`, POST/OPTIONS 허용 |
| 빈 JSON | 400 | INVALID_PLATE |
| dealer 목적·유형 / plate=INVALID / owner 없음 | 400 | INVALID_OWNER: owner 필드는 필수입니다. |
| owner 목적·유형 / plate 없음 | 400 | INVALID_PLATE |

유효한 차량번호나 실제 소유자명은 전송하지 않았다. 위 결과를 보험개발원·국토부 조회 성공으로 해석하지 않는다.

## 코드 검증

| 검사 | 결과 |
| --- | --- |
| `corepack pnpm test` | 10/10 통과 |
| `corepack pnpm typecheck` | 통과 |
| `corepack pnpm generate` | 정적 산출물 생성 성공 |
| `node scripts/browser-check.mjs` | PC 1440×1000, 모바일 390×844, 360×800 통과 |
| 브라우저 오류·가로 넘침 | 3개 화면 모두 없음 |
| `node scripts/live-check.mjs` | 실제 Origin에서 위 3개 오류 응답 확인 |

화면 테스트는 API 요청을 가로챈 합성 계약 응답으로 수행했다. 번호판/소유자 입력·동의, 실제 요청 필드, 19개 표시 항목, 주의 필터, 주행거리 감소 표시, 부분 실패 기관 데이터 제외, 전체 실패·빈 JSON·HTML 차단, 메뉴/Esc/포커스 복귀, 최근 검색의 소유자명 미보관, PDF 인쇄 호출을 확인했다. PDF 파일 다운로드·기관의 실제 응답 필드 전체를 검증했다는 뜻이 아니다.

빌드 경고: Nitro 정적 프리렌더 과정의 `cache-driver.mjs` 경로를 외부 의존성으로 취급하는 경고 1종. 빌드 exit 0이며 생성된 정적 사이트의 3개 화면 브라우저 실행이 통과했다. Nuxt SSR 서버의 운영 검증은 하지 않았다.

## 개발팀 다음 작업

1. 기존 API에서 번호판 단독 조회를 지원하는 실제 요청 계약·endpoint와 owner 필수 조건을 확인한다.
2. dealer 조회 권한과 owner 조회 인증·동의 조건을 서버에서 검증한다.
3. 정상 조회 가능한 dealer/owner 테스트 데이터로 원천별 성공·부분 실패·데이터 갱신 시각을 확인한다.
4. 검토 후 정적 산출물 `.output/public`의 공개 경로 교체를 별도로 배포한다.

API 요청/응답·개인정보 최소화·실패 상태 처리는 README 및 `app/lib/history.ts`를 참고한다.
