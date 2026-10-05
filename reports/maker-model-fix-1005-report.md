# 제조사·모델 시안 수정 검수 보고

- 기준 배포: `v=b440598`
- 작업 브랜치: `codex/maker-model-skeleton-fix-1005`
- 검수일: 2026-10-06
- 검수 URL: 로컬 Vite 미리보기, `spec=new&logo=m`

## 실측

| 화면 | 슬롯 | 행 높이 | 텍스트 시작 x | 이름 | 매물 수 |
|---|---:|---:|---:|---:|---:|
| 제조사 | 40×40 | 56 | 68 | 16px / 700 | 14px / 400 |
| 모델 | 56×28 | 72 | 84 | 16px / 700 | 14px / 400 |
| 세부모델 | 72×32 | 80 | 100 | 16px / 700 | 14px / 400 |
| 등급 | 20×20 | 48 | 48 | 16px / 700 | 14px / 400 |

## 자동 검수

- 360px, 384px, 412px: 문서 및 시안 가로 넘침 0px
- 콘솔 오류: 0건
- BMW 바디타입: 전체, 세단, 해치백, 왜건, 쿠페, 컨버터블, SUV, RV
- 로고 프리셋: s 28×28, m 36×32, l 40×40, xl 60×36
- 글꼴 선두: `Pretendard Variable`
- `npm run check:runtime`: 통과
- `npm run verify:qf`: 통과

## 캡처

1. `reports/screenshots/maker-model-fix-1005/01-maker-384.png`
2. `reports/screenshots/maker-model-fix-1005/02-hyundai-model-384.png`
3. `reports/screenshots/maker-model-fix-1005/03-grandeur-generation-384.png`
4. `reports/screenshots/maker-model-fix-1005/04-grade-384.png`
5. `reports/screenshots/maker-model-fix-1005/05-bmw-model-384.png`
