# 실촬영 매물 숏폼 파이프라인 기술스택 v1 — 페라리 로마 스파이더(레이브) 기준

작성: Claude 시안 마스터 · 2026-11-24 · 결과 영상 `public/shortform-samples/roma-spider-rave-v9/`
코드: `scripts/shortform/video_listing/roma_rave/`

벨기에(오토스카우트24) 자막 뼈대 위에 나세르식 편집(인트로 히어로샷 · 손 닿는 부위 강조)을 얹은 실촬영 매물 숏폼을, 사람 손은 "부위 점 한 번 찍기"만 두고 끝까지 자동으로 만드는 흐름이다.

## 1. 전체 흐름

| 단계 | 하는 일 | 도구 (라이선스) | 결과 파일 |
|---|---|---|---|
| 1 입력 | 딜러 원본 영상(이번: 오토갤러리 촬영 221.5초) · 매물 정보 · 제원 | 구글 드라이브, JATO 제원(연결 예정) | `raw/roma.mp4` (저장소 밖) |
| 2 대본 | 한 문장 = 한 부위 = 한 장면, 합니다체, 매물·제조사 제원만 | 사람 + Claude | `words.json` 원문 |
| 3 음성 | 남성 내레이션 한 번 생성, 문장 사이 0.22초로 붙임 | ElevenLabs Taehyung · eleven_v3 | `voice.wav` |
| 4 낱말 시각 | 낱말별 시작·끝 시각 | ElevenLabs Scribe | `words.json` |
| 5 장면 고르기 | 문장마다 그 부위가 보이는 원본 구간, 손이 닿는 순간 = 낱말 시작 0.08초 전 | 렌더러 `C` 표(사람 지정) | `roma_rave_render.py` |
| 6 손끝 찾기 | 닿는 프레임의 손끝(검지 끝) | MediaPipe Hand Landmarker (Apache-2.0) | — |
| 7 부위 따기 | 부위 점 1~3개(+제외 점) → 부위 마스크와 손 마스크를 1.4초 추적 | **SAM 2.1 hiera-tiny** (Apache-2.0, transformers) | `pseg/<부위>.npz` |
| 8 화면 흔들림 | 마스크가 끝난 뒤 콜아웃 점이 화면 전체 움직임만 따라감 | OpenCV phaseCorrelate (Apache-2.0) | — |
| 9 부위 강조 | 질감(밝기)은 두고 색만 흰색/부위색으로 + 얇은 흰 테두리 + 빛 쓸기, 손은 늘 앞 | OpenCV LAB 색공간 · **skia-python** (BSD) | `partfx.py` `recolor()` |
| 10 타공 그릴 | 차체와 한 덩어리라 외곽선 대신 손끝에서 퍼지는 "구멍 파동" | OpenCV(구멍 검출·볼록 껍질) · skia | `partfx.py` `holes()` |
| 11 부위 칩 | 부위 위 고정점에 스카우트식 짧은 노랑 화살표(끝이 부위) + 붓칠 칩, 화면 움직임 따라감 (v6: 흰 선 폐기) | g350_v5_lib `arrimg()`·`gchip()` | `roma_rave_render.py` `pin_fx()` |
| 12 인트로 차 윤곽 | 정면 샷(원본 0~2초, 0.67배속) · v9: SAM 2.1(뒤 기둥 제외 점 포함) → 트라이맵(안쪽 19px·바깥 25px 띠) → **ViTMatte small**(Apache-2.0, transformers)로 경계 투명도, 64프레임 약 1분 · 프레임 간 떨림 줄이기 · × 선명한 가장자리 → 배경 흐림·어둡게 + 차 뒤 크롬 ROMA(가림) + 실루엣 흰 빛 | SAM 2.1 × IS-Net(rembg, ONNX) | `pseg/intro_sam.npz`, `intro_bir.npz` |
| 13 3D 숫자·글자 | 금색 큰 숫자(765km·20인치·13.5초·255L·620마력·77.5kg·m·3.4초) `blender/bl_gold.py` / 차 뒤 히어로 모델명: 크롬 앞면·브랜드색 옆면·빨간 테두리 빛·누운 채 일어섬·빛 띠 쓸기, 1620×720 24프레임(약 8분) `blender/bl_hero_text.py` | Blender 5 (GPL, 결과물은 자유) | `bl/roma_g_*`, `bl/roma_roma` (저장소 밖) |
| 14 칩·자막 | 노랑 붓칠 칩(노션 원본), Pretendard 흰 자막 + 말하는 낱말 노랑 | g350_v5_lib · be_locked_rules.json | — |
| 15 소리 | 목소리 + 배경음(2회 이어붙임·말할 때 낮춤) + 규칙 효과음 → 2단 loudnorm −14 LUFS · TP −1.5 | FFmpeg | `.mp4` |
| 16 검사 | 규칙 값 · 칩 위치·색 · 음량 / 렌더러·싱크·번호판 / 사실 대조 | `check_be.py`, `edit_gate.py post --plates`, 웹 검색 | `.plan.json` |

