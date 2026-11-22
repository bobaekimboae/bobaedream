# 보배드림 숏폼 자동 편집 마스터 문서

딜러 매물의 사진·촬영 영상으로 세로 숏폼(인스타 릴스 · 유튜브 쇼츠 · 틱톡)을 **누가, 어떤 매물로 만들어도 같은 편집이 나오게** 하는 기준이다.

- 현재 버전: **v0.3.0** (2026-11-22) — 버전 기록은 [`CHANGELOG.md`](CHANGELOG.md) 하나뿐이다.
- 고치는 곳: 이 깃허브 폴더(`shortform-kit/`)와 규칙 파일(3장)만. 노션·구글 시트·매뉴얼 화면은 보기용 사본이다.
- 보기 화면: https://bobaekimboae.github.io/bobaedream/shortform-kit/ (`catalog/export_html.py`로 만듦)

## 목차

1. 이 문서가 정하는 것
2. 바꾸지 않는 원칙
3. 단일 기준 지도 — 무엇이 어디에 있나
4. 이름 체계와 편집 유형
5. 만드는 흐름
6. 화면 규칙
7. 소리 규칙
8. 출고 전 검사
9. 바꾸는 법 — 운영 규칙과 버전 번호
10. 지금 어긋나 있는 것
11. 함께 보는 문서

---

## 1. 이 문서가 정하는 것

| 이 문서에서 | 다른 곳에서 |
|---|---|
| 원칙, 파일 지도, 이름 체계, 만드는 흐름, 바꾸는 순서 | **숫자 값**은 규칙 파일(3장). 이 문서는 숫자를 다시 적지 않고 파일과 키 이름만 가리킨다 |
| 무엇을 왜 하는지 | 기법 하나하나의 정의·상태·사례는 기법 사전 [`catalog/CATALOG.md`](catalog/CATALOG.md) |
| | 할 일 순번은 [`ROADMAP.md`](ROADMAP.md), 도구는 [`TOOLS.md`](TOOLS.md), 실수 사례는 [`LESSONS.md`](LESSONS.md) |

숫자를 문서와 규칙 파일 두 곳에 적으면 언젠가 서로 달라진다. 그래서 숫자는 규칙 파일에만 둔다. 예전 마스터 문서(`docs/shortform/shortform-master.md`)는 이 원칙이 없어 값이 낡았고, 2026-11-22 이 문서로 합쳤다.

## 2. 바꾸지 않는 원칙

1. **사실만 말한다.** 대본·칩·카드의 값은 매물 원장(매물 정보)과 화면에 보이는 것에서만 가져온다. 없는 숫자, 「무사고」 단정, 할부·월 납입 금액, 「기본·옵션」 단정(국내 가격표 확인 전)은 쓰지 않는다.
2. **사진·영상은 고치지 않는다.** 자르기 · 이동 · 확대 · 흐린 채움만 한다. 배경 지우기 · 보정 · AI 이미지 → 영상은 쓰지 않는다.
3. **번호판은 가리지 않는다.** 딜러 매물은 공개가 원칙이다. 개인 연락처만 가린다.
4. **코드네임은 BMW · 벤츠 · 포르쉐만** 말하고 적는다(예: W463). 다른 브랜드는 「N세대」까지만.
5. **그래픽은 원본 자산만 쓴다.** 칠 판은 노션 원본 SVG를 같은 배율로만 키운다(늘이기 · 새로 그리기 금지). 아이콘은 Fluent 3D, 노션 아이콘 DB 원본만 쓴다.
6. **소리는 권리가 확인된 것만.** 자체 생성(일레븐랩스 상업 요금제)과 CC0만 쓴다. 출처는 `public/assets/shortform/sfx/README.md`, `bgm/README.md`에 적는다. 일레븐랩스 효과음은 영상에 섞어서만 쓰고 파일 단독으로 배포하지 않는다.
7. **남의 영상은 저장소에 넣지 않는다.** 오토스카우트24 · 나세르 원본은 내부 분석에만 쓰고, 얻은 규칙만 넣는다.
8. **규칙 값은 사용자가 정할 때만 바꾼다.** 위임받아 정한 것은 「사용자 위임으로 Claude 선정」이라고 기록한다.

