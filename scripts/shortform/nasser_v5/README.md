# 나세르식 3D 칩 숏폼 v5 (AMG GT 63 4도어 쿠페)

결과: `public/shortform-samples/nasser-style-v5/amg_gt63_nasser_v5.mp4` (1080×1920 · 30fps · 53.4초)

| 파일 | 하는 일 |
|---|---|
| `chip3d.py` · `specs2.json` · `runall2.sh` | 블렌더(Cycles)로 3D 칩 13개를 투명 PNG 45장씩 렌더 (`blender -b -P chip3d.py -- '<spec>' <out> anim`) |
| `base.py` | 원본 영상을 컷 목록대로 잘라 9:16 바탕 영상(`base.mp4`)과 `timeline.json` 생성 |
| `comp.py` | 칩 트래킹(LK + 앞뒤 검사, 닮음변환 제한) · 단어 시각 맞춤 등장 · 효과음/배경음 믹스 · 최종 mp4 |
| `captions.py` | 벨기에식 말 자막(흰 굵은 글자 + 그림자, 말하는 낱말만 노랑 `#EEEF05`, 높이 64%) |
| `intro.py` | 첫 인트로: 브랜드 엠블럼 등장 → 모델명 써짐 (엠블럼은 저장소 퀵필터 로고 사용) |
| `chips.json` | 칩별 등장 낱말 · 위치 · 폭 · 트래킹 영역 · 지시선 |

음성: 일레븐랩스 eleven_v3, 낱말 시각은 Scribe 받아쓰기(`words.json`). 원본 영상·음성 파일은 저장소에 넣지 않았다.

## v6 (2026-11-15)
결과: `public/shortform-samples/nasser-style-v6/amg_gt63_nasser_v6.mp4`
- 칩 색: 나세르 고성능차 골드 테마(AMG SL 영상 실측 밝은 `#EABA70` · 가운데 `#D49A55` · 어두운 `#AA8037`), 빛 번짐·지시선·엠블럼 테두리도 골드
- 3D 칩 고해상도: 1200×840 렌더 후 축소, 샘플 16, 필터 1.0 (`runrest.sh`)
- 휠 숫자 배지 「휠 19~21인치」(공식 발표 범위, 실제 장착 인치 미확인)
- 자막 검정 테두리 6px, 컷 경계 무한 반복 오류 수정

## v7 (2026-11-16)
결과: `public/shortform-samples/nasser-style-v7/amg_gt63_nasser_v7.mp4`
- 칩을 나세르처럼: 화면 폭 40~55%로 작게, 화면 위·아래 고정 자리 대신 그 부위 바로 옆에 붙임, 노출 최대 2.4초(`maxdur`, 마지막 이력판 제외)
- 말 자막은 칩과 겹치지 않게 화면 80% 높이로 내림

## 다른 차: 벤틀리 컨티넨탈 GT S v2 (2026-11-16)
결과: `public/shortform-samples/nasser-style-bentley-v2/bentley_gts_nasser_v2.mp4` (24초)
- 차마다 바뀌는 값은 작업 폴더의 `car.json`(인트로 로고·모델명·시간, 자막 구절·낱말 짝) · `chips.json` · 칩 스펙(`bentley/specs_bgt.json`)에만 둔다. `comp.py`·`captions.py`·`intro.py`는 공용(`ANIM` 환경변수로 칩 폴더 지정, 로고는 `mode: rgb`면 원래 무늬를 살려 은색 처리)
- 제원(22인치 휠 · 680PS · 930Nm · 제로백 3.5초)은 벤틀리 미디어 공식 발표 기준

## 벤틀리 v3 (나세르 300편 매뉴얼 반영 대사)
- 대사: 질문형 훅 → 차명 → 옵션을 '그리고 ~도'로 이어 붙이기 → 수치는 '~마력에 ~Nm'처럼 붙여 말하기 → 이득 한 줄 → 보배드림 앱 안내
- 음성: ElevenLabs eleven_v4, Jubal(한국어 남성 영업 톤) 2테이크 중 2번째 사용
- 단어 시간: faster-whisper 받아쓰기 결과를 대본 글자에 맞춤(align.py, 숫자는 한글로 바꿔 맞춤)
- 설정: bentley_v3/car.json · chips.json · planbase.py (화면 구간 10개)
- 결과: public/shortform-samples/nasser-style-bentley-v3/bentley_gts_nasser_v3.mp4
