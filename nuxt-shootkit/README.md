# 보배드림 촬영 쇼츠 키트 — 넉스트(Nuxt 4) 판

리액트 시안 `?register=shootkit`(`src/prototype/register/shoot-kit/`)을 보배드림 프런트엔드와 같은 **Nuxt 4 + Vue 3**로 옮긴 것이다. 화면 · 글자 · 동작은 리액트 판과 같고, 같은 자동 시험을 그대로 통과하는 것을 기준으로 옮겼다.

- 확인 주소: https://bobaekimboae.github.io/bobaedream/nuxt-shootkit/
- 리액트 판(비교용, 2026-10-29부터 더 고치지 않음): https://bobaekimboae.github.io/bobaedream/?register=shootkit
- **2026-10-29 「넉스트 하나만 가자」: 촬영 쇼츠 키트는 이 폴더만 고친다.** 리액트 판과 같게 맞추던 규칙은 끝났다. 새 기능·수정은 여기에만 넣는다.
- 주소 검색어는 리액트 판과 같다: `?vstage=58`(58 원본 재현) · `?fakecam=1`(카메라 없는 PC 시험) · `?debug=1` · `?guide=on`(사진 윤곽선 시안)
- 실제 등록 · 업로드 요청은 보내지 않는다(「등록하기」는 안내만).

## 버전
Nuxt 4.6.2 · Vue 3.5.33 · TypeScript 6.0.3 · Node 24.22.1 · pnpm 10.33.0 · `ssr: false`(카메라 · 녹화 · 캔버스를 쓰는 화면이라 브라우저에서만 그림) · 라우터 없음(한 화면 앱, `app.vue` → `ShootRegister.vue`).

## 폴더
| 폴더 | 내용 |
|---|---|
| `components/shoot/` | 화면 컴포넌트. `ShootRegister.vue`가 등록 화면이자 화면 전환(사진 촬영 · 편집 · 영상 촬영 · 미리보기 · 표지 · 쇼츠 · 규칙 · 지역) 담당 |
| `composables/` | `useCamera` · `useLayerEsc` · `useDialogFocus` · `useSwipe` · `useBox` · `useFit` · `useDragSwap` |
| `lib/` | 화면과 상관없는 로직(리액트 판에서 그대로 옮김): 촬영 항목 · 사진 처리 · mp4 저장 · 쇼츠 구간 고르기 · 그리기(`render.ts`) · 부위 자동 나누기(`autosort.ts`) · 공통 값(`core.ts`) |
| `data/` | `shoot-items-kit.json`(촬영 항목 단일 기준) · `regions-kr.json` |
| `assets/css/` | 리액트 판 CSS 그대로(`shoot.css` · `shorts.css` · `shortform-studio.css`) + 기본 바탕 `base.css` |

아이콘 · 예시 사진 · 인식 데이터는 시안 사이트 `public/`의 파일을 그대로 쓴다(`lib/site.ts`의 `sitePath()`). 실서비스로 옮길 때는 `SITE_BASE`만 바꾸면 된다.

## 실행
```
cd nuxt-shootkit
pnpm install --frozen-lockfile
pnpm build        # nuxt generate → .output/public
pnpm preview      # http://localhost:5191/bobaedream/nuxt-shootkit/ (배포와 같은 주소 구조)
pnpm typecheck # 형식 검사
```
배포: `pnpm build` 결과를 저장소 `public/nuxt-shootkit/`에 복사해 두면 기존 GitHub Pages 배포가 같이 올린다(배포 설정은 바꾸지 않음).

## 리액트 → Vue 대응
옮긴 규칙은 `CONVENTIONS.md`. 리액트의 `onXxx` 콜백 prop은 `emit("xxx")`, `useState` → `ref`, `useEffect` → `watch`/`onMounted`, `useMemo` → `computed`.

## 촬영 AI 검증 (PR #1102, 2026-11-01)

- `pnpm test:ai`: 위치 판정·단일 worker·프레임 버리기·중지 검증.
- `pnpm exec playwright install chromium` 후 `pnpm test:browser`: 합성 카메라를 사용한 모바일 폭/PC 폭 회귀. 실제 휴대폰 시험을 대신하지 않는다.
- `pnpm bench:ai`: 실매물 사진 17장의 변형을 실제 YOLOS 모델로 처리. 모델 다운로드는 curl 중계/캐시이므로 실통신망 최초 다운로드 수치가 아니다.
- 결과와 미검증 항목: `../reports/pr-1102-validation.md`. Android·iPhone·배터리·발열 실측을 마치기 전 병합 보류.
- Nuxt 4 이전부터 쓰던 폴더 위치는 `srcDir: "."`으로 유지한다. `noUncheckedIndexedAccess: false`는 Nuxt 3 때의 타입 검사 범위를 유지하며 `strict` 검사는 유지한다.
