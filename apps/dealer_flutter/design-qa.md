# Design QA — 김태규 딜러 Flutter 앱 아이콘 교정

## Source truth

- 원본 모바일 화면: `../../artifacts/dealer-profile-avatar-banner-1015/mobile.png`
- 원본 아이콘 매핑: `../../src/prototype/dealer-page/DealerPage.tsx`
- 원본 픽셀 크기: `393 × 852`
- 비교 상태: 팔로잉 상태, 홈 탭, 판매중 목록

## Implementation evidence

- 브라우저 렌더링: Codex in-app browser tab 51, `http://127.0.0.1:4300/`
- 구현 캡처: in-app browser의 `393 × 852` viewport 캡처
- CSS viewport: `393 × 852`
- device pixel ratio: `1.25`
- 밀도 정규화: 원본과 구현을 같은 CSS 크기 `393 × 852`로 비교
- 집중 비교 영역: 인증 배지, 팔로잉·채팅·전화 버튼, 별점, 딜러 경력·전화·주소·상사 정보 행

## Full-view comparison evidence

- 16px 좌우 여백, 12px 라운드 배너, 원형 프로필 겹침, 프로필 통계와 소개문 배치를 유지했다.
- 버튼 줄, 리뷰 줄, 정보 줄, 견적 CTA, 탭과 목록이 원본과 같은 순서와 밀도로 렌더링된다.
- Pretendard Regular/Bold, 흰 배경, 회색 보조 텍스트, 검정 CTA 토큰이 원본과 일치한다.
- 차량 이미지와 프로필·배너 이미지는 기존 원본 자산을 유지해 화질 저하나 대체 이미지가 없다.
- 앱 전용 문구와 차량 데이터는 변경하지 않았다.

## Focused icon comparison evidence

- Flutter Material Symbols로 대체됐던 아이콘을 웹 원본 SVG/PNG로 교체했다.
- 인증 배지는 `chotot-list-detail-verified-dealer-wavy-badge.svg`를 사용한다.
- 팔로우 상태, 채팅, 전화는 초톳 원본 아이콘을 17px로 렌더링한다.
- 별점은 초톳 별 모양을 15px, 4개 노랑·1개 회색으로 렌더링한다.
- 딜러 경력·전화·지역·상사는 기존 `dealer-profile` 및 초톳 자산을 20px로 통일했다.
- 목록의 위치·찜 아이콘과 SNS 채널 아이콘도 동일한 원본 자산으로 교체했다.

## Comparison history

1. 이전 P2: Flutter 화면이 Material Icons를 사용해 원본과 모양·선 두께가 달랐다.
2. 수정: `flutter_svg`를 추가하고 웹 원본 아이콘 폴더를 Flutter assets로 포함했다.
3. 수정 후 증거: in-app browser의 393 × 852 캡처에서 팔로잉·채팅·전화·별점·정보 아이콘이 원본과 같은 실루엣과 크기로 표시된다.
4. 추가 상태 확인: 팔로잉을 팔로우로 전환했을 때 초톳 팔로우 아이콘이 표시되고, SNS 탭에서 인스타그램 원본 아이콘이 렌더링된다.

## Interaction and console QA

- 팔로잉/팔로우 전환: 통과.
- SNS 탭 전환 및 SNS 아이콘 렌더링: 통과.
- 자동 테스트의 내차견적 탭 전환·입력 화면: 통과.
- 브라우저 콘솔 경고 및 오류: 0건.

## Findings

- P0: 없음.
- P1: 없음.
- P2: 없음.
- P3: `flutter_svg`가 일부 원본 SVG의 사용되지 않는 filter 정의를 테스트 로그에서 무시하지만, 실제 표시 경로에는 영향이 없다.

## Validation

- `flutter analyze`: 통과, 오류 0건.
- `flutter test`: 기능 테스트 2개 통과.
- `flutter build web --release --no-web-resources-cdn`: 통과.
- `flutter build apk --debug`: 통과.
- 저장소 전체 `npm run verify`: 통과(관리자 테스트 29개, Sites 테스트 4개 포함).
- 모바일 브라우저 시각 검증: 통과.

final result: passed
