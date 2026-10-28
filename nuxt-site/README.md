# 보배드림 시안 — 넉스트(Nuxt 3) 판

리액트 시안(`src/`)의 중고차 목록 · 매물 상세 · 판매자페이지를 보배드림 프런트엔드와 같은 **Nuxt 3 + Vue 3**로 옮긴 것이다. 화면 · 글자 · 동작은 리액트 판과 같다.

- 확인 주소: https://bobaekimboae.github.io/bobaedream/nuxt/?qf=guazi (주소 뒤 검색어는 리액트 판과 같음: `&pc=1`, `&category=…`, `&view=feed`, `&profile=dealer&shop=…&emp=…` 등)
- 리액트 판(비교용): https://bobaekimboae.github.io/bobaedream/?qf=guazi
- 메인 홈(검색어 없음) · 매물 등록(`?register`, `=bike`, `=shoot`, `=shootsimple`) · 커뮤니티(`?community=reviews&review=…`, `?community=fuel-economy&fuel=…`)도 옮겼다(2026-10-28). `?register=shootkit`은 따로 배포한 `/nuxt-shootkit/`으로 넘긴다.
- 아직 리액트에만 있는 것: 독립 진입점 `/bike/` · `/truck/` · `/shoot/`(설치 안내 띠 포함).

## 두 판을 같이 유지하는 방법
- **공유(복사 안 함)**: 데이터 · 계산 함수 · 타입 · CSS는 리액트 파일을 그대로 불러온다(`@proto` = `src/prototype`, `@src` = `src`). 리액트 쪽에서 고치면 넉스트에도 자동 반영된다. 리액트 파일 속 `react` · `react-dom` import는 빈 대체품(`shims/`)으로 바뀐다.
- **새로 씀**: 화면 부품만 Vue로 옮겼다(`components/`, `composables/`). 리액트 부품을 고치면 같은 이름의 Vue 부품도 고쳐야 한다.
  - 작은 부품은 `.vue`(SFC), 리액트에서 한 함수가 수천 줄인 큰 화면(목록 `MarketplaceScreen.tsx`, `DealerPage.tsx`, `VehicleReviewBoard.tsx`, `ShortformStudio.tsx`)은 Vue 렌더 함수(TSX)로 옮겨 리액트 파일과 줄 단위로 대조할 수 있게 했다(`lib/render-hooks.ts`).
  - 58 촬영 화면(`components/register/shoot/`)은 리액트 훅 모양을 Vue 위에 흉내 내는 작은 층(`react-compat.ts`: `useState` · `useEffect` · `useRef` …, `reactish()`)으로 옮겨 리액트 `ShootRegister.tsx` · `ShortformStudio.tsx`와 줄 단위로 같다.
  - 리액트 파일에서 export 하지 않는 계산 함수를 복사한 곳은 파일 맨 위에 "keep in sync" 주석이 있다(`lib/listing/marketplace-local.ts` 등).
- 옮기는 규칙: `CONVENTIONS.md`.

## 실행
```
cd nuxt-site
npm install
npm run build        # nuxt generate → .output/public
npm run preview      # http://localhost:5193/bobaedream/nuxt/
npm run export       # build + 저장소 public/nuxt/ 로 복사(기존 GitHub Pages 배포가 같이 올림)
sh scripts/typecheck-own.sh   # 넉스트 파일 형식 검사(공유하는 ../src 오류는 뺌)
```
