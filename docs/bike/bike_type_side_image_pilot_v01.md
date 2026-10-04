# 바이크 유형 완전 정측면 이미지 시안 v01

## 목적

- 모바일·PC 퀵필터의 56×40px 슬롯에서 바이크 유형을 실루엣만으로 구분한다.
- 실사 사진의 배경·방향·크기 편차를 제거하고 동일한 스튜디오 품질을 유지한다.

## 제작 규칙

- 방향: 앞바퀴가 왼쪽, 뒷바퀴가 오른쪽.
- 각도: 90도 완전 정측면(orthographic left side elevation).
- 카메라: 바퀴 중심 높이, 차량 중심면에 수직, 수평 유지.
- 통과 조건: 두 바퀴 원형, 앞·뒤 면과 과도한 상판 노출 없음, 두 타이어 접지선 일치, 전체 차체 무잘림.
- 배경: 투명 PNG, 중립 스튜디오 조명, 약한 접지 그림자.
- 금지: 라이더, 제조사 로고, 문자, 번호판, 워터마크, 바퀴 회전, 3/4 원근.
- 색상은 유형 인지의 필수 조건으로 쓰지 않고 차체 실루엣을 우선한다.

## 슬롯 정규화

- 마스터: 1536×1024px 투명 PNG 원본 보존.
- 중간 정규화: 228×120px, 피사체 최대 높이 100px, 바닥선 y=111.
- 바이크 배포 캔버스: 180×120px.
- 표시 슬롯: 56×40px, `contain`, `center bottom`.
- 예상 실제 실루엣: 폭 47~56px, 높이 약 31px.
- 슬롯 표면 권장값: `#F7F7F7`, 경계 `1px #ECECEC`, 반경 6px.

## 1차 시안

| 유형 | 마스터 파일 | 배포 파일 | 판정 |
|---|---|---|---|
| 스쿠터 | `bike_type_scooter_side_master_v01.png` | `bike_type_scooter_side_slot_v01.png` | 통과 |
| 네이키드 | `bike_type_naked_side_master_v01.png` | `bike_type_naked_side_slot_v01.png` | 통과 |
| 슈퍼스포츠 | `bike_type_supersport_side_master_v01.png` | `bike_type_supersport_side_slot_v01.png` | 통과 |
| 어드벤처 | `bike_type_adventure_side_master_v01.png` | `bike_type_adventure_side_slot_v01.png` | 통과, 고형 차체 높이 주의 |

## 현재 적용 상태

- 이미지 4종 제작과 축소본 정규화 완료.
- 실제 바이크 퀵필터 연결과 공개 배포는 미착수.
- 이미지 생성물의 상업 이용 조건은 미확인.
