// 정적 판 public/community/hupu-board-navigation.js 의 게시판 목록 · 저장 규칙을 TypeScript로 옮긴 것.
// localStorage 키는 정적 판과 같다(사용자 설정이 그대로 이어지게).

export interface ListBoard {
  id: string
  displayName: string
  shortName: string
  section: string
  topicKey: string
  fixed?: boolean
  avatarLabel: string
  avatarColor: string
  avatarAccent: string
  menuSection?: string
  defaultOrder?: number
}

type Row = [string, string, string, string, string, string, string, string, boolean?]
const rows: Row[] = [
  ['best', '베스트글', '베스트', '게시판', '전체', 'BEST', '#18181b', '#f5b942', true],
  ['free', '자유게시판', '자유', '게시판', '전체', '자유', '#2457d6', '#6ea8ff'],
  ['car-news', '자동차뉴스', '자동차뉴스', '게시판', '전체', 'NEWS', '#164e9b', '#55a5f5'],
  ['foreign-car-news', '해외 자동차뉴스', '해외뉴스', '게시판', '전체', 'WORLD', '#0f4c5c', '#3fb7a7'],
  ['brand-car-info', '브랜드 자동차 정보', '브랜드정보', '게시판', '전체', 'BRAND', '#263238', '#90a4ae'],
  ['vehicle-review', '차량리뷰', '차량리뷰', '게시판', '전체', '리뷰', '#1f2937', '#7c8698'],
  ['tuhu-review', '투후 오너 리뷰', '투후리뷰', '게시판', '전체', 'TUHU', '#17191e', '#5d626a'],
  ['fuel-economy', '연비·전비', '연비전비', '게시판', '전체', '효율', '#1f2937', '#7c8698'],
  ['autohome-complaint', '차량 결함·불만', '결함불만', '게시판', '전체', '불만', '#17191e', '#59616d'],
  ['chezhiwang-complaint', '처즈왕 결함·불만', '처즈왕불만', '게시판', '전체', 'CZ', '#17191e', '#59616d'],
  ['politics', '정치/시사게시판', '정치시사', '게시판', '전체', '시사', '#5031a9', '#9678e8'],
  ['test-drive', '리뷰시승', '리뷰시승', '게시판', '전체', '시승', '#c65316', '#ff9c57'],
  ['celebrity-car', '유명인의 차', '유명인차', '게시판', '전체', 'STAR', '#9e3f77', '#f08bc2'],
  ['adult', '성인게시판', '성인', '게시판', '전체', '19', '#74253d', '#d36386'],
  ['boba-story', '보배드림 이야기', '보배이야기', '게시판', '전체', '보배', '#a51f34', '#ef6679'],
  ['suggestion', '제안/건의', '제안건의', '게시판', '전체', '제안', '#35556f', '#76a5c8'],
  ['kbo', '국내야구', '국내야구', '게시판', '전체', 'KBO', '#1f6d3f', '#61bd7e'],
  ['mlb', '해외야구', '해외야구', '게시판', '전체', 'MLB', '#174b8d', '#5d9eea'],
  ['overseas-football', '해외축구', '해외축구', '게시판', '전체', '해축', '#236b4b', '#62c894'],
  ['domestic-football', '국내축구', '국내축구', '게시판', '전체', '국축', '#16736d', '#58c7bc'],
  ['f1', 'F1', 'F1', '게시판', '전체', 'F1', '#b80500', '#ff4b3e'],
  ['event', '이벤트', '이벤트', '게시판', '전체', 'EVENT', '#b23d28', '#ff856b'],
  ['new-humor', '신유머/감동/이슈', '유머이슈', '자료실', '전체', '이슈', '#7f4c16', '#e2a34d'],
  ['humor', '유머게시판', '유머', '자료실', '전체', '유머', '#745400', '#f2c94c'],
  ['accident-blackbox', '교통사고/블박', '교통블박', '자료실', '블박', '블박', '#b4332b', '#ff766e'],
  ['domestic-car', '국산차게시판', '국산차', '자료실', '전체', '국산', '#176549', '#5bc699'],
  ['import-car', '수입차게시판', '수입차', '자료실', '전체', '수입', '#252932', '#808b9e'],
  ['tesla', '테슬라', '테슬라', '자료실', '테슬라', 'T', '#b11f2f', '#ed5965'],
  ['bmw', 'BMW', 'BMW', '자료실', 'BMW', 'BMW', '#1769aa', '#73b9e6'],
  ['mercedes-benz', '벤츠', '벤츠', '자료실', '벤츠', 'BENZ', '#25282d', '#8f969f'],
  ['my-car-photo', '내차사진', '내차사진', '자료실', '전체', 'MY', '#11748d', '#5bc3dc'],
  ['scoop', '직찍/특종발견', '직찍특종', '자료실', '전체', '특종', '#5c3b8f', '#a982e4'],
  ['car-media', '자동차사진/동영상', '자동차영상', '자료실', '전체', '영상', '#3348a1', '#7488eb'],
  ['installation', '장착시공사진', '장착시공', '자료실', '튜닝', 'DIY', '#414f8a', '#8594d6'],
  ['free-media', '자유사진/동영상', '자유영상', '자료실', '전체', 'PHOTO', '#147675', '#58c2bd'],
  ['caution', '후방주의방', '후방주의', '자료실', '전체', '주의', '#a3295d', '#eb76ab'],
  ['racing-model', '레이싱모델', '레이싱', '자료실', '전체', 'RACE', '#a52345', '#f06e8e'],
  ['military', '군사/무기', '군사무기', '자료실', '전체', '군사', '#4e5e31', '#95a967'],
  ['truck-bus-heavy', '트럭/버스/중기', '트럭중기', '자료실', '전체', 'TRUCK', '#645044', '#ae8b72'],
  ['aviation-rail', '항공/해운/철도', '항공철도', '자료실', '전체', '교통', '#244b72', '#6f9bc6'],
  ['bike-cycle', '오토바이/자전거', '바이크', '자료실', '전체', 'BIKE', '#b02e2e', '#ef7474'],
  ['oldcar-memory', '올드카/추억거리', '올드카', '자료실', '전체', 'OLD', '#6c4c2f', '#bc9061'],
]

