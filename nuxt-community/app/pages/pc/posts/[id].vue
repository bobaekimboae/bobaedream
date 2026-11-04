<script setup lang="ts">
// PC 게시글 상세 — 정적 public/community/bobaedream-pc-board-detail.html(+ bobaedream-pc-interactions.js) 이식 (2026-11-04)
// 정적 판 DETAIL_PAGE?board=…&post=…&postId=… 는 /pc/posts/<postId|view>?board=…&post=…&postId=… 로 옮겼다.
import detailCss from '~/assets/css/legacy/pc-board-detail.css?raw'
import interactionCss from '~/assets/css/legacy/pc-interactions.css?raw'
import PcLoginModal from '~/components/pc/PcLoginModal.vue'
import PcToast from '~/components/pc/PcToast.vue'
import PcTopicNav from '~/components/pc/PcTopicNav.vue'
import PcWritePanel from '~/components/pc/PcWritePanel.vue'
import { baseComments, fromSaved, type PcComment, type SavedComment } from '~/composables/pc/pcDetailComments'
import { detailCopyFor, findPost, paramsFromQuery, setRedditLayout, STORE_BOARD, STORE_LOGIN, withLayout } from '~/composables/pc/pcBoardLogic'
import {
  appHref, PC_BOARD_ROOT, readStore, savedPosts, siteHref, usePcLegacyStyles, usePcLinkClicks, usePcScenarios, usePcUi, waitForLegacyStyles, writeStore,
} from '~/composables/pc/usePcBoard'

// 정적 판은 화면마다 새로 불러와 맨 위에서 시작하고, 로그인 상태면 댓글 입력칸에 포커스(그 자리로 스크롤)한다.
// 라우터의 「이동 뒤 맨 위로」가 포커스 스크롤을 덮지 않도록 맨 위로 올리기는 init() 에서 직접 한다.
definePageMeta({ scrollToTop: false })

const route = useRoute()
const router = useRouter()
const { basePosts, loaded, load } = usePcScenarios()
const ui = usePcUi()

const params = ref(paramsFromQuery(route.query))
const layout = computed(() => params.value.layout || '')
const reddit = computed(() => layout.value === 'reddit')
const ready = ref(false)
const board = ref('국산차 오너톡')
const headerQuery = ref('')
const writeMode = ref(false)
const writeKey = ref(0)
const writePanel = ref<InstanceType<typeof PcWritePanel> | null>(null)
const headerInput = ref<HTMLInputElement | null>(null)
const commentInput = ref<HTMLTextAreaElement | null>(null)
const listEl = ref<HTMLElement | null>(null)

// 글 내용(찾지 못하면 정적 HTML 기본값)
const title = ref('신형 쏘렌토 하이브리드 6개월 타보고 느낀 장단점')
const body = ref('출고 6개월, 누적 9,800km 기준으로 시내 연비와 2열 승차감은 만족인데 브레이크 초반 감각은 아직 적응 중입니다.')
const author = ref('하이브리드실사용자')
const authorLevel = ref('LV 23')
const metaTime = ref('18분 전')
const metaViews = ref('2,184')
const docTitle = ref('보배드림 커뮤니티 | 게시글 상세')

const votes = reactive({ buff: 42, nerf: 3, buffActive: true, nerfActive: false })
const bookmarked = ref(false)
const composerActive = ref(false)
const commentText = ref('')
const comments = ref<PcComment[]>([])
const order = ref('등록순')
const refreshTurn = ref(false)

usePcLegacyStyles({
  sheets: [detailCss, interactionCss],
  root: PC_BOARD_ROOT,
  htmlClass: () => ['qf-font-pretendard', reddit.value ? 'layout-reddit' : ''].filter(Boolean).join(' '),
  title: () => docTitle.value,
})

const href = (path: string) => appHref(path)
const listLink = (query: string) => href(setRedditLayout('/pc' + query, reddit.value))
const boardHref = (name: string) => href(withLayout('/pc?board=' + encodeURIComponent(name), layout.value))
const postId = computed(() => params.value.postId || (route.params.id && route.params.id !== 'view' ? String(route.params.id) : null))
const commentKey = () => 'bobaePcComments:' + (postId.value || params.value.post || title.value || 'default')
const commentTotal = computed(() => comments.value.length + comments.value.reduce((n, c) => n + c.replies.length, 0))
const isReady = computed(() => composerActive.value && commentText.value.length > 0)

