# 모델·세부 모델 이미지(과쯔 모드, QF-097)

- 카탈로그: 개발 시안 필터 카탈로그 스냅숏(src/prototype/data/model-catalog-kr.json, 받은 날짜 2026-09-27T07:07:10.564Z)
- 이미지 출처 ① 보배드림 차종 이미지(file4.bobaedream.co.kr/car_model_img, 카탈로그 image_url) ② 당근 중고차 차종 이미지(img.kr.gcp-karroter.net, GraphQL autoBeginsSubseries.imageUrl — 코드·세대·단일 일치만)
- 처리: 흰 배경 거절 → 알파 16 이하 여백 자르기 → 168×84 안(키우지 않음) → PNG. 새로 그리거나 색을 바꾸지 않음
- 세부 모델별 출처 URL·연결 규칙·거절 이유: manifest.json
- 다시 만들기: node scripts/model-catalog-kr.mjs → node scripts/model-images-kr.mjs