const boardGroupById: Record<string, string> = {
  'car-news': '자동차', 'foreign-car-news': '자동차', 'brand-car-info': '자동차', 'vehicle-review': '자동차', 'tuhu-review': '자동차',
  'fuel-economy': '자동차', 'test-drive': '자동차', 'celebrity-car': '자동차', 'domestic-car': '자동차', 'import-car': '자동차',
  tesla: '자동차', bmw: '자동차', 'mercedes-benz': '자동차', 'my-car-photo': '자동차', 'car-media': '자동차', installation: '자동차',
  'oldcar-memory': '자동차', 'truck-bus-heavy': '차량/운송', 'bike-cycle': '차량/운송', 'aviation-rail': '차량/운송',
  'accident-blackbox': '사건제보', scoop: '사건제보', 'autohome-complaint': '결함/불만', 'chezhiwang-complaint': '결함/불만',
}

export const listBoards: ListBoard[] = rows.map((r, index) => ({
  id: r[0], displayName: r[1], shortName: r[2], section: r[3], topicKey: r[4],
  avatarLabel: r[5], avatarColor: r[6], avatarAccent: r[7], ...(r[8] ? { fixed: true } : {}),
  defaultOrder: index + 1,
}))
export const menuSections = ['일반', '자동차', '차량/운송', '사건제보', '결함/불만']
export const movableBoards = listBoards.filter(b => !b.fixed)
movableBoards.forEach((b) => { b.menuSection = boardGroupById[b.id] || '일반' })
export const boardById: Record<string, ListBoard> = Object.fromEntries(listBoards.map(b => [b.id, b]))

export const boardChannelStorageKey = 'bbm.community.boardChannels.v2'
const legacyStorageKey = 'bbm.community.boardOrder.v1'
const defaultHomeStorageKey = 'bbm.community.defaultBoard.v1'
export const favoriteStorageKey = 'bbm.community.favoriteBoards.v1'
export const recentStorageKey = 'bbm.community.recentBoards.v1'
const fixedIds = ['home', 'all', 'best']
const defaultExcludedIds = ['adult', 'installation', 'free-media', 'caution', 'racing-model', 'military']
export const defaultActiveOrder = movableBoards.filter(b => !defaultExcludedIds.includes(b.id)).map(b => b.id)

export const homeBoard: ListBoard = { id: 'home', displayName: '전체 게시글', shortName: '홈', section: '', topicKey: '전체', fixed: true, avatarLabel: 'HOME', avatarColor: '#202124', avatarAccent: '#666a70' }
export const allBoard: ListBoard = { id: 'all', displayName: '전체 게시글', shortName: '전체', section: '', topicKey: '전체', fixed: true, avatarLabel: 'ALL', avatarColor: '#202124', avatarAccent: '#666a70' }

