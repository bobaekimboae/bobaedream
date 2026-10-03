# 트럭 유형 루트 이미지 정측면 통일 v05

- 작성일: 2026-10-04
- 담당: 코덱스-특장
- 적용 범위: 모바일 바텀시트와 PC 모달의 `트럭 유형` 루트 카테고리 이미지

## 목적

- 카고·윙바디 기준의 정측면 이미지와 기존 구형 3/4 계열 이미지가 섞여 보이던 문제를 제거한다.
- 작은 `56×40px` 슬롯에서 차체 실루엣과 특장 구조를 우선 인지하게 한다.

## 제작 규칙

- 배포본: `228×120px` 투명 PNG.
- 표시 슬롯: `56×40px`.
- 구도: 90도 정측면, 차량 앞쪽은 왼쪽.
- 기준선: 차체 바닥선 y=111에 맞춤.
- 금지: 로고, 문구, 번호판, 큰 카드 그림자, 과한 원근.
- UI 표면: 기존 `#f7f7f7` 56×40 미디어 표면을 그대로 사용.

## 신규 배포 이미지

| 카테고리 | 파일 |
|---|---|
| 냉장·냉동차 | `public/assets/truck/pilot/v05/truck_type_refrigerated_side_v05.png` |
| 덤프·콘크리트차 | `public/assets/truck/pilot/v05/truck_type_dump_side_v05.png` |
| 환경·폐기물차 | `public/assets/truck/pilot/v05/truck_type_waste_side_v05.png` |
| 견인·운송차 | `public/assets/truck/pilot/v05/truck_type_transport_side_v05.png` |
| 트랙터·트레일러 | `public/assets/truck/pilot/v06/truck_type_tractor_trailer_side_v06.png` |
| 버스 | `public/assets/truck/pilot/v05/truck_type_bus_side_v05.png` |
| 캠핑카·카라반 | `public/assets/truck/pilot/v05/truck_type_camper_side_v05.png` |
| 특수차 | `public/assets/truck/pilot/v05/truck_type_special_side_v05.png` |
| 기타 | `public/assets/truck/pilot/v05/truck_type_other_chassis_side_v05.png` |

## 유지 이미지

- `카고(화물)트럭`: `truck_type_cargo_side_v02.png`
- `윙바디·탑차`: `truck_type_wingbody_side_v02.png`
- `크레인·고소작업차`: `truck_type_cargo_crane_side_v02.png`
- `탱크로리`: `truck_type_tanker_side_v02.png`

## 검수 메모

- v05 이미지는 원본 생성 파일을 `public/assets/truck/pilot/v05/masters/`에 보존했다.
- 접촉시트: `docs/truck/qa/truck_root_side_v05_contact.png`.
- 구형 별칭도 v05 루트 이미지로 연결해 이전 링크와 레거시 값에서 각도 혼합이 재발하지 않게 했다.
- `트랙터·트레일러`는 v05가 헤드 중심으로 보여 v06에서 헤드+세미트레일러 결합 실루엣으로 교체했다.
