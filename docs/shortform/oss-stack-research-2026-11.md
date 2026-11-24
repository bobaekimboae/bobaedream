# 숏폼 제작 최신 오픈소스·스택 조사 (2026-11-25)

조사 방법: 웹 검색(깃허브 트렌드 모음, 프로덕트헌트, 기술 매체, 모델 카드). 인스타그램·틱톡·유튜브는 앱 안 영상을 직접 보지 못하고 플랫폼 소식 기사로 확인했다. 별 수·순위는 모음 사이트 값이라 저장소에서 다시 확인해야 한다.

| 단계 | 지금 쓰는 것 | 새 후보 | 라이선스 | 판단 |
|---|---|---|---|---|
| 렌더 | 파이썬(PIL·OpenCV·FFmpeg) | HyperFrames 0.9.x | Apache-2.0 | 정밀 비교 완료, 컷 효과 이식 뒤 재평가 |
| 렌더 | 〃 | OpenFilm(film.html + 손 편집 스튜디오) | MIT | 한 번 시험할 가치(사람이 고칠 수 있음) |
| 렌더 | 〃 | OpenEdit(VEED) | Apache-2.0, 기본 렌더 엔진은 비공개 바이너리 | 크롬 렌더로만 검토 |
| 렌더 | 〃 | OpenChatCut | AGPL-3.0, Remotion 렌더 | 쓰지 않음(리액트·AGPL) |
| 음성 | ElevenLabs KKC HQ | Qwen3-TTS, CosyVoice 3 | Apache-2.0 | 자체 서버용 예비 후보. Supertonic은 개발 중단 |
| 받아쓰기 | Scribe · faster-whisper | Qwen3-ASR + ForcedAligner | 미확인 | 한국어 낱말 시각 지원 확인 필요 |
| 받아쓰기 | 〃 | Cohere Transcribe | Apache-2.0 | 낱말 시각이 없어 자막용 불가 |
| 부위 찾기·추적 | OWLv2 + VitTrack | SAM 3 / 3.1 | SAM License | 글자로 부위를 찾고 추적까지 한 모델. 시험 1순위 |
| 배경음 | 쇼룸 배경음 · CC0 곡 | ACE-Step 1.5 | MIT | 자체 배경음 생성 후보 |
| 효과음 | 자체 · Wyzowl 키트 | Stable Audio Open | 매출 100만 달러 이하만 무료 | 쓰지 않음 |
| 인코딩 | FFmpeg 6.1.1 | FFmpeg 9.0 / 9.1 | LGPL/GPL | 9.0.2 정적판 시험 통과, 기본 교체는 승인 뒤 |

플랫폼 흐름: 인스타그램 Edits가 맥 데스크톱판(다중 트랙·자동 자막)을 내 캡컷과 경쟁. 프로덕트헌트는 「말로 지시 → 고칠 수 있는 타임라인」(Cardboard, ChatCut, Narrative, ClipsPal)이 주류.

권고 순서: ① SAM 3로 부위 찾기·추적 시험 ② ACE-Step 1.5로 배경음 시험 ③ 스킬 문서의 Supertonic 예비안 교체 ④ OpenFilm 1회 시험.

## 4차 조사 — 앞선 조사에 없던 것만 (2026-11-25)

| 단계 | 도구 | 확인한 내용 | 판단 |
|---|---|---|---|
| 음성(예비) | Ming-3.0-tts 0.5B (MIT, 2026-10-20) | 한국어 포함 7개 언어, 44.1kHz, 목소리 복제·글로 목소리 설계. 공개 모델 중 평가 상위 | 예비 음성 1순위 후보 |
| 부위 판정 | Qwen3-VL 4B·8B (Apache-2.0) | 4B는 약 3.5GB, 8B는 약 6GB 메모리 | SigLIP 2와 같은 30장으로 비교 |
| 영상 이해 | InternVideo3-8B (Apache-2.0) | 영상 전용, 여러 평가에서 Qwen3-VL-8B보다 높음 | 보류(큰 그래픽카드 필요) |
| 글자 읽기 | PP-OCRv6 (2026-06) | 이미 RapidOCR로 사용 중. v5보다 인식 +5.1% | 유지 |
| 브라우저 인코딩 | Mediabunny 1.66 (MPL-2.0) | 400건 넘는 개선·오류 수정 | 촬영 키트에서 판 올림 검토 |
| 움직임 | GSAP 3.15 | 상업 사용 무료지만 오픈소스(MIT)는 아님. 경쟁 애니메이션 제품 제작 금지 | HyperFrames에서 사용 가능 |
| 컷 나누기 | TransNetV2 ONNX(shot-detection) | 새 모델 없음. 서서히 바뀌는 전환은 PySceneDetect보다 정확 | 보조 |
