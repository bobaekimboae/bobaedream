<script setup lang="ts">
// PC 커뮤니티 게시판 목록 — 정적 public/community/bobaedream-pc-board-list.html(+ bobaedream-pc-interactions.js) 이식 (2026-11-04)
// DOM 구조 · 클래스 이름은 정적 판과 같게 두고, 정적 판의 <style> · 상호작용 CSS 를 이 화면에 있는 동안만 붙인다.
import listCss from '~/assets/css/legacy/pc-board-list.css?raw'
import interactionCss from '~/assets/css/legacy/pc-interactions.css?raw'
import PcFeedCard from '~/components/pc/PcFeedCard.vue'
import PcLoginModal from '~/components/pc/PcLoginModal.vue'
import PcToast from '~/components/pc/PcToast.vue'
import PcTopicNav from '~/components/pc/PcTopicNav.vue'
import PcWritePanel from '~/components/pc/PcWritePanel.vue'
import {
  boardConfig, boardForUrl, boardFromCategory, detailPath, paramsFromQuery, railKey, renderBoard, setRedditLayout,
  shortcutToBoard, STORE_BOARD, topMenuKey, withLayout, type Params, type PcPost,
} from '~/composables/pc/pcBoardLogic'
import {
  appHref, PC_BOARD_ROOT, readStore, savedPosts, siteHref, usePcLegacyStyles, usePcLinkClicks, usePcScenarios, usePcUi, waitForLegacyStyles, writeStore,
} from '~/composables/pc/usePcBoard'

const route = useRoute()
const router = useRouter()
const { basePosts, popularPosts, loaded, load } = usePcScenarios()
const ui = usePcUi()

// 정적 판은 주소마다 새로 읽는 값(첫 불러오기 = loadParams)과 pushState 뒤 다시 그리는 값(renderParams)이 다르다.
const loadParams = ref<Params>(paramsFromQuery(route.query))
const renderParams = ref<Params>(loadParams.value)
const sortParams = ref<Params>(loadParams.value)
const layout = computed(() => loadParams.value.layout || '')
const reddit = computed(() => layout.value === 'reddit')
const board = ref('전체 게시글') // 가운데 목록이 그리는 게시판
const menuBoard = ref('전체 게시글') // 왼쪽 메뉴 · 상단 탭이 가리키는 게시판(setCurrentBoard 때만 바뀜)
const headerQuery = ref('')
const centerQuery = ref('')
const menuOpen = ref(false)
const writeMode = ref(false)
const writeKey = ref(0)
const storeVersion = ref(0)
const ready = ref(false)
const writePanel = ref<InstanceType<typeof PcWritePanel> | null>(null)
const headerInput = ref<HTMLInputElement | null>(null)
const menuTrigger = ref<HTMLButtonElement | null>(null)
const leftPanel = ref<HTMLElement | null>(null)

usePcLegacyStyles({
  sheets: [listCss, interactionCss],
  root: PC_BOARD_ROOT,
  htmlClass: () => ['qf-font-pretendard', reddit.value ? 'layout-reddit' : '', reddit.value ? (loadParams.value.view === 'feed' ? 'view-feed' : 'view-board') : ''].filter(Boolean).join(' '),
  bodyClass: () => (menuOpen.value ? 'mobile-menu-open' : ''),
  title: () => '보배드림 커뮤니티 | 게시판',
})

// ---------- 주소 ----------
let intent: null | 'menu' | 'snapshot' | 'sort' | 'reload' = null
const internalPaths = new Set<string>()
const currentParams = () => paramsFromQuery(route.query)
const norm = (path: string) => router.resolve(path).fullPath
const href = (path: string) => appHref(path)
const listLink = (query: string) => href(setRedditLayout('/pc' + query, reddit.value))

function go(path: string, kind: 'menu' | 'snapshot' | 'sort' | 'reload') {
  if (norm(path) === route.fullPath) {
    // 같은 주소: 라우터는 움직이지 않으므로 여기서 바로 처리(정적 판은 같은 주소로 다시 그림)
    if (kind === 'reload') { init(); window.scrollTo(0, 0) } else if (kind !== 'menu') applySnapshot(kind === 'sort')
    return
  }
  intent = kind
  router.push(path)
}

