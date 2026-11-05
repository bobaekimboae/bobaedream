<script setup lang="ts">
// 커뮤니티 모바일 게시글 상세 — 정적 public/community/chzzk-detail.html · chzzk-detail.js 이식 (2026-11-04)
// DOM 구조·클래스 이름은 정적 판과 같게 두고, CSS 는 정적 판 파일(chzzk-detail.css · community-poll.css · news-card.css)을
// 이 화면이 떠 있는 동안만 <link>로 붙인다. 데이터는 public/community 의 시나리오·게시판 테이블 전역 값을 쓴다.
// 정적 판과 다른 점: 글 번호는 경로(/posts/:id), 댓글 공유 주소는 #앵커 대신 ?comment=앵커(해시 라우팅 충돌).
import neutralizeCss from '~/assets/css/legacy/detail-neutralize.css?raw'
import { attachInlineStyle, attachStyles, communityUrl } from '~/composables/detail/legacyAssets'
import { buildDetailModel, legacyWin, loadDetailScripts } from '~/composables/detail/detailData'
import type { DetailModel } from '~/composables/detail/detailData'
import { localBodyParts } from '~/composables/detail/localBody'
import { clearDocClasses, setDocClasses } from '~/composables/detail/docClasses'
import type { DetailComment, LatestItem } from '~/composables/detail/types'

const route = useRoute()
const router = useRouter()
const ic = (path: string) => communityAsset(path)

const ready = ref(false)
const model = ref<DetailModel | null>(null)
const up = ref(false)
const down = ref(false)
const bookmarked = ref(false)
const reposted = ref(false)
const commentItems = ref<DetailComment[]>([])
const itemsRendered = ref(false)
const latestItems = ref<LatestItem[]>([])
const inputValue = ref('')
const placeholder = ref('댓글을 입력하세요.')
const replyTarget = ref<{ id: string; parentId: string; user: string } | null>(null)
const editTarget = ref<{ id: string; parentId: string } | null>(null)
const contextCreated = ref(false)
const contextHidden = ref(false)
const contextLabel = ref('')
const menuCreated = ref(false)
const menuHidden = ref(true)
const menuOpen = ref(false)
const menuTarget = ref<{ id: string; parentId: string }>({ id: '', parentId: '' })
const toastText = ref('')
const toastShow = ref(false)
const commentInputEl = ref<HTMLInputElement | null>(null)
const commentsEl = ref<HTMLElement | null>(null)

const docKey = Symbol('community-detail')
let toastTimer: ReturnType<typeof setTimeout> | undefined
let menuTimer: ReturnType<typeof setTimeout> | undefined
let detachStyles: (() => void) | undefined
let detachNeutralize: (() => void) | undefined

const isNotice = computed(() => !!model.value?.isNotice)
const disabledComposer = computed(() => !!model.value?.commentsDisabled)
const score = computed(() => (model.value?.likesBase ?? 16) + (up.value ? 1 : 0) - (down.value ? 1 : 0))
const showItems = computed(() => model.value?.commentMode === 'items' || itemsRendered.value)
const commentTotal = computed(() => showItems.value ? commentItems.value.reduce((sum, item) => sum + 1 + (item.replies || []).length, 0) : 2)
const inputReady = computed(() => inputValue.value.trim().length > 0)

useHead({ title: computed(() => model.value?.documentTitle || '보배드림 커뮤니티 | 게시글') })

function showToast(message: string) {
  toastText.value = message
  toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastShow.value = false }, 1300)
}

const listRoute = () => ({ path: '/', query: { v: '20261015chzzk' } })

function init() {
  const next = buildDetailModel(route.query as Record<string, unknown>, String(route.params.id || ''), localBodyParts)
  model.value = next
  up.value = false
  down.value = false
  bookmarked.value = false
  reposted.value = false
  commentItems.value = next.commentItems
  itemsRendered.value = false
  latestItems.value = next.latestItems
  inputValue.value = ''
  placeholder.value = next.commentsDisabled ? '댓글을 쓸 수 없는 게시글입니다.' : '댓글을 입력하세요.'
  replyTarget.value = null
  editTarget.value = null
  contextCreated.value = false
  setDocClasses(docKey, ['qf-font-pretendard', 'bbmDetailHtml'], next.bodyClasses)
  nextTick(() => {
    const photo = next.photoTarget
    if (route.query.from === 'discussion' && photo > 1) requestAnimationFrame(() => document.getElementById(`detailPhoto${photo}`)?.scrollIntoView({ block: 'start' }))
    const anchor = String(route.query.comment || '')
    if (anchor) requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView())
  })
}

