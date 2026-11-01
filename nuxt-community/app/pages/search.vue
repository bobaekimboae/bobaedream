<script setup lang="ts">
import { searchCommentSeed } from '~/data/searchComments'
import { trendingSearchSeed } from '~/composables/useSearchHistory'
import {
  crop, highlight, parseQuery, searchBoards, searchComments, searchPeople, searchPosts,
  searchPeriodLabels, searchSortLabels, searchTypeLabels,
  type SearchPeriod, type SearchSort, type SearchType,
} from '~/utils/communitySearch'

const route = useRoute()
const router = useRouter()
const { boards, posts, boardId: listBoardId } = useCommunity()
const history = useSearchHistory()
const iconRoot = `${useRuntimeConfig().app.baseURL}icons`

const types: SearchType[] = ['posts', 'boards', 'comments', 'people']
const sorts: SearchSort[] = ['relevance', 'hot', 'top', 'new', 'comments']
const periods: SearchPeriod[] = ['hour', 'day', 'week', 'month', 'year', 'all']

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? value as T : fallback
}

// 주소가 검색 상태의 정본이다. 결과를 그대로 공유하고 다시 열 수 있다.
const q = computed(() => typeof route.query.q === 'string' ? route.query.q : '')
const type = computed(() => pick(route.query.type, types, 'posts'))
const sort = computed(() => pick(route.query.sort, sorts, 'relevance'))
const period = computed(() => pick(route.query.t, periods, 'all'))
const scopeId = computed(() => {
  const id = typeof route.query.board === 'string' ? route.query.board : ''
  return boards.value.some(board => board.id === id) ? id : ''
})
const scopeBoard = computed(() => boards.value.find(board => board.id === scopeId.value))

function setQuery(patch: Record<string, string | undefined>, replace = true) {
  const next: Record<string, string> = {}
  const merged = { q: q.value, type: type.value, sort: sort.value, t: period.value, board: scopeId.value, ...patch }
  for (const [key, value] of Object.entries(merged)) {
    if (!value) continue
    if ((key === 'type' && value === 'posts') || (key === 'sort' && value === 'relevance') || (key === 't' && value === 'all')) continue
    next[key] = value
  }
  return replace ? router.replace({ path: '/search', query: next }) : router.push({ path: '/search', query: next })
}

// 입력칸
const input = ref(q.value)
const inputEl = ref<HTMLInputElement | null>(null)
const focused = ref(!q.value)
const typed = ref(q.value)
let debounce: ReturnType<typeof setTimeout> | undefined
watch(input, (value) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => { typed.value = value }, 150)
})
watch(q, (value) => { input.value = value; typed.value = value })

function submit(value = input.value) {
  const text = value.trim()
  if (!text) return
  history.add(text)
  focused.value = false
  input.value = text
  inputEl.value?.blur()
  setQuery({ q: text }, text !== q.value)
}
function clearInput() {
  input.value = ''
  typed.value = ''
  focused.value = true
  nextTick(() => inputEl.value?.focus())
}
function goBack() {
  if (focused.value && q.value) { focused.value = false; input.value = q.value; inputEl.value?.blur(); return }
  if (window.history.length > 1) router.back()
  else router.push('/')
}

onMounted(() => {
  history.load()
  if (!q.value) nextTick(() => inputEl.value?.focus())
})

// 입력 중 추천: 게시판 · 사람 · 게시글 제목
const suggestBoards = computed(() => searchBoards(boards.value, posts.value, typed.value).slice(0, 3))
const suggestPeople = computed(() => searchPeople(posts.value, searchCommentSeed, typed.value).slice(0, 2))
const suggestPosts = computed(() => typed.value.trim()
  ? searchPosts(posts.value, boards.value, { query: typed.value, boardId: scopeId.value, sort: 'relevance', period: 'all' }).hits.slice(0, 4)
  : [])
const syntaxTip = computed(() => /:$/.test(typed.value.trim()) || /^(게시판|작성자|제목|말머리)$/.test(typed.value.trim()))

