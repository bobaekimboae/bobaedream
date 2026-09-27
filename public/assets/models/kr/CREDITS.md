# 모델·세부 모델 이미지(과쯔 모드, QF-109)

- 카탈로그: 개발 시안 필터 카탈로그 스냅숏(src/prototype/data/model-catalog-kr.json, 받은 날짜 2026-09-27T07:07:10.564Z)
- 이미지 출처 ① 당근 중고차 차종 이미지(img.kr.gcp-karroter.net, GraphQL autoBeginsSubseries.imageUrl, 받은 날짜 2026-09-27T14:07:35.984Z) — 세대 맞춤표(src/prototype/data/model-image-match.json, reports/qf-109/match.csv)로 연결된 것만
  ② 연결이 없으면 보배드림 차종 이미지(file4.bobaedream.co.kr/car_model_img, 카탈로그 image_url) ③ 둘 다 없으면 빈 칸(점선)
- 처리: 코드 정렬 부품(scripts/image-normalize.mjs, docs/model-image-spec.md) — 228×120 투명 PNG, 차 폭 224 · 바닥선 111 · 그림자 코드로. 새로 그리거나 색을 바꾸지 않음, 좌우 반전 없음
- 세부 모델별 출처·원본 크기·확대 여부: manifest.json
- 다시 만들기: node scripts/daangn-fetch.mjs → node scripts/model-images-dg.mjs
