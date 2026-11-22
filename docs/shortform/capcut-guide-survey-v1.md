# 캡컷 제작 가이드 조사 v1 — 사진 매물 숏폼에 맞춰 (2026-11-22)

사용자 지시: 「키프레임 · 페이드 · 동적 효과, 사진에서 영상 효과 주는 기능, 캡컷 제작 가이드 전수 조사하고 진행해라」.
캡컷 공식 자료(capcut.com resource · help · create · features)와 캡컷 사용 가이드를 읽고, 우리 사진판 렌더러(`scripts/shortform/photo_listing/common.py`)와 대조했다.
숫자가 나온 곳만 숫자로 적었다. 출처에 숫자가 없으면 「수치 없음」.

## 1. 대조표

| 영역 | 캡컷 가이드 | 우리 지금 | 적용(v4 콰트로포르테) |
|---|---|---|---|
| 켄번스(사진 확대·이동) | 3~5초에 100→110~120%(은은하게 3초 110%), 키프레임 2~3개(많으면 흔들려 보임), Ease In-Out | 100→106~108%, 키 2개, smoothstep | 100→110~114%로 키움 |
| 확대·축소 방향 | 디테일 보여줄 땐 확대, 디테일 뒤 전체로 돌아갈 땐 축소, 말이 그 부위에 닿을 때 도착 | 컷마다 번갈아, 부위 당기기(AUTO_ZOOM) 있음 | 끝 컷(후면·CTA)은 축소, 부위 당기기 유지 |
| 회전 | ±2° + 살짝 확대(모서리 숨김), 큰 각도는 스타일 편집용 | 없음 | 안 씀(칩·사진 0° 고정 규칙) |
| 사진 한 장 길이 | 빠른 소셜 1~2초, 부드러운 이동 3~5초, 슬라이드쇼 약 3초 | 2~4초(말 길이) | 그대로(말에 맞춤) |
| 전환 | 디졸브·페이드·당김·흐림 0.3~0.8초. **매 컷 전환 금지**, 구간(섹션) 바뀔 때 위주. 박자에 딱 붙은 컷엔 전환이 오히려 약함 | 매 컷 휙·밀기·당김 | 구간 경계 3곳만(외관→실내 당김, 실내→카드 번쩍, 카드→딜러 휙), 나머지 바로 컷 |
| 휙(whip pan) | 나가는 장면 움직임과 들어오는 장면 움직임 방향을 맞춤, 매번 쓰지 않음, 흐림이 중요한 장면을 가리면 줄임 | 컷마다 좌우 번갈아 | 딜러 컷 1번만 |
| 박자 맞춤 | 큰 장면 전환은 강박(1박), 작은 디테일은 2·4박. 기본 4박에 1컷, 빠르게 2박, 몰아치기 1박(4~8박만). 강한 박에 아주 작은 펀치 1종류만 | 컷은 말에만 맞춤 | **다음 작업**: 컷 경계를 말 시작 ±0.12초 안에서 가장 가까운 배경음 박자에 붙이기(렌더러 코드) |
| 펀치(톡 당김) | 강한 박에 아주 작은 스케일 펀치, 흔들림·모션 블러는 큰 순간만 | 칩 뜰 때 4% | 6% |
| 사양 글자(스펙 오버레이) | 영상당 2~4개, 카드 하나에 사양 하나, 증명하는 장면에서 말할 때 등장, 두 번 읽을 시간, 가장자리 빈 곳(가운데·차 위 피함), 아래는 자막 자리로 비움, 대비 4.5:1, 짧은 구, 회전·튕김 금지 | 글자 칩이 자막 바로 위(차를 가림) | **붓칠 칩 = 사진 위 헤더 띠**(가로 사진), 꽉 찬 사진은 위 400px 고정(`CAPS_UNDER_PHOTO` · `CHIP_Y=470`). 사양 칩 4개 |
| 글자 등장 | 페이드 인 0.5초, 튕김 아웃 0.3초 예시. in+out 합이 구간보다 길면 안 됨 | 벨기에 원본 실측(띠 먼저, 글자 20→100% 0.2초) | 그대로(벨기에 고정 규칙) |
| 3D 줌·입체(배경과 차 분리) | 3D Zoom / 3D Zoom Pro, 피사체와 배경이 잘 나뉠 때만, 가장자리 복잡하면 깨짐 | 없음 | **안 씀**: 차 외곽을 오려야 해 가장자리가 뭉개짐 → 「사진은 자르기·이동·확대·흐린 채움만」 원칙과 충돌 |
| 오려 붙이기·팝(80→110→100%) | 오버레이 팝 8~12프레임, 밖에서 0.5초 미끄러져 들어옴 | 3D 아이콘 톡 등장 | 그대로 |
| 속도 램프 | 5~10% 미세 조정, 연달아 쌓지 않음 | 목소리 1.1배 | 그대로 |
| 원본 해상도 | 세로 1080px 이상, 확대 여유는 2160px | 매물 사진 1024×683 | 확대 14% 이내로 묶음(흐려짐 방지) |
| 내보내기 | 1080p · 30fps(빠른 움직임 60fps) · MP4 | 1080×1920 · 30fps | 그대로 |

## 2. 쓰지 않은 것과 이유
- 3D 줌·패럴랙스, AI 이미지→영상: 차 모양이 바뀌거나 가장자리가 깨짐(반사기 원칙).
- 글리치·RGB 분리·흔들림: 매물 신뢰감과 안 맞음. 큰 순간 1번 정도만 후보.
- 「전환 2초 이상 25% 완주, 0.5초 박자 85%」: 출처·방법 표시 없는 블로그 숫자라 근거로 쓰지 않음.

## 3. 남은 일
1. ~~박자 맞춤~~ → 2026-11-22 구현(`BEAT_SNAP = True`): 앞 낱말 끝 ~ 첫 낱말 소리 0.04초 전(최대 0.45초 전) 안의 박자에 컷을 붙임, 구간 경계는 강박 먼저. 콰트로포르테 v5에서 14컷 중 6컷(쉼이 짧은 곳은 못 붙임).
2. 휠·대시보드처럼 부위를 못 찾은 컷의 당기기 목표점.
3. 페이드판·동적판 비교 뒤 기본안 결정(사용자).

## 출처
- [How to make pictures move in CapCut (full guide)](https://geekchamp.com/how-to-make-pictures-move-in-capcut-full-guide/)
- [CapCut — Ken Burns effect for static images](https://www.capcut.com/create/ken-burns-effect-educational-images)
- [CapCut — Animated product spec overlays](https://www.capcut.com/create/animated-product-spec-overlays)
- [CapCut — Whip pan transition workflow](https://www.capcut.com/features/how-to-make-a-whip-pan-transition-capcut-workflow)
- [CapCut — Trending transitions 2026](https://www.capcut.com/help/capcut-transitions)
- [CapCut — How to animate text and captions](https://www.capcut.com/resource/how-to-animate-text-and-captions)
- [Beat-based editing in CapCut](https://cursa.app/en/page/beat-based-editing-in-capcut-syncing-cuts-transitions-and-motion-to-music)
- [CapCut 드래프트 형식(키프레임 · 곡선 · 애니메이션 종류)](https://cdn.jsdelivr.net/npm/capcut-cli-david@2.5.0/docs/draft-schema/03-keyframes-and-animations.md)
- [Creative ways to turn car photos into video for YouTube Shorts](https://www.cloudpano.com/blog/creative-ways-to-turn-car-photos-into-video-for-youtube-shorts)
