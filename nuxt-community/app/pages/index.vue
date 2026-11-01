<script setup lang="ts">
import type { CommunityPopularPeriod, CommunitySort, CommunityView } from '~/types/community'

const { sections, boards, sort, popularPeriod, view, boardId, headword, activeBoard, filteredPosts } = useCommunity()
const optionsOpen = ref(false)
const boardMenuOpen = ref(false)
const recentExpanded = ref(false)
const iconRoot = `${useRuntimeConfig().app.baseURL}icons`
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

onMounted(() => {
  favoriteBoardIds.value = loadBoardIds(favoriteStorageKey, boards.value.length)
  recentBoardIds.value = loadBoardIds(recentStorageKey, 6)
  recordRecentBoard(boardId.value)
})

function setSort(value: CommunitySort) { sort.value = value }
function setPopularPeriod(value: CommunityPopularPeriod) { popularPeriod.value = value }
function setView(value: CommunityView) { view.value = value }
const popularPeriodLabels: Record<CommunityPopularPeriod, string> = { hour: '1시간', day: '24시간', week: '1주', month: '1개월', year: '1년', all: '전체 기간' }
const sortLabel = computed(() => sort.value === 'latest' ? '최신순' : sort.value === 'latest-comment' ? '최신 댓글순' : `인기 · ${popularPeriodLabels[popularPeriod.value]}`)
const isCompactList = computed(() => view.value === 'compact' || view.value === 'text')
function selectBoard(value: string) {
  boardId.value = value
  recordRecentBoard(value)
  headword.value = ''
  boardMenuOpen.value = false
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
    <header class="community-header">
      <button class="header-menu-button" type="button" aria-label="게시판 바로가기" @click="boardMenuOpen = true"><img :src="`${iconRoot}/chzzk/menu.svg`" alt="" /></button>
      <button class="community-header-search" type="button" aria-label="커뮤니티 게시글 검색"><img :src="`${iconRoot}/chzzk/search.svg`" alt="" /><span>게시글 검색</span></button>
      <button class="community-header-profile" type="button" aria-label="내 프로필"><span aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg></span></button>
    </header>

    <div v-if="isCompactList" class="chzzk-list-toolbar">
      <button type="button" @click="boardMenuOpen = true">{{ activeBoard.name }} <img :src="`${iconRoot}/write/chevron-down.svg`" alt="" /></button>
      <button type="button" @click="optionsOpen = true"><img :src="`${iconRoot}/filter.svg`" alt="" />{{ sortLabel }}</button>
    </div>

    <section v-else class="board-context">
      <div><strong>{{ activeBoard.name }}</strong><span>차를 좋아하는 사람들의 이야기</span></div>
      <button type="button" @click="boardMenuOpen = true">게시판 변경</button>
    </section>

    <div v-if="!isCompactList" class="post-toolbar">
      <button class="filter-button" type="button" aria-label="게시글 옵션" @click="optionsOpen = true"><img :src="`${iconRoot}/filter.svg`" alt="" /></button>
      <div class="headword-strip" aria-label="말머리 필터">
        <button :class="{ 'is-active': !headword }" type="button" @click="headword = ''">전체</button>
        <button v-for="item in activeBoard.headwords" :key="item" :class="{ 'is-active': headword === item }" type="button" @click="headword = item">{{ item }}</button>
      </div>
      <button class="sort-summary" type="button" @click="optionsOpen = true">{{ sortLabel }}</button>
    </div>

    <div v-if="isCompactList" class="community-cleanbot">
      <span class="cleanbot-mark"><img :src="`${iconRoot}/chzzk/cleanbot-source.png`" alt="" /></span>
      <span><strong>클린봇</strong>이 악성게시글을 감지합니다.</span>
      <button class="cleanbot-settings" type="button" aria-label="클린봇 설정"><img :src="`${iconRoot}/chzzk/settings.svg`" alt="" /></button>
    </div>

    <section class="post-list" :class="`post-list--${view}`" aria-live="polite">
      <NuxtLink v-for="post in filteredPosts" :key="post.id" class="post-card" :to="`/posts/${post.id}`">
        <template v-if="isCompactList">
          <div class="post-copy"><h2><span v-if="post.isPopular" class="popular-dot" aria-label="인기글" /><span v-if="post.headword" class="list-headword">[{{ post.headword }}]</span>{{ post.title }} <span class="compact-replies">({{ post.comments }})</span><span v-if="view === 'text' && (post.mediaKind || post.thumbnail)" class="text-media-indicator"><img :src="`${iconRoot}/chzzk-community/${post.mediaKind === 'video' ? 'media-video' : 'media-image'}.svg`" :alt="post.mediaKind === 'video' ? '영상 첨부' : '이미지 첨부'" /></span></h2><p><b>{{ post.author }}</b><span>{{ timeLabel(post.updatedAt) }}</span><span class="compact-stat"><img :src="`${iconRoot}/chzzk/upvote.svg`" alt="추천" />{{ post.likes }}</span><span class="compact-stat"><img :src="`${iconRoot}/chzzk/view.svg`" alt="조회" />{{ post.views }}</span></p></div>
          <img v-if="view === 'compact' && post.thumbnail" :src="post.thumbnail" alt="" class="post-thumbnail" />
        </template>

        <template v-else-if="view === 'list'">
          <div class="post-copy"><h2><span v-if="post.headword" class="list-headword">[{{ post.headword }}]</span>{{ post.title }}</h2><p><b>{{ post.author }}</b><span>{{ timeLabel(post.updatedAt) }}</span><span>조회 {{ post.views.toLocaleString() }}</span></p></div>
          <img v-if="post.thumbnail" :src="post.thumbnail" alt="" class="post-thumbnail" />
          <div class="comment-count"><strong>{{ post.comments }}</strong><span>댓글</span></div>
        </template>

        <template v-else>
          <header class="feed-meta"><span class="feed-avatar">{{ post.author.slice(0, 1) }}</span><div><strong>{{ post.author }}</strong><small>{{ timeLabel(post.createdAt) }} · 조회 {{ post.views.toLocaleString() }}</small></div><button type="button" aria-label="게시글 더보기">•••</button></header>
          <h2><span v-if="post.headword" class="list-headword">[{{ post.headword }}]</span>{{ post.title }}</h2><p class="feed-excerpt">{{ post.excerpt }}</p>
          <img v-if="post.thumbnail" :src="post.thumbnail" alt="" class="feed-image" />
          <footer class="reaction-line"><button type="button"><img :src="`${iconRoot}/reaction-like.svg`" alt="추천" />{{ post.likes }}</button><button type="button"><img :src="`${iconRoot}/reaction-dislike.svg`" alt="비추천" />{{ post.dislikes }}</button><button type="button"><img :src="`${iconRoot}/reaction-comment.svg`" alt="댓글" />{{ post.comments }}</button><span>조회 {{ post.views.toLocaleString() }}</span></footer>
        </template>
      </NuxtLink>
      <div v-if="!filteredPosts.length" class="post-list-empty">
        <strong>아직 등록된 글이 없습니다.</strong>
        <span>첫 글을 작성해 새로운 이야기를 시작해보세요.</span>
      </div>
    </section>

    <NuxtLink class="floating-write" to="/write" aria-label="글쓰기"><img :src="`${iconRoot}/chzzk/write.svg`" alt="" /></NuxtLink>

    <PostOptionsSheet :open="optionsOpen" :sort="sort" :popular-period="popularPeriod" :view="view" :headword="headword" :headwords="activeBoard.headwords" @close="optionsOpen = false" @update:sort="setSort" @update:popular-period="setPopularPeriod" @update:view="setView" @update:headword="headword = $event" />

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