## 3. 단일 기준 지도 — 무엇이 어디에 있나

| 종류 | 파일 | 담고 있는 것 | 읽는 쪽 |
|---|---|---|---|
| 벨기에판 화면·소리 값 | `scripts/shortform/be_locked_rules.json` | 노랑 · 잉크 색, 말 자막(크기 · 높이 · 강조), 칩(글자 크기 · 기울기 · 자리 · **칠 맞춤 `chip.fill_fit`**), 아이콘, 효과음 개수 · 간격, 음량, 끝 화면, 사용자 확정 목록 `user_locked` | `sag_reel_v1.py`, `video_listing/g350_v5_lib.py`, `check_be.py` |
| 사진판 옵션 표시 · 배치 | `scripts/shortform/photo_listing/option_visual_rules.json` | 옵션별 이모지 · 3D 글자, 시트 묶음, 휠 · 타이어 크기 맞춤, 숫자 화면 표기, 주행거리 원, **비유 효과음 `layout.metaphor_sfx`**, 대본 규칙 | `photo_listing/common.py`, `auto_visuals.py` |
| 사진판 부위 당기기 | `scripts/shortform/photo_listing/part_zoom_rules.json` | 당길 때 · 안 당길 때, 확대 크기, 도착 시각 | `photo_listing/part_zoom.py` |
| 영상판 옵션 편집 기법 | `scripts/shortform/video_listing/feature_edit_rules.json` | 기법 T01~T08의 조건 · 수치, 화살표 · 칩 간격, 검사 기준 `qa` | `feature_edit_planner.py`, `g350_v8_render.py` |
| AS24 칩 배치 | `scripts/shortform/as24_edit_rules.json` | 칩 띠 위치, 부위 위 · 아래 판단, 딩 비율(원본 재현용) | `as24_edit_planner.py` |
| 기법 사전 | `shortform-kit/catalog/techniques.json` | 모든 편집 요소의 표준 코드 · 이름 · 상태 · 구현 위치 · 사례 | `build.py`, `identify.py`, `export_*.py` |
| 자산 | `public/assets/shortform/` | 칠 판(`brush-fill/as24-theme/`, 파일 이름 = 원본 가로_세로), 효과음(`sfx/`), 배경음(`bgm/`), 글꼴 | 렌더러 |
| 근거 자료 | `docs/shortform/*.md`, `as24-stats-v1.json` | AS24 네덜란드 · 벨기에 · 독일 분석, 효과음 · 자막 실측 | 사람(값의 출처 확인) |

규칙끼리 겹치면 **더 좁은 파일이 이긴다**: 벨기에판 칩 · 자막은 `be_locked_rules.json`, 사진판 옵션 표시는 `option_visual_rules.json`, 영상판 기법 선택은 `feature_edit_rules.json`. 근거 문서(`docs/shortform/`)의 숫자와 규칙 파일이 다르면 규칙 파일이 맞다.

## 4. 이름 체계와 편집 유형

### 4-1. 다섯 단계 이름

| 단계 | 코드 | 뜻 | 예 |
|---|---|---|---|
| 편집 유형 | `ED-*` | 소재와 성격, 4가지 | `ED-PHOTO` |
| 편집 구성 | `SG-*` | 한 컷(또는 몇 컷) 단위로 끼우는 덩어리 | `SG-CARD-BASIC` 기본 정보 카드 |
| 편집 기법 | `CAP- CHIP- LIST- MARK- FX- MOVE- TR- INS- SFX- BGM- VO- AUD-` | 화면 · 소리에 거는 효과 하나 | `CHIP-POINT`, `MOVE-PARTZOOM`, `SFX-METAPHOR` |
| 옵션 표시 | `FM-*` | 차량 기능을 말할 때 부위에 붙는 표시 | `FM-SEAT-HEAT` |
| 자산 | `AS-*` | 기법이 쓰는 원본 파일 | `AS-SFX-HORSE-EL` |

