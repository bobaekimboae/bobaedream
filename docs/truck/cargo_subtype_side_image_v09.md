# 카고 하위 유형 이미지 v09

- 작성일: 2026-10-04
- 담당: 코덱스-특장
- 적용 범위: 모바일 바텀시트와 PC 모달의 `카고(화물)트럭` 하위 6개 유형

## 목적

- 기존 카고 하위 이미지에서 `준중형·중형·준대형`이 같은 파일을 공유하던 문제를 해소한다.
- `경형 < 소형 < 준중형 < 중형 < 준대형 < 대형` 단계가 작은 이미지 슬롯에서도 크기·축·적재함 길이 차이로 읽히게 한다.

## 제작 규칙

- 배포본: `228×120px` 투명 PNG.
- 표시 슬롯: `56×40px`.
- 구도: 90도 측면, 차량 앞쪽은 왼쪽.
- 보디: 윙·탑·덤프가 아닌 평적재함 카고.
- 금지: 로고, 문구, 번호판, 워터마크, 과한 원근.

## 산출물

| 하위 유형 | 파일 |
|---|---|
| 경형 | `public/assets/truck/pilot/v09/truck_cargo_light_side_v09.png` |
| 소형 | `public/assets/truck/pilot/v09/truck_cargo_small_side_v09.png` |
| 준중형 | `public/assets/truck/pilot/v09/truck_cargo_semi_medium_side_v09.png` |
| 중형 | `public/assets/truck/pilot/v09/truck_cargo_medium_side_v09.png` |
| 준대형 | `public/assets/truck/pilot/v09/truck_cargo_quasi_large_side_v09.png` |
| 대형 | `public/assets/truck/pilot/v09/truck_cargo_large_side_v09.png` |

## 검수 메모

- 마스터 파일은 `public/assets/truck/pilot/v09/masters/`에 보존했다.
- 접촉시트: `docs/truck/qa/cargo_subtype_side_v09_contact.png`.
- 현재 라벨 6개를 직접 매핑해 `준대형`이 기존 중형 이미지로 우회되지 않게 했다.
- v11에서 사진풍을 폐기하고 상단 퀵필터 레일용 평면 실루엣으로 재제작했다.
