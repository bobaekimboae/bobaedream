# 보배드림 커뮤니티 — Nuxt 4

PC 웹과 모바일웹용 커뮤니티 정본이다. 네이티브 iOS·Android 앱은 Flutter로 별도 구현하고, 화면 상태와 Laravel API 계약만 공유한다.

## 기술 기준

- Nuxt 4.6.2 / Vue 3.5.33 / TypeScript 6.0.3
- Tiptap 3.27.3
- Node.js 24.22.1 / pnpm 10.33.0
- 사용자 화면 상태: Nuxt `useState`와 Vue Composition API
- 운영 API: Laravel 12 / PHP 8.4

## 실행

```powershell
corepack pnpm install
corepack pnpm dev
corepack pnpm typecheck
corepack pnpm generate
```

로컬 기본 주소는 `http://localhost:5203/bobaedream/nuxt-community/`다.

## 구현 범위

- 커뮤니티 목록: 간결형(치지직), 목록형(네이버 카페), 피드형(네이버 증권 토론)
- 게시글 옵션: 최신순, 최신 댓글순, 인기순, 보기 방식, 말머리
- 게시판 트리: 일반, 자동차, 차량, 제보, 결함
- 글쓰기: 게시판 선택, 제목, Tiptap 본문, 이미지·영상 미리보기, 태그, 이모지, 인용, 구분선, 링크, 투표, 임시저장, 이탈 확인, 등록
- 상세: 본문, 태그, 추천·비추천, 댓글 입력 골격

API 주소가 없을 때는 공개 시안 검증을 위해 브라우저 `localStorage` 어댑터를 사용한다. 운영에서는 `NUXT_PUBLIC_COMMUNITY_API_BASE`를 지정하며, 권한·검증·sanitize·첨부 영속화·중복 방지는 Laravel이 최종 판정한다.
