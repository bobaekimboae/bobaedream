# 해외 휴대폰 촬영 업로드 사례

## 핵심 결론

보배드림은 두 가지 업로드 모드를 함께 가져가야 합니다.

| 모드 | 목적 | 참고 구조 |
| --- | --- | --- |
| 자유 숏폼 | 딜러가 틱톡처럼 매물 매력을 자유롭게 촬영 | CARVID, DVI |
| 부위별 촬영 템플릿 | 촬영팀과 검수팀이 빠짐없이 매물 상태를 확보 | 58닷컴, CarCutter, autofox |
| 분류별 보기 | 구매자와 내부 검수자가 사진/상태/옵션을 빠르게 파악 | CARS24 Australia, carsales |

## 제품별 참고 기능

| 서비스 | 국가/권역 | 확인된 기능 | 보배드림 반영안 |
| --- | --- | --- | --- |
| 58닷컴 중고차 | 중국 | 등록 완성도, 필수 항목, 사진/영상 30개 슬롯, 각도별 촬영 안내, 차량 인증 자료 | 현재 프로토타입의 등록폼과 촬영기 구조에 반영 |
| CARS24 Australia | 호주 | 매물 등급, 핵심 장점, 차량 개요, 옵션, 상태 리포트, PPSR/검수 정보 | 매물함을 전체/검수 가능/촬영 필요/영상 있음/프리미엄/상용·RV로 분류 |
| CarCutter | 유럽/글로벌 | 모바일 샷리스트, 각도 가이드, 사진 품질 일관화, DMS 전송 | 촬영 부위 슬롯, 누락 컷 표시, 대표컷 지정 |
| autofox | 유럽 | 사전 정의된 촬영 순서, 모바일 촬영, AI 배경/조명 보정, DMS 내보내기 | 촬영 순서 고정, 이후 배경 보정 API 연동 후보 |
| CARVID | 북미 | 7단계 워크어라운드, 9:16 세로 영상, 30초 자동 영상, SNS 동시 게시 | 자유 숏폼 + 외관/실내/엔진음 영상 템플릿 |
| Dealer Video Inventory / Impel 계열 | 북미 | VIN 스캔, 영상 촬영, 사진 동시 캡처, 웹사이트·SNS·서드파티 배포 | 차량번호/VIN 기반 매물 호출, 촬영 후 자동 배포 단계 후보 |
| Glo3D Web Capture | 글로벌 | 고객에게 링크를 보내 모바일 웹에서 촬영을 가이드 | 딜러에게 촬영 링크 발송하는 웹 업로더 확장 후보 |
| carsales imperfection photos | 호주 | 하자 사진을 일반 갤러리와 별도 탭으로 노출 | 흠집/하자 그룹을 독립 분류로 유지 |

## 실서비스 개발 체크리스트

| 영역 | 1차 구현 | 2차 구현 |
| --- | --- | --- |
| 카메라 | 브라우저 `getUserMedia`, 앨범 업로드 | Flutter 네이티브 카메라, 흔들림/밝기 체크 |
| 영상 | `MediaRecorder` 기반 WebM 저장 | MP4 변환, 9:16 자동 리프레이밍, 구간 컷 편집 |
| 저장 | IndexedDB 로컬 저장 | S3/R2 오브젝트 스토리지, 업로드 재시도 |
| 검수 | 완성도 %, 누락 슬롯 | AI 각도 판정, 번호판 자동 블러, 하자 감지 |
| 배포 | JSON 내보내기 | 보배 매물 등록 API, 릴스/틱톡/쇼츠 예약 업로드 |
| 권한 | 로컬 브라우저 초안 | 딜러 계정, 촬영팀 계정, 검수팀 승인 플로우 |

## 참고 링크

- https://www.autofox.ai/photo-app
- https://www.carcutter.com/
- https://www.carcutter.com/capturing/
- https://www.carvidapp.com/car-sales-video-app/
- https://www.lesautomotive.com/two-video-apps-helping-car-dealerships-showcase-vehicles-and-boost-sales-online/
- https://glo3d.com/web-capture/
- https://www.cars24.com.au/buy-used-cars-australia/
- https://www.cars24.com.au/buy-used-kia-cerato-car-22900909509440/
- https://help.carsales.com.au/hc/en-gb/articles/9087302246425-Imperfection-photos-on-used-cars
