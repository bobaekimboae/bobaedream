// PC 커뮤니티(정적 bobaedream-pc-board-*.html + bobaedream-pc-interactions.js) 이식 공용 로직 (2026-11-04)
// - 정적 판의 데이터 · 규칙(게시판 이름, 섹션, 정렬, 검색, 공지, 피드 미디어)을 그대로 옮긴다.
// - 시나리오 글 목록은 public/community/bobaedream-pc-scenarios.js 를 불러와 window.bobaeScenarioPosts 를 쓴다.
// - localStorage 키는 정적 판과 같다(bobaePcDemoPosts · bobaePcDemoLoggedIn · bobaePcCurrentBoard · bobaePcComments:*).

/** [분류, 제목, 작성자, 시간, 조회, 추천, 댓글, 본문?, 글ID?, 게시판?, 공지?] */
export type PcPost = [string, string, string, string, number | string, number | string, number | string, string?, string?, string?, boolean?]
export type PcPopular = [string, number]

export const STORE_POSTS = 'bobaePcDemoPosts'
export const STORE_LOGIN = 'bobaePcDemoLoggedIn'
export const STORE_BOARD = 'bobaePcCurrentBoard'

export const boardNotices: PcPost[] = [
  ['공지', '보배드림 커뮤니티 이용 수칙 및 게시판 운영 안내', '보배드림 운영팀', '10.24', '1,384', 12, 4, '', 'notice-guide', '공지', true],
  ['공지', '자동차 매물·거래 사칭 피해 예방 안내', '보배드림 운영팀', '10.23', '2,601', 8, 7, '', 'notice-safe-trade', '공지', true],
  ['공지', '개인정보 노출 및 게시물 신고 기준 안내', '보배드림 운영팀', '10.21', '3,872', 6, 11, '', 'notice-privacy', '공지', true],
]

export const boardNames = ['전체 게시글', '국산차 오너톡', '수입차 라운지', '전기차 충전소', 'SUV 패밀리카', '화물·특장', '중고차 문의', '정비 상담', '튜닝 인증', '보험·사고', '블랙박스 제보', '공지', '자유', '질문', '시승기', '출석체크', '국산차', '수입차', '전기차', '정비', '블랙박스', '사고/블박', '보험', '교통법규', '유머', '정치/시사', '베스트', '차량리뷰', '연비/전비', '결함/불만', '운영정책', '문의/제보']

export const boardConfig: Record<string, { categories: string[]; label: string }> = {
  '전체 게시글': { categories: [], label: '전체' },
  '국산차 오너톡': { categories: ['국산차'], label: '국산차' },
  '수입차 라운지': { categories: ['수입차'], label: '수입차' },
  '전기차 충전소': { categories: ['전기차'], label: '전기차' },
  'SUV 패밀리카': { categories: ['SUV'], label: 'SUV' },
  '화물·특장': { categories: ['화물'], label: '화물' },
  '중고차 문의': { categories: ['중고차'], label: '중고차' },
  '정비 상담': { categories: ['정비'], label: '정비' },
  '튜닝 인증': { categories: ['튜닝'], label: '튜닝' },
  '보험·사고': { categories: ['보험', '사고/블박'], label: '보험' },
  '블랙박스 제보': { categories: ['블랙박스'], label: '블랙박스' },
  '공지': { categories: ['공지'], label: '공지' },
  '자유': { categories: ['자유'], label: '자유' },
  '질문': { categories: ['질문'], label: '질문' },
  '시승기': { categories: ['시승기'], label: '시승기' },
  '출석체크': { categories: ['출석'], label: '출석' },
  '국산차': { categories: ['국산차'], label: '국산차' },
  '수입차': { categories: ['수입차'], label: '수입차' },
  '전기차': { categories: ['전기차'], label: '전기차' },
  '정비': { categories: ['정비'], label: '정비' },
  '블랙박스': { categories: ['블랙박스'], label: '블랙박스' },
  '사고/블박': { categories: ['사고/블박'], label: '사고' },
  '보험': { categories: ['보험'], label: '보험' },
  '교통법규': { categories: [], label: '교통법규' },
  '유머': { categories: ['유머'], label: '유머' },
  '정치/시사': { categories: ['정치/시사'], label: '정치/시사' },
  '베스트': { categories: [], label: '베스트' },
  '차량리뷰': { categories: [], label: '차량리뷰' },
  '연비/전비': { categories: [], label: '연비/전비' },
  '결함/불만': { categories: [], label: '결함/불만' },
  '운영정책': { categories: [], label: '운영정책' },
  '문의/제보': { categories: [], label: '문의/제보' },
}

