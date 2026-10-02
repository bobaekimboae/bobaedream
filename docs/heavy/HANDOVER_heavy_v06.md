# 건설기계 인수인계 v06

## 1) 담당 범위

건설기계 퀵필터 3단계(제조사 로고 → 모델 이미지 → 세부모델·세부 형식 이미지)와 v04 가상 매물 30대 코드 연동.

## 2) 현재 진행 상태

- 완료: 지정 제조사 10개 로고 중복·파일 형식·시각 내용 확인
- 완료: `equipment_type_code`, `detail_type_code`, `manufacturer_code`, `model_code`, `submodel_code` 연결
- 완료: 제조사 변경 시 모델·세부모델 초기화, 모델 변경 시 세부모델 초기화
- 완료: 장비 유형과 맞지 않는 하위 선택 정규화
- 완료: 선택 해제·전체 초기화·0건 상태
- 완료: 모바일 한 줄 가로 스크롤과 `object-fit: contain`
- 진행 중: GitHub Pages 배포 후 직접 클릭 검수
- 미착수: v04에 없는 9개 제조사의 모델·세부모델 자료 연결

## 3) 결정된 사항과 그 이유

v04 30대에서 지정 제조사 중 실제 매물이 있는 제조사는 디벨론뿐이다. 확인되지 않은 모델을 추측하지 않고 디벨론 2대만 모델·세부모델로 연결했다. 나머지 9개는 로고 선택 후 0건 상태를 표시한다. DX55W의 세부 형식은 원천 자료만으로 켄키 구간을 확정할 수 없어 `detail_type_code=unverified`, 화면 표기 `미확인`으로 유지했다.

## 4) 미결 사항·막힌 점

- 코덱스-자료의 파일명이 정확히 `slot_manifest_v01.csv`, `quickfilter_manifest_v01.csv`인 원본은 Drive 검색에서 확인되지 않았다.
- 전달 로고 폴더에 별도 status 열이 없어 코덱스-건설이 파일/MIME/시각 중복을 검수하고 구현 매니페스트에 검수완료로 기록했다.
- 브라우저 직접 클릭 검수는 배포 후 확인 필요.

## 5) 산출물 목록

- `src/prototype/heavy/manifest.ts` / v02 / GitHub
- `src/prototype/heavy/data.ts` / v02 / GitHub
- `src/prototype/heavy/index.tsx` / v02 / GitHub
- `src/prototype/heavy/heavy.css` / v02 / GitHub
- `public/assets/heavy/logos/heavy_*_logo_v01.*` 10개 / v01 / GitHub
- `docs/heavy/heavy_quickfilter_manifest_v02.csv` / v02 / GitHub
- `docs/heavy/heavy_slot_manifest_v02.csv` / v02 / GitHub
- `docs/heavy/HANDOVER_heavy_v06.md` / v06 / GitHub

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 수신: 제조사 로고 Drive 폴더 10개
- 수신: `heavy_listing_scenario_v04.csv`와 매물 이미지 30개
- 확인: 판매TOP10 로고·모델이미지 목록 시트
- 대기: 나머지 9개 제조사의 검수완료 모델·세부모델 이미지 및 코드 매니페스트

## 7) 검수 상태

- 로고 10개 파일명 중복 없음: 검수완료
- 로고 10개 바이트 중복 없음: 검수완료
- v04 매물 수: 전체 30대, 디벨론 2대, 나머지 지정 제조사 0대
- 계층 초기화 로직: 코드 검수완료
- 이미지 fallback 순서와 `fallback_level`: 코드 검수완료
- PC·모바일 직접 화면 확인: 미확인

## 8) 다음에 할 일

1. 자동 빌드·배포 결과 확인
2. 공개 모바일·PC에서 제조사→모델→세부모델 클릭 검수
3. 코덱스-자료에서 나머지 9개 제조사 검수완료 모델 이미지를 받으면 v03 매니페스트로 확장
