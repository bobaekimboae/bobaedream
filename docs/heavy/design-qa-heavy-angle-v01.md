# Design QA — 건설기계 각도 비교 v01

- Reference URL: https://www.autotrader.ca/heavy-equipment
- Implementation URL: `/heavy-angle-comparison-v01.html`
- Viewport: 384×850 CSS px

## Reference measurements

- AutoTrader viewport: 486×668 CSS px, DPR 1.25
- First card left: 16px
- Card/image: 84×51px
- Card pitch: 100px
- Card total height: 79px
- Source natural size: 84×51px

## Implementation measurements

- First card left: 16px rail padding; centered image x=22px
- Card: 76px
- Image: 64×40px
- Card gap: 8px
- Web source: 512×320px, RGBA transparent
- Image/label gap: 14px
- Console error: 0
- Image load failure: 0/20

## Intentional differences

- AutoTrader의 84×51px 배치 값을 복제하지 않고 기존 초톳 기반 보배드림 규격 64×40px를 유지한다.
- AutoTrader는 자연 크기와 표시 크기가 같지만, 보배드림은 512×320px 소스를 64×40px로 축소해 고밀도 화면의 선명도를 확보한다.
- AutoTrader보다 투명 배경·공통 바닥선·색온도·쌍별 동일 배율을 더 엄격하게 관리한다.

## Status

PASS — 측면/각도 5쌍이 동일 슬롯 조건으로 비교 가능하며 콘솔 오류와 이미지 404가 없다.
