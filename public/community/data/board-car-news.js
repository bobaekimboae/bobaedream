/* 자동차뉴스 게시판 전용 테이블 (다른 게시판의 시나리오 글과 섞지 않는다).
   실제 데이터는 rows 에만 넣는다. 한 줄 = 게시글 1개.
   구글 시트에서 옮길 때는 같은 열 이름의 CSV(data/boards/car-news.csv)를 만들고
   node scripts/community-board-table.mjs car-news 를 실행하면 이 파일이 다시 만들어진다.

   열(모두 문자열, 빈 값 허용):
   - id          숫자. 자동차뉴스는 9100001부터 차례로 (상세 주소 ?id= 로 씀, 겹치면 안 됨)
   - category    말머리: 신차 · 산업 · 정책 · 모빌리티 · 전기차 · 리콜 · 해외 · 모터스포츠 등
   - title       제목 (말머리 대괄호는 넣지 않는다)
   - summary     목록·피드에 보이는 요약 1~3문장
   - body        상세 본문. 문단은 줄바꿈(\n)으로 구분. 비우면 summary 사용
   - source      출처 언론사·기관명
   - sourceUrl   원문 주소 (상세에 「원문 보기」로 연결)
   - author      글쓴이 닉네임 (비우면 source)
   - publishedAt 게시 시각 ISO 형식 예) 2026-10-16T09:30:00+09:00
   - thumbnail   목록 썸네일 이미지 주소
   - images      상세 사진 주소들, | 로 구분
   - views · comments · likes  숫자
   - tags        태그들, | 로 구분
*/
(function(){
  'use strict';
  var tables=window.BBM_BOARD_TABLES=window.BBM_BOARD_TABLES||{};
  tables["car-news"]={
    board:"car-news",
    displayName:"자동차뉴스",
    idStart:9100001,
    updatedAt:"2026-10-16T11:20:11.183Z",
    rows:[]
  };
})();
