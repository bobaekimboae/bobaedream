# HANDOVER_assets_v36

## 1) 담당 범위

- 보배드림 매물 목록의 `영상 매물` 토글 디자인 통일

## 2) 현재 진행 상태

- 완료: 모바일 영상 매물 스위치를 목록 탭형 텍스트 버튼으로 변경
- 완료: PC 영상 매물 스위치를 목록 탭형 텍스트 버튼으로 변경
- 유지: 영상 매물 필터 기능과 선택 상태

## 3) 결정된 사항과 그 이유

- 초톳 목록 툴바처럼 별도 스위치 손잡이를 쓰지 않고 텍스트 자체를 누르는 방식으로 통일한다.
- 기본은 회색 500, 선택은 검정 600과 2px 하단선으로 판매자 목록 탭과 같은 상태 표현을 쓴다.
- 접근성 상태는 `aria-pressed`로 제공한다.

## 4) 미결 사항·막힌 점

- 없음

## 5) 산출물 목록

- `src/prototype/listing/bbm-list.tsx` v36
- `src/prototype/listing/index.tsx` v36
- `src/prototype/listing/bbm-tokens.css` v36
- `src/prototype/listing/pc-bbmuseum.css` v36
- `docs/quick-filter-spec.md` v36
- `HANDOVER_assets_v36.md` v36

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 없음

## 7) 검수 상태

- 미검수

## 8) 다음에 할 일

1. 모바일·PC에서 기본·선택 상태와 필터 동작 검증
2. GitHub Pages 배포 및 라이브 재검증
