# 편집 스킬 전수 목록 (2026-11-09 ~ 11-23)

2주 동안 조사하고, 영상에 실험하고, 매뉴얼로 정한 편집 스킬을 한 곳에 모았다. **영상을 만들기 전에 이 표를 먼저 연다.** 기억으로 만들지 않는다.

- 왜 만들었나(2026-11-23 사용자): 「2주간 매뉴얼로 저장하고 반복 자동 사용하려고 했던 편집 스킬들 모두 찾아 … 앞으로는 무조건 깃허브로 배포해, 그래야 버전 기록 다 남게, 제작 기술스택 등 모두 기재해」
- 계기: G350 30회 시험 1회차(`bobae_g350_r01.mp4`, 131초)가 기준 영상 G350 v13(70초)보다 나빠짐. 장면 고르기, 연식, T01·T02·T03·T06·T07·T08이 빠졌다 → [LESSONS L37](LESSONS.md)
- 버전 기록은 이 저장소 커밋과 [`CHANGELOG.md`](CHANGELOG.md)만이다. 스킬 원문도 [`skills/`](skills/)에 복사해 커밋한다(claude.ai 스킬과 같은 내용, 바꾸면 둘 다 고침).

## 0. 기준 영상(이것과 같아야 한다)

| 편집 유형 | 기준 영상 | 커밋 | 만든 코드 | 입력 |
|---|---|---|---|---|
| ED-SIMPLE 실촬영 · 벨기에 심플 | **G350 v13** `public/shortform-samples/g350-v13/g350-v13.mp4` (70초) | 771f02708 | `scripts/shortform/video_listing/g350_v8_render.py` + `g350_v5_lib.py` | `video_listing/samples/g350_input.json` · `g350_edit.json` |
| ED-PHOTO 사진 매물 | 서울오토갤러리 콰트로포르테 v6 · E250 · NX 350h (무인) | 1910010be · 02aed754a | `scripts/shortform/photo_listing/common.py` · `sag_auto.py` | 차 폴더 `cfg.py` · `listing.json` |

G350 이전 판(v09 · v10 · v11)은 `public/shortform-samples/g350-v09~v11/`에 있다. v12는 v13으로 교체됐다.

## 1. 스킬 목록 (claude.ai 스킬 = 저장소 `shortform-kit/skills/<이름>/SKILL.md`)

| # | 스킬 | 하는 일 | 마지막 결정 | 쓴 영상 |
|---|---|---|---|---|
| S1 | **bobae-be-skeleton-video-edit** | 실촬영 매물 영상을 벨기에 뼈대대로: 장면 고르기 · 브랜드 붓칠 제목 · 칩 · 3D 숫자 · T01~T08 · 자막 · 소리 · v13 비교 검사 | 11-23 | G350 v13(기준) |
| S2 | **bobae-be-rules-lock** | 벨기에판 값은 `be_locked_rules.json` 하나만, `check_be.py` 통과 전 전달 금지 | 11-19 | 전 벨기에판 |
| S3 | **as24-style-chip-edit** | AS24식 칩 · 큰 숫자 · ✓ 목록 · 효과음 · 끝 로고 배치 계획(`as24_edit_planner.py`) | 11-19 | 자동 편집 NL v1 · v2 |
| S4 | **as24-style-sfx** | AS24 효과음 규칙(빈도 · 시각 · 간격) | 11-09 → v0.4.0에서 NL 빈도 + 나세르 종류로 갱신 | sag-reel v2~v4 |
| S5 | **bobae-feature-cut-shorts** | 나세르형: 컷 하나 = 기능 하나, 음성 · 자막 · 화면 위치 맞춤 · 추적 | 11-22 | G350 v09~v13 |
| S6 | **bobae-part-stickers** | 부위(시트 · 핸들 · 화면 · 휠)에 3D 이모지 스티커 — 부위 자동 찾기로 자리 · 크기 | 11-18 | 장스 CLE · 조이모터스 |
| S7 | **bobae-part-zoom-keyframes** | 사진 매물에서 말하는 부위로 자동 당기기(정사진 방지) | 11-18 | 조이모터스 · 서울오토갤러리 |
| S8 | **bobae-seat-number-visuals** | 시트 재질 · 열선 · 통풍 · 마사지 · 메모리(+전동) 묶음, 휠 인치 + 타이어 규격 고정, 대본 숫자 화면 표기 | 11-18(전동 11-22, 휠 고정 11-22) | 콰트로포르테 v6 |
| S9 | **bobae-photo-shorts-be** | 사진 매물 → 벨기에판 30초: 켄번스 · 동적 넘김 · 노랑 붓띠 칩 · 3D/페이드 변형 · 끝 로고 | 11-22 | 조이모터스 G63 · 우루스 · SF90 · 로마 |
| S10 | **bobae-photo-listing-shorts** | 사진 매물 30초 기본 절차 v1.2(정렬 · 움직임 · 자막 · 효과음 · 검수) | 11-08 (S9가 대체) | 초기 사진판 |
| S11 | **bobae-shortform-tools** | 단계별 도구 고르기(제작기 · 음성 · 받아쓰기 · 비율 · 게시), 쓰지 않는 것 | 11-22 | — |
| S12 | **reels-speech-to-text** | 릴스 음성 → 한국어 대본(대량 · 이어 하기 · 전화번호 가림) | 11-07 | 인스타 딜러 분석 |
| S13 | **sheet-shorts-to-drive** | 시트의 쇼츠 URL → 드라이브 저장 → 시트에 링크 | 11-08 | AS24 NL · BE 200편 수집 |