상태는 다섯 가지: `구현`(코드 있고 영상에 쓰임) · `일부`(코드가 확정 규칙과 다름) · `계획` · `관찰`(남의 영상에서 본 것만) · `금지`. 사전에 없는 기법은 쓰지 않는다. 목적 칸(재미 / 정보 / 둘 다)으로 한 영상에 재미와 정보 기법이 모두 들어가게 한다.

### 4-2. 편집 유형 4가지

| 유형 | 소재 | 소리 | 렌더러(지금) | 상태 |
|---|---|---|---|---|
| `ED-PHOTO` 사진 매물 | 매물 사진 + 원장 | 내레이션 + 배경음 + 효과음(많게) | `scripts/shortform/photo_listing/common.py` | 구현 |
| `ED-SIMPLE` 실촬영 · AS24 벨기에 심플 | 촬영 영상 + 원장 | 내레이션 + 배경음 + 효과음 | `scripts/shortform/video_listing/g350_v8_render.py`(+ `sag_reel_v1.py` 공용 그리기) | 구현(차마다 스크립트, 10장) |
| `ED-3D` 실촬영 · 나세르 3D | 촬영 영상 + 원장 | 내레이션 + 효과음 | `scripts/shortform/egypt_3d_callout_sample.py`(시안) | 계획 |
| `ED-ASMR` 내레이션 없음 | 소리를 살려 찍은 영상 | 녹음된 원래 소리만(배경음 · 효과음 없음) | 없음 | 계획 |

유형마다 고정된 컷: 사진판 1번째 컷 엠블럼, 2번째 컷 기본 정보 카드(2026-11-22 확정), 모든 유형의 끝은 딜러 명함 + 보배드림 로고.

## 5. 만드는 흐름

캡컷의 「편집 → 저장 → 업로드」를 부품으로 나눴다. 부품마다 입력 · 출력이 파일(JSON)로 정해져 있어 도구를 바꿔도 나머지는 그대로 돈다. 도구 후보와 판단은 [`TOOLS.md`](TOOLS.md).

| 단계 | 하는 일 | 지금 쓰는 것 | 출력 |
|---|---|---|---|
| P01 | 매물 사실 | 매물 원장(구글 시트 → 이후 Laravel API) | 사실 목록 |
| P02 | 소재 정리 | 사진: 부위 이름표(`mkcfg.py`) / 영상: 컷 시간표 · 부위 추적(`g350_track.py`) | 컷 목록, `tracks.json` |
| P03 | 대본 | 사실 대조를 거친 대본(사진판 `option_visual_rules.json` `narration_rules`) | 대본 |
| P04 | 음성 | 일레븐랩스 한국어 남성 목소리, 한 번 만들고 확인 | `voice.mp3` |
| P05 | 낱말 시각 | faster-whisper large-v3-turbo(`tr.py`, `transcribe_words.py`) | 낱말 · 시각 JSON |
| P06 | 기법 고르기 | 영상판 `feature_edit_planner.py`(조건으로 T01~T08 선택), 사진판 `auto_visuals.py` · `part_zoom.py` | `plan.json` |
| P07~P12 | 그리기 · 소리 섞기 | 렌더러(4-2) — 자막 · 칩 · 아이콘 · 움직임 · 효과음 · 배경음 | 영상 + `.plan.json` |
| P13 | 합치기 · 음량 | FFmpeg, 음량 맞춤 | mp4 |
| P14 | 출고 전 검사 | 8장 | 통과 / 실패 |
| P15 | 올리기 | 휴대폰 공유창(촬영키트), 이후 각 채널 API | 게시 |

기법 선택은 **컷 이름이나 차종이 아니라 조건**으로 한다(예: 조명 + 어두운 장면 → 스포트라이트, 작은 버튼 → 돋보기 · 부위 당기기). 그래서 다른 차를 넣어도 같은 규칙으로 같은 종류의 편집이 붙는다.

