# 숏폼 자동 편집 도구 목록

[마스터 문서](README.md)의 5장 「만드는 흐름」 단계(P01~P15)별로 쓰는 도구와 판단을 모았다. 도구 번호(TL01~)는 이 목록 안에서만 쓰는 번호다. 옵션 편집 기법 번호 T01~T08(`feature_edit_rules.json`)과는 다르다.

- 표시: ✅ 채택 · 🧪 시험 · 💡 참고 · ⏸ 보류 · ⛔ 쓰지 않음
- 라이선스는 2026-11-08 기준으로 확인했다. 설치하기 전에 다시 확인한다.
- 새 도구를 넣거나 판단을 바꾸면 `CHANGELOG.md`에 한 줄 적는다.
- 원칙 5(2026-11-22): 이미지 생성 스티커 · 3D 아이콘(TL22 · TL26)은 시험용. 사용자가 세트를 승인해 자산으로 등록한 것만 영상에 쓴다.
- 숫자 값(음량 · 크기 등)은 여기 적힌 것보다 규칙 파일이 우선이다. ✅는 「쓰기로 정함」이고, 지금 실제로 돌아가는 것은 README 5장 「지금 쓰는 것」 칸이 기준이다(예: 받아쓰기는 지금 faster-whisper).

## P01 매물 사실
| 번호 | 도구 | 구분 | 비고 |
|---|---|---|---|
| TL01 | 보배드림 매물 API(Laravel) | ✅ | 차명 · 연식 · 주행 · 가격 · 옵션 · 딜러. 대본 · 자막의 유일한 사실 출처 |

## P02 촬영 영상 분석 · 컷 시간표(촬영키트 영상 포함)
| 번호 | 도구 | 구분 | 비고 |
|---|---|---|---|
| TL02 | PySceneDetect | ✅ | BSD-3. 컷 시점 · 장면 길이 |
| TL03 | TransNetV2 | 🧪 | MIT. 빠른 전환 보완 |
| TL04 | CLIP 부위 분류(촬영키트에 이미 있음, open_clip) | ✅ | 컷마다 「외관 정면 · 휠 · 계기판 …」 이름표 |
| TL05 | 촬영키트 부위 기록(chapters) | ✅ | 키트로 찍은 영상은 부위 시각이 이미 있음 → 분석 없이 바로 씀 |
| TL06 | Gemini 영상 이해 | 🧪 | 장면 설명 · 순서표 보조. 무료 한도 하루 20편/모델 |
| TL07 | Picsart `segment_shots` · `describe_video` (MCP) | 🧪 | 검수 · 비교용, 크레딧 |

## P03 대본(자동 대사)
| 번호 | 도구 | 구분 | 비고 |
|---|---|---|---|
| TL08 | LLM(Claude · Gemini) + 사실 대조 검사 | ✅ | 구성: 훅 → 차 소개 → 사양 → 기능(3분의 1) → 가격 → 앱 안내. 매물 정보에 없는 숫자 · 옵션 나오면 실패 처리 |
| TL09 | 말투 프리셋(표준 · 유머 · 사투리) | ✅ | 규격 파일에 넣음 |

## P04 음성(TTS) — 확정
| 번호 | 도구 | 구분 | 비고 |
|---|---|---|---|
| TL10 | 일레븐랩스 TTS(v4) | ✅ 확정 | 남성 · 여성 · 사투리 목소리 고정 목록 |

## P05 낱말 시각(받아쓰기)
| 번호 | 도구 | 구분 | 비고 |
|---|---|---|---|
| TL11 | 일레븐랩스 받아쓰기(Scribe) | ✅ | TTS와 같은 회사, 낱말 시각 |
| TL12 | faster-whisper · WhisperX | ✅ 대안 | MIT · BSD-2, 서버 설치형 |
| TL13 | trim_voice.py(우리) | ✅ | 다시 녹음 없이 구절 잘라 길이 맞춤 |

