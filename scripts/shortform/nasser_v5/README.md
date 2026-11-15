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
