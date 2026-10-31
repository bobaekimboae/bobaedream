# 보배드림 촬영키트 Lab

기존 `nuxt-shootkit/`을 수정하지 않고 별도 경로에서 시험하는 독립 UX 수정판입니다.

## 분리 원칙

- 기존 앱: `/bobaedream/nuxt-shootkit/`
- 수정판: `/bobaedream/nuxt-shootkit-lab/`
- 저장 상태, 카메라 상태, 배포 폴더를 공유하지 않습니다.
- 촬영·업로드·SNS 게시 API를 호출하지 않는 프런트엔드 시안입니다.

## 포함한 개선안

- 매물 단위 프로젝트 홈과 진행률
- 사진·영상·360°·AI 숏폼 4개 퀵 액션
- 거리·높이·수평을 문장으로 알려주는 행동형 촬영 코치
- 8방향 360° 촬영 프로토타입
- 원본 보존형 전후 비교
- AI 숏폼 자동 제작 상태와 왜곡 검수 안내
- 텍스트 라벨이 유지되는 하단 내비게이션

## 기술 스택

- TypeScript 6.0.3
- Nuxt 4.6.2
- Vue 3.5.33
- pnpm 10.33.0
- CSS Custom Properties

## 실행

```powershell
corepack pnpm@10.33.0 install
corepack pnpm@10.33.0 typecheck
corepack pnpm@10.33.0 build
corepack pnpm@10.33.0 dev
```

카메라가 없는 PC에서는 `?fakecam=1`을 붙이면 샘플 사진으로 촬영 흐름을 시험할 수 있습니다.
