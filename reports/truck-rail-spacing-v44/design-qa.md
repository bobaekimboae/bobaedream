# 트럭 퀵필터 좌측 제목·미디어 정렬 v44 — Design QA

- source visual truth: Google Drive `Screenshot_20261004_042745_Ch Tt.png` (`https://drive.google.com/file/d/1eYjWEIPABXSWa39n2KJQap36dh2ociIO/view`), `Screenshot_20261004_042753_Ch Tt.png` (`https://drive.google.com/file/d/1gxWAr5UICD_wyBeXXQV0pOTRpJSHdEij/view`)
- implementation: `http://127.0.0.1:4173/?qf=guazi&category=트럭+·+특장&v=spacing-v44`
- implementation screenshot: `reports/truck-rail-spacing-v44/implementation.png`
- source pixels: 1080×2340, CSS 384×832, density 2.8125
- implementation inspection: Codex in-app browser, responsive mobile component, source CSS values and rendered computed styles cross-checked
- state: 트럭 유형 → 카고(화물)트럭 → 경형 → 현대 순으로 유형·세부유형·제조사·모델 레일 확인

## Full-view comparison evidence

- 초톳 원본의 좌측 제목은 CSS x=16px에서 시작한다.
- 원본 제조사 로고의 첫 중심은 x=113.6px, 이후 중심 피치는 84.3px이다.
- 보배 변경 후 트럭 유형·세부유형·제조사·모델의 첫 카드 중심은 모두 x=114px이다.
- 트럭 이미지는 현재 승인된 88px 카드와 76×48px 미디어를 유지하므로 제조사 로고보다 넓은 96px 피치를 사용한다. 서로 겹치거나 잘리지 않는다.

## Focused region comparison evidence

| 상태 | 제목 칸 | 제목 뒤 간격 | 카드 폭 | 미디어 폭 | 첫 중심 | 피치 |
|---|---:|---:|---:|---:|---:|---:|
| 트럭 유형 | 68 | 2 | 88 | 76 | 114 | 96 |
| 세부유형 | 68 | 2 | 88 | 76 | 114 | 96 |
| 제조사 | 68 | 8 | 76 | 40 | 114 | 84 |
| 모델 | 68 | 10 | 72 | 64 | 114 | 80 |

## Findings

- P0/P1/P2 없음.
- 폰트·타이포그래피: 제목 14/20 400 `#595959`, 왼쪽 16px 유지.
- 간격·레이아웃: 모든 이미지·로고 단계의 첫 중심 x=114px 일치. 카드 폭별 간격을 분리해 이미지 볼륨을 보존.
- 색상·토큰: 기존 보배 색상과 초톳형 제목 색상 변경 없음.
- 이미지 품질: 승인된 트럭 PNG와 제조사 로고 원본을 변경하지 않음. 자르기·확대·재생성 없음.
- 문구: `트럭 유형`, `세부유형`, `제조사`, `모델` 유지.

## Comparison history

1. 초기 가정: 412px 환산으로 중심 122px·피치 90px를 계산.
2. 원본 재검증: 삼성 캡처와 저장소 지침이 384px·2.8125배율임을 확인해 잘못된 환산값을 폐기.
3. 구현 교정: 제목 칸 68px, 카드 폭별 2/8/10px 간격으로 첫 중심 x=114px 적용.
4. 메인 코드 재검증: 트럭 카드가 이미 88px·미디어 76×48px로 확대된 상태임을 확인하고 크기를 줄이지 않은 채 중심만 정렬.
5. 렌더링 확인: 유형·세부유형·제조사·모델 모두 중심 114px, 콘솔 오류 0건.

## Interaction checks

- 트럭 유형 선택 → 세부유형 표시 정상.
- 세부유형 선택 → 제조사 표시 정상.
- 제조사 선택 → 모델 표시 정상.
- 수평 레일과 목록 데이터 동작 유지.

final result: passed
