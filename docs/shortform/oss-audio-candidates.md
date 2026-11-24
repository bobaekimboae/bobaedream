# 숏폼 무료 소리 후보 (2026-11-24, 비교용 · 아직 채택 전)

지금 쓰는 소리는 보배드림 자체 제작(ElevenLabs)이다. 아래는 바꿔 끼워 본 무료 후보이며, 채택이 정해지기 전에는 저장소에 파일을 넣지 않는다.

## 효과음
| 출처 | 라이선스 | 확인한 곳 | 메모 |
|---|---|---|---|
| Wyzowl SFX Kit — github.com/wyzowl/sfx-kit | CC0 1.0 (표기 불필요, 상업 사용 가능) | 저장소 LICENSE · README | 320개, 48kHz 24bit. 소리마다 맞춤 시점(`sync.at`)·쓰임새(`use_for`)·말 아래로 낮출 양(`under_voiceover_db`)이 sounds.json에 있어 자동 편집에 맞음 |

우리 이름 ↔ 키트 소리(비교에 쓴 짝): ding ← tone-ding-mid · pop ← pop-medium-in · whoosh ← whoosh-medium-soft · impact ← impact-heavy-firm. 가장 큰 순간의 크기와 위치를 지금 소리와 같게 맞춘 사본으로 비교했다. 말 울음·스톱워치 같은 비유음은 키트에 대응이 없어 지금 것 그대로.

## 배경음 (OpenGameArt, 페이지의 License(s) 칸이 CC0)
| 곡 | 올린이 | 페이지 | 길이 |
|---|---|---|---|
| Funky House | ali_kilinc (Of Far Different Nature) | opengameart.org/content/funky-house | 68.8초 |
| Midnight Cruiser | Ragnar Random | opengameart.org/content/midnight-cruiser | 144.4초 |
| Chill lofi inspired | isaiah658 | opengameart.org/content/chill-lofi-inspired | 123.2초 |

비교할 때는 세 곡 모두 지금 배경음과 같은 크기(−12.1 LUFS)로 맞춘 뒤 같은 음량(0.16)으로 섞었다.

## 쓰지 못한 곳
- github.com/gm3/cc0-beats: 이 작업 환경에서 저장소를 찾지 못함.
- freepd.com: 사이트가 닫힘.
- Pixabay: 접속 거부(403).

## 비교 방법
`BBM_BGM=<배경음 파일> BBM_SFX_DIR=<효과음 폴더> REMIX=1` 로 g350_v8_render.py를 돌리면 그림은 그대로 두고 소리만 다시 섞는다.
