# 서울오토갤러리 앱 (Flutter)

보배드림 프로토타입의 「서울오토갤러리」 카테고리를 Flutter 앱으로 옮긴 1차본이다.
화면: 제조사 로고 카드 줄 + 매물 목록(썸네일 · 제목 · 사양 · 가격 · 지역 · 판매자 · 찜) → 매물 상세(사진 넘기기 · 사양 · 판매자 · 차량 정보).

## 실행
```
flutter pub get
flutter run            # 연결된 기기·에뮬레이터
flutter run -d chrome  # 웹
flutter test           # 데이터·표기 규칙·화면 흐름 테스트
```
웹 빌드를 로컬 브라우저에서 볼 때: `flutter build web --no-web-resources-cdn`

## 데이터 갱신
매물 원본은 프로토타입 `src/prototype/data/seoul-autogallery-v01.ts`다. 바뀌면 저장소 루트에서
```
node apps/seoul-autogallery-flutter/tool/export_data.mjs
```
를 다시 돌려 `assets/data/cars.json` · 사진 · 로고를 갱신한다. (사진 약 7MB, 매물 24대)

## 알려진 한계
- 서체는 기본 서체다. 프로토타입의 Pretendard는 아직 넣지 않았다.
- 필터는 제조사 하나뿐이다. 프로토타입의 가격·연식·주행 시트, 딜러 페이지, 정렬은 아직 없다.
- 판매자 프로필 사진, 상사 링크, 찜 저장, 전화·채팅은 없다. 찜은 화면 안 상태만 바뀐다.
- 서버 연동이 없다. 매물과 사진은 앱에 포함된 프로토타입 값이다.
- Android·iOS 빌드는 이 환경에서 하지 못했다. 웹 빌드와 `flutter test`, `flutter analyze`만 확인했다.
