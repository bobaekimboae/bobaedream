# 트레일러 측면 이미지 시안 v01

## 목적

- 트랙터·트레일러 하위 유형을 모바일·PC 바텀시트의 56×40px 이미지 슬롯에서 빠르게 구분한다.
- 트랙터 헤드는 제외하고 트레일러 구조 자체를 크게 노출한다.

## 제작 규칙

- 방향: 킹핀·랜딩기어가 왼쪽, 후축이 오른쪽.
- 각도: 정측면에 가까운 10도 준측면.
- 카메라: 바퀴 중심 높이, 수평 유지.
- 배경: 투명 PNG, 중립 스튜디오 조명, 약한 바닥 그림자.
- 색상: 흰색·연회색 차체와 짙은 하부 섀시. 로고·문자·번호판 없음.
- 마스터: 생성 원본을 보존한다.
- 배포본: 228×120px, 차체 폭 224px, 바닥선 y=111.

## 시안 12종

| 유형 | 마스터 파일 | 배포 파일 | 56×40 인지성 |
|---|---|---|---|
| 컨테이너 섀시 | `truck_trailer_container_chassis_side_master_v03.png` | `truck_trailer_container_chassis_side_v03.png` | 양호 |
| 평판 트레일러 | `truck_trailer_flatbed_side_master_v03.png` | `truck_trailer_flatbed_side_v03.png` | 보완 필요: 데크가 얇음 |
| 저상·로우베드 트레일러 | `truck_trailer_lowbed_side_master_v03.png` | `truck_trailer_lowbed_side_v03.png` | 양호 |
| 덤프 트레일러 | `truck_trailer_dump_side_master_v03.png` | `truck_trailer_dump_side_v03.png` | 양호 |
| 윙·탑 트레일러 | `truck_trailer_wing_side_master_v03.png` | `truck_trailer_wing_side_v03.png` | 양호 |
| 유류·액상 탱크 트레일러 | `truck_trailer_tanker_side_master_v03.png` | `truck_trailer_tanker_side_v03.png` | 양호 |
| 차량·장비운반 트레일러 | `truck_trailer_equipment_side_master_v03.png` | `truck_trailer_equipment_side_v03.png` | 양호 |
| 코일·철판운송 트레일러 | `truck_trailer_coil_side_master_v03.png` | `truck_trailer_coil_side_v03.png` | 양호 |
| 냉장·냉동 트레일러 | `truck_trailer_refrigerated_side_master_v03.png` | `truck_trailer_refrigerated_side_v03.png` | 양호 |
| LPG·LNG 탱크 트레일러 | `truck_trailer_gas_tanker_side_master_v03.png` | `truck_trailer_gas_tanker_side_v03.png` | 양호 |
| 벌크시멘트 트레일러 | `truck_trailer_bulk_cement_side_master_v03.png` | `truck_trailer_bulk_cement_side_v03.png` | 양호 |
| 호퍼·곡물 트레일러 | `truck_trailer_grain_hopper_side_master_v03.png` | `truck_trailer_grain_hopper_side_v03.png` | 양호 |

## 시안 적용 범위

- 실제 트랙터·트레일러 하위 유형 바텀시트에 위 12종을 연결했다.
- 트랙터·헤드와 기타 트레일러 이미지는 기존 자산을 유지한다.
- 매물 0대 항목은 비활성 투명도가 적용되므로 이미지 자체보다 흐리게 보인다.

## 다음 보완 우선순위

1. 평판 트레일러의 데크 명암과 하부 프레임 대비 강화.
2. 매물 0대 비활성 상태에서도 유형을 학습할 수 있도록 이미지 불투명도 재검토.
3. 트랙터·헤드 이미지도 같은 좌향 준측면 규칙으로 재제작.

