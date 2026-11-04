// 목록 화면이 쓰는 정적 데이터 파일(public/community/data/*.js · scenario-data.js 등)을 정적 판과 같은 순서로 불러온다.
// 데이터의 단일 원본은 public/community 이고, 여기서는 전역 값을 받아 TypeScript 모양으로 돌려준다.
// 운영에서는 같은 모양을 Laravel API(communityApi)가 돌려준다.

export interface ListEmbed {
  url: string
  render?: string
  provider?: string
  title?: string
  description?: string
  image?: string
  logo?: string
  site?: string
  lang?: string
  tall?: boolean
  metaReady?: boolean
  noHydrate?: boolean
  [key: string]: unknown
}
export interface ListPoll { title: string; options: string[]; note?: string; [key: string]: unknown }
export interface ListPost {
  id: number | string
  title: string
  user: string
  category?: string
  time?: string
  view?: number
  reply?: number
  likes?: number
  fresh?: boolean
  thumb?: string
  thumbnail?: string
  detailImage?: string
  images?: string[]
  photos?: number
  video?: boolean
  mediaLink?: boolean
  rank?: number | string
  local?: boolean
  board?: string
  boardTable?: boolean
  body?: string[]
  summary?: string
  summary3?: string[]
  media?: Array<{ kind?: string; url?: string; id?: string }>
  embeds?: ListEmbed[]
  hideBody?: boolean
  poll?: ListPoll | null
  authorAvatar?: string
  sourceUrl?: string
  source?: string
  publishedAt?: string
  [key: string]: unknown
}
export interface MediaSource { src: string; id: string; kind: string; ratio: number }
export interface ListBoardTable { board: string; displayName: string; defaultView?: string; topics?: string[]; rows?: Record<string, unknown>[]; [key: string]: unknown }
export interface ListEmbedApi {
  info(url: string): ListEmbed | null
  previewHtml(item: ListEmbed): string
  frameHtml(item: ListEmbed, opts?: Record<string, unknown>): string
  faviconFor?(url: string): string
  hydratePreviews?(root: Element): void
  hydrateCards?(root: Element): void
  fetchMeta?(url: string): Promise<Record<string, string> | null>
  cardHtml?(item: ListEmbed): string
}
export interface DiscussionMediaApi {
  photosFor(post: ListPost): Array<{ src: string; ratio: number; mediaId?: number }>
  videoFor(post: ListPost): string
}

// 정적 판 <script> 순서 그대로(head → body 끝)
const dataScripts = [
  'data/board-best.js', 'data/board-car-news.js', 'data/board-foreign-car-news.js', 'data/board-brand-car-info.js',
  'data/board-vehicle-review.js', 'data/board-fuel-economy.js', 'data/importer-dealer-directory.js', 'data/board-autohome-complaint.js',
  'data/board-chezhiwang-complaint.js', 'data/board-tuhu-review.js', 'data/board-f1.js', 'community-embed.js',
  'scenario-data.js', 'data/best-posts.js', 'vendor/embla-carousel/embla-carousel.umd.js', 'discussion-media.js',
]

let ready: Promise<void> | null = null
/** 데이터 파일을 모두 불러온다(한 번만). */
export function loadListData(): Promise<void> {
  if (!ready) ready = Promise.all(dataScripts.map(path => loadLegacyScript(path))).then(() => undefined)
  return ready
}
function g<T>(name: string): T | undefined {
  return (globalThis as Record<string, unknown>)[name] as T | undefined
}
export const legacy = {
  tables: () => g<Record<string, ListBoardTable>>('BBM_BOARD_TABLES') || {},
  scenarioPosts: () => g<ListPost[]>('BOBAE_POSTS') || [],
  embed: () => g<ListEmbedApi>('BBM_EMBED'),
  media: () => g<DiscussionMediaApi>('BBM_DISCUSSION_MEDIA'),
  embla: () => g<(el: Element, opts: Record<string, unknown>) => EmblaApi>('EmblaCarousel'),
}
export interface EmblaApi {
  destroy(): void
  reInit(): void
  canScrollPrev(): boolean
  canScrollNext(): boolean
  scrollPrev(): void
  scrollNext(): void
  slideNodes(): HTMLElement[]
  on(event: string, cb: () => void): void
}

