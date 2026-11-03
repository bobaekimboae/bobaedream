# PC · 모바일 계정 메뉴

- 대상: 사용자 프론트엔드. 메뉴 UI는 Nuxt **4.6.2**, Vue **3.5.33**, TypeScript **6.0.3**, pnpm **10.33.0**, Node **24.22.1**.
- 기준: https://app.notion.com/p/408ee9c4b60680c3be52caefde283895
- 레퍼런스: https://xe.chotot.com/mua-ban-xe-may 의 비로그인 PC 프로필 메뉴.
- 아이콘: Notion 「베트남 초톳 아이콘 전체 (1)」 https://app.notion.com/p/3f6ee9c4b606805b9874ea91e88ee523. `nuxt-community/public/icons/account/manifest.json`에 원본 페이지와 SHA-256을 기록. SVG 원본 16개를 변형 없이 사용.

## 진입 · 디자인

기존 매물 리스트 PC 프로필 버튼과 모바일 하단 마이를 연결한다. PC 로그인/회원가입 버튼도 같은 계정 화면을 연다. Nuxt 화면은 `/bobaedream/nuxt-community/#/account`에서 독립적으로 열 수 있다.

- PC: 버튼 아래 폭 400px, 최대 높이 616px의 스크롤 팝오버. 작은 창에서는 가용 높이·폭 이내.
- 모바일: 마이 전체 화면. 상단 뒤로·닫기, safe-area와 세로 스크롤 지원.
- 공통: 48px 항목 행, 24px 원본 SVG, 16px 항목 텍스트, Pretendard, 카드 radius 12px, 블루 `#2f6fe4`.
- 순서: 계정 → 편의 기능 5 → 유료 서비스 5 → 혜택 2 → 설정·지원 3. 하나의 타입 있는 데이터 정의를 PC와 모바일에서 공유한다.

## 기존 앱과의 접점

`public/assets/account-menu-bridge.js`는 기존 React 쉘에 UI를 추가하지 않는 호환 어댑터다. `index.html`의 외부 스크립트 한 줄로 진입 버튼 클릭을 Nuxt iframe으로 전달한다. 기존 React 화면·필터·보호 런타임은 수정하지 않는다.

- 관심 매물 → 기존 저장 매물 화면.
- 프리미엄 등록 → 설명 후 기존 매물등록 시안으로 이동. 결제를 실행하지 않음.
- 의견 보내기 → 제안·건의 게시판.
- 고객센터 → 연락처·운영시간·전화 링크. 자동 통화하지 않음.
- 그 밖의 개인 계정 데이터 → 계정 API 연결 전임을 표시. 가짜 보유 포인트·결제 내역·쿠폰 등을 만들지 않음.
- `pcauth=member`는 기존 회원 **미리보기**이며 실제 로그인으로 취급하지 않음.

## 상호작용 · 접근성

팝오버 바깥 클릭, Esc, 닫기 버튼, 브라우저 뒤로 가기, 포커스 복귀를 지원한다. 배경 root를 inert 처리하고 이전 상태로 복원한다. iframe 내부 Tab 순환을 제한하며 `role=dialog`, `aria-modal`, `aria-expanded`, `aria-controls`를 사용한다. 로딩 지연 시 메시지와 닫기 버튼을 제공한다.

메시지는 같은 origin과 현재 iframe의 contentWindow를 함께 확인하고 `favorites/register/feedback/logout-preview` 네 동작만 허용한다. 메뉴 닫기 history 복구 후 기존 화면을 열어 뒤로가기 경합을 피한다.

## 범위 · 잔여 작업

Laravel 인증·회원·결제·쿠폰 API, PostgreSQL·검색·캐시 스키마 변경은 이번 작업에 없다. 프리미엄 결제와 실제 계정 데이터 연동을 완료했다고 간주하지 않는다. 초톳 모바일 네이티브 앱과의 1:1 동등성은 별도 실기기 대조 대상이다.

배포는 기존 Nuxt community 빌드 단계에 계정 route가 포함되므로 새 프레임워크·빌드 단계·의존성을 추가하지 않는다.
