<script setup lang="ts">
import type { CommunitySort, CommunityView } from '~/types/community'

const { sections, sort, view, boardId, headword, activeBoard, filteredPosts } = useCommunity()
const optionsOpen = ref(false)
const boardMenuOpen = ref(false)
const iconRoot = `${useRuntimeConfig().app.baseURL}icons`

function setSort(value: CommunitySort) { sort.value = value }
function setView(value: CommunityView) { view.value = value }
function selectBoard(value: string) {
  boardId.value = value
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
      <button class="header-menu" type="button" aria-label="게시판 메뉴" @click="boardMenuOpen = true"><span /><span /><span /></button>
      <NuxtLink class="brand" to="/"><span class="brand-mark">B</span><strong>보배드림</strong></NuxtLink>
      <div class="header-actions"><button type="button" aria-label="검색" class="search-icon" /><button type="button" aria-label="알림" class="bell-icon" /></div>
    </header>

    <nav class="community-primary-nav" aria-label="커뮤니티 대메뉴">
      <button :class="{ 'is-active': activeBoard.sectionId === 'general' }" type="button" @click="selectBoard('free')">홈</button>
      <button type="button" @click="boardMenuOpen = true">게시판</button>
      <button :class="{ 'is-active': activeBoard.sectionId === 'reports' }" type="button" @click="selectBoard('blackbox')">제보</button>
      <button :class="{ 'is-active': activeBoard.sectionId === 'defects' }" type="button" @click="selectBoard('defect')">결함</button>
    </nav>

    <section class="board-context">
      <div><strong>{{ activeBoard.name }}</strong><span>차를 좋아하는 사람들의 이야기</span></div>
      <button type="button" @click="boardMenuOpen = true">게시판 변경</button>
    </section>

    <div class="post-toolbar">
      <button class="filter-button" type="button" aria-label="게시글 옵션" @click="optionsOpen = true"><img :src="`${iconRoot}/filter.svg`" alt="" /></button>
      <div class="headword-strip" aria-label="말머리 필터">
        <button :class="{ 'is-active': !headword }" type="button" @click="headword = ''">전체</button>
        <button v-for="item in activeBoard.headwords" :key="item" :class="{ 'is-active': headword === item }" type="button" @click="headword = item">{{ item }}</button>
      </div>
      <button class="sort-summary" type="button" @click="optionsOpen = true">{{ sort === 'latest' ? '최신순' : sort === 'latest-comment' ? '최신 댓글순' : '인기순' }}</button>
    </div>

    <section class="post-list" :class="`post-list--${view}`" aria-live="polite">
      <NuxtLink v-for="post in filteredPosts" :key="post.id" class="post-card" :to="`/posts/${post.id}`">
        <template v-if="view === 'compact'">
          <div class="post-copy"><span v-if="post.isPopular" class="popular-dot" aria-label="인기글" /><h2>{{ post.title }}</h2><p><b>{{ post.author }}</b><span>{{ timeLabel(post.updatedAt) }}</span><span class="compact-up">⇧ {{ post.likes }}</span><span>◉ {{ post.views }}</span></p></div>
          <img v-if="post.thumbnail" :src="post.thumbnail" alt="" class="post-thumbnail" />
        </template>

        <template v-else-if="view === 'list'">
          <div class="post-copy"><h2>{{ post.title }}</h2><p><b>{{ post.author }}</b><span>{{ timeLabel(post.updatedAt) }}</span><span>조회 {{ post.views.toLocaleString() }}</span></p></div>
          <img v-if="post.thumbnail" :src="post.thumbnail" alt="" class="post-thumbnail" />
          <div class="comment-count"><strong>{{ post.comments }}</strong><span>댓글</span></div>
        </template>

        <template v-else>
          <header class="feed-meta"><span class="feed-avatar">{{ post.author.slice(0, 1) }}</span><div><strong>{{ post.author }}</strong><small>{{ timeLabel(post.createdAt) }} · 조회 {{ post.views.toLocaleString() }}</small></div><button type="button" aria-label="게시글 더보기">•••</button></header>
          <span v-if="post.headword" class="post-headword">{{ post.headword }}</span>
          <h2>{{ post.title }}</h2><p class="feed-excerpt">{{ post.excerpt }}</p>
          <img v-if="post.thumbnail" :src="post.thumbnail" alt="" class="feed-image" />
          <footer class="reaction-line"><button type="button"><img :src="`${iconRoot}/reaction-like.svg`" alt="추천" />{{ post.likes }}</button><button type="button"><img :src="`${iconRoot}/reaction-dislike.svg`" alt="비추천" />{{ post.dislikes }}</button><button type="button"><img :src="`${iconRoot}/reaction-comment.svg`" alt="댓글" />{{ post.comments }}</button><span>조회 {{ post.views.toLocaleString() }}</span></footer>
        </template>
      </NuxtLink>
      <div v-if="!filteredPosts.length" class="post-list-empty">
        <strong>아직 등록된 글이 없습니다.</strong>
        <span>첫 글을 작성해 새로운 이야기를 시작해보세요.</span>
      </div>
    </section>

    <NuxtLink class="floating-write" to="/write" aria-label="글쓰기"><img :src="`${iconRoot}/write.svg`" alt="" /></NuxtLink>

    <PostOptionsSheet :open="optionsOpen" :sort="sort" :view="view" :headword="headword" :headwords="activeBoard.headwords" @close="optionsOpen = false" @update:sort="setSort" @update:view="setView" @update:headword="headword = $event" />

    <Teleport to="body">
      <Transition name="drawer-slide">
        <div v-if="boardMenuOpen" class="drawer-backdrop" @click.self="boardMenuOpen = false">
          <aside class="board-drawer" aria-label="게시판 메뉴">
            <header><strong>게시판</strong><button type="button" aria-label="닫기" @click="boardMenuOpen = false">×</button></header>
            <section v-for="section in sections" :key="section.id"><h2>{{ section.name }}</h2><div><button v-for="board in section.boards" :key="board.id" type="button" :class="{ 'is-active': board.id === boardId }" @click="selectBoard(board.id)">{{ board.name }}</button></div></section>
          </aside>
        </div>
      </Transition>
    </Teleport>
  </main>
</template>
