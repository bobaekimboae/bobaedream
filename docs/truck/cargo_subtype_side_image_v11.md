# 카고 하위 유형 이미지 v11

- 작성일: 2026-10-04
- 담당: 코덱스-특장
- 적용 범위: `truckFormat=카고(화물)트럭` 선택 상태의 상단 퀵필터 레일과 바텀시트 하위 유형

## 목적

- v09/v10 사진풍 이미지가 상단 퀵필터 레일에서 작고 어설프게 보이는 문제를 해소한다.
- 경형부터 대형까지 같은 그래픽 규칙을 적용해 카테고리 아이콘처럼 일관되게 보이도록 한다.

## 제작 규칙

- 배포본: `228×120px` 투명 PNG.
- 모바일 상단 퀵필터 슬롯: `76×48px`.
- PC 상단 퀵필터 슬롯: `104×62px`.
- 구도: 90도 측면, 차량 앞쪽은 왼쪽.
- 보디: 윙·탑·덤프가 아닌 평적재함 카고.
- 스타일: 실사 컷아웃이 아닌 평면 실루엣형 그래픽. 작은 칩에서 흐려지지 않도록 외곽선을 두껍게 둔다.
- 구분 기준: 차체 길이, 캡 높이, 적재함 길이, 후륜 축 수.

## 산출물

| 하위 유형 | 파일 |
|---|---|
| 경형 | `public/assets/truck/pilot/v11/truck_cargo_light_side_v11.png` |
| 소형 | `public/assets/truck/pilot/v11/truck_cargo_small_side_v11.png` |
| 준중형 | `public/assets/truck/pilot/v11/truck_cargo_semi_medium_side_v11.png` |
| 중형 | `public/assets/truck/pilot/v11/truck_cargo_medium_side_v11.png` |
| 준대형 | `public/assets/truck/pilot/v11/truck_cargo_quasi_large_side_v11.png` |
| 대형 | `public/assets/truck/pilot/v11/truck_cargo_large_side_v11.png` |

## 검수 메모

- 접촉시트: `docs/truck/qa/cargo_subtype_side_v11_contact.png`.
- `준중형·중형·준대형` 중복 매핑을 끊고 현재 라벨 6개를 직접 매핑한다.
