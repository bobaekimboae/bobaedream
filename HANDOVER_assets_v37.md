# HANDOVER_assets_v37

## 1) 담당 범위

- 보배드림 매물 목록의 `영상 매물` 스위치 규격 교정

## 2) 현재 진행 상태

- 완료: `영상 매물` 텍스트 복구
- 완료: 모바일 영상 토글을 공통 리스트형 스위치로 변경
- 완료: PC 영상 토글을 공통 리스트형 스위치로 변경
- 유지: 영상 매물 필터 기능

## 3) 결정된 사항과 그 이유

- 사용자의 정정에 따라 변경 대상은 문구가 아니라 문구 오른쪽의 스위치다.
- 모바일·PC 모두 리스트형과 같은 38×22px 트랙, 16px 손잡이, 3px 내부 여백, 16px 이동값을 사용한다.
- 기존 PC 필터 내부의 다른 작은 스위치는 건드리지 않고 목록 영상 스위치만 교정한다.

## 4) 미결 사항·막힌 점

- 없음

## 5) 산출물 목록

- `src/prototype/listing/bbm-list.tsx` v37
- `src/prototype/listing/index.tsx` v37
- `src/prototype/listing/bbm-tokens.css` v37
- `src/prototype/listing/pc-bbmuseum.css` v37
- `docs/quick-filter-spec.md` v37
- `HANDOVER_assets_v37.md` v37

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 없음

## 7) 검수 상태

- 미검수

## 8) 다음에 할 일

1. 모바일·PC에서 문구·스위치 크기·선택 이동값 검증
2. GitHub Pages 재배포 및 라이브 재검증
