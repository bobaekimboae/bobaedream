# 보배드림 3D 옵션 오토모션 MVP

실제 촬영 영상과 매물 정본의 옵션 코드를 연결해 3D 기능 설명을 자동 구성하는 Nuxt 4 시안입니다.

## 기술 영역

- 사용자 프론트: TypeScript 6.0.3, Nuxt 4.6.2, Vue 3.5.33
- 3D 미리보기: Three.js 0.187.0
- 패키지 매니저: pnpm 10.33.0
- 운영 업무 API 예정: Laravel 12 / PHP 8.4

이 시안은 업무 규칙을 Nuxt 서버에 구현하지 않습니다. 실제 옵션 판정, 매물 권한, 렌더·게시 상태는 Laravel API와 PostgreSQL 정본에서 받아야 합니다.

## 실행

```powershell
corepack pnpm@10.33.0 install
corepack pnpm@10.33.0 dev
```

샘플 영상은 `public/media/demo.mp4`에 있으며 실제 매물로 오인하지 않도록 시안 안에서 샘플 데이터로만 사용합니다.
