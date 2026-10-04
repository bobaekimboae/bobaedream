# 보배드림 퀵필터 이미지·로고 슬롯 규칙 v03

- 확정일: 2026-10-04
- 상위 제작 매뉴얼: `docs/image/quickfilter_image_production_manual_v01.md`
- 이전 측정 원본: `docs/quick-filter-image-slot-rules_v02.md`

## 변경 결론

v02의 초톳 슬롯 측정값은 유지한다. 다만 분류형 퀵필터 이미지의 촬영 방향과 생산 방식은 아래 규칙으로 교체한다.

초톳은 슬롯·피치·레일·라벨·반응형 운용의 최상위 UX 기준이다. 모바일 실측값과 보배드림 PC 채택값은 분리하며, 확인하지 않은 초톳 PC 수치를 추정하지 않는다. AutoScout24·AutoTrader·Carsales는 원본 이미지 품질과 제작 규율의 보조 기준으로만 사용한다.

1. 분류형 차량·바이크·트럭·특장·건설기계·캠핑카 이미지는 모두 **앞머리 왼쪽 90° 정측면**을 사용한다.
2. 3/4 이미지는 메인 카테고리·배너 등 홍보형 표면에서만 허용한다.
3. 모바일 퀵필터는 셀 76×102, 이미지 64×40, 간격 8, 첫 시작 16을 유지한다.
4. PC 퀵필터는 셀 84×102, 이미지 76×40, 간격 8, 첫 시작 20을 유지한다.
5. 승인 마스터에서 512×320 RGBA 파생본을 코드로 생성하며 브라우저 슬롯은 `contain`, `center bottom`으로 표시한다.
6. 기본 안전 상자는 448×224, 중심 x=256, 기준선 y=262, 알파 임계값 12다.
7. 항목별 예외는 코드 분기가 아니라 매니페스트의 목표 폭·높이로 관리한다.
8. 승인 마스터는 재생성하거나 덮어쓰지 않고 새 버전만 만든다.

## 용도 분리

| 용도 | 방향 | 배경 | 슬롯 처리 |
|---|---|---|---|
| 퀵필터 분류형 | 좌향 90° 정측면 | 투명 | 512×320 마스터 파생 → 64×40/76×40 contain |
| 메인 홍보형 | 좌향 3/4 허용 | 투명 또는 기획 배경 | 별도 규격 |
| 실제 매물 | 실제 촬영 유지 | 실제 배경 | 목록 템플릿의 cover 규칙 |

## 생산·검수 파일

- 생산 매뉴얼: `docs/image/quickfilter_image_production_manual_v01.md`
- 프롬프트: `docs/image/prompts/quickfilter_side_profile_prompt_v01.txt`
- 매니페스트 템플릿: `docs/image/quickfilter_image_manifest_template_v01.csv`
- 정규화: `scripts/normalize-quickfilter-image.py`
- 자동 검수: `scripts/check-quickfilter-images.py`
- 수동 검수표: `docs/image/quickfilter_image_qa_v01.md`

v02와 충돌하는 경우 v03과 생산 매뉴얼 v01을 우선한다. 로고·아이콘·긴 명칭·실제 매물 사진에 관한 v02 규칙은 그대로 유지한다.

