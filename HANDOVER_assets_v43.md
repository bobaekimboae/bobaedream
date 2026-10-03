# HANDOVER_assets_v43

## 1) 담당 범위

- 영상 필터 명칭과 모바일 선택 상태 교정

## 2) 현재 진행 상태

- 완료: 사용자 노출 명칭을 `숏폼매물`로 변경
- 완료: 초톳 선택 알약 실측 규격 적용
- 완료: 색상만 Airbnb형 `#222` 배경·흰 글자로 변경

## 3) 결정된 사항과 그 이유

- 초톳 모바일 실화면에서 선택 상태를 직접 측정했다.
- 형태는 높이 28px, 좌우 8px, 99px 라운드, 12/18px 700, 해제 아이콘 16px, 테두리·그림자 없음으로 따른다.
- 초톳의 노랑 계열(`#FFF8D6`·`#CC8F00`) 대신 보배드림의 Airbnb형 `#222`·`#FFFFFF`를 사용한다.

## 4) 미결 사항·막힌 점

- 없음

## 5) 산출물 목록

- `src/prototype/listing/bbm-list.tsx` v43
- `src/prototype/listing/bbm-tokens.css` v43
- `src/prototype/listing/index.tsx` v43
- `src/ChoTotFilterSheet.tsx` v43
- `docs/quick-filter-spec.md` v43
- `design-qa.md` v43
- `CHANGELOG_assets.md` v43
- `HANDOVER_assets_v43.md` v43

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 없음

## 7) 검수 상태

- 미검수

## 8) 다음에 할 일

1. 360px·384px 선택 상태와 정렬 위치 확인
2. GitHub Pages 배포 및 공개 화면 재검증
