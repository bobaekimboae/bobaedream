# 트럭 측면 이미지 시안 Design QA v02

- source visual truth:
  - `public/assets/truck/pilot/v02/truck_type_cargo_side_v02.png`
  - `public/assets/truck/pilot/v02/truck_type_wingbody_side_v02.png`
  - `public/assets/truck/pilot/v02/truck_type_tanker_side_v02.png`
  - `public/assets/truck/pilot/v02/truck_type_cargo_crane_side_v02.png`
  - `docs/truck/truck_bottomsheet_media_consensus_v01.md`
- implementation screenshot: Codex 인앱 브라우저 tab 38(모바일 모드)·tab 39(PC 모드) 캡처
- implementation URL:
  - `http://127.0.0.1:5175/?qf=guazi&category=트럭+·+특장`
  - `http://127.0.0.1:5175/?qf=guazi&pc=1&category=트럭+·+특장`
- viewport: 1280×720, devicePixelRatio 1.25
- source pixels: 정규화 이미지 228×120
- implementation CSS size: 이미지 56×40, 모바일 행 64, PC 행 60
- density normalization: 원본은 `object-fit: contain`으로 56×40 CSS 슬롯에 축소했으며 구현 캡처는 DPR 1.25에서 확인
- state: 루트 유형 목록, 카고 하위 목록, 소형 선택, 1대 보기 적용

## Full-view comparison evidence

- 모바일 모드 바텀시트와 PC 중앙 모달 모두 체크박스·이미지·명칭·대수·화살표 열이 겹치지 않는다.
- 헤더와 하단 액션은 고정되고 유형 목록만 내부 스크롤한다.
- 측면 v02 샘플은 카고·윙바디·탱크로리·카고크레인에서 앞머리 왼쪽 방향과 바닥선이 유지된다.

## Focused region comparison evidence

- 같은 CUA 비교 입력에서 카고 228×120 원본과 PC 56×40 적용 상태를 함께 대조했다.
- PC 실측: 행 520×60, 이미지 표면 56×40, 하단 액션 520×77.
- 모바일 모드 실측: 행 505×64, 이미지 표면 56×40, 하단 액션 520×80.
- 카고 하위의 소형 선택 후 확정 버튼이 1대 보기로 갱신되고 URL에 `truckFormat=카고(화물)트럭&truckSubtype=소형`이 반영됐다.
- 브라우저 경고·오류는 0건이다.

## Required fidelity surfaces

- Fonts and typography: 기존 15/20px·650 라벨과 13px 대수를 유지해 글자 잘림이 없다.
- Spacing and layout rhythm: 체크박스 20 → 12 간격 → 이미지 56 → 12 간격 → 명칭 순서이며 모바일 64/PC 60 행에 수직 중앙 정렬됐다.
- Colors and visual tokens: 이미지 표면 #F7F7F7, 경계 #ECECEC, 반경 6px가 흰색·은색 차체 외곽을 분리한다.
- Image quality and asset fidelity: 네 원본 모두 1484×1060 투명 생성본을 228×120 투명 캔버스·바닥선 y=111로 정규화했다. 로고·문자·번호판은 없다.
- Copy and content: 기존 트럭 유형명·매물 수·하위 탐색 명칭은 변경하지 않았다. 접근성 이름에 매물 수를 추가했다.

## Findings

- P0/P1/P2 없음.
- P3: 완전 측면형은 긴 차체 비율 때문에 실제 차량 높이가 56×40 슬롯 안에서 약 21~25px다. 이번 시안 목적에는 적합하며, 추가 확대는 앞뒤 잘림 없이 불가능하므로 사용자 비교 후 결정한다.

## Comparison history

- 초기 공개본: 32×28 이미지 요소에서 실제 실루엣 약 30×15, 유형 인지가 약함.
- 수정: 56×40 표면, 모바일 64/PC 60 행, 측면 v02 4종 연결.
- 수정 후 증거: 루트·카고 하위 캡처, CSS 실측, 선택·확정·URL 동작, 콘솔 오류 0건.

## Implementation Checklist

- [x] 측면 v02 4종 정규화
- [x] 루트·대표 2뎁스 연결
- [x] 모바일·PC 슬롯과 행 크기 적용
- [x] 하위 탐색·선택·확정·URL 검증
- [x] 콘솔 오류 확인

## Follow-up Polish

- 사용자 비교 결과에 따라 이미지 표면을 유지하거나 투명 무배경으로 바꿀 수 있다.
- 나머지 상위 유형은 승인 후 같은 측면 규칙으로 순차 제작한다.

final result: passed