## 6. 화면 규칙

값은 오른쪽 칸의 파일 · 키에 있다.

| 항목 | 정한 것 | 값이 있는 곳 |
|---|---|---|
| 색 | 노랑 한 가지 + 잉크(검정). 주황 · 민트 · 파랑 강조 금지, 반짝이 금지 | `be_locked_rules.json` `color`, `user_locked` |
| 말 자막 | 흰 굵은 글자 + 그림자, 지금 말하는 낱말만 노랑, 칠 없음, 뜻 단위 덩어리(기계적 2~3어절 끊기 금지), 컷 뒤 짧게 비움, 숫자 칩이 뜨는 동안 숨김 | `be_locked_rules.json` `caption` |
| 포인트 칩 | 말한 낱말을 칩으로. 모든 칩 같은 글자 크기 · 같은 모양, 위쪽 고정 자리, 같은 순간이면 같은 자리에서 글자만 바뀜, 컷을 넘지 않음 | `be_locked_rules.json` `chip` |
| 칩 칠 | 노션 원본 칠 판 중 좌우 여백이 맞는 것을 골라 **같은 배율로만** 키움. 칠 높이 = 글자 높이 × 2.0(AS24 벨기에 실측 1.86~2.19), 글자는 칠 가운데보다 살짝 위 | `be_locked_rules.json` `chip.fill_fit` |
| 아이콘 | Fluent 3D, 칩 오른쪽 끝에 붙임. 따로 툭 뜨는 이모지 스티커 금지 | `be_locked_rules.json` `icon` |
| 큰 숫자 | 숫자가 매물 정보에 있을 때만. 정수 + 단위는 0에서 올라감(카운트업), 소수 · 규격 · 연식 제외. 한 화면에 같은 숫자 한 번 | `feature_edit_rules.json` `big_number`, `count_up_*` |
| 화살표 · 칩 간격(영상판) | 부위 → 화살표 → 칩 순서, 컷마다 위 · 아래 한 번만 정하고 컷 안에서 뒤집지 않음 | `feature_edit_rules.json` `mapping` |
| 옵션 편집 기법(영상판) | T01 위아래 2분할 · T02 ✓ 목록 · T03 점프컷 · T04 카운트업 · T05 스포트라이트 · T06 돋보기 · T07 마력 흔들림 · T08 부위 당기기 | `feature_edit_rules.json` `techniques` |
| 옵션 표시(사진판) | 시트 묶음(재질 + 열선 · 통풍 · 마사지 · 메모리), 휠 인치 · 타이어 규격 크기 맞춤, 숫자 화면 표기, 계기판 주행거리 원 | `option_visual_rules.json` `layout`, `options` |
| 부위 당기기(사진판) | 그 부위를 말할 때 그 부위로 다가감, 라벨 부위 우선, 정지 사진처럼 보이지 않게 | `part_zoom_rules.json` |
| 선루프 | 위아래 2분할(누르는 장면 + 열리는 장면) | `option_visual_rules.json` `options.sunroof.fixed_edit` |
| 첫 화면 | 노랑 칩 제조사 + 같은 줄 흰 큰 모델명 + 아래 한 줄(연식 · 연료 · 코드네임 규칙) | 렌더러 |
| 끝 화면 | 마지막 장면 어둡게 + 보배드림 로고가 커짐, 딜러 명함 | `be_locked_rules.json` `end` |

## 7. 소리 규칙

