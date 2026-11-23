# 숏폼 제작 오픈소스 전수조사 v1 (2026-11-24)

- 범위: 숏폼·영상 편집 파이프라인(`scripts/shortform/`)과 브라우저 키트(`nuxt-shootkit` · `nuxt-shortform` · `nuxt-carstudio` · `nuxt-review` · `nuxt-shorts` · `nuxt-community`)
- 방법: 코드의 import·package.json·모델 파일을 기준으로 조사했다. 설치된 버전과 라이선스는 패키지 정보로 확인했고, 확실하지 않은 라이선스는 공식 페이지에서 확인했다.

## 1. 지금 쓰는 것 (문제 없음)

| 할 일 | 오픈소스 | 버전 | 라이선스 | 쓰는 곳 |
|---|---|---|---|---|
| 낱말 시각 받아쓰기 | faster-whisper · CTranslate2 | 1.2.1 · 4.9.1 | MIT | 영상·사진 숏폼 전부 |
| 영상 자르기·합치기·인코딩 | FFmpeg | 6.1.1 | GPL 빌드(libx264·x265) | 서버 렌더 |
| 이미지 그리기·글자 | Pillow · NumPy | 13.0 · 2.5 | MIT-CMU · BSD | 칩·자막·카드 |
| 영상 프레임 처리 | OpenCV | 5.1 | Apache-2.0 | 추적·자르기 |
| 부위 찾기(문장으로 물체 찾기) | OWLv2 | — | Apache-2.0 | 시트·휠 위치 |
| 장면 분류 | SigLIP2 · CLIP | — | Apache-2.0 · MIT | 장면 태깅·촬영 키트 부위 나누기 |
| 점 추적 | TAPNet(BootsTAPIR) | — | Apache-2.0 | 로마 화살표 칩 |
| 물체 추적 | OpenCV Zoo VitTrack | 2023sep | Apache-2.0 | 부위 따라가기 |
| 번호판 찾기 | OpenCV Zoo LPD-YuNet | 2023mar int8 | Apache-2.0 | 영상 편집 가림·오탐 검사 |
| 계기판 글자 읽기 | RapidOCR(PP-OCRv6) | 3.10 | Apache-2.0 | 주행거리 확인 |
| 효과음 고르기 | LAION CLAP | larger_clap_general | Apache-2.0 | 효과음 채점 |
| 효과음 원본 | Openverse | — | CC0만 받음 | 효과음 라이브러리 |
| 소리 분석 | librosa · soundfile | 1.0 · 0.14 | ISC · BSD-3 | 박자·자르기 |
| 손·몸 찾기 | MediaPipe | 0.10.32 | Apache-2.0 | 설치만 됨 |
| 모델 실행 | PyTorch · transformers · onnxruntime | 2.15 · 5.24 · 1.32 | BSD/Apache · Apache · MIT | 공통 |
| 글꼴 | Pretendard | — | OFL | 자막·칩 |
| 브라우저 mp4 만들기 | Mediabunny | 1.61.3 | MPL-2.0 | 촬영 키트·숏폼 키트·카스튜디오 |
| 브라우저 모델 실행 | onnxruntime-web · transformers.js | — | MIT · Apache-2.0 | 번호판·부위 나누기 |
| QR | qrcode-generator | 2.0.4 | MIT | 끝 장면 QR |
| 글쓰기 편집기 | Tiptap | 3.27.3 | MIT | 커뮤니티 |
| 화면 캡처 검사 | Playwright | 1.63 | Apache-2.0 | QA |

## 2. 바로 고쳐야 할 것

1. **edge-tts 사용 중지**
   - 쓰는 곳: `sag_reel_v1.py` · `dealer_narration_sample.py`
   - 이유: 마이크로소프트 공식 API가 아닌 비공식 접속이다. 서비스에 쓰면 약관 위험이 있다(숏폼 도구 규칙에서 금지).
   - 바꿀 것: 기본 음성은 지금처럼 일레븐랩스로 둔다. 무료 대안이 필요하면 MeloTTS-Korean(MIT, 상용 가능)을 쓴다.
2. **nuxt-shootkit 버전 고정 위반**
   - 지금 상태: nuxt 4.6.4 · vue 3.5.45로 되어 있다. 기술 스택 규칙은 nuxt 4.6.2 · vue 3.5.33이다.
   - 바꿀 것: overrides로 vue를 3.5.33으로 맞춘다.
3. **onnxruntime-web 개발판 사용**
   - 지금 상태: nuxt-shootkit이 `1.22.0-dev.20250409`를 쓰고, nuxt-review는 정식판 1.30.0을 쓴다.
   - 바꿀 것: 정식판 1.30.0 하나로 맞춘다.
4. **FFmpeg GPL 빌드**
   - 서버 안에서 렌더만 할 때는 문제가 없다.
   - 다만 FFmpeg를 앱에 넣어 배포하면 GPL 의무가 생긴다. 앱(Flutter)에 넣을 때는 LGPL 빌드를 쓰거나 기기 내장 인코더를 쓴다.
