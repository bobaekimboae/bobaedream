# 보배드림 차량이력 — Nuxt 이식본

사용자 프론트엔드: Nuxt **4.6.2**, Vue **3.5.33**, TypeScript **6.0.3**. Node **24.22.1**, pnpm **10.33.0** 기준이며 잠금 파일을 포함합니다. 관리자 UI 프레임워크는 사용하지 않습니다.

기존 `public/vehicle-history/`의 화면 구성·CSS·19개 표시 항목을 Vue SFC와 TypeScript로 이식했습니다. 기존 HTML과 공개 배포 경로는 변경하지 않았습니다. 이 디렉터리는 React/Next.js를 사용하지 않습니다.

## 실행

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm typecheck
corepack pnpm generate
corepack pnpm preview
```

로컬 검토: `http://127.0.0.1:5216/bobaedream/vehicle-history/`

GitHub Pages용 산출물은 `.output/public`입니다. 기본 baseURL은 `/bobaedream/vehicle-history/`이며 실제 교체·배포는 이번 작업에 포함하지 않았습니다. Node SSR 서버를 GitHub Pages에서 실행하는 구성이 아닙니다.

## 기존 API 연결

공개 게이트웨이: `POST https://staging.bbmuseum.co.kr/v1/test/vehicle-history`

`NUXT_PUBLIC_HISTORY_API_URL`로 빌드 시 공개 게이트웨이 주소를 바꿀 수 있습니다. 제공기관 키·인증서·Client Secret은 프런트엔드와 공개 환경변수에 넣지 않습니다. 기관 연계·인증·동의/권한 검증·과금·영속화는 기존 Laravel 12/PHP 8.4 서버의 업무입니다. 이 저장소에는 해당 스테이징 API의 서버 코드가 없어 서버 프레임워크·버전·공급기관 조회 성공은 확인하지 못했습니다.

| 모드 | 목적 | 기관조회 유형 | 입력 |
| --- | --- | --- | --- |
| dealer | USED_CAR_DEALER_LISTING_CHECK | SALE_VEHICLE_OR_OWNER_UNCONSENTED | plate, consentId |
| owner | OWNER_VERIFIED_HISTORY_CHECK | OWNER_CONSENTED_OR_SELF | plate, owner, consentId |

API의 입력 필드명은 기존 화면과 같습니다. 소유자명 입력이나 브라우저 체크박스만으로 차주 동의·본인인증이 완료됐다고 판단하지 않습니다. 서버가 실제 권한과 기관별 제공 범위를 검증해야 합니다.

### 실서버에서 확인한 범위

2026-11-04, 공개 페이지 설정과 직접 HTTP 검사 결과입니다. 정상 조회용 실제 차량번호는 아직 제공받지 못했습니다.

- CORS OPTIONS: **204**. 원본 허용 `*`, 메서드 `POST, OPTIONS`, 헤더 `Content-Type, Accept`.
- 빈 JSON POST: **400 INVALID_PLATE**.
- dealer 목적·유형을 지정하고 `plate: INVALID`를 보낸 유효성 검사 요청: **400 INVALID_OWNER**, `owner 필드는 필수입니다.`
- owner 목적에서 차량번호 누락: **400 INVALID_PLATE**.
- 위 검사는 유효성 검증이며 보험개발원·국토부 실차 조회 성공을 증명하지 않습니다. 오류 응답 때문에 번호판 단독 요청 계약과 서버 필수항목의 일치 여부를 먼저 확인해야 합니다. 임의 소유자명으로 우회하지 않았습니다.

### 백엔드 담당 확인 사항

1. 위 목적·유형을 실제로 지원하는지, 아니면 다른 전용 endpoint/입력이 필요한지 확정합니다.
2. 지원하는 경우 Laravel 요청 검증에서 `owner`를 owner 유형에만 필수로 처리하고, dealer 유형은 기관이 허용한 범위에서만 조회합니다. 기관 자체가 소유자명을 요구하는 상품은 억지로 번호판 단독 조회로 처리하지 않습니다.
3. 딜러 인증·상품차량 접근권한·소유자 동의 검증, 서버측 조회동의 기록과 요청 추적 ID를 확인합니다. 클라이언트 consentId만으로 동의 완료를 확정하지 않습니다.
4. 기관별 실패·미상·실제 0건, 부분 성공, 과금·중복 요청 방지, 제한시간·오류 코드를 확정합니다.
5. 정상 dealer/owner 테스트 차량을 각각 제공하여 응답 계약을 실데이터와 대조합니다. 실차 회신과 서버 소스가 없으면 이식본에서 임의로 기관 이력을 만들어 채우지 않습니다.

## 이식하면서 수정한 사항

- 누락·잘못된 숫자·부분 조회를 0건/정상으로 바꾸지 않습니다.
- 전손·침수·도난 중 일부만 미조회되면 전체 '없음'으로 표시하지 않습니다.
- 주행거리 비교 기록이 2개 미만이면 '비교 기록 부족'입니다. 감소 이력이 있어도 주행거리 조작 확정이라고 표시하지 않습니다.
- 부분 실패 기관의 잔존 데이터를 정상 조회 결과처럼 표시하지 않습니다. 전체 실패·빈 JSON·HTML 응답을 성공 화면으로 열지 않습니다.
- 날짜 형식이 혼합되어도 주행거리·타임라인을 날짜 기준으로 정렬하며 30건 초과 기록을 임의로 버리지 않습니다.
- 법인 소유자명의 숫자·괄호를 지우지 않습니다. 소유자명은 최근 검색에 저장하지 않습니다.
- 잘못된 localStorage JSON 때문에 화면 전체가 중단되지 않습니다. Vue 텍스트 바인딩으로 API·검색이력의 HTML 실행을 방지합니다.
- 중복 클릭 차단, 45초 제한시간·사용자용 오류, Esc/포커스 복귀가 가능한 네이티브 dialog, 메뉴 안내·인쇄 동작을 제공합니다.

## 검증 구분

- `tests/history.test.mjs`: Node 기본 테스트 러너로 데이터 의미·실패·요청 계약을 검사합니다.
- `scripts/browser-check.mjs`: 저장소에 설치된 Playwright를 재사용합니다. PC·모바일에서 **가로챈 합성 응답**으로 표시·부분 실패·오류·필터·인쇄 호출·메뉴를 검사합니다. 실차 API 성공 테스트가 아닙니다.
- `scripts/live-check.mjs`: 실제 공개 페이지의 GitHub Pages Origin에서 잘못된 입력 3건만 보냅니다. 유효 차량정보·명의를 전송하지 않으며 실제 CORS·오류 JSON 계약만 확인합니다.
- 예: `$env:PLAYWRIGHT_MODULE='C:\...\node_modules\playwright\index.mjs'; node scripts/browser-check.mjs`
- 빌드의 Nitro 정적 프리렌더 과정에서 cache-driver 경로를 외부 의존성으로 처리하는 경고가 있습니다. 정적 산출물 생성·브라우저 실행 여부를 별도로 검증합니다. SSR 운영 완료로 해석하지 않습니다.

기존 페이지·메인 배포 워크플로·공통 런타임·데이터베이스·검색색인은 변경하지 않습니다.