| 항목 | 정한 것 | 값이 있는 곳 |
|---|---|---|
| 음량 | 목표 음량과 피크 상한 | `be_locked_rules.json` `audio` |
| 효과음 개수 | 영상판: 음악이 있으면 적게(현재 값은 10장 참고), 사진판: 많게(`SFX_RICH`) | `be_locked_rules.json` `sfx` |
| 효과음 종류 | 딩(칩 · 큰 숫자), 팝(아이콘), 휙(부위 바뀔 때). 끝 로고 · 컷에는 넣지 않음 | `be_locked_rules.json` `sfx`, `docs/shortform/as24-sfx-rules-v1.md` |
| 비유 효과음 | 그 낱말을 말하는 순간에만, 영상당 2개, 좋은 정보에만. 마력 = 말 울음, 제로백 = 스톱워치, 연비 = 동전, 열선 = 장작, 통풍 = 얼음. 겹치면 딩 · 팝보다 우선. 사람 목소리 금지 | `option_visual_rules.json` `layout.metaphor_sfx` |
| 배경음 | 자체 곡만, 말할 때 줄임. 슈퍼카 · 고급 세단 · 쇼룸 | `public/assets/shortform/bgm/` |
| ASMR판 | 녹음된 원래 소리만. 배경음 · 효과음 없음 | 사전 `ED-ASMR` |
| 내레이션 | 한국어 남성, 한 번 만들고 확인(크레딧 드는 재생성 반복 금지). 고칠 때는 그 문장만 같은 목소리로 다시 녹음 | 렌더러, `revoice_splice.py` |

## 8. 출고 전 검사

하나라도 실패하면 고치고 다시 렌더한다. 통과 전에는 영상을 전달하지 않는다.

| 검사 | 명령 | 보는 것 |
|---|---|---|
| 규칙 · 코드 일치 | `python3 scripts/shortform/check_be.py --code` | 렌더 코드 값이 `be_locked_rules.json`과 같은지 |
| 완성 영상(벨기에판) | `python3 scripts/shortform/check_be.py 영상.mp4` | 음량, 효과음 개수 · 간격, 칩 크기 · 자리 · 컷 넘김, 노랑 색, 자막 띠에 칠 없음 |
| 사진판 설정 | `python3 scripts/shortform/photo_listing/check_cfg.py 차폴더` | 자막 규칙, 필수 낱말 등 렌더 전 설정 |
| 사진판 완성 영상 | `python3 scripts/shortform/photo_listing/check_render.py 차폴더` | 자막 빠짐, 끝 화면 |
| 영상판 기법 계획기 | `python3 scripts/shortform/video_listing/test_feature_edit_planner.py` | 계획기가 정답과 같은 기법을 고르는지 |
| 기법 사전 | `python3 shortform-kit/catalog/build.py` | 코드 중복, 상태 값, 구현 파일 · 함수 존재, 사전 버전 = 변경 기록 맨 위 버전 |
| 사람 확인 | 정지 화면 묶음(`still.py`), 끝 2초 프레임, 귀로 듣기 | 겹침 · 잘림 · 사실 오류, 소리 |

## 9. 바꾸는 법 — 운영 규칙과 버전 번호

### 9-1. 좋은 안은 바로 고정한다

채팅에만 남은 결정은 결정이 아니다. 사용자가 확정하면 그 자리에서 아래 순서로 고정한다.

1. 규칙 파일(3장) 값을 고친다. 코드에 숫자를 직접 쓰지 않는다.
2. 기법 사전(`catalog/techniques.json`)에 코드 · 상태 · 사례를 반영하고 사전 버전을 올린다.
3. `CHANGELOG.md` 맨 위에 같은 버전으로 「무엇을 · 왜 · 정한 사람」을 적는다.
4. 이 문서가 가리키는 파일 · 키가 바뀌었으면 이 문서를 고친다.
5. `build.py`를 통과시키고 매뉴얼 화면(`export_html.py`)을 다시 만든다.
6. 커밋 · 푸시, 노션 의견 DB에 한 줄. 병합 · 배포는 사용자가 말할 때만 한다.

### 9-2. 버전 번호 `가.나.다`

| 자리 | 언제 올리나 | 예 |
|---|---|---|
| 가 | 편집 유형이 늘거나 만드는 흐름(5장)의 구조가 바뀔 때 | 공용 렌더러로 전환 |
| 나 | 화면 · 소리 결과가 달라지는 규칙 값 · 새 기법 | 칩 칠 맞춤, T08 부위 당기기 |
| 다 | 결과가 그대로인 문서 · 검사 · 자산 추가 | 효과음 파일 추가, 오타 |

