# 보배드림 퀵필터 인수인계

최종 정리: 2026-10-01 (KST)

## 1. 작업 기준

- 기본 작업 화면은 `?qf=guazi` 개발 시안형이다.
- PC는 기본 `&pc=1` 개발 시안형만 수정한다.
- ChoTot 비교 화면(`&pcl=chotot`)과 Dongchedi 모드는 사용자가 별도로 요청하지 않는 한 수정하지 않는다.
- 공통 수치와 동작 규칙의 단일 기준은 `docs/quick-filter-spec.md`다.
- 사용자에게 확인되지 않은 과제 ID는 새로 만들지 않는다.

## 2. 이번 최종 반영 범위

### 판매자 유형 바텀시트

- 상단 제목은 `판매자 유형` 한 줄만 사용한다. 부제는 없다.
- 헤더 높이 64, 좌측 여백 24, 제목 20/28·750, 하단 구분선 1px `#E8E8E8`.
- 닫기 버튼은 44×44 터치 영역 안에 24×24 X를 사용한다. 위치는 위 10, 오른쪽 20이다.
- 본문은 헤더 아래 16부터 시작하고 좌우 여백은 20이다.
- 설명이 없는 행은 높이 54, 설명이 있는 행은 높이 68이다.
- 체크박스는 20×20, 아이콘 칸은 32×32, 열 간격은 12다.
- 선택 상태는 노란 배경을 사용하지 않는다. 검은 채움과 흰 체크마크를 사용한다.
- 하단 액션 영역은 높이 80, 좌우 여백 20, 버튼 간격 10이다. 초기화는 92×52, 선택하기는 남은 폭×52다.
- 임시 선택은 `선택하기`에서만 적용한다. 닫기·배경·Escape·브라우저 뒤로가기는 임시 선택을 버린다.
- React Strict Mode에서 effect 재실행 때문에 시트가 즉시 닫히지 않도록 history marker 정리를 지연하고 재설정 시 취소한다.

### 판매자 유형 아이콘

아이콘은 아래 파일을 단일 원본으로 사용한다.

| 항목 | 파일 |
|---|---|
| 개인 | `public/assets/icons/seller-type/private.svg` |
| 딜러 | `public/assets/icons/seller-type/dealer.svg` |
| 실차주 | `public/assets/icons/seller-type/direct-owner.svg` |
| 브랜드 인증 | `public/assets/icons/seller-type/brand-certified.svg` |
| 리스·렌트 제휴 | `public/assets/icons/seller-type/lease-rent.svg` |

- Notion의 `symbol/use` 구조를 외부 `<img>`에서도 안정적으로 보이도록 직접 `path` 기반 SVG로 정규화했다.
- 32×32 컨테이너에서 비율을 유지한다. 강제 폭·높이 변형으로 찌그러뜨리지 않는다.
- 임시로 검토했던 노란 선택 배경과 생성형 리무진 아이콘은 채택하지 않는다.

### 상단 필터칩

- 현재 시안 작업 필터인 `판매자`는 PC와 모바일 모두 고정 `필터` 버튼 바로 오른쪽에 둔다.
- 판매자 조건이 없을 때는 일반 `판매자` 칩을 표시한다.
- 판매자 조건이 적용되면 같은 자리를 진한 적용 칩과 X로 교체한다.
- 판매자 적용 칩을 일반 적용 칩 묶음으로 이동시키지 않는다.
- 나머지 칩의 상대 순서와 동작은 기존 Guazi 규칙을 유지한다.

## 3. 바디타입 후속 기준

- 바디타입의 최종 시각 방향은 당분간 **AutoScout24 스타일**을 기준으로 한다.
- 이전에 검토한 스웨덴 Car.info·FINN 스타일과 생성형 리무진 아이콘은 기준안으로 사용하지 않는다.
- 리무진은 세단 다음 순서로 배치한다.
- 바디타입 시안의 4열 구성, 아이콘 크기, 텍스트 크기, 구분선 간격은 AutoScout24 원본을 다시 실측한 뒤 한 번에 반영한다.
- 이번 판매자 유형 변경과 바디타입 후속 변경을 한 컴포넌트 수정으로 섞지 않는다.

## 4. 핵심 파일

| 목적 | 파일 |
|---|---|
| 판매자 행·시트 | `src/prototype/filters/bbm-filter-panels.tsx` |
| 공통 시트·history 처리 | `src/prototype/filters/bbm-filter-parts.tsx` |
| 판매자 시트 수치·상태 스타일 | `src/prototype/filters/bbm-filter-parts.css` |
| 상단 칩 생성·정렬 | `src/prototype/listing/index.tsx` |
| 필터 옵션·사이드바 순서 | `src/prototype/filters/bbm-filter-options.ts` |
| 공통 퀵필터 규칙 | `docs/quick-filter-spec.md` |

## 5. 완료 확인 항목

- 판매자 유형 시트가 열리자마자 닫히지 않는다.
- X, 배경, Escape, 브라우저 뒤로가기로 닫힌다.
- 닫을 때 임시 선택이 적용되지 않는다.
- 체크박스 20×20과 텍스트·아이콘의 수직 중심이 맞는다.
- 다섯 아이콘이 모두 보이고 찌그러지지 않는다.
- 판매자 칩과 판매자 적용 칩이 항상 `필터` 바로 오른쪽에 남는다.
- 적용 칩의 X가 판매자 조건만 해제한다.
- ChoTot·Dongchedi 비교 모드에 시각 회귀가 없다.

## 6. 검증과 배포

프로토타입 변경 후:

```bash
npm run check:runtime
npm run verify:qf
```

`main` 배포 전:

```bash
npm run verify
```

`main` 반영 후 `.github/workflows/deploy-pages.yml`이 기존 GitHub Pages를 갱신한다. 인수인계 시에는 커밋 SHA, Actions 실행 결과, 배포된 `v` 값, 번들 파일명을 함께 기록한다.

