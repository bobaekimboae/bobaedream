<script setup lang="ts">
// 커뮤니티 모바일 목록 화면. 정본: public/community/naver-cafe-list.html (2026-11-04 넉스트 이식)
// 정적 판 CSS 는 다시 쓰지 않고 정적 판과 같은 순서 · 같은 주소(public/community)로 <link> 를 건다.
// 파일 안 그림 주소(assets/…)가 그 CSS 파일 기준이라 번들에 넣으면 경로가 깨지기 때문이다.
// 정적 판 <style> 3개(legacy/list.css)와 스크립트가 붙이던 <style>(legacy/list-dynamic.css)는 글자 그대로 두고,
// 그림 주소만 정적 판과 같은 곳(community/assets/…)을 가리키도록 붙일 때 앞부분을 바꾼다.
import listCss from '~/assets/css/legacy/list.css?raw'
import listDynamicCss from '~/assets/css/legacy/list-dynamic.css?raw'
import { boardById, boardForId, recordRecentBoard } from '~/composables/list/listBoards'
import { loadListData } from '~/composables/list/listData'
import { createListPage, listPageKey } from '~/composables/list/useListPage'
import { createListNav, listNavKey } from '~/composables/list/useListNav'
import { useBoardSwipe } from '~/composables/list/useBoardSwipe'
import ListAppBar from '~/components/list/ListAppBar.vue'
import BoardChannelNav from '~/components/list/BoardChannelNav.vue'
import BoardOrderPanel from '~/components/list/BoardOrderPanel.vue'
import CommunityServiceMenu from '~/components/list/CommunityServiceMenu.vue'
import ListBoardHero from '~/components/list/ListBoardHero.vue'
import ListBoardTop from '~/components/list/ListBoardTop.vue'
import ListItems from '~/components/list/ListItems.vue'
import ListDiscussionFeed from '~/components/list/ListDiscussionFeed.vue'
import ListLoungeBest from '~/components/list/ListLoungeBest.vue'
import ListNaverRanking from '~/components/list/ListNaverRanking.vue'
import ListCafeViews from '~/components/list/ListCafeViews.vue'
import ListRedditFeed from '~/components/list/ListRedditFeed.vue'
import ListChototFeed from '~/components/list/ListChototFeed.vue'
import ListSheet from '~/components/list/ListSheet.vue'
import SpecialBoardSlot from '~/components/list/SpecialBoardSlot.vue'

const route = useRoute()
const router = useRouter()
const query = Object.fromEntries(Object.entries(route.query).map(([k, v]) => [k, Array.isArray(v) ? String(v[0] ?? '') : v == null ? '' : String(v)])) as Record<string, string | undefined>
const a = (p: string) => communityAsset(p)
const page = createListPage(query)
provide(listPageKey, page)
const nav = createListNav(page, router, query)
provide(listNavKey, nav)

