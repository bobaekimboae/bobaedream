// 정적 커뮤니티(public/community) → Nuxt 이식 공용 도구 (2026-11-04)
// - 그림 · 아이콘 · 데이터 파일은 복사하지 않고 사이트 공용 경로(/bobaedream/community/…)를 그대로 쓴다.
//   (뉴스 봇 등이 public/community/data 를 계속 갱신하므로 데이터는 한 곳에만 둔다)
// - 데이터 파일(window.XXX = … 형태 .js)은 실행할 때 <script>로 한 번만 불러와 전역 값을 받는다.
//   운영에서는 같은 모양을 Laravel API(communityApi)가 돌려준다.

/** 사이트 맨 위 주소. 배포: /bobaedream/ , 로컬 dev: /bobaedream/ (baseURL 에서 앱 폴더 이름을 뺀 값) */
export function siteRoot(): string {
  const base = useRuntimeConfig().app.baseURL || '/'
  return base.replace(/nuxt-community\/?$/, '')
}

/** public/community 안의 파일 주소. communityAsset('assets/reddit-ui/menu.svg') */
export function communityAsset(path: string): string {
  if (!path) return ''
  if (/^(https?:|data:|blob:)/.test(path)) return path
  return `${siteRoot()}community/${path.replace(/^\.?\//, '')}`
}

/** public/ 맨 위 기준 파일 주소. siteAsset('assets/bbm/m-header-back.svg') */
export function siteAsset(path: string): string {
  if (!path) return ''
  if (/^(https?:|data:|blob:)/.test(path)) return path
  return `${siteRoot()}${path.replace(/^\.?\//, '').replace(/^\.\.\//, '')}`
}

const scriptLoads = new Map<string, Promise<void>>()

/** public/community 의 .js 데이터 파일을 한 번만 불러온다. loadLegacyScript('data/board-f1.js') */
export function loadLegacyScript(path: string): Promise<void> {
  const src = communityAsset(path)
  const cached = scriptLoads.get(src)
  if (cached) return cached
  const job = new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') return resolve()
    const el = document.createElement('script')
    el.src = src
    el.async = false
    el.onload = () => resolve()
    el.onerror = () => reject(new Error(`데이터 파일을 불러오지 못했어요: ${path}`))
    document.head.appendChild(el)
  })
  scriptLoads.set(src, job)
  return job
}

/** 데이터 파일을 불러온 뒤 전역 값을 돌려준다. await legacyGlobal<Post[]>('data/board-f1.js', 'BBM_BOARD_F1') */
export async function legacyGlobal<T>(path: string, name: string): Promise<T | undefined> {
  await loadLegacyScript(path)
  return (globalThis as Record<string, unknown>)[name] as T | undefined
}

/** public/community 의 .json 데이터 */
export async function legacyJson<T>(path: string): Promise<T> {
  return await $fetch<T>(communityAsset(path))
}