## P06 컷 고르기
| 번호 | 도구 | 구분 | 비고 |
|---|---|---|---|
| TL14 | 우리 규칙 엔진(sag_reel) | ✅ | 말 구절마다 컷, 같은 장면 반복 2번까지, 부위 이름표(TL04)로 대사와 맞춤 |
| TL15 | auto-editor | 🧪 | Unlicense. 딜러 원본 무음 · 흔들림 구간 빼기 |

## P07 옵션 인식 → 말풍선 · 칩 칠
| 번호 | 도구 | 구분 | 비고 |
|---|---|---|---|
| TL16 | 매물 옵션 목록(TL01) | ✅ | 옵션 「있다」는 매물 정보로만 판단 |
| TL17 | CLIP · Gemini 화면 확인 | ✅ | 그 옵션이 보이는 컷과 시각 찾기(어라운드뷰 화면 · 선루프 등) |
| TL18 | Grounding DINO · SAM 2 | 🧪 | Apache-2.0. 부위 위치 → 말풍선 꼬리 방향 |

## P08 자막 · 칠
| 번호 | 도구 | 구분 | 비고 |
|---|---|---|---|
| TL19 | AS24 원본 칠 SVG(노션 아이콘 DB) | ✅ | 원본 색 `brush-fill/as24-original/`, 칩용 노랑 판 `brush-fill/as24-theme/`(칩은 `chip.fill_fit`으로 골라 같은 배율로만 키움) |
| TL20 | Pillow · rsvg | ✅ | 칠 · 글자 그리기 |
| TL21 | Pretendard 글꼴 | ✅ | OFL |

## P09 이모지 · 스티커 · 3D 아이콘
| 번호 | 도구 | 구분 | 비고 |
|---|---|---|---|
| TL22 | 자체 생성 그림 스티커(일레븐랩스 · GPT Image) | 🧪 | 말 스티커 완성. `public/assets/shortform/sticker-art/` |
| TL23 | Microsoft Fluent Emoji (3D 포함) | ✅ | MIT. 애니메이션판은 받을 때 라이선스 재확인 |
| TL24 | Google Noto 움직이는 이모지 | 🧪 | Lottie · WebP · GIF, CC BY 4.0(확인 필요, 출처 표기) |
| TL25 | 3dicons | 🧪 | CC0(초기판), 블렌더 원본 있음 → 이집트식 3D 포인트 아이콘 바탕 |
| TL26 | 3D 아이콘 자체 제작: 이미지 생성 + 같은 조명 · 각도 프롬프트 고정 | 🧪 | 이집트 앱 3D 아이콘처럼 우리 세트 제작. 3D 생성 모델은 비용 대비 낮음 |
| TL27 | OpenMoji · Twemoji | 💡 | CC BY-SA · CC BY |
| ⛔ | GIPHY · Tenor · 캡컷 스티커 | ⛔ | 저작권 · API 중단(Tenor 2026) · 캡컷 안에서만 허락 |

## P10 중간 애니메이션(캡컷 같은 효과)
| 번호 | 도구 | 구분 | 비고 |
|---|---|---|---|
| TL28 | FFmpeg 필터(줌 · 이동 · 페이드) | 🧪 | 2026-11-22 정정: 지금 사진판은 FFmpeg 필터가 아니라 파이썬(Pillow)이 프레임마다 그려 FFmpeg로 인코딩한다(41초 영상 116초). 켄번스 · 페이드를 FFmpeg 필터로 옮기면 빨라질 후보(README 12장 K4) |
| TL29 | HyperFrames(헤이젠) | 🧪 | Apache-2.0. HTML · CSS · GSAP → mp4. 숫자 팝업 · 끝 카드 템플릿 |
| TL30 | gl-transitions · ffmpeg-concat | 💡 | 전환 효과 모음. AS24는 바로 컷이라 쓸 일 적음 |
| TL31 | Lottie 렌더(rlottie) | 🧪 | 움직이는 스티커 |
| ⛔ | Remotion · Revideo | ⛔ | React 계열 · 라이선스/유지 상태 확인 안 됨 |