const rebase = (css: string) => css.replace(/url\("assets\//g, 'url("' + communityAsset('assets/'))
const staticCss = ['reddit-feed.css', 'news-card.css', 'naver-discussion-feed.css', 'community-poll.css', 'chotot-feed.css', 'hupu-board-navigation.css', 'reddit-board-profile.css', 'board-header-variants.css', 'chzzk-list-parity.css', 'vehicle-review-board.css', 'fuel-economy-board.css', 'fuel-economy-fixes.css', 'autohome-complaint-board.css', 'chezhiwang-complaint-board.css', 'chezhiwang-complaint-fixes.css', 'chezhiwang-complaint-stats.css', 'tuhu-review-board.css']
useHead({
  title: '보배드림 커뮤니티',
  htmlAttrs: { class: 'qf-font-pretendard' },
  meta: [{ name: 'ui-version', content: 'community-list-unified-header-20261102' }],
  link: [
    { rel: 'stylesheet', href: siteAsset('assets/fonts/pretendard/pretendard-guazi.css'), tagPriority: 100 },
    ...staticCss.map((f, i) => ({ rel: 'stylesheet' as const, href: communityAsset(f), tagPriority: 101 + i })),
    { rel: 'stylesheet', href: communityAsset('community-layout-align.css'), tagPriority: 201 },
    { rel: 'icon', href: communityAsset('assets/chzzk-detail/author-avatar.png') },
  ],
  style: [
    { key: 'bbm-list-legacy', textContent: rebase(listCss), tagPriority: 200 },
    { key: 'bbm-list-dynamic', textContent: rebase(listDynamicCss), tagPriority: 202 },
    // 공용 main.css 의 :root{font-synthesis:none} 이 정적 판에는 없다. 없으면 일부 글자(굵게 그리는 대체 글꼴)가 정적 판과 달라져
    // 이 화면에서만 브라우저 기본값으로 되돌린다(공용 파일 수정 필요 사항으로 보고).
    { key: 'bbm-list-font-synthesis', textContent: ':root{font-synthesis:weight style small-caps}', tagPriority: 203 },
  ],
})

const ready = ref(false)
const phone = ref<HTMLElement | null>(null)
const panel = ref<InstanceType<typeof BoardOrderPanel> | null>(null)
const menu = ref<InstanceType<typeof CommunityServiceMenu> | null>(null)
const sheet = ref<InstanceType<typeof ListSheet> | null>(null)
const boardTop = ref<InstanceType<typeof ListBoardTop> | null>(null)
const phoneClass = computed(() => ['phone', ...page.phoneClasses])
const render = computed(() => page.render.value)

function openSheet(kind: 'view' | 'type' | 'board') { sheet.value?.reopen(kind) }
function openTypeSheet() { openSheet(page.activeBoardTable.value === 'best' ? 'view' : 'type') }
function openPostOptions() { page.openPostOptions(); sheet.value?.reopen('postOptions') }
function searchToast() { page.toast('커뮤니티 검색 준비중') }
function onSection(section: string) {
  nav.choose(section === 'report' ? 'accident-blackbox' : section === 'defect' ? 'autohome-complaint' : section === 'board' ? 'free' : 'home')
}
function writerBoard() {
  return ({ '전체 게시글': '자유게시판', 테슬라: '전기차', '정비 / DIY': '정비 · DIY', '보험 · 사고': '보험 · 사고', 블랙박스: '블랙박스 제보' } as Record<string, string>)[page.boardLabel.value] || page.boardLabel.value
}
function reloadTo(q: Record<string, string>) {
  location.href = router.resolve({ path: '/', query: q }).href
  location.reload()
}
function onFab() {
  const t = page.activeBoardTable.value
  if (t === 'best') return page.toast('베스트글은 운영 선정 게시판입니다')
  if (t === 'foreign-car-news') return page.toast('해외 자동차뉴스는 자동 수집 게시판입니다')
  if (t === 'vehicle-review') { location.href = siteAsset('?community=reviews&review=write&from=community'); return }
  if (t === 'tuhu-review') return reloadTo({ board: 'tuhu-review', tuhu: 'write' })
  if (t === 'fuel-economy') { location.href = siteAsset('?community=fuel-economy&fuel=write&from=community'); return }
  if (t === 'autohome-complaint') return reloadTo({ board: 'autohome-complaint', complaint: 'write' })
  if (t === 'chezhiwang-complaint') return reloadTo({ board: 'chezhiwang-complaint', czw: 'write' })
  const requested = query.view || ''
  const reddit = requested === 'reddit' || requested === 'feed' || requested === 'reddit-feed'
  const q = { source: reddit ? 'reddit-feed' : 'chzzk-compact', board: writerBoard(), returnTo: location.pathname + location.search + location.hash }
  router.push({ path: reddit ? '/pc/write' : '/write', query: q })
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (page.boardDescriptionExpanded.value) page.setBoardDescriptionExpanded(false)
    if (page.headwordsExpanded.value) page.setHeadwordsExpanded(false)
  }
}
useBoardSwipe(phone, nav, () => false)

onMounted(async () => {
  document.addEventListener('keydown', onKeydown)
  await loadListData()
  const initial = boardForId(nav.selectedId.value) || boardForId('home')!
  nav.renderNav()
  page.avatarBoard.value = initial
  // 정적 판 choose(selectedId,{skipQuery:true,silent:true}) 처럼 처음 연 게시판도 최근 게시판에 남긴다
  if (boardById[initial.id]) recordRecentBoard(initial.id)
  page.boot({ displayName: initial.displayName, topicKey: initial.topicKey })
  // 정적 판 맨 끝 인라인 스크립트(목록 HTML 417줄): 다른 피드가 자동으로 그린 뒤 전용 게시판을 한 번 더 그린다
  if (['tuhu-review', 'fuel-economy', 'autohome-complaint', 'chezhiwang-complaint'].includes(page.activeBoardTable.value)) page.render.value = { kind: 'special', board: page.activeBoardTable.value }
  page.communitySection.value = ['home', 'all', 'best'].includes(initial.id) ? 'home' : ['accident-blackbox', 'scoop'].includes(initial.id) ? 'report' : ['autohome-complaint', 'chezhiwang-complaint'].includes(initial.id) ? 'defect' : 'board'
  ready.value = true
  if (query.menu === 'all') requestAnimationFrame(() => panel.value?.openPanel())
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <main ref="phone" :class="phoneClass">
    <template v-if="ready">
      <ListAppBar :section="page.communitySection.value" @search="searchToast" @menu="menu?.openMenu()" @section="onSection" />
      <BoardChannelNav @open-panel="(el) => panel?.openPanel({ opener: el })" />
      <ListBoardHero />
      <ListBoardTop ref="boardTop" @board-select="openSheet('board')" @view-sheet="openSheet('view')" @type-sheet="openTypeSheet" @post-options="openPostOptions" />
      <section id="list" :class="page.listClass.value" @touchstart.passive="boardTop?.onTouchStart($event)" @touchend.passive="boardTop?.onTouchEnd($event)">
        <ListItems v-if="render.kind === 'items'" />
        <ListDiscussionFeed v-else-if="render.kind === 'discussion'" :key="'d' + render.variant" :thumb="render.variant !== ''" />
        <ListLoungeBest v-else-if="render.kind === 'lounge'" :view="render.view" />
        <ListNaverRanking v-else-if="render.kind === 'ranking'" />
        <ListCafeViews v-else-if="render.kind === 'cafe-popular'" :key="'cp' + render.left" kind="popular" :left="render.left" />
        <ListCafeViews v-else-if="render.kind === 'cafe-feed'" kind="feed" />
        <ListCafeViews v-else-if="render.kind === 'cafe-left'" kind="left" />
        <ListRedditFeed v-else-if="render.kind === 'reddit'" @options="openSheet('view')" />
        <ListChototFeed v-else-if="render.kind === 'chotot'" :key="'c' + render.dealer" :dealer="render.dealer" />
        <SpecialBoardSlot
          v-else-if="render.kind === 'special'"
          :board="render.board"
          :posts="page.posts.value"
          :phone-classes="page.phoneClasses"
          :list-class="page.listClass"
          :type-label="page.typeLabel"
          :topics="page.topics"
          :active="page.active"
          :query="query"
          :toast="page.toast"
        />
      </section>
      <div class="bottomSpace" />
      <button class="fab" aria-label="글쓰기" @click="onFab"><img :src="a('assets/reddit-ui/write.svg')" alt=""></button>
    </template>
  </main>
  <div id="toast" :class="['toast', { show: page.toastShow.value }]">{{ page.toastText.value }}</div>
  <ListSheet ref="sheet" />
  <template v-if="ready">
    <BoardOrderPanel ref="panel" />
    <CommunityServiceMenu ref="menu" @open-panel="panel?.openPanel({ opener: null })" @open-view="openSheet('view')" />
  </template>
</template>
