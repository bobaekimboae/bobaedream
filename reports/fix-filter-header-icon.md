# 필터 헤더 아이콘 교체

## 1. 한 줄 요약

노션 `0_0_필터 FilterHeader`의 첨부 SVG 원본으로 과쯔 모바일·PC 필터 버튼 아이콘을 교체했습니다.

## 2. 기본 정보

| 항목 | 내용 |
|---|---|
| 과제 ID | 미지정(사용자 직접 지시) |
| 브랜치 | `fix/filter-header-icon` |
| 커밋 | 현재 커밋 |
| PR | 배포 단계에서 기록 |
| 상태 | 로컬 적용·검수 완료, 배포 대기 |

## 3. 한 일

- 노션 페이지의 첨부 파일 `FilterHeader.svg`를 직접 내려받아 path를 확인했습니다.
- `public/assets/bbm/chip-filter.svg`를 24×24 원본으로 교체했습니다.
- 모바일과 PC의 기존 버튼 크기·간격·동작은 건드리지 않았습니다.
- 규칙을 `docs/quick-filter-spec.md`에 기록했습니다.

## 4. 원본과 비교

| 항목 | 결과 |
|---|---|
| viewBox | 원본과 동일한 24×24 |
| path | 원본과 동일 |
| 조절점 위치 | 위·아래 x=8, 가운데 x=16 |
| PC 표시 | 20×20, 32px 버튼 안 세로 중앙 |
| 모바일 표시 | 같은 SVG 사용, 필터 dialog 정상 열림 |

## 5. 검증

- `npm run verify:qf`: 통과
- `npm run verify`: 관리자 정적 페이지 응답 검사 1건만 실패(16/17 통과). 변경 전 작업본에서도 같은 Windows 경로 문제로 재현되어 이번 아이콘 변경과 무관합니다.
- `npm run build`: 통과
- `npm run test:sites`: 4/4 통과
- Pages 산출물: `dist/client`, Storybook 없음, 번들 `index-1B3rEnnS.js`
- 모바일·PC 콘솔 오류·경고: 로컬 검수 0
- 모바일 필터 버튼 클릭 → dialog 열림: 통과

## 6. 원본과 다르게 남긴 것

- 없음. 화면 표시 크기는 기존 버튼 규격 20×20을 유지했습니다.

## 7. 못 한 것·다음에 할 것

- 공개 배포 후 새 `v` 값과 GitHub Pages 실행 결과를 확인합니다.
- 기존 관리자 테스트의 Windows 정적 파일 경로 문제는 별도 작업으로 남깁니다.

## 8. 확인 주소

- 모바일: `?qf=guazi`
- PC: `?qf=guazi&pc=1`
