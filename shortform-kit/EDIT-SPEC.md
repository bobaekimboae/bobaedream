# 보배드림 숏폼 편집 명세 — 편집 유형 · 옵션 기능 편집 · 옵션 표시

> 이 문서는 `shortform-kit/catalog/export_edit_spec.py`가 규칙 파일에서 **자동으로 만든다**. 숫자를 여기서 고치지 말고 규칙 파일을 고친 뒤 스크립트를 다시 돌린다.

| 원본(값의 단일 기준) | 버전 |
|---|---|
| [`shortform-kit/catalog/techniques.json`](https://github.com/bobaekimboae/bobaedream/blob/main/shortform-kit/catalog/techniques.json) | 0.5.1 · 커밋 b9cbc85ba |
| [`scripts/shortform/edition_lock.json`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/edition_lock.json) | 1.3 · 커밋 77deacbe9 |
| [`scripts/shortform/be_locked_rules.json`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/be_locked_rules.json) | 1.1 · 커밋 771f02708 |
| [`scripts/shortform/video_listing/feature_edit_rules.json`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/feature_edit_rules.json) | 1.1 · 커밋 c21d805c2 |
| [`scripts/shortform/photo_listing/option_visual_rules.json`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/photo_listing/option_visual_rules.json) | 1.8.3 · 커밋 1910010be |
| [`scripts/shortform/photo_listing/part_zoom_rules.json`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/photo_listing/part_zoom_rules.json) | 1.2 · 커밋 f13868196 |

읽는 순서: ① 편집 유형에서 판을 고른다 → ② 그 판의 필수·금지 기법을 확인한다 → ③ 영상 매물이면 T01~T08, 사진 매물이면 옵션 표시 규칙으로 옵션을 표현한다 → ④ 편집 방법 전체 표에서 코드·구현 위치를 찾는다.

## 0. 용어

| 말 | 뜻 |
|---|---|
| edition | 편집 유형 — 어떤 소재로 어떤 성격의 영상을 만드나(4가지). 유형마다 쓸 수 있는 구성·기법이 정해져 있다. |
| segment | 편집 구성 — 독립된 한 컷(또는 몇 컷) 단위로 끼워 넣는 덩어리. 예: 차량 기본 정보 카드 컷, 배기음 컷. |
| technique | 편집 기법 — 화면·소리에 거는 효과 하나. 예: 포인트 칩, 휙 넘김, 부위 당기기, 딩 효과음. |
| feature | 옵션 표시 — 차량 기능(열선·통풍·마사지·메모리 등)을 말할 때 그 부위에 붙는 이모지·3D 글자 표시. |
| asset | 자산 — 기법이 쓰는 원본 파일(칠 판 SVG, 3D 이모지, 효과음, 배경음악, 글꼴). |
| purpose | 목적 — 재미 / 정보 / 둘 다. 보배드림 숏폼은 한국 딜러 영상과 달리 재미와 정보 두 가지를 함께 준다. 한 영상에 재미 기법과 정보 기법이 모두 들어가야 한다. |
| 상태 「구현」 | 코드가 있고 실제 영상에 쓰임 |
| 상태 「일부」 | 비슷한 코드는 있으나 확정 규칙과 다름(바꿔야 함) |
| 상태 「계획」 | 정했지만 아직 코드 없음 |
| 상태 「관찰」 | AS24·나세르 영상에서 관찰만 함(아직 우리 코드 없음) |
| 상태 「금지」 | 쓰지 않기로 정함 |

## 1. 편집 유형(판) 4가지

| 코드 | 이름 | 소재 | 소리 | 상태 | 렌더러 | 고정 구성 |
|---|---|---|---|---|---|---|
| ED-PHOTO | 사진 매물 숏폼 변환 | 매물 사진 + 매물 원장 | 내레이션 + 배경음악 + 효과음 | 구현 | `scripts/shortform/photo_listing/common.py` | 1번째 컷 SG-INTRO-EMBLEM / 2번째 컷 SG-CARD-BASIC(2026-11-22 확정) / 끝 SG-END-DEALER |
| ED-SIMPLE | 실촬영 · 오토스카우트24 벨기에 심플 | 촬영 영상 + 매물 원장 | 내레이션 + 배경음악 + 효과음 | 구현 | `scripts/shortform/video_listing/g350_v8_render.py` | 끝 SG-END-DEALER |
| ED-3D | 실촬영 · 나세르 3D 효과 | 촬영 영상 + 매물 원장 | 내레이션 + 효과음 | 계획 | `scripts/shortform/egypt_3d_callout_sample.py` | 1번째 컷 SG-INTRO-IMPACT / 끝 SG-END-DEALER |
| ED-ASMR | ASMR (내레이션 없음) | 소리를 살려 찍은 촬영 영상 + 매물 원장 | 녹음된 원래 소리만 — 배경음악·효과음 없음(2026-11-22 확정) | 계획 | 없음 | 끝 SG-END-DEALER |

### ED-PHOTO · 사진 매물 숏폼 변환

- **소재**: 매물 사진 + 매물 원장
- **소리**: 내레이션 + 배경음악 + 효과음
- **상태**: 구현
- **렌더러(하나만 씀)**: `scripts/shortform/photo_listing/common.py`
- **준비 스크립트**: `scripts/shortform/photo_listing/sag_auto.py`
- **장면 순서**: script
- **기준 영상(골든)**: 서울오토갤러리 E250 자동판 (커밋 02aed754a, 렌더러 `scripts/shortform/photo_listing/common.py`)
- **반드시 들어가는 기법**: `title_brand_chip`, `card_basic`, `end_dealer`, `kenburns`, `bgm`, `loudness_rule`
  - `card_basic` = 포인트 칩(사실 칩) 1개 이상
  - `end_dealer` = 끝 화면(END_CARD) + 딜러 칩 또는 딜러 로고
  - `kenburns` = 사진 확대·이동
  - `title_brand_chip` = 첫 화면 제조사 칩(HOOK)
- **금지**: `chip_tilt`, `emoji_sticker_floating`, `caption_paint`, `non_yellow_accent`
- **검사(하나라도 실패하면 전달 금지)**:
  - photo_listing/check_cfg.py
  - photo_listing/fact_check.py
  - photo_listing/check_render.py
- **이 판에서 쓸 수 있는 편집 방법**: 63개

| 종류 | 분류 | 코드 · 이름(상태) |
|---|---|---|
| 자산 | 아이콘 | AS-FLUENT3D Fluent 3D 이모지(구현) |
| 자산 | 칠 판 | AS-PLATE-CHIL-103x33 칠 판 103×33(기울기 없음)(일부) · AS-PLATE-CHIL-38x43 원형 칠 38×43(계획) |
| 편집 구성 | 구성 | SG-SECTION 구간 제목(구현) · SG-SPLIT3 세로 3분할(관찰) |
| 편집 구성 | 마무리 | SG-END-DEALER 딜러 엔딩 · 앱 안내(구현) |
| 편집 구성 | 설명 | SG-EXPLAIN-ART 설명용 그림 컷(관찰) |
| 편집 구성 | 신뢰 | SG-ODOMETER 계기판 주행거리 확인(일부) |
| 편집 구성 | 첫 화면 | SG-INTRO-EMBLEM 엠블럼 확대 → 제목(구현) · SG-QUIZ-HOOK 퀴즈 첫 화면(관찰) · SG-THIS-OR-THAT 둘 중 하나(관찰) · SG-SERIES-TITLE 시리즈 타이틀 카드(관찰) |
| 편집 구성 | 카드 정보 | SG-CARD-BASIC 차량 기본 정보 카드(일부) · SG-CARD-INSPECT 성능점검 카드(계획) · SG-CARD-INSURE 보험이력 카드(계획) · SG-CARD-SPEC 제원 카드(계획) |
| 편집 구성 | 카탈로그 | SG-CATALOG 카탈로그 컷(일부) |
| 편집 기법 | 3D | FX-TEXT3D 3D 글자(구현) · FX-NUMBER3D 숫자 화면 표기(구현) |
| 편집 기법 | 기호 | MARK-POINTER 손가락·화살표 포인터(구현) · MARK-DIM-LINE 치수선(구현) |
| 편집 기법 | 마무리 | END-COMMENT 댓글 유도(관찰) · END-FOLLOW 팔로우 유도(관찰) |
| 편집 기법 | 목록 | LIST-CHECK 옵션 체크 목록(일부) |
| 편집 기법 | 움직임 | MOVE-KENBURNS 켄번스(구현) · MOVE-PARTZOOM 부위 당기기(구현) · MOVE-FIT-BLURFILL 차 전체 맞춤 + 흐린 채움(구현) · MOVE-PUNCH 펀치 확대(구현) · MOVE-COUNTUP 숫자 카운트업(일부) |
| 편집 기법 | 음악·음성 | BGM-SHOWROOM 배경음악 + 말할 때 줄이기(구현) · VO-TTS AI 내레이션(구현) · AUD-LOUDNORM 음량 맞춤(구현) |
| 편집 기법 | 자막 | CAP-KARAOKE 말 자막(낱말 따라 색 바뀜)(구현) · CAP-HOOK-TITLE 첫 화면 제목(구현) · CAP-ORDINAL 순번 숫자(관찰) · CAP-PRICE-TEASE 가격 예고(관찰) |
| 편집 기법 | 칩 | CHIP-POINT 포인트 칩(일부) · CHIP-NUMBER 큰 숫자 칩(구현) · CHIP-ICON3D 칩 옆 3D 아이콘(구현) · CHIP-DEALER 딜러 칩 · 하단 띠(구현) · CHIP-TAG 부위 꼬리표(구현) · CHIP-PRICEDROP 가격 인하 칩(관찰) · CHIP-STAT-ARROW 통계 화살표 칩(관찰) · CHIP-FLAG 국기(관찰) |
| 편집 기법 | 컷 넘김 | TR-WHIP 휙 넘김(좌·우)(구현) · TR-PUSH-UP 위로 밀기(구현) · TR-ZOOM 확대 넘김(구현) · TR-FLASH 흰 섬광(구현) · TR-BLUR 흐림 교차(구현) · TR-FADE 페이드(페이드판)(구현) · TR-BRUSH-WIPE 붓 원 와이프(관찰) |
| 편집 기법 | 화면 삽입 | INS-MAGNIFIER 돋보기 원(일부) · INS-COMPARE-CARD 비교 차 카드(관찰) · INS-PHONE-APP 폰 앱 화면(관찰) · INS-LISTING-CARD 매물 카드(관찰) · INS-WEB-WINDOW 웹 창(관찰) |
| 편집 기법 | 효과음 | SFX-DING 딩(구현) · SFX-WHOOSH 휙(구현) · SFX-POP 팝(구현) · SFX-CLICK 클릭(구현) · SFX-CONTEXT 문맥 효과음(일부) · SFX-HORSE 말 울음(마력)(일부) · SFX-METAPHOR 비유 효과음 묶음(일부) |

### ED-SIMPLE · 실촬영 · 오토스카우트24 벨기에 심플

- **소재**: 촬영 영상 + 매물 원장
- **소리**: 내레이션 + 배경음악 + 효과음
- **상태**: 구현
- **렌더러(하나만 씀)**: `scripts/shortform/video_listing/g350_v8_render.py`
- **준비 스크립트**: `scripts/shortform/video_listing/make_job.py` · `scripts/shortform/video_listing/place_voice.py`
- **장면 순서**: picked — 말하는 부위 장면을 골라 잘라 붙이고 순서를 다시 놓는다(기준 G350 v13, 70초). 2026-11-23 사용자: 「기존 잘 작업했던 벤츠 g350 영상 편집 매뉴얼 따른 작업」 → 11-22 「원본 순서·원본 길이 고정」을 되돌림. listing_video_render.py(원본 순서판)는 장면 고르기를 넣기 전까지 비교용
- **기준 영상(골든)**: G350 버전 1 (커밋 b9cbc85ba, 렌더러 `scripts/shortform/video_listing/g350_v8_render.py`)
- **반드시 들어가는 기법**: `bgm`, `caption_chunks`, `end_logo`, `loudness_rule`, `slow_push`, `title_brand_chip`
- **조건부 필수**:
  - `point_chip|callout_chip` — job.cuts에 chip이 하나라도 있으면
  - `callout_arrow` — chip에 part가 있고 부위를 찾았으면
  - `big_number_3d` — job.cuts에 bigs가 있으면
  - `seat_material_3d` — job.cuts에 material이 있으면
  - `T04` — 계획기가 카운트업을 골랐으면
  - `T08` — 계획기가 부위 당기기를 골랐으면
  - `sfx_rules` — 효과음 후보가 하나라도 있으면
- **금지**: `emoji_sticker_floating`, `chip_tilt`, `caption_paint`, `non_yellow_accent`
- **음성**: {"provider": "ElevenLabs", "model": "eleven_v3", "voice": "Taehyung", "takes": 1, "speech": "합니다체"} (생성 1회, 재시도 금지)
- **자막 글자**: 대본 글자(받아쓰기 글자 금지 — 받아쓰기는 시각만)
- **검사(하나라도 실패하면 전달 금지)**:
  - video_listing/job_fact_check.py (렌더 전, job.json ↔ facts.json)
  - edit_gate.py post [--plates]
  - check_be.py
  - 기준 영상 비교: public/shortform-samples/g350-v1 같은 시각 화면 나란히(shortform-kit/SKILLS-INDEX.md 6장)
- **이 판에서 쓸 수 있는 편집 방법**: 68개

| 종류 | 분류 | 코드 · 이름(상태) |
|---|---|---|
| 자산 | 아이콘 | AS-FLUENT3D Fluent 3D 이모지(구현) |
| 자산 | 칠 판 | AS-PLATE-CHIL-103x33 칠 판 103×33(기울기 없음)(일부) · AS-PLATE-CHIL-38x43 원형 칠 38×43(계획) |
| 편집 구성 | 구성 | SG-SPLIT3 세로 3분할(관찰) |
| 편집 구성 | 딜러 | SG-DEALER-TALK 딜러 설명 컷(계획) |
| 편집 구성 | 마무리 | SG-END-DEALER 딜러 엔딩 · 앱 안내(구현) |
| 편집 구성 | 설명 | SG-EXPLAIN-ART 설명용 그림 컷(관찰) · SG-HOST-PLAIN 단색 배경 진행자(관찰) |
| 편집 구성 | 소리 | SG-EXHAUST 배기음 컷(관찰) |
| 편집 구성 | 신뢰 | SG-ODOMETER 계기판 주행거리 확인(일부) |
| 편집 구성 | 첫 화면 | SG-INTRO-IMPACT 첫 컷 임팩트(로고·모델명 현란 등장)(계획) · SG-QUIZ-HOOK 퀴즈 첫 화면(관찰) · SG-REVEAL 덮개·가림 공개(관찰) · SG-THIS-OR-THAT 둘 중 하나(관찰) · SG-SERIES-TITLE 시리즈 타이틀 카드(관찰) |
| 편집 구성 | 카드 정보 | SG-CARD-BASIC 차량 기본 정보 카드(일부) · SG-CARD-INSPECT 성능점검 카드(계획) · SG-CARD-INSURE 보험이력 카드(계획) · SG-CARD-SPEC 제원 카드(계획) |
| 편집 구성 | 카탈로그 | SG-CATALOG 카탈로그 컷(일부) |
| 편집 기법 | 3D | FX-TEXT3D 3D 글자(구현) · FX-NUMBER3D 숫자 화면 표기(구현) |
| 편집 기법 | 기호 | MARK-POINTER 손가락·화살표 포인터(구현) · MARK-DIM-LINE 치수선(구현) · MARK-SURPRISE 놀람 선(관찰) · MARK-PRESS 버튼 누름 클로즈업(관찰) |
| 편집 기법 | 마무리 | END-COMMENT 댓글 유도(관찰) · END-FOLLOW 팔로우 유도(관찰) |
| 편집 기법 | 목록 | LIST-CHECK 옵션 체크 목록(일부) |
| 편집 기법 | 움직임 | MOVE-PARTZOOM 부위 당기기(구현) · MOVE-JUMPCUT 점프컷(구현) · MOVE-COUNTUP 숫자 카운트업(일부) · MOVE-SHAKE 마력 흔들림(구현) · MOVE-TRACK 부위 따라가기(일부) |
| 편집 기법 | 음악·음성 | BGM-SHOWROOM 배경음악 + 말할 때 줄이기(구현) · VO-TTS AI 내레이션(구현) · AUD-LOUDNORM 음량 맞춤(구현) |
| 편집 기법 | 자막 | CAP-KARAOKE 말 자막(낱말 따라 색 바뀜)(구현) · CAP-HOOK-TITLE 첫 화면 제목(구현) · CAP-EXCLAIM 감탄 큰 낱말(관찰) · CAP-QUOTE 인용 문장 카드(관찰) · CAP-ORDINAL 순번 숫자(관찰) · CAP-PRICE-TEASE 가격 예고(관찰) |
| 편집 기법 | 칩 | CHIP-POINT 포인트 칩(일부) · CHIP-NUMBER 큰 숫자 칩(구현) · CHIP-ICON3D 칩 옆 3D 아이콘(구현) · CHIP-DEALER 딜러 칩 · 하단 띠(구현) · CHIP-TAG 부위 꼬리표(구현) · CHIP-PRICEDROP 가격 인하 칩(관찰) · CHIP-STAT-ARROW 통계 화살표 칩(관찰) · CHIP-SWAP 칩 교체(관찰) · CHIP-FLAG 국기(관찰) |
| 편집 기법 | 컷 넘김 | TR-CUT 바로 자르기(구현) · TR-SPLIT2 위아래 2분할(구현) · TR-BRUSH-WIPE 붓 원 와이프(관찰) |
| 편집 기법 | 화면 삽입 | INS-MAGNIFIER 돋보기 원(일부) · INS-SPOTLIGHT 스포트라이트(구현) · INS-COMPARE-CARD 비교 차 카드(관찰) · INS-PHONE-APP 폰 앱 화면(관찰) · INS-LISTING-CARD 매물 카드(관찰) · INS-WEB-WINDOW 웹 창(관찰) |
| 편집 기법 | 효과음 | SFX-DING 딩(구현) · SFX-WHOOSH 휙(구현) · SFX-POP 팝(구현) · SFX-CLICK 클릭(구현) · SFX-CONTEXT 문맥 효과음(일부) · SFX-HORSE 말 울음(마력)(일부) · SFX-METAPHOR 비유 효과음 묶음(일부) |

### ED-3D · 실촬영 · 나세르 3D 효과

- **소재**: 촬영 영상 + 매물 원장
- **소리**: 내레이션 + 효과음
- **상태**: 계획
- **렌더러**: 아직 없음(계획). `edition_lock.json`에 판 항목이 생기면 이 문서에 자동으로 나온다.
- **이 판에서 쓸 수 있는 편집 방법**: 62개

| 종류 | 분류 | 코드 · 이름(상태) |
|---|---|---|
| 자산 | 아이콘 | AS-FLUENT3D Fluent 3D 이모지(구현) |
| 자산 | 칠 판 | AS-PLATE-CHIL-103x33 칠 판 103×33(기울기 없음)(일부) |
| 편집 구성 | 구성 | SG-SPLIT3 세로 3분할(관찰) |
| 편집 구성 | 딜러 | SG-DEALER-TALK 딜러 설명 컷(계획) |
| 편집 구성 | 마무리 | SG-END-DEALER 딜러 엔딩 · 앱 안내(구현) |
| 편집 구성 | 설명 | SG-EXPLAIN-ART 설명용 그림 컷(관찰) |
| 편집 구성 | 소리 | SG-EXHAUST 배기음 컷(관찰) |
| 편집 구성 | 첫 화면 | SG-INTRO-IMPACT 첫 컷 임팩트(로고·모델명 현란 등장)(계획) · SG-QUIZ-HOOK 퀴즈 첫 화면(관찰) · SG-REVEAL 덮개·가림 공개(관찰) · SG-THIS-OR-THAT 둘 중 하나(관찰) · SG-SERIES-TITLE 시리즈 타이틀 카드(관찰) |
| 편집 구성 | 카드 정보 | SG-CARD-BASIC 차량 기본 정보 카드(일부) · SG-CARD-INSPECT 성능점검 카드(계획) · SG-CARD-INSURE 보험이력 카드(계획) · SG-CARD-SPEC 제원 카드(계획) |
| 편집 구성 | 카탈로그 | SG-CATALOG 카탈로그 컷(일부) |
| 편집 기법 | 3D | FX-TEXT3D 3D 글자(구현) · FX-NUMBER3D 숫자 화면 표기(구현) · FX-CALLOUT-3D 부위 3D 말풍선(계획) |
| 편집 기법 | 기호 | MARK-POINTER 손가락·화살표 포인터(구현) · MARK-SURPRISE 놀람 선(관찰) · MARK-PRESS 버튼 누름 클로즈업(관찰) |
| 편집 기법 | 마무리 | END-COMMENT 댓글 유도(관찰) · END-FOLLOW 팔로우 유도(관찰) |
| 편집 기법 | 목록 | LIST-CHECK 옵션 체크 목록(일부) |
| 편집 기법 | 움직임 | MOVE-JUMPCUT 점프컷(구현) · MOVE-COUNTUP 숫자 카운트업(일부) · MOVE-SHAKE 마력 흔들림(구현) · MOVE-TRACK 부위 따라가기(일부) |
| 편집 기법 | 음악·음성 | BGM-SHOWROOM 배경음악 + 말할 때 줄이기(구현) · VO-TTS AI 내레이션(구현) · AUD-LOUDNORM 음량 맞춤(구현) |
| 편집 기법 | 자막 | CAP-KARAOKE 말 자막(낱말 따라 색 바뀜)(구현) · CAP-HOOK-TITLE 첫 화면 제목(구현) · CAP-EXCLAIM 감탄 큰 낱말(관찰) · CAP-QUOTE 인용 문장 카드(관찰) · CAP-ORDINAL 순번 숫자(관찰) · CAP-PRICE-TEASE 가격 예고(관찰) |
| 편집 기법 | 칩 | CHIP-POINT 포인트 칩(일부) · CHIP-NUMBER 큰 숫자 칩(구현) · CHIP-ICON3D 칩 옆 3D 아이콘(구현) · CHIP-DEALER 딜러 칩 · 하단 띠(구현) · CHIP-PRICEDROP 가격 인하 칩(관찰) · CHIP-STAT-ARROW 통계 화살표 칩(관찰) · CHIP-SWAP 칩 교체(관찰) · CHIP-FLAG 국기(관찰) |
| 편집 기법 | 컷 넘김 | TR-SPLIT2 위아래 2분할(구현) · TR-BRUSH-WIPE 붓 원 와이프(관찰) |
| 편집 기법 | 화면 삽입 | INS-MAGNIFIER 돋보기 원(일부) · INS-SPOTLIGHT 스포트라이트(구현) · INS-COMPARE-CARD 비교 차 카드(관찰) · INS-PHONE-APP 폰 앱 화면(관찰) · INS-LISTING-CARD 매물 카드(관찰) · INS-WEB-WINDOW 웹 창(관찰) |
| 편집 기법 | 효과음 | SFX-DING 딩(구현) · SFX-WHOOSH 휙(구현) · SFX-POP 팝(구현) · SFX-CLICK 클릭(구현) · SFX-CONTEXT 문맥 효과음(일부) · SFX-HORSE 말 울음(마력)(일부) · SFX-METAPHOR 비유 효과음 묶음(일부) |

### ED-ASMR · ASMR (내레이션 없음)

- **소재**: 소리를 살려 찍은 촬영 영상 + 매물 원장
- **소리**: 녹음된 원래 소리만 — 배경음악·효과음 없음(2026-11-22 확정)
- **상태**: 계획
- **렌더러**: 아직 없음(계획). `edition_lock.json`에 판 항목이 생기면 이 문서에 자동으로 나온다.
- **이 판에서 쓸 수 있는 편집 방법**: 17개

| 종류 | 분류 | 코드 · 이름(상태) |
|---|---|---|
| 편집 구성 | 마무리 | SG-END-DEALER 딜러 엔딩 · 앱 안내(구현) |
| 편집 구성 | 소리 | SG-EXHAUST 배기음 컷(관찰) |
| 편집 구성 | 첫 화면 | SG-INTRO-IMPACT 첫 컷 임팩트(로고·모델명 현란 등장)(계획) · SG-SERIES-TITLE 시리즈 타이틀 카드(관찰) |
| 편집 구성 | 카드 정보 | SG-CARD-BASIC 차량 기본 정보 카드(일부) · SG-CARD-INSPECT 성능점검 카드(계획) · SG-CARD-INSURE 보험이력 카드(계획) · SG-CARD-SPEC 제원 카드(계획) |
| 편집 기법 | 마무리 | END-COMMENT 댓글 유도(관찰) · END-FOLLOW 팔로우 유도(관찰) |
| 편집 기법 | 음악·음성 | AUD-LOUDNORM 음량 맞춤(구현) |
| 편집 기법 | 자막 | CAP-HOOK-TITLE 첫 화면 제목(구현) · CAP-ASMR-WORD ASMR 낱말 칩(계획) |
| 편집 기법 | 칩 | CHIP-DEALER 딜러 칩 · 하단 띠(구현) · CHIP-PRICEDROP 가격 인하 칩(관찰) |
| 편집 기법 | 컷 넘김 | TR-CUT 바로 자르기(구현) |
| 편집 기법 | 화면 삽입 | INS-LISTING-CARD 매물 카드(관찰) |

공통 고정 값(색·칩 글자 크기·자막 높이·효과음 개수·음량)은 [`scripts/shortform/be_locked_rules.json`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/be_locked_rules.json) 한 곳. 판마다 다르지 않다.

## 2. 영상 옵션·기능 편집 기법 T01~T08 (ED-SIMPLE)

대본(낱말 시각)과 컷 목록을 넣으면 계획기([`scripts/shortform/video_listing/feature_edit_planner.py`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/feature_edit_planner.py))가 컷마다 기법을 고르고, 렌더러([`scripts/shortform/video_listing/g350_v8_render.py`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py))가 그린다. 값은 [`scripts/shortform/video_listing/feature_edit_rules.json`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/feature_edit_rules.json).

### 2-1. 한눈에

| T | 이름 | 언제 | 영상당 최대 | 카탈로그 코드 | G350 버전 1 예시 |
|---|---|---|---|---|---|
| T01 | 위아래 2분할 (split_screen) | 옵션 class=action_result 이고 원본에 동작 장면(action)과 결과 장면(result)이 둘 다 있을 때 | 2 | TR-SPLIT2 | G350 15.33~18.78초 천장 버튼(위) ↔ 선루프 열림(아래) · [▶18.78초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=18.78) |
| T02 | ✓ 목록 쌓기 (checklist) | 한 컷 대본에 같은 그룹 항목을 2개 이상 이어 말할 때(시트 기능 그룹 제외 — 시트는 아이콘 묶음 규칙) | 2 | LIST-CHECK | G350 46.50·47.00·47.66초에 앞·가운데·뒤 잠금 한 줄씩 · [▶47.66초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=47.66) |
| T03 | 점프컷 (jump_cut) | 한 컷에서 제원 낱말(토크·변속기·제로백·연비 등)을 3개 이상 이어 말할 때 | 1 | MOVE-JUMPCUT | G350 59.13·61.05·61.99초 토크는/7단/제로백은 · [▶61.99초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=61.99) |
| T04 | 숫자 카운트업 (count_up) | 큰 숫자로 띄우는 정수 값(마력·kg·L·cc·km·N·m). 연식·타이어 규격·소수·모델 번호는 제외 | 4 | MOVE-COUNTUP | G350 3,500kg 22.01초 · 480L 25.14초 · 2,250L 27.40초 · 211마력 57.90초 시작 · [▶22.01초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=22.01) [▶25.14초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=25.14) [▶27.4초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=27.4) |
| T05 | 스포트라이트 (spotlight) | 옵션 class=lighting 이고 부위가 빛나는 장면일 때(밝은 쪽 상위 5% 밝기 − 중앙값 밝기 ≥ 80, 구간 5장 평균) | 2 | INS-SPOTLIGHT | G350 헤드램프 4.13초 어두워짐 → 5.27초(LED 낱말)부터 다시 밝게 · 도어스텝 54.43초부터 컷 끝까지 · [▶4.13초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=4.13) [▶5.27초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=5.27) [▶54.43초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=54.43) |
| T06 | 돋보기 원 (magnifier) | 옵션 class=small_control 이고 부위 상자가 화면의 3% 미만이며 추적이 될 때 · 영상에 1번(먼저 나오는 컷) | 1 | INS-MAGNIFIER | G350 34.14초 전동 시트 조절 버튼 · [▶34.14초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=34.14) |
| T07 | 마력 흔들림 (power_shake) | 영상에서 가장 큰 마력 값 한 번. 말 울음은 비유 효과음 규칙(option_visual_rules.json layout.metaphor_sfx) 한 곳에서 냄(2026-11-22 정리) | 1 | MOVE-SHAKE | G350 58.85초 211마력 · [▶58.85초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=58.85) |
| T08 | 부위 당기기 (part push-in) | 옵션 class=small_control 이고 추적이 되며, 같은 컷에 돋보기(T06)·✓ 목록(T02)이 없고 컷이 1.5초 이상일 때 · 영상에 2번까지 | 2 | MOVE-PARTZOOM | G350 커맨드 컨트롤러·공조 다이얼(2026-11-22 사용자: 「옵션 편집기능 너 판단해서 추가」, 매뉴얼 부위 당기기 규칙 part_zoom_rules.json을 영상판으로) |

### 2-2. 옵션 분류 — 계획기가 대본 낱말로 옵션을 찾고, 그 분류로 기법을 고른다

| 분류 | 무엇 | 주로 쓰는 기법 |
|---|---|---|
| `lighting` | 헤드램프·주간등·앰비언트·도어스텝 조명·웰컴 라이트 | T05 스포트라이트 |
| `small_control` | 작은 버튼·스위치(시트 조절·메모리·디퍼렌셜 락·드라이브 모드·공조 버튼) | T06 돋보기 → 없으면 T08 부위 당기기 |
| `action_result` | 누르면 결과가 보이는 기능(선루프·전동 트렁크·사이드미러 폴딩·문 열면 켜지는 조명) | T01 위아래 2분할 |
| `group_list` | 같은 그룹을 이어 말하는 기능(디퍼렌셜 락 앞·가운데·뒤, 주행 보조 묶음) | T02 ✓ 목록 |
| `number` | 숫자 제원(마력·토크·적재·견인·트렁크 용량) | T04 카운트업 · T07 마력 흔들림 |
| `spec_burst` | 엔진·변속기·제로백 요약 | T03 점프컷 |

| 옵션 키 | 이름 | 알아듣는 낱말 | 분류 | 부위 |
|---|---|---|---|---|
| `headlight` | 헤드램프 | 헤드램프, 헤드라이트, 제논, LED 헤드, 매트릭스 | `lighting` | headlight |
| `drl` | 주간등 | LED 주간등, 주간등, 주간 주행등, DRL | `lighting` | headlight |
| `ambient` | 앰비언트 라이트 | 앰비언트, 무드등 | `lighting` | console |
| `door_step_light` | 조명 도어 스텝 | 도어 스텝, 도어스텝, 웰컴 라이트 | `lighting` | door step |
| `sunroof` | 전동 선루프 | 선루프, 썬루프, 파노라마 | `action_result` | roof |
| `power_tailgate` | 전동 트렁크 | 전동 트렁크, 파워 트렁크, 전동 테일게이트 | `action_result` | trunk |
| `mirror_fold` | 사이드미러 폴딩 | 미러 폴딩, 사이드미러 | `action_result` | mirror |
| `seat_adjust` | 전동 시트 조절 | 시트 조절, 전동 시트 | `small_control` | seat switch |
| `seat_memory` | 메모리 시트 | 메모리 | `small_control` | seat switch |
| `diff_lock` | 디퍼렌셜 락 | 디퍼렌셜, 디프 락, 락 버튼 | `group_list` | button panel |
| `drive_mode` | 드라이브 모드 | 드라이브 모드, 주행 모드 | `small_control` | dial |
| `climate` | 공조 다이얼 | 공조, 에어컨, 다이얼 | `small_control` | climate |
| `controller` | 커맨드 컨트롤러 | 컨트롤러, 다이얼 컨트롤, 조그 | `small_control` | console |
| `tow_hitch` | 견인고리 | 견인고리, 견인 고리, 토우바 | `number` | tow hitch |
| `trunk` | 트렁크 용량 | 트렁크 | `number` | trunk |
| `engine` | 엔진 제원 | 토크, 변속, 제로백, 연비 | `spec_burst` | None |
| `power` | 마력 | 마력 | `number` | None |

- 제원 낱말(T03): 토크, 단, 제로백, 연비, 최고속도, 배기량
- 카운트업 단위(T04): 마력, kg, L, cc, km, N·m · 제외: 년식, 년, R, /, .
- 작은 부위 기준(T06): 부위 상자가 화면의 3% 미만
- 빛나는 장면 기준(T05): 밝은 쪽 상위 5% − 중앙값 ≥ 80

### 2-3. 기법별 상세

#### T01 위아래 2분할 (split_screen)

- **언제 쓰나**: 옵션 class=action_result 이고 원본에 동작 장면(action)과 결과 장면(result)이 둘 다 있을 때
- **영상당 최대**: 2번
- **예시**: G350 15.33~18.78초 천장 버튼(위) ↔ 선루프 열림(아래) — [▶18.78초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=18.78)
- **카탈로그**: TR-SPLIT2 · 이 T를 참조하는 항목: TR-SPLIT2
- **계획기 코드**: [`scripts/shortform/video_listing/feature_edit_planner.py:74`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/feature_edit_planner.py#L74)
- **렌더 코드**: [`scripts/shortform/video_listing/g350_v8_render.py:233`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L233), [`scripts/shortform/video_listing/g350_v8_render.py:234`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L234), [`scripts/shortform/video_listing/g350_v8_render.py:235`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L235), [`scripts/shortform/video_listing/g350_v8_render.py:238`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L238)

| 값 이름 | 값 |
|---|---|
| `top` | 동작 장면, 세로 중심 0.45H에서 높이 960 자름 |
| `bottom` | 결과 장면, 세로 중심 0.36H에서 높이 960 자름 |
| `divider_px` | 8 |
| `divider_color` | white |
| `max_rate` | 1.0 |
| `chip` | 위 띠, 화살표 없음 |

#### T02 ✓ 목록 쌓기 (checklist)

- **언제 쓰나**: 한 컷 대본에 같은 그룹 항목을 2개 이상 이어 말할 때(시트 기능 그룹 제외 — 시트는 아이콘 묶음 규칙)
- **영상당 최대**: 2번
- **예시**: G350 46.50·47.00·47.66초에 앞·가운데·뒤 잠금 한 줄씩 — [▶47.66초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=47.66)
- **카탈로그**: LIST-CHECK · 이 T를 참조하는 항목: LIST-CHECK
- **계획기 코드**: [`scripts/shortform/video_listing/feature_edit_planner.py:78`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/feature_edit_planner.py#L78)
- **렌더 코드**: [`scripts/shortform/video_listing/g350_v8_render.py:196`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L196), [`scripts/shortform/video_listing/g350_v8_render.py:200`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L200), [`scripts/shortform/video_listing/g350_v8_render.py:234`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L234)

| 값 이름 | 값 |
|---|---|
| `max_rows` | 3 |
| `pill` | 흰 붓칠 + ✓ + 글자 58px |
| `row_gap_px` | 12 |
| `anchor` | 칩 바로 아래, 칩 칠 왼쪽 선에 맞춤 |
| `appear_before_word_s` | 0.06 |
| `chip` | 위 띠 제목, 화살표 없음 |

#### T03 점프컷 (jump_cut)

- **언제 쓰나**: 한 컷에서 제원 낱말(토크·변속기·제로백·연비 등)을 3개 이상 이어 말할 때
- **영상당 최대**: 1번
- **예시**: G350 59.13·61.05·61.99초 토크는/7단/제로백은 — [▶61.99초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=61.99)
- **카탈로그**: MOVE-JUMPCUT · 이 T를 참조하는 항목: MOVE-JUMPCUT
- **계획기 코드**: [`scripts/shortform/video_listing/feature_edit_planner.py:87`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/feature_edit_planner.py#L87)
- **렌더 코드**: [`scripts/shortform/video_listing/g350_v8_render.py:263`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L263), [`scripts/shortform/video_listing/g350_v8_render.py:267`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L267)

| 값 이름 | 값 |
|---|---|
| `zoom_step` | 0.11 |
| `ramp_s` | 0.067 |
| `before_word_s` | 0.04 |
| `max_steps` | 3 |
| `replaces` | slow_push |

#### T04 숫자 카운트업 (count_up)

- **언제 쓰나**: 큰 숫자로 띄우는 정수 값(마력·kg·L·cc·km·N·m). 연식·타이어 규격·소수·모델 번호는 제외
- **영상당 최대**: 4번
- **예시**: G350 3,500kg 22.01초 · 480L 25.14초 · 2,250L 27.40초 · 211마력 57.90초 시작 — [▶22.01초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=22.01) [▶25.14초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=25.14) [▶27.4초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=27.4) [▶57.9초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=57.9)
- **카탈로그**: MOVE-COUNTUP · 이 T를 참조하는 항목: MOVE-COUNTUP
- **계획기 코드**: [`scripts/shortform/video_listing/feature_edit_planner.py:95`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/feature_edit_planner.py#L95)
- **렌더 코드**: [`scripts/shortform/video_listing/g350_v8_render.py:48`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L48)

| 값 이름 | 값 |
|---|---|
| `dur_s` | 0.45 |
| `start_before_word_s` | 0.17 |
| `curve` | ease-out cubic |
| `keep_commas` | True |

#### T05 스포트라이트 (spotlight)

- **언제 쓰나**: 옵션 class=lighting 이고 부위가 빛나는 장면일 때(밝은 쪽 상위 5% 밝기 − 중앙값 밝기 ≥ 80, 구간 5장 평균)
- **영상당 최대**: 2번
- **예시**: G350 헤드램프 4.13초 어두워짐 → 5.27초(LED 낱말)부터 다시 밝게 · 도어스텝 54.43초부터 컷 끝까지 — [▶4.13초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=4.13) [▶5.27초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=5.27) [▶54.43초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=54.43)
- **카탈로그**: INS-SPOTLIGHT · 이 T를 참조하는 항목: INS-SPOTLIGHT
- **계획기 코드**: [`scripts/shortform/video_listing/feature_edit_planner.py:101`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/feature_edit_planner.py#L101)
- **렌더 코드**: [`scripts/shortform/video_listing/g350_v8_render.py:247`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L247), [`scripts/shortform/video_listing/g350_v8_render.py:299`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L299), [`scripts/shortform/video_listing/g350_v8_render.py:300`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L300)

| 값 이름 | 값 |
|---|---|
| `hole_r_px` | 300 |
| `feather_px` | 200 |
| `alpha` | 190 |
| `fade_in_s` | 0.3 |
| `start_before_chip_s` | 0.1 |
| `fade_out` | 다음 부위 낱말 0.1초 전부터 0.3초 |

#### T06 돋보기 원 (magnifier)

- **언제 쓰나**: 옵션 class=small_control 이고 부위 상자가 화면의 3% 미만이며 추적이 될 때 · 영상에 1번(먼저 나오는 컷)
- **영상당 최대**: 1번
- **예시**: G350 34.14초 전동 시트 조절 버튼 — [▶34.14초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=34.14)
- **카탈로그**: INS-MAGNIFIER · 이 T를 참조하는 항목: INS-MAGNIFIER
- **계획기 코드**: [`scripts/shortform/video_listing/feature_edit_planner.py:113`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/feature_edit_planner.py#L113)
- **렌더 코드**: [`scripts/shortform/video_listing/g350_v8_render.py:247`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L247), [`scripts/shortform/video_listing/g350_v8_render.py:302`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L302), [`scripts/shortform/video_listing/g350_v8_render.py:303`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L303)

| 값 이름 | 값 |
|---|---|
| `diameter_px` | 320 |
| `zoom` | 2.2 |
| `grow_s` | 0.25 |
| `start_after_chip_s` | 0.15 |
| `ring_px` | 7 |
| `line_px` | 5 |
| `pos` | [230, 288] |
| `color` | white |

#### T07 마력 흔들림 (power_shake)

- **언제 쓰나**: 영상에서 가장 큰 마력 값 한 번. 말 울음은 비유 효과음 규칙(option_visual_rules.json layout.metaphor_sfx) 한 곳에서 냄(2026-11-22 정리)
- **영상당 최대**: 1번
- **예시**: G350 58.85초 211마력 — [▶58.85초](https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/g350-v1.mp4#t=58.85)
- **카탈로그**: MOVE-SHAKE · 이 T를 참조하는 항목: MOVE-SHAKE, SFX-CONTEXT
- **계획기 코드**: [`scripts/shortform/video_listing/feature_edit_planner.py:121`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/feature_edit_planner.py#L121)
- **렌더 코드**: [`scripts/shortform/video_listing/g350_v8_render.py:269`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L269), [`scripts/shortform/video_listing/g350_v8_render.py:270`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L270), [`scripts/shortform/video_listing/g350_v8_render.py:332`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L332)

| 값 이름 | 값 |
|---|---|
| `dur_s` | 0.35 |
| `amp_px` | 14 |
| `decay` | linear |
| `x` | sin(u*90) |
| `y` | cos(u*70) |
| `min_zoom` | 1.04 |
| `at` | 마력 낱말 끝 −0.05초 |
| `sfx` | metaphor_sfx(마력) |

#### T08 부위 당기기 (part push-in)

- **언제 쓰나**: 옵션 class=small_control 이고 추적이 되며, 같은 컷에 돋보기(T06)·✓ 목록(T02)이 없고 컷이 1.5초 이상일 때 · 영상에 2번까지
- **영상당 최대**: 2번
- **예시**: G350 커맨드 컨트롤러·공조 다이얼(2026-11-22 사용자: 「옵션 편집기능 너 판단해서 추가」, 매뉴얼 부위 당기기 규칙 part_zoom_rules.json을 영상판으로)
- **카탈로그**: MOVE-PARTZOOM · 이 T를 참조하는 항목: MOVE-PARTZOOM
- **계획기 코드**: [`scripts/shortform/video_listing/feature_edit_planner.py:117`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/feature_edit_planner.py#L117)
- **렌더 코드**: [`scripts/shortform/video_listing/g350_v8_render.py:4`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L4), [`scripts/shortform/video_listing/g350_v8_render.py:273`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L273), [`scripts/shortform/video_listing/g350_v8_render.py:274`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/video_listing/g350_v8_render.py#L274)

| 값 이름 | 값 |
|---|---|
| `zoom_to` | 1.35 |
| `lead_s` | 0.1 |
| `arrive_s` | 0.6 |
| `center_bias` | 0.85 |
| `hold_drift` | 0.04 |
| `min_cut_s` | 1.5 |

### 2-4. 기법끼리의 규칙

- 2분할(T01)·✓ 목록(T02) 컷은 칩이 위 띠 제목이 되고 화살표를 그리지 않는다.
- 돋보기(T06)·✓ 목록(T02)이 있는 컷에는 부위 당기기(T08)를 걸지 않는다. 컷이 짧으면(1.5초 미만) T08도 없다.
- 점프컷(T03)은 그 컷의 기본 천천히 다가가기(slow_push)를 대신한다.
- 큰 숫자가 뜨는 동안 말 자막을 숨긴다. 번호판 위에 큰 숫자가 오면 자막 자리로 내린다(G350 버전 1 견인고리 컷).
- 칩·큰 숫자·화살표는 번호판을 덮지 않는다(edit_gate plate_check).

### 2-5. 칩 · 화살표 · 큰 숫자 · 움직임 · 검사 값

| 묶음 | 값 이름 | 값 |
|---|---|---|
| mapping | `_what` | 부위 → 화살표 → 칩 간격(매핑 간격). 칩은 부위를 따라 움직이고 화살표가 부위를 가리킨다. |
| mapping | `part_track` | 지금(G350): 사람이 정한 첫 점 + CSRT 추적(상자 화면의 16%×9%) → 21프레임(0.7초) 이동평균. 다음 단계(아직 안 함): OWLv2로 첫 점 자동 찾기 |
| mapping | `arrow_len_px` | 170 |
| mapping | `arrow_min_px` | 70 |
| mapping | `gap_part_to_arrow_tip_px` | 24 |
| mapping | `gap_arrow_tail_to_chip_px` | 6 |
| mapping | `arrow_shape` | {"head_h": 44, "head_w": 72, "stem_w": 20, "outline_px": 4, "color": "yellow", "outline": "ink"} |
| mapping | `arrow_grow` | {"start_after_chip_s": 0.18, "dur_s": 0.25, "from_ratio": 0.55} |
| mapping | `arrow_bob` | {"amp_px": 10, "speed_rad_s": 5} |
| mapping | `chip_edge_margin_px` | 24 |
| mapping | `chip_bottom_max_y` | 1113 |
| mapping | `chip_top_min_y` | 150 |
| mapping | `side_rule` | 컷마다 한 번만 정함: 보이는 구간 전체에서 부위 아래에 들어가면 아래(첫 위치가 화면 위 45% 안이거나 위에 안 들어갈 때), 아니면 위. 컷 중간 뒤집힘 금지 |
| mapping | `no_track` | 부위 추적이 없는 컷은 화살표 없이 위 띠(x 50, y 300) |
| chip | `_values` | 글자 크기·칠(fill_fit)·기울기·색은 be_locked_rules.json chip 한 곳(2026-11-22 정리). 여기는 영상판 등장 시각만 |
| chip | `font` | Pretendard ExtraBold |
| chip | `appear_before_word_s` | 0.06 |
| chip | `pop_s` | 0.2 |
| chip | `sub_chip_font_px` | 58 |
| chip | `info_pill` | 흰 정보 알약도 같은 fill_fit 칠(노션 원본, 같은 배율)·아이콘은 오른쪽 끝 |
| caption | `_values` | 글자 크기·높이·강조색은 be_locked_rules.json caption 한 곳(2026-11-22 정리) |
| caption | `font` | Pretendard Black |
| caption | `chunks` | 뜻 단위 덩어리를 차마다 입력 파일(samples/<차>_chunks.json)로 지정. 기계적 어절 수 분할 금지(LESSONS L27) |
| big_number | `h_px` | 180 |
| big_number | `power_h_px` | 210 |
| big_number | `y_px` | 230 |
| big_number | `power_y_px` | 460 |
| big_number | `unit_scale` | 0.62 |
| big_number | `appear_before_word_s` | 0.22 |
| big_number | `pop_s` | 0.3 |
| default_motion | `slow_push_ratio` | 0.045 |
| qa | `_what` | 렌더 기록(LOG=1)으로 프레임마다 재는 기준. 하나라도 나오면 고친 뒤 다시 렌더 |
| qa | `graphic_overlap_max` | 0.03 |
| qa | `graphic_vs_caption_overlap` | 0 |
| qa | `safe_area` | {"x_margin": 24, "y_top": 100, "y_bottom_from_end": 260} |
| qa | `arrow_chip_gap_px` | [-4, 26] |
| qa | `arrow_inside_chip_margin_px` | 20 |
| qa | `part_must_not_be_covered` | True |
| qa | `arrow_min_px` | 70 |
| qa | `chip_side_flip_in_cut` | False |
| qa | `loudness_lufs` | [-15, -13] |

## 3. 사진판(ED-PHOTO) 옵션 표시 — 옵션 문장 하나 = 그림 하나

값: [`scripts/shortform/photo_listing/option_visual_rules.json`](https://github.com/bobaekimboae/bobaedream/blob/main/scripts/shortform/photo_listing/option_visual_rules.json). 나세르(Nasser Hessien) 영상 관찰 비율(`나세르%`)을 기준으로 정했다.

| id | 이름 | 알아듣는 낱말 | 부위 | 그림 | 효과음 | 필수 | 나세르% | 나세르 방식 |
|---|---|---|---|---|---|---|---|---|
| `screen` | 화면 | 화면, 디스플레이, 스크린, 인치 화면, 내비 | screen | {"type": "pointer+text3d", "emo": "👆", "text3d": "{size}\"", "text3d_if": "size"} | click | 필수 | 43 | 실제 작동 시연 58% · 글자 카드 15% |
| `wheel` | 휠 | 휠 | wheel | {"type": "text3d", "text3d": "{inch}\"", "sub_text3d": "{tire}", "sub_note": "타이어 규격(매물 정보 또는 차종 공식 사양)이 있으면 휠 인치 바로 아래에 작은 3D 글자로. 2026-11-18 사용자 지시"} | pop | 필수 | 37 | 글자 카드 37% · 실제 작동 시연 27% |
| `seat_heat` | 열선 | 열선, 히팅 | backrest | {"type": "sticker", "emo": "🔥", "label": "열선"} | pop | 필수 | 37 | 아이콘 58%(2D 43 · 3D 15) · 글자 카드 24% |
| `seat_vent` | 통풍 | 통풍, 쿨링 | backrest | {"type": "sticker", "emo": "❄️", "label": "통풍"} | pop | 필수 | 34 | 아이콘 66%(2D 50 · 3D 16) · 글자 카드 19% |
| `seat_massage` | 마사지 | 마사지 | backrest | {"type": "sticker", "emo": "💆", "label": "마사지"} | pop | 필수 | 16 | 2D 아이콘 41% · 글자 카드 31% |
| `seat_memory` | 메모리 시트 | 메모리 | backrest | {"type": "sticker", "emo": "💾", "label": "메모리"} | pop |  | None | 통계 없음(사용자 지시 2026-11-18로 추가) |
| `seat_power` | 전동 시트 | 전동 | backrest | {"type": "sticker", "emo": "⚡", "label": "전동"} | pop |  | None | 통계 없음(사용자 지시 2026-11-22: 시트 사진이면 통풍·열선·마사지·전동 아이콘) |
| `seat_material` | 시트 재질 | 나파, 가죽, 알칸타라, 스웨이드, 인조가죽, 직물 | cushion | {"type": "text3d", "text3d": "{material}"} | pop | 필수 | 5 | 실제 작동 시연 33% · 글자 카드 22% |
| `camera` | 카메라 | 카메라, 360, 어라운드뷰, 서라운드뷰 | screen | {"type": "sticker", "emo": "📷", "label": "{camera}"} | pop | 필수 | 28 | 실제 작동 시연 48% · 2D 아이콘 25% |
| `climate` | 공조 | 에어컨, 공조, 존 에어컨 | screen | {"type": "sticker", "emo": "🌬️", "label": "{zones}존"} | pop |  | 23 | 실제 작동 시연 31% · 3D 아이콘 24% · 글자 카드 24% |
| `trunk` | 트렁크 | 트렁크, 적재, 리터 | trunk | {"type": "text3d", "text3d": "{liters} L"} | pop | 필수 | 21 | 실제 작동 시연 70% · 글자 카드 18% |
| `light` | 라이트 | LED, 엘이디, 매트릭스, 레이저, 헤드램프, 헤드라이트, 라이트 | headlight | {"type": "text3d", "text3d": "{light_type}", "vocab": ["LED", "매트릭스 LED", "HD 매트릭스 LED", "레이저", "HID", "할로겐", "DRL"]} | pop | 필수 | 18 | 실제 작동 시연 34% · 글자 카드 17%(DRLs · HD METRIX 입체 영문) |
| `wireless_charge` | 무선충전 | 무선충전, 무선 충전 | console | {"type": "sticker", "emo": "⚡", "label": "무선충전"} | pop |  | 18 | 2D 아이콘 45% · 글자 카드 29% |
| `speaker` | 스피커 | 스피커, 오디오, 사운드 | speaker | {"type": "text3d", "text3d": "{brand}", "sub": "x{count}"} | pop | 필수 | 15 | 글자 카드 48%(SONY · x23 harman/kardon · x16 DEEPAL) |
| `engine` | 엔진·마력 | 마력, 엔진, 토크 | engine_or_full | {"type": "text3d", "text3d": "{hp} 마력"} | ding | 필수 | 14 | 3D 아이콘 42% · 글자 카드 35% |
| `sunroof` | 선루프 | 선루프, 파노라마 | roof | {"type": "text3d", "text3d": "파노라마"} | whoosh |  | 9 | 실제 작동 시연 87% |
| `ambient` | 앰비언트 | 앰비언트, 무드등 | dash | {"type": "text3d", "text3d": "{colors}색"} | pop |  | 5 | 색상 슬라이더 · 화살표 |
| `hud` | HUD | HUD, 헤드업 | dash | {"type": "text3d", "text3d": "HUD"} | pop |  | 3 | 글자 카드 80% |

### 3-1. 배치 규칙(layout)

| 규칙 | 값 |
|---|---|
| `text3d_height_pct` | {"number": 10, "word": 6, "unit_ratio": 0.5} |
| `gap_from_part_pct` | 2 |
| `prefer` | ["above_part", "beside_part"] |
| `never_cover_part` | True |
| `avoid_bands_px` | [["caption", -20, 150], ["bottom", 1580, 1920]] |
| `max_per_cut` | 2 |
| `max_per_cut_note` | 2026-11-22 코드에서 지킴(auto_visuals._cap_per_cut): 한 컷에 그림 묶음 2개까지, 시트 묶음·공조 묶음·휠 인치+타이어 규격은 각 한 묶음, 먼저 말한 것부터. 말은 줄이지 않는다. 근거: 오토비브 10편 옵션 언급 119번·그림 한 편 4~8개. 사용자 위임 판단(「너의 현명한 판단」) |
| `row_spacing_ratio` | 1.1 |
| `appear` | {"pop": {"sec": 0.32, "ease": "back"}, "instant": {"sec": 0.0}} |
| `lead_sec` | 0.05 |
| `hold` | until_cut_end_minus_0.12 |
| `wheel_fit` | [0.12, 70, 150] |
| `wheel_fit_note` | 휠 인치 3D 글자 높이 = 화면에 보이는 휠 상자 높이 × 0.12(최소 70 · 최대 150px). 2026-11-18 사용자 「대문짝 만하다」 |
| `seat_bundle` | {"note": "시트 사진 컷(앞좌석·운전석·시트, 뒷좌석 제외)에 재질 3D 글자 + 열선·통풍·마사지·전동·메모리 아이콘. 위치·크기는 오픈소스 부위 찾기(OWLv2, google/owlv2-base-patch16-ensemble, Apache-2.0)가 찾은 등받이 상자 기준: 아이콘 높이 = 화면에 보이는 등받이 폭 × 0.16(90~190px), 간격 = 아이콘 1.15배, 부위 상자 위에서 62% 높이(시트는 화면 아래쪽, OWLv2 상자가 머리받침 위까지 크게 잡히는 경우가 많음)에 한 줄, 자막 띠와 겹치면 자막 아래 칸 먼저, 재질 글자는 그 바로 위(등받이 폭 × 0.12). 말 자막 띠와 딜러 띠를 피함. 시트 컷 대본에 그 기능 낱말이 없으면 실패(⛔) — 나세르처럼 그림 + 말 둘 다. 2026-11-18 사용자 지시 · 2026-11-22 전동(⚡) 추가", "icon_fit": [0.16, 90, 190], "material_fit": [0.12, 70, 140], "row_v": 0.62} |
| `tire_sub_fit` | [0.085, 60, 96] |
| `tire_sub_note` | v1.7.2 사용자 「타이어 수치도 작다」: 휠 상자 높이 × 0.085(60~96px, 이전 0.05·34~62), 앞·뒤 규격이 다르면 두 줄(줄마다 림 지름), 인치 아래 10px, 줄 간격 1.12배 |
| `climate_bundle` | {"note": "공조 사진 컷(라벨에 「공조」)에서 그 컷 대본이 말한 기능만 Fluent 3D 아이콘 한 줄. 자리 = 공조 부위 상자(OWLv2 climate) 위에서 20% 높이 — 송풍구(바람이 나오는 곳) 위, 터치 버튼은 가리지 않음. 크기는 상자 폭 × 0.13(90~170px). 말하지 않은 기능은 띄우지 않음(필수 검사 없음). 2026-11-18 사용자 「공조에서 나오는 거」 · 바람은 💨(송풍구에서 나오는 바람, 🌬️ 얼굴 그림은 쓰지 않음), 아이콘 간격 1.4배(그림자까지 안 붙게)", "label_words": ["공조"], "part": "climate", "icon_fit": [0.13, 90, 170], "row_v": 0.2, "features": [{"id": "temp", "name": "온도", "emo": "🌡️", "keywords": ["온도"]}, {"id": "fan", "name": "바람", "emo": "💨", "keywords": ["바람", "풍량", "송풍"]}, {"id": "heat", "name": "열선", "emo": "🔥", "keywords": ["열선", "히팅"]}, {"id": "vent", "name": "통풍", "emo": "❄️", "keywords": ["통풍"]}, {"id": "ac", "name": "에어컨", "emo": "❄️", "keywords": ["에어컨", "냉방"]}], "row_gap": 1.4} |
| `icon_sfx` | {"note": "자동 아이콘(Fluent 3D 이모지)이 톡 나타날 때 팝. 칩 팝(0.40)보다 작게, 0.45초 안에 다른 소리가 있으면 생략. 사진 쇼츠만(SFX_RICH). 2026-11-18 사용자", "name": "pop", "vol": 0.3} |
| `mileage_circle` | {"note": "2026-11-18 사용자 규칙(v1.7.2 고침): 원은 칩이 아니라 사진 속 진짜 계기판 주행거리 숫자에 친다. 컷에 쓰는 사진을 글자 인식(RapidOCR)으로 읽어 매물 주행거리와 같은 숫자(어림 값은 ±2%)가 보일 때만, 그 사진 컷에서 주행거리를 말하는 순간(그 컷에서 말하지 않으면 컷 시작 0.4초 뒤) 0.15초 뒤 0.4초 동안 시계 방향 손 그림, 끝 20° 겹침. 사진에서 안 읽히면 원 없음. 칩에는 원을 치지 않는다(손가락은 그대로) — odometer.py", "chip_re": "^[\\d,.]+\\s?(km\|만\\s?km)$", "color": [232, 53, 43], "width": 9, "delay": 0.15, "draw": 0.4, "overshoot_deg": 20, "pad": [30, 22]} |
| `metaphor_sfx` | {"note": "비유 효과음: 대본에서 그 낱말을 말하는 순간에만, 영상당 2개까지(목록 순서 = 우선순위), 좋은 정보에만(사고·수리 등에는 넣지 않음), 사람 목소리 소리 금지, ASMR판 제외. 겹치면 딩·팝보다 우선. 마력=말 울음은 2026-11-22 사용자 확정, 나머지 4개는 사용자 위임으로 Claude 선정(2026-11-22)", "max_per_video": 2, "min_gap_s": 1.5, "editions": ["photo", "simple", "3d"], "items": [{"name": "horse_neigh_el", "keywords": ["마력"], "vol": 0.5, "lead_s": 0.05, "what": "말 울음", "alt": "horse_neigh"}, {"name": "stopwatch", "keywords": ["제로백"], "vol": 0.6, "lead_s": 0.0, "what": "스톱워치 딸깍"}, {"name": "coin", "keywords": ["연비"], "vol": 0.45, "lead_s": 0.05, "what": "돼지저금통 동전"}, {"name": "fire_crackle", "keywords": ["열선"], "vol": 0.45, "lead_s": 0.05, "what": "장작 타닥"}, {"name": "ice_clink", "keywords": ["통풍"], "vol": 0.45, "lead_s": 0.05, "what": "얼음 달그랑"}]} |

### 3-2. rules

- 매물 옵션 목록에 있고 required=true면 대본에 그 옵션 문장이 있어야 한다(없으면 검사 실패).
- 그 부위가 보이는 사진이 있으면 그 컷에서 말하고 그 부위 옆에 visual을 띄운다. 사진이 없으면 실내 일반 컷에 노랑 칩으로만(그림 없음). 다른 부위 사진에 그림을 얹지 않는다.
- visual 글자의 값({inch} {liters} {brand} {light_type} {material} 등)은 매물 정보에서만. 값이 없으면 그 그림은 빼고 말도 하지 않는다.
- 시트 3종(열선·통풍·마사지)은 같은 시트 사진에 낱말을 말할 때마다 하나씩 옆으로 쌓는다(🔥 → ❄️ → 💆, 간격 = 아이콘 1.1배).
- 3D 글자 높이: 숫자(인치·리터·마력) = 화면 10%, 낱말(브랜드·라이트 종류·재질) = 6%, 단위는 숫자의 0.5배.
- 위치: 부위 상자 위(2% 띄움) → 자리가 없으면 옆. 부위·자막 띠·아래 딜러 띠를 가리지 않는다.
- 이모지는 Microsoft Fluent 3D만(fluent3d/ 폴더, 없으면 렌더 중단). 3D 글자는 text3d().
- 휠 인치는 휠 크기에 맞춘다: 글자 높이 = 휠 상자 높이 × 0.12(70~150px).
- 시트 사진이 있고 매물에 재질·열선·통풍·마사지·메모리가 있으면: 그 시트 컷에서 반드시 말로 설명하고(대본 검사 ⛔) 등받이 위에 아이콘 줄을 띄운다. 크기·위치는 OWLv2 등받이 상자에 맞춘다. 재질 값이 없으면 글자는 빼고 말도 하지 않는다.
- 대본의 숫자 치수는 예외(첫 컷·세대·날짜·이미 칩/그림에 있음)가 아니면 그 컷 칩 아래에 3D 글자로 띄운다(화면 높이 7%).

### 3-3. numbers_on_screen

| 규칙 | 값 |
|---|---|
| `why` | 사용자 지시 2026-11-18: 숫자 치수는 별다른 예외가 없으면 화면에 표기(「뒷좌석 40:20:40」이 말로만 지나감) |
| `rule` | 대본에서 숫자로 시작하는 낱말은 그 컷 화면에 3D 글자로 띄운다. 그 컷의 칩·자동 그림에 같은 값(±5%, 「3만 2천」≈32,770 포함)이 있으면 생략. |
| `skip_first_cut` | True |
| `skip_first_cut_note` | 첫 컷은 제목 카드(제조사·모델·등록월)가 맡음 |
| `skip_token_re` | ^\d+(세대\|년\|월\|일\|시\|분\|번째)$ |
| `skip_note` | 세대·날짜·순서는 표기 안 함. V6·G80처럼 글자로 시작하는 모델명도 안 함(숫자로 시작하는 낱말만) |
| `count_suffix` | ["개", "대", "장", "석"] |
| `units` | [["인치", "\""], ["리터", " L"], ["L", " L"], ["km", "km"], ["킬로", "km"], ["마력", " 마력"], ["kg", "kg"], ["cc", "cc"], ["방향", "방향"], ["단", "단"], ["인승", "인승"], ["개", "개"], ["만원", "만원"]] |
| `join` | 붙은 숫자 낱말은 한 글자로: 「40대 20대 40」 → 40 : 20 : 40, 「7인치 화면 2개」 → 7" x2 |
| `h_pct` | 7 |
| `place` | 그 숫자가 말하는 부위에 붙인다: 숫자 앞뒤 part_window(3) 낱말 안에서 가장 가까운 부위 낱말(part_words) → OWLv2 부위 상자. 큰 부위(시트·트렁크)는 상자 안 45%, 작은 부위는 부위 바로 위. 부위 낱말이 없으면 칩 아래 가운데. 2026-11-18 사용자 「숫자 위치 매핑해라, 벗어난다」. 우선순위: 같은 문장의 주어(「계기판은 … 7인치 화면 2개」 → 계기판, 「뒷좌석은 40대 20대 40」 → 시트) → 앞뒤 3낱말 안 가장 가까운 부위 낱말 |
| `max_per_cut` | 1 |
| `part_window` | 3 |
| `inside_parts` | ["backrest", "trunk"] |
| `part_words` | {"backrest": ["시트", "좌석", "뒷자리", "폴딩", "접힙"], "trunk": ["트렁크", "적재"], "gauge": ["계기판", "회전계", "클러스터"], "screen": ["화면", "스크린", "디스플레이", "모니터"], "wheel": ["휠", "타이어"], "steering": ["핸들", "스티어링"], "climate": ["공조", "온도"], "speaker": ["스피커"], "roof": ["루프"]} |
| `fit_w` | 0.5 |
| `min_h` | 64 |
| `fit_note` | 2026-11-18 사용자 「뒷좌석 숫자 커, 밸런스」: 부위에 붙는 숫자는 글자 폭이 그 부위의 화면상 폭 × 0.5를 넘지 않게 줄인다(높이 최대 화면 7%, 최소 64px). 「40 : 20 : 40」처럼 긴 숫자가 등받이를 다 덮지 않게 |

### 3-4. narration_rules

| 규칙 | 값 |
|---|---|
| `transmission` | {"note": "나세르 아랍어 SRT 학습(nl4FQm7O_IQ · xcIPOQMeCE0 · uk669ncgHlQ): 변속기는 엔진(배기량·터보·마력) 바로 뒤나 기어가 보이는 컷에서 한 마디로 말한다", "pattern": "[N]단 [방식] [+ 조작/이유 한 낱말]", "examples_ar": ["متوصلين بفتيس دي سي تي سبع سرعات بالبادل شيفترز (7단 DCT, 패들시프트)", "متوصل بفتيس كريستال دي سي تي سبع سرعات مبلل عشان الاعتمادية (7단 습식 DCT, 내구성 때문에)", "تيست ثمان سرعات (콘솔 화면에서 8단만)"], "placement": ["기어 레버·콘솔 사진 컷이 있으면 그 컷 첫 문장", "없으면 엔진·마력 문장 바로 뒤"], "chip": "{N}단 {방식}", "mark": "⚙️", "source_required": "매물 정보 또는 제조사 공식 제원 · cfg 주석에 출처", "no_guess": ["패들시프트는 매물 옵션이나 사진에 보일 때만", "습식/건식 등 이유는 공식 자료에 있을 때만"]} |
| `codename` | {"note": "2026-11-18 사용자 확정: 「구와이영」처럼 숫자를 한자어로 읽으면 모른다. 대본은 「N세대 모델에 코드네임 ○○○입니다」, 코드네임은 영어로 한 글자씩(9Y0 → 나인와이제로). 자막·칩은 원래 표기(3세대 · 9Y0). BMW·벤츠·포르쉐만.", "pattern": "{N}세대 모델에 코드네임 {영어 읽기}입니다", "caption": "{N}세대 · {코드}", "code": "pronounce.py codename_ko / generation_line", "makers": ["BMW", "벤츠", "포르쉐"]} |

### 3-5. 옵션 표시 코드(FM-*)

옵션 표시(FM-*) 코드는 option_visual_rules.json 의 options[].id 를 대문자로 바꿔 붙인다(seat_heat → FM-SEAT-HEAT). 묶음 표시는 아래.

| 코드 | 이름 | 모습 | 구현 |
|---|---|---|---|
| FM-SEAT-BUNDLE | 시트 묶음(재질 + 열선·통풍·마사지·메모리) | 시트 등받이 위에 🔥❄️💆💾 한 줄 + 재질 3D 글자 | `scripts/shortform/photo_listing/auto_visuals.py:_seat_bundle` |
| FM-CLIMATE-BUNDLE | 공조 묶음 | 공조 화면 위 🌬️ + N존 | `scripts/shortform/photo_listing/auto_visuals.py:_climate_bundle` |

## 4. 편집 방법 전체 (구성·기법·자산)

| 코드 | 종류 | 분류 | 이름 | 판 | 상태 | 하는 일 | 보이는 모습 | 구현 · 규칙 | 참고(S=AS24 스킬, T=옵션 기법) |
|---|---|---|---|---|---|---|---|---|---|
| SG-INTRO-EMBLEM | 구성 | 첫 화면 | 엠블럼 확대 → 제목 | PHOTO | 구현 | 첫 컷에서 사진 속 엠블럼을 확대한 뒤 제조사·모델·연식 제목 | 0~3초, 차 앞 사진이 확대되며 노랑 칩(제조사) + 흰 큰 모델명 + 아래 한 줄(등록·주행) | `scripts/shortform/photo_listing/common.py:base_frame` | S041 |
| SG-INTRO-IMPACT | 구성 | 첫 화면 | 첫 컷 임팩트(로고·모델명 현란 등장) | SIMPLE 3D ASMR | 계획 | 브랜드 로고와 모델명이 나세르식으로 현란하게 등장 | 0~2초, 로고가 튀어나오고 모델명이 글자별로 쌓임, 효과음 동반 |  | S016, S017, S049 |
| SG-CARD-BASIC | 구성 | 카드 정보 | 차량 기본 정보 카드 | PHOTO SIMPLE 3D ASMR | 일부 | 등록·주행·연료·변속기·배기량(마력)·색상 최대 6줄 카드. 사진판은 2번째 컷 고정 | 2번째 컷, 뒤 45° 사진 위 카드, 대사는 등록·주행만 | `scripts/shortform/photo_listing/common.py:icon_chip` | S026 |
| SG-CARD-INSPECT | 구성 | 카드 정보 | 성능점검 카드 | PHOTO SIMPLE 3D ASMR | 계획 | 성능점검 기록 요약 카드 | 독립 컷 카드 |  |  |
| SG-CARD-INSURE | 구성 | 카드 정보 | 보험이력 카드 | PHOTO SIMPLE 3D ASMR | 계획 | 카히스토리 보험이력 요약(내 차·상대 차 피해, 소유자 변경). 「무사고」 표현 금지 | 독립 컷 카드 |  |  |
| SG-CARD-SPEC | 구성 | 카드 정보 | 제원 카드 | PHOTO SIMPLE 3D ASMR | 계획 | 마력·토크·제로백·크기 등 제원 요약 카드 | 독립 컷 카드 |  |  |
| SG-CATALOG | 구성 | 카탈로그 | 카탈로그 컷 | PHOTO SIMPLE 3D | 일부 | 독립 컷에 제조사 카탈로그 이미지 + 요약. 「제조사 이미지」 표시 필수, 딜러 사진에 없는 옵션만 | 실차 사진이 아닌 깨끗한 공식 사진, 위에 작은 「제조사 이미지」 꼬리표 | `scripts/shortform/photo_listing/common.py:official_layer` |  |
| SG-DEALER-TALK | 구성 | 딜러 | 딜러 설명 컷 | SIMPLE 3D | 계획 | 딜러가 등장해 차를 설명하는 독립 컷. 딜러 말을 받아써서 자막·칩 | 사람 얼굴이 나오고 가슴 높이에 이름표 |  | S033, S035 |
| SG-EXHAUST | 구성 | 소리 | 배기음 컷 | SIMPLE 3D ASMR | 관찰 | 배기음만 들려주는 독립 컷. 이 컷 동안 배경음악 끔, 칩 하나 | 뒤쪽·배기구 장면, 🔊 또는 「V8 배기음」 칩, 음악 꺼짐 |  | S012 |
| SG-ODOMETER | 구성 | 신뢰 | 계기판 주행거리 확인 | PHOTO SIMPLE | 일부 | 계기판 사진을 확대하고 주행거리 숫자에 우리 원형 칠(테마 바탕색_38_43) | 계기판 확대, 주행거리 숫자 뒤 노랑 원형 칠 + 숫자 칩 | `scripts/shortform/photo_listing/common.py:odometer_layer` |  |
| SG-SECTION | 구성 | 구성 | 구간 제목 | PHOTO | 구현 | 외관·실내 등 구간이 바뀔 때 위쪽 작은 제목 | 화면 위 작은 글자 띠 | `scripts/shortform/photo_listing/common.py:section_layer` |  |
| SG-END-DEALER | 구성 | 마무리 | 딜러 엔딩 · 앱 안내 | PHOTO SIMPLE 3D ASMR | 구현 | 마지막 장면 어둡게 + 보배드림 엔드카드 커짐 + 딜러 로고/상사명 + 앱 안내 | 끝 2초, 로고가 작게→크게 | `scripts/shortform/photo_listing/common.py:overlay` | S030, S050 |
| CAP-KARAOKE | 기법 | 자막 | 말 자막(낱말 따라 색 바뀜) | PHOTO SIMPLE 3D | 구현 | 2~5어절 덩어리, 말하는 낱말만 노랑. 바탕 칠 없음 | 화면 아래쪽 흰 글자 + 검정 테두리, 한 낱말씩 노랑 | `scripts/shortform/sag_reel_v1.py:phrase_img_be3` · `scripts/shortform/be_locked_rules.json#caption` | S038, S039 |
| CAP-HOOK-TITLE | 기법 | 자막 | 첫 화면 제목 | PHOTO SIMPLE 3D ASMR | 구현 | 제조사 칩 + 흰 큰 모델명 + 아래 한 줄. 제조사 칩만 벨기에 원본 판(노션 테마 바탕색 430_239, 판 자체가 6.9° 기울어 있음)·좌우 여백 좁게, 글자는 수평(chip.title_plate, 영상판 적용 · 사진판 다음) | 첫 3초 가운데 위 | `scripts/shortform/photo_listing/common.py:base_frame` | S041 |
| CAP-ASMR-WORD | 기법 | 자막 | ASMR 낱말 칩 | ASMR | 계획 | 내레이션 대신 사실 낱말만(「시동」·「V8 배기음」) | 소리 장면마다 칩 하나 |  | S032 |
| CHIP-POINT | 기법 | 칩 | 포인트 칩 | PHOTO SIMPLE 3D | 일부 | 말한 낱말을 칠 판 위 검정 글자로. 모든 칩 같은 크기·같은 자리 | 화면 위쪽 고정 자리 노랑 칠 판, 기울기 없음 | `scripts/shortform/photo_listing/common.py:be_chip` · `scripts/shortform/be_locked_rules.json#chip` | S008, S001 |
| CHIP-NUMBER | 기법 | 칩 | 큰 숫자 칩 | PHOTO SIMPLE 3D | 구현 | 숫자(가격·주행·마력)를 크게, 그동안 말 자막 숨김 | 화면 28% 높이 큰 숫자 칩 | `scripts/shortform/photo_listing/common.py:is_num_chip` | S004, S006 |
| CHIP-ICON3D | 기법 | 칩 | 칩 옆 3D 아이콘 | PHOTO SIMPLE 3D | 구현 | 칩 오른쪽 끝에 Fluent 3D 이모지(칩에 붙은 것만 허용) | 칩 오른쪽 입체 아이콘 | `scripts/shortform/photo_listing/common.py:icon_chip` |  |
| CHIP-DEALER | 기법 | 칩 | 딜러 칩 · 하단 띠 | PHOTO SIMPLE 3D ASMR | 구현 | 상사·딜러 이름을 칩 또는 화면 아래 띠로 | 왼쪽 위 흰 알약 로고 또는 아래 띠 | `scripts/shortform/photo_listing/common.py:footer_layer` | S046 |
| CHIP-TAG | 기법 | 칩 | 부위 꼬리표 | PHOTO SIMPLE | 구현 | 부위 옆에 붙는 작은 이름표 | 부위 옆 작은 칩 | `scripts/shortform/photo_listing/common.py:tag_layer` | S007 |
| CHIP-PRICEDROP | 기법 | 칩 | 가격 인하 칩 | PHOTO SIMPLE 3D ASMR | 관찰 | 옛 가격에 빨강 X, 아래 새 가격 | 가격 칩 두 줄, 위 줄 X |  | S011 |
| LIST-CHECK | 기법 | 목록 | 옵션 체크 목록 | PHOTO SIMPLE 3D | 일부 | 옵션을 말할 때마다 ✓ 한 줄씩, 최대 3줄. 적극 도입(2026-11-22) | 칩 아래 ✓ 줄이 하나씩 늘어남 | `scripts/shortform/video_listing/feature_edit_planner.py` | T02, S002, S003, S045 |
| MARK-POINTER | 기법 | 기호 | 손가락·화살표 포인터 | PHOTO SIMPLE 3D | 구현 | 부위를 가리키는 손가락 또는 화살표 1개(노션 원본만) | 부위로 날아와 톡 누르는 손가락 | `scripts/shortform/photo_listing/common.py:pointer_layer` | S020, S035 |
| MARK-DIM-LINE | 기법 | 기호 | 치수선 | PHOTO SIMPLE | 구현 | 트렁크 용량·길이를 치수선과 숫자로 | 차 옆 <---> 화살표 + 숫자 | `scripts/shortform/photo_listing/common.py:dim_layer` | S015 |
| MARK-RED-X | 기법 | 기호 | 빨강 X 부정 |  | 관찰 | 부정할 때 대상 위 빨강 X | 빨강 X |  | S010 |
| MARK-SPARKLE | 기법 | 기호 | 반짝이 |  | 금지 | 빛나는 부위에 ✨ | 반짝이 |  | S031 |
| MARK-LOOSE-EMOJI | 기법 | 기호 | 따로 뜨는 이모지 스티커 |  | 금지 | 부위나 칩에 붙지 않고 툭 뜨는 이모지 | 화면 빈 곳 이모지 |  | S013 |
| FX-TEXT3D | 기법 | 3D | 3D 글자 | PHOTO SIMPLE 3D | 구현 | 숫자·재질·인치 등을 입체 글자로(부위 위) | 부위 위 두꺼운 입체 글자 | `scripts/shortform/photo_listing/common.py:text3d` |  |
| FX-NUMBER3D | 기법 | 3D | 숫자 화면 표기 | PHOTO SIMPLE 3D | 구현 | 대본 숫자를 칩 아래 3D 글자로(한 컷 1개, 칩과 같은 값은 생략) | 칩 아래 가운데 3D 숫자 | `scripts/shortform/photo_listing/auto_visuals.py:_numbers_on_screen` · `scripts/shortform/photo_listing/option_visual_rules.json#numbers_on_screen` |  |
| FX-CALLOUT-3D | 기법 | 3D | 부위 3D 말풍선 | 3D | 계획 | 부위를 따라가는 입체 말풍선(나세르식) | 부위에서 선이 나와 말풍선 | `scripts/shortform/egypt_3d_callout_sample.py:draw_callout` |  |
| MOVE-KENBURNS | 기법 | 움직임 | 켄번스 | PHOTO | 구현 | 사진을 천천히 확대·이동(가속 부드럽게) | 정지 사진이 천천히 다가오거나 옆으로 흐름 | `scripts/shortform/photo_listing/common.py:frame_of` |  |
| MOVE-PARTZOOM | 기법 | 움직임 | 부위 당기기 | PHOTO SIMPLE | 구현 | 그 부위를 말할 때 그 부위로 확대(라벨 부위 우선) | 계기판·화면·시트로 화면이 다가감 | `scripts/shortform/photo_listing/part_zoom.py:build` · `scripts/shortform/photo_listing/part_zoom_rules.json` | T08 |
| MOVE-FIT-BLURFILL | 기법 | 움직임 | 차 전체 맞춤 + 흐린 채움 | PHOTO | 구현 | 가로 사진의 차 전체를 보이고 위아래는 같은 사진 흐리게 | 가운데 선명한 가로 사진, 위아래 흐림 | `scripts/shortform/photo_listing/common.py:fit_frame` |  |
| MOVE-PUNCH | 기법 | 움직임 | 펀치 확대 | PHOTO | 구현 | 강조 낱말에 순간 확대 | 화면이 툭 커짐 | `scripts/shortform/photo_listing/common.py:punch` |  |
| MOVE-JUMPCUT | 기법 | 움직임 | 점프컷 | SIMPLE 3D | 구현 | 제원 낱말 3개 이상 이어 말할 때 계단식 확대 | 같은 장면이 단계별로 커짐 | `scripts/shortform/video_listing/feature_edit_planner.py` | T03 |
| MOVE-COUNTUP | 기법 | 움직임 | 숫자 카운트업 | PHOTO SIMPLE 3D | 일부 | 큰 숫자가 0부터 올라감 | 숫자가 빠르게 증가 | `scripts/shortform/video_listing/feature_edit_planner.py` | T04, S005 |
| MOVE-SHAKE | 기법 | 움직임 | 마력 흔들림 | SIMPLE 3D | 구현 | 마력 말할 때 화면 흔들림 + 말 울음 | 화면 떨림 | `scripts/shortform/video_listing/feature_edit_planner.py` | T07 |
| MOVE-TRACK | 기법 | 움직임 | 부위 따라가기 | SIMPLE 3D | 일부 | 움직이는 영상에서 부위 위치를 따라가 칩·표시를 붙임 | 칩이 부위와 함께 움직임 | `scripts/shortform/video_listing/g350_track.py` |  |
| TR-WHIP | 기법 | 컷 넘김 | 휙 넘김(좌·우) | PHOTO | 구현 | 가로 밀기 + 모션 블러 0.30초 | 옆으로 번지며 넘어감 | `scripts/shortform/photo_listing/common.py:_base_frame` |  |
| TR-PUSH-UP | 기법 | 컷 넘김 | 위로 밀기 | PHOTO | 구현 | 위로 밀며 넘어감 0.30초 | 아래에서 다음 장면이 올라옴 | `scripts/shortform/photo_listing/common.py:_base_frame` |  |
| TR-ZOOM | 기법 | 컷 넘김 | 확대 넘김 | PHOTO | 구현 | 확대 + 흐림 + 섬광 0.40초 | 빨려 들어가며 넘어감 | `scripts/shortform/photo_listing/common.py:_base_frame` |  |
| TR-FLASH | 기법 | 컷 넘김 | 흰 섬광 | PHOTO | 구현 | 흰 섬광 0.30초(가격 컷) | 하얗게 번쩍 | `scripts/shortform/photo_listing/common.py:_base_frame` |  |
| TR-BLUR | 기법 | 컷 넘김 | 흐림 교차 | PHOTO | 구현 | 흐려지며 교차 0.45초(마지막 컷) | 흐려지며 바뀜 | `scripts/shortform/photo_listing/common.py:_base_frame` |  |
| TR-FADE | 기법 | 컷 넘김 | 페이드(페이드판) | PHOTO | 구현 | 모든 넘김을 0.5초 페이드, 휙 효과음 없음 | 부드럽게 겹치며 바뀜 | `scripts/shortform/photo_listing/common.py:_base_frame` |  |
| TR-CUT | 기법 | 컷 넘김 | 바로 자르기 | SIMPLE ASMR | 구현 | 효과 없이 바로 다음 장면 | 즉시 바뀜 | `scripts/shortform/video_listing/g350_v8_render.py` |  |
| TR-SPLIT2 | 기법 | 컷 넘김 | 위아래 2분할 | SIMPLE 3D | 구현 | 동작(위)과 결과(아래)를 한 화면에 | 가운데 흰 선으로 위아래 두 장면 | `scripts/shortform/video_listing/feature_edit_planner.py` | T01, S047 |
| INS-MAGNIFIER | 기법 | 화면 삽입 | 돋보기 원 | PHOTO SIMPLE 3D | 일부 | 작은 버튼을 원 안에 크게 | 동그란 확대 창 | `scripts/shortform/video_listing/feature_edit_planner.py` | T06 |
| INS-SPOTLIGHT | 기법 | 화면 삽입 | 스포트라이트 | SIMPLE 3D | 구현 | 빛나는 부위만 밝게, 나머지 어둡게 | 주변이 어두워지고 라이트만 밝음 | `scripts/shortform/video_listing/feature_edit_planner.py` | T05 |
| SFX-DING | 기법 | 효과음 | 딩 | PHOTO SIMPLE 3D | 구현 | 칩·큰 숫자 등장 0.02초 전 | (소리) 맑은 딩 | `scripts/shortform/photo_listing/common.py:_sfx_plan` · `scripts/shortform/be_locked_rules.json#sfx` |  |
| SFX-WHOOSH | 기법 | 효과음 | 휙 | PHOTO SIMPLE 3D | 구현 | 휙 넘김 0.16초 전 | (소리) 바람 소리 | `scripts/shortform/photo_listing/common.py:_sfx_plan` |  |
| SFX-POP | 기법 | 효과음 | 팝 | PHOTO SIMPLE 3D | 구현 | 옵션 표시(이모지·3D 글자) 등장 | (소리) 톡 | `scripts/shortform/photo_listing/common.py:_sfx_plan` |  |
| SFX-CLICK | 기법 | 효과음 | 클릭 | PHOTO SIMPLE 3D | 구현 | 화면·버튼 표시 등장 | (소리) 딸깍 | `scripts/shortform/photo_listing/common.py:_sfx_plan` |  |
| SFX-CONTEXT | 기법 | 효과음 | 문맥 효과음 | PHOTO SIMPLE 3D | 일부 | 말 울음(마력) 등 낱말 뜻에 맞는 소리 | (소리) 말 울음 등 | `scripts/shortform/video_listing/feature_edit_planner.py` | T07 |
| SFX-HORSE | 기법 | 효과음 | 말 울음(마력) | PHOTO SIMPLE 3D | 일부 | 대본에서 '마력'을 말하는 순간 말 울음소리, 영상당 1번. 앞뒤 0.45초 안의 딩은 빼고 말 울음이 우선 | (소리) 말 울음 약 1.9초 | `scripts/shortform/photo_listing/common.py:_metaphor_sfx` · `scripts/shortform/photo_listing/option_visual_rules.json#layout.metaphor_sfx` |  |
| SFX-METAPHOR | 기법 | 효과음 | 비유 효과음 묶음 | PHOTO SIMPLE 3D | 일부 | 낱말 뜻을 소리로: 마력=말 울음 · 제로백=스톱워치 · 연비=동전 · 열선=장작 · 통풍=얼음. 말한 순간에만, 영상당 2개, 좋은 정보에만 | (소리) 말·스톱워치·동전·장작·얼음 | `scripts/shortform/photo_listing/common.py:_metaphor_sfx` · `scripts/shortform/photo_listing/option_visual_rules.json#layout.metaphor_sfx` |  |
| BGM-SHOWROOM | 기법 | 음악·음성 | 배경음악 + 말할 때 줄이기 | PHOTO SIMPLE 3D | 구현 | 자체 음악, 목소리 나오면 줄임 | (소리) 잔잔한 음악 | `scripts/shortform/photo_listing/common.py:mix_audio` |  |
| VO-TTS | 기법 | 음악·음성 | AI 내레이션 | PHOTO SIMPLE 3D | 구현 | 일레븐랩스 남성 영업 톤, 1.1배, 합니다체 | (소리) 내레이션 | `scripts/shortform/photo_listing/tr.py` |  |
| AUD-LOUDNORM | 기법 | 음악·음성 | 음량 맞춤 | PHOTO SIMPLE 3D ASMR | 구현 | −14 LUFS, 최고 −1.5 | (측정값) | `scripts/shortform/photo_listing/common.py:mix_audio` · `scripts/shortform/be_locked_rules.json#audio` |  |
| AS-PLATE-CHIL-103x33 | 자산 | 칠 판 | 칠 판 103×33(기울기 없음) | PHOTO SIMPLE 3D | 일부 | 포인트 칩 바탕 | 노랑 칠 판 | `public/assets/shortform/brush-fill/as24-theme/103_33.svg` |  |
| AS-PLATE-CHIL-38x43 | 자산 | 칠 판 | 원형 칠 38×43 | PHOTO SIMPLE | 계획 | 계기판 주행거리 원 | 노랑 원형 칠 |  |  |
| AS-BRUSH-TAPE | 자산 | 칠 판 | 붓 테이프(기울어진 띠) |  | 금지 | 예전 포인트 칩 바탕 | 기울어진 노랑 붓띠 | `scripts/shortform/brushfill.py:brush_mask` |  |
| AS-FLUENT3D | 자산 | 아이콘 | Fluent 3D 이모지 | PHOTO SIMPLE 3D | 구현 | 칩 옆·옵션 표시 아이콘 | 입체 이모지 | `scripts/shortform/photo_listing/common.py:fluent_emoji` |  |
| AS-SFX-DING | 자산 | 효과음 | ding.wav |  | 구현 |  |  | `public/assets/shortform/sfx/ding.wav` |  |
| AS-SFX-WHOOSH | 자산 | 효과음 | whoosh.wav |  | 구현 |  |  | `public/assets/shortform/sfx/whoosh.wav` |  |
| AS-SFX-POP | 자산 | 효과음 | pop.wav |  | 구현 |  |  | `public/assets/shortform/sfx/pop.wav` |  |
| AS-SFX-CLICK | 자산 | 효과음 | click.wav |  | 구현 |  |  | `public/assets/shortform/sfx/click.wav` |  |
| AS-SFX-HORSE | 자산 | 효과음 | horse_neigh.wav |  | 구현 | Freesound 521246 'Horse' (poodaddy69), CC0 1.0 — 앞뒤 무음 자르고 최고 -1dB로 맞춤 |  | `public/assets/shortform/sfx/horse_neigh.wav` |  |
| AS-SFX-HORSE-EL | 자산 | 효과음 | horse_neigh_el.wav |  | 구현 | 말 울음 — 일레븐랩스 생성. 섞은 영상으로만 사용 |  | `public/assets/shortform/sfx/horse_neigh_el.wav` |  |
| AS-SFX-STOPWATCH | 자산 | 효과음 | stopwatch.wav |  | 구현 | 스톱워치 — 일레븐랩스 생성. 섞은 영상으로만 사용 |  | `public/assets/shortform/sfx/stopwatch.wav` |  |
| AS-SFX-COIN | 자산 | 효과음 | coin.wav |  | 구현 | 동전 — 일레븐랩스 생성. 섞은 영상으로만 사용 |  | `public/assets/shortform/sfx/coin.wav` |  |
| AS-SFX-FIRE | 자산 | 효과음 | fire_crackle.wav |  | 구현 | 장작 — 일레븐랩스 생성. 섞은 영상으로만 사용 |  | `public/assets/shortform/sfx/fire_crackle.wav` |  |
| AS-SFX-ICE | 자산 | 효과음 | ice_clink.wav |  | 구현 | 얼음 — 일레븐랩스 생성. 섞은 영상으로만 사용 |  | `public/assets/shortform/sfx/ice_clink.wav` |  |
| AS-SFX-ENGINE | 자산 | 효과음 | engine_start.wav |  | 구현 | V8 시동·회전 — 일레븐랩스 생성(배기음 컷 예비). 섞은 영상으로만 사용 |  | `public/assets/shortform/sfx/engine_start.wav` |  |
| AS-SFX-DOOR | 자산 | 효과음 | door_close.wav |  | 구현 | 문 닫힘 — 일레븐랩스 생성(예비). 섞은 영상으로만 사용 |  | `public/assets/shortform/sfx/door_close.wav` |  |
| AS-SFX-BEEP | 자산 | 효과음 | beep_on.wav |  | 구현 | 기능 켜짐 전자음 — 일레븐랩스 생성(예비). 섞은 영상으로만 사용 |  | `public/assets/shortform/sfx/beep_on.wav` |  |
| AS-SFX-IMPACT | 자산 | 효과음 | impact.wav |  | 구현 | 강조 임팩트 — 일레븐랩스 생성(예비). 섞은 영상으로만 사용 |  | `public/assets/shortform/sfx/impact.wav` |  |
| AS-BGM-SUPERCAR | 자산 | 음악·음성 | bobae_supercar_v1.mp3 |  | 구현 | 슈퍼카 배경음 45초 — 일레븐랩스 음악 |  | `public/assets/shortform/bgm/bobae_supercar_v1.mp3` |  |
| AS-BGM-LUXURY | 자산 | 음악·음성 | bobae_luxury_v1.mp3 |  | 구현 | 고급 세단 배경음 45초 — 일레븐랩스 음악 |  | `public/assets/shortform/bgm/bobae_luxury_v1.mp3` |  |
| AS-BGM-SHOWROOM | 자산 | 음악 | bobae_showroom_v1.mp3 |  | 구현 |  |  | `public/assets/shortform/bgm/bobae_showroom_v1.mp3` |  |
| SG-QUIZ-HOOK | 구성 | 첫 화면 | 퀴즈 첫 화면 | PHOTO SIMPLE 3D | 관찰 | 첫 1~2초 「이 차 얼마일까요?」「몇 마력일까요?」 질문으로 시작, 마지막에 정답 | 첫 화면 큰 노랑 질문 글자 + 3초 카운트 |  | S025 |
| SG-REVEAL | 구성 | 첫 화면 | 덮개·가림 공개 | SIMPLE 3D | 관찰 | 가려 둔 차를 공개하며 퀴즈 정답 | 검정 가림막이 걷히거나 흐림이 풀리며 차가 드러남 |  | S037 |
| SG-THIS-OR-THAT | 구성 | 첫 화면 | 둘 중 하나 | PHOTO SIMPLE 3D | 관찰 | 두 선택지를 위아래로 두고 고른 쪽을 노랑으로 | 위아래 두 줄, 한쪽이 노랑으로 바뀜 |  | S027 |
| SG-SERIES-TITLE | 구성 | 첫 화면 | 시리즈 타이틀 카드 | PHOTO SIMPLE 3D ASMR | 관찰 | 정기 코너 첫 화면: 진한 둥근 판 + 원 아이콘 + 코너 이름 + 로고 1~2초 | 가운데 진한 둥근 판, 코너 이름 |  | S052 |
| SG-EXPLAIN-ART | 구성 | 설명 | 설명용 그림 컷 | PHOTO SIMPLE 3D | 관찰 | 서비스·제도(안전 거래·이전 서류 등)를 그림 컷 + 초록 체크로 설명 | 일러스트 컷, 체크가 그려지며 나타남 |  | S048 |
| SG-HOST-PLAIN | 구성 | 설명 | 단색 배경 진행자 | SIMPLE | 관찰 | 차 없는 공지·서비스 설명 영상: 브랜드색 배경 앞 진행자 | 단색 배경 + 사람 상반신 |  | S051 |
| SG-SPLIT3 | 구성 | 구성 | 세로 3분할 | PHOTO SIMPLE 3D | 관찰 | 외관·실내·뒤를 한 화면에 3칸 + 가운데 칩 | 화면이 세로 3칸으로 나뉨, 가운데 칩 |  | S023 |
| INS-COMPARE-CARD | 기법 | 화면 삽입 | 비교 차 카드 | PHOTO SIMPLE 3D | 관찰 | 다른 차와 비교할 때 흰 카드(차 사진·차명·가격)를 테이프로 붙임 | 화면 45% 폭 흰 카드가 테이프로 붙음, 1.2초 |  | S018 |
| INS-PHONE-APP | 기법 | 화면 삽입 | 폰 앱 화면 | PHOTO SIMPLE 3D | 관찰 | 앱 사용법·시세 조회를 폰 화면으로 보여줌 | 화면 58% 높이 폰 화면, 버튼 동그라미 |  | S019 |
| INS-LISTING-CARD | 기법 | 화면 삽입 | 매물 카드 | PHOTO SIMPLE 3D ASMR | 관찰 | 매물 하나를 사진·가격 카드로 | 매물 목록 카드 모양 1.2초 |  | S021 |
| INS-WEB-WINDOW | 기법 | 화면 삽입 | 웹 창 | PHOTO SIMPLE 3D | 관찰 | 사이트 화면을 창으로 삽입 | 브라우저 창 모양 1.2초 |  | S022 |
| CAP-EXCLAIM | 기법 | 자막 | 감탄 큰 낱말 | SIMPLE 3D | 관찰 | 감탄을 말할 때 그 낱말 하나를 크게 | 글자 높이 7~9% 큰 낱말 0.8초 + 휙 |  | S009 |
| CAP-QUOTE | 기법 | 자막 | 인용 문장 카드 | SIMPLE 3D | 관찰 | 인터뷰 핵심 한 문장을 노랑 판에 크게(말한 그대로) | 화면 폭 85% 노랑 판 2~3초 |  | S053 |
| CAP-ORDINAL | 기법 | 자막 | 순번 숫자 | PHOTO SIMPLE 3D | 관찰 | 목록·순위 소개 때 큰 순번 숫자 | 큰 숫자 5·4·3… 0.8초 |  | S043 |
| CAP-PRICE-TEASE | 기법 | 자막 | 가격 예고 | PHOTO SIMPLE 3D | 관찰 | 가격 공개 직전 「가격은?」을 크게 띄워 기대감 | 0.6초 큰 「가격은?」 → 다음 순간 가격 숫자 |  | S042 |
| CHIP-STAT-ARROW | 기법 | 칩 | 통계 화살표 칩 | PHOTO SIMPLE 3D | 관찰 | 늘었다·줄었다를 화살표 + 퍼센트 작은 칩으로 | ⬇️36% ↗175% 작은 노랑 띠 0.8초 |  | S014 |
| CHIP-SWAP | 기법 | 칩 | 칩 교체 | SIMPLE 3D | 관찰 | 모드가 바뀔 때마다 같은 자리에서 ✓ 칩 글자만 교체 | 같은 자리 칩, 0.5~0.8초마다 글자 바뀜 |  | S024 |
| CHIP-FLAG | 기법 | 칩 | 국기 | PHOTO SIMPLE 3D | 관찰 | 원산지·출고 국가를 국기 아이콘으로 | 칩 옆 국기 0.8초 |  | S040 |
| MARK-SURPRISE | 기법 | 기호 | 놀람 선 | SIMPLE 3D | 관찰 | 놀라는 순간 머리 위 빨강 놀람 선 | 사람 머리 위 빨강 선 0.6초 |  | S034 |
| MARK-PRESS | 기법 | 기호 | 버튼 누름 클로즈업 | SIMPLE 3D | 관찰 | 버튼 누르는 손 클로즈업 + ✓ 기능명 | 손가락이 버튼 누름 + ✓ 칩 1초 |  | S036 |
| TR-BRUSH-WIPE | 기법 | 컷 넘김 | 붓 원 와이프 | PHOTO SIMPLE 3D | 관찰 | 다른 장면을 끼울 때 흰 화면 + 노랑 붓 원으로 넘김 | 노랑 붓 원이 화면을 덮으며 0.4초 |  | S044 |
| END-COMMENT | 기법 | 마무리 | 댓글 유도 | PHOTO SIMPLE 3D ASMR | 관찰 | 마지막에 댓글로 의견을 묻는 큰 낱말 | 마지막 2초 큰 노랑 질문 |  | S028 |
| END-FOLLOW | 기법 | 마무리 | 팔로우 유도 | PHOTO SIMPLE 3D ASMR | 관찰 | 마지막에 딜러 계정 팔로우 유도 | 마지막 2초 팔로우 문구 |  | S029 |

## 5. 바꾸는 법

1. 값은 위 원본 파일에서만 고친다. 규칙 값(`be_locked_rules.json` · `edition_lock.json`)은 사용자가 말할 때만 바꾼다.
2. 새 기법·구성은 `techniques.json`에 항목을 더하고 `python3 shortform-kit/catalog/build.py`로 검사한다.
3. 이 문서를 다시 만든다: `python3 shortform-kit/catalog/export_edit_spec.py`
4. 시트 사본을 갱신한다: `export_attr_table.py`(30~33 탭) · `export_rules_sheet.py`(40~46 탭) · `export_doc_index.py`(01 탭)
5. `shortform-kit/CHANGELOG.md` 맨 위에 한 줄, 버전 번호 규칙은 `shortform-kit/PIPELINE.md` 4장.

