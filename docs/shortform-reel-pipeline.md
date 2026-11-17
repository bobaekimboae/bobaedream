# 매물 릴스 제작 파이프라인 — 에이전트 공용 v1

작성: 클로드코드 · 2026-11-07
목적: 클로드코드 · 코덱스 · 다른 에이전트 누구든 같은 결과물(서울오토갤러리 파나메라 샘플 수준)을 만들 수 있게, 쓰는 도구 · 파일 · 명령 · 확정 디자인 값을 한곳에 정리한다.
배포 샘플: https://bobaekimboae.github.io/bobaedream/shortform-samples/sag-reel-v1/?v=4ac12c9

## 1. 전체 흐름

```
원본 영상 + 매물 정보
 → ① 원본 맞추기(FFmpeg)
 → ② 대본 쓰기(BLOCKS)
 → ③ 음성 만들기(일레븐랩스) → ④ 낱말 시각 받기(일레븐랩스 받아쓰기)
 → ⑤ 렌더(scripts/shortform/sag_reel_v1.py: 컷 · 자막 · 스티커 · 음악 · 소리 크기)
 → ⑥ 눈으로 확인(장면 모음 · LUFS)
 → ⑦ 샘플 페이지 갱신 → PR → 「배포해」 후 병합 → GitHub Pages
 → ⑧ 노션 기록
```

## 2. 필요한 것 — 에이전트별

| 단계 | 클로드코드(이 세션) | 코덱스 · 다른 에이전트 |
|---|---|---|
| ① 원본 맞추기 · ⑤ 렌더 · ⑥ 확인 | 로컬 Python + FFmpeg | 같음. 저장소만 있으면 됨 |
| ③ 음성 | ElevenLabs MCP `creative_generate_speech` | 일레븐랩스 웹(elevenlabs.io)에서 같은 목소리로 만들어 mp3 저장, 또는 일레븐랩스 API 키로 직접 호출(키는 노트북 환경변수 `ELEVENLABS_API_KEY`, 채팅에 붙여넣지 않음) |
| ④ 낱말 시각 | ElevenLabs MCP `creative_transcribe_audio` | 일레븐랩스 Speech to Text(Scribe) 웹·API, 또는 오픈소스 faster-whisper(단어 시각 켜기) |
| 레퍼런스 학습 | Claude in Chrome(로그인된 크롬) | 사람이 캡처를 넘겨줌 |
| ⑦ 배포 | gh CLI(REST API) | 같음. 병합은 사용자가 「배포해」라고 했을 때만 |
| ⑧ 기록 | Notion MCP | 노션 웹에서 직접 |

필요 패키지: Python 3 · `opencv-python` · `Pillow` · `numpy` · `onnxruntime`(번호판 검출을 켤 때만) · FFmpeg. 글꼴은 저장소 `scripts/shortform/fonts/`(Pretendard 1.3.9, OFL)에 들어 있다.

관련 스킬(클로드): `bobae-shortform-tools`(도구 고르기), `bobae-listing-reel-pipeline`(이 문서와 같은 절차).

## 3. 단계별 방법

### ① 원본 맞추기
```
ffmpeg -i 원본.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" -an -c:v libx264 -crf 18 norm.mp4
```
부위가 시작하는 초를 적어 둔다(외관 정면 · 측면 · 후면 · 휠 · 실내 · 센터 · 선루프 · 뒷좌석 · 운전석 · 트렁크).

### ② 대본 — `scripts/shortform/sag_reel_v1.py`의 `CAR` · `BLOCKS`
- 신차 리뷰 순서, 「~습니다」: 「오늘 리뷰할 차는 ○○입니다. 가격은 ○○만 원」 → 연식 · 코드네임 · 세대 · 엔진 · 구동 → 「디자인부터 보시죠」 → 휠 → 후면 → 「실내로 들어가 보겠습니다」 → 트렁크 용량 → 「정리하면」 등록 연월 · 주행 · 가격 → 「자세한 내용은 보배드림 앱에서 확인하시면 됩니다」.
- 사실만: 매물 정보 · 영상에 보이는 것 · 그 차종 공식 제원. 모르는 것(사고 이력 등)은 말하지 않는다.
- 블록 칸: `sec`(부위) · `tts`(읽을 문장, 숫자는 읽는 대로: 포, 구칠일, 사백구십오 리터) · `caps`(화면 자막 구절, 숫자로) · `shots`[(원본 초, 속도, 번호판 여부)] · `stickers`[(글자, 구절 번호)] · 첫 블록 `hook=True`, 마지막 `end=True`.
- 읽는 말 → 화면 글자 바꾸기는 `SHOW` 사전(예: 구칠일 → 971).

### ③ 음성
- 모델 eleven_v4(MCP 이름 기준) · 목소리 「Mr.J - Korean Creator」(voice_id `HvCQYI15cbdFVC9pSBfb`).
- 블록의 `tts`를 줄바꿈으로 이어 한 번에 만든다. 2테이크 중 하나 고르기. 전체 약 $0.09/테이크.
- 한 문장만 바꿀 때: 그 문장만 만들고, 원본의 문장 사이 무음(`ffmpeg -af silencedetect=n=-40dB:d=0.06`) 가운데에서 잘라 이어 붙인다.
- 생성은 다시 시도하려고 반복하지 않는다(매번 비용).

