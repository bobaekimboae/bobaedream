# 숏폼 제작 파이프라인 · 버전 체계

매물 한 대가 숏폼 영상이 되기까지의 단계와, 무엇을 바꾸면 어떤 버전이 올라가는지를 한 곳에 적는다. **영상을 만들거나 규칙을 바꾸기 전에 이 문서를 연다.**

- 숫자 값은 여기 적지 않는다(규칙 파일이 단일 기준). 편집 유형 · 옵션 기능 편집의 모든 값은 [`EDIT-SPEC.md`](EDIT-SPEC.md)(규칙 파일에서 자동 생성).
- 이 문서는 2026-11-23 사용자 지시 「작업 매뉴얼 체계적으로 정리하고 깃허브에 버전 제작 파이프라인도 동시 기재」로 만들었다.

## 1. 문서 체계 — 원본은 깃허브 하나

```
깃허브(원본, 버전 기록)                         사본(보기용, 깃허브에서 만들어 냄)
─────────────────────────────                  ──────────────────────────────
규칙 파일(json) ── export_rules_sheet.py ────▶ 구글 시트 40~46 탭
techniques.json ── export_attr_table.py ─────▶ 구글 시트 30~33 탭
                └─ build.py ─────────────────▶ catalog/CATALOG.md
규칙 파일 전체 ─── export_edit_spec.py ──────▶ EDIT-SPEC.md
문서 전체 ──────── export_doc_index.py ──────▶ 구글 시트 01_문서_목록
README·PIPELINE·SKILLS-INDEX ────────────────▶ 노션 정본 페이지(요약 + 링크)
```

- 고치는 곳은 왼쪽뿐이다. 시트 · 노션 · `EDIT-SPEC.md` · `CATALOG.md`를 손으로 고치지 않는다.
- 사본에는 「원본 파일 · 버전 · 커밋」을 항상 적는다(사본이 낡았는지 바로 보이게).
- 구글 시트(단일 매뉴얼 시트): 「보배드림 숏폼 편집 자동 제작 매뉴얼」 https://docs.google.com/spreadsheets/d/1Puhko4cgmSWMHMELaS1pB4HMj33_6V1iT8t5E4rKCt8/edit
- 노션 정본: https://app.notion.com/p/420ee9c4b606812494bee47e00916f45

### 1-1. 먼저 읽는 순서

| 순서 | 문서 | 왜 |
|---|---|---|
| 1 | [`PIPELINE.md`](PIPELINE.md) (이 문서) | 단계 · 버전 · 문서 체계 |
| 2 | [`SKILLS-INDEX.md`](SKILLS-INDEX.md) | 기준 영상 · 스킬 13개 · 규칙 파일 지도 |
| 3 | [`EDIT-SPEC.md`](EDIT-SPEC.md) | 편집 유형 4가지 · 옵션 기능 편집 T01~T08 · 옵션 표시 — 모든 값 |
| 4 | [`README.md`](README.md) | 원칙 · 화면 · 소리 규칙 · 출고 전 검사 |
| 5 | [`LESSONS.md`](LESSONS.md) | 다시 하지 않을 실수 |
| 6 | [`docs/shortform/g350-v1-agent-handoff.md`](../docs/shortform/g350-v1-agent-handoff.md) | 영상판 기준 영상(버전 1)과 함께 개선하는 방법 |

## 2. 제작 파이프라인

### 2-1. 공통 단계

