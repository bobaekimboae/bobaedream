# Design QA — 제목 3번 2종 · 판매자 시나리오

## Comparison target

- Source visual truth: 기존 3번 기본 시안 `reports/title-position-links-20261002/mobile-links-after-model.png`.
- Browser-rendered implementation: 로컬 `?qf=guazi&scenario=luxury30&titlepos=after-model` 및 `&titlecolor=blue`.
- Viewport: 384 × 832 CSS px.
- State: 럭셔리 UI 테스트 가상 매물 30대, 목록형, 라이트 테마.

## Findings

- No actionable P0/P1/P2 mismatch remains.
- 제목 시안은 `3 기본`과 `3B 블루` 두 개만 남고, 두 시안 모두 세부모델 바로 아래에 고정된다.
- 기본 제목은 13/18, weight 500, `#555`; 블루 제목은 13/18, weight 600, `#1B4C8C`다.
- 차량명·제원·가격·지역·썸네일 배치는 기존 3번 시안과 같다.
- 판매자명은 UI 테스트용 가상 딜러 상호 23개와 `개인판매자` 7개로 구성했다.
- 승인된 인물 프사 26장을 중복 없이 연결하고, 개인 매물 4건은 기본 프로필 아이콘을 사용한다.
- 프사는 20 × 20px, 원형, `object-fit: cover`, 중앙 정렬이다.
- 긴 딜러명은 한 줄 말줄임 처리되며 찜 아이콘과 겹치지 않는다.

## Interaction verification

- Preview links: 2 total — `3 기본`, `3B 블루`.
- 기본 링크에서 기본색 선택, 블루 링크에서 블루 선택 상태가 각각 정확하다.
- 30대 중 1페이지 20대와 2페이지 10대의 판매자명·프사 연결을 모두 확인했다.
- Document horizontal overflow: none.
- 빈 이미지 경로: none.

## Verification

- `npm run verify:qf`: passed.
- Runtime integrity: 28 protected files unchanged.
- TypeScript and Vite production build: passed.

final result: passed