## 2. 부위별 강조 설정 (`partfx.py`)

| 부위 | 효과 | 색 | 비고 |
|---|---|---|---|
| 그릴(타공 패널) | 구멍 파동 | 노랑 | 보닛 경계선 아래로 마스크를 잘라 씀 |
| 휠(캘리퍼 + 휠·타이어) | 캘리퍼 색 바꾸기(테두리 없음) + 휠·타이어 외곽선 | 페라리 옐로 | SAM 휠 전체 ∪ 캘리퍼, 구멍 메움(`pseg/wheelfull.npz`) |
| 탑(패브릭) | 색 바꾸기 | 흰색 60% | 손 마스크가 차체로 잡혀 손 가림 끔 |
| 배기구 | 색 바꾸기 | 흰색(크롬) | |
| 도어 스커프 레터링 | 색 바꾸기 | 흰색 | |
| 윈드 디플렉터(뒷좌석 등받이) | 색 바꾸기 | 레드 45% | 넓어서 옅게, 화면 테두리 구간 선 안 그림 |
| 카본 패들 | 색 바꾸기 | 레드 | 0.83초에서 끊음(스포크로 번짐) |
| 조수석 디스플레이 | 색 바꾸기 | 시안 | |
| 엔진(커버·흡기관) | 색 바꾸기 | 레드 | |

`PART_STYLE=outline`으로 바꾸면 v3의 노랑 외곽선 그리기 방식이 된다.

## 3. 시간 (CPU 2코어 · 메모리 7GB · GPU 없음)

| 작업 | 시간 |
|---|---|
| SAM 2.1 부위 1개(42프레임, 부위+손) | 약 6분 |
| SAM 2.1 인트로(정면 64프레임) | 약 6분 |
| IS-Net 인트로 64프레임 | 약 3.2분 |
| 전체 렌더(59.4초, 1080×1920·30fps) | 약 9분 |

마스크는 `pseg/*.npz`에 저장되어 다시 렌더할 때는 계산하지 않는다. 하루 1천 대를 만들려면 GPU 서버에서 SAM 2.1을 돌려야 한다(GPU 기준 부위당 수 초).

## 4. 조사했지만 쓰지 않은 것

| 도구 | 이유 |
|---|---|
| CoTracker3 | 점 추적 최상위지만 코드가 CC-BY-NC-4.0(비상업) |
| RMBG-2.0 | 가장자리 품질 좋지만 CC BY-NC 4.0(비상업) |
| BiRefNet (MIT) | 가장자리 최고 후보지만 이 서버 메모리(7GB)로는 한 장도 못 돌림 → GPU 서버에서 IS-Net 대신 쓸 1순위 |
| python-lottie | AGPLv3+ |
| MatAnyone | 영상 매팅 최상위지만 NTU S-Lab License 1.0(비상업) |
| Cutie (MIT) | 영상 객체 추적 일관성 좋음 — SAM 2.1과 역할이 겹쳐 보류 |
| IS-Net(rembg) 인트로 윤곽 | 어두운 소프트탑·유리에서 프레임마다 들쭉날쭉 → v9에서 ViTMatte로 교체 |
| Remotion | React 전용(리뉴얼 스택과 안 맞음), 4인 이상 회사는 유료 |
| Depth Anything V2 Base/Large | 비상업(Small만 Apache-2.0) — 손 가림은 SAM 손 마스크로 해결해서 불필요 |
| TAPNext/BootsTAPIR (Apache-2.0) | 쓸 수 있으나 SAM 2.1 마스크 추적으로 충분해 보류 |

