# 건설기계 인수인계 v03

## 1) 담당 범위

건설기계 시안의 필터, 가변필터, 퀵필터, 목록 보기, 상세 정보, 매물 등록, 가상 매물 30대 연동.

## 2) 현재 진행 상태

- 완료: 빅레몬 형식·세부형식·제조사·모델 4단계 구조
- 완료: 최신 v04 시나리오 30대와 이미지 30장 1:1 연동
- 완료: 공개 시안 반영 및 자동 검증·빌드·Pages 배포
- 진행 중: 없음
- 미착수: 건설기계 전용 상세 화면의 매물별 동적 데이터 표시

## 3) 결정된 사항과 그 이유

- 구현에는 최신 `heavy_listing_scenario_v04`만 사용한다. v02는 참고 기록이다.
- `scenario_id`와 `image_file`을 연결 키로 사용해 누락과 중복을 막는다.
- 제조사 `미확인` 11건은 추정하지 않고 그대로 유지한다.
- 형식·세부형식 선택값은 v04의 실제 값으로 연결하고, 빅레몬 기준표는 별도 코드 데이터로 보존한다.

## 4) 미결 사항·막힌 점

- `heavy_listing_018_v01.png`는 파일명 확장자가 PNG이나 원본 MIME은 JPEG이다. 원본명을 유지했으며 실제 브라우저 표시 확인이 필요하다.
- 모바일·PC에서 직접 버튼을 누르는 상호작용 검수는 미확인이다.

## 5) 산출물 목록

- `src/prototype/heavy/scenario-v04.ts` — v04 데이터
- `src/prototype/heavy/data.ts` — 건설기계 필터·매물 연결
- `src/prototype/data/index.tsx` — 목록 카드·가상 판매자 연결
- `public/assets/heavy/listings/` — 이미지 30장
- `docs/heavy/heavy_listing_scenario_v04.csv`
- `docs/heavy/heavy_listing_scenario_v04.md`
- `docs/heavy/heavy_listing_manifest_v01.csv`
- `docs/heavy/heavy_listing_integration_v01.md`
- Google Sheets `heavy_listing_integration_v01`, `HANDOVER_heavy_v03`, `CHANGELOG_heavy`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

코덱스-자료에서 이미지 30장, 매니페스트 v01, 시나리오 v04 CSV·MD를 받았다. 추가 자료 대기 없음.

## 7) 검수 상태

- 데이터 정합성: 검수완료
- 빠른 필터 자동 검증·빌드·Pages 배포: 검수완료
- 브라우저 직접 클릭: 미확인

## 8) 다음에 할 일

1. 모바일·PC 목록의 이미지 표시와 4단계 필터 직접 클릭 검수
2. 018번 MIME 불일치 이미지 표시 확인
3. 필요 시 건설기계 매물별 상세 화면 동적 연결