const loungeTabs = [
  { label: '홈', query: '?view=home' },
  { label: '피드', query: '?view=feed' },
  { label: '자동차', query: '?section=car' },
  { label: '유머', query: '?section=humor' },
  { label: '정치/시사', query: '?section=politics' },
]
const railPrimary = [
  { label: '홈', query: '?view=home' },
  { label: '피드', query: '?view=feed' },
  { label: '게시판', query: '' },
  { label: '유머', query: '?board=%EC%9C%A0%EB%A8%B8' },
  { label: '정치', query: '?board=%EC%A0%95%EC%B9%98' },
]
const menuSections: { title?: string; items: { name: string; newDot?: boolean }[] }[] = [
  { items: [{ name: '전체 게시글' }] },
  { title: '커뮤니티', items: [{ name: '공지' }, { name: '자유' }, { name: '질문' }, { name: '시승기' }, { name: '출석체크' }] },
  { title: '차량 이야기', items: [{ name: '국산차 오너톡', newDot: true }, { name: '수입차 라운지' }, { name: '전기차 충전소', newDot: true }, { name: 'SUV 패밀리카' }, { name: '화물·특장' }] },
  { title: '구매/정비', items: [{ name: '중고차 문의' }, { name: '정비 상담', newDot: true }, { name: '튜닝 인증' }, { name: '보험·사고' }, { name: '블랙박스 제보' }] },
]
const unsplash = ['photo-1503736334956-4c8f8e92946d', 'photo-1549924231-f129b911e442', 'photo-1552519507-da3b142c6e3d', 'photo-1503376780353-7e6692767b70']
const popular: [string, number][] = [
  ['고속도로 2차 사고, 블박 판단 부탁드립니다', 18], ['신형 팰리세이드 실내 잡소리 잡은 후기', 11], ['전기차 충전구역 신고 기준 이렇게 바뀌나요', 24],
  ['중고차 성능점검표 믿어도 되는 항목 정리', 5], ['첫차 보험료 비교하다가 멘붕 왔습니다', 4], ['타이어 편마모 사진 봐주실 분 계신가요', 7],
  ['하이브리드 배터리 보증 조건 다시 확인하세요', 7], ['주차장 문콕 합의금 적정선 질문드립니다', 28], ['출고 인증 사진 찍기 좋은 장소 모음', 5],
  ['엔진오일 교환 주기, 실제 오너들 의견은', 27],
]
const latestRepair: [string, number][] = [
  ['아침 냉간 시동 때 떨림이 심합니다', 2], ['아이오닉6 장거리 실전 전비 공유', 8], ['브레이크 패드 교체 견적 이 정도면 맞나요', 3],
  ['겨울 대비 배터리 점검 받은 후기', 1], ['신차 검수 체크리스트 다시 정리했습니다', 9], ['오토홀드 꺼짐 증상 서비스센터 다녀왔습니다', 6],
  ['연비 운전한다고 너무 천천히 가면 위험합니다', 4], ['딜러 서비스 품목 어디까지 받으셨나요', 12], ['블랙박스 상시 녹화 배터리 방전 질문', 5],
  ['스노우 타이어 예약 벌써 마감되는 곳 있네요', 7],
]
const latestRows: [string, string][] = [
  ['고속도로 반자율 주행, 비 오는 날 차선 인식 후기', '2시간 전'],
  ['2열 카시트 두 개 설치하면 가운데 자리 실제로 쓸만한가요', '어제'],
  ['하이브리드 겨울 연비 떨어지는 구간 공유합니다', '3일 전'],
]