## 5. 크로스체크 결과 (v5 · v6 같음)

- `check_be.py`: 통과
- `edit_gate.py post --plates`: 2건 표시
  - 렌더러가 표준(g350_v8_render.py)이 아님 → 나세르식 효과가 들어간 별도 렌더러라 의도된 차이. 표준 렌더러로 합치는 것이 다음 과제
  - 번호판 덮음 2건(255L·77.5kg·m) → 눈으로 확인한 결과 오탐. 255L 컷은 트렁크 안쪽 제원 스티커, 77.5kg·m 컷은 번호판이 숫자 아래에 그대로 보임
  - 음성↔자막 어긋남 950ms는 인트로 0.95초만큼 밀린 것이라 오탐 → 검사용 `voice_intro.wav`(앞 0.95초 무음)를 plan에 기록해 해결
- 사실 대조(페라리 공식 보도자료·제원 사이트): 620마력 · 760Nm(77.5kg·m) · 제로백 3.4초 · 탑 13.5초·시속 60km까지 · 트렁크 255L · 뒷좌석 등받이 일체형 윈드 디플렉터 · 3단 리어 스포일러 · 20인치 — 모두 일치. 「다섯 겹 패브릭 탑」은 출처에서 "다층"까지만 확인 → JATO 연결 후 재확인

## 6. 지킨 원칙

- 차 사진·영상 자체는 바꾸지 않음(자르기·확대·이동·배경 흐림만). 부위 색 바꾸기는 손이 닿는 1.4초 동안만 덧씌우는 그래픽
- 사실은 매물 정보 + 제조사 제원만, 딜러 개인 연락처 없음, 브랜드 로고는 글자로만
- 크레딧 쓰는 생성(음성)은 한 번만

## 7. 나세르식 인트로 — 사진 매물용 (`scripts/shortform/video_listing/nasser_intro/nasser_intro.py`)

플래시 몽타주(사진 3장 × 0.3초) → 정면 사진 히어로 3.7초. 사진에서 차 윤곽(IS-Net + 가운데 덩어리 + 가이드 필터) → 차 폭 960px·높이 600px 이하로 맞춰 가운데 배치 → 배경은 꽉 채운 흐림 + 어둡게 + 위 밤하늘 + 브랜드색 후광 + 아래 바닥 어둡게 → 블렌더 3D 모델명(`bl_hero_text.py`, 18프레임)이 차 윤곽 크기·자리를 따라 솟아오름(제목 줄 575px 아래) → 노랑 붓칠 브랜드 + 흰 모델명 + 사실 줄 → 실루엣 흰 빛. 차 한 대 렌더 약 1분(블렌더 글자 별도 약 5~8분).

샘플: 페라리 488 피스타 스파이더 · 람보르기니 우라칸 STO · 벤츠 G63 AMG · 포르쉐 911 터보 S 카브리올레 (`public/shortform-samples/nasser-intros-v1/`)

## 8. 스택 변경 (2026-11-25, 9차 재조사 반영 — 지시: 클로드코드 Opus 5.5 · 반영: 시안 마스터)

| 순위 | 대상 | 전 | 후 | 근거 |
| --- | --- | --- | --- | --- |
| 1 | 배경음 박자·강박 `photo_listing/common.py` `_bgm_beats()`·`BEAT_SNAP` | librosa beat_track, 강박 = `beats[::4]` | **Beat This!**(MIT, `final0`, `dbn=False`) 박자 + 마디 첫 박(downbeats), 강박 = downbeats | 옛 강박은 실제 마디 첫 박과 6곡 중 5곡에서 0~4%만 일치, 곡 첫 박 1~2초 늦음 |
| 2 | 계기판·성능지 한글 `photo_listing/odometer.py` `read_lines()` · `report_cut.py --read` | PP-OCRv6 하나(한국어 없음) | 숫자 = PP-OCRv6 그대로, 한글 줄 = **korean_PP-OCRv5_mobile_rec** 두 번째 엔진 | 한글 오류율 88% → 18%, 숫자 v6 7/8 · v5 6/8 |
| 3 | 딜러 육성 `lib/dealer_voice.py` · `listing_video_render.py` job `dealer_voice` | 처리 없음 | **DeepFilterNet3**(deep-filter 0.5.6 공식 실행 파일), 섞기 직전에만 | 말 없는 구간 잡음 약 40dB 감소 |
| 4 | 서버 영상 처리(Laravel 12) | 미정 | **pbmedia/laravel-ffmpeg 8.10** | Laravel 12·13, PHP 8.3+ 정식 지원 |
| 5 | 대본 있는 내레이션 낱말 시각 `photo_listing/align_script.py` | faster-whisper로 다시 받아씀(tr.py) | **Qwen3-ForcedAligner-0.6B**(별도 가상환경 /opt/qwen-align) | 첫 낱말 오차 중앙값 100ms → 20ms, 대본 글자 그대로 |