// ── board-tables.js 이식: 게시판 전용 테이블 → 화면 게시글 모양 ──
function list(value: unknown) {
  return String(value == null ? '' : value).split('|').map(v => v.trim()).filter(Boolean)
}
function num(value: unknown) {
  const n = Number(String(value == null ? '' : value).replace(/,/g, ''))
  return isFinite(n) ? n : 0
}
function relative(iso: unknown) {
  const time = Date.parse(String(iso || ''))
  if (!time) return ''
  const diff = Math.max(0, Date.now() - time) / 60000
  if (diff < 1) return '방금 전'
  if (diff < 60) return Math.floor(diff) + '분 전'
  if (diff < 1440) return Math.floor(diff / 60) + '시간 전'
  if (diff < 10080) return Math.floor(diff / 1440) + '일 전'
  const d = new Date(time)
  return String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0')
}
const s = (v: unknown) => String(v || '').trim()
function toPost(row: Record<string, unknown>, table: ListBoardTable): ListPost {
  const category = s(row.category) || table.displayName
  const images = list(row.images)
  const thumb = s(row.thumbnail) || images[0] || ''
  const body = String(row.body || row.summary || '').split(/\n+/).map(v => v.trim()).filter(Boolean)
  const published = Date.parse(String(row.publishedAt || ''))
  const embedApi = legacy.embed()
  const embeds = list(row.embed).map(url => (embedApi ? embedApi.info(url) : { url, render: 'preview' })).filter(Boolean) as ListEmbed[]
  if (embeds.length && row.embedTitle) {
    embeds[0] = Object.assign({}, embeds[0], {
      title: s(row.embedTitle), description: s(row.embedDescription), image: s(row.embedImage), logo: s(row.embedLogo),
      site: String(row.embedSite || row.source || '').trim(), provider: s(row.embedProvider), lang: String(row.embedLang || row.originalLanguage || '').trim(),
      metaReady: true,
    })
  }
  const lower = (v: unknown) => String(v || '').toLowerCase() === 'true'
  return {
    id: num(row.id), board: table.board, boardTable: true, title: '[' + category + '] ' + s(row.title),
    user: String(row.author || row.source || table.displayName).trim(), category, time: relative(row.publishedAt),
    view: num(row.views), reply: num(row.comments), likes: num(row.likes), fresh: published ? Date.now() - published < 86400000 : false,
    thumb, thumbnail: thumb, detailImage: images[0] || thumb, images, photos: images.length || (thumb ? 1 : 0), video: false, rank: 0,
    body: body.length ? body : [s(row.summary)].filter(Boolean), summary: s(row.summary), summary3: list(row.summary3).slice(0, 3),
    source: s(row.source), sourceUrl: s(row.sourceUrl), publishedAt: String(row.publishedAt || ''), country: s(row.country), region: s(row.region),
    originalTitle: s(row.originalTitle), originalLanguage: s(row.originalLanguage), relatedCount: num(row.relatedCount), collectedAt: row.collectedAt || '',
    collector: s(row.collector), tags: list(row.tags), reviewId: String(row.reviewId || row.id || '').trim(), modelId: s(row.modelId), brand: s(row.brand),
    manufacturer: s(row.manufacturer), foundedYear: s(row.foundedYear), headquarters: s(row.headquarters), officialUrl: s(row.officialUrl),
    brandType: s(row.brandType), currentStatus: s(row.currentStatus), aliases: list(row.aliases), logo: s(row.logo), model: s(row.model), trim: s(row.trim),
    powertrain: s(row.powertrain), rating: num(row.rating), owner: lower(row.owner), ownershipLabel: s(row.ownershipLabel), benchmark: s(row.benchmark),
    location: s(row.location), ratings: list(row.ratings), brandLogo: String(row.brandLogo || row.logo || '').trim(), energyId: String(row.energyId || row.id || '').trim(),
    city: s(row.city), odometer: s(row.odometer), fuelConsumption: s(row.fuelConsumption), energyConsumption: s(row.energyConsumption),
    fullChargeRange: s(row.fullChargeRange), verified: lower(row.verified),
    poll: s(row.pollTitle) && list(row.pollOptions).length > 1 ? { title: s(row.pollTitle), options: list(row.pollOptions), note: s(row.pollNote) } : null,
    embeds,
  }
}
export function postsForTable(boardId: string): ListPost[] | null {
  const table = legacy.tables()[boardId]
  if (!table) return null
  return (table.rows || []).filter(row => row && row.title).map(row => toPost(row, table))
    .sort((a, b) => (Date.parse(String(b.publishedAt)) || 0) - (Date.parse(String(a.publishedAt)) || 0))
}
export function boardIdForLabel(label: string): string {
  let found = ''
  const tables = legacy.tables()
  Object.keys(tables).forEach((id) => { if (tables[id]!.displayName === label) found = id })
  return found
}