5. **Mediabunny는 MPL-2.0**
   - 상용 서비스에 써도 된다.
   - 라이브러리 파일 자체를 고치면 그 파일은 공개해야 한다. 지금은 고치지 않고 그대로 쓰고 있다.

## 3. 새로 필요한 것 (로마 r11·r12 채점에서 나온 빈칸 기준)

| 빈칸 | 추천 오픈소스 | 라이선스 | 효과 | 우선 |
|---|---|---|---|---|
| 원본 영상 장면 자동 나누기(지금은 사람이 구간을 고름) | PySceneDetect | BSD-3 | 장면 고르기 시간 단축, 컷 후보 자동 | 1 |
| 손이 부위를 가리는 장면 거르기(r12 「최대 토크」 감점) | MediaPipe Hands(설치됨) | Apache-2.0 | 손 가린 구간을 후보에서 뺌 | 1 |
| 낱말 시각 정확도(r11에서 V8·제로백 시각 비어 손으로 채움) | WhisperX 정렬(wav2vec2) | BSD-2(확인 필요) | 받아쓰기 시각 빈칸 줄임 | 2 |
| 부위 모양 따라 추적·가림 판정 | SAM 2 | Apache-2.0 | 칩이 부위를 덮는지 자동 판정 | 2 |
| 한국 번호판 검출 보강(YuNet은 한국 번호판 60장 중 40장 + 오탐) | 같은 라이선스 계열 모델 미세조정(RT-DETR 등, Apache-2.0) | Apache-2.0 | edit_gate 번호판 오탐 감소 | 2 |
| 음량 측정 파이썬판 | pyloudnorm | MIT | 검사 스크립트 단순화(ffmpeg로도 가능) | 3 |
| 무료 한국어 남성 음성 | MeloTTS-Korean | MIT | edge-tts 대체, 대량 샘플 무료 | 3 |

### 쓰지 말 것
- **Ultralytics YOLO:** AGPL-3.0이라 서비스에 쓰면 소스 공개 의무가 생긴다.
- **Remotion:** 리액트 전용이고, 회사 규모에 따라 유료 라이선스가 필요하다.
- **Supertonic 1:** 모델이 OpenRAIL-M이고 영어 전용이다. 한국어를 지원하는 2·3판은 확인이 필요하다.

## 4. 처리 결과 (2026-11-24 「모두 수정해」)

| 항목 | 처리 |
|---|---|
| edge-tts | `sag_reel_v1.py` · `dealer_narration_sample.py`에서 뺐다. 새 공용 부품 `scripts/shortform/voice_source.py`가 블록 음성을 만든다. `VOICE_ENGINE=file`(기본)은 일레븐랩스로 한 번 만든 `VOICE_DIR/b00.mp3…`를 쓰고, `VOICE_ENGINE=melo`는 MeloTTS-Korean을 쓴다. 낱말 시각은 faster-whisper로 받아쓴 뒤 대본 글자에 맞춘다(로마 음성 9초로 시험 통과) |
| nuxt-shootkit 버전 | nuxt 4.6.2 · vue 3.5.33(overrides 포함)으로 고쳤다. `pnpm build`와 `pnpm typecheck` 모두 통과 |
| onnxruntime-web | 1.30.0 정식판으로 바꿨다. 쇼룸 배경의 wasm 주소도 같은 버전으로 맞췄다. 부위 나누기(transformers.js)는 자기 안의 실행기를 그대로 쓴다 |
| 장면 후보·손 가림(1순위) | `scripts/shortform/video_listing/scene_candidates.py` 추가. PySceneDetect 0.6.7 + MediaPipe Hand Landmarker(모델 `scripts/shortform/models/hand_landmarker.task`, Apache-2.0) + 선명도. 로마 원본 222초 → 장면 39개(쓸만함 21 · 손 가림 1 · 흐림 17), r12 「최대 토크」 원본 구간(204.95초)의 손을 찾아냈다 |
| pyloudnorm | 설치함(검사 스크립트 정리 때 사용) |
| 2순위(WhisperX · SAM 2 · 번호판 미세조정) | 아직 하지 않았다. 모델이 크고(수 GB) 작업 환경 저장 공간이 모자라 별도 작업으로 진행한다 |
| MeloTTS 시험 | 부품은 연결했고 설치·음질 비교는 다음에 한다(설치 크기 약 1~2GB) |

## 5. 다음 순서
1. edge-tts를 빼고 MeloTTS-Korean을 시험한다(샘플 1개, 음질 비교).
2. PySceneDetect와 MediaPipe Hands로 「장면 후보 + 손 가림 제외」를 만들어 로마 r13 장면 고르기에 쓴다.
3. nuxt-shootkit 버전 정리(vue 3.5.33, onnxruntime-web 1.30.0)는 촬영 키트 담당 작업창에 넘긴다.
