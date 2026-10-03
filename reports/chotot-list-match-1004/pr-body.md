## 범위

- `ref=chotot`일 때만 트럭 · 특장 모바일 목록/앨범에 초톳 비교 규격 적용
- 기존 화면과 하단 GNB 유지
- 노션 원본 SVG 16개를 `assets/chotot-test/`에 추가
- 머지·배포하지 않음

## 항목별 적용 결과

| 항목 | 결과 | 근거 |
|---|---|---|
| 상단 검색·지역·칩 | 🟢 적용 | 검색 x48/284×40, 칩 h32/r16 |
| 퀵필터 | 🟢 적용 | 제목72, 첫 슬롯 x72, 이미지64×40, 이름→정렬 38 |
| 정렬행 | 🟢 적용 | 14/600, 구분선 1×16, 보기 아이콘24 |
| 목록 카드 | 🟢 적용 | h174, 사진120, 글 열 x148, 기준 y 좌표 ±1 |
| 앨범 카드 | 🟢 적용 | 2열 168×168, x16/x200, 간격16 |
| 보기 전환 | 🟢 수정 | 클릭 즉시 목록↔앨범 전환, URL 상태 반영 |
| ref 없는 화면 | 🟢 유지 | 테스트 클래스·임시 이미지 미적용 |
| 하단 GNB | 🟢 유지 | 코드·스타일 미변경 |
| 실제 트럭 매물 원본 | 🔴 임시 | 저장소 내부 실사형 카테고리 이미지 4장 사용 |

상세 35개 항목은 [`comparison.md`](reports/chotot-list-match-1004/comparison.md)에 기록했습니다.

## 완료 증거

### 목록형: ref 없음 / ref 있음

![ref 없는 기존 목록](https://raw.githubusercontent.com/bobaekimboae/bobaedream/test/chotot-list-match/reports/chotot-list-match-1004/01-no-ref-list.png)

![ref 적용 목록](https://raw.githubusercontent.com/bobaekimboae/bobaedream/test/chotot-list-match/reports/chotot-list-match-1004/03-ref-list.png)

### 앨범형: ref 없음 / ref 있음

![ref 없는 기존 앨범](https://raw.githubusercontent.com/bobaekimboae/bobaedream/test/chotot-list-match/reports/chotot-list-match-1004/02-no-ref-gallery.png)

![ref 적용 앨범](https://raw.githubusercontent.com/bobaekimboae/bobaedream/test/chotot-list-match/reports/chotot-list-match-1004/04-ref-gallery.png)

### 초톳과 나란히 비교

![초톳과 보배 비교](https://raw.githubusercontent.com/bobaekimboae/bobaedream/test/chotot-list-match/reports/chotot-list-match-1004/05-chotot-bb-side-by-side.png)

## 검증

- `npm run check:runtime` 통과
- `npm run verify:qf` 통과
- 384×832, DPR 2.8125, 결과 PNG 1080×2340
- 브라우저 콘솔 warning/error 0
- [`design-qa.md`](reports/chotot-list-match-1004/design-qa.md): `final result: passed`
- [한국어 노션 보고](https://app.notion.com/p/3eeee9c4b6068136a904cba9172e4529)

