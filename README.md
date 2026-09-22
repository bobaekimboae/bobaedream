# 보배드림 모바일 중고차 리스트

Figma 시안을 바탕으로 구현한 모바일 중고차 탐색 프로토타입입니다.

## 주요 기능

- 검색어에 따른 매물 필터링
- 판매자 유형 탭, 제조사 선택, 필터 시트, 정렬 선택
- 가로 스와이프 필터 및 제조사 목록
- 찜 상태와 목록 밀도 전환
- 모바일 브라우저 전체 화면에 맞춘 반응형 웹 레이아웃
- 데스크톱에서는 기기 장식 없이 최대 430px 콘텐츠 열로 중앙 정렬

`main` 브랜치에 반영되면 GitHub Actions가 GitHub Pages로 자동 배포합니다.

## 차량유형별 멀티 카테고리 관리자

기존 중고차 매물 관리자와 연결할 수 있는 카테고리 설정 관리자 수직 절편이 `admin-server/`와 `public/category-admin/`에 포함되어 있습니다.

```bash
npm run admin:seed
npm run admin:start
```

접속 주소:

```text
http://127.0.0.1:8788/category-admin/
```

포함 기능:

- `VEHICLE_TYPE`, `ASSET_TYPE`, `OVERLAY`, `THEME_OVERLAY`, `SELLER_CHANNEL`, `SERVICE_BM` namespace 분리
- 다중 카테고리와 메뉴 placement 관리
- 가변 항목 사전과 화면별 스키마 분리
- Draft → Review Requested → QA Approved → Published → Rollback 흐름
- RFC 8785 방식의 정렬된 JSON을 이용한 SHA-256 스키마 해시
- CAR, TRUCK_SPECIAL, PARTS_GOODS 등록·필터 초기 스키마
- 제조사·모델 마스터
- 기존 중고차 필드 매핑과 카테고리 분류 dry run
- Published snapshot 공개 API
- 역할 기반 쓰기·검수·배포 권한과 감사 로그

상세 개발 지시서는 [`docs/category-admin/DEVELOPMENT-INSTRUCTION.md`](docs/category-admin/DEVELOPMENT-INSTRUCTION.md)를 참고합니다.

```bash
npm run test:admin
npm run verify
```