export const sectionConfig: Record<string, { label: string; allLabel: string; topics: Record<string, string[]> }> = {
  car: { label: '자동차', allLabel: '전체', topics: { '전체': [], '국산차': ['국산차', 'SUV'], '수입차': ['수입차'], '전기차': ['전기차'] } },
  humor: { label: '유머', allLabel: '전체글', topics: { '전체글': [], '유머': ['유머'], '짤방': ['짤방'] } },
  politics: { label: '정치/시사', allLabel: '전체글', topics: { '전체글': [], '국민의힘': ['국민의힘'], '민주당': ['민주당'] } },
}

export const sectionPosts: Record<string, PcPost[]> = {
  humor: [
    ['유머', '세차장 진입 전에 꼭 확인해야 하는 뜻밖의 이유', '웃음충전', '방금', 342, 5, 18],
    ['짤방', '주차 한 번에 성공했을 때 표정', '주차달인', '4분 전', 518, 8, 27],
  ],
  politics: [
    ['국민의힘', '오늘 발표된 교통 정책 핵심 내용 정리', '정책읽기', '방금', 286, 3, 14],
    ['민주당', '자동차 세제 개편 관련 논의 내용 정리', '생활정치', '5분 전', 241, 2, 11],
  ],
}

export type FeedMedia =
  | { type: 'video'; src: string; poster: string }
  | { type: 'image'; src: string }
  | { type: 'gallery'; items: string[] }

/** 정적 판 feedMediaByPost. 사진은 사이트 공용 /assets/, 영상은 community/media 를 쓴다. */
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

