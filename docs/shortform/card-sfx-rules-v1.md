# 차량 정보 카드 효과음 규칙 v1 (2026-11-24 확정안)

단일 기준: `scripts/shortform/photo_listing/option_visual_rules.json` → `layout.card_sfx`. 렌더러(`common.py`)는 규칙만 읽는다. 차량 cfg `CARD_SFX`가 있으면 그것이 우선.

| 카드 줄 | 고르는 낱말(컷 자막) | 소리 파일 | 들리는 것 | 출처 · 라이선스 | earshot 판정 |
|---|---|---|---|---|---|
| 머리 「차량 정보부터 보겠습니다」 | 첫 카드 컷 | card_engine_start.wav | 시동 부릉 | Freesound "Car Engine Starting" · Grasopt · CC0 | strong 3.5 |
| 연식·등록 | 등록 · 연식 · 년식 · 년 | card_page_flip.wav | 달력 넘김 | Freesound "paper flip 2" · gynation · CC0 | strong 3.8 |
| 주행거리 | 주행 · km | card_odometer.wav | 계기판 숫자 촤라락 | Freesound "Ratchet Wind Down" · adh.dreaming · CC0 | strong 4.6 |
| 연료 | 가솔린 · 휘발유 · 디젤 · 경유 · LPG · 하이브리드 · 연료 | card_fuel.wav | 주유기 딸깍 + 주유 | 일레븐랩스 효과음 생성(상업 이용, 영상에 섞어서만) | strong 4.3 |
| 변속기 | 변속기 · 오토 · 수동 · 자동 | card_gear_shift.wav | 기어 철컥 | Freesound "Column Gear Select Up" · E-Audio · CC0 | strong 4.9 |
| 배기량 | 배기량 · cc | card_engine_rev.wav | 엔진 부웅 | Freesound "Big Block V8 Rev 2" · Henaway · CC0 | strong 3.9 |
| 색상 | 외장 · 색 · 컬러 · 시트 | card_spray.wav | 스프레이 칙 | Freesound "Spray" · Soundkrampf · CC0 | strong 4.9 |

- 시점: 칸이 켜지는 순간 0.04초 전(머리는 컷 시작 0.02초 전). 크기 0.45(팝 0.42와 비슷, 말소리보다 작게).
- 길이: 0.6~1.4초로 자르고 끝 0.15초 페이드, -16 LUFS로 맞춘 뒤 영상 전체 -14 LUFS 마무리.
- 처음 이어진 차량 정보 카드 묶음에만 붙는다. 엔딩 카드(딜러 칸)는 공개 팝.
- 한 영상에 같은 소리 반복 없음(줄마다 다른 소리) → 같은 소리 간격 규칙(0.6초)에 걸리지 않음.
- 전기차: 연료 줄은 충전 소리(아직 없음)로 바꿔야 함 — 전기차 카드 만들 때 추가.
- 찾기: bobae-music MCP `search_sfx`(Openverse, CC0만) · 판정: earshot MCP(MIT, CLAP). strong(z≥3)만 확정.
