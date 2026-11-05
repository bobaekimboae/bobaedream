// PC 커뮤니티 이식 — 화면 공용 상태(시나리오 글 · 로그인 시안 · 알림 · 화면 전용 CSS · 링크) (2026-11-04)
// - 시나리오 글은 public/community/bobaedream-pc-scenarios.js 를 늘 같은 주소로 불러와 window.bobaeScenarioPosts 를 쓴다.
// - localStorage 키는 정적 판과 같다(bobaePcDemoPosts · bobaePcDemoLoggedIn · bobaePcCurrentBoard · bobaePcComments:*).
import { STORE_LOGIN, STORE_POSTS, type PcPopular, type PcPost } from './pcBoardLogic'

export function readStore(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
export function writeStore(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch { /* 저장할 수 없는 환경은 무시(정적 판은 오류로 멈춤) */ }
}
export function savedPosts(): PcPost[] {
  try {
    const list = JSON.parse(readStore(STORE_POSTS) || '[]')
    return Array.isArray(list) ? list : []
  } catch { return [] }
}

// ---------- 시나리오 글 ----------
export function usePcScenarios() {
  const basePosts = useState<PcPost[]>('pc-base-posts', () => [])
  const popularPosts = useState<PcPopular[]>('pc-popular-posts', () => [])
  const loaded = useState<boolean>('pc-scenarios-loaded', () => false)
  async function load() {
    if (loaded.value) return
    try {
      const list = await legacyGlobal<PcPost[]>('bobaedream-pc-scenarios.js', 'bobaeScenarioPosts')
      basePosts.value = list || []
      popularPosts.value = ((globalThis as Record<string, unknown>).bobaePopularPosts as PcPopular[] | undefined) || []
    } catch {
      basePosts.value = []
    }
    loaded.value = true
  }
  return { basePosts, popularPosts, loaded, load }
}

// ---------- 피드 사진 · 영상(정적 feedMediaByPost) ----------
export type FeedMedia =
  | { type: 'video'; src: string; poster: string }
  | { type: 'image'; src: string }
  | { type: 'gallery'; items: string[] }

export function feedMediaFor(id?: string): FeedMedia | undefined {
  if (!id) return undefined
  const a = (p: string) => siteAsset(`assets/${p}`)
  const table: Record<string, FeedMedia> = {
    'domestic-001': { type: 'video', src: communityAsset('media/car-driving-road-v01.mp4'), poster: a('detail/raw-20.jpeg') },
    'import-001': { type: 'image', src: a('detail/raw-07.jpeg') },
    'ev-001': { type: 'gallery', items: [a('detail/raw-18.jpeg'), a('detail/raw-19.jpeg'), a('detail/raw-20.jpeg')] },
    'truck-001': { type: 'image', src: a('detail/raw-09.jpeg') },
    'tune-001': { type: 'video', src: communityAsset('media/car-desert-drone-v01.mp4'), poster: a('detail/raw-04.png') },
    'blackbox-001': { type: 'video', src: communityAsset('media/car-sunset-drive-v01.mp4'), poster: a('detail/raw-05.jpeg') },
    'domestic-002': { type: 'gallery', items: [a('pc-detail/9573-imgImage.png'), a('pc-detail/9573-imgImage2.png'), a('pc-detail/9573-imgImage4.png')] },
    'import-002': { type: 'image', src: a('pc-detail/9573-imgImage7.png') },
    'used-002': { type: 'gallery', items: [a('detail/raw-04.png'), a('detail/raw-07.jpeg')] },
    'review-002': { type: 'image', src: a('detail/raw-19.jpeg') },
  }
  return table[id]
}

// ---------- 로그인 시안 · 알림 ----------
let loginCallback: (() => void) | null = null
let toastTimer: ReturnType<typeof setTimeout> | undefined

export function usePcUi() {
  const loggedIn = useState<boolean>('pc-logged-in', () => false)
  const toastText = useState<string>('pc-toast', () => '')
  const toastKey = useState<number>('pc-toast-key', () => 0)
  const loginOpen = useState<boolean>('pc-login-open', () => false)

  function refreshLogin() { loggedIn.value = readStore(STORE_LOGIN) === '1' }
  function isLoggedIn() { refreshLogin(); return loggedIn.value }
  function toast(message: string) {
    toastText.value = message
    toastKey.value += 1
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toastText.value = '' }, 1800)
  }
  function showLoginModal(onLogin?: () => void) {
    loginCallback = onLogin || null
    loginOpen.value = true
  }
  function confirmLogin() {
    writeStore(STORE_LOGIN, '1')
    loginOpen.value = false
    refreshLogin()
    const fn = loginCallback
    loginCallback = null
    if (fn) fn()
  }
  function cancelLogin() {
    loginOpen.value = false
    loginCallback = null
  }
  function reset() {
    loginOpen.value = false
    loginCallback = null
    toastText.value = ''
    clearTimeout(toastTimer)
  }
  return { loggedIn, toastText, toastKey, loginOpen, refreshLogin, isLoggedIn, toast, showLoginModal, confirmLogin, cancelLogin, reset }
}

