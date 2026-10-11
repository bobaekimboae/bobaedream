# 딜러 화면 자동 게이트 v2 (시안 작업 마스터 소유, 2026-10-11)
- 실행: node qa/dealer-gate/dealer_gate.mjs "<딜러 화면 URL(tab 없이)>" all
- 결과: gate_result.tsv, 탭별 캡처 gate_<tab>_top.png / gate_<tab>_scrolled.png
- spec_*.json 기준값은 시안 작업 마스터만 수정. 클래스 이름이 바뀌면 selectors_dp.json 만 수정.
- 새 요소는 data-qa 속성으로 연결. 이름 목록은 selectors_dp.json 의 [data-qa=...] 항목 전부.
- 탭 5개: home, posts(활동), ads(판매 차량), rating(평가), info(정보)
