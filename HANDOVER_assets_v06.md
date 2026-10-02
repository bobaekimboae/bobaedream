# HANDOVER_assets_v06

## 1) 담당 범위

- 트럭·특장 퀵필터 형식/세부형식 카드 전체 명칭 표시
- 퀵필터 가로 오버플로 이전·다음 버튼
- PC 탑 메뉴 명칭·활성 상태
- 트럭 형식 `1톤트럭` 추가 및 `화물트럭` 명칭 통일

## 2) 현재 진행 상태

### 완료

- 트럭 형식·세부형식 카드 말줄임표 제거 및 여러 줄 전체 표시
- 노션 초톳 원본 `이전`, `다음` SVG 보존·적용
- 실제 가로 오버플로가 있을 때만 이전·다음 버튼 표시
- 모바일·PC 버튼 이동 및 가장자리 상태 전환 확인
- PC 탑 메뉴를 `홈 / 전체차량 / 중고차 / 수입차 / 화물/특장차 / 건설기계(덤프/지게차) / 캠핑카(모터홈/캐러밴) / 바이크 / 부품/용품 / 커뮤니티`로 구성
- 트럭·특장 페이지에서 `화물/특장차` 활성화
- `1톤트럭` 형식·세부형식·톤수 칩·이미지·가상 매물 연결
- `카고(화물)트럭` 화면 명칭을 `화물트럭`으로 통일하고 이전 URL 값 호환

### 진행 중

- 없음

### 미착수

- 코덱스-중고차 상호 검수

## 3) 결정된 사항과 이유

- 형식명은 차량 구조를 구분하는 핵심 정보라 축약하지 않는다.
- 슬롯 폭은 유지하고 긴 명칭은 카드 안에서 여러 줄로 표시한다.
- 이전·다음 버튼은 오버플로가 있을 때만 노출해 빈 동작을 만들지 않는다.
- 1톤트럭은 기존 목록 사진 중 실제 1톤 화물차 형상을 228×120 슬롯으로 정규화해 별도 형식 이미지로 사용한다.
- 이전의 `카고(화물)트럭`, `카고트럭` URL 값은 `화물트럭`으로 자동 변환한다.

## 4) 미결 사항·막힌 점

- 없음

## 5) 산출물 목록

- `src/prototype/listing/quick-rail-carousel.tsx`
- `src/prototype/listing/qf-model-images.css`
- `src/prototype/listing/stable-top.css`
- `src/prototype/listing/pc-bbmuseum.tsx`
- `src/prototype/listing/pc-bbmuseum.css`
- `src/prototype/data/truck-format-catalog.ts`
- `src/prototype/data/truck-depth4-catalog.ts`
- `src/prototype/truck/scenario-v01.ts`
- `public/assets/bbm/quick-filter-prev.svg`
- `public/assets/bbm/quick-filter-next.svg`
- `public/assets/truck/formats/v01/truck_format_one_ton_v01.png`

## 6) 다른 코덱스와 주고받은 자료, 대기 중인 요청

- 코덱스-중고차 검수 대기
- 원본 아이콘: 노션 `이전`, `다음` 페이지 첨부 SVG

## 7) 검수 상태

- 변경기록 기준: 미검수
- 로컬 빌드: 완료
- 모바일 394×852: 형식 14개, 말줄임표 0개, 가로 텍스트 오버플로 0개, 이전·다음 이동 확인
- PC 1440×900: 형식 14개, 말줄임표 0개, 가로 텍스트 오버플로 0개, `화물/특장차` 활성화 확인
- 브라우저 콘솔 오류: 0개

## 8) 다음에 할 일

1. 코덱스-중고차 상호 검수를 받는다.
2. 수정 요청이 있으면 v07로 새 버전을 만든다.
