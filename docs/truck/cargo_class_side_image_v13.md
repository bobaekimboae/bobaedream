# 카고 차급 정측면 이미지 v13

- 작성일: 2026-10-04
- 적용 범위: 카고(화물)트럭 하위 차급 퀵필터

## 결론

경형·소형·준중형·중형·준대형·대형을 같은 촬영·보정 규칙으로 다시 제작했다. 이전 30도 준측면과 평면 실루엣 대신 최신 트럭·특장 v02와 같은 좌향 90도 정측면 실사형을 사용한다.

## 공통 슬롯 규칙

- 배포 캔버스: 228×120px.
- 배경: 투명 알파. 흰 사각 배경을 넣지 않는다.
- 방향: 차량 전면이 왼쪽을 향하는 90도 정측면.
- 기준선: 하단 114px에 차량 그림자와 바퀴를 정렬한다.
- 보디: 적재물이 없는 개방형 평적재함만 사용한다.
- 색상: 흰색 또는 밝은 회색 캡과 적재함.
- 금지: 제조사 로고, 번호판 문자, 워터마크, 윙·탑·덤프 보디, 앞·뒤 면 노출, 원근 왜곡.

## 차급 구분 규칙

| 차급 | 대표 중량 | 시각 구분 |
|---|---|---|
| 경형 | 1톤 미만 | 가장 좁고 낮은 캡, 짧은 적재함, 2축 소형 |
| 소형 | 1톤급 | 경형보다 넓은 캡과 긴 적재함, 2축 |
| 준중형 | 2.5~3.5톤 | 중간 높이 캡, 길어진 축거와 적재함, 2축 |
| 중형 | 4~5톤 | 더 높고 넓은 캡, 긴 적재함, 대형 후륜 2축 |
| 준대형 | 7.5~8.5톤 | 고상 캡, 장축 적재함, 후방 탠덤 3축 |
| 대형 | 11~25톤 | 가장 높은 캡과 긴 적재함, 4축 중량차 |

## 산출물

- 원본: `public/assets/truck/pilot/v13/masters/`.
- 배포 PNG·WebP: `public/assets/truck/pilot/v13/`.
- 매니페스트: `docs/truck/truck_cargo_class_manifest_v13.csv`.
- 접촉시트: `docs/truck/qa/cargo_class_side_v13_contact.png`.
- 연결: `src/prototype/data/truck-format-catalog.ts`.

## 생성 프롬프트 공통부

`Premium official-manufacturer catalog cutout, exact 90-degree left side profile, front faces left, camera perpendicular at wheel-hub height, transparent alpha background, subtle contact shadow, full vehicle, open flat cargo bed, mechanically plausible Korean/Japanese-market cab-over truck, no logos, no text, no watermark.`
