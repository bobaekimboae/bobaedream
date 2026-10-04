# HANDOVER_heavy_v08

## 1) 담당 범위

건설기계 1뎁스 유형 이미지 27종을 초톳 슬롯 규칙과 법정 명칭에 맞춰 제작·검수·제품 연결.

## 2) 현재 진행 상태

- 완료: 정측면을 분류 이미지의 공통 구도로 확정.
- 완료: 초톳을 슬롯·가로 레일·라벨·모바일/PC 운용의 최상위 UX 기준으로 확정.
- 완료: 법정 27종 이미지 마스터와 512×320 웹 파생본 제작.
- 완료: 64×40 연락판과 자동 QA 27/27 PASS.
- 완료: 건설기계 퀵필터 임시 8종을 법정 27종으로 교체.
- 완료: TypeScript·Vite 빌드와 모바일 접근성 트리 확인.
- 미착수: 공개 배포.

## 3) 결정된 사항과 그 이유

- 유형 명칭과 순서는 `건설기계관리법 시행령 별표 1` 27종을 따른다.
- 정측면은 장비 구조를 가장 안정적으로 보여주며 승용·바이크·트럭으로 확장해도 기준이 흔들리지 않는다.
- 초톳의 64×40 모바일 슬롯과 반복 피치를 우선하고 PC는 동일 자산을 76×40에 표시한다.
- AutoTrader·AutoScout24는 사진 품질 참고이며 슬롯 규격의 원천이 아니다.
- 기존 빅레몬 52종은 하위 검색 분류로 유지한다.

## 4) 미결 사항·막힌 점

- 가상 매물 30대에 없는 법정 유형은 결과 0대다. 실제 매물 데이터 매핑은 미확인.
- 공개 배포는 사용자 지시 대기.

## 5) 산출물 목록

- `docs/image/quickfilter_image_production_manual_v01.md`
- `docs/heavy/heavy_type_production_v03.md`
- `docs/heavy/heavy_type_production_manifest_v03.csv`
- `public/assets/heavy/types/v03/master/`
- `public/assets/heavy/types/v03/web/`
- `reports/heavy-type-production-v03.json`
- `reports/heavy-type-production-v03-contact.png`
- `reports/heavy-type-production-v03-mobile.png`
- `reports/heavy-type-production-v03-pc.png`
- `src/prototype/heavy/index.tsx`
- `src/prototype/heavy/data.ts`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 트럭 v03 정측면 14종은 같은 생산 매뉴얼로 먼저 정규화 완료.
- 코덱스-자료 상호 검수는 대기 중.

## 7) 검수 상태

- 이미지 자동 검수: 검수완료(27/27 PASS)
- 64×40 수동 연락판: 검수완료
- 빌드: 검수완료
- 실제 매물 데이터: 미검수
- 공개 배포: 미검수

## 8) 다음에 할 일

1. 사용자 화면 검토 반영.
2. 실제 매물 데이터의 27종→하위 형식 매핑 확정.
3. 코덱스-자료 상호 검수.
4. 요청 시 공개 배포.