## P11 효과음
| 번호 | 도구 | 구분 | 비고 |
|---|---|---|---|
| TL32 | 자체 효과음 팩(일레븐랩스 효과음 생성) | ✅ | 톡 · 휙 · 띵(딸깍은 보류, v0.0.3) + 비유 4종 · 말 울음. `public/assets/shortform/sfx/` |
| TL33 | Freesound(CC0만) · Kenney Audio(CC0) | 🧪 | 팩 늘릴 때 |
| TL34 | Sonniss GDC 번들 | 🧪 | 실제 차 소리(문 · 엔진) |
| TL35 | librosa · PANNs | 🧪 | 레퍼런스 효과음 시점 측정 |
| ⛔ | MMAudio | ⛔ | 코드 MIT지만 가중치 CC BY-NC(비상업) |

## P12 배경음악
| 번호 | 도구 | 구분 | 비고 |
|---|---|---|---|
| TL36 | 일레븐랩스 음악 생성 | ✅ | 110~120 BPM 곡 몇 개를 만들어 돌려 씀 |
| TL37 | ACE-Step 1.5 | 🧪 | Apache-2.0(2026-02), 자체 서버 생성. 결과물 조건은 원문 재확인 |
| TL38 | Beat This! · librosa | 🧪 | 박자 · 마디 |
| TL39 | Pixabay 음악 | 💡 | 유튜브 Content ID 걸림 위험 |

## P13 합치기 · 음량 · mp4 저장
| 번호 | 도구 | 구분 | 비고 |
|---|---|---|---|
| TL40 | FFmpeg(필요 시 GPU 인코딩 NVENC) | ✅ | 한 번에 합치기 |
| TL41 | loudnorm · pyloudnorm | ✅ | −14 LUFS |
| TL42 | Laravel 큐 + 영상 서버 여러 대 | ✅ | 하루 수천 대. 실측(2026-11-22): 사진판 41초 영상 1편 116초/2코어 → 서버 1대 하루 약 745편 |
| TL43 | Shotstack · Creatomate · JSON2Video(유료 렌더 API) | 💡 | 분당 약 0.1~0.25달러. 서버 운영 대신 쓸 수 있는 대안 |

## P14 품질 검사(같은 품질)
| 번호 | 도구 | 구분 | 비고 |
|---|---|---|---|
| TL44 | 규격 검사기(음량 · 길이 · 자막 위치 · 컷 길이) | ✅ | 규격 벗어나면 출고 막음 |
| TL45 | PaddleOCR | 🧪 | Apache-2.0. 자막 위치 실측 |
| TL46 | Picsart · Gemini 자동 검수 | 🧪 | 「효과음 안 들림」 같은 걸 잡음 |

## P15 업로드(인스타 릴스 · 틱톡 · 유튜브 쇼츠)
| 번호 | 도구 | 구분 | 비고 |
|---|---|---|---|
| TL47 | 휴대폰 공유창(촬영키트에 있음) | ✅ | 딜러가 자기 앱으로 바로 올림 |
| TL48 | YouTube Data API · Instagram Graph API(릴스) · TikTok Content Posting API | ✅ | 직접 연동. 틱톡은 심사 전 비공개로만 올라감(심사 수 주) |
| TL49 | Upload-Post 등 통합 업로드 API | 🧪 | 22개 채널, 앱 심사를 대신 보유. 월 16~350달러 |
| TL50 | postiz | 💡 | 예약 게시(AGPL, 별도 운영만) |

## 화면
| 번호 | 도구 | 구분 | 비고 |
|---|---|---|---|
| TL51 | 매물 등록 숏폼 페이지(Nuxt 4) | ✅ | `nuxt-register` 매물 등록 → 「숏폼 만들기」 → 미리보기 → 채널 고르기 → 업로드. 숏폼 스튜디오 화면 재사용 |

