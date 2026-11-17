# 보배드림 숏폼 스튜디오 v0.1

중고차 매물 또는 사진을 선택해 15~30초 세로 숏폼을 만들고, 사실검증과 사람 승인을 거쳐 채널별 게시 상태를 관리하는 Nuxt 검수용 키트입니다.

## 고정 기술 스택

- TypeScript 6.0.3
- Nuxt 4.6.2
- Vue 3.5.33
- Node.js 24.22.1
- pnpm 10.33.0

React, Next.js, Remotion, Pinia, SCSS를 사용하지 않습니다.

## 실행

```bash
corepack pnpm@10.33.0 install
corepack pnpm@10.33.0 dev
```

## 검증

```bash
corepack pnpm@10.33.0 typecheck
corepack pnpm@10.33.0 test
corepack pnpm@10.33.0 build
```

## 산출물

- `docs/IA.md`: Autohaus 분석 탭과 교차 확인한 P0 IA
- `docs/STATE_CONTRACT.md`: Laravel 정본 경계, 상태 모델, Idempotency-Key 계약
- `reports/captures/desktop-1440x900.png`: PC 검수 캡처
- `reports/captures/mobile-390x844.png`: 모바일 검수 캡처

## 안전 상태

- 실제 SNS API 대신 `server/api/publish.post.ts`의 mock adapter를 사용합니다.
- OAuth·API 키가 없으므로 항상 `published=false`입니다.
- 배포 설정과 실제 계정 연결은 포함하지 않습니다.
- 화면 데이터는 `app/data/mock.ts`에만 모아 실제 값과 구분했습니다.

