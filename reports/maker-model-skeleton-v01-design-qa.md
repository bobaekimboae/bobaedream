# 제조사·모델 검색 뼈대 v01 디자인 QA

- source visual truth: `C:\Users\bobae\Downloads\Claude outputs\grandeur_test_1005\maker_model_skeleton_v1.html`
- source capture: `C:\Users\bobae\codex-work\bobaedream\.codex-artifacts\maker-model-skeleton-v1.png`
- implementation: `http://127.0.0.1:4192/maker-model-skeleton-v01.html`
- implementation capture (desktop): `reports/maker-model-skeleton-v01-desktop.png`
- implementation capture (mobile): `reports/maker-model-skeleton-v01-mobile.png`
- side-by-side evidence: `reports/maker-model-skeleton-v01-comparison.png`
- desktop normalization: source 1180×978px, implementation 1200×976px, CSS viewport 1200×976, density 1×. 두 화면은 동일 높이와 유사 폭으로 병렬 비교했다.
- mobile normalization: implementation 384×844px, CSS viewport 384×844, density 1×.
- state: 화면 1 제조사, 로고 프리셋 `l`.

## Findings

- P0/P1/P2 없음.
- 원본 HTML 캡처의 한글이 깨져 있어 문자 모양을 직접 대조할 수 없었다. 구현본은 UTF-8을 명시하고 Pretendard를 사용했으며, 제목·본문·행·카운트의 크기는 지시문 수치를 기준으로 검증했다.
- 제공 HTML의 구성과 같은 `설명/토큰 패널 + 384px 시트` 구도를 유지했다. 제품 화면은 900px 미만에서 장식 프레임 없이 모바일 전체 화면으로 전환된다.

## Required fidelity surfaces

- Fonts and typography: Pretendard, 헤더 제목 20/28 700, 옵션 15px, 카운트 13px. 한글 깨짐 없음.
- Spacing and layout rhythm: 헤더 64, 검색 44, 제조사 행 56, 모델 행 50, 세부모델 행 56, 등급 행 48, 하단 버튼 52px. 360/390/430px에서 수평 오버플로 없음.
- Colors and visual tokens: 흰 시트, `#E8E8E8` 구분선, `#222` 주요 액션/선택, 중립 회색 검색 표면을 유지했다.
- Image quality and asset fidelity: 저장소의 실제 브랜드 로고와 승인된 차량 PNG를 사용했다. 모든 차량 이미지는 74×46 `contain`, `center bottom`; 깨진 이미지와 404 없음.
- Copy and content: 화면 0~4 명칭, 국산/수입 인기/수입 이름순, 바디타입 탭, 연료·구동 그룹과 등급 구조가 지시문과 일치한다.

## Full-view comparison evidence

- `reports/maker-model-skeleton-v01-comparison.png`에서 좌측 설명 패널, 단계/로고 컨트롤, 토큰 표, 우측 모바일 시트 비율과 고정 푸터 구성이 같은 계층으로 확인됐다.
- 원본의 깨진 한글은 구현 결함으로 복제하지 않고 UTF-8 선언으로 교정했다.

## Focused region evidence

- 384px 브라우저 실측: 헤더 64, 검색 44, 로고 슬롯 40, 제조사 행 56, 모델 이미지 74×46/행 50, 세부모델 이미지 74×46/행 56, 체크박스 20/행 48, 버튼 52px.
- 핵심 상세 수치는 DOM computed measurement로 확인했으므로 별도의 확대 크롭은 필요하지 않았다.

## Interaction and responsive verification

- 제조사 검색: `벤츠` 입력 시 벤츠 한 행만 남음.
- 모델 검색: `G` 입력 시 G클래스·GLA·GLC·GLE만 남음.
- 제조사 → 모델 → 세부모델 → 등급 선택 완료.
- 등급 선택 시 선택 칩과 결과 버튼 대수가 즉시 갱신됨.
- 초기화, 뒤로가기, 닫기, 이름순/바디타입 탭, 초성 이동 동작 확인.
- 360/390/430px: body와 sheet scrollWidth가 viewport와 일치, 헤더 64와 버튼 52 유지.
- 브라우저 콘솔 error/warning 없음. 이미지 404 및 `naturalWidth=0` 없음.

## Comparison history

1. 1차 확인: 원본에 UTF-8 선언이 없어 한글이 깨졌고, 첫 구현의 뒤로가기 자산이 시각적으로 맞지 않았다.
2. 수정: 구현 HTML에 UTF-8을 명시하고 보배드림 모바일 뒤로가기 자산으로 교체했다. 가솔린/디젤 등급 분류도 교정했다.
3. 재확인: 한글, 뒤로가기, 등급 그룹, 상대 자산 경로, 404·콘솔, 모바일 규격을 다시 확인했다. 남은 P0/P1/P2 없음.

## Open Questions

- 바이크 필터 코덱스의 시안용 API·내보내기 경로가 아직 없어 실제 63/663/1,256 데이터를 연결하지 않았다.
- 모델·세대 AI 이미지 생성은 별도 후속 PR 범위다.

## Implementation Checklist

- [x] 5개 화면 구조와 이동
- [x] 검색·탭·초성 이동
- [x] 다중 등급 선택과 결과 수 갱신
- [x] 로고 프리셋 s/m/l/xl
- [x] 360/384/390/430 및 1200px 검수
- [x] UTF-8·접근성 이름·콘솔·이미지 오류 검수
- [ ] 데이터 내보내기 경로 수신 후 어댑터 연결

## Follow-up Polish

- P3: 실제 데이터 연결 뒤 긴 제조사명·모델명·세대코드 최대 길이 표본으로 한 번 더 줄바꿈과 말줄임을 검수한다.

final result: passed