## 참고 영상 받기 · 분석(노트북, 2026-11-08 설치 · 실제 시험)
| 번호 | 도구 | 구분 | 비고 |
|---|---|---|---|
| TL52 | yt-dlp 2026.10.26 + curl-cffi | ✅ | 유튜브 · 인스타 릴스 · 틱톡 영상 1개 받기 성공. 틱톡 계정 목록(@autoscout24)은 「secondary user ID」 오류로 실패 → 영상 주소로 받기 |
| TL53 | video-extract-mcp(@yanlinglabs, npm 전역) | ✅ | 코덱스 `~/.codex/config.toml` · 클로드 데스크톱 설정에 `video-extract` 등록. 인스타 릴스 → 영상 · 말 자막(nl, 자체 음성 인식) · 핵심 장면 8장. 첫 실행 6분 40초(모델 받기 포함) |
| TL54 | faster-whisper 1.2.1(small, CPU int8) | ✅ | 낱말별 시각 포함 받아쓰기. 틱톡 30초 남짓 46.6초(첫 실행, de). av는 14~15 버전으로 고정(19는 오류) |
| TL55 | instaloader 4.16 | 💡 | 인스타 계정 릴스 묶음 보관용. 로그인 없이는 막힐 수 있음 |
| TL56 | Gemini 분석기(as24_analyze.py) | 🧪 | 지금은 유튜브 주소만. 인스타 · 틱톡은 받은 파일을 Files API로 올리게 고쳐야 함 |
| TL57 | rea-video b32fbbd(Apache-2.0) | ✅ | 노트북 `Documents\tools\rea-video`, Python 3.12에 설치. 스킬을 `~/.claude` · `~/.codex` · `~/.agents` skills에 연결. 윈도우는 사용자 환경 변수 `PYTHONIOENCODING=utf-8` · `PYTHONUTF8=1` 필요(없으면 중국어 도움말에서 멈춤). 독일 쇼츠 25초 → 13컷 · 소리 분리 · 178 BPM · 효과음 2개, 8분 10초. 화면 모델 없이 돌리면 실사/AI 판단 신뢰도 낮음(이번 55%, 실사를 「AI 66%」로 오판) → 제미나이를 `REA_VLM_*`로 붙이거나 에이전트가 `rea-video review`로 직접 보고 고쳐야 함 |
| TL58 | PySceneDetect 0.7.2 | ✅ | 컷 경계 검출. opencv는 rea-video와 같은 headless 하나만 씀(`--no-deps` 설치) |
| TL59 | HyperFrames 스킬 4종 | ✅ | `hyperframes` · `-cli` · `-registry` · `remotion-to-hyperframes`, 클로드 · 코덱스 모두 |
| TL60 | beat_this · CLAP · SAM 2 | ⏸ | 그래픽카드 필요. Thinkbook은 Intel 내장(메모리 64GB)이라 보류 |
| TL62 | auto-editor 29.3.1 (Unlicense) | ✅ | 무음 후보만 표시: `--edit audio:threshold=0.04 --export v1` → chunks 속도 99999 = 자를 후보. 시동음·문 닫힘 보호 먼저 |
| TL63 | audio-separator 0.48.0 (MIT, UVR 모델) | 🧪 | torch 2.15 CPU와 함께 설치. rea-video stems와 비교용 |
| TL64 | librosa 1.0.0 (ISC) | ✅ | 박자 시각 추출. keyandbpm(AGPL, 박자 시각 없음) 대신 |
| TL65 | Ollama + Qwen2.5-VL 7B | ⏸ | 노트북 네트워크에서 설치 파일 다운로드 504. 재시도 필요 |
| TL66 | 스킬 `bobae-video-tools` | ✅ | 도구별 명령·주의점. 노트북 `문서\tools\bobae-video-tools`, 클로드·코덱스·agents 스킬 폴더에 연결 |
| TL61 | Raea | ⏸ | FSL 라이선스(경쟁 사용 제한) · canary 버전이라 보류 |
