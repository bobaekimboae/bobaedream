# roma_rave — 실촬영 매물 숏폼(벨기에 자막 + 나세르식 부위 강조)

기술스택·흐름·크로스체크: `docs/shortform/roma-rave-pipeline-stack-v1.md`

| 파일 | 하는 일 |
|---|---|
| `roma_rave_render.py` | 전체 렌더러(장면 표 `C`, 인트로, 칩·자막, 소리, plan.json) |
| `partfx.py` | 부위 색 바꾸기 `recolor` · 구멍 파동 `holes` · 외곽선 `outline` · 콜아웃 `callout` · 인트로 차 윤곽 `car_matte`/`rim` |
| `roma_rave_sam.py` | SAM 2.1로 부위·손 마스크 추적 → `pseg/<부위>.npz` (`python3 roma_rave_sam.py exh paddle`) |
| `roma_rave_intro_matte.py` | 인트로 차 윤곽 마스크 (`sam`, `bir isnet-general-use`) |
| `roma_rave_look.py` / `roma_rave_demo.py` | 부위 점 찍기용 격자 화면 / 한 장면 효과 미리보기 |
| `blender/` | 금색 큰 숫자·크롬 글자 블렌더 스크립트와 작업 목록 |
| `pseg/*.npz` | 계산해 둔 마스크(다시 렌더할 때 SAM을 돌리지 않음) |

환경변수: `ROMA_SRC`(원본 영상), `ROMA_BL`(블렌더 결과 폴더), `PART_STYLE`(`recolor` 기본 / `outline`).
원본 영상·음성·블렌더 PNG는 저장소에 넣지 않았다.