## 2. 규칙 파일(값의 단일 기준)

| 무엇 | 파일 | 핵심 |
|---|---|---|
| 화면 · 소리 값 | `scripts/shortform/be_locked_rules.json` | 노랑 #F5F200 한 색 · 자막 60px y1283 · 칩 70px 기울기 0 · 제목 칩 430_239 판 · 영상판 칩 줄 300px · 효과음(NL 빈도 + 나세르 종류) · −14 LUFS |
| 붓칠 원본 | `public/assets/shortform/brush-fill/as24-theme/` | 노션 원본 SVG 13개, 같은 배율로만 키움(fill_fit, 칠 높이 = 글자 × 2.0) |
| 붓칠 그리는 코드 | `scripts/shortform/video_listing/g350_v5_lib.py` | `brush_box()` · `chip()` · `info_pill()` · `text3d()` |
| 옵션 표시 · 배치 | `scripts/shortform/photo_listing/option_visual_rules.json` | 시트 묶음 · 휠 · 숫자 화면 표기 · 비유 효과음 · 내레이션 규칙 · 컷당 그림 2묶음 |
| 사진판 부위 당기기 | `scripts/shortform/photo_listing/part_zoom_rules.json` | 당길 때 · 크기 · 도착 시각 |
| 영상판 옵션 편집 기법 | `scripts/shortform/video_listing/feature_edit_rules.json` | T01 2분할 · T02 ✓ 목록 · T03 점프컷 · T04 카운트업 · T05 스포트라이트 · T06 돋보기 · T07 마력 흔들림 · T08 부위 당기기 |
| 카드 컷 루틴 | `scripts/shortform/photo_listing/card_routine_rules.json` | 「성능점검기록부 요약합니다」 → 줄 공개 → 「다만 …」 |
| AS24 칩 배치 | `scripts/shortform/as24_edit_rules.json` | 띠 위치 · 부위 위/아래 판단 |
| 기법 사전 | `shortform-kit/catalog/techniques.json` | 모든 기법 코드 · 상태 · 구현 위치 |
| 판 잠금 | `scripts/shortform/edition_lock.json` | 유형별 렌더러 · 필수 기법 · 금지 · 검사 |
| 오픈소스 효과음(예비) | `public/assets/shortform/sfx/opensource/manifest.json` | CC0 32개(12종) · 출처 · CLAP 점수. 기본(`sfx.kinds`)은 그대로, 바꾸려면 사용자 확인 |

## 3. 근거 문서(값은 규칙 파일이 우선)

| 문서 | 내용 |
|---|---|
| `docs/shortform/as24-nl-be-edit-manual-v4.md` | NL · BE 100+100편 재조사, 원본 재현 규칙(최신) |
| `docs/shortform/as24-edit-skeleton-v3.md` | 칩 자리 · 시간 · 경우의 수(편집 뼈대 교본) |
| `docs/shortform/as24-caption-rules-v2.md` | 말 자막 규칙 |
| `docs/shortform/as24-sfx-rules-v1.md` | 효과음 전수조사 |
| `docs/shortform/as24-4country-compare-v1.md` | 독일 · 리싱마크트 대조 |
| `docs/shortform/nasser-autobeeb-option-edit-study-v1.md` | 나세르 · 오토비브 옵션 편집 학습 |
| `docs/shortform/option-visual-rules-v1.md` | 옵션 표시 규칙(사람용) |
| `docs/shortform/photo-listing-playbook-v1.md` | 사진 매물 제작 순서 |
| `docs/shortform/capcut-guide-survey-v1.md` | 캡컷 제작 가이드 대조 |
| `docs/shortform/auto-edit-v1.md` · `as24-two-editions-v1.md` | 자동 편집 v1, 두 판 |
| `docs/shortform/edit-divergence-audit-1122.md` | 편집 어긋남 전수조사 |
| `shortform-kit/README.md` · `LESSONS.md` · `ROADMAP.md` · `TOOLS.md` | 마스터 문서 · 틀린 예 · 할 일 · 도구 |