onMounted(async () => {
  setDocClasses(docKey, ['qf-font-pretendard', 'bbmDetailHtml'], [])
  detachNeutralize = attachInlineStyle(neutralizeCss, 'community-detail')
  const styles = attachStyles([
    siteAsset('assets/fonts/pretendard/pretendard-guazi.css'),
    communityAsset('chzzk-detail.css'),
    communityAsset('community-poll.css'),
    communityAsset('news-card.css'),
  ], 'community-detail')
  detachStyles = styles.remove
  await Promise.all([styles.ready, loadDetailScripts()])
  init()
  ready.value = true
  window.addEventListener('pagehide', rememberScroll)
  // 정적 판은 새로고침하면 브라우저가 읽던 위치로 되돌린다. 넉스트 판은 글을 나중에 그리므로 직접 되돌린다
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  if (navigation?.type === 'reload') {
    try {
      const saved = Number(sessionStorage.getItem(scrollKey()) || 0)
      if (saved > 0) nextTick(() => requestAnimationFrame(() => window.scrollTo(0, saved)))
    }
    catch { /* 저장소를 못 쓰면 맨 위에서 시작 */ }
  }
})

const scrollKey = () => `bbm-detail-scroll:${route.fullPath}`
function rememberScroll() {
  try { sessionStorage.setItem(scrollKey(), String(Math.round(window.scrollY))) }
  catch { /* 저장소를 못 쓰면 넘어간다 */ }
}

watch(() => route.fullPath, () => { if (ready.value) { init(); window.scrollTo(0, 0) } })

onBeforeUnmount(() => {
  window.removeEventListener('pagehide', rememberScroll)
  clearTimeout(toastTimer)
  clearTimeout(menuTimer)
  clearDocClasses(docKey)
  detachStyles?.()
  detachNeutralize?.()
})

/* ── 머리줄 · 글 반응 ── */
function close() {
  if (window.history.state?.back) { router.back(); return }
  router.push(listRoute())
}
function toggleBookmark() {
  bookmarked.value = !bookmarked.value
  showToast(bookmarked.value ? '게시글을 저장했습니다' : '저장을 취소했습니다')
}
function toggleUp() { up.value = !up.value; if (up.value) down.value = false; showToast(up.value ? '추천했습니다' : '추천을 취소했습니다') }
function toggleDown() { down.value = !down.value; if (down.value) up.value = false; showToast(down.value ? '비추천했습니다' : '비추천을 취소했습니다') }
function jumpToComments() {
  commentsEl.value?.scrollIntoView({ behavior: 'smooth' })
  setTimeout(() => commentInputEl.value?.focus(), 350)
}
function toggleRepost() {
  reposted.value = !reposted.value
  showToast(reposted.value ? '게시글을 재게시했습니다' : '재게시를 취소했습니다')
}
async function shareUrl(url: string, copied: string) {
  if (navigator.share) {
    try { await navigator.share({ title: document.title, url }); return }
    catch (error) { if ((error as Error).name === 'AbortError') return }
  }
  try { await navigator.clipboard.writeText(url); showToast(copied) }
  catch { showToast('주소창의 링크를 복사해 주세요') }
}
const sharePost = () => shareUrl(location.href, '게시글 링크를 복사했습니다')
function shareComment(anchor: string) {
  // 정적 판: 주소#앵커. 해시 라우팅이라 ?comment=앵커 로 바꾼다(열면 그 댓글로 스크롤)
  const resolved = router.resolve({ path: route.path, query: { ...route.query, comment: anchor || 'comment' } }).href
  shareUrl(`${location.origin}${location.pathname}${resolved}`, '댓글 링크를 복사했습니다')
}
function openLatest(item: LatestItem) {
  if (item.postId) { router.push(`/posts/${item.postId}`); return }
  showToast(item.text.trim())
}
function toTop() { window.scrollTo({ top: 0, behavior: 'smooth' }) }