// 결과
const postResult = computed(() => searchPosts(posts.value, boards.value, { query: q.value, boardId: scopeId.value, sort: sort.value, period: period.value }))
const boardResult = computed(() => searchBoards(boards.value, posts.value, q.value))
const commentResult = computed(() => searchComments(searchCommentSeed, posts.value, { query: q.value, boardId: scopeId.value, sort: sort.value, period: period.value, boards: boards.value }))
const peopleResult = computed(() => searchPeople(posts.value, searchCommentSeed, q.value))
const counts = computed<Record<SearchType, number>>(() => ({
  posts: postResult.value.hits.length,
  boards: boardResult.value.length,
  comments: commentResult.value.length,
  people: peopleResult.value.length,
}))
const parsed = computed(() => parseQuery(q.value))
// 게시판 범위를 풀면 몇 개가 나오는지 미리 센다(빈 결과에서 다음 행동을 안내).
const unscopedCount = computed(() => {
  if (!scopeId.value) return 0
  if (type.value === 'comments') return searchComments(searchCommentSeed, posts.value, { query: q.value, sort: sort.value, period: period.value, boards: boards.value }).length
  return searchPosts(posts.value, boards.value, { query: q.value, sort: sort.value, period: period.value }).hits.length
})
const conditionChips = computed(() => {
  const chips: Array<{ label: string; remove: string }> = []
  const p = parsed.value
  if (p.board) chips.push({ label: `게시판: ${postResult.value.scopeBoard?.name ?? p.board}`, remove: 'board' })
  if (p.author) chips.push({ label: `작성자: ${p.author}`, remove: 'author' })
  if (p.title) chips.push({ label: `제목: ${p.title}`, remove: 'title' })
  if (p.headword) chips.push({ label: `말머리: ${p.headword}`, remove: 'headword' })
  for (const word of p.excludes) chips.push({ label: `제외: ${word}`, remove: `-${word}` })
  return chips
})
function removeCondition(key: string) {
  const pattern = key.startsWith('-')
    ? new RegExp(`(^|\\s)-("${escapeRegExp(key.slice(1))}"|${escapeRegExp(key.slice(1))})(?=\\s|$)`, 'i')
    : new RegExp(`(^|\\s)(?:${{ board: '게시판|board', author: '작성자|author', title: '제목|title', headword: '말머리|flair' }[key]}):(?:"[^"]+"|\\S+)`, 'gi')
  const next = q.value.replace(pattern, ' ').replace(/\s+/g, ' ').trim()
  if (next) setQuery({ q: next })
  else { setQuery({ q: undefined }); focused.value = true; nextTick(() => inputEl.value?.focus()) }
}
function escapeRegExp(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

const sheet = ref<'sort' | 'period' | null>(null)
function onSheetKey(event: KeyboardEvent) { if (event.key === 'Escape') sheet.value = null }
watch(sheet, (value, old) => {
  if (value) {
    window.addEventListener('keydown', onSheetKey)
    nextTick(() => (document.querySelector('.search-sheet-list [aria-checked="true"]') as HTMLElement | null)?.focus())
  } else {
    window.removeEventListener('keydown', onSheetKey)
    if (old) nextTick(() => (document.querySelector(`.search-filters .filter-pill:nth-child(${old === 'sort' ? 1 : 2})`) as HTMLElement | null)?.focus())
  }
})
onBeforeUnmount(() => window.removeEventListener('keydown', onSheetKey))
const sortChoices = computed(() => type.value === 'comments' ? (['relevance', 'top', 'new'] as SearchSort[]) : sorts)

function openBoard(id: string) {
  listBoardId.value = id
  router.push('/')
}
function searchAuthor(name: string) {
  const text = `작성자:${name.includes(' ') ? `"${name}"` : name}`
  history.add(text)
  focused.value = false
  setQuery({ q: text, type: 'posts' }, true)
}

function timeLabel(iso: string) {
  const diff = Date.now() - Date.parse(iso)
  if (diff < 3_600_000) return `${Math.max(1, Math.floor(diff / 60_000))}분 전`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}시간 전`
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}일 전`
  return new Intl.DateTimeFormat('ko-KR', { month: '2-digit', day: '2-digit' }).format(new Date(iso))
}
function boardName(id: string) { return boards.value.find(board => board.id === id)?.name ?? '' }

useHead(() => ({ title: q.value ? `${q.value} - 보배드림 커뮤니티 검색` : '커뮤니티 검색 - 보배드림' }))
</script>

