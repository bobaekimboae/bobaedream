# 트레일러 완전 정측면 이미지 시안 v02

## 목적

- v03의 10도 준측면에서 보이던 앞·뒤 면과 상판을 제거한다.
- 트랙터·트레일러 하위 유형을 모바일·PC 바텀시트의 작은 슬롯에서 구조 중심으로 비교한다.

## 제작 규칙

- 방향: 킹핀·랜딩기어가 왼쪽, 후축이 오른쪽.
- 각도: 90도 완전 정측면(orthographic side elevation).
- 카메라: 바퀴 중심 높이, 차체 장축에 수직, 수평 유지.
- 탈락 기준: 앞면 노출, 뒷면 노출, 상판 노출, 장축 원근 수렴 중 하나라도 발생.
- 통과 기준: 앞면 0px, 뒷면 0px, 상판 0px, 장축 수평·평행, 바퀴 원형.
- 배경: 투명 PNG, 중립 스튜디오 조명, 약한 접지 그림자.
- 색상: 흰색·연회색 차체와 짙은 하부 섀시. 로고·문자·번호판 없음.
- 마스터: 생성 원본을 v04로 보존한다.
- 배포본: 228×120px, 차체 폭 224px, 바닥선 y=111.

## 시안 12종

| 유형 | 마스터 파일 | 배포 파일 | 각도 검수 |
|---|---|---|---|
| 컨테이너 섀시 | `truck_trailer_container_chassis_side_master_v04.png` | `truck_trailer_container_chassis_side_v04.png` | 통과 |
| 평판 트레일러 | `truck_trailer_flatbed_side_master_v04.png` | `truck_trailer_flatbed_side_v04.png` | 통과 |
| 저상·로우베드 트레일러 | `truck_trailer_lowbed_side_master_v04.png` | `truck_trailer_lowbed_side_v04.png` | 통과 |
| 덤프 트레일러 | `truck_trailer_dump_side_master_v04.png` | `truck_trailer_dump_side_v04.png` | 통과 |
| 윙·탑 트레일러 | `truck_trailer_wing_side_master_v04.png` | `truck_trailer_wing_side_v04.png` | 통과 |
| 유류·액상 탱크 트레일러 | `truck_trailer_tanker_side_master_v04.png` | `truck_trailer_tanker_side_v04.png` | 통과 |
| 차량·장비운반 트레일러 | `truck_trailer_equipment_side_master_v04.png` | `truck_trailer_equipment_side_v04.png` | 통과 |
| 코일·철판운송 트레일러 | `truck_trailer_coil_side_master_v04.png` | `truck_trailer_coil_side_v04.png` | 통과 |
| 냉장·냉동 트레일러 | `truck_trailer_refrigerated_side_master_v04.png` | `truck_trailer_refrigerated_side_v04.png` | 통과 |
| LPG·LNG 탱크 트레일러 | `truck_trailer_gas_tanker_side_master_v04.png` | `truck_trailer_gas_tanker_side_v04.png` | 통과 |
| 벌크시멘트 트레일러 | `truck_trailer_bulk_cement_side_master_v04.png` | `truck_trailer_bulk_cement_side_v04.png` | 통과 |
| 호퍼·곡물 트레일러 | `truck_trailer_grain_hopper_side_master_v04.png` | `truck_trailer_grain_hopper_side_v04.png` | 통과 |

## 적용 범위

- 실제 트랙터·트레일러 하위 유형 바텀시트의 12개 이미지를 v04로 연결한다.
- 트랙터·헤드와 기타 트레일러 이미지는 기존 자산을 유지한다.
- v03 파일과 문서는 비교·복구용으로 보존한다.