function init() {
  const p = paramsFromQuery(route.query)
  // 정적 판은 새로 불러오므로 앞 화면의 포커스가 남지 않는다
  ;(document.activeElement as HTMLElement | null)?.blur?.()
  params.value = p
  headerQuery.value = (p.q || '').trim()
  writeMode.value = false
  ui.reset()
  board.value = p.board || readStore(STORE_BOARD) || '국산차 오너톡'
  // 새로 불러온 화면과 같게 정적 HTML 기본값으로 되돌린다
  Object.assign(votes, { buff: 42, nerf: 3, buffActive: true, nerfActive: false })
  bookmarked.value = false
  order.value = '등록순'
  title.value = '신형 쏘렌토 하이브리드 6개월 타보고 느낀 장단점'
  body.value = '출고 6개월, 누적 9,800km 기준으로 시내 연비와 2열 승차감은 만족인데 브레이크 초반 감각은 아직 적응 중입니다.'
  author.value = '하이브리드실사용자'
  authorLevel.value = 'LV 23'
  metaTime.value = '18분 전'
  metaViews.value = '2,184'
  docTitle.value = '보배드림 커뮤니티 | 게시글 상세'
  const post =findPost(savedPosts().concat(basePosts.value), postId.value, p.post)
  if (post) {
    title.value = post[1]
    body.value = post[7] || detailCopyFor(board.value, post[1])
    author.value = post[2]
    authorLevel.value = 'LV 2'
    metaTime.value = post[3]
    metaViews.value = String(post[4])
    docTitle.value = post[1] + ' : 보배드림 자동차토론'
  }
  // 댓글: 기본 10개 위에 저장된 댓글(최신이 맨 위)
  let saved: SavedComment[] = []
  try { saved = JSON.parse(readStore(commentKey()) || '[]') } catch { saved = [] }
  comments.value = saved.map(fromSaved).concat(baseComments())
  composerActive.value = false
  commentText.value = ''
  window.scrollTo(0, 0)
  ui.refreshLogin()
  if (ui.loggedIn.value) activateComposer()
}

// ---------- 링크 ----------
const onRootClick = usePcLinkClicks(path => {
  if (router.resolve(path).fullPath === route.fullPath) { init(); return }
  router.push(path)
})
watch(() => route.fullPath, () => {
  if (route.path.startsWith('/pc/posts/')) init()
})

function onHeaderSearch() {
  const query = headerQuery.value.trim()
  if (!query) {
    headerInput.value?.focus()
    ui.toast('검색어를 입력해주세요.')
    return
  }
  router.push(withLayout('/pc?q=' + encodeURIComponent(query), layout.value))
}

// ---------- 글쓰기 ----------
function openWrite() {
  writeMode.value = true
  writeKey.value++
  if (!ui.isLoggedIn()) ui.showLoginModal(() => writePanel.value?.unlock())
}

// ---------- 반응 ----------
function vote(kind: 'buff' | 'nerf') {
  votes[kind] += 1
  if (kind === 'buff') votes.buffActive = true
  else votes.nerfActive = true
}

// ---------- 댓글 ----------
function activateComposer() {
  writeStore(STORE_LOGIN, '1')
  ui.refreshLogin()
  if (!composerActive.value) {
    composerActive.value = true
    nextTick(() => commentInput.value?.focus())
  }
}
function onComposerClick(event: MouseEvent) {
  if ((event.target as HTMLElement).closest('.registerButton,.composerTool')) return
  if (!ui.isLoggedIn()) ui.showLoginModal(activateComposer)
}
function onRegister() {
  if (!ui.isLoggedIn()) { ui.showLoginModal(activateComposer); return }
  const text = commentText.value.trim()
  if (!composerActive.value) return
  if (!text) {
    ui.toast('댓글을 입력해주세요.')
    commentInput.value?.focus()
    return
  }
  const saved: SavedComment = { author: '시안계정', level: 'LV 2', text, time: '방금 전', buff: 0, nerf: 0 }
  comments.value.unshift(fromSaved(saved))
  let list: SavedComment[] = []
  try { list = JSON.parse(readStore(commentKey()) || '[]') } catch { list = [] }
  list.unshift(saved)
  writeStore(commentKey(), JSON.stringify(list.slice(0, 20)))
  commentText.value = ''
  ui.toast('댓글이 등록되었습니다.')
}
function onTool(label: string) {
  if (!ui.isLoggedIn()) ui.showLoginModal(activateComposer)
  else ui.toast(label + ' 기능은 시안용 상태입니다.')
}
function ensureLoggedIn(action: () => void) {
  if (ui.isLoggedIn()) action()
  else ui.showLoginModal(() => { activateComposer(); action() })
}
function openReply(comment: PcComment) {
  ensureLoggedIn(() => {
    comments.value.forEach(c => { c.composer = false })
    comment.composer = true
    comment.replyDraft = ''
    nextTick(() => (listEl.value?.querySelector('.replyTextarea') as HTMLTextAreaElement | null)?.focus())
  })
}
function cancelReply(comment: PcComment) { comment.composer = false }
function submitReply(comment: PcComment) {
  const text = comment.replyDraft.trim()
  if (!text) {
    ui.toast('답글을 입력해주세요.')
    ;(listEl.value?.querySelector('.replyTextarea') as HTMLTextAreaElement | null)?.focus()
    return
  }
  comment.replies.unshift(text)
  comment.composer = false
  ui.toast('답글이 등록되었습니다.')
}
function smallVote(comment: PcComment, kind: 'buff' | 'nerf') {
  comment[kind] = (comment[kind] || 0) + 1
}
function toggleMenu(comment: PcComment) {
  const wasOpen = comment.menu
  comments.value.forEach(c => { c.menu = false })
  if (!wasOpen) comment.menu = true
}
function menuAction(comment: PcComment, label: string) {
  ui.toast(label + ' 처리했습니다.')
  comment.menu = false
}
function toggleOrder() {
  const next = order.value === '등록순' ? '최신순' : '등록순'
  order.value = next
  comments.value.reverse()
  ui.toast(next + '으로 정렬했습니다.')
}
function refresh() {
  refreshTurn.value = true
  setTimeout(() => { refreshTurn.value = false }, 180)
  ui.toast('댓글을 새로고침했습니다.')
}

