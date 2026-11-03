<script setup lang="ts">
import type { CommunityPopularPeriod, CommunitySort, CommunityView } from '~/types/community'

const { sections, boards, sort, popularPeriod, view, boardId, headword, activeBoard, filteredPosts } = useCommunity()
const optionsOpen = ref(false)
const boardMenuOpen = ref(false)
const boardShortcutOpen = ref(false)
const recentExpanded = ref(false)
const following = ref(false)
const route = useRoute()
const router = useRouter()
const baseURL = useRuntimeConfig().app.baseURL
const iconRoot = `${baseURL}icons`
const communityAssetRoot = `${baseURL}community/media`
const favoriteBoardIds = ref<string[]>([])
const recentBoardIds = ref<string[]>([])
const favoriteStorageKey = 'bbm.community.nuxt.favoriteBoards.v1'
const recentStorageKey = 'bbm.community.nuxt.recentBoards.v1'

function loadBoardIds(key: string, limit: number) {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '[]')
    if (!Array.isArray(stored)) return []
    return stored.filter((id: unknown, index: number) => typeof id === 'string' && boards.value.some(board => board.id === id) && stored.indexOf(id) === index).slice(0, limit)
  } catch { return [] }
}
function saveBoardIds(key: string, ids: string[], limit: number) {
  const normalized = ids.filter((id, index) => boards.value.some(board => board.id === id) && ids.indexOf(id) === index).slice(0, limit)
  localStorage.setItem(key, JSON.stringify(normalized))
  return normalized
}
function recordRecentBoard(id: string) {
  recentBoardIds.value = saveBoardIds(recentStorageKey, [id, ...recentBoardIds.value.filter(boardId => boardId !== id)], 6)
}
function toggleFavorite(id: string) {
  const exists = favoriteBoardIds.value.includes(id)
  favoriteBoardIds.value = saveBoardIds(favoriteStorageKey, exists ? favoriteBoardIds.value.filter(boardId => boardId !== id) : [id, ...favoriteBoardIds.value], boards.value.length)
}
const favoriteBoards = computed(() => favoriteBoardIds.value.map(id => boards.value.find(board => board.id === id)).filter(Boolean))
const recentBoards = computed(() => recentBoardIds.value.map(id => boards.value.find(board => board.id === id)).filter(Boolean))
const visibleRecentBoards = computed(() => recentExpanded.value ? recentBoards.value : recentBoards.value.slice(0, 3))
const quickBoardIds = ['home', 'all', 'best', 'free', 'car-news', 'foreign-news', 'brand-info', 'vehicle-review', 'domestic', 'imported', 'bike']
const quickBoards = computed(() => quickBoardIds.map(id => boards.value.find(board => board.id === id)).filter(Boolean))
const activeBanner = computed(() => activeBoard.value.banner ? `${baseURL}${activeBoard.value.banner}` : `${baseURL}images/community/board-header-genesis-yeosu.webp`)
const activeTagline = computed(() => activeBoard.value.tagline || `${activeBoard.value.name}의 새로운 이야기를 만나보세요`)

function publicAsset(path?: string) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return `${baseURL}${path.replace(/^\//, '')}`
}

// 게시판 좌우 넘기기(2026-11-03 정적 판 setupBoardSwipe를 옮김, 후푸 폰 직접 대조 + 바이두 ViewPager 규칙).
// 탑메뉴 아래 본문을 왼쪽으로 밀면 탑메뉴의 다음 게시판, 오른쪽이면 이전 게시판. 끄는 동안 지금 화면 복사본과
// 옆 게시판이 8px 틈을 두고 손가락을 따라오고, 놓을 때 초당 400px 이상·25px 이상 휙 밀었거나 절반을 넘겼으면 넘어간다.
const stage = ref<HTMLElement | null>(null)
const navPreviewId = ref<string | null>(null)
const swipePreviewing = ref(false)
const navTrack = ref<HTMLElement | null>(null)
let teardownSwipe: (() => void) | undefined

function scrollActiveTab() {
  requestAnimationFrame(() => navTrack.value?.querySelector<HTMLElement>('.is-active')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }))
}

