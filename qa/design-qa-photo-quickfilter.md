# Design QA — 매물 리스트 차량 카테고리 실사 퀵필터

## Comparison target

- Source visual truth: 사용자 제공 `1-1000014818.jpg`의 매물 리스트 차량 카테고리 위치·리듬과 `1-1000014810.jpg`, `2-1000014812.jpg`의 초톳 투명 실사 카테고리 슬롯.
- Implementation URL: `http://127.0.0.1:4177/?qf=guazi&v=photo-quickfilter`
- Implementation screenshot: `qa/implementation-photo-quickfilter-384.png`
- Focused comparison: `qa/quickfilter-comparison-v01.png`
- Viewport: 384×852 CSS px, deviceScaleFactor 1 기준.
- Pixel dimensions: source 591×1280px, implementation 384×852px. 소스 카테고리 영역은 384px 폭으로 다운샘플해 비교했습니다.
- State: 라이트 테마, 중고차 목록 첫 화면, 차량 카테고리 미선택 상태.

## Findings

- P0/P1/P2 없음.
- 기존 36px 회색 원형 SVG 아이콘은 배경 없는 실사 PNG로 교체됐고, 각 자산은 640×400px 투명 캔버스에서 동일 바닥선과 시각 높이로 정규화됐습니다.
- 화면 슬롯은 64×40px, 항목 폭 64px, 간격 8px, 피치 72px입니다. 384px에서 5개 항목이 보이고 나머지는 가로 스크롤로 접근됩니다.
- `화물트럭`, `모터홈` 라벨이 적용됐고 내부 선택 값은 기존 `트럭 · 특장`, `캠핑카`를 유지합니다.
- 7개 이미지가 모두 `naturalWidth=640`, `naturalHeight=400`으로 로드되며 404가 없습니다.

## Required fidelity surfaces

- Fonts and typography: 기존 Pretendard 12/18px, 500 라벨 규칙을 유지했습니다. `화물트럭`과 `모터홈`은 한 줄이며 긴 건설기계 라벨만 기존대로 최대 두 줄입니다.
- Spacing and layout rhythm: 좌측 12px, 64×78px 터치 칸, 64×40px 실사 슬롯, 이미지–라벨 2px, 항목 간 8px으로 초톳의 촘촘한 수평 레일 리듬과 일치합니다.
- Colors and visual tokens: 모든 차량 본체를 화이트·실버 톤으로 통일하고 배경 원·채움은 제거했습니다. 기존 텍스트·필터 칩 색상은 변경하지 않았습니다.
- Image quality and asset fidelity: 7개 모두 실사 투명 PNG이며 `object-fit: contain`, `object-position: center bottom`을 사용합니다. 차체·바퀴 왜곡, 배경 사각형, 저해상도 확대가 없습니다.
- Copy and content: `자동차`, `화물트럭`, `바이크`, `모터홈`, `올드카`, `건설기계(덤프/지게차)`, `부품 · 용품` 순서를 유지합니다.

## Full-view comparison evidence

- 전체 모바일 캡처에서 검색·지역·필터칩 아래의 기존 동일 위치를 유지하며, 퀵필터 높이 증가가 다음 `영상 매물` 행이나 카드 목록을 가리지 않습니다.
- 하단 고정 내비게이션과 목록 스크롤 구조에는 변화가 없습니다.

## Focused comparison evidence

- `qa/quickfilter-comparison-v01.png`에서 기존 36px 회색 원형 선 아이콘과 수정된 64×40px 투명 실사 슬롯을 동일 폭으로 대조했습니다.
- 실사 차량의 하단 기준선과 라벨 기준선이 항목마다 일정하며, 초톳처럼 별도 배경 원 없이 이미지 자체가 카테고리를 전달합니다.

## Comparison history

| 회차 | 발견 | 수정 | 결과 |
|---|---|---|---|
| 1 | P2: 생성 PNG의 희미한 그림자 알파가 투명 여백으로 계산돼 자동차·올드카가 다른 항목보다 작게 보임 | 알파 임계값 16 기준으로 실물 경계를 다시 잡고, 640×400 캔버스·공통 바닥선으로 정규화. 올드카를 3/4 시점으로 재제작 | 해결 |
| 2 | P0/P1/P2 없음 | 최종 캡처와 실측 확인 | 통과 |

## Verification

- `npm run build`: passed.
- `npm run verify:qf`: passed.
- 화물트럭 선택: URL category와 기존 `트럭 · 특장` 필터칩 갱신 확인.
- 가로 스크롤: 컨테이너 384px / 콘텐츠 520px / `overflow-x: auto` 확인.
- 브라우저 콘솔 오류·경고: 0건.

## Follow-up polish

- 노션 원본은 로그인 화면으로 제한되어 세부 이미지를 직접 확대 비교하지 못했습니다. 사용자가 공개 캡처를 제공하면 색온도와 각도만 P3 수준으로 추가 미세조정할 수 있습니다.

final result: passed