### ④ 낱말 시각
- 받아쓰기 결과를 `[{"text": "오늘", "start": 0.0, "end": 0.24}, …]` 모양 JSON으로 저장.
- 이어 붙인 문장은 받아쓰기 없이 글자 수 비율로 시각을 나눠 넣어도 된다.

### ⑤ 렌더
```
SAG_VOICE_FILE=voice.mp3 SAG_VOICE_WORDS=words.json python3 scripts/shortform/sag_reel_v1.py norm.mp4 out/
```
- 결과: `out/sag_reel_v1.mp4` · `out/meta.json`. 약 4분.
- `SAG_VOICE_FILE`이 없으면 edge-tts 임시 음성으로 만든다(서비스용으로 쓰지 않음).
- 끝나면 `scripts/shortform/__pycache__` 삭제(커밋하지 않음).

### ⑥ 확인
```
ffmpeg -i out/sag_reel_v1.mp4 -af ebur128 -f null - 2>&1 | grep -A1 Integrated   # 약 -14 LUFS
ffmpeg -i out/sag_reel_v1.mp4 -vf "fps=1/2.5,scale=180:-1,tile=9x3" -frames:v 1 sheet.jpg
```
장면 모음에서 자막 · 스티커 · 세이프존 · 끝 카드를 눈으로 본다.

### ⑦ 샘플 페이지 · 배포
```
ffmpeg -i out/sag_reel_v1.mp4 -c:v libx264 -preset veryfast -crf 24 -maxrate 3M -bufsize 6M -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart public/shortform-samples/sag-reel-v1/panamera-v1.mp4
```
- `poster.jpg`(0.8초 장면), `index.html`의 대본 줄(`rows`)과 「만드는 방식」 갱신.
- 새 브랜치 → 커밋 → PR. 병합 · 배포는 「배포해」를 받은 뒤. 배포 후 `?v=<커밋 7자리>`로 페이지 · 영상 200 확인.

### ⑧ 기록
노션 「숏폼 자동 제작」 페이지에 버전마다 지시 · 제작 방식 · 작업 시간 · 비용 · 배포 주소. 레퍼런스 학습은 「자막 레퍼런스」 페이지.

## 4. 확정 디자인 값

| 요소 | 값 |
|---|---|
| 화면 | 1080×1920 · 30fps |
| 말 자막 | Pretendard SemiBold 64px · 줄 높이 80 · 검정 바탕 알파 140 · 흰 글자 · 지금 읽는 낱말만 노랑(255,214,10) · 문장부호 없음 · 가운데 x=459 · y=1360 |
| 세이프존 | 위 240 · 아래 240 · 오른쪽 216 · 좌우 54 |
| 자막 싱크 | 말보다 0.12초 먼저 · 자막 사이 2프레임 · 최소 5/6초 · 최대 7초 · 끝나고 0.35초 유지 |
| 키워드 스티커 | 보배드림 파랑 #306BD9 · 흰 Pretendard Bold · 안은 단색, 위·아래 잔물결, 양 끝 붓 끊김, 살짝 사다리꼴, 2~3도 기울임(장면마다 다르게) · 상자 높이 = 글자 높이 약 2.1배 |
| 스티커 배치 | 숫자 사양 가운데 116px · y=760 / 기능 이름 68px · 좌·우·가운데 번갈아 · y=1120 / 가격은 왼쪽에서 밀려 들어옴 / 말하는 구절에 맞춰 0.28초 살짝 튀어나옴 |
| 첫 장면 | 차명 파랑 스티커 + 흰 가격 + 연식·주행·연료 |
| 진행선 | 파랑 7px, 맨 위 |
| 부위 칩 | 쓰지 않음 |
| 끝 카드 | 차명 · 요약 · 파랑 가격 스티커 · 「보배드림 앱에서 확인하세요」 흰 알약 |
| 소리 | 코드로 만든 배경음악 112bpm(저작권 없음) · 목소리 나오면 줄임 · 부위 바뀔 때만 휙 소리 · -14 LUFS |
| 번호판 | 가리지 않음(기본). `SAG_PLATE_COVER=1`이면 자동 가림 |

## 5. 지킬 것
- 사진 · 영상은 자르기 · 이동 · 확대 · 색 보정만. 배경 지우기 · AI 생성 금지.
- 다른 회사(오토스카우트24 등)의 그림 파일 · 로고는 쓰지 않는다. 구조와 칠 방식만 배워 새로 그린다.
- 개인 연락처 · 차량번호를 자막 · 글에 쓰지 않는다.
- 새 서비스 코드는 리뉴얼 기술 스택(Nuxt 4 · Vue 3 · TS / Laravel 12). 이 Python 스크립트는 시안 · 샘플 제작용.

## 6. 남은 것
- 현장 소리(문 · 엔진) 살리기
- 외관 + 실내 화면 나누기, 딜러 이름 → 보배드림 로고 끝 카드
- 매물 정보(JSON)만 넣으면 대본 `BLOCKS`가 자동으로 만들어지게(지금은 손으로 씀)
- 서비스화: 같은 입력을 Laravel 작업 대기열 워커로 돌리기