<template>
  <main class="search-page">
    <header class="search-header">
      <button class="search-back" type="button" aria-label="뒤로" @click="goBack"><img :src="`${iconRoot}/chzzk/back.svg`" alt="" /></button>
      <form class="search-field" role="search" @submit.prevent="submit()">
        <img :src="`${iconRoot}/chzzk/search.svg`" alt="" />
        <input
          ref="inputEl"
          v-model="input"
          type="search"
          enterkeyhint="search"
          autocomplete="off"
          :placeholder="scopeBoard ? `${scopeBoard.name}에서 검색` : '커뮤니티 전체에서 검색'"
          aria-label="검색어"
          @focus="focused = true"
          @keydown.esc="goBack"
        />
        <button v-if="input" class="search-clear" type="button" aria-label="검색어 지우기" @click="clearInput"><img :src="`${iconRoot}/write/close.svg`" alt="" /></button>
      </form>
    </header>

    <div v-if="scopeBoard" class="search-scope">
      <span>범위</span>
      <button type="button" class="search-scope-chip" :aria-label="`${scopeBoard.name} 범위 풀고 전체에서 찾기`" @click="setQuery({ board: undefined })">{{ scopeBoard.name }} <img :src="`${iconRoot}/write/close.svg`" alt="" /></button>
    </div>

    <!-- 입력 중 추천 -->
    <section v-if="focused || !q" class="search-suggest" aria-label="검색 추천">
      <template v-if="!typed.trim()">
        <div v-if="history.recent.value.length" class="suggest-block">
          <div class="suggest-head"><h2>최근 검색</h2><button type="button" @click="history.clear()">모두 지우기</button></div>
          <ul class="recent-list">
            <li v-for="item in history.recent.value" :key="item">
              <button type="button" class="recent-word" @click="submit(item)">{{ item }}</button>
              <button type="button" class="recent-remove" :aria-label="`${item} 지우기`" @click="history.remove(item)"><img :src="`${iconRoot}/write/close.svg`" alt="" /></button>
            </li>
          </ul>
        </div>
        <div class="suggest-block">
          <div class="suggest-head"><h2>인기 검색어</h2><span>예시</span></div>
          <ol class="trending-list">
            <li v-for="(item, index) in trendingSearchSeed" :key="item"><button type="button" @click="submit(item)"><b>{{ index + 1 }}</b>{{ item }}</button></li>
          </ol>
        </div>
        <div class="suggest-block syntax-help">
          <h2>이렇게도 찾을 수 있어요</h2>
          <ul>
            <li><code>게시판:정비</code> 정비 · DIY 게시판 글만</li>
            <li><code>작성자:공구덕후</code> 그 사람이 쓴 글만</li>
            <li><code>제목:시동</code> 제목에 시동이 들어간 글만</li>
            <li><code>말머리:충전</code> · <code>-광고</code> 말머리로 거르기 · 낱말 빼기</li>
          </ul>
        </div>
      </template>

      <template v-else>
        <p v-if="syntaxTip" class="suggest-tip">콜론(:) 뒤에 값을 붙여 써 주세요. 예: <code>게시판:수입차</code></p>
        <div v-if="suggestBoards.length" class="suggest-block">
          <h2 class="suggest-label">게시판</h2>
          <button v-for="item in suggestBoards" :key="item.board.id" type="button" class="suggest-row" @click="openBoard(item.board.id)">
            <span class="suggest-icon is-board" aria-hidden="true">{{ item.board.name.slice(0, 1) }}</span>
            <span class="suggest-copy"><strong><template v-for="(part, i) in highlight(item.board.name, typed)" :key="i"><b v-if="part.hit">{{ part.text }}</b><template v-else>{{ part.text }}</template></template></strong><small>게시글 {{ item.posts }}개</small></span>
          </button>
        </div>
        <div v-if="suggestPeople.length" class="suggest-block">
          <h2 class="suggest-label">사람</h2>
          <button v-for="person in suggestPeople" :key="person.name" type="button" class="suggest-row" @click="searchAuthor(person.name)">
            <span class="suggest-icon" aria-hidden="true">{{ person.name.slice(0, 1) }}</span>
            <span class="suggest-copy"><strong><template v-for="(part, i) in highlight(person.name, typed)" :key="i"><b v-if="part.hit">{{ part.text }}</b><template v-else>{{ part.text }}</template></template></strong><small>글 {{ person.posts }} · 댓글 {{ person.comments }}</small></span>
          </button>
        </div>
        <div v-if="suggestPosts.length" class="suggest-block">
          <h2 class="suggest-label">게시글</h2>
          <NuxtLink v-for="hit in suggestPosts" :key="hit.post.id" :to="`/posts/${hit.post.id}`" class="suggest-row" @click="history.add(typed)">
            <img class="suggest-icon is-search" :src="`${iconRoot}/chzzk/search.svg`" alt="" />
            <span class="suggest-copy"><strong><template v-for="(part, i) in highlight(hit.post.title, typed)" :key="i"><b v-if="part.hit">{{ part.text }}</b><template v-else>{{ part.text }}</template></template></strong><small>{{ hit.board?.name }}</small></span>
          </NuxtLink>
        </div>
        <button type="button" class="suggest-submit" @click="submit()"><img :src="`${iconRoot}/chzzk/search.svg`" alt="" /><span>“{{ input.trim() }}” {{ scopeBoard ? `${scopeBoard.name}에서` : '전체에서' }} 검색</span></button>
      </template>
    </section>

    <!-- 결과 -->
    <template v-else>
      <nav class="search-tabs" aria-label="결과 종류">
        <button v-for="item in types" :key="item" type="button" :class="{ 'is-active': type === item }" :aria-current="type === item ? 'page' : undefined" @click="setQuery({ type: item, sort: item === 'comments' && !['relevance', 'top', 'new'].includes(sort) ? 'relevance' : sort })">
          {{ searchTypeLabels[item] }}<span>{{ counts[item] }}</span>
        </button>
      </nav>

      <div v-if="type === 'posts' || type === 'comments'" class="search-filters">
        <button type="button" class="filter-pill" @click="sheet = 'sort'">{{ searchSortLabels[sort] }}<img :src="`${iconRoot}/write/chevron-down.svg`" alt="" /></button>
        <button type="button" class="filter-pill" :class="{ 'is-on': period !== 'all' }" @click="sheet = 'period'">{{ searchPeriodLabels[period] }}<img :src="`${iconRoot}/write/chevron-down.svg`" alt="" /></button>
        <button v-for="chip in conditionChips" :key="chip.label" type="button" class="filter-pill is-on" :aria-label="`${chip.label} 조건 빼기`" @click="removeCondition(chip.remove)">{{ chip.label }}<img :src="`${iconRoot}/write/close.svg`" alt="" /></button>
      </div>

      <div v-if="type === 'posts' && !scopeBoard && !parsed.board && postResult.facets.length > 1" class="search-facets" aria-label="게시판별 결과">
        <button v-for="facet in postResult.facets" :key="facet.board.id" type="button" @click="setQuery({ board: facet.board.id })">{{ facet.board.name }}<span>{{ facet.count }}</span></button>
      </div>

      <section class="search-results" aria-live="polite">
        <template v-if="type === 'posts'">
          <p v-if="postResult.unknownBoard" class="search-empty"><strong>‘{{ postResult.unknownBoard }}’ 게시판을 찾지 못했어요</strong><span>게시판 이름을 다시 확인해 주세요.</span></p>
          <NuxtLink v-for="hit in postResult.hits" :key="hit.post.id" :to="`/posts/${hit.post.id}`" class="result-post">
            <div class="result-copy">
              <p class="result-meta"><span>{{ hit.board?.name }}</span><span v-if="hit.post.headword">{{ hit.post.headword }}</span><span>{{ timeLabel(hit.post.createdAt) }}</span></p>
              <h2><template v-for="(part, i) in highlight(hit.post.title, q)" :key="i"><b v-if="part.hit">{{ part.text }}</b><template v-else>{{ part.text }}</template></template></h2>
              <p class="result-excerpt"><template v-for="(part, i) in highlight(crop(hit.post.excerpt, q), q)" :key="i"><b v-if="part.hit">{{ part.text }}</b><template v-else>{{ part.text }}</template></template></p>
              <p class="result-stats"><span>추천 {{ hit.post.likes }}</span><span>댓글 {{ hit.post.comments }}</span><span>조회 {{ hit.post.views.toLocaleString() }}</span><span class="result-author">{{ hit.post.author }}</span></p>
            </div>
            <img v-if="hit.post.thumbnail" :src="hit.post.thumbnail" alt="" class="result-thumb" />
          </NuxtLink>
        </template>

        <template v-else-if="type === 'boards'">
          <button v-for="item in boardResult" :key="item.board.id" type="button" class="result-board" @click="openBoard(item.board.id)">
            <span class="suggest-icon is-board" aria-hidden="true">{{ item.board.name.slice(0, 1) }}</span>
            <span class="result-copy"><strong><template v-for="(part, i) in highlight(item.board.name, q)" :key="i"><b v-if="part.hit">{{ part.text }}</b><template v-else>{{ part.text }}</template></template></strong><small>말머리 {{ item.board.headwords.join(' · ') }}</small></span>
            <span class="result-board-count">글 {{ item.posts }}</span>
          </button>
        </template>

        <template v-else-if="type === 'comments'">
          <NuxtLink v-for="item in commentResult" :key="item.comment.id" :to="`/posts/${item.post.id}`" class="result-comment">
            <p class="result-meta"><span>{{ boardName(item.post.boardId) }}</span><span class="result-comment-post">{{ item.post.title }}</span></p>
            <p class="result-comment-text"><template v-for="(part, i) in highlight(item.comment.text, q)" :key="i"><b v-if="part.hit">{{ part.text }}</b><template v-else>{{ part.text }}</template></template></p>
            <p class="result-stats"><span class="result-author">{{ item.comment.author }}</span><span>{{ timeLabel(item.comment.createdAt) }}</span><span>추천 {{ item.comment.likes }}</span></p>
          </NuxtLink>
        </template>

        <template v-else>
          <button v-for="person in peopleResult" :key="person.name" type="button" class="result-board" @click="searchAuthor(person.name)">
            <span class="suggest-icon" aria-hidden="true">{{ person.name.slice(0, 1) }}</span>
            <span class="result-copy"><strong><template v-for="(part, i) in highlight(person.name, q)" :key="i"><b v-if="part.hit">{{ part.text }}</b><template v-else>{{ part.text }}</template></template></strong><small>글 {{ person.posts }} · 댓글 {{ person.comments }} · 받은 추천 {{ person.likes }}</small></span>
            <span class="result-board-count">쓴 글 보기</span>
          </button>
        </template>

        <div v-if="!counts[type] && !postResult.unknownBoard" class="search-empty">
          <strong>‘{{ q }}’에 맞는 {{ searchTypeLabels[type] }}이 없어요</strong>
          <span>낱말을 줄이거나 다른 말로 찾아 보세요.</span>
          <div class="search-empty-actions">
            <button v-if="period !== 'all' && (type === 'posts' || type === 'comments')" type="button" @click="setQuery({ t: undefined })">전체 기간에서 찾기</button>
            <button v-if="scopeBoard && unscopedCount" type="button" @click="setQuery({ board: undefined })">전체 게시판에서 {{ unscopedCount }}개 보기</button>
            <button v-if="type !== 'posts' && counts.posts" type="button" @click="setQuery({ type: 'posts' })">게시글 {{ counts.posts }}개 보기</button>
          </div>
        </div>
      </section>
    </template>

    <Teleport to="body">
      <div v-if="sheet" class="sheet-backdrop" @click.self="sheet = null">
        <section class="post-options-sheet search-sheet" role="dialog" aria-modal="true" :aria-label="sheet === 'sort' ? '정렬' : '기간'">
          <header class="sheet-handle-header"><span class="sheet-handle" /><h2>{{ sheet === 'sort' ? '정렬' : '기간' }}</h2><button class="sheet-close" type="button" aria-label="닫기" @click="sheet = null">×</button></header>
          <div class="search-sheet-list">
            <template v-if="sheet === 'sort'">
              <button v-for="item in sortChoices" :key="item" type="button" role="radio" :aria-checked="sort === item" @click="setQuery({ sort: item }); sheet = null">{{ searchSortLabels[item] }}<span v-if="item === 'hot'">추천과 올린 시간을 함께 봐요</span></button>
            </template>
            <template v-else>
              <button v-for="item in periods" :key="item" type="button" role="radio" :aria-checked="period === item" @click="setQuery({ t: item }); sheet = null">{{ searchPeriodLabels[item] }}</button>
            </template>
          </div>
        </section>
      </div>
    </Teleport>
  </main>
</template>