버전 기록은 `CHANGELOG.md` 하나뿐이다. 2026-11-08~11-21 예전 마스터 문서의 v1.0~v1.4는 같은 줄의 `v0.0.1~v0.0.5`로 옮겼다.

## 10. 지금 어긋나 있는 것

확정했지만 코드에 아직 안 들어갔거나, 규칙 파일끼리 다른 것이다. 해결하면 이 표에서 지우고 `CHANGELOG.md`에 적는다.

| # | 내용 | 지금 상태 | 해야 할 일 |
|---|---|---|---|
| 1 | 포인트 칩 기울기 폐지(2026-11-22 확정, 사전 `CHIP-POINT` · `AS-BRUSH-TAPE` 금지) | `be_locked_rules.json` `chip.tilt_ccw_deg`가 아직 5.7°라 칩이 기울어져 나옴. 칠은 v0.3.0에서 노션 원본 판으로 바뀜 | ROADMAP 1-1: 기울기 값과 `shape`를 확정 규칙으로 바꾸고 `check_be.py` 기준도 함께 |
| 2 | 효과음 「모두 냄」(2026-11-22 확정, 실촬영 1번 제한 폐지) | `be_locked_rules.json` `sfx.with_music_per_video`가 아직 1. G350 영상은 이미 딩 2 + 말 울음 + 스톱워치 + 팝을 씀 | ROADMAP 1-3: 규칙 값을 확정대로 바꾸고 `check_be.py`를 다시 통과 |
| 3 | 영상판 렌더러가 차마다 따로 있음 | `g350_v8_render.py`에 G350의 원본 시각 · 일부 장면 그래픽이 직접 적혀 있음 | ROADMAP 12: 공용 렌더러 + 차마다 입력 파일 하나 |
| 4 | T08 부위 당기기 | 규칙 · 계획기에는 있고, 렌더러 반영 전 | ROADMAP 1-11 |
| 5 | 사진판 칩 칠 | `photo_listing/common.py`는 아직 `126_40`을 상자 크기에 맞춰 늘림 | ROADMAP 1-12: `chip.fill_fit`과 같은 방식으로 |

## 11. 함께 보는 문서

| 문서 | 내용 |
|---|---|
| [`CHANGELOG.md`](CHANGELOG.md) | 유일한 버전 기록 |
| [`ROADMAP.md`](ROADMAP.md) | 해야 할 일 순번표(노션 체크리스트와 같은 순번) |
| [`catalog/CATALOG.md`](catalog/CATALOG.md) | 기법 사전(사람용, `build.py`가 만듦 — 직접 고치지 않음) |
| [`TOOLS.md`](TOOLS.md) | 단계별 도구 · 라이선스 판단 |
| [`LESSONS.md`](LESSONS.md) | 자주 틀린 예와 지킬 것 |
| [`research/`](research/) | 조사 기록(무료 효과음 · 배경음 사이트 등) |
| `docs/shortform/as24-nl-be-edit-manual-v4.md` 외 | AS24 분석 근거 자료(값은 규칙 파일이 우선) |
| 노션 「숏폼 자동 편집 최종 작업 계획서 · 체크리스트」 | 작업 추적 사본 |
| 구글 시트 「숏폼 자동 편집 매뉴얼 (깃허브 사본)」 | 표 사본 — https://docs.google.com/spreadsheets/d/1c-OdKZMS3OvZK1rfFSIDoTVFy7tYdq3dX_yq7GFafwo/edit |

### 도구 명령

```bash
python3 shortform-kit/catalog/build.py          # 사전 검사 + CATALOG.md 만들기(규칙을 바꾼 뒤 꼭)
python3 shortform-kit/catalog/identify.py 차폴더  # 만든 영상에 쓴 기법을 used_techniques.json으로 기록
python3 shortform-kit/catalog/export_html.py    # 매뉴얼 화면(public/shortform-kit/index.html) 다시 만들기
python3 shortform-kit/catalog/export_xlsx.py 출력.xlsx  # 시트 사본용 xlsx
```
