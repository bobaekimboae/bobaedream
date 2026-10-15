# Design QA — 김태규 딜러 Flutter 앱

## Source truth

- 기존 모바일 페이지 캡처: `../../artifacts/dealer-profile-avatar-banner-1015/mobile.png`
- 기존 구현: `../../src/prototype/dealer-page/DealerPage.tsx`
- Flutter 구현 캡처 기준: Codex in-app browser, `393 × 852`, `http://127.0.0.1:4211/`
- 자동 레이아웃 검증: `test/dealer_profile_test.dart`

## Visual comparison

- 16px 좌우 여백, 12px 라운드 페라리 배너, 88px 원형 프로필의 40px 겹침을 유지했다.
- 프로필 이름, 인증 배지, 판매중·판매완료·팔로워 통계를 원본과 같은 순서와 밀도로 배치했다.
- 팔로우·채팅·전화 버튼은 한 줄의 작은 외곽선 버튼으로 맞췄다.
- 리뷰, 딜러 경력, 전화, 주소, 상사 정보와 무료 견적 CTA의 정보 위계를 유지했다.
- 탭은 가로 스크롤과 선택 밑줄을 사용하고, 목록은 이미지 좌측·정보 우측의 기존 목록형 구성을 유지했다.
- Pretendard Regular/Bold를 앱에 포함해 Android, iOS, Web의 한글 자간과 굵기 편차를 줄였다.

## Interaction QA

- 팔로잉 버튼을 누르면 체크가 사라지고 `팔로우`로 전환된다.
- `내차견적` 탭 선택 시 무료 견적 입력 화면과 제출 버튼이 나타난다.
- 판매중·판매완료 칩이 목록 상태를 전환한다.
- 관심 차량 버튼, 차량 카드, 검색, 채팅, 전화, SNS 항목은 즉시 상태 변화 또는 사용자 피드백을 제공한다.
- 브라우저 콘솔 경고 및 오류: 없음.

## Severity review

- P0 blocking: 없음.
- P1 major: 없음.
- P2 polish: 웹과 네이티브 플랫폼의 아이콘 렌더링 차이를 Material Symbols로 통일했다.

## Validation

- `flutter analyze`: 통과, 오류 0건.
- `flutter test`: 플랫폼 독립 기능 테스트 2개 통과.
- `flutter build web --release`: 통과.
- `flutter build apk --debug`: 통과.

final result: passed
