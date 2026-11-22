# 하이퍼프레임 비교 시험 (2026-11-22, K8)

사진판 렌더(`photo_listing/common.py`)와 HyperFrames 0.9.80(Apache-2.0)을 같은 매물(서울오토갤러리 벤츠 E250, 38.7초)로 비교한 생성기.

- `chip_layer.py plan.json index.html` — 칩만 투명 WebM 층으로. 렌더 65초(같은 프레임 96% 재사용).
- `full_scene.py plan.json index.html "푸터 글"` — 사진 켄번스 · 컷 넘김 · 칩 · 컷 자막 한 줄 · 푸터 · 끝 로고. 렌더 **477초**(우리 렌더 91~99초의 약 5배). 낱말 따라 색 바뀌는 자막 · 첫 화면 제목 · 3D 아이콘 · 효과음 · 소리는 넣지 않은 상태에서도 느림.

실행: 하이퍼프레임 프로젝트 폴더(`npx hyperframes init --example=blank --resolution=portrait`)에 `gsap.min.js` · 붓칠 SVG(`fill.svg`) · 사진(`img/`)을 넣고 `npx hyperframes render . --format mp4|webm`. 남은 디스크 1GB 미만이면 렌더를 거부한다.

판단: 사진판 매물 렌더에는 쓰지 않는다. 디자이너가 HTML로 고치는 템플릿이나 넉스트 미리보기와 같은 화면이 필요할 때만 다시 본다.
