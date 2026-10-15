# 김태규 딜러 Flutter 앱

기존 보배드림 프로토타입의 김태규 딜러 페이지를 Android, iOS, Web에서 실행할 수 있도록 옮긴 Flutter 앱입니다.

## 포함 화면

- 페라리 배너와 프로필이 겹치는 딜러 헤더
- 판매중·판매완료·팔로워 통계와 팔로우 상태 전환
- 채팅·전화·무료 견적 CTA
- 홈, 판매차량, 커뮤니티, 내차견적, 리뷰, SNS, 소속딜러, 소개 탭
- 서울오토갤러리 실제 테스트 매물 이미지와 목록형 카드

## 실행

```powershell
flutter pub get
flutter run
```

웹 미리보기는 `flutter run -d chrome`, Android APK는 `flutter build apk --debug`로 만들 수 있습니다.

## 검증

```powershell
flutter analyze
flutter test
flutter build web --release
flutter build apk --debug
```
