# 영상 매물 나세르형 숏폼 (G350 기준, 2026-11-19)

매뉴얼: `docs/shortform/listing-reel-pipeline-agents.md` 15장.

| 파일 | 하는 일 |
|---|---|
| `g350_feature_cut_render.py` | 렌더 본체(컷 목록 · 칩+화살표 · 3D 숫자 · Fluent 3D 아이콘 · AS24 흰 붓칠 보조 칩 · 말 자막 · 소리 섞기). `REMIX=1`이면 영상은 두고 소리만 다시 섞음 |
| `g350_track.py` | 부위 트래킹(OpenCV CSRT, 270×480, 앞뒤로 추적 후 7프레임 평균) → `tracks.json` |
| `transcribe_words.py` | 낱말 시각 받아쓰기(faster-whisper large-v3-turbo int8, 16kHz f32 raw) |
| `g350_scout_chip_compare.py` | 보조 칩 6안 비교 시트(흰 알약 / 임모 민트 태그 / 임모 단계 원 / AS24 형광펜 / AS24 붓칠 흰·민트) |
| `chip_margin_check.py` | 노랑 칩과 흰 칩의 칠 끝→글자 좌우 여백 픽셀 측정 |

경로 `G`·`NV`는 작업 폴더 기준이라 다른 매물에서는 맨 위 두 줄만 바꾼다. 원본 영상·음성은 저장소에 넣지 않는다.
