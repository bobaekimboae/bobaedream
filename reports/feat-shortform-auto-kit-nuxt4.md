# 숏폼 자동 제작 키트 검수 보고서

- 기준일: 2026-10-31
- 브랜치: `feat/shortform-auto-kit-nuxt4`
- 작업 폴더: `shortform-auto-kit/`
- 상태: 검수 요청

## IA 교차 확인

Google Sheets의 `오토하우스비디오_분석` 탭(gid `1879506507`)을 먼저 읽고 기존 전략 탭과 교차 확인했다. Autohaus의 공개 확인 범위는 `Dashboard / Neues Video / Credits & Preise`, 차량정보→사진 업로드 2단계, 접수→작업중→완료→실패 흐름이다. 주문·결제·결과 전달형 서비스에서 편집 타임라인, 템플릿 선택, SNS 자동 업로드는 확인되지 않아 화면·브랜드·코드는 복제하지 않았다.

보배드림 시안에는 즉시 렌더, 사진 품질 게이트, Fact Lock, 사람 승인, 채널별 독립 게시 상태, 판매완료 예약 차단, 가격 변경 재검수, 문의 전환 추적을 추가했다.

## 구현

- Nuxt 4.6.2 + Vue 3.5.33 + TypeScript 6.0.3 별도 앱
- P0 화면 10종과 PC·모바일 반응형 UI
- 매물 검색·선택, 사진 8장 품질 점검, 고정 템플릿 3종, 15/20/30초, 9:16 출력
- 렌더 `queued → analyzing → rendering → completed/failed` 상태 시안
- Fact Lock 6항목과 명시적 사람 승인 게이트
- YouTube Shorts, Instagram Reels, TikTok 채널별 상태·실패·재시도 시안
- 판매완료 예약 중단, 가격 변경 재검수 경고, 전환 퍼널 MOCK
- `app/data/mock.ts`에 MOCK 상수 분리
- render/approval/publish mock API와 `Idempotency-Key` 계약
- 1080×1920, H.264, 15초 MP4 다운로드 샘플
- 자체 제작 선형 아이콘과 코드 기반 차량 대체 시안

## 검증 결과

| 항목 | 결과 |
| --- | --- |
| `pnpm install --frozen-lockfile` | 통과 |
| `nuxt typecheck` | 통과 |
| 계약 테스트 | 4/4 통과 |
| `nuxt build` | 통과 |
| 실제 빌드 버전 | Nuxt 4.6.2 / Vue 3.5.33 / Vite 8.3.5 |
| 금지 프레임워크 검색 | React / Next.js / Remotion import 0건 |
| MP4 규격 | H.264 / 1080×1920 / 15초 |
| PC 화면 | 1440×900 캡처 완료 |
| 모바일 화면 | 390×844 캡처 완료 |
| 검색 의미 일치 | PC·모바일 모두 `BD-261031-101` → 제네시스 G80 1건 |
| 앱 콘솔 오류 | 0건 |
| 깨진 이미지 | 0건(외부 이미지 의존 없음) |

캡처:

- `shortform-auto-kit/reports/captures/desktop-1440x900.png`
- `shortform-auto-kit/reports/captures/mobile-390x844.png`

## 미구현

- Laravel 12 실제 애플리케이션과 PostgreSQL 15.15·Redis 7.0.15·Meilisearch 1.54.3 연결
- 실렌더 워커, 실매물 DB, 파일 저장소, 감사 로그 영속화
- 실제 YouTube·Instagram·TikTok API, OAuth, 업로드, 예약 게시
- 실사용 전환 추적과 운영 알림
- 배포

## 확인하지 못함

- 실계정의 채널별 권한 범위와 심사 정책
- 운영 데이터에서의 렌더 성능·동시성·재시도 내구성
- 실제 보배드림 매물 데이터 품질과 개인정보 마스킹 정확도

## 안전 확인

실제 SNS 게시, OAuth 연결, 배포는 실행하지 않았다. mock adapter는 항상 `published=false`와 `not_published`를 반환하며, 화면에 “게시하지 않음”을 명시한다. 기존 React 시안은 수정·삭제·전환하지 않는다.