/* ── 댓글 ── */
function persistComments() {
  try { localStorage.setItem(`bbm.community.comments.${model.value?.id}`, JSON.stringify(commentItems.value)) }
  catch { /* 저장 공간이 없으면 화면만 바꾼다 */ }
}
function renderCommentItems() { itemsRendered.value = true }
function findComment(itemId: string, parentId = '') {
  if (parentId) {
    const parent = commentItems.value.find(item => String(item.id) === String(parentId))
    const item = parent?.replies?.find(reply => String(reply.id) === String(itemId))
    return item ? { item, parent } : null
  }
  const item = commentItems.value.find(comment => String(comment.id) === String(itemId))
  return item ? { item, parent: null } : null
}
function removeComment(itemId: string, parentId = '') {
  if (parentId) {
    const parent = commentItems.value.find(item => String(item.id) === String(parentId))
    if (parent) parent.replies = (parent.replies || []).filter(reply => String(reply.id) !== String(itemId))
  }
  else {
    commentItems.value = commentItems.value.filter(item => String(item.id) !== String(itemId))
  }
  persistComments()
  renderCommentItems()
}
function toggleCommentVote(item: DetailComment, direction: 'up' | 'down') {
  const nextVote = direction
  const previousVote = item.viewerVote || ''
  const nextField = nextVote === 'up' ? 'like' : 'dislike'
  const previousField = previousVote === 'up' ? 'like' : 'dislike'
  item.like = Math.max(0, Number(item.like) || 0)
  item.dislike = Math.max(0, Number(item.dislike) || 0)
  if (previousVote === nextVote) {
    item[nextField] = Math.max(0, (item[nextField] as number) - 1)
    item.viewerVote = ''
    return false
  }
  if (previousVote) item[previousField] = Math.max(0, (item[previousField] as number) - 1)
  item[nextField] = (item[nextField] as number) + 1
  item.viewerVote = nextVote
  return true
}
function onCommentVote(payload: { id: string; parentId: string; direction: 'up' | 'down' }) {
  const found = findComment(payload.id, payload.parentId)
  if (!found) return
  const selected = toggleCommentVote(found.item, payload.direction)
  persistComments()
  renderCommentItems()
  showToast(selected ? (payload.direction === 'up' ? '추천했습니다' : '비추천했습니다') : (payload.direction === 'up' ? '추천을 취소했습니다' : '비추천을 취소했습니다'))
}
function showCommentContext(label: string) {
  contextCreated.value = true
  contextLabel.value = label
  contextHidden.value = false
}
function onReply(payload: { id: string; parentId: string; user: string }) {
  replyTarget.value = { id: payload.id || '', parentId: payload.parentId || payload.id || '', user: payload.user || '쿠로토라' }
  editTarget.value = null
  showCommentContext(`${replyTarget.value.user}에게 답글`)
  placeholder.value = '답글을 입력하세요.'
  commentInputEl.value?.focus()
}
function onMore(payload: { id: string; parentId: string; owned: boolean }) {
  if (!payload.owned) { showToast('내가 작성한 댓글만 수정할 수 있습니다'); return }
  openCommentMenu(payload.id, payload.parentId)
}
function resetCommentComposer() {
  replyTarget.value = null
  editTarget.value = null
  inputValue.value = ''
  placeholder.value = '댓글을 입력하세요.'
  if (contextCreated.value) contextHidden.value = true
}
function openCommentMenu(itemId: string, parentId: string) {
  clearTimeout(menuTimer)
  menuCreated.value = true
  menuTarget.value = { id: itemId, parentId }
  menuHidden.value = false
  requestAnimationFrame(() => requestAnimationFrame(() => { menuOpen.value = true }))
}
function closeCommentMenu() {
  menuOpen.value = false
  menuTimer = setTimeout(() => { menuHidden.value = true }, 180)
}
function onMenuClick(event: MouseEvent) {
  const action = (event.target as HTMLElement).closest<HTMLElement>('[data-comment-menu]')?.dataset.commentMenu
  if (!action && event.target !== event.currentTarget) return
  if (action === 'edit') {
    const found = findComment(menuTarget.value.id, menuTarget.value.parentId)
    if (found) {
      editTarget.value = { ...menuTarget.value }
      replyTarget.value = null
      inputValue.value = String(found.item.text || '')
      showCommentContext('댓글 수정 중')
      commentInputEl.value?.focus()
    }
  }
  if (action === 'delete') {
    removeComment(menuTarget.value.id, menuTarget.value.parentId)
    showToast('댓글을 삭제했습니다')
  }
  closeCommentMenu()
}
function submitComment() {
  const value = inputValue.value.trim()
  if (!value || isNotice.value) return
  if (editTarget.value) {
    const found = findComment(editTarget.value.id, editTarget.value.parentId)
    if (found) found.item.text = value
    persistComments()
    renderCommentItems()
    resetCommentComposer()
    showToast('댓글을 수정했습니다')
    return
  }
  const wasReply = Boolean(replyTarget.value)
  const ownComment: DetailComment = {
    id: `local-${Date.now()}`,
    user: '보배드림 회원',
    level: 1,
    avatar: legacyWin().BOBAE_AVATAR_FOR?.('보배드림 회원') || 'assets/rank-avatars/minimal/avatar-01.png',
    text: value,
    date: '방금 전',
    own: true,
    replies: [],
  }
  if (replyTarget.value) {
    const parentId = replyTarget.value.parentId || replyTarget.value.id
    const parent = commentItems.value.find(item => String(item.id) === String(parentId))
    if (parent) parent.replies = [...(parent.replies || []), ownComment]
    else commentItems.value.push(ownComment)
  }
  else {
    commentItems.value.push(ownComment)
  }
  persistComments()
  renderCommentItems()
  resetCommentComposer()
  showToast(wasReply ? '답글이 등록되었습니다' : '댓글이 등록되었습니다')
}
/* 정적 HTML 에 박혀 있는 예시 댓글의 버튼(정적 판: data-reply-user 만 있고 글 번호 없음) */
const staticReply = (user: string) => onReply({ id: '', parentId: '', user })
const staticShare = (anchor: string) => shareComment(anchor)
function staticAnchor() { window.scrollTo(0, 0) }
</script>

