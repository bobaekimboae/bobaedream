# Design QA — 트럭·특장 초톳형 슬롯 v03

## 비교 기준

- 기준 이미지:
  - `reports/truck-chotot-slot-v03/source-chotot-category.png` — 초톳 카테고리 실사 이미지형
  - `reports/truck-chotot-slot-v03/source-chotot-brand.png` — 초톳 브랜드 로고형
- 구현 이미지:
  - `reports/truck-chotot-slot-v03/implementation-mobile-type-row.png`
  - `reports/truck-chotot-slot-v03/implementation-mobile-brand.png`
  - `reports/truck-chotot-slot-v03/implementation-pc-brand.png`
- 집중 대조:
  - `reports/truck-chotot-slot-v03/comparison-mobile-type-v03.png`
  - `reports/truck-chotot-slot-v03/comparison-mobile-brand-v03.png`
- 상태:
  - 초기 트럭 형식 행
  - 카고(화물)트럭 → 경형 트럭 (1톤 미만) → 0.5톤 선택 후 브랜드 행
- 구현 뷰포트: 모바일 390×844 CSS px·1x, PC 1440×1000 CSS px·1x.
- 기준 캡처: 1080×2340 px. CSS 원본 폭은 미확인이므로 집중 대조에서 390px 폭으로 정규화했다.
- 실사이트 확인: `https://xe.chotot.com/mua-ban-xe-tai-xe-ben` (2026-10-03). PC 트럭 목록도 무배경 로고 위·명칭 아래 구조와 한 줄 브랜드명을 사용한다.

## 비교 이력

### 1차 발견

- [P2] 모바일 유형 명칭이 12px로 초톳 환산 약 14~16px보다 작았다.
- [P2] 유형 이미지와 명칭의 가시 간격이 초톳보다 약 5~6px 좁았다.
- 브랜드 40×40 슬롯과 로고–명칭의 최종 가시 간격은 초톳 캡처와 유사했다.

### 수정

- 모바일 유형 명칭을 14/18px로 변경했다.
- 유형 이미지–명칭 CSS 간격을 모바일 7px, PC 9px로 변경했다.
- 브랜드 슬롯 40×40, 브랜드 로고–명칭 8px, 칩 줄–슬롯 8px은 유지했다.
- 모바일·PC 카드 크기와 터치 영역은 유지했다.

### 2차 비교

- 모바일 유형 행에서 이미지와 명칭이 분리되어 식별성이 개선됐다.
- 긴 명칭은 최대 두 줄 안에서 보이며 가로 스크롤 항목끼리 겹치지 않는다.
- 브랜드 행의 로고 폭·중심선·명칭 정렬에는 회귀가 없다.
- PC 형식 행은 카드 높이를 유지하면서 이미지·명칭의 위아래 균형이 개선됐다.
- 남은 차이: 초톳은 행 왼쪽에 그룹명을 두지만 보배드림 트럭 시안은 기존 정보 구조를 유지한다. 이번 요청 범위에서는 의도적 차이로 분류한다.

## 필수 품질면

- 글꼴·타이포그래피: Pretendard 유지. 유형 명칭 14px, 최대 두 줄, 가운데 정렬 통과.
- 간격·레이아웃: 모바일 80×108/64×64/간격 7, PC 132×144/88×88/간격 9 통과.
- 색상·토큰: 투명 배경, 테두리·곡률·그림자 없음, 명칭 `#595959` 유지.
- 이미지 품질: 투명 PNG의 원본 비율과 하단 기준선을 유지하며 잘림·늘어남 없음.
- 문구·콘텐츠: 트럭 형식 명칭과 엔카 뎁스 데이터는 변경하지 않았다.

## 동작·자동 검증

- 모바일에서 `카고(화물)트럭` 선택 후 세부형식 행 전환 확인.
- PC와 모바일의 초기 형식 행 및 선택 후 브랜드 행 확인.
- `node scripts/truck-chotot-slot-check.mjs`: 모바일·PC 통과, 콘솔 오류 0건.
- `npm run verify:qf`: 통과.
- `npm run build`: 통과.
- `npm run test:sites`: 4/4 통과.
- `npm run verify`: 작업 범위 밖 관리자 UI 경로 검사 1건이 기존 404로 실패(나머지 16건 통과). 트럭 코드·빌드와 무관하며 관리자 파일은 수정하지 않았다.

## 결과

- P0/P1/P2 잔여 항목 없음.
- final result: passed

