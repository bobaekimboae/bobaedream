# 구매비용 계산기 디자인 QA

## 기준 자료

- K Car 실제 모바일 계산기: `C:/Users/bobae/Downloads/cost-calculator-audit-1013/11-kcar-calculator.png`
- 차란차 실제 모바일 계산기: `C:/Users/bobae/Downloads/cost-calculator-audit-1013/charancha/02-full.png`
- 구현 캡처: `C:/Users/bobae/Downloads/cost-calculator-audit-1013/smart-reset/01-default.png`
- 상세 조건 캡처: `C:/Users/bobae/Downloads/cost-calculator-audit-1013/smart-reset/02-expanded.png`
- 하단 캡처: `C:/Users/bobae/Downloads/cost-calculator-audit-1013/smart-reset/03-bottom.png`

## 캡처 조건

- 화면: 모바일 390 × 844px
- 배율: 1
- 상태: 기본 / 차량 기본정보 펼침 / 할부 조건 펼침 / 최하단

## 비교 결과

| 항목 | 확인 결과 |
|---|---|
| 정보 구조 | 실제 서비스처럼 차량 식별, 합계, 필수 입력, 계산, 상세내역 순으로 구성 |
| 시각 표현 | 생성 이미지, 차량 히어로, 그라데이션, 장식 아이콘을 사용하지 않음 |
| 타이포그래피 | Pretendard Variable 적용, 본문 12~15px, 합계 28px로 위계 분리 |
| 간격 | 좌우 20px, 입력 행 52px, 주요 구역 사이 8px 중성 구분면 사용 |
| 색상 | 텍스트 #222 중심, 보조 #8B95A1, 선 #ECEEF0, CTA #222 |
| 입력 | 차량가격과 등록지역만 기본 노출, 차종·연료·감면은 점진 공개 |
| 상세내역 | 이전등록비만 필요할 때 취득세·공채·수수료를 펼쳐 봄 |
| 할부 | 별도 복잡한 화면 대신 한 줄 요약 후 선수금·기간만 펼침 |
| 고정 영역 | 총 구매비용과 계산 완료 버튼이 390×844 하단에 완전히 노출 |
| 이미지·오버플로 | 깨진 이미지 0, 가로 오버플로 0 |

## 비교 이력

1. K Car형 카드 중심 시안: 차량 이미지와 회색 카드가 계산보다 먼저 보여 과도함.
2. 스마트 리셋 시안: 이미지와 장식 카드를 제거하고 실제 계산 입력과 결과만 남김.
3. 모바일 검수: 하단 고정 영역 `y=773~844`, 시트 `y=107~844`, 가로 넘침 0 확인.

## 최종 결과

passed