function setupBoardSwipe() {
  const found = stage.value
  if (!found || !('ontouchstart' in window || navigator.maxTouchPoints > 0)) return
  const el: HTMLElement = found
  const EASE = 'cubic-bezier(.22,1,.36,1)'
  const GAP = 8
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let start: { x: number, y: number } | null = null
  let locked: 'x' | 'y' | null = null
  let moving = false
  let busy = false
  let samples: { x: number, t: number }[] = []
  let origId = ''
  let origHeadword = ''
  let target: string | null = null
  let ghost: HTMLElement | null = null
  let savedY = 0
  let frame = 0
  let pending: { x: number } | null = null
  let touchTarget: EventTarget | null = null
  const ids = () => quickBoards.value.map(board => board!.id)
  const width = () => el.parentElement?.clientWidth || window.innerWidth

  function blocked(node: HTMLElement) {
    if (busy || optionsOpen.value || boardMenuOpen.value || boardShortcutOpen.value) return true
    if (node.closest('input, textarea, [contenteditable="true"]')) return true
    for (let n: HTMLElement | null = node; n && n !== el; n = n.parentElement) {
      if (n.scrollWidth > n.clientWidth + 2) {
        const overflowX = getComputedStyle(n).overflowX
        if (overflowX === 'auto' || overflowX === 'scroll') return true
      }
    }
    return false
  }
  function velocity() {
    const now = performance.now()
    samples = samples.filter(point => now - point.t <= 100)
    if (samples.length < 2) return 0
    const a = samples[0]!
    const b = samples.at(-1)!
    return (b.x - a.x) / Math.max(1, b.t - a.t) * 1000
  }
  function moveTo(node: HTMLElement | null, x: number, ms: number) {
    if (!node) return
    node.style.transition = ms ? `transform ${ms}ms ${EASE}` : 'none'
    node.style.transform = x ? `translate3d(${x}px,0,0)` : ''
  }
  function snapshot() {
    const shell = el.parentElement!
    if (getComputedStyle(shell).position === 'static') shell.style.position = 'relative'
    const copy = el.cloneNode(true) as HTMLElement
    copy.className = 'board-swipe-ghost'
    copy.setAttribute('aria-hidden', 'true')
    copy.removeAttribute('style')
    copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'))
    copy.style.top = `${el.offsetTop}px`
    shell.appendChild(copy)
    return copy
  }
  function render(id: string, headwordValue = '') {
    boardId.value = id
    headword.value = headwordValue
    nextTick(() => window.scrollTo(0, savedY))
  }
  function showTarget(id: string | null) {
    if (id === target) return
    target = id
    if (id) {
      if (!ghost) ghost = snapshot()
      render(id)
    } else {
      render(origId, origHeadword)
      ghost?.remove()
      ghost = null
    }
  }
  function applyMove() {
    frame = 0
    if (!start || locked !== 'x' || !pending) return
    const dx = pending.x - start.x
    if (!moving) {
      moving = true
      origId = boardId.value
      origHeadword = headword.value
      target = null
      ghost = null
      savedY = window.scrollY
      swipePreviewing.value = true
      el.style.willChange = 'transform'
    }
    const list = ids()
    const index = list.indexOf(origId)
    const dir = dx < 0 ? 1 : -1
    const id = dx === 0 || index < 0 ? null : list[index + dir] || null
    showTarget(id)
    if (id) {
      moveTo(el, dir * (width() + GAP) + dx, 0)
      moveTo(ghost, dx, 0)
    } else {
      moveTo(el, 0, 0)
    }
    navPreviewId.value = id && Math.abs(dx) > width() / 2 ? id : origId
  }
  function detach() {
    if (!touchTarget) return
    touchTarget.removeEventListener('touchmove', onMove as EventListener)
    touchTarget.removeEventListener('touchend', onEnd as EventListener)
    touchTarget.removeEventListener('touchcancel', onCancel as EventListener)
    touchTarget = null
  }
  function onStart(event: TouchEvent) {
    if (event.touches.length !== 1) { start = null; return }
    const touch = event.touches[0]!
    if (touch.clientX < 20 || touch.clientX > window.innerWidth - 20 || blocked(event.target as HTMLElement)) { start = null; return }
    start = { x: touch.clientX, y: touch.clientY }
    locked = null
    moving = false
    pending = null
    samples = [{ x: touch.clientX, t: performance.now() }]
    // 옆 게시판을 그리면 손가락이 닿은 요소가 문서에서 빠져 이벤트가 window까지 오지 않으므로 그 요소에도 직접 붙인다.
    detach()
    touchTarget = event.target
    touchTarget?.addEventListener('touchmove', onMove as EventListener, { passive: false })
    touchTarget?.addEventListener('touchend', onEnd as EventListener, { passive: true })
    touchTarget?.addEventListener('touchcancel', onCancel as EventListener, { passive: true })
  }
  const handled = new WeakSet<Event>()
  function onMove(event: TouchEvent) {
    if (!start || handled.has(event)) return
    handled.add(event)
    const touch = event.touches[0]!
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    const now = performance.now()
    samples.push({ x: touch.clientX, t: now })
    if (samples.length > 8) samples.shift()
    if (locked === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (locked === 'x') start.x = touch.clientX - (dx > 0 ? 8 : -8)
    }
    if (locked !== 'x') return
    event.preventDefault()
    pending = { x: touch.clientX }
    if (!frame) frame = requestAnimationFrame(applyMove)
  }
  function finish(ms: number, done?: () => void) {
    setTimeout(() => {
      ghost?.remove()
      ghost = null
      moveTo(el, 0, 0)
      el.style.transition = ''
      el.style.willChange = ''
      busy = false
      done?.()
    }, ms + 40)
  }
  function onEnd(event: TouchEvent) {
    if (!start || handled.has(event)) return
    handled.add(event)
    detach()
    if (frame) { cancelAnimationFrame(frame); frame = 0; applyMove() }
    const began = start
    start = null
    pending = null
    if (!moving) return
    moving = false
    const touch = event.changedTouches[0]
    const dx = (touch ? touch.clientX : began.x) - began.x
    const v = velocity()
    const w = width()
    const id = target
    const fling = Math.abs(v) >= 400 && Math.abs(dx) >= 25 && (v < 0) === (dx < 0)
    const go = !!id && (fling || Math.abs(dx) > w / 2)
    const remain = go ? w + GAP - Math.abs(dx) : Math.abs(dx)
    const ms = reduceMotion ? 0 : Math.min(600, Math.abs(v) >= 400 ? 4 * Math.round(1000 * remain / Math.abs(v)) : Math.round((remain / w + 1) * 100))
    busy = true
    if (!id) {
      moveTo(el, 0, ms)
      finish(ms, () => { swipePreviewing.value = false; navPreviewId.value = null })
      return
    }
    const dir = dx < 0 ? 1 : -1
    if (go) {
      navPreviewId.value = id
      moveTo(el, 0, ms)
      moveTo(ghost, -dir * (w + GAP), ms)
      finish(ms, () => {
        swipePreviewing.value = false
        navPreviewId.value = null
        target = null
        recordRecentBoard(id)
        router.replace({ query: { ...route.query, board: id } })
        scrollActiveTab()
      })
    } else {
      navPreviewId.value = origId
      moveTo(el, dir * (w + GAP), ms)
      moveTo(ghost, 0, ms)
      finish(ms, () => {
        render(origId, origHeadword)
        swipePreviewing.value = false
        navPreviewId.value = null
        target = null
      })
    }
  }
  function onCancel(event: TouchEvent) {
    if (handled.has(event)) return
    handled.add(event)
    detach()
    if (frame) { cancelAnimationFrame(frame); frame = 0 }
    pending = null
    if (start && moving) {
      render(origId, origHeadword)
      ghost?.remove()
      ghost = null
      moveTo(el, 0, 0)
      target = null
      swipePreviewing.value = false
      navPreviewId.value = null
    }
    start = null
    moving = false
  }
  el.addEventListener('touchstart', onStart, { passive: true })
  window.addEventListener('touchmove', onMove, { passive: false })
  window.addEventListener('touchend', onEnd, { passive: true })
  window.addEventListener('touchcancel', onCancel, { passive: true })
  teardownSwipe = () => {
    detach()
    el.removeEventListener('touchstart', onStart)
    window.removeEventListener('touchmove', onMove)
    window.removeEventListener('touchend', onEnd)
    window.removeEventListener('touchcancel', onCancel)
  }
}
onBeforeUnmount(() => teardownSwipe?.())