// ---------- 저장소 ----------
export function readStore(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
export function writeStore(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch { /* 저장 불가 환경은 무시 */ }
}
export function savedPosts(): PcPost[] {
  try { return JSON.parse(readStore(STORE_POSTS) || '[]') } catch { return [] }
}

// ---------- 시나리오 글 ----------
const basePosts = () => useState<PcPost[]>('pc-base-posts', () => [])
const popularPosts = () => useState<PcPopular[]>('pc-popular-posts', () => [])

export async function loadPcScenarios() {
  const posts = basePosts()
  const popular = popularPosts()
  if (posts.value.length) return
  try {
    const list = await legacyGlobal<PcPost[]>('bobaedream-pc-scenarios.js', 'bobaeScenarioPosts')
    const pop = (globalThis as Record<string, unknown>).bobaePopularPosts as PcPopular[] | undefined
    posts.value = list || []
    popular.value = pop || []
  } catch {
    posts.value = []
  }
}

export function usePcPosts() {
  return { basePosts: basePosts(), popularPosts: popularPosts() }
}

export function getAllPosts(base: PcPost[]): PcPost[] {
  return savedPosts().concat(base)
}

export function makeFallbackPosts(board: string): PcPost[] {
  const cfg = boardConfig[board] || { label: '자유' }
  return [
    [cfg.label, board + ' 첫 글로 실사용 후기 남깁니다', '보배시안러', '방금', 3, 0, 0],
    [cfg.label, board + '에서 자주 묻는 질문 정리해봤습니다', '질문정리', '8분 전', 18, 0, 2],
    [cfg.label, board + ' 관련해서 오너분들 의견 궁금합니다', '오너톡', '16분 전', 27, 0, 4],
    [cfg.label, board + ' 사진과 견적 비교 자료 공유합니다', '자료공유', '24분 전', 41, 1, 6],
    [cfg.label, board + ' 이번 주 인기 토론 주제 모음', '운영메모', '32분 전', 55, 0, 1],
  ]
}

export function getPostsForBoard(board: string, base: PcPost[]): PcPost[] {
  const all = getAllPosts(base)
  if (board === '전체 게시글') return all
  const cfg = boardConfig[board] || boardConfig['전체 게시글']!
  const filtered = all.filter(post => cfg.categories.indexOf(post[0]) !== -1 || String(post[1]).indexOf(board.replace(' 게시글', '')) !== -1)
  return filtered.length ? filtered : makeFallbackPosts(board)
}

export function boardFromCategory(category: string): string {
  const found = boardNames.find(name => name !== '전체 게시글' && (boardConfig[name]!.categories || []).indexOf(category) !== -1)
  return found || '전체 게시글'
}

export function sectionKeyFromParams(section: string | null, board: string): string {
  if (section && sectionConfig[section]) return section
  if (board === '유머') return 'humor'
  if (board === '정치' || board === '정치/시사') return 'politics'
  if (board && boardConfig[board]) return 'car'
  return ''
}

export function numericMetric(value: unknown): number {
  return Number(String(value == null ? '0' : value).replace(/[^0-9.-]/g, '')) || 0
}

export function findPost(base: PcPost[], id: string | null, title: string | null): PcPost | null {
  const all = getAllPosts(base)
  if (id) {
    const byId = all.find(post => post[8] === id)
    if (byId) return byId
  }
  if (title) {
    const byTitle = all.find(post => post[1] === title)
    if (byTitle) return byTitle
  }
  return null
}

export function detailCopyFor(board: string, title: string) {
  return title + '에 대한 실제 오너 관점의 짧은 후기입니다. ' + board + ' 게시판에서 이어지는 토론 흐름을 확인할 수 있도록 작성자 정보, 최신 글, 반응, 댓글 영역을 같은 화면 리듬으로 배치했습니다.'
}

export function shortcutToBoard(label: string) {
  if (label.indexOf('전기차') !== -1) return '전기차 충전소'
  if (label.indexOf('SUV') !== -1) return 'SUV 패밀리카'
  if (label.indexOf('정비') !== -1) return '정비 상담'
  if (label.indexOf('블랙박스') !== -1) return '블랙박스 제보'
  return '전체 게시글'
}

// ---------- 주소 ----------
/** 정적 판 withLayout: layout 값이 있으면 뒤에 붙인다(중복 확인 없음, 정적 판과 같음). */
export function withLayout(url: string, layout: string) {
  if (!layout) return url
  return url + (url.indexOf('?') === -1 ? '?' : '&') + 'layout=' + encodeURIComponent(layout)
}

/** 정적 판 레딧 모드 링크 고치기(url.searchParams.set('layout','reddit')). */
export function forceRedditLayout(url: string, on: boolean) {
  if (!on) return url
  const [path, search = ''] = url.split('?')
  const params = new URLSearchParams(search)
  params.set('layout', 'reddit')
  return path + '?' + params.toString()
}

export function listUrl(query = '') { return '/pc' + (query ? (query.startsWith('?') ? query : '?' + query) : '') }

/** 상세 주소: 정적 DETAIL_PAGE?board=…&post=…&postId=… → /pc/posts/<postId|0>?… */
export function detailUrl(board: string, post: PcPost, layout: string) {
  let href = '?board=' + encodeURIComponent(board) + '&post=' + encodeURIComponent(post[1])
  if (post[8]) href += '&postId=' + encodeURIComponent(post[8])
  return '/pc/posts/' + encodeURIComponent(post[8] || 'view') + withLayout(href, layout)
}

export function useCurrentQuery() {
  const route = useRoute()
  const q = (key: string): string | null => {
    const v = route.query[key]
    if (Array.isArray(v)) return v[0] ?? null
    return v == null ? null : String(v)
  }
  return { route, q }
}

// ---------- 로그인 · 알림 ----------
export function usePcUi() {
  const loggedIn = useState('pc-logged-in', () => readStore(STORE_LOGIN) === '1')
  const toastText = useState<string>('pc-toast', () => '')
  const toastKey = useState<number>('pc-toast-key', () => 0)
  const loginOpen = useState<boolean>('pc-login-open', () => false)
  let onLogin: (() => void) | null = null
  let toastTimer: ReturnType<typeof setTimeout> | undefined

  function refreshLogin() { loggedIn.value = readStore(STORE_LOGIN) === '1' }
  function toast(message: string) {
    toastText.value = message
    toastKey.value += 1
    const key = toastKey.value
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { if (toastKey.value === key) toastText.value = '' }, 1800)
  }
  const loginCallback = useState<{ fn: (() => void) | null }>('pc-login-cb', () => ({ fn: null }))
  function showLoginModal(cb?: () => void) {
    loginCallback.value.fn = cb || null
    onLogin = cb || null
    loginOpen.value = true
  }
  function confirmLogin() {
    writeStore(STORE_LOGIN, '1')
    loginOpen.value = false
    refreshLogin()
    const fn = loginCallback.value.fn || onLogin
    loginCallback.value.fn = null
    if (fn) fn()
  }
  function cancelLogin() {
    loginOpen.value = false
    loginCallback.value.fn = null
  }
  return { loggedIn, toastText, toastKey, loginOpen, refreshLogin, toast, showLoginModal, confirmLogin, cancelLogin }
}

/** 정적 HTML의 <style> 블록 · CSS 파일을 그 화면에 있는 동안만 붙인다(다른 화면으로 번지지 않게). 내용은 고치지 않고
 *  상대 주소 url("assets/…")만 정적 판과 같은 위치(/bobaedream/community/assets/…)로 바꿔 넣는다. */
export function usePcLegacyStyles(sheets: string[], htmlClass: () => string, title?: () => string) {
  const css = sheets.map(text => text.replace(/url\((["']?)assets\//g, (_m, q) => `url(${q}${communityAsset('assets/')}`)).join('\n')
  useHead(() => ({
    htmlAttrs: { class: htmlClass() },
    title: title ? title() : undefined,
    link: [{ rel: 'stylesheet', href: siteAsset('assets/fonts/pretendard/pretendard-guazi.css') }],
    style: [{ key: 'pc-legacy', innerHTML: css }],
  }))
}
