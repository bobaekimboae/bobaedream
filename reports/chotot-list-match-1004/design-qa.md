# Design QA

## reference basis

- 기준 워크북 3개 시트의 치수와 좌표를 우선 적용했다.
- 초톳 라이브 트럭 목록과 변경 후 화면을 같은 384×832 CSS viewport에서 대조했다.
- 테스트 스타일은 `.is-chotot-list-match` 아래에만 두었다.

## visual checks

- 검색바 x48, 284×40, r20 확인.
- 퀵필터 첫 슬롯 x72, 이미지 64×40, 이름 12/18, 정렬행까지 38 확인.
- 목록 카드 174px, 썸네일 120×120, 글 열 x148 확인.
- 카드 내부 y 좌표: 사진13, 제목17, 메타41, 가격61, 배지78, 위치113, 판매자138 확인.
- 앨범형 x16/x200, 사진 168×168, 열 간격16 확인.
- 보기 전환 클릭 후 `is-gallery`와 `view=gallery`가 함께 적용되는지 확인.
- `ref` 없는 목록·앨범에 테스트 클래스와 임시 썸네일이 적용되지 않는지 확인.
- 카드 채팅만 숨기고 하단 GNB는 기존 DOM·CSS를 유지했는지 확인.

## runtime checks

- `npm run check:runtime`: passed
- `npm run verify:qf`: passed
- 브라우저 콘솔 warning/error: 0
- 384×832 / DPR 2.8125 PNG: 1080×2340 확인

## known exception

- 실제 트럭 매물 원본을 저장소에 복제하지 않고, 저장소 내부의 실사형 카테고리 이미지 4장을 `ref=chotot` 비교용 임시 썸네일로 사용했다.

final result: passed