function init() {
  const p = currentParams()
  // 정적 판은 새로 불러오므로 앞 화면의 포커스가 남지 않는다
  ;(document.activeElement as HTMLElement | null)?.blur?.()
  loadParams.value = p
  renderParams.value = p
  sortParams.value = p
  headerQuery.value = (p.q || '').trim()
  centerQuery.value = p.q || ''
  menuOpen.value = false
  writeMode.value = false
  internalPaths.clear()
  internalPaths.add(route.fullPath)
  ui.reset()
  ui.refreshLogin()
  setCurrentBoard(boardForUrl(p, layout.value, readStore(STORE_BOARD)), false)
}

function setCurrentBoard(name: string, push: boolean) {
  const next = boardConfig[name] ? name : '전체 게시글'
  writeStore(STORE_BOARD, next)
  menuBoard.value = next
  renderParams.value = currentParams()
  board.value = next
  storeVersion.value++
  if (push) go(withLayout('/pc?board=' + encodeURIComponent(next), layout.value), 'menu')
}

function applySnapshot(sort: boolean) {
  const p = currentParams()
  renderParams.value = p
  if (sort) sortParams.value = p
  board.value = boardForUrl(p, layout.value, readStore(STORE_BOARD))
  storeVersion.value++
}

watch(() => route.fullPath, (path) => {
  if (route.path !== '/pc') return
  const kind = intent
  intent = null
  if (kind === 'menu') { internalPaths.add(path); return }
  if (kind === 'snapshot' || kind === 'sort') { internalPaths.add(path); applySnapshot(kind === 'sort'); return }
  if (kind === 'reload' || !internalPaths.has(path)) { init(); window.scrollTo(0, 0); return }
  setCurrentBoard(boardForUrl(currentParams(), layout.value, readStore(STORE_BOARD)), false) // 뒤로 · 앞으로(popstate)
})

const onRootClick = usePcLinkClicks(path => go(path, 'reload'))

/** 주소 쿼리 하나를 바꾼 새 주소(정적 판 url.searchParams.set/delete) */
function withParam(key: string, value: string | null) {
  const i = route.fullPath.indexOf('?')
  const params = new URLSearchParams(i === -1 ? '' : route.fullPath.slice(i + 1))
  if (value === null) params.delete(key)
  else params.set(key, value)
  const qs = params.toString()
  return route.path + (qs ? '?' + qs : '')
}

// ---------- 목록 ----------
const rendered = computed(() => {
  void storeVersion.value
  const all = savedPosts().concat(basePosts.value)
  return renderBoard(board.value, renderParams.value, layout.value, all)
})
const rowHref = (post: PcPost) => href(detailPath(post[9] || boardFromCategory(post[0]) || board.value || '전체 게시글', post, layout.value))
const emptyText = computed(() => rendered.value.query ? '“' + rendered.value.query + '” 검색 결과가 없습니다.' : board.value + ' 게시판의 새 글이 없습니다.')
const feedEmptyText = computed(() => rendered.value.query ? '“' + rendered.value.query + '” 검색 결과가 없습니다.' : '새 피드가 없습니다.')
const sortKey = computed(() => sortParams.value.sort || 'latest')
const sorts = [
  { label: '인기순', key: 'popular' },
  { label: '최신순', key: 'latest' },
  { label: '추천순', key: 'recommended' },
]

