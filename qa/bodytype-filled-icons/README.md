# PC 탑메뉴 차종 필드형 아이콘 QA

## 목적

- PC 탑메뉴의 `차량검색 · 중고차 · 트럭 · 중장비 · 바이크`를 카와우 임시 아이콘에서 우리 차종 원본 기반 아이콘으로 교체한다.
- 20px 메뉴 크기와 활성 검정 칩에서 차종이 즉시 구분되어야 한다.

## 기준 원본

- Notion: `보배드림 독일 아우토 스카우트 24`
- 차종 원본 17종: 소형차, 세단, 쿠페, 카브리오, 왜건, SUV, 미니밴, 밴, 픽업, 캠핑카, 트럭, 트랙터, 트레일러, 세미트레일러, 건설기계, 여러 차종, 기타
- 바이크는 위 차종 DB에 없으므로 사이트의 기존 24px 원본 `public/assets/category/icons/v01/category_bike_v01.svg`를 사용했다.

## ImageGen 작업

- 모드: built-in ImageGen, transparent background
- 승용 프롬프트 요약: 원본 9종의 실루엣을 유지하고 `#171717` 단색 필드형, 창문·바퀴 중심은 음각으로 유지, 20px 판독성 우선
- 상용 프롬프트 요약: 원본 8종의 실루엣을 유지하고 승용 세트와 동일한 굵기·라운드·음각 규칙 적용
- 바이크 상세 일러스트 생성안은 20px 메뉴 픽토그램과 맞지 않아 폐기했다. 기존 바이크 원본이 다른 메뉴와 가장 안정적으로 맞는다.

## 실제 적용

| 메뉴 | 적용 자산 |
| --- | --- |
| 차량검색 | `public/assets/bbm/nav-icons/filled/all-vehicles-filled.png` |
| 중고차 | `public/assets/bbm/nav-icons/filled/used-car-filled.png` |
| 트럭 | `public/assets/bbm/nav-icons/filled/truck-filled.png` |
| 중장비 | `public/assets/bbm/nav-icons/filled/heavy-equipment-filled.png` |
| 바이크 | `public/assets/bbm/nav-icons/filled/bike-filled-v1.svg` |

## 검수

- 프로덕션 빌드: 통과
- 1440×900 전체차량 활성 캡처: `pc-gnb-1440.png`
- 1440×900 중고차 활성 캡처: `pc-gnb-used-active-1440.png`
- 1440×900 트럭 활성 캡처: `pc-gnb-truck-active-1440.png`
- 1440×900 바이크 활성 캡처: `pc-gnb-bike-active-1440.png`
- 활성 칩의 `currentColor` 흰색 반전과 비활성 검정 표시를 모두 확인했다.