export function boardForId(id: string): ListBoard | undefined {
  if (id === 'home') return homeBoard
  if (id === 'all') return allBoard
  return boardById[id]
}

function escapeXml(value: string) {
  return String(value).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
}
/** 게시판 프로필 그림(정적 판과 같은 SVG 데이터 주소) */
export function boardAvatarSrc(board?: Partial<ListBoard>): string {
  const b = board || {}
  const label = String(b.avatarLabel || b.shortName || '전체')
  const fontSize = label.length >= 5 ? 18 : label.length >= 3 ? 21 : 26
  const color = b.avatarColor || '#252525'
  const accent = b.avatarAccent || '#777'
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="10" y1="8" x2="86" y2="88" gradientUnits="userSpaceOnUse"><stop stop-color="' + color + '"/><stop offset="1" stop-color="' + accent + '"/></linearGradient></defs><rect width="96" height="96" rx="48" fill="url(#g)"/><circle cx="74" cy="21" r="17" fill="#fff" fill-opacity=".13"/><path d="M14 69c17-13 34-15 68-3" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width="8" stroke-linecap="round"/><text x="48" y="55" fill="#fff" font-family="Pretendard,Arial,sans-serif" font-size="' + fontSize + '" font-weight="800" text-anchor="middle" letter-spacing="-.8">' + escapeXml(label) + '</text></svg>'
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}

export function normalizeActiveOrder(value: unknown, appendMissing: boolean): string[] {
  const result: string[] = []
  const seen: Record<string, boolean> = {}
  if (Array.isArray(value)) value.forEach((id) => {
    if (typeof id === 'string' && boardById[id] && !boardById[id]!.fixed && !seen[id]) { seen[id] = true; result.push(id) }
  })
  if (appendMissing) defaultActiveOrder.forEach((id) => { if (!seen[id]) { seen[id] = true; result.push(id) } })
  return result
}

export interface ChannelState { version: 2; menuProfileVersion: 1; fixedIds: string[]; activeOrder: string[]; updatedAt: string | null }

export function saveChannelState(order: string[]): ChannelState {
  const state: ChannelState = { version: 2, menuProfileVersion: 1, fixedIds: fixedIds.slice(), activeOrder: normalizeActiveOrder(order, false), updatedAt: new Date().toISOString() }
  try { localStorage.setItem(boardChannelStorageKey, JSON.stringify(state)) } catch { /* 저장 불가 */ }
  return state
}
export function loadChannelState(): ChannelState {
  try {
    const stored = JSON.parse(localStorage.getItem(boardChannelStorageKey) || 'null')
    if (stored && stored.version === 2 && Array.isArray(stored.activeOrder)) {
      let activeOrder = normalizeActiveOrder(stored.activeOrder, false)
      if (!stored.menuProfileVersion && activeOrder.length > defaultActiveOrder.length) {
        activeOrder = defaultActiveOrder.slice()
        saveChannelState(activeOrder)
      }
      return { version: 2, menuProfileVersion: 1, fixedIds: fixedIds.slice(), activeOrder, updatedAt: stored.updatedAt || null }
    }
  } catch { /* 무시 */ }
  try {
    const legacy = JSON.parse(localStorage.getItem(legacyStorageKey) || 'null')
    if (Array.isArray(legacy)) return saveChannelState(normalizeActiveOrder(legacy, true))
  } catch { /* 무시 */ }
  return { version: 2, menuProfileVersion: 1, fixedIds: fixedIds.slice(), activeOrder: defaultActiveOrder.slice(), updatedAt: null }
}
export function boardSections() {
  return menuSections.map(title => ({ title, boards: movableBoards.filter(b => b.menuSection === title) }))
}
export function loadDefaultHome() {
  try { localStorage.removeItem(defaultHomeStorageKey) } catch { /* 무시 */ }
  return 'home'
}
export function loadBoardIds(key: string, limit: number): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '[]')
    if (Array.isArray(stored)) return stored.filter((id: string, index: number) => boardById[id] && stored.indexOf(id) === index).slice(0, limit)
  } catch { /* 무시 */ }
  return []
}
export function saveBoardIds(key: string, ids: string[], limit: number): string[] {
  const normalized = ids.filter((id, index) => boardById[id] && ids.indexOf(id) === index).slice(0, limit)
  try { localStorage.setItem(key, JSON.stringify(normalized)) } catch { /* 무시 */ }
  return normalized
}
export function recordRecentBoard(id: string) {
  if (!boardById[id]) return
  saveBoardIds(recentStorageKey, [id, ...loadBoardIds(recentStorageKey, 6).filter(b => b !== id)], 6)
}