// ---------- 메뉴 ----------
const topKey = computed(() => topMenuKey(renderParams.value))
const mobileKey = computed(() => topMenuKey(loadParams.value))
const primaryKey = computed(() => (reddit.value ? railKey(loadParams.value) : ''))
const topMenus = [
  { key: 'home', label: '홈', path: '/pc?view=home&layout=reddit' },
  { key: 'board', label: '게시판', path: '/pc?layout=reddit' },
  { key: 'report', label: '제보', path: '/pc?board=%EB%B8%94%EB%9E%99%EB%B0%95%EC%8A%A4&layout=reddit' },
]
const topLink = (path: string) => href(setRedditLayout(path, reddit.value))
const defectHref = href('/?board=chezhiwang-complaint')
const railPrimary = [
  { key: 'home', label: '홈', icon: 'home', query: '?view=home' },
  { key: 'popular', label: '인기', icon: 'popular', query: '?view=feed&sort=popular' },
  { key: 'news', label: '뉴스', icon: 'news', query: '?board=%EA%B3%B5%EC%A7%80' },
  { key: 'explore', label: '둘러보기', icon: 'explore', query: '' },
]
type MenuEntry = { board: string; label: string; avatar: string; newDot?: boolean }
const railGroups: { title: string; icon: string; items: MenuEntry[] }[] = [
  { title: '자동차', icon: 'news', items: [
    { board: '국산차', label: '국산차 게시판', avatar: '01' },
    { board: '수입차', label: '수입차 게시판', avatar: '02' },
    { board: '전기차', label: '전기차 게시판', avatar: '03', newDot: true },
    { board: '시승기', label: '시승기', avatar: '04' },
    { board: '정비', label: '정비/DIY', avatar: '05' },
  ] },
  { title: '블랙박스·사고', icon: 'explore', items: [
    { board: '블랙박스', label: '블랙박스 제보', avatar: '06' },
    { board: '사고/블박', label: '교통사고 상담', avatar: '07' },
    { board: '보험', label: '보험/과실 문의', avatar: '08' },
    { board: '교통법규', label: '교통법규/단속', avatar: '09' },
  ] },
  { title: '커뮤니티', icon: 'popular', items: [
    { board: '자유', label: '자유 게시판', avatar: '10' },
    { board: '유머', label: '유머 게시판', avatar: '11' },
    { board: '정치/시사', label: '정치/시사 게시판', avatar: '12' },
    { board: '베스트', label: '베스트글', avatar: '13' },
  ] },
  { title: '차량 정보', icon: 'favorite', items: [
    { board: '차량리뷰', label: '차량 리뷰', avatar: '14' },
    { board: '연비/전비', label: '연비/전비 게시판', avatar: '15' },
    { board: '결함/불만', label: '결함/불만 게시판', avatar: '16' },
  ] },
  { title: '운영 안내', icon: 'help', items: [
    { board: '공지', label: '공지사항', avatar: '17' },
    { board: '운영정책', label: '운영정책', avatar: '18' },
    { board: '문의/제보', label: '문의/오류 제보', avatar: '19' },
  ] },
]
const shortcuts = [
  { icon: 'EV', text: '전기차 충전소', meta: '312' },
  { icon: 'SUV', text: '패밀리 SUV', meta: '184' },
  { icon: 'DIY', text: '정비 / DIY', meta: '96' },
  { icon: 'BB', text: '블랙박스 제보', meta: '71' },
]
const boardHref = (name: string) => href(withLayout('/pc?board=' + encodeURIComponent(name), layout.value))
const pageNos = [2, 3, 4, 5, 6, 7, 8, 9, 10]
const unsplash = ['photo-1503736334956-4c8f8e92946d', 'photo-1549924231-f129b911e442', 'photo-1552519507-da3b142c6e3d', 'photo-1503376780353-7e6692767b70']

function onMenuItem(name: string) {
  setCurrentBoard(name, true)
}
function onLeftPanelClick(event: MouseEvent) {
  if ((event.target as HTMLElement | null)?.closest('a')) setMenu(false)
}
function onCreateCommunity() {
  if (reddit.value) ui.toast('커뮤니티 만들기 기능은 다음 단계에서 연결합니다.')
}
function openWrite() {
  writeMode.value = true
  writeKey.value++
  if (!ui.isLoggedIn()) ui.showLoginModal(() => writePanel.value?.unlock())
}
function onHeaderSearch() {
  const query = headerQuery.value.trim()
  if (!query) {
    headerInput.value?.focus()
    ui.toast('검색어를 입력해주세요.')
    return
  }
  go(withLayout('/pc?q=' + encodeURIComponent(query), layout.value), 'reload')
}
function onSort(key: string) {
  go(withParam('sort', key === 'latest' ? null : key), 'sort')
}
function onCenterSearch() {
  const query = centerQuery.value.trim()
  go(withParam('q', query || null), 'snapshot')
}
function setMenu(open: boolean) {
  menuOpen.value = open
  if (open) {
    const first = leftPanel.value?.querySelector('a') as HTMLElement | null
    if (first) setTimeout(() => first.focus(), 220)
  } else {
    menuTrigger.value?.focus()
  }
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && menuOpen.value) setMenu(false)
}