- **박자**: `bgm_beats.json` 키 끝 `:bt` = Beat This! 결과(`beats`, `downbeats`, `tempo`, `tool`). 저장소 배경음 7곡 미리 계산해 둠. torch 2.15용 torchaudio가 아직 없어 `scripts/shortform/lib/torchaudio_shim/`(load + MelSpectrogram, torch.stft + librosa 멜 필터)로 돌린다 — 정식 torchaudio가 있으면 그것을 쓴다. `BGM_START`(초)로 배경음을 앞에서 잘라 깔면 박자·마디 첫 박도 같이 당긴다. 박이 흐린 오케스트라 곡 `cazz_orchestral_beat`는 `BEAT_SNAP_EXCLUDE`로 박자 맞춤에서 뺀다(두 방식 34%만 일치). 로그 `[박자 맞춤] … 구간 경계 N/M개 마디 첫 박`: 컷은 말 싱크 창(첫 낱말 0.45초 전 ~ 0.04초 전) 안에서만 움직이므로, 창 안에 마디 첫 박이 없으면 일반 박에 붙는다.
- **한글 인식**: `odometer._ocr()`(v6) 결과·캐시 형식은 그대로라 주행거리 동그라미 찾기는 바뀌지 않는다. `odometer.read_lines(사진)` = 한글 줄(한국어 엔진) + 한글 줄과 숫자가 다른 v6 숫자 줄. `report_cut.py <차 폴더> --read [파일]`은 성능지 원본 글자를 줄 단위로 보여 주는 대조용(차량번호·차대번호처럼 보이는 줄은 가림) — 칸에 넣는 말은 사람이 확인한 사실만.
- **딜러 육성**: `dealer_voice.denoise(입력, atten_db=None)` → 48kHz wav. 너무 깨끗해 어색하면 `atten_db=18`. ElevenLabs 음성·받아쓰기 전처리에는 쓰지 않는다. 설치 `lib/install_deep_filter.sh`. 음량은 섞은 뒤 `be_locked_rules.json` loudnorm.
- **서버(Laravel 12)**: 영상 자르기·이어 붙이기·인코딩·썸네일은 `pbmedia/laravel-ffmpeg` 8.10(`FFMpeg::fromDisk()->open()->export()->toDisk()->inFormat(new X264)`), 무거운 렌더는 큐 작업으로. 리액트·Remotion 금지. Python 워커(렌더러·Beat This!·OCR·deep-filter·Qwen 정렬)는 큐에서 프로세스로 부르고 결과 파일만 주고받는다.
- **낱말 시각**: `python3 align_script.py <차 폴더> [대본]`(기본 tts.txt → script.txt, `[calm]` 같은 태그는 뺌) → `voice_a_words.json` `[[시작, 끝, 어절]]`(tr.py와 같은 형식, 대본 띄어쓰기 어절로 다시 묶음). qwen-asr 0.0.6이 transformers 4.57.6을 고정 요구해 `/opt/qwen-align`(`--system-site-packages`, torch는 공유)에서 돌고, 기본 파이썬으로 실행하면 알아서 그 가상환경으로 다시 실행한다. 설치 `lib/install_qwen_align.sh`. 5분 이하. **대본 없는 딜러 육성은 tr.py(faster-whisper) 유지.**
- **쓰지 않는 것**: Supertonic 3 · MeloTTS · Chatterbox · F5-TTS · XTTS v2 · EXAONE 3.5/4.0 · YOLOE/YOLO-World/Ultralytics · Stable Audio 3 · Hunyuan3D · madmom DBN · Remotion.