// ---------- 화면 전용 CSS ----------
// main.css(공용, 고칠 수 없음)가 정적 판에 없는 규칙을 깔아 둔다. 정적 CSS 앞에 같은 우선순위로 `revert` 를 두어
// 정적 CSS가 정한 값은 그대로 이기고, 정적 CSS가 정하지 않은 값만 브라우저 기본값으로 되돌린다.
// :root 규칙은 우선순위가 정적 판 html 보다 높아 revert 로 못 지우므로 정적 판 html 값을 :root 로 다시 적는다.
const BASE_RESET = [
  'html,body{min-height:revert}',
  'body{padding:revert;min-width:revert}',
  'button,input,textarea{font:revert;color:revert}',
  'button{padding:revert;border:revert;background:revert;cursor:revert}',
  'a{color:revert;text-decoration:revert}',
].join('\n')

/** 화면에 있는 동안만 정적 CSS를 붙인다. 화면을 떠나면 useHead 가 모두 걷어 낸다. */
export function usePcLegacyStyles(opts: { sheets: string[]; root: string; reset?: string; htmlClass: () => string; bodyClass?: () => string; title: () => string }) {
  const fix = (text: string) => text.replace(/url\((["']?)assets\//g, (_m, q) => `url(${q}${communityAsset('assets/')}`)
  const css = [BASE_RESET, opts.reset || '', ...opts.sheets.map(fix), opts.root].join('\n')
  useHead(() => ({
    htmlAttrs: { class: opts.htmlClass() },
    bodyAttrs: { class: opts.bodyClass ? opts.bodyClass() : '' },
    title: opts.title(),
    link: [{ key: 'pc-pretendard', rel: 'stylesheet', href: siteAsset('assets/fonts/pretendard/pretendard-guazi.css') }],
    style: [{ key: 'pc-legacy', id: 'pcLegacyStyles', innerHTML: css }],
  }))
}

/**
 * 화면 CSS 가 실제로 문서에 붙을 때까지 기다린다(useHead 는 다음 그리기 때 붙인다).
 * 화면 이동 직후 바로 포커스 · 스크롤하면 정적 판과 다른(스타일 없는) 배치에서 계산되기 때문.
 */
export async function waitForLegacyStyles(marker: string, maxFrames = 30) {
  for (let i = 0; i < maxFrames; i++) {
    const el = document.getElementById('pcLegacyStyles')
    if (el && (el.textContent || '').includes(marker)) return
    await new Promise(resolve => requestAnimationFrame(() => resolve(null)))
  }
}

/** 정적 PC 화면 html 규칙을 :root 로 옮긴 값(목록 · 상세 공통) */
export const PC_BOARD_ROOT = [
  ':root{background:var(--bg);color:#000;font-family:var(--font-system);font-synthesis:initial}',
  '@media(max-width:767px){:root{background:#f3f4f6}}',
].join('\n')

// ---------- 링크 ----------
/** 앱 안 주소를 해시 주소 href 로(#/pc?…) */
export function appHref(path: string) { return '#' + path }

/** 사이트 다른 화면(보배드림 메인 등) 주소 */
export function siteHref(pathAndQuery: string) { return siteAsset('') + pathAndQuery.replace(/^\.?\//, '') }

/**
 * 화면 맨 바깥 click 처리: 정적 판에서 전체 이동이던 앱 안 링크(#/…)를 라우터 이동으로 바꾸고,
 * href="#" 링크는 정적 판처럼 맨 위로만 올린다(해시 라우팅이 깨지지 않게).
 */
export function usePcLinkClicks(onAppLink: (path: string) => void) {
  return (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const anchor = (event.target as HTMLElement | null)?.closest?.('a') as HTMLAnchorElement | null
    if (!anchor) return
    const href = anchor.getAttribute('href') || ''
    if (href === '#') {
      event.preventDefault()
      window.scrollTo(0, 0)
      return
    }
    if (href.startsWith('#/')) {
      event.preventDefault()
      onAppLink(href.slice(1))
    }
  }
}
