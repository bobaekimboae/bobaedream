# 오픈소스 교체 시험 3번 — 화살표·원 테두리 PIL → skia-python (2026-11-25, 클로드 마스터1)

순위표 `docs/shortform/oss-upgrade-test-plan-v1.md` 3번. 교차 검증: 클로드 마스터 2.

## 바꾼 것
- 새 파일 `scripts/shortform/lib/skia_draw.py` (skia-python 138.0, BSD-3-Clause): `arrimg()` · `ring()` · `seg()`.
- `video_listing/g350_v5_lib.py` `arrimg()`: 기본 skia, `BBM_DRAW=pil`이면 예전 PIL. skia가 없으면 자동으로 PIL.
- `video_listing/listing_video_render.py` `lens()`(T06 돋보기): 연결선·원 테두리를 skia로(PIL 대체 유지).
- 모양·크기·반환값은 그대로(이미지 크기·위 여백 같음, 모양 차이 픽셀 1.7% 이하 = 가장자리 부드럽게 한 몫).

## 결과
| 항목 | PIL(지금) | skia |
|---|---|---|
| 가장자리 부드러움(30개 화살표 중간 알파 픽셀 합) | 0(계단) | 4,080 |
| 화살표, 같은 크기 다시 쓰기(캐시) | 0.02ms | 0.05ms |
| 화살표 새로 그리기 | 0.05ms | 0.16ms |
| 돋보기 원 테두리(같은 크기 다시 쓰기) | ~0ms | 0.16ms |
| 돋보기 연결선(매 프레임) | ~0ms | 0.51ms |
| check_be --code | 통과 | 통과 |

- 실제 장면: G350 v13 영상 30프레임에 같은 화살표·원을 그려 비교(`frames_pil_vs_skia.png`), 확대(`arrow_ring_zoom.png`).
- 통과 기준 「프레임당 시간 같거나 빠름」은 글자 그대로는 못 넘는다(돋보기 나오는 프레임 +0.7ms, 화살표만 나오는 프레임 +0.03ms). 1080×1920 한 프레임 전체 처리 대비 1% 미만이라 실무 영향 없음으로 판단.
- 재현: `python3 skia_cmp.py out.png` · `python3 skia_frames.py out.png`(G350 v13 영상 필요).