onMounted(async () => {
  await load()
  await waitForLegacyStyles('.commentSection')
  ready.value = true
  init()
})
onBeforeUnmount(() => ui.reset())
</script>

<template>
  <div v-if="ready && loaded" class="pcBoardRoot" style="display:contents" @click="onRootClick">
    <section class="loungeHero">
      <div class="loungeHeroInner">
        <div class="loungeTitleBlock">
          <button class="loungeMenuButton" type="button" aria-label="커뮤니티 전체 메뉴"><img :src="communityAsset('assets/lounge-menu.svg')" alt="" aria-hidden="true"></button>
          <a class="loungeBrandHome" :href="siteHref('?qf=guazi&pc=1')" aria-label="보배드림 메인">
            <img class="loungeBrandLogo" :src="siteAsset('assets/bbm/main-home-logo.svg')" alt="보배드림">
          </a>
          <span class="loungeBrandDivider" aria-hidden="true" />
          <h1>커뮤니티</h1>
        </div>
        <form class="loungeSearch" role="search" @submit.prevent="onHeaderSearch">
          <button class="loungeSearchButton" type="submit" aria-label="커뮤니티 검색"><img :src="communityAsset('assets/lounge-search.svg')" alt="" aria-hidden="true"></button>
          <input ref="headerInput" v-model="headerQuery" class="loungeSearchInput" type="search" name="q" placeholder="커뮤니티 게시글 검색" autocomplete="off" aria-label="커뮤니티 게시글 검색">
        </form>
      </div>
    </section>
    <nav class="loungeNav" aria-label="라운지 메뉴">
      <div class="loungeNavInner">
        <a v-for="t in loungeTabs" :key="t.label" class="loungeTab" :href="listLink(t.query)">{{ t.label }}</a>
      </div>
    </nav>
    <PcTopicNav :params="params" :layout="layout" />
    <main class="pageWrap">
      <section class="topBanner" aria-label="광고">
        <div class="bannerCopy">국산·수입·전기차 오너들의 실시간 자동차 이야기</div>
        <span class="adBadge">AD</span>
      </section>
      <div class="layoutGrid">
        <aside class="leftPanel" aria-label="게시판 메뉴">
          <section class="sideCard leftMenu">
            <nav class="railPrimary" aria-label="커뮤니티 주요 메뉴">
              <a v-for="r in railPrimary" :key="r.label" class="railPrimaryItem" :href="listLink(r.query)">{{ r.label }}</a>
            </nav>
            <button class="writeButton" @click="openWrite">글쓰기</button>
            <div v-for="(sec, i) in menuSections" :key="i" class="menuSection">
              <strong v-if="sec.title" class="menuTitle">{{ sec.title }}</strong>
              <a v-for="item in sec.items" :key="item.name" class="menuItem" :class="{ active: board === item.name }" :data-board="item.name" :href="boardHref(item.name)">{{ item.name }}<span v-if="item.newDot" class="newDot" /></a>
            </div>
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
        <section class="centerPanel" aria-label="보배드림 게시글 상세">
          <PcWritePanel v-if="writeMode" ref="writePanel" :key="writeKey" :layout="layout" :board-param="params.board || null" @navigate="(p) => router.push(p)" />
          <template v-else>
            <div class="detailNav" aria-label="게시글 이동">
              <a class="detailButton list" :href="listLink('')">목록</a>
              <a class="detailButton prev" href="#"><span class="chev" aria-hidden="true" />이전글</a>
              <a class="detailButton next" href="#">다음글<span class="chev" aria-hidden="true" /></a>
            </div>
            <article class="detailCard">
              <header class="articleTop">
                <a class="boardCrumb" :href="boardHref(board)">{{ board }}</a>
                <strong class="feedTitle">{{ title }}</strong>
                <div class="postInfo">
                  <span class="authorAvatar"><img src="https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?auto=format&fit=crop&w=80&q=70" alt=""></span>
                  <strong class="authorName">{{ author }}<span class="level">{{ authorLevel }}</span></strong>
                  <div class="metaLine"><span>{{ metaTime }}</span><span>조회수 {{ metaViews }}</span></div>
                  <div class="postTools" aria-label="게시글 도구">
                    <button class="toolIcon bookmarkToggle" :class="{ active: bookmarked }" aria-label="북마크" @click="bookmarked = !bookmarked"><span class="bookmarkIcon" /></button>
                    <button class="toolIcon" aria-label="메뉴"><span class="dotsIcon" /></button>
                  </div>
                </div>
              </header>
              <div class="articleBody">
                <p class="postText">{{ body }}</p>
                <section class="authorLatest" aria-label="작성자의 최신 글">
                  <div class="latestHead">
                    <span class="latestAvatar" />
                    <strong class="latestName">하이브리드실사용자 <span>님의 최신 글</span></strong>
                    <a class="latestMore" href="#">더보기</a>
                  </div>
                  <ul class="latestRows">
                    <li v-for="row in latestRows" :key="row[0]"><span class="latestTitle">{{ row[0] }}</span><span class="latestTime">{{ row[1] }}</span></li>
                  </ul>
                </section>
              </div>
              <div class="voteArea" aria-label="게시글 반응">
                <button class="votePill" :class="{ active: votes.buffActive }" data-vote="buff" @click="vote('buff')">추천<span class="num">{{ votes.buff }}</span></button>
                <button class="votePill" :class="{ active: votes.nerfActive }" data-vote="nerf" @click="vote('nerf')">비추천<span class="num">{{ votes.nerf }}</span></button>
              </div>
              <section class="commentSection" aria-label="댓글">
                <div class="commentHead">
                  <strong class="commentCount">댓글 {{ commentTotal }}</strong>
                  <button class="refreshButton" aria-label="새로고침" :style="refreshTurn ? { transform: 'rotate(180deg)' } : undefined" @click="refresh">↻</button>
                  <button class="orderButton" @click="toggleOrder">{{ order }}</button>
                </div>
                <div class="commentNotice"><span class="noticeIcon">!</span>모두가 즐기는 커뮤니티가 될 수 있도록 과도한 비난 댓글은 자제 부탁드립니다.</div>
                <div class="commentComposer" aria-label="댓글 입력" @click="onComposerClick">
                  <span class="composerAvatar" />
                  <textarea v-if="composerActive" ref="commentInput" v-model="commentText" class="commentTextarea" maxlength="5000" placeholder="댓글을 입력해주세요." />
                  <div v-else class="composerGuide">로그인 후 작성하실 수 있습니다.</div>
                  <div class="composerBottom">
                    <span class="counter">{{ composerActive ? commentText.length : 0 }}/5000</span>
                    <button class="composerTool" aria-label="스티커 추가" @click="onTool('스티커 추가')">S</button>
                    <button class="composerTool" aria-label="이모지 추가" @click="onTool('이모지 추가')">E</button>
                    <button class="composerTool" aria-label="사진 추가" @click="onTool('사진 추가')">P</button>
                    <button class="composerTool" aria-label="비밀 댓글" @click="onTool('비밀 댓글')">L</button>
                    <button class="registerButton" :class="{ isReady }" @click="onRegister">등록</button>
                  </div>
                </div>
                <div class="cleanBot"><span class="botIcon" />클린봇이 악성 댓글을 감지합니다.<button class="botSetting" aria-label="설정" /></div>
                <ul ref="listEl" class="commentList">
                  <li v-for="c in comments" :key="c.id" class="commentItem" :class="{ long: c.long, hasReplyComposer: c.composer }">
                    <span class="commentAvatar"><img v-if="c.avatar" :src="c.avatar" alt=""></span>
                    <div class="commentAuthor">{{ c.author }} <span class="level">{{ c.level }}</span><span v-if="c.badge" class="authorBadge">{{ c.badge }}</span></div>
                    <button class="commentMore" aria-label="더보기" @click="toggleMenu(c)" />
                    <p class="commentText">{{ c.text }}</p>
                    <div class="commentMeta">{{ c.time }} <button class="replyWrite" @click.prevent="openReply(c)">답글 쓰기</button></div>
                    <div v-if="c.composer" class="replyComposer"><textarea v-model="c.replyDraft" class="replyTextarea" maxlength="1000" placeholder="답글을 입력해주세요." /><div class="replyActions"><button class="replyCancel" @click="cancelReply(c)">취소</button><button class="replySubmit" @click="submitReply(c)">등록</button></div></div>
                    <div v-for="(reply, ri) in c.replies" :key="ri" class="replyItem"><b>시안계정 <span class="level">LV 2</span></b>{{ reply }}</div>
                    <div class="commentActions"><button class="smallVote" @click="smallVote(c, 'buff')">추천<span v-if="c.buff !== null" class="num">{{ c.buff }}</span></button><button class="smallVote" @click="smallVote(c, 'nerf')">비추천<span v-if="c.nerf !== null" class="num">{{ c.nerf }}</span></button></div>
                    <div v-if="c.menu" class="commentActionMenu"><button @click="menuAction(c, '신고')">신고</button><button @click="menuAction(c, '링크 복사')">링크 복사</button></div>
                  </li>
                </ul>
                <div class="commentPager"><span>1</span></div>
              </section>
            </article>
          </template>
        </section>
        <aside class="rightPanel" aria-label="추천 게시글">
          <section class="popularCard">
            <strong class="rightCardTitle">커뮤니티 인기글</strong>
            <ul class="rightList">
              <li v-for="item in popular" :key="item[0]" class="rightItem"><a class="rightLink" href="#"><span class="rightText">{{ item[0] }}</span><span class="rightReply">({{ item[1] }})</span></a></li>
            </ul>
          </section>
          <section class="hotBoards">
            <strong class="rightCardTitle">정비/시승 최신글</strong>
            <ul class="rightList">
              <li v-for="item in latestRepair" :key="item[0]" class="rightItem"><a class="rightLink" href="#"><span class="rightText">{{ item[0] }}</span><span class="rightReply">({{ item[1] }})</span></a></li>
            </ul>
          </section>
          <section class="pointQuest">
            <strong>pay 포인트 퀘스트</strong>
            <div class="pointItem"><span class="pointLogo">SK</span><div class="pointCopy"><b>즉시 8,300원 받기</b><span>자동차 보험 비교하면</span></div></div>
            <div class="pointItem"><span class="pointLogo">EV</span><div class="pointCopy"><b>즉시 1,200원 받기</b><span>충전 멤버십 가입하면</span></div></div>
          </section>
          <section class="rightAd" aria-label="광고"><span class="adBadge">AD</span></section>
        </aside>
      </div>
    </main>
    <footer class="footer">보배드림 이용약관&nbsp;&nbsp;&nbsp;커뮤니티 가이드&nbsp;&nbsp;&nbsp;개인정보 처리방침&nbsp;&nbsp;&nbsp;고객센터&nbsp;&nbsp;&nbsp;제휴 안내&nbsp;&nbsp;&nbsp;ⓒ BOBAE DREAM Mockup</footer>
    <PcLoginModal />
    <PcToast />
  </div>
</template>
