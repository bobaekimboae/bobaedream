# 캡컷 프로젝트 코드 생성 시험 (2026-11-12)

- 방법: 견본 `1111`의 draft_content.json → `read_template.py` → 템플릿 JSON → `make_draft.py`(pycapcut 0.0.4) → 새 프로젝트 `bobae_auto_test` → 캡컷 9.7에서 열기 → Ctrl+E
- 결과: 캡컷 9.7에서 정상으로 열림. 칩 8개(확대 등장)·자막 17개·내레이션이 견본 시점·위치 그대로. 출력 53.52초 · 1080×1920 · H.264/AAC
- 시간: 프로젝트 생성 0.1초 · 캡컷 열기~내보내기 완료 약 1분(렌더링 30초 이하)
- 다른 점: 자막 테두리가 견본(v2)보다 얇게 나옴 → 테두리 두께 값 단위 보정 필요
- 파일(노트북): `Documents\autostudio_analysis\capcut_nasser\bobae_grandeur_auto_test.mp4`
- 장면 확인: `capcut_auto_test_frames.jpg` (5.6초 · 45초 · 52초)
