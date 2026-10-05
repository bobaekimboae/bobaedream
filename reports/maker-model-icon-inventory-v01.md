# 제조사·모델 선택 아이콘 인벤토리 v01

## 기준

- 아이콘 원본은 베트남 초톳 아이콘 보관함을 사용한다.
- 원본 SVG 경로는 다시 그리지 않고 로컬 자산으로 저장한다.
- 뒤로 아이콘은 24×24px, 닫기 원본 캔버스는 32×32px, 검색은 20×20px, 행 이동은 24×24px, 체크 원본 캔버스는 20×20px로 표시한다.
- 헤더 버튼의 터치 영역은 40×40px, 체크박스는 20×20px를 유지한다.

참조 원본: [초톳 아이콘 보관함](https://app.notion.com/p/3a9ee9c4b606802689e4dc573a2c0ad7), [회색 검색 돋보기](https://app.notion.com/p/3ccee9c4b60680d4b52bc01a1f725e22), [우측 셰브론](https://app.notion.com/p/3c8ee9c4b606803ca9b1f3e1cae7ae24), [창 닫기](https://app.notion.com/p/3c0ee9c4b60680409983e7050d010362), [좌측 셰브론](https://app.notion.com/p/3a9ee9c4b6068020a97edbd12a732ff6), [체크마크](https://app.notion.com/p/3c0ee9c4b60680f0b12fec0fc9e0ed08)

## 화면별 필요 수량

| 화면 | 고유 아이콘 종류 | 실제 아이콘 슬롯 수 | 구성 |
| --- | ---: | ---: | --- |
| 0 필터 | 2종 | 5개 | 닫기 1, 다음 4 |
| 1 제조사 | 4종 | 21개 | 뒤로 1, 닫기 1, 검색 1, 다음 18 |
| 2 모델 | 4종 | 12개 | 뒤로 1, 닫기 1, 검색 1, 다음 9 |
| 3 세부모델 | 3종 | 6개 | 뒤로 1, 닫기 1, 다음 4 |
| 4 등급 | 3종 | 8개 | 뒤로 1, 닫기 1, 체크 슬롯 6 |

전체 흐름에서 필요한 원본 SVG는 5종이다: 검색, 다음, 닫기, 뒤로, 체크마크.

## 로컬 자산

- `public/assets/maker-model/icons/chotot-search-gray.svg`
- `public/assets/maker-model/icons/chotot-chevron-right.svg`
- `public/assets/maker-model/icons/chotot-close.svg`
- `public/assets/maker-model/icons/chotot-chevron-left.svg`
- `public/assets/maker-model/icons/chotot-check.svg`

## 적용 규칙

- 검색: 초톳 원본 회색 `#8C8C8C`, 별도 투명도 미적용
- 다음: 24×24px 원본 캔버스, 보조 정보이므로 표시 투명도 58%
- 뒤로: 24×24px, 40×40px 버튼 중앙 정렬
- 닫기: 원본 내부 여백을 고려해 32×32px 캔버스를 쓰되 40×40px 버튼 중앙에 배치
- 체크: 원본 내부 여백을 고려해 20×20px 캔버스로 표시하고, 선택된 검정 20×20px 체크박스 안에서 흰색으로 처리

## 차량 이미지 방향

- 모델·세대 이미지의 전면이 화면 왼쪽을 향하도록 통일한다.
- 제조사 로고에는 방향 보정을 적용하지 않는다.
- 현재 우측을 향하는 시안 자산은 표시 단계에서 좌우 반전하며, 후속 원본 제작은 처음부터 좌측 방향으로 납품한다.
