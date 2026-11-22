---
name: "bobae-shortform-tools"
description: "보배드림 매물 사진·영상으로 숏폼을 만들거나 편집·자막·한국어 내레이션·SNS 게시를 할 때 어떤 연결 도구와 오픈소스를 쓸지 정하는 규칙."
---

# 보배드림 숏폼 도구 선택 규칙

보배드림 중고차 매물 숏폼(사진 숏폼 · 영상 숏폼 · 자막 · 음성 · 게시) 작업을 할 때 이 순서로 도구를 고른다.

## 꼭 지킬 원칙

- 사진·영상은 고치지 않는다(반사기 원칙): 자르기 · 이동 · 확대 · 흐린 채움만. AI 배경 바꾸기·지우기 금지.
- 자막·첫 화면 문구에는 딜러가 입력한 사실만 넣는다(차명 · 연식 · 주행 · 가격 · 딜러 정보). 지어내지 않는다.
- 숏폼 영상에 다른 회사 로고·워터마크를 넣지 않는다.
- 개인 연락처 · 차량번호를 자막·글에 쓰지 않는다. 050 안심번호는 tel 링크로 만들지 않는다.
- 크레딧을 쓰는 생성(음성 · 영상 · 클립)은 다시 시도하려고 반복 호출하지 않는다. 한 번 만들고 결과를 확인한다.
- 새 코드는 보배드림 리뉴얼 기술 스택으로 만든다(Nuxt 4 · Vue 3 · TypeScript, 서버 Laravel 12). 리액트 금지.

## 할 일별 도구

| 할 일 | 1순위 | 대안 |
|---|---|---|
| 매물 사진 → 숏폼(켄번스 이동·자막·끝 명함) | 우리 숏폼 제작기(`nuxt-shootkit` / `src/prototype/dealer-page/shortform/render.ts`, 브라우저 Mediabunny) | Orshot 템플릿 영상, HyperFrames(HTML 템플릿, Apache 2.0) |
| 무편집 영상 → 짧은 클립 | 우리 쇼츠 만들기(부위별 영상 자동 컷) | OpusClip, AI Producer by OpusClip, Descript |
| 한국어 남성 내레이션 | ElevenLabs `creative_generate_speech` (`creative_list_voices` languages=['ko'], gender='male'로 고름. 후보: Jubal 영업 톤, Mr.H 크리에이터, Minchul 차분) | vidIQ voiceover, Speko `audio_synthesize`, 오픈소스 Supertonic 3 · MeloTTS-Korean |
| 음성 → 자막(단어별 시간) | ElevenLabs `creative_transcribe_audio` 또는 Speko `audio_transcribe` | 오픈소스 faster-whisper · WhisperX(large-v3-turbo, 한국어 미세조정판) |
| 음성 잡음 제거 | Adobe `media_enhance_speech` | AI Producer `enhance_voice` |
| 컷·사진 부위 판정 | 오픈소스 SigLIP 2 base(`scripts/shortform/auto/vlm.py`, Apache-2.0, 2026-11-22 기본) | `BBM_VLM=clip`(옛 CLIP, 비교용만) |
| 부위 위치·추적 | OWLv2(`part_anchor.py`) + OpenCV VitTrack(`models/vittrack_2023sep.onnx`) | CSRT(모델이 없으면 자동 대체) |
| 계기판 주행거리 읽기 | RapidOCR 3.x(PP-OCRv6, Apache-2.0, `odometer.py`) | — |
| 영상 인코딩 | FFmpeg(시스템 6.1.1) | FFmpeg 9.0.2 정적판(BtbN, GPL) — cha13 렌더·검사 통과, 기본 교체는 사용자 승인 후 |
| 9:16 · 1:1 · 16:9 비율 바꾸기 | 우리 제작기 비율 선택 | Adobe `video_resize` |
| 표지·썸네일 | Canva | vidIQ 썸네일 점수 |
| 인스타·틱톡·유튜브 게시 | 휴대폰 공유창(우리 제작기) | postiz 스킬(예약), vidIQ 인스타 릴스 게시, OpusClip 예약 |

## 쓰지 않는 것

- Remotion: React 전용이라 스택과 맞지 않음.
- Edge TTS(비공식): 공식 API가 아니라 서비스에 쓰면 약관 위험.
- 유료 외부 서비스에 딜러 원본 영상을 대량으로 올리는 구조는 서비스 본체로 쓰지 않는다(비용·개인정보). 품질 비교·기획용으로만.

## 기록

도구 비교·결정은 노션 '에이전트 의견' DB에 에이전트 이름 · 버전과 함께 남긴다.