| 단계 | 하는 일 | 입력 | 출력 | 통과 조건 |
|---|---|---|---|---|
| S01 판 고르기 | 소재에 맞는 편집 유형 하나 | 사진만 / 촬영 영상 / 소리 살린 영상 | 판 코드(ED-PHOTO · ED-SIMPLE · ED-3D · ED-ASMR) | `edit_gate.py pre <판> <렌더러>` 통과 |
| S02 매물 사실 | 매물 원장에서 쓸 사실만 | 매물 원장(시트 → Laravel API) | `facts.json` | 없는 값은 비움(지어내지 않음) |
| S03 소재 정리 | 장면 · 부위 이름표 | 사진 / 영상 | 사진: `cfg.py` CUTS · 영상: `scenes.json` | 말할 부위가 화면에 보여야 함 |
| S04 대본 | 사실로만 문장 | `facts.json` + 장면 | 대본 | 「무사고」 · 할부 · 지어낸 숫자 금지, 사실 검사 통과 |
| S05 음성 | 일레븐랩스 한 번 생성 | 대본 | `voice.mp3` | 재시도 호출 금지, 생성 기록 ID 남김 |
| S06 낱말 시각 | 받아쓰기는 시각만 | `voice.mp3` | 낱말 · 시각 JSON | 자막 글자는 대본 글자 |
| S07 부위 찾기 · 추적 | 칩 · 화살표 · 당기기 기준점 | 영상 / 사진 | `tracks.json` · OWLv2 상자 | 추적 실패 컷은 기법 생략 |
| S08 기법 계획 | 조건으로 기법 고르기 | 낱말 시각 + 컷 | `plan.json` | 판의 필수 기법이 다 있음 |
| S09 렌더 | 판의 렌더러 하나로 | 위 전부 | 영상 + `영상.mp4.plan.json` | 비교용 렌더러(edition_lock `compare_only`) 금지 |
| S10 소리 | 목소리 + 배경음 + 효과음 → 음량 | 렌더 | mp4 | −14 LUFS 기준(규칙 파일) |
| S11 규칙 검사 | 색 · 칩 · 자막 · 효과음 숫자 | mp4 + plan | 통과 / 실패 | `check_be.py` 실패 0 |
| S12 관문 검사 | 판 · 기법 · 싱크 · 안전영역 · 번호판 | mp4 + plan | 통과 / 실패 | `edit_gate.py post --plates` 실패 0 |
| S13 기준 비교 | 기준 영상과 같은 시각 나란히 | mp4 + 기준 영상 | 비교 이미지 | 의도한 곳만 다름 |
| S14 배포 | 깃허브 커밋 → main → Pages | 영상 · 페이지 | 샘플 주소 | 커밋 해시 · v값 보고 |

### 2-2. 판별 실행 경로

| 단계 | ED-SIMPLE(실촬영 영상) | ED-PHOTO(사진) |
|---|---|---|
| S03 | `video_listing/make_job.py` (facts + scenes → job.json) | `photo_listing/sag_auto.py` · `mkcfg.py` |
| S04 사실 검사 | `video_listing/job_fact_check.py` | `photo_listing/fact_check.py` |
| S05 | 일레븐랩스 `eleven_v3` 한 번 | 일레븐랩스 한 번 |
| S06 | faster-whisper large-v3-turbo · `g350_v8_render.py DUMPWS=1` | `photo_listing/tr.py` |
| S07 | `video_listing/g350_track.py` (OpenCV CSRT) | `photo_listing/part_anchor.py` (OWLv2) |
| S08 | `video_listing/feature_edit_planner.py` → T01~T08 | `photo_listing/auto_visuals.py` · `part_zoom.py` |
| S09 | `video_listing/g350_v8_render.py` + `g350_v5_lib.py` | `photo_listing/common.py` |
| S11~S12 | `check_be.py` · `edit_gate.py post --plates` | `photo_listing/check_cfg.py` · `check_render.py` · `check_be.py` |
| S13 기준 | G350 **버전 1** (`public/shortform-samples/g350-v1/`) | 서울오토갤러리 E250 자동판 |
| 한 번에 | `G350_DIR=작업폴더/ ROUND=xx bash scripts/shortform/video_listing/g350_reproduce.sh` | `python3 photo_listing/common.py <차폴더>` |

ED-3D · ED-ASMR은 아직 렌더러가 없다(계획). `edition_lock.json`에 판 항목이 생기면 이 표에 열을 더한다.

### 2-3. 걸리는 시간(G350 버전 1 기준)

받아쓰기 75초 · 낱말 정리 9초 · 추적 43초 · 계획 2초 · 렌더 123초 · 규칙 검사 11초 · 관문 검사 약 100초 · 기준 비교 약 80초. 순수 제작 약 4분 10초, 검사 포함 약 6분, 사람 개입 0회.

## 3. 무엇이 어디서 정해지나

| 정하는 것 | 파일 | 시트 탭 |
|---|---|---|
| 판마다 렌더러 · 필수 · 금지 기법 · 기준 영상 | `scripts/shortform/edition_lock.json` | 41 |
| 색 · 칩 · 자막 · 효과음 · 음량(모든 판 공통) | `scripts/shortform/be_locked_rules.json` | 40 |
| 영상판 옵션 기능 편집 T01~T08 · 화살표 · 칩 간격 · 검사 기준 | `scripts/shortform/video_listing/feature_edit_rules.json` | 43 |
| 사진판 옵션 표시 · 시트 묶음 · 휠 · 숫자 화면 표기 · 비유 효과음 | `scripts/shortform/photo_listing/option_visual_rules.json` | 44 |
| 사진판 부위 당기기 | `scripts/shortform/photo_listing/part_zoom_rules.json` | 45 |
| 사진판 카드 컷 순서 | `scripts/shortform/photo_listing/card_routine_rules.json` | 46 |
| AS24 칩 배치(원본 재현용) | `scripts/shortform/as24_edit_rules.json` | 42 |
| 편집 방법 전체 코드 · 상태 · 구현 위치 | `shortform-kit/catalog/techniques.json` | 30~33 |

