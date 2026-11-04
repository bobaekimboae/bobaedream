// naver-cafe-list.html 안의 큰 <script>(목록 화면 제어)를 Vue 상태로 옮긴 것.
// 정적 판은 보기 방식마다 .phone 의 class 를 더하고 빼며 그려서, 같은 보기라도 거쳐 온 순서에 따라 class 가 남는다.
// 화면이 똑같아야 하므로 class 집합(phoneClasses)과 #list 의 class(listClass)를 정적 판과 같은 순서로 더하고 뺀다.
import type { InjectionKey } from 'vue'
import { boardIdForLabel, legacy, postsForTable, type ListPost } from './listData'
import { createInlinePosts, defaultTopics, loadLocalPost } from './listInlinePosts'
import { boardDescription, boardStats } from './listBoardCopy'
import { postAgeMinutes, popularPeriodLimits, categoryFor } from './listFormat'

export const preservedModes = [
  'text-only', 'compact', 'list', 'detail-list', 'album', 'naver-discussion', 'naver-discussion-thumb', 'naver-discussion-thumb-right',
  'naver-cafe-popular', 'naver-cafe-popular-left', 'lounge-best-rank', 'lounge-best-clean', 'lounge-best-left', 'naver-ranking-news',
  'reddit-feed', 'feed-chotot', 'feed-chotot-dealer', 'feed-cafe', 'feed-cafe-left',
]
export const specialBoards = ['vehicle-review', 'tuhu-review', 'fuel-economy', 'autohome-complaint', 'chezhiwang-complaint']
export function isBestView(value: string) {
  return value === 'lounge-best-rank' || value === 'lounge-best-clean' || value === 'lounge-best-left' || value === 'naver-ranking-news'
}
const bestViewStorageKey = 'bbm.community.bestView.v1'
function loadBestView() {
  try { const v = localStorage.getItem(bestViewStorageKey) || ''; return isBestView(v) ? v : '' } catch { return '' }
}
export function saveBestView(value: string) {
  if (!isBestView(value)) return
  try { localStorage.setItem(bestViewStorageKey, value) } catch { /* 무시 */ }
}

export interface ListDisplay {
  thumbnail: boolean; commentBadge: boolean; recommendCount: boolean; categoryLabel: boolean; tag: boolean; highlight: boolean; rankBadge: boolean
  profileAvatar?: boolean; timeIcon?: boolean; viewIcon?: boolean; recommendIcon?: boolean; commentIcon?: boolean
}
export type ListRender =
  | { kind: 'items' }
  | { kind: 'discussion'; variant: '' | 'thumb' | 'thumb-right' }
  | { kind: 'lounge'; view: string }
  | { kind: 'ranking' }
  | { kind: 'cafe-popular'; left: boolean }
  | { kind: 'reddit' }
  | { kind: 'chotot'; dealer: boolean }
  | { kind: 'cafe-feed' }
  | { kind: 'cafe-left' }
  | { kind: 'special'; board: string }
export type SheetKind = '' | 'view' | 'type' | 'postOptions' | 'popularPeriod' | 'board'

