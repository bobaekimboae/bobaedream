---
name: "as24-style-sfx"
description: "보배드림 숏폼에 AS24(네덜란드·벨기에)식 효과음을 넣거나 효과음 규칙을 점검할 때 사용."
---

# AS24식 효과음 · 편집 형식 고르기

근거: `docs/shortform/as24-sfx-rules-v1.md`(실제 칩·숫자·로고가 뜬 순간 181곳 + 무작위 440곳 스펙트로그램 판정), `docs/shortform/as24-4country-compare-v1.md`(NL·BE·DE·LM 598편 대조). 수치: `scripts/shortform/as24_edit_rules.json`의 `sfx`와 `styles`.

## 1. 형식부터 고른다
| 영상 | --style | 효과음 |
|---|---|---|
| 매물 사진·영상만(사람 없음) | `bobae` (NL형) | 칩·큰 숫자의 약 40%에 딩 |
| 딜러가 직접 말함 | `bobae_talk` (DE형) | 없음. 칩은 가격·주행거리 2개까지 |
| 퀴즈·맞히기 기획 | `bobae_quiz` (LM형) | 딩(NL형과 같음) |
| 배경 음악을 깖 | 위 형식 + `--music` | 칩의 20%, 최대 3번(BE형) |

## 2. 효과음 규칙 (planner가 지킴)
- 칩·큰 숫자가 뜨는 첫 프레임보다 0.02초 먼저 시작한다. 원본 실측은 NL 칩 −20ms, 큰 숫자 −30ms다.
- 칩 전부가 아니라 약 40%만 넣는다. 원본 실측은 NL 칩 39%, 큰 숫자 58%다. 가격 → 주행거리 → 연식 → 마력 → 옵션 순으로 고르고, 영상당 최대 6번이다.
- 끝 로고와 컷에는 넣지 않는다. 원본 실측은 끝 로고 NL 2/30, BE 1/21이다.
- 효과음끼리 최소 0.6초를 띄운다. 한 영상에는 한 종류만 쓴다. 딩이 기본이고, 팝은 벨기에형(기울인 띠) 시안에만 쓴다.
- 크기는 말소리(말하는 구간 평균)보다 −6dB 고정, 말과 겹쳐도 같다. 렌더러 `scripts/shortform/sag_reel_v1.py`가 목소리 파일을 재서 자동으로 맞춘다(실측 −6.2dB). −10dB는 안 들려서 쓰지 않는다.
- 렌더러는 `sfx_pack` + `sfx_rules`(기본 `as24`)로 이 규칙을 쓰고, 결과를 `sfx_hits.json`에 남긴다. 배경음악이 깔리면(bgm_vol > 0.05) 음악 모드로 칩의 20%, 최대 3번만 넣는다. 음악 모드를 끄려면 설정에 `sfx_music=False`.

## 3. 소리 파일
- 보배드림 자체 효과음 팩만 쓴다: `public/assets/shortform/sfx`(ElevenLabs 생성, 브랜치 `codex/sag-reel-sfx-pack`).
- 예비 CC0 효과음은 `public/assets/shortform/sfx/opensource/`(출처·CLAP 점수 `manifest.json`). 새 효과음은 `scripts/shortform/sfx_opensource/score_clap.py`로 z ≥ 1.0을 확인한 뒤 넣는다. 기본 소리를 바꾸는 것은 사용자 확인 뒤 `be_locked_rules.json`만 고친다.
- 캡컷 등 다른 앱의 효과음, 원본 영상의 소리, 저작권 음악은 금지다. 참고 영상은 분석용으로만 쓰고 다시 올리지 않는다.

## 4. 실행과 점검
- `python3 scripts/shortform/as24_edit_planner.py plan.json --style bobae [--music]`
- 출력의 `sfx` 배열(t · type · gain_db)을 렌더러가 효과음 팩의 같은 이름 파일로 섞는다.
- 코드를 고쳤으면 `python3 scripts/shortform/test_as24_edit_planner.py`로 점검한다.
- 칩 배치는 as24-style-chip-edit 스킬을 따른다.

## 5. 측정할 때 주의 (다시 분석할 경우)
- 소리 크기가 튀는지만 보는 자동 측정은 믿지 않는다. 끝 로고에서 23/30을 "있음"으로 냈지만, 눈으로 보니 2/30이었다.
- 판정 시각은 편집물이 실제로 나타난 순간으로 잡는다. "끝 2.2초 전"처럼 고정 시각을 쓰면 빗나간다.
- 칩 후보에서 말 따라가기 노랑 낱말과 번호판·노란 차 같은 오탐을 먼저 뺀다.

## 6. 확정 기준 (바꾸려면 사용자에게 먼저 묻는다)
- 칩은 파랑 `#306BD9` + 흰 글자다. 노랑 `#EEEF05`는 낱말 따라가기 전용이다.