## 4. 버전 체계

버전은 네 가지가 있고, 섞지 않는다.

| 버전 | 어디에 | 언제 올리나 | 누가 |
|---|---|---|---|
| **키트 버전** `v가.나.다` | `CHANGELOG.md` 맨 위 = `techniques.json` `version` | 가: 판이 늘거나 파이프라인 구조가 바뀜 · 나: 화면 · 소리 결과가 달라지는 규칙 값 · 새 기법 · 다: 결과가 그대로인 문서 · 검사 · 자산 | 바꾼 에이전트 |
| **규칙 파일 버전** | 각 json의 `version` | 그 파일 값이 바뀔 때마다 | 사용자가 정한 값만(위임은 「사용자 위임으로 Claude 선정」 기록) |
| **기준 영상 버전** | 판마다 하나(지금 ED-SIMPLE = G350 버전 1) | 사용자가 회차 중 하나를 고르면 그것이 다음 버전 | 사용자 |
| **회차** `rNN` | `public/shortform-samples/g350-v1-rNN/` | 기준 영상에서 **한 가지만** 바꿔 만든 판 | 에이전트 |

### 4-1. 기준 영상 흐름

```
버전 1 ──(한 가지 변경)──▶ v1-r01 ─┐
       ──(한 가지 변경)──▶ v1-r02 ─┼─▶ 사용자가 고름 ─▶ 버전 2 (edition_lock golden 교체)
       ──(한 가지 변경)──▶ v1-r03 ─┘
```

1. 바꾸기 전에 노션 「시안 작업 의견 나누기」에 제안: 무엇을 · 왜 · 기대 효과 · 규칙 값을 바꾸는지.
2. 규칙 값을 바꾸는 제안은 사용자 확인 뒤에만 반영.
3. 렌더 → S11 · S12 · S13 모두 통과 → `g350-v1-rNN/`로 배포.
4. `CHANGELOG.md` 맨 위 한 줄, 노션 정본 회차 표 한 줄.
5. 사용자가 고르면 `edition_lock.json` `golden`을 새 버전으로 바꾸고 키트 버전 「나」를 올린다.

### 4-2. 바꿀 때마다 하는 일(체크리스트)

- [ ] 규칙 파일 / `techniques.json`만 고침(문서에 숫자 쓰지 않음)
- [ ] `python3 shortform-kit/catalog/build.py` 통과
- [ ] `python3 shortform-kit/catalog/export_edit_spec.py` → `EDIT-SPEC.md` 다시 생성
- [ ] `python3 shortform-kit/catalog/export_html.py` → 매뉴얼 화면
- [ ] `CHANGELOG.md` 맨 위 「무엇을 — 왜 — 정한 사람」
- [ ] 커밋 → main 병합 → Pages 배포(버전 기록은 깃허브만)
- [ ] 시트 사본 갱신: `export_attr_table.py`(30~33) · `export_rules_sheet.py`(40~46) · `export_doc_index.py`(01)
- [ ] 노션 정본 페이지 한 줄

## 5. 구글 시트 탭 지도

| 탭 | 묶음 | 원본 | 갱신 |
|---|---|---|---|
| 00_안내 | 시작 | — | 손으로(탭 지도) |
| 01_문서_목록 | 시작 | 깃허브 문서 전체 | `export_doc_index.py` |
| 10_매뉴얼_목차 · 11_매뉴얼_본문 | 절차 | `docs/shortform/listing-reel-pipeline-agents.md` | 문서 사본 |
| 20_매물원장_필드 · 21_솔루션별_입력필드 | 입력 | 시트 원본(2026-11-21 조사) | 손으로 |
| 30~33 편집 사전 | 편집 사전 | `techniques.json` 외 | `export_attr_table.py` |
| 40~46 규칙 | 규칙 값 | 규칙 json 7개 | `export_rules_sheet.py` |
| 50_AS24_아이콘칠_사례 | 참고 | 시트 원본 | 손으로 |
| 60~65 벤치마킹 · 고도화 | 조사 | 시트 원본(2026-11-21) | 손으로 |
