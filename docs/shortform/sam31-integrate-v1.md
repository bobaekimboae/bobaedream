# 부위 찾기 SAM 3.1 교체 — v1 (2026-11-25, 시안 마스터)

평가(claude/sam31-eval: 맞은 장면 기존 58% → SAM 글자 84% → 글자+상자 97%)를 받아 부위 찾기 기본 엔진을 SAM 3.1로 바꿨다.

## 바꾼 파일

| 파일 | 내용 |
|---|---|
| `scripts/shortform/auto/part_prompts.json` | 한국어↔영어 부위 이름 공용 표(38개). 애매한 부위는 `chip:false`·`chip_ko`(일체형 시트 헤드레스트 → 칩 「시트」) |
| `scripts/shortform/auto/sam31/part_engine.py` | 엔진. `BBM_PART_ENGINE=sam\|owl`(기본 sam). 글자 → 비었거나 hint와 다른 물체면 상자+가운데 점(buildObjectPrompt와 같은 글자, 7/7 일치) → 글자가 놓친 프레임만 상자로 채움. 신뢰도 0.4 미만·안 보이는 프레임은 None. 부위 컷만 잘라 보내고 2초 미만은 같은 프롬프트끼리 묶음. 1편 상한 $0.30. 자동 재시도 없음(같은 요청은 캐시). 실패·키 없음 → OWLv2 예비 |
| `scripts/shortform/auto/sam31/job_tracks.py` | 렌더 스크립트를 고치지 않고 같은 형식의 tracks.json을 새로 씀(사람 클릭은 `--spec`의 hint에만, 기본 0회) |
| `scripts/shortform/video_listing/listing_video_render.py` | 엔진 호출 + OWLv2 예비, 안 보이는 프레임은 칩·화살표·3D 숫자 숨김, plan.json에 `part_engine`(프레임·금액·엔진) 기록 |

다른 에이전트 파일(photo_listing/common.py, bgm_beats.json, joy10, m235 스크립트, pseg)은 건드리지 않았다. 마스크는 쓰지 않고 상자 가운데만 쓴다.

## 검증 — M235i 원본(같은 렌더 스크립트, tracks.json만 바꿈)

| 항목 | 기존 OWLv2+VitTrack | SAM 3.1 |
|---|---|---|
| 칩이 엉뚱한 물체에 붙은 장면(정지컷 12장) | 1곳 — c8 「레드 가죽 시트」 화살표가 도어 패널 쪽 | **0곳** |
| 부위별 엔진 | — | 글자 5컷(c2 헤드램프·c4 머플러·c6 웰컴 라이트·c8 시트·c9 앰비언트), 예비 2컷(c3 캘리퍼·c7 실 플레이트 = 글자 결과 없음) |
| 사람 클릭 | — | 0회 |
| 첫 화면(인트로) | — | 기존과 같음(첫 3.9초 SSIM 1.000) |
| check_be | 통과 | 통과 |
| edit_gate post --plates | 통과 | 통과 |
| SAM 보낸 프레임·금액·시간 | — | 7요청 · 500프레임 · $0.10 · 58초(동시 4개) |
| 렌더 시간 | — | 98초(2코어) |

정지컷 비교: `sam31_integrate/m235i_owl_vs_sam_a.jpg` · `_b.jpg`(위 기존 · 아래 SAM, 같은 시각).
비교 영상: `bobae_sam31_integrate_m235i.mp4`(왼쪽 기존 · 오른쪽 SAM).

## 남은 것

- c3 캘리퍼·c7 실 플레이트는 글자로 못 찾아 예비로 갔다. 상자 1번(hint)을 주면 SAM으로 잡힌다(평가 a1_sill_plate 120/120). hint를 줄 화면은 촬영키트 승인 단계에 붙일 예정.
- c6 15.0초: 화살표 끝이 말 자막 줄에 살짝 닿는다(검사 통과, 칩 자리 규칙 문제라 엔진과 무관).
- 실제 bobae_auto 세션 코드는 이 저장소에 없어, 같은 엔진을 그 세션에서 `part_engine.find_parts()`로 부르면 된다.
