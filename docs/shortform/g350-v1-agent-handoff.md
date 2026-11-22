# G350 숏폼 버전 1 — 에이전트 공용 기준 문서 (2026-11-23)

> 사용자 지시: 「우리 최종판을 에이전트들과 같이 개선할 버전 1 영상으로 하자」
> 이 문서는 클로드·코덱스·검수 에이전트가 **같은 기준 영상(버전 1)** 을 보고, 같은 방법으로 고치고, 같은 검사로 판정하기 위한 단일 문서다. 영상을 손대기 전에 끝까지 읽는다.

## 1. 버전 1이 무엇인가

| 항목 | 값 |
|---|---|
| 영상 | `public/shortform-samples/g350-v1/g350-v1.mp4` (70초, 1080×1920, 30fps) |
| 보는 주소 | https://bobaekimboae.github.io/bobaedream/shortform-samples/g350-v1/ |
| 매물 | 벤츠 G350 블루텍 2013년식 디젤(W463), 딜러가 찍은 실촬영 영상 1개 |
| 편집 유형 | ED-SIMPLE 실촬영 · 벨기에 오토스카우트 편집 뼈대 + 나세르식 컷=기능 |
| 만든 코드 | `scripts/shortform/video_listing/g350_v8_render.py` + `g350_v5_lib.py` |
| 이전 기준 | G350 v13(커밋 771f02708). 버전 1 = v13 + 규칙 위반 3곳 수정 |
| 판정 | `check_be.py` 통과 · `edit_gate.py post --plates` 통과(실패 0) |

**앞으로 개선은 모두 버전 1과 비교한다.** v13은 기록으로만 둔다.

## 2. v13 → 버전 1에서 바뀐 것(이것뿐)

| # | 문제(규칙) | 고친 방법 | 코드 |
|---|---|---|---|
| 1 | 3,500kg 큰 숫자가 번호판 한가운데 위에 뜸(번호판은 가리지 않는다, 사용자 확정) | 견인고리 컷만 큰 숫자를 자막 자리(CAPY−100)로 내리고 그동안 말 자막 숨김(AS24 「큰 숫자가 뜨면 말 자막을 숨긴다」) | `BIG_LOW={'c7'}`, `HIDE_SUB` |
| 2 | 견인고리 칩이 카메라가 번호판에서 내려오는 순간 번호판 아래를 덮음 | 칩을 0.75초 늦게(번호판이 화면 위로 빠진 뒤) 띄움, 효과음도 같이 이동 | `CHIP_DELAY={'c7':0.75}` |
| 3 | 칩 3개가 좌우 안전영역 40px를 넘음(24px까지 붙음) | 칩 칠 좌우 여백 24 → 40px. 화살표는 그대로 부위를 가리킴 | `SAFE_X=40` |

나란히 비교: `public/shortform-samples/g350-v1/compare-v13-v1.jpg`(위 v13, 아래 버전 1).
그 밖의 장면 순서·음성·자막·효과음·음악은 v13과 같다(전체 프레임 비교로 확인, 다른 곳은 위 3곳과 인코딩 잡음뿐).

검사기도 함께 고쳤다(`scripts/shortform/edit_gate.py` `plate_check`):
- 노랑 칩 자체를 번호판으로 잡는 오탐 제거(찾은 상자가 칩 상자와 IoU ≥ 0.8이면 뺌) → 펜더 7.6초·시트 34.2초 오탐 사라짐
- OWLv2 상자가 범퍼까지 넓게 잡는 문제: 가장 확실한 상자 점수의 60% 미만은 빼고, 상자를 사방 5% 줄여 판정
- 큰 숫자(`plan.json`의 `bigs`)도 번호판 검사에 포함
- v13(=r02)은 여전히 진짜 문제(견인고리 21.2초)로 실패 → 검사가 느슨해지지 않았음을 확인

## 3. 파이프라인(13단계 중 영상 매물 경로)과 걸린 시간