export function createListPage(query: Record<string, string | undefined>) {
  const header = query.header
  const viewParam = query.view || ''
  const phoneClasses = reactive(new Set<string>())
  const add = (...c: string[]) => c.forEach(x => phoneClasses.add(x))
  const remove = (...c: string[]) => c.forEach(x => phoneClasses.delete(x))
  const toggle = (c: string, on: boolean) => (on ? phoneClasses.add(c) : phoneClasses.delete(c))
  if (query.tabline === 'baidu') add('tablineBaidu')
  if (header !== 'legacy') add('communityTitleHeader')
  if (header !== 'legacy' && header !== 'community') add('communityProfileHeader')

  const topics = ref<string[]>(defaultTopics.slice())
  const active = ref(0)
  const headwordsExpanded = ref(false)
  const boardDescriptionExpanded = ref(false)
  const inlinePosts = createInlinePosts()
  const localPost = loadLocalPost()
  if (localPost) inlinePosts.unshift(localPost)
  const posts = shallowRef<ListPost[]>(inlinePosts)
  const bobaePosts = shallowRef<ListPost[]>([])
  const redditPosts = shallowRef<ListPost[]>([])
  const mode = ref(preservedModes.includes(viewParam) ? viewParam : 'naver-discussion')
  const sortOrder = ref('latest')
  const popularPeriod = ref('all')
  const postFilterApplied = ref(false)
  const postOptionsDefaultMode = ref(mode.value)
  const thumbPosition = ref(mode.value === 'list' ? 'right' : 'left')
  const titleLines = ref(2)
  const rankPosition = ref('before')
  const boardLabel = ref('전체 게시글')
  const boardNameOverride = ref('') // 초톳 딜러형이 게시판 이름을 「중고차딜러」로 바꾼다
  const nameTick = ref(0) // 정적 판 MutationObserver(게시판 이름이 바뀔 때마다 배너 · 소개 다시 맞춤) 대신
  const queryBoard = ref(query.board || '') // 주소의 board 값(정적 판 location.search)
  const avatarBoard = shallowRef<{ avatarLabel?: string; avatarColor?: string; avatarAccent?: string; shortName?: string; displayName?: string } | null>(null)
  const communitySection = ref('home')
  const display = reactive<ListDisplay>({ thumbnail: mode.value !== 'text-only', commentBadge: false, recommendCount: false, categoryLabel: true, tag: false, highlight: false, rankBadge: false })
  const activeBoardTable = ref('')
  let modeBeforeBoardTable: string | null = null
  let explicitView = 'view' in query
  let defaultBobae: ListPost[] | null = null
  const typeLabel = ref('목록형')
  const listClass = ref('list')
  const render = shallowRef<ListRender>({ kind: 'items' })
  const renderSeq = ref(0) // 같은 보기로 다시 그릴 때도 하위 화면이 다시 계산하게
  const categoryOwner = ref<'inline' | 'discussion'>('inline') // #category 를 마지막으로 그린 쪽
  const discussionHeadword = ref('전체')
  const sheet = ref<SheetKind>('')
  const toastText = ref('')
  const toastShow = ref(false)
  let toastTimer: ReturnType<typeof setTimeout> | undefined
  let feedsAvailable = false // 정적 판에서 피드 스크립트가 아직 안 불린 첫 그리기 단계
  const cafePopularMetric = ref('all')
  const rankingMetric = ref(['comment', 'recommend'].includes(query.ranking || '') ? query.ranking! : 'popular')

  const boardName = computed(() => boardNameOverride.value || boardLabel.value)
  const description = computed(() => boardDescription(boardName.value))
  const stats = computed(() => boardStats(boardName.value))

  function toast(text: string) {
    toastText.value = text
    toastShow.value = true
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toastShow.value = false }, 1000)
  }

  function filtered(): ListPost[] {
    const t = topics.value[active.value]
    let result = (t === '전체' ? posts.value : posts.value.filter(p => p.category === t || p.title.indexOf('[' + t + ']') > -1)).slice()
    if (sortOrder.value === 'latest-comment') result.sort((a, b) => Number(b.reply || 0) - Number(a.reply || 0))
    if (sortOrder.value === 'popular') {
      const limit = popularPeriodLimits[popularPeriod.value] || Infinity
      result = result.filter(p => postAgeMinutes(p.time) <= limit)
      result.sort((a, b) => Number(b.view || 0) + Number(b.reply || 0) * 20 - (Number(a.view || 0) + Number(a.reply || 0) * 20))
    }
    return result
  }
  /** 네이버 토론형 · 라운지 · 랭킹 피드의 글(naver-discussion-feed.js posts()) */
  function discussionPosts(): ListPost[] {
    let data = bobaePosts.value.slice()
    const table = activeBoardTable.value ? legacy.tables()[activeBoardTable.value] : null
    const matches = !table || Boolean(localPost && localPost.board && localPost.board === table.displayName)
    const already = localPost && data.some(p => String(p.id) === String(localPost.id))
    if (localPost && activeBoardTable.value !== 'best' && matches && !already) data.unshift(localPost)
    if (sortOrder.value === 'latest-comment') data.sort((a, b) => Number(b.reply || 0) - Number(a.reply || 0))
    if (sortOrder.value === 'popular') {
      const limit = popularPeriodLimits[popularPeriod.value] || Infinity
      data = data.filter(p => postAgeMinutes(p.time) <= limit)
      data.sort((a, b) => Number(b.view || 0) + Number(b.reply || 0) * 20 - (Number(a.view || 0) + Number(a.reply || 0) * 20))
    }
    const h = discussionHeadword.value
    return h === '전체' ? data : data.filter(p => categoryFor(p) === h)
  }
  function syncDiscussionHeadwords() {
    if (!topics.value.includes(discussionHeadword.value)) discussionHeadword.value = '전체'
    categoryOwner.value = 'discussion'
  }

  function applyBoardTable(label: string) {
    const tables = legacy.tables()
    if (defaultBobae === null) defaultBobae = legacy.scenarioPosts()
    const id = boardIdForLabel(label)
    const prev = activeBoardTable.value
    activeBoardTable.value = id
    const table = id ? tables[id] : undefined
    topics.value = table && Array.isArray(table.topics) && table.topics.length ? table.topics.slice() : defaultTopics.slice()
    active.value = 0
    let tableView = table && table.defaultView
    if (id === 'best' && !explicitView) tableView = loadBestView() || tableView
    if (id && id !== prev && tableView && !explicitView) {
      modeBeforeBoardTable = mode.value
      mode.value = tableView
    } else if (!id && prev && modeBeforeBoardTable !== null) {
      if (mode.value === (tables[prev] || {}).defaultView || isBestView(mode.value)) mode.value = modeBeforeBoardTable
      modeBeforeBoardTable = null
    }
    if (id === 'best' && explicitView && isBestView(mode.value)) saveBestView(mode.value)
    explicitView = false
    if (id) {
      let rows = postsForTable(id) || []
      if (id !== 'best' && localPost && localPost.board && localPost.board === tables[id]!.displayName) rows = [localPost, ...rows]
      posts.value = rows
      bobaePosts.value = rows.slice()
    } else {
      posts.value = inlinePosts
      bobaePosts.value = defaultBobae || []
    }
  }

  function renderTabs() {
    categoryOwner.value = 'inline'
  }
  function itemsRender() {
    if (mode.value === 'text-only') { display.thumbnail = false; display.commentBadge = false }
    typeLabel.value = typeLabelFor()
    const textOnly = mode.value === 'text-only'
    const compact = mode.value === 'compact' || textOnly
    remove('naverDiscussionMode', 'feedCafeMode', 'cafeLeftMode', 'naverCafePopularMode', 'naverCafePopularLeftMode', 'chototFeedMode', 'chototBoardFeedMode', 'chototDealerFeedMode', 'vehicleReviewBoardMode', 'loungeBestMode', 'loungeBestCleanMode', 'loungeBestLeftMode', 'naverRankingMode')
    listClass.value = 'list'
    toggle('compactMode', compact)
    toggle('textOnlyMode', textOnly)
    render.value = { kind: 'items' }
  }
  function typeLabelFor() {
    const m = mode.value
    const labels: Record<string, string> = {
      'text-only': '텍스트만', compact: '간결형', 'naver-discussion': '네이버 토론형', 'naver-discussion-thumb': '네이버 토론 · 좌측 썸네일',
      'naver-discussion-thumb-right': '네이버 토론 · 우측 썸네일', 'naver-cafe-popular': '네이버 카페 인기글형', 'naver-cafe-popular-left': '네이버 카페 인기글 · 좌측 썸네일',
      'lounge-best-rank': '라운지 인기글형', 'lounge-best-clean': '라운지 간결형', 'lounge-best-left': '라운지 썸네일 좌측형', 'naver-ranking-news': '네이버 랭킹뉴스형',
      'feed-cafe': '피드 네이버 카페', 'feed-cafe-left': '네이버 카페 · 좌측 썸네일', 'feed-chotot': '초톳 피드형 · 게시판형', 'feed-chotot-dealer': '초톳 피드형 · 딜러형',
    }
    if (labels[m]) return labels[m]!
    if (!display.thumbnail) return '텍스트형'
    return display.commentBadge ? '목록형' : '댓글 없음'
  }
  // naver-discussion-feed.js render(variant)
  function discussionRender(variant?: string) {
    if (activeBoardTable.value === 'vehicle-review') { render.value = { kind: 'special', board: 'vehicle-review' }; return }
    if (activeBoardTable.value === 'best') {
      const bestView = mode.value || variant || ''
      if (bestView === 'naver-ranking-news') rankingRender()
      else loungeRender(bestView)
      return
    }
    const thumbRight = variant === 'thumb-right'
    const thumb = variant === 'thumb' || thumbRight
    syncDiscussionHeadwords()
    remove('compactMode', 'feedCafeMode', 'cafeLeftMode', 'naverCafePopularMode', 'redditFeedMode', 'chototFeedMode', 'chototBoardFeedMode', 'chototDealerFeedMode', 'loungeBestMode', 'loungeBestCleanMode', 'loungeBestLeftMode', 'naverRankingMode')
    add('naverDiscussionMode')
    toggle('naverDiscussionThumbMode', thumb)
    typeLabel.value = thumb ? (thumbRight ? '네이버 토론 · 우측 썸네일' : '네이버 토론 · 좌측 썸네일') : '네이버 토론형'
    listClass.value = 'list naverDiscussionList' + (thumb ? ' is-thumb' : '') + (thumbRight ? ' is-thumb-right' : '')
    render.value = { kind: 'discussion', variant: thumbRight ? 'thumb-right' : thumb ? 'thumb' : '' }
  }
  function loungeRender(viewMode: string) {
    const clean = viewMode === 'lounge-best-clean' || viewMode === 'lounge-best-left'
    const left = viewMode === 'lounge-best-left'
    syncDiscussionHeadwords()
    remove('compactMode', 'feedCafeMode', 'cafeLeftMode', 'naverCafePopularMode', 'redditFeedMode', 'chototFeedMode', 'chototBoardFeedMode', 'chototDealerFeedMode', 'naverDiscussionThumbMode')
    add('naverDiscussionMode', 'loungeBestMode')
    toggle('loungeBestCleanMode', clean)
    toggle('loungeBestLeftMode', left)
    typeLabel.value = left ? '라운지 썸네일 좌측형' : clean ? '라운지 간결형' : '라운지 인기글형'
    listClass.value = 'list loungeBestList'
    render.value = { kind: 'lounge', view: viewMode }
  }
  function rankingRender() {
    syncDiscussionHeadwords()
    remove('compactMode', 'feedCafeMode', 'cafeLeftMode', 'naverCafePopularMode', 'redditFeedMode', 'chototFeedMode', 'chototBoardFeedMode', 'chototDealerFeedMode', 'naverDiscussionThumbMode', 'loungeBestMode', 'loungeBestCleanMode', 'loungeBestLeftMode')
    add('naverDiscussionMode', 'naverRankingMode')
    typeLabel.value = '네이버 랭킹뉴스형'
    listClass.value = 'list naverRankingList'
    render.value = { kind: 'ranking' }
  }
  function cafePopularRender(left: boolean) {
    remove('compactMode', 'feedCafeMode', 'cafeLeftMode', 'naverDiscussionMode', 'naverDiscussionThumbMode', 'redditFeedMode', 'chototFeedMode', 'chototBoardFeedMode', 'chototDealerFeedMode', 'vehicleReviewBoardMode', 'loungeBestMode', 'loungeBestCleanMode', 'loungeBestLeftMode', 'naverRankingMode', 'naverCafePopularLeftMode')
    add('naverCafePopularMode')
    if (left) add('naverCafePopularLeftMode')
    typeLabel.value = left ? '네이버 카페 인기글 · 좌측 썸네일' : '네이버 카페 인기글형'
    listClass.value = 'list naverCafePopularList'
    render.value = { kind: 'cafe-popular', left }
  }
  function redditRender() {
    remove('compactMode', 'feedCafeMode', 'naverCafePopularMode', 'chototFeedMode', 'chototBoardFeedMode', 'chototDealerFeedMode')
    add('redditFeedMode')
    typeLabel.value = '피드형'
    listClass.value = 'list redditFeedList'
    render.value = { kind: 'reddit' }
  }
  function chototRender(dealer: boolean) {
    if (dealer || boardNameOverride.value) nameTick.value++
    if (dealer) {
      boardNameOverride.value = '중고차딜러'
      remove('compactMode', 'feedCafeMode', 'naverCafePopularMode', 'redditFeedMode', 'chototBoardFeedMode')
      add('chototFeedMode', 'chototDealerFeedMode')
      typeLabel.value = '초톳 피드형 · 딜러형'
      listClass.value = 'list chototFeedList chototDealerFeedList'
    } else {
      boardNameOverride.value = ''
      remove('compactMode', 'feedCafeMode', 'naverCafePopularMode', 'redditFeedMode', 'chototDealerFeedMode')
      add('chototFeedMode', 'chototBoardFeedMode')
      typeLabel.value = '초톳 피드형 · 게시판형'
      listClass.value = 'list chototFeedList'
    }
    render.value = { kind: 'chotot', dealer }
  }
  function cafeFeedRender() {
    remove('compactMode', 'cafeLeftMode', 'naverCafePopularMode', 'chototFeedMode', 'chototBoardFeedMode', 'chototDealerFeedMode')
    add('feedCafeMode')
    typeLabel.value = '피드 네이버 카페'
    listClass.value = 'list cafeFeedList'
    render.value = { kind: 'cafe-feed' }
  }
  function cafeLeftRender() {
    remove('compactMode', 'feedCafeMode', 'naverCafePopularMode', 'naverDiscussionMode', 'naverDiscussionThumbMode', 'redditFeedMode', 'chototFeedMode', 'chototBoardFeedMode', 'chototDealerFeedMode', 'vehicleReviewBoardMode', 'loungeBestMode', 'loungeBestCleanMode', 'loungeBestLeftMode', 'naverRankingMode')
    add('cafeLeftMode')
    typeLabel.value = '네이버 카페 · 좌측 썸네일'
    listClass.value = 'list cafeLeftList'
    render.value = { kind: 'cafe-left' }
  }

  /** 정적 판 renderList(최종 덮어쓰기 판) */
  function renderList() {
    renderSeq.value++
    const table = activeBoardTable.value
    if (table !== 'autohome-complaint' && table !== 'chezhiwang-complaint') {
      remove('autohomeComplaintMode', 'autohomeComplaintWriter', 'autohomeComplaintDetail', 'chezhiwangComplaintMode', 'chezhiwangComplaintDetail', 'chezhiwangComplaintWriter')
      add('headerYouTube')
      toggle('textOnlyMode', mode.value === 'text-only')
      toggle('compactMode', mode.value === 'compact' || mode.value === 'text-only')
      if (header !== 'legacy') add('communityTitleHeader')
      if (header !== 'legacy' && header !== 'community') add('communityProfileHeader')
      if (/\b(ahc|czw)\b/.test(listClass.value)) listClass.value = 'list'
    }
    const m = mode.value
    if (table === 'best' && isBestView(m) && feedsAvailable) return discussionRender(m)
    if (specialBoards.includes(table)) { render.value = { kind: 'special', board: table }; return }
    if (feedsAvailable && m === 'naver-discussion') return discussionRender()
    if (feedsAvailable && m === 'naver-discussion-thumb') return discussionRender('thumb')
    if (feedsAvailable && m === 'naver-discussion-thumb-right') return discussionRender('thumb-right')
    if (m === 'naver-cafe-popular') return cafePopularRender(false)
    if (m === 'naver-cafe-popular-left') return cafePopularRender(true)
    if (feedsAvailable && m === 'reddit-feed') return redditRender()
    if (feedsAvailable && m === 'feed-chotot') return chototRender(false)
    if (feedsAvailable && m === 'feed-chotot-dealer') return chototRender(true)
    if (m === 'feed-cafe') return cafeFeedRender()
    if (m === 'feed-cafe-left') return cafeLeftRender()
    itemsRender()
  }

  /** 게시글 옵션 시트 열기: 네이버 토론형이면 지금 말머리를 먼저 맞춘다 */
  function openPostOptions() {
    if (mode.value.indexOf('naver-discussion') === 0) {
      const i = topics.value.indexOf(discussionHeadword.value)
      if (i >= 0) active.value = i
    }
    sheet.value = 'postOptions'
  }
  function setBoardDescriptionExpanded(v: boolean) { boardDescriptionExpanded.value = !!v }
  function setHeadwordsExpanded(v: boolean) { headwordsExpanded.value = !!v }

  let onBoardSelected: ((label: string) => void) | null = null
  function selectBoard(label: string, topic: string, options: { fromNavigation?: boolean; silent?: boolean } = {}) {
    applyBoardTable(label)
    boardLabel.value = label
    boardNameOverride.value = ''
    nameTick.value++
    active.value = Math.max(0, topics.value.indexOf(topic))
    setBoardDescriptionExpanded(false)
    setHeadwordsExpanded(false)
    renderTabs()
    renderList()
    if (!options.fromNavigation && onBoardSelected) onBoardSelected(label)
    if (!options.silent) toast(boardLabel.value + ' 선택')
  }

  function commitPostOptions() {
    postFilterApplied.value = sortOrder.value !== 'latest' || active.value !== 0 || mode.value !== postOptionsDefaultMode.value
    applyModeDisplay(mode.value)
    renderTabs()
    renderList()
    // 정적 판 BBM_SET_DISCUSSION_HEADWORD: 말머리를 맞춘 뒤 render()를 보기 구분 없이 다시 부른다(좌·우 썸네일형도 기본 카드로 바뀜)
    if (mode.value.indexOf('naver-discussion') === 0) setDiscussionHeadword(topics.value[active.value] || '전체')
  }
  function setDiscussionHeadword(value: string) {
    discussionHeadword.value = topics.value.includes(value) ? value : '전체'
    discussionRender()
  }
  function applyModeDisplay(value: string) {
    if (value === 'text-only') { display.thumbnail = false; display.commentBadge = false } else if (value === 'compact') { display.thumbnail = true; display.commentBadge = false } else if (value === 'list') { display.thumbnail = true; display.commentBadge = true; thumbPosition.value = 'right' } else { display.thumbnail = true; display.commentBadge = false }
  }

  /** 첫 화면: 정적 판의 스크립트 실행 순서를 그대로 따라간다 */
  function boot(initialBoard: { displayName: string; topicKey: string }) {
    feedsAvailable = false
    // ① 인라인 스크립트의 첫 그리기(renderTabs + renderList)
    renderTabs()
    renderList()
    // ② 게시판 탑메뉴 초기화 → 선택한 게시판
    selectBoard(initialBoard.displayName, initialBoard.topicKey, { fromNavigation: true, silent: true })
    renderList()
    // ③ scenario-data 뒤 BBM_APPLY_BOARD_TABLE
    applyBoardTable(boardLabel.value)
    if (activeBoardTable.value) renderList()
    redditPosts.value = bobaePosts.value.slice(0, 5) // reddit-feed.js 는 불릴 때의 글 5개를 계속 쓴다
    feedsAvailable = true
    // ④ reddit-feed.js 자동 시작
    if (viewParam === 'reddit' || viewParam === 'feed') redditRender()
    // ⑤ naver-discussion-feed.js 자동 시작
    if (activeBoardTable.value !== 'vehicle-review') {
      const start = mode.value || viewParam
      if (start === 'naver-discussion') discussionRender()
      else if (start === 'naver-discussion-thumb') discussionRender('thumb')
      else if (start === 'naver-discussion-thumb-right') discussionRender('thumb-right')
      else if (isBestView(start)) discussionRender(start)
    }
    // ⑥ chotot-feed.js 자동 시작
    if (viewParam === 'chotot' || viewParam === 'chotot-board' || viewParam === 'feed-chotot') chototRender(false)
    else if (viewParam === 'chotot-dealer' || viewParam === 'feed-chotot-dealer') chototRender(true)
  }

  return {
    phoneClasses, add, remove, toggle, topics, active, headwordsExpanded, boardDescriptionExpanded, posts, bobaePosts, mode, sortOrder, popularPeriod,
    postFilterApplied, postOptionsDefaultMode, thumbPosition, titleLines, rankPosition, boardLabel, boardName, boardNameOverride, display,
    activeBoardTable, typeLabel, listClass, render, renderSeq, categoryOwner, discussionHeadword, sheet, toastText, toastShow, cafePopularMetric,
    rankingMetric, description, stats, localPost, inlinePosts, redditPosts, nameTick, queryBoard, avatarBoard, communitySection,
    toast, filtered, discussionPosts, renderTabs, renderList, discussionRender, selectBoard, commitPostOptions, applyModeDisplay, setDiscussionHeadword,
    setBoardDescriptionExpanded, setHeadwordsExpanded, boot, typeLabelFor, openPostOptions,
    setOnBoardSelected(fn: (label: string) => void) { onBoardSelected = fn },
  }
}
export type ListPage = ReturnType<typeof createListPage>
export const listPageKey: InjectionKey<ListPage> = Symbol('listPage')
export function useListPageCtx(): ListPage {
  const page = inject(listPageKey)
  if (!page) throw new Error('목록 화면 상태가 없습니다')
  return page
}