onMounted(() => {
  setupBoardSwipe()
  favoriteBoardIds.value = loadBoardIds(favoriteStorageKey, boards.value.length)
  recentBoardIds.value = loadBoardIds(recentStorageKey, 6)
  const browserBoard = new URLSearchParams(window.location.search).get('board') || ''
  const requestedBoard = typeof route.query.board === 'string' ? route.query.board : browserBoard
  if (requestedBoard && boards.value.some(board => board.id === requestedBoard)) boardId.value = requestedBoard
  recordRecentBoard(boardId.value)
})

watch(boardId, (value) => {
  if (swipePreviewing.value) return
  if (route.query.board !== value) router.replace({ query: { ...route.query, board: value } })
})

function setSort(value: CommunitySort) { sort.value = value }
function setPopularPeriod(value: CommunityPopularPeriod) { popularPeriod.value = value }
function setView(value: CommunityView) { view.value = value }
const popularPeriodLabels: Record<CommunityPopularPeriod, string> = { hour: '1시간', day: '24시간', week: '1주', month: '1개월', year: '1년', all: '전체 기간' }
const sortLabel = computed(() => sort.value === 'latest' ? '최신순' : sort.value === 'latest-comment' ? '최신 댓글순' : `인기 · ${popularPeriodLabels[popularPeriod.value]}`)
const isCompactList = computed(() => view.value === 'compact' || view.value === 'text')
// 전체 게시판 창의 + 칸: 창은 열어 둔 채 지금 게시판만 바꾼다.
function chooseBoard(value: string) {
  boardId.value = value
  recordRecentBoard(value)
  headword.value = ''
}
function selectBoard(value: string) {
  boardId.value = value
  recordRecentBoard(value)
  headword.value = ''
  boardMenuOpen.value = false
  boardShortcutOpen.value = false
}

