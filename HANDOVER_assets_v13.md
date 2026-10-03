# HANDOVER_assets_v13

## 1) 담당 범위

- 건설기계 제조사 로고 원본 출처 통일, 초톳 슬롯 정규화, PC·모바일 퀵필터 반영 및 배포

## 2) 현재 진행 상태

### 완료

- 제조사 10개 원본 출처 재선정
- 투명 120×120 슬롯 v06 정규화
- 건설기계 퀵필터 매니페스트 v06 연결
- v05·v06 시각 비교표 생성

### 진행 중

- GitHub Pages 배포

### 미착수

- 없음

## 3) 결정된 사항과 그 이유

- 한 사이트 기준을 유지하기 위해 CompaniesLogo를 기본 출처로 사용한다.
- CompaniesLogo에 올바른 브랜드 표식이 없거나 주식 종목용 단일 문자 심벌만 있는 디벨론·코벨코·밥캣·JCB는 공식 제조사 원본으로 보완한다.
- 코마츠·히타치·구보타는 정식 워드마크를 사용해 다른 회사로 오인될 수 있는 종목 심벌을 배제한다.
- 초톳과 동일하게 원본 윤곽 비율별 3단계 점유율을 적용하며, 로고를 늘이거나 찌그러뜨리지 않는다.

## 4) 미결 사항·막힌 점

- 없음

## 5) 산출물 목록

- `public/assets/heavy/logos/*_v06.png`
- `src/prototype/heavy/manifest.ts`
- `scripts/download-heavy-logos-v06.mjs`
- `scripts/normalize-heavy-logos-v06.py`
- `scripts/audit-heavy-logo-v06.mjs`
- `reports/heavy-logo-v06/`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 별도 대기 요청 없음

## 7) 검수 상태

- PC·모바일 슬롯 자동 측정 통과
- 최종 상태는 배포 검증 후 `CHANGELOG_assets.md`에 기록

## 8) 다음에 할 일

1. PC·모바일 슬롯 수치와 이미지 로딩을 자동 측정한다.
2. 전체 퀵필터 및 저장소 검증을 실행한다.
3. main에 배포하고 실배포 화면을 다시 확인한다.
