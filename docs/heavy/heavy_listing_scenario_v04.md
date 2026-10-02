# 건설기계 가상 매물 시나리오 v04

## 결과

- 건설기계 이미지 30장과 시나리오 30행을 `image_file`로 1:1 연결했습니다.
- 판매자명·주소·연락 방식·소개·운영 시간을 모두 테스트용 가상 정보로 추가했습니다.
- 실제 판매자명, 전화번호, 상세 번지는 포함하지 않았습니다.

## 파일

- 데이터: `heavy_listing_scenario_v04.csv`
- 원본 출처표: `source_v01/heavy_listing_manifest_v01.csv`

## 가상 판매자 필드

- `seller_name`: 상사명 또는 개인 판매자 별칭 뒤에 `(가상)` 표시
- `seller_address`: `가상시 테스트구`를 사용한 명시적 가상 주소
- `seller_contact`: 앱 채팅만 사용
- `seller_intro`: 화면 검증용 소개 문장
- `business_hours`: 화면 검증용 영업시간

## 주의

- `is_virtual=true`인 테스트 데이터이며 실제 매물로 게시하면 안 됩니다.
- 이미지 상업 이용 및 재배포 권리는 미확인입니다.