| 단계 | 하는 일 | 도구 | 시간(버전 1) |
|---|---|---|---|
| 1 | 원본 영상 받기 | 구글 드라이브 `src_drive.mp4`(65MB) | — |
| 2 | 장면 고르기·대본 | `samples/g350_input.json`, `samples/g350_edit.json`(115낱말 덩어리) | (고정 입력) |
| 3 | 음성 | 일레븐랩스 eleven_v4, voice `HvCQYI15cbdFVC9pSBfb`, 생성 기록 flow `OGXUwSfSnIWfz1JO99MI` / generation `9S0YbSP1A9876EPztDQn` — **다시 생성 금지, 기록에서 내려받기** | 몇 초 |
| 4 | 받아쓰기(낱말 시각) | faster-whisper large-v3-turbo(int8, CPU) | 75초 |
| 5 | 낱말 정리 | `g350_v8_render.py DUMPWS=1` | 9초 |
| 6 | 부위 따라가기 | OpenCV CSRT `g350_track.py` | 43초 |
| 7 | 옵션 기법 계획 | `feature_edit_planner.py`(T01~T08) | 2초 |
| 8 | 렌더 | `g350_v8_render.py`(PIL 합성 → ffmpeg) | 123초 |
| 9 | 소리 | 목소리 + 쇼룸 음악(자체) + 효과음 18개 → loudnorm −14 LUFS | 렌더 안 |
| 10 | 규칙 검사 | `check_be.py` | 11초 |
| 11 | 관문 검사 | `edit_gate.py post --plates`(OWLv2 번호판) | 약 100초 |
| 12 | 기준 비교 | 버전 1과 프레임 비교 | 약 80초 |
| 13 | 배포 | GitHub(커밋 → main 병합 → Pages) | — |

순수 제작 약 4분 10초, 검사 포함 약 6분, 사람 개입 0회.

다시 만들기: `G350_DIR=/작업폴더/ ROUND=xx bash scripts/shortform/video_listing/g350_reproduce.sh`
(작업폴더 끝에 `/`, `src.mp4`·`voice_src.mp3`를 미리 넣음. 입력은 `samples/g350_work/`, 버전 1 계획 파일은 `samples/g350_work/v1.plan.json`)

## 4. 기술 스택

| 영역 | 쓰는 것 | 라이선스·비고 |
|---|---|---|
| 합성·렌더 | Python 3, Pillow, NumPy, OpenCV, ffmpeg(libx264, aac) | 시안용 파이썬. 서비스 구현은 Nuxt 4·Laravel 12 파이프라인으로 옮김 |
| 받아쓰기 | faster-whisper(mobiuslabsgmbh/faster-whisper-large-v3-turbo) | MIT |
| 음성 | ElevenLabs(eleven_v4, 한국어 남성) | 크레딧 — 한 번만 생성 |
| 부위 추적 | OpenCV CSRT | BSD |
| 부위·번호판 찾기 | OWLv2(`photo_listing/part_anchor.py`) | Apache-2.0 |
| 효과음 점검 | earshot 1.0.0 `rank`(CLAP+AST, z ≥ 3.0 strong) | MIT |
| 오픈소스 효과음 | Openverse CC0(Freesound) 29개 `public/assets/shortform/sfx/opensource/` | CC0 — 예비용, 기본 효과음은 그대로 |
| 3D 아이콘 | Fluent 3D(`photo_listing/fluent3d/`) | MIT |
| 글꼴 | Pretendard | OFL |
| 배포 | GitHub Pages(`bobaekimboae/bobaedream`) | Netlify 금지 |

## 5. 바꾸면 안 되는 규칙(사용자 확정)