onMounted(async () => {
  await load()
  await waitForLegacyStyles('.boardTableCard')
  init()
  ready.value = true
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  ui.reset()
})
</script>

<template>
  <div v-if="ready && loaded" class="pcBoardRoot" style="display:contents" @click="onRootClick">
    <section class="loungeHero">
      <div class="loungeHeroInner">
        <div class="loungeTitleBlock">
          <button ref="menuTrigger" class="loungeMenuButton" type="button" aria-label="커뮤니티 전체 메뉴" :aria-expanded="menuOpen ? 'true' : 'false'" @click="setMenu(!menuOpen)"><img :src="communityAsset('assets/lounge-menu.svg')" alt="" aria-hidden="true"></button>
          <a class="loungeBrandHome" :href="siteHref('?qf=guazi&pc=1')" aria-label="보배드림 메인">
            <span class="loungeBrandEmblem" aria-hidden="true"><img :src="siteAsset('assets/bbm/header-logo.svg')" alt=""></span>
            <span class="loungeBrandWord" aria-hidden="true">보배드림</span>
          </a>
        </div>
        <form class="loungeSearch" role="search" @submit.prevent="onHeaderSearch">
          <button class="loungeSearchCategory" type="button" aria-label="검색 범위 커뮤니티"><span>커뮤니티</span><img :src="siteAsset('assets/icons/bb/chevron-down.svg')" alt="" aria-hidden="true"></button>
          <span class="loungeSearchDivider" aria-hidden="true" />
          <input ref="headerInput" v-model="headerQuery" class="loungeSearchInput" type="search" name="q" placeholder="보배드림 검색" autocomplete="off" aria-label="보배드림 검색">
          <button class="loungeSearchButton" type="submit" aria-label="보배드림 검색"><img :src="communityAsset('assets/lounge-search.svg')" alt="" aria-hidden="true"></button>
        </form>
        <nav class="loungeActions" aria-label="회원 메뉴">
          <a class="loungeActionIcon" :href="href('/pc?view=saved&layout=reddit')" aria-label="관심 게시글"><img :src="siteAsset('assets/icons/bb/heart.svg')" alt="" aria-hidden="true"></a>
          <a class="loungeLogin" :href="siteHref('?qf=guazi&pc=1&pcauth=member')">로그인/회원가입</a>
          <a class="loungeWrite" :href="href('/pc/write?layout=reddit')">글쓰기</a>
          <button class="loungeAccount" type="button" aria-label="로그인 및 계정 메뉴">
            <span class="loungeAccountAvatar" aria-hidden="true"><img :src="siteAsset('assets/icons/bb/mypage.svg')" alt=""></span>
            <img class="loungeAccountChevron" :src="siteAsset('assets/icons/bb/chevron-down.svg')" alt="" aria-hidden="true">
          </button>
        </nav>
      </div>
    </section>
    <nav class="mobileCommunityNav" aria-label="모바일 커뮤니티 메뉴">
      <a v-for="m in topMenus" :key="m.key" class="mobileCommunityNavItem" :class="{ active: mobileKey === m.key }" :data-top-menu="m.key" :href="topLink(m.path)" :aria-current="mobileKey === m.key ? 'page' : undefined">{{ m.label }}</a>
      <a class="mobileCommunityNavItem" data-top-menu="defect" :href="defectHref">결함</a>
    </nav>
    <button class="mobileMenuBackdrop" type="button" aria-label="커뮤니티 메뉴 닫기" @click="setMenu(false)" />
    <nav class="loungeNav" aria-label="보배드림 커뮤니티 메뉴">
      <div class="loungeNavInner">
        <a v-for="m in topMenus" :key="m.key" class="loungeTab" :class="{ active: topKey === m.key }" :data-top-menu="m.key" :href="topLink(m.path)" :aria-current="topKey === m.key ? 'page' : undefined">{{ m.label }}</a>
        <a class="loungeTab" data-top-menu="defect" :href="defectHref">결함</a>
      </div>
    </nav>
    <PcTopicNav :params="renderParams" :layout="layout" />
    <main class="pageWrap">
      <section class="topBanner" aria-label="광고">
        <div class="bannerCopy">국산·수입·전기차 오너들의 실시간 자동차 이야기</div>
        <span class="adBadge">AD</span>
      </section>
      <div class="layoutGrid">
        <aside ref="leftPanel" class="leftPanel" aria-label="게시판 메뉴" @click="onLeftPanelClick">
          <section class="sideCard leftMenu chzzkRail">
            <nav class="railPrimary" aria-label="커뮤니티 주요 메뉴">
              <a v-for="r in railPrimary" :key="r.key" class="railPrimaryItem" :class="{ active: primaryKey === r.key }" :data-rail-key="r.key" :href="listLink(r.query)" :aria-current="primaryKey === r.key ? 'page' : undefined"><img class="railNavIcon" :src="communityAsset(`assets/reddit-rail/${r.icon}.svg`)" alt="">{{ r.label }}</a>
              <button class="railPrimaryItem" data-community-create type="button" @click="onCreateCommunity"><img class="railNavIcon" :src="communityAsset('assets/reddit-rail/create-community.svg')" alt="">커뮤니티 만들기</button>
            </nav>
            <button class="writeButton" @click="openWrite">글쓰기</button>
            <a class="menuItem has-avatar railAll" :class="{ active: menuBoard === '전체 게시글' }" data-board-name="전체 게시글" data-board="전체 게시글" :href="boardHref('전체 게시글')" @click.prevent="onMenuItem('전체 게시글')"><span class="boardAvatar avatar-20" aria-hidden="true" />전체 게시글</a>
            <section v-for="group in railGroups" :key="group.title" class="railGroup">
              <div class="railGroupHeader"><img class="railGroupIcon" :src="communityAsset(`assets/reddit-rail/${group.icon}.svg`)" alt="">{{ group.title }}</div>
              <div class="railGroupBody">
                <a v-for="item in group.items" :key="item.board" class="menuItem has-avatar" :class="{ active: menuBoard === item.board }" :data-board-name="item.board" :data-board="item.board" :href="boardHref(item.board)" @click.prevent="onMenuItem(item.board)"><span :class="`boardAvatar avatar-${item.avatar}`" aria-hidden="true" />{{ item.label }}<span v-if="item.newDot" class="newDot" /></a>
              </div>
            </section>
          </section>
          <section class="sideCard imagePanel">
            <div class="imagePanelHead"><strong>이미지</strong><span>더보기</span></div>
            <div class="imageGrid">
              <img v-for="id in unsplash" :key="id" :src="`https://images.unsplash.com/${id}?auto=format&fit=crop&w=180&q=70`" alt="">
            </div>
          </section>
          <section class="sideCard guidePanel">
            <a class="guideItem" href="#"><span class="guideIcon">?</span>라운지 이용 안내</a>
            <a class="guideItem" href="#"><span class="guideIcon">✓</span>미션/보상 안내</a>
          </section>
        </aside>
        <section class="centerPanel" aria-label="보배드림 게시글 목록">
          <PcWritePanel v-if="writeMode" ref="writePanel" :key="writeKey" :layout="layout" :board-param="renderParams.board || null" @navigate="(p) => go(p, 'reload')" />
          <template v-else>
            <section class="boardTitleArea">
              <strong>{{ rendered.title }}</strong>
            </section>
            <section class="articleControl" aria-label="게시글 필터">
              <div class="sortFilters">
                <button v-for="s in sorts" :key="s.key" class="sortButton" :class="{ active: sortKey === s.key }" @click="onSort(s.key)"><img class="sortCheckIcon" :src="communityAsset('assets/reddit-ui/sort-check.svg')" alt="" aria-hidden="true">{{ s.label }}</button>
              </div>
              <div class="searchBox">
                <select class="searchSelect" aria-label="검색 범위">
                  <option>제목+내용</option>
                  <option>제목</option>
                  <option>작성자</option>
                </select>
                <label class="searchInputWrap">
                  <input v-model="centerQuery" type="search" placeholder="게시글 검색" @keydown.enter.prevent="onCenterSearch">
                  <span class="smallSearchIcon" aria-hidden="true" />
                </label>
              </div>
            </section>
            <section class="cleanBot">
              <span class="botIcon" aria-hidden="true" />
              <span>클린봇이 악성 게시글을 감지합니다.</span>
              <button class="cleanSetting">설정</button>
            </section>
            <section id="redditFeed" class="redditFeed" aria-label="커뮤니티 게시글 피드">
              <div v-if="!rendered.posts.length" class="emptyBoardRows">{{ feedEmptyText }}</div>
              <template v-else><PcFeedCard v-for="(post, i) in rendered.posts.slice(0, 24)" :key="i + post[1]" :post="post" :href="rowHref(post)" /></template>
            </section>
            <section class="boardTableCard">
              <table class="boardTable">
                <caption>게시글 목록</caption>
                <colgroup>
                  <col style="width:389px">
                  <col style="width:110px">
                  <col style="width:75px">
                  <col style="width:60px">
                  <col style="width:60px">
                </colgroup>
                <thead>
                  <tr>
                    <th class="titleHead">제목</th>
                    <th class="authorHead">작성자</th>
                    <th>작성일</th>
                    <th>조회수</th>
                    <th>추천</th>
                  </tr>
                </thead>
                <tbody id="postRows">
                  <tr v-if="!rendered.posts.length"><td colspan="5" class="emptyBoardRows">{{ emptyText }}</td></tr>
                  <template v-else><tr v-for="(post, i) in rendered.posts" :key="i + post[1]" :class="{ isNotice: post[10] === true }">
                    <td><div class="boardTitleCell"><img v-if="post[10] === true" class="boardNoticeIcon" :src="communityAsset('assets/radix-drawing-pin-filled-white.svg')" alt="고정"><span class="boardLabel">{{ post[0] }}</span><a class="articleTitle" :href="rowHref(post)">{{ post[1] }}</a><span v-if="post[6]" class="replyNum">({{ post[6] }})</span><span v-if="post[0] === '사고/블박'" class="locked">!</span></div></td>
                    <td class="authorCell">{{ post[2] }}</td>
                    <td class="centerCell">{{ post[3] }}</td>
                    <td class="centerCell">{{ post[4] }}</td>
                    <td class="centerCell">{{ post[5] }}</td>
                  </tr></template>
                </tbody>
              </table>
            </section>
            <nav class="pagination" aria-label="페이지">
              <span class="pageNo active">1</span>
              <a v-for="n in pageNos" :key="n" class="pageNo" href="#">{{ n }}</a>
              <button class="pageNext" aria-label="다음 페이지">›</button>
            </nav>
          </template>
        </section>
        <aside class="rightPanel" aria-label="우측 게시판">
          <section class="popularCard">
            <strong class="rightCardTitle">이 커뮤니티 인기글</strong>
            <ol id="popularList" class="rightList">
              <li v-for="(item, i) in popularPosts" :key="i" class="rightItem"><a class="rightLink" href="#"><span class="rightText">{{ item[0] }}</span><span class="rightReply">({{ item[1] }})</span></a></li>
            </ol>
          </section>
          <section class="hotBoards">
            <strong class="rightCardTitle">오늘 뜨는 게시판</strong>
            <a v-for="s in shortcuts" :key="s.text" class="boardShortcut" :href="boardHref(shortcutToBoard(s.text))" @click.prevent="setCurrentBoard(shortcutToBoard(s.text), true)"><span class="shortcutIcon">{{ s.icon }}</span><span class="shortcutText">{{ s.text }}</span><span class="shortcutMeta">{{ s.meta }}</span></a>
          </section>
          <section class="rightAd" aria-label="광고"><span class="adBadge">AD</span></section>
        </aside>
      </div>
    </main>
    <button class="writeButton mobileWriteButton" type="button" @click="openWrite">글쓰기</button>
    <footer class="footer">
      보배드림 이용약관 · 커뮤니티 가이드 · 개인정보 처리방침 · 고객센터 · 서비스 소개 및 제휴 안내
    </footer>
    <PcLoginModal />
    <PcToast />
  </div>
</template>