function timeLabel(iso: string) {
  const diff = Date.now() - Date.parse(iso)
  if (diff < 3_600_000) return `${Math.max(1, Math.floor(diff / 60_000))}분 전`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}시간 전`
  return new Intl.DateTimeFormat('ko-KR', { month: '2-digit', day: '2-digit' }).format(new Date(iso)).replace(/\. /g, '.').replace('.', '')
}

useHead({ title: '보배드림 커뮤니티' })
</script>

<template>
  <main class="community-shell">
    <header class="community-header" :class="{ 'community-header--f1': boardId === 'f1' }">
      <button class="header-menu-button" type="button" aria-label="커뮤니티 메뉴" @click="boardMenuOpen = true"><img :src="`${iconRoot}/chzzk/menu.svg`" alt="" /></button>
      <button class="community-header-search" type="button" aria-label="커뮤니티 게시글 검색"><img :src="`${iconRoot}/chzzk/search.svg`" alt="" /><span>게시글 검색</span></button>
      <button class="community-header-profile" type="button" aria-label="내 프로필"><img :src="`${communityAssetRoot}/profile-avatars/naver-stock-default.png`" alt="" /></button>
    </header>

    <nav class="board-channel-nav" aria-label="게시판 빠른 이동">
      <div ref="navTrack" class="board-channel-track">
        <button v-for="board in quickBoards" :key="board!.id" type="button" :class="{ 'is-active': board!.id === (navPreviewId ?? boardId) }" @click="selectBoard(board!.id)">{{ board!.shortName || board!.name }}</button>
      </div>
      <button class="board-channel-menu" type="button" aria-label="게시판 바로가기" @click="boardShortcutOpen = true"><img :src="`${communityAssetRoot}/ui/menu.svg`" alt="" /></button>
    </nav>

    <div ref="stage" class="board-swipe-stage">
    <F1BoardHub v-if="boardId === 'f1'" :posts="filteredPosts" :headword="headword" @update:headword="headword = $event" @open-options="optionsOpen = true" />

    <template v-if="boardId !== 'f1'">
    <figure class="community-board-hero">
      <img :src="activeBanner" :alt="`${activeBoard.name} 대표 이미지`" />
      <figcaption><span>{{ activeBoard.kicker || 'BOBAEDREAM' }}</span><strong>{{ activeBoard.name }}</strong><small>{{ activeTagline }}</small></figcaption>
    </figure>

    <section class="community-board-profile">
      <button class="community-board-identity" type="button" @click="boardMenuOpen = true">
        <span><strong>{{ activeBoard.name }}</strong><img :src="`${communityAssetRoot}/ui/chevron-right.svg`" alt="" /></span>
        <small>{{ activeBoard.followerLabel || '팔로워 7.1만명' }} · {{ activeBoard.postCountLabel || '게시물 470개' }}</small>
      </button>
      <button class="community-follow-button" :class="{ 'is-following': following }" type="button" :aria-pressed="following" @click="following = !following">{{ following ? '팔로잉' : '팔로우' }}</button>
    </section>

    <div class="post-toolbar">
      <button class="filter-button" type="button" aria-label="게시글 옵션" @click="optionsOpen = true"><img :src="`${iconRoot}/filter.svg`" alt="" /></button>
      <div class="headword-strip" aria-label="말머리 필터">
        <button :class="{ 'is-active': !headword }" type="button" @click="headword = ''">전체</button>
        <button v-for="item in activeBoard.headwords" :key="item" :class="{ 'is-active': headword === item }" type="button" @click="headword = item">{{ item }}</button>
      </div>
      <button class="sort-summary" type="button" @click="optionsOpen = true">{{ sortLabel }}</button>
    </div>

    <section class="post-list" :class="`post-list--${view}`" aria-live="polite">
      <NuxtLink v-for="post in filteredPosts" :key="post.id" class="post-card" :to="`/posts/${post.id}`">
        <template v-if="isCompactList">
          <div class="post-copy"><h2><span v-if="post.isPopular" class="popular-dot" aria-label="인기글" /><span v-if="post.headword" class="list-headword">[{{ post.headword }}]</span>{{ post.title }} <span class="compact-replies">({{ post.comments }})</span><span v-if="view === 'text' && (post.mediaKind || post.thumbnail)" class="text-media-indicator"><img :src="`${iconRoot}/chzzk-community/${post.mediaKind === 'video' ? 'media-video' : 'media-image'}.svg`" :alt="post.mediaKind === 'video' ? '영상 첨부' : '이미지 첨부'" /></span></h2><p><b>{{ post.author }}</b><span>{{ post.timeLabel || timeLabel(post.updatedAt) }}</span><span class="compact-stat"><img :src="`${iconRoot}/chzzk/upvote.svg`" alt="추천" />{{ post.likes }}</span><span class="compact-stat"><img :src="`${iconRoot}/chzzk/view.svg`" alt="조회" />{{ post.views }}</span></p></div>
          <img v-if="view === 'compact' && post.thumbnail" :src="publicAsset(post.thumbnail)" alt="" class="post-thumbnail" />
        </template>

        <template v-else-if="view === 'list'">
          <div class="post-copy"><h2><span v-if="post.headword" class="list-headword">[{{ post.headword }}]</span>{{ post.title }}</h2><p><b>{{ post.author }}</b><span>{{ post.timeLabel || timeLabel(post.updatedAt) }}</span><span>조회 {{ post.views.toLocaleString() }}</span></p></div>
          <img v-if="post.thumbnail" :src="publicAsset(post.thumbnail)" alt="" class="post-thumbnail" />
          <div class="comment-count"><strong>{{ post.comments }}</strong><span>댓글</span></div>
        </template>

        <template v-else>
          <span v-if="post.headword" class="feed-headword">{{ post.headword }}</span>
          <header class="feed-meta"><span class="feed-avatar"><img v-if="post.authorAvatar" :src="publicAsset(post.authorAvatar)" alt="" /><span v-else>{{ post.author.slice(0, 1) }}</span></span><div><strong>{{ post.author }}</strong><small>{{ post.timeLabel || timeLabel(post.createdAt) }}</small></div><button type="button" aria-label="게시글 더보기">•••</button></header>
          <h2>{{ post.title }}</h2><p class="feed-excerpt">{{ post.excerpt }}</p>
          <div v-if="post.thumbnail" class="feed-media"><img :src="publicAsset(post.thumbnail)" alt="" class="feed-image" /><span v-if="post.photoCount && post.photoCount > 1" class="feed-media-count">1/{{ post.photoCount }}</span><span v-if="post.mediaKind === 'video'" class="feed-video-mark" aria-label="영상">▶</span></div>
          <footer class="reaction-line"><button type="button"><img :src="`${iconRoot}/reaction-like.svg`" alt="추천" />{{ post.likes }}</button><button type="button"><img :src="`${iconRoot}/reaction-dislike.svg`" alt="비추천" />{{ post.dislikes }}</button><button type="button"><img :src="`${iconRoot}/reaction-comment.svg`" alt="댓글" />{{ post.comments }}</button><span>조회 {{ post.views.toLocaleString() }}</span></footer>
        </template>
      </NuxtLink>
      <div v-if="!filteredPosts.length" class="post-list-empty">
        <strong>아직 등록된 글이 없습니다.</strong>
        <span>첫 글을 작성해 새로운 이야기를 시작해보세요.</span>
      </div>
    </section>
    </template>
    </div>

    <NuxtLink class="floating-write" to="/write" aria-label="글쓰기"><img :src="`${iconRoot}/chzzk/write.svg`" alt="" /></NuxtLink>

    <PostOptionsSheet :open="optionsOpen" :sort="sort" :popular-period="popularPeriod" :view="view" :headword="headword" :headwords="activeBoard.headwords" @close="optionsOpen = false" @update:sort="setSort" @update:popular-period="setPopularPeriod" @update:view="setView" @update:headword="headword = $event" />

    <BoardShortcutManager :open="boardShortcutOpen" :sections="sections" :boards="boards" :selected-board-id="boardId" @close="boardShortcutOpen = false" @select="selectBoard" @choose="chooseBoard" />

    <Teleport to="body">
      <Transition name="drawer-slide">
        <div v-if="boardMenuOpen" class="drawer-backdrop" @click.self="boardMenuOpen = false">
          <aside class="board-drawer" aria-label="커뮤니티 메뉴">
            <nav class="drawer-primary" aria-label="커뮤니티 주요 메뉴">
              <button type="button" @click="setSort('latest'); boardMenuOpen = false"><img :src="`${iconRoot}/reddit/latest.svg`" alt="" /><span>최신</span></button>
            </nav>
            <div class="drawer-divider" />
            <NuxtLink class="drawer-utility" to="/write" @click="boardMenuOpen = false"><img :src="`${iconRoot}/reddit/create-community.svg`" alt="" /><span>커뮤니티 만들기</span></NuxtLink>
            <div class="drawer-divider" />
            <section class="drawer-recent-section">
              <header><strong>최근에 방문함</strong><button v-if="recentBoards.length > 3" type="button" @click="recentExpanded = !recentExpanded">{{ recentExpanded ? '접기' : '모두 보기' }}</button></header>
              <div>
                <p v-if="!recentBoards.length" class="drawer-empty">방문한 게시판이 여기에 표시됩니다.</p>
                <div v-for="board in visibleRecentBoards" :key="`recent-${board!.id}`" class="drawer-board-row drawer-board-row--recent" :class="{ 'is-active': board!.id === boardId }">
                  <button type="button" @click="selectBoard(board!.id)"><span class="drawer-board-avatar" aria-hidden="true">{{ board!.name.slice(0, 1) }}</span><span>{{ board!.name }}</span></button>
                </div>
              </div>
            </section>
            <div class="drawer-divider" />
            <details class="drawer-group drawer-smart-group" open>
              <summary><span>즐겨찾기</span><span aria-hidden="true">⌄</span></summary>
              <div>
                <p v-if="!favoriteBoards.length" class="drawer-empty">게시판 옆 별표를 눌러 추가하세요.</p>
                <div v-for="board in favoriteBoards" :key="`favorite-${board!.id}`" class="drawer-board-row" :class="{ 'is-active': board!.id === boardId }">
                  <button type="button" @click="selectBoard(board!.id)"><span class="drawer-board-avatar" aria-hidden="true">{{ board!.name.slice(0, 1) }}</span><span>{{ board!.name }}</span></button>
                  <button class="drawer-favorite-button is-favorite" type="button" :aria-label="`${board!.name} 즐겨찾기 해제`" aria-pressed="true" @click="toggleFavorite(board!.id)"><img :src="`${iconRoot}/reddit/star-selected.svg?v=20261102redditdrawer4`" alt="" /></button>
                </div>
              </div>
            </details>
            <div class="drawer-divider" />
            <p class="drawer-label">전체 게시판</p>
            <details v-for="section in sections" :key="section.id" class="drawer-group" :open="section.boards.some(board => board.id === boardId)">
              <summary><span>{{ section.name }}</span><span aria-hidden="true">⌄</span></summary>
              <div><div v-for="board in section.boards" :key="board.id" class="drawer-board-row" :class="{ 'is-active': board.id === boardId }"><button type="button" @click="selectBoard(board.id)"><span class="drawer-board-avatar" aria-hidden="true">{{ board.name.slice(0, 1) }}</span><span>{{ board.name }}</span></button><button class="drawer-favorite-button" :class="{ 'is-favorite': favoriteBoardIds.includes(board.id) }" type="button" :aria-label="`${board.name} 즐겨찾기 ${favoriteBoardIds.includes(board.id) ? '해제' : '추가'}`" :aria-pressed="favoriteBoardIds.includes(board.id)" @click="toggleFavorite(board.id)"><img :src="`${iconRoot}/reddit/${favoriteBoardIds.includes(board.id) ? 'star-selected.svg?v=20261102redditdrawer4' : 'star.svg'}`" alt="" /></button></div></div>
            </details>
            <div class="drawer-divider" />
            <button class="drawer-utility" type="button" @click="optionsOpen = true; boardMenuOpen = false"><img :src="`${iconRoot}/filter.svg`" alt="" /><span>보기 방식</span></button>
          </aside>
        </div>
      </Transition>
    </Teleport>
  </main>
</template>