- 값은 `scripts/shortform/be_locked_rules.json` 하나에서만 읽는다. 규칙 값은 **사용자가 말할 때만** 바꾼다.
- 사진·영상은 고치지 않는다(자르기·확대·이동·어둡게만). AI 배경·보정 금지.
- 번호판은 블러하지 않고, 칩·큰 숫자로 덮지도 않는다. 개인 연락처만 가린다.
- 대본·칩의 사실은 매물 정보와 화면에 보이는 것만. 「무사고」 금지, 할부·월납 금지, 지어낸 숫자 금지.
- 코드네임은 BMW·벤츠·포르쉐만.
- 노랑 한 색(#F5F200), 칩은 모두 같은 글자 크기·모양, 포인트 칩은 위쪽 고정 자리, 자막에는 칠하지 않는다.
- 일레븐랩스 생성은 한 번(재시도 호출 금지). 일레븐랩스 효과음 파일을 따로 배포하지 않는다.
- 파일명은 영문. 커밋·배포는 GitHub로만(버전 기록).

## 6. 함께 개선하는 방법(모든 에이전트 공통)

1. **한 번에 한 가지만** 바꾼다(회차 = 변경 1개). 여러 개를 한꺼번에 바꾸면 무엇이 좋아졌는지 알 수 없다.
2. 바꾸기 전에 노션 「시안 작업 의견 나누기」 DB에 제안을 남긴다: 무엇을 · 왜(근거 실측·원본 비교) · 기대 효과 · 규칙 값을 바꾸는지.
3. 규칙 값(`be_locked_rules.json`)을 바꾸는 제안은 사용자 확인 뒤에만 반영한다.
4. 렌더 후 반드시 `check_be.py` → `edit_gate.py post --plates` → 버전 1과 프레임 비교. 실패가 하나라도 있으면 전달하지 않는다.
5. 바뀐 곳이 의도한 곳뿐인지 비교 이미지를 남긴다(위: 버전 1, 아래: 새 판).
6. 결과는 `public/shortform-samples/g350-v1-rNN/`처럼 새 폴더로 배포하고, `shortform-kit/CHANGELOG.md` 맨 위에 한 줄, 노션 정본 페이지 회차 표에 한 줄.
7. 좋아진 판을 사용자가 고르면 그것이 **버전 2**가 된다.

## 7. 개선 후보(에이전트 의견 받을 것)

| # | 후보 | 근거·상태 |
|---|---|---|
| 1 | 기본 휙 효과음을 오픈소스 whoosh_os1로 교체 | earshot: whoosh_os1~3이 4.5~4.7, 기존 3.1. 사용자 결정 대기 |
| 2 | 클릭 효과음 대체 | 기존 click은 earshot no match, 대체 후보 없음 |
| 3 | 칩 지연(0.75초)을 컷별 수동 값이 아닌 자동 판정으로 | 렌더 때 번호판 위치를 찾아 칩을 피하게 — 다른 매물에서도 같은 문제 예상 |
| 4 | 큰 숫자 자리 자동 결정 | 지금은 견인고리 컷만 수동(`BIG_LOW`). 번호판·부위를 피하는 자리 계산 |
| 5 | 번호판 검사를 렌더 전 원본 화면으로 | 지금은 렌더된 화면에서 찾음(칩이 그려진 상태) |
| 6 | 렌더러 일반화 | `g350_v8_render.py`는 G350 전용 값이 많음 → 다른 매물에 쓰려면 입력 파일로 분리 |

## 8. 파일 지도

| 무엇 | 위치 |
|---|---|
| 버전 1 영상·페이지 | `public/shortform-samples/g350-v1/` |
| v13(이전 기준) | `public/shortform-samples/g350-v13/` |
| 렌더러 | `scripts/shortform/video_listing/g350_v8_render.py`, `g350_v5_lib.py` |
| 재현 절차·입력 | `scripts/shortform/video_listing/g350_reproduce.sh`, `samples/g350_work/` |
| 규칙 값 | `scripts/shortform/be_locked_rules.json`, `option_visual_rules.json` |
| 검사 | `scripts/shortform/check_be.py`, `scripts/shortform/edit_gate.py` |
| 효과음 | `public/assets/shortform/sfx/`(README에 출처·earshot 점수) |
| 스킬 목록·변경 기록·교훈 | `shortform-kit/SKILLS-INDEX.md`, `CHANGELOG.md`, `LESSONS.md` |
| 노션 정본(전체 매뉴얼·파이프라인·기술스택) | https://app.notion.com/p/420ee9c4b606812494bee47e00916f45 |