<template>
  <div v-if="ready && model">
    <main class="pageShell">
      <header class="topBar">
        <button id="closeBtn" class="iconButton closeButton" aria-label="뒤로" @click="close"><img :src="ic('assets/reddit-ui/back.svg')" alt=""></button>
        <strong class="brand">커뮤니티</strong>
        <div class="headerActions">
          <button id="bookmarkBtn" class="iconButton bookmarkButton" aria-label="북마크" :aria-pressed="bookmarked" @click="toggleBookmark"><img :src="ic('assets/reddit-ui/icon-save-outline.svg')" alt=""></button>
          <button id="menuBtn" class="iconButton" aria-label="더보기" @click="showToast('게시글 메뉴입니다')"><img :src="ic('assets/chzzk-detail/icons/more-reddit.svg')" alt=""></button>
        </div>
      </header>

      <article id="regularPost" class="post" :hidden="isNotice">
        <button id="boardBtn" class="boardLink" @click="router.push(listRoute())">{{ model.boardLabel }} <img :src="ic('assets/reddit-ui/chevron-right.svg')" alt=""></button>
        <h1 id="postTitle" class="postTitle">{{ model.title }}</h1>
        <div class="authorRow">
          <img id="authorAvatar" class="authorAvatar" :src="model.avatarSrc" :alt="model.avatarAlt">
          <div class="authorText">
            <div><strong id="authorName">{{ model.authorName }}</strong><span> · LV <span id="authorLevel">{{ model.authorLevel }}</span></span><span id="operatorBadge" class="operatorBadge" :hidden="!model.operatorBadge">네이버 게임 운영자</span></div>
            <div class="authorMeta"><span id="authorDate">{{ model.authorDate }}</span><span>·</span><span class="viewCount"><span class="metaLabel">조회</span><span id="authorView">{{ model.authorView }}</span></span><span>·</span><span class="recommendCount"><span class="metaLabel">추천</span><span id="authorLike">{{ score.toLocaleString() }}</span></span></div>
          </div>
        </div>
        <div class="postDivider" />
        <div id="postBody" class="postBody">
          <template v-if="model.mode === 'reference'">
            <img class="heroSticker" :src="ic('assets/chzzk-detail/checkin-cat.png')" alt="박스 뒤에서 인사하는 고양이">
            <p>출첵!</p>
          </template>
          <template v-else-if="model.mode === 'longNotice'">
            <img class="loopBanner" :src="ic('assets/chzzk-detail/loop-station-banner.png')" alt="루프 스테이션">
            <div class="longNoticeBody">
              <p>안녕하세요, 치지직입니다. 🧀</p>
              <p>오늘은 어떤 방송을 볼까 고민하신 적 있으신가요?</p>
              <p><strong>'루프 스테이션'</strong>에서 하루 24시간 동안 시간에 잘 어울리는 방송을 소개해드려요.</p>
              <p>잔잔한 피아노 연주와 ASMR로 꿀잠자고,<br>노래와 토크로 오전을 힘차게 열고,<br>쿡방과 캐주얼 게임이 가득한 낮을 지나<br>예능/합방/게임으로 달아오르는 저녁까지!</p>
              <p>시간대마다 새로운 채널을 발견하는 재미를 느껴보세요.</p>
              <div class="longNoticeSection"><strong>■ 임시 운영 기간</strong><p>2026년 10월 9일(금) 00:00 ~ 10월 11일(일) 24:00 (3일간)</p></div>
              <div class="longNoticeSection"><strong>■ 시청 방법</strong><p>3일 내내 치지직 홈 중단의 <strong>'루프 스테이션'</strong> 영역에서 만날 수 있어요. (PC / 모바일)</p></div>
              <div class="longNoticeSection"><strong>■ 노출 콘텐츠</strong><p>• ON AIR : 지금 잘 어울리는 라이브<br>• 추천 다시보기 : 놓치기 아까운 최신 라이브 다시보기<br>• 이건 꼭 봐야 해 : 핵심 장면을 짧게 즐기는 클립</p></div>
              <p class="sourceNote">편성 시간 및 콘텐츠는 스트리머의 사정에 따라 일부 변경될 수 있습니다.</p>
            </div>
          </template>
          <template v-else-if="model.mode === 'inquiry'">
            <div class="userInquiryBody">
              <p>안녕하세요.</p>
              <p>치지직 특정 채널의 채팅 이용 제한과 관련하여 문의드립니다.</p>
              <p>현재 해당 채널의 방송 시청은 가능하지만, 채팅을 작성할 수 없는 상태입니다. 채팅 이용 제한을 해제받고 싶어 문의드리게 되었습니다.</p>
              <p>과거 이용 과정에서 문제가 있었던 부분은 반성하고 있으며, 앞으로는 관련 이용 규칙을 준수하고자 합니다.</p>
              <p>이러한 경우 치지직 운영진을 통해 채팅 이용 제한 해제에 대한 검토를 요청할 수 있는지, 또는 별도의 공식 문의 절차가 있는지 안내해 주시면 감사하겠습니다.</p>
              <p>읽어주셔서 감사합니다.</p>
            </div>
          </template>
          <template v-else>
            <template v-for="(part, index) in model.bodyParts" :key="`${model.id}-${index}`">
              <section v-if="part.kind === 'summary3'" class="detailSummary3" aria-label="한 줄 요약"><strong>요약</strong><p>{{ part.text }}</p></section>
              <video v-else-if="part.kind === 'video'" :id="part.elId" class="detailPhoto detailDiscussionPhoto" :src="part.src" :poster="part.poster" controls muted playsinline preload="metadata" :style="part.ratio ? `aspect-ratio:${part.ratio}` : undefined" />
              <img v-else-if="part.kind === 'photo' && part.discussion" :id="part.elId" class="detailPhoto detailDiscussionPhoto" :src="part.src" :alt="part.alt" :style="part.ratio ? `aspect-ratio:${part.ratio}` : undefined" :loading="part.eager ? 'eager' : 'lazy'">
              <img v-else-if="part.kind === 'photo'" class="detailPhoto" :src="part.src" :alt="part.alt">
              <DetailEmbed v-else-if="part.kind === 'embed'" :item="part.item" :mode="part.mode" />
              <DetailPoll v-else-if="part.kind === 'poll'" :poll="part.poll" :poll-id="part.pollId" />
              <hr v-else-if="part.kind === 'rule'" class="detailRule">
              <DetailLocalMedia v-else-if="part.kind === 'localMedia'" :media="part.media" />
              <div v-else-if="part.kind === 'copy'" class="detailCopy"><template v-for="(line, lineIndex) in part.lines" :key="lineIndex"><h3 v-if="line.tag === 'h3'" class="detailSubhead" v-html="line.html" /><blockquote v-else-if="line.tag === 'blockquote'" class="detailQuote" v-html="line.html" /><ul v-else-if="line.tag === 'ul'"><li v-for="(li, liIndex) in line.items" :key="liIndex" v-html="li" /></ul><ol v-else-if="line.tag === 'ol'"><li v-for="(li, liIndex) in line.items" :key="liIndex" v-html="li" /></ol><p v-else v-html="line.html" /></template></div>
              <p v-else-if="part.kind === 'source'" class="detailSource">출처 {{ part.source }}<template v-if="part.url"> · <a :href="part.url" target="_blank" rel="noopener noreferrer">원문 보기</a></template></p>
            </template>
          </template>
        </div>
        <div class="tagRow" aria-label="태그" :hidden="model.tagsHidden"><button v-for="(tag, index) in model.tags" :key="index">#{{ tag }}</button></div>
        <div id="postActions" class="reactionRow" aria-label="게시글 반응">
          <div class="votePill" aria-label="좋아요와 싫어요">
            <button id="upBtn" class="voteButton" :class="{ active: up }" aria-label="추천" :aria-pressed="up" @click="toggleUp"><img class="voteThumb" :src="ic('assets/reactions/recommend.svg')" alt=""></button>
            <strong id="score" aria-live="polite">{{ score }}</strong>
            <button id="downBtn" class="voteButton down" :class="{ active: down }" aria-label="비추천" :aria-pressed="down" @click="toggleDown"><img class="voteThumb" :src="ic('assets/reactions/dislike.svg')" alt=""></button>
          </div>
          <button id="commentJump" class="roundAction commentAction" aria-label="댓글로 이동" @click="jumpToComments"><img :src="ic('assets/reactions/comment-outline.svg')" alt=""><span id="actionCommentCount">{{ commentTotal }}</span></button>
          <button id="repostBtn" class="roundAction repostAction" :class="{ active: reposted }" aria-label="재게시" :aria-pressed="reposted" @click="toggleRepost"><img :src="ic('assets/reddit-ui/repost.svg')" alt=""></button>
          <button id="shareBtn" class="roundAction shareAction" aria-label="게시글 공유" @click="sharePost"><img :src="ic('assets/chzzk-detail/icons/share-reddit.svg')" alt=""></button>
        </div>
      </article>

      <article id="noticePost" class="noticePost" :hidden="!isNotice">
        <div class="noticeCopy">
          <p>당첨되신 분은 응모 시 기입하신 네이버 ID로 포인트 지급 관련 안내가<br>개별 발송될 예정이니, 해당 아이디의 네이버 메일함을 꼭 확인해 주세요!</p>
          <p>※ 포인트는 발표 후 7일 이내 지급될 예정이며, 1인당 지급액이 5만원을 초과하여 제세공과금 관련 사항은 당첨자분께 개별 안내드립니다.</p>
        </div>
        <p class="noticeUpdate">(2026. 09. 23 11:20 업데이트)</p>
        <div class="tagRow"><button>#그님티</button><button>#내전</button></div>
        <div class="reactionRow noticeReaction"><div class="votePill" aria-label="추천과 비추천"><button class="voteButton" aria-label="추천"><img class="voteThumb" :src="ic('assets/reactions/recommend.svg')" alt=""></button><strong>12</strong><button class="voteButton down" aria-label="비추천"><img class="voteThumb" :src="ic('assets/reactions/dislike.svg')" alt=""></button></div></div>
      </article>

      <section id="latest" class="latestCard">
        <div class="latestHead"><div><strong id="latestAuthor">{{ model.latestAuthor }}</strong>님의 최신글</div><button id="latestMore" @click="showToast('최신글을 더 불러옵니다')">더보기</button></div>
        <button v-for="(item, index) in latestItems" :key="index" class="latestItem" :data-comments="item.comments || undefined" :data-post-id="item.postId ? String(item.postId) : undefined" :hidden="item.hidden" @click="openLatest(item)">{{ item.text }}</button>
      </section>

      <section id="comments" ref="commentsEl" class="comments">
        <div class="commentHead">
          <div class="commentTitle"><strong id="commentCount">댓글 {{ commentTotal }}</strong><button id="refreshBtn" aria-label="새로고침" @click="showToast('댓글을 새로고침했습니다')"><img :src="ic('assets/reddit-ui/icon-refresh-outline.svg')" alt=""></button></div>
          <button id="filterBtn" class="filterButton" aria-label="댓글 정렬" @click="showToast('댓글 정렬: 등록순')"><img :src="ic('assets/reddit-ui/icon-sort-outline.svg')" alt=""></button>
        </div>
        <div class="cleanBot"><span class="botIcon"><img :src="ic('assets/reddit-ui/icon-bot-outline.svg')" alt=""></span><strong>클린봇</strong>이 악성댓글을 감지합니다.<button id="gearBtn" aria-label="클린봇 설정" @click="showToast('클린봇이 켜져 있습니다')"><img :src="ic('assets/reddit-ui/icon-settings-outline.svg')" alt=""></button></div>
        <ol id="commentList" class="commentList">
          <template v-if="showItems">
            <DetailCommentItem v-for="comment in commentItems" :key="String(comment.id)" :comment="comment" @reply="onReply" @share="shareComment" @vote="onCommentVote" @more="onMore" />
          </template>
          <template v-else-if="model.commentMode === 'inquiry'">
            <li class="moderatedComment"><img :src="ic('assets/chzzk-detail/comment-anonymous-avatar.png')" alt="숨김 댓글"><span>클린봇이 부적절한 내용을 감지했습니다.</span></li>
            <li class="commentItem">
              <img class="commentAvatar" :src="ic('assets/chzzk-detail/comment-anonymous-avatar.png')" alt="익씽 프로필">
              <div class="commentContent">
                <div class="commentAuthor"><strong>익씽 · LV 12</strong><span>8시간 전</span></div>
                <p>고객센터나 벤당한 스트리머 한테 애기하는거지 여기 애기하는게 아닙니다.</p>
                <div class="commentTools" aria-label="댓글 작업">
                  <button class="commentIconButton moreCommentButton" aria-label="댓글 더보기" @click="onMore({ id: '', parentId: '', owned: false })"><img :src="ic('assets/chzzk-detail/icons/more-reddit.svg')" alt=""></button>
                  <button class="commentTextButton replyButton" data-reply-user="익씽" @click="staticReply('익씽')"><img :src="ic('assets/chzzk-detail/icons/reply-reddit.svg')" alt=""><span>답글</span></button>
                  <button class="commentTextButton commentShareButton" data-comment-share="comment-inquiry" aria-label="댓글 공유" @click="staticShare('comment-inquiry')"><img :src="ic('assets/chzzk-detail/icons/share-reddit.svg')" alt=""><span>공유</span></button>
                </div>
              </div>
            </li>
          </template>
          <li v-else class="commentItem">
            <img class="commentAvatar" :src="ic('assets/chzzk-detail/comment-avatar.gif')" alt="댓글 작성자">
            <div class="commentContent">
              <div class="commentAuthor"><strong>전국제패 모범생 4669</strong><span>7시간 전</span></div>
              <p>ㅊㅊ</p>
              <div class="commentTools" aria-label="댓글 작업">
                <button class="commentIconButton moreCommentButton" aria-label="댓글 더보기" @click="onMore({ id: '', parentId: '', owned: false })"><img :src="ic('assets/chzzk-detail/icons/more-reddit.svg')" alt=""></button>
                <button class="commentTextButton replyButton" data-reply-user="쿠로토라" @click="staticReply('쿠로토라')"><img :src="ic('assets/chzzk-detail/icons/reply-reddit.svg')" alt=""><span>답글</span></button>
                <button class="commentTextButton commentShareButton" data-comment-share="comment-1" aria-label="댓글 공유" @click="staticShare('comment-1')"><img :src="ic('assets/chzzk-detail/icons/share-reddit.svg')" alt=""><span>공유</span></button>
                <strong class="replyCount">답글 1</strong>
              </div>
              <div class="nestedReply">
                <img class="replyAvatar" :src="ic('assets/chzzk-detail/author-avatar.png')" alt="답글 작성자">
                <div><div class="replyAuthor"><strong>쿠로토라</strong><span class="authorBadge">작성자</span><span>6시간 전</span></div><a href="#" @click.prevent="staticAnchor">전국제패 모범생 4669</a><img class="replySticker" :src="ic('assets/chzzk-detail/reply-cat.png')" alt="야호 고양이 스티커"><div class="nestedTools" aria-label="답글 작업"><button class="commentIconButton moreCommentButton" aria-label="답글 더보기" @click="onMore({ id: '', parentId: '', owned: false })"><img :src="ic('assets/chzzk-detail/icons/more-reddit.svg')" alt=""></button><button class="commentTextButton replyButton" data-reply-user="쿠로토라" @click="staticReply('쿠로토라')"><img :src="ic('assets/chzzk-detail/icons/reply-reddit.svg')" alt=""><span>답글</span></button><button class="commentTextButton commentShareButton" data-comment-share="reply-1" aria-label="답글 공유" @click="staticShare('reply-1')"><img :src="ic('assets/chzzk-detail/icons/share-reddit.svg')" alt=""><span>공유</span></button></div></div>
              </div>
            </div>
          </li>
        </ol>
      </section>

      <button id="toTop" class="toTop" @click="toTop"><span><img :src="ic('assets/reddit-ui/icon-up-arrow-outline.svg')" alt=""></span>맨 위로</button>

      <form id="commentForm" class="composer" :class="{ isDisabled: disabledComposer }" @submit.prevent="submitComment">
        <button type="button" aria-label="이미지 첨부"><img :src="ic('assets/reddit-ui/icon-camera-outline.svg')" alt=""></button>
        <input id="commentInput" ref="commentInputEl" v-model="inputValue" maxlength="500" :placeholder="placeholder" aria-label="댓글 입력" :disabled="disabledComposer">
        <button type="button" aria-label="스티커"><img :src="ic('assets/reddit-ui/icon-sticker-outline.svg')" alt=""></button>
        <button type="button" aria-label="잠금"><img :src="ic('assets/reddit-ui/icon-lock-outline.svg')" alt=""></button>
        <button id="submitBtn" class="sendButton" :class="{ ready: inputReady && !disabledComposer }" type="submit" aria-label="댓글 등록" :disabled="!inputReady || disabledComposer"><img :src="ic('assets/reddit-ui/icon-send-outline.svg')" alt=""></button>
        <div v-if="contextCreated" class="commentContext" :hidden="contextHidden"><strong>{{ contextLabel }}</strong><button type="button" aria-label="작성 취소" @click="resetCommentComposer"><img :src="ic('assets/reddit-ui/icon-close-outline.svg')" alt=""></button></div>
      </form>
    </main>
    <div id="toast" class="toast" :class="{ show: toastShow }" role="status">{{ toastText }}</div>
    <Teleport to="body">
      <div v-if="menuCreated" id="commentMenuOverlay" class="commentMenuOverlay" :class="{ open: menuOpen }" :hidden="menuHidden" @click="onMenuClick">
        <section class="commentMenuSheet" role="dialog" aria-modal="true" aria-label="댓글 관리">
          <span class="commentMenuHandle" aria-hidden="true" />
          <button type="button" data-comment-menu="edit"><img :src="ic('assets/reddit-ui/edit.svg')" alt=""><span>수정하기</span></button>
          <button class="danger" type="button" data-comment-menu="delete"><img :src="ic('assets/reddit-ui/delete.svg')" alt=""><span>삭제하기</span></button>
          <button type="button" data-comment-menu="cancel"><img :src="ic('assets/reddit-ui/icon-close-outline.svg')" alt=""><span>취소</span></button>
        </section>
      </div>
    </Teleport>
  </div>
</template>