노션: 「AS24 NL/BE 200편 분석」 412ee9c4b60681ab86aef38a708d2244 · 「칩 칠 분석」 41dee9c4b6068039b155c169dfb323f6 · 「칩 · 강조 칠 규칙」 41dee9c4b60681aba101e816c1788a3a · 「영상 매물 기능 편집 자동화 매뉴얼 v1」 41fee9c4b6068135b799e9bc70f787c6 · 「대사 자동화 매뉴얼」 414ee9c4b60681e58c94f429fbcf0824 · 「G350 30회 시험 기준 문서」 420ee9c4b6068158b9a5f0d09fb4a7b9

## 4. 1회차 자동판이 빠뜨린 것 (G350 v13 대비)

| 스킬 · 기법 | v13 | 1회차 |
|---|---|---|
| 장면 고르기 · 잘라 붙이기(S1 · S5) | 씀 | **빠짐**(원본 순서 · 길이 그대로) |
| 제목 아래 연식 | `2013년식 · 디젤 · W463` | **빠짐** |
| 휠 3D 숫자 `18인치 / 265/60 R18`(S8) | 씀 | **빠짐**(자막만) |
| 트렁크 3D 두 줄 `480L / 2,250L` | 씀 | **작은 칩 하나** |
| T01 · T02 · T03 · T06 · T07 · T08 | 씀 | **빠짐** |
| 브랜드 붓칠 제목 · fill_fit 칩 · 자막 · 효과음 · 음량 | 씀 | 씀 |

## 5. 제작 기술스택(2026-11-23)

| 단계 | 도구 | 버전 · 라이선스 |
|---|---|---|
| 장면 · 부위 이름표 | SigLIP 2 base(google) · transformers | transformers 5.24 · torch 2.15 · Apache-2.0 |
| 부위 상자 찾기 | OWLv2 base ensemble | Apache-2.0 |
| 부위 따라가기 | VitTrack(opencv_zoo 2023sep) · CSRT 대체 경로 | OpenCV 5.1.0.95 · Apache-2.0 |
| 받아쓰기 · 낱말 시각 | faster-whisper large-v3-turbo | 1.2.1 · ctranslate2 4.9.1 · MIT |
| 글자 인식 | RapidOCR(PP-OCRv6) · onnxruntime | 3.10.0 · 1.32 · Apache-2.0 |
| 음성 | ElevenLabs eleven_v3(Taehyung 등) | 유료 API, 한 번만 생성 |
| 효과음 찾기 | Openverse API(익명, 쪽당 20개) → Freesound CC0 녹음 · uisfx(CC0) | `scripts/shortform/sfx_opensource/fetch_openverse.py` |
| 효과음 '귀'(채점) | CLAP laion/larger_clap_general(earshot `match`와 같은 모델) | Apache-2.0 · `score_clap.py` · z ≥ 1.0 통과 |
| 그리기 | Pillow · numpy | 13 · 2.5.5 |
| 영상 · 음량 | FFmpeg | 시스템 6.1.1 · 작업용 9.0.2 |
| 실행 | Python | 3.13.18(시안 전용, 서비스는 Nuxt 4 · Laravel 12) |

## 6. 운영 규칙

1. 영상을 만들기 전에 이 표의 기준 영상과 규칙 파일을 연다.
2. 전달 전 검사 세 가지: `check_be.py` · `edit_gate.py post --plates` · **기준 영상 같은 시각 비교**. 셋 다 통과해야 「품질 통과」라고 보고한다.
3. 바꾼 것은 모두 이 저장소에 커밋하고 `CHANGELOG.md`에 적는다. 회차 영상은 구글 드라이브 `bobae_g350_rounds`, 링크는 노션 기준 문서와 3차 의견 페이지에 건다.
4. 스킬을 고치면 `shortform-kit/skills/`도 같이 고쳐 커밋한다.
