# HANDOVER_assets_v47

## 1) 담당 범위

- 초톳 원본 앱 기준 필터 알약칩, 펼침 아이콘, 목록/갤러리 보기 아이콘, 모바일 매물 목록 전수조사 및 교정

## 2) 현재 진행 상태

- 완료: 노션 필터 펼침 SVG 원본 수집 및 경로 수정 없이 적용
- 완료: 노션 리스트뷰 SVG 원본 수집 및 경로 수정 없이 적용
- 완료: 필터 칩 자연 폭·32px 높이·4/12px 패딩·4px 간격 교정
- 완료: 모바일 보기 버튼의 임의 원형 테두리 제거
- 완료: 트럭·특장과 중고차 공통 목록 컴포넌트 교차 측정
- 완료: 썸네일 120×120, 제목·메타·가격·위치·판매자 규격 확인

## 3) 결정된 사항과 그 이유

- SVG는 노션 원본 패스를 그대로 보존하고 CSS로 표시 크기만 20px에 맞춘다.
- 한국어와 베트남어 문구 폭이 다르므로 칩 폭은 숫자 고정이 아니라 초톳처럼 콘텐츠 기반 자연 폭을 사용한다.
- 보기 전환은 32px 터치영역을 유지하되 시각적으로는 초톳처럼 아이콘만 보이게 한다.
- 이미 초톳 실측과 일치한 카드 수치는 불필요하게 재조정하지 않는다.

## 4) 미결 사항·막힌 점

- 없음

## 5) 산출물 목록

- `public/assets/bbm/filter-toggle-chotot-v01.svg` v01
- `public/assets/bbm/view-list-chotot-v02.svg` v02
- `reports/chotot-list-fidelity-20261004/audit.md` v47
- `reports/chotot-list-fidelity-20261004/notion-original-list.png` 원본
- `reports/chotot-list-fidelity-20261004/notion-original-grid.png` 원본
- `docs/quick-filter-spec.md` v47
- `design-qa.md` v47

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-중고차 상호 검수 대기

## 7) 검수 상태

- 자체 검증 완료, 상호 검수 미검수

## 8) 다음에 할 일

1. 코덱스-중고차 상호 검수
2. 사용자 승인 뒤 병합·배포
