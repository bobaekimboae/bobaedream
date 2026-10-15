# 서울오토갤러리 Flutter 앱 1차본 + 웹 배포 연결

① 한 줄 요약: 서울오토갤러리 카테고리를 Flutter 앱으로 만들고, 웹 빌드를 기존 GitHub Pages 아래 `/bobaedream/seoul-autogallery/`에 함께 올리도록 배포 설정을 더했다.

② 과제 ID: 없음(사용자 지시 「우리 오토갤러리 카테고리 플러터앱으로 만들어라」 「배포해」) · 브랜치 `claude/seoul-autogallery-flutter-app` · 커밋 `9b10d8c` + 배포 설정 커밋 · PR: 병합 시 기재 · 상태: 병합·배포 후 기재

③ 한 일
- `apps/seoul-autogallery-flutter/`에 Flutter 앱을 만들었다(제조사 로고 카드 줄, 매물 목록, 매물 상세).
- 매물 24대·사진 132장은 프로토타입 `seoul-autogallery-v01.ts`에서 내보낸다(`tool/export_data.mjs`).
- `deploy-pages.yml`에 Flutter 설치·테스트·웹 빌드 단계를 넣고 결과를 `dist/client/seoul-autogallery/`에 복사한다. 이 단계가 실패해도 기존 사이트 배포는 막지 않는다(`continue-on-error`).

④ 원본과 비교: 해당 없음(새 앱). 프로토타입 목록·상세의 글자 크기·간격 규칙을 따라 구현했다.

⑤ 검증: `flutter analyze` 0건, `flutter test` 4개 통과, 웹 빌드 후 모바일 384 폭 캡처로 목록·상세 확인, `npm run verify` 통과(exit 0). Android·iOS 빌드는 못 했다.

⑥ 원본과 다르게 남긴 것: 서체는 기본 서체(Pretendard 미적용). 필터는 제조사뿐, 정렬·딜러 페이지·가격/연식/주행 시트 없음.

⑦ 못 한 것·다음에 할 것: 가격·연식·주행 필터 시트, 딜러 페이지, Pretendard 서체, 서버 연동, Android·iOS 빌드 확인.

⑧ 확인 링크: 웹 `https://bobaekimboae.github.io/bobaedream/seoul-autogallery/` (배포 후, `&v=` 해당 없음)
