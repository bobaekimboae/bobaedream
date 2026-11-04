<script setup lang="ts">
// 차량리뷰 게시판(board=vehicle-review). 정본: public/community/vehicle-review-board.js
//  - 목록(일반 · ?model=tesla-model-y 모델 오너 서클) · 상세(?review=<id>, 'write' 는 목록)
import type { Ref } from 'vue'
import { boardSrc, setPhoneClass, useBoardQuery, writeJson, type Row } from '~/composables/boards/boardUtil'
import { avatarOf, bodyText, categoryComment, categoryLabels, commentRows, imagesOf, modelYear, profileAverage, ratingMap, seededComments, status, teslaModelYStats, vrbAllRows, vrbCommentStorageKey, vrbIcons } from '~/composables/boards/vehicleReview'
import { useListPageCtx } from '~/composables/list/useListPage'
import VrbStars from './VrbStars.vue'

const props = defineProps<{ posts: Row[]; phoneClasses: Set<string>; listClass: Ref<string>; typeLabel: Ref<string> }>()
const page = useListPageCtx()
const { q, edit, go } = useBoardQuery()
const ic = (name: string) => boardSrc(vrbIcons[name])

const activePowertrain = ref('all')
const activeModelReviewFilter = ref('all')
const reviewId = computed(() => { const id = q.value.review; return id && id !== 'write' ? id : '' })
const modelCircle = computed(() => (q.value.model === 'tesla-model-y' ? teslaModelYStats : null))
const rows = computed(() => vrbAllRows(props.posts, !!modelCircle.value))

// ── 목록 ──
const visible = computed(() => (modelCircle.value
  ? rows.value.filter(p => activeModelReviewFilter.value !== 'owner' || p.owner)
  : rows.value.filter(p => activePowertrain.value === 'all' || p.powertrain === activePowertrain.value)))
const total = computed(() => (rows.value.length ? rows.value.reduce((s, p) => s + (Number(p.rating) || 0), 0) / rows.value.length : 0))
const owners = computed(() => rows.value.filter(p => p.owner).length)
const powertrains: Array<[string, string]> = [['all', '전체'], ['ev', '전기차'], ['phev', '플러그인'], ['erev', '증거리형'], ['hybrid', '하이브리드'], ['ice', '내연기관']]
const followed = reactive<Record<string, boolean>>({})
function cardOf(post: Row) {
  const score = Number(post.rating) || 0
  return {
    post, score, year: modelYear(post), avatar: avatarOf(post),
    ownerLabel: post.owner ? '실소유자 · 인증' : '시승자',
    body: (Array.isArray(post.body) && post.body[0]) || post.body || post.summary || '',
    images: imagesOf(post),
  }
}
const cards = computed(() => visible.value.map(cardOf))
function reviewLink(id: string) { return edit((p) => { p.board = 'vehicle-review'; p.review = id }) }
function listLink() { return edit((p) => { p.board = 'vehicle-review'; delete p.review }) }
function writer() { location.href = siteAsset('?community=reviews&review=write&from=community') }
function openModel() { go(edit((p) => { p.board = 'vehicle-review'; p.model = 'tesla-model-y'; delete p.review })) }
function modelBack() { go(edit((p) => { delete p.model; delete p.review })) }

// ── 상세 ──
const post = computed<Row | undefined>(() => (reviewId.value ? rows.value.find(i => String(i.reviewId) === String(reviewId.value)) || rows.value[0] : undefined))
const localComments = ref<string[]>([])
const commentVersion = ref(0)
const commentInput = ref('')
const detailPressed = reactive({ save: false, helpful: false, unhelpful: false })
const subscribed = ref(false)
const copyToast = ref('')
const copyShow = ref(false)
const commentsEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const commentLikes = reactive<Record<string, { on: boolean; n: number }>>({})
const detail = computed(() => {
  const p = post.value
  if (!p) return null
  const score = Number(p.rating) || profileAverage(ratingMap(p), p.powertrain)
  const powerLabel = ({ ev: '전기차', phev: '플러그인 하이브리드', erev: '주행거리 연장형', hybrid: '하이브리드', ice: '내연기관' } as Record<string, string>)[p.powertrain] || '자동차'
  const metricLabel = ({ ev: '실주행거리', phev: '순수 전기 주행거리', erev: '실주행거리', hybrid: '실연비', ice: '실연비' } as Record<string, string>)[p.powertrain] || '실사용 수치'
  const metricValue = p.ownerMetric || ((p.powertrain === 'ev' || p.powertrain === 'erev') ? '420km' : p.powertrain === 'phev' ? '72km' : '9.6km/L')
  const ratings = ratingMap(p)
  const ratingRows = Object.keys(ratings).map((key) => { const label = categoryLabels[key] || key; const value = Number(ratings[key]) || 0; return { label, value, comment: categoryComment(label, value) } })
  return {
    p, score, powerLabel, metricLabel, metricValue, ratingRows, avatar: avatarOf(p), images: imagesOf(p), body: bodyText(p),
    purchaseDate: p.purchaseDate || '2025-11', price: p.price || String(5800 + (Number(String(p.id || '0').slice(-2)) || 1) * 170),
    baseCount: Number(p.reply || p.comments || 0),
  }
})
const commentList = computed(() => {
  void commentVersion.value
  return localComments.value.map((body, index) => ({ author: '보배드림 회원', role: '실소유자', body, meta: '방금 전', likes: 0, replies: 0, local: true, index }))
    .concat(seededComments.map(c => ({ ...c, local: false, index: -1 })))
})
const commentTotal = computed(() => (detail.value ? detail.value.baseCount + localComments.value.length : 0))
function likeState(i: number, base: number) {
  const k = commentVersion.value + ':' + i
  if (!commentLikes[k]) commentLikes[k] = { on: false, n: base }
  return commentLikes[k]!
}
// 정적 판은 처음 그린 댓글에만 좋아요 누르기를 붙이고, 댓글을 단 뒤 다시 그린 목록에는 붙이지 않는다
let likeVersion = -1
function toggleCommentLike(i: number, base: number) {
  if (commentVersion.value !== likeVersion) return
  const s = likeState(i, base); s.n += s.on ? -1 : 1; s.on = !s.on }
function share() {
  const done = () => { copyToast.value = '리뷰 주소를 복사했어요.'; copyShow.value = true; setTimeout(() => { copyShow.value = false }, 1400) }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(done, done)
  else done()
}
function submitComment() {
  const value = commentInput.value.trim()
  if (!value || !post.value) return
  localComments.value.unshift(value)
  writeJson(vrbCommentStorageKey + '.' + post.value.reviewId, localComments.value)
  commentInput.value = ''
  commentVersion.value++
}
function goComments() { commentsEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => inputEl.value?.focus(), 300) }

// ── 화면 모드(.phone · #list class) ──
function applyMode(load = false) {
  if (reviewId.value) {
    if (!post.value) { go(listLink()); return }
    setPhoneClass(props.phoneClasses, 'phone vehicleReviewDetailMode', load)
    props.listClass.value = 'list vehicleReviewDetailList'
    return
  }
  if (load) {
    // 정적 판은 주소마다 새로 열려 .phone 이 처음 class(머리 줄 모양) + renderList 의 headerYouTube 로 시작한다
    const textOnly = props.phoneClasses.has('textOnlyMode')
    const header = q.value.header
    props.phoneClasses.clear()
    if (q.value.tabline === 'baidu') props.phoneClasses.add('tablineBaidu')
    if (header !== 'legacy') props.phoneClasses.add('communityTitleHeader')
    if (header !== 'legacy' && header !== 'community') props.phoneClasses.add('communityProfileHeader')
    props.phoneClasses.add('headerYouTube')
    if (textOnly) props.phoneClasses.add('textOnlyMode')
  }
  ;['compactMode', 'naverDiscussionMode', 'naverDiscussionThumbMode', 'feedCafeMode', 'naverCafePopularMode', 'chototFeedMode', 'chototBoardFeedMode', 'chototDealerFeedMode', 'vehicleReviewDetailMode'].forEach(c => props.phoneClasses.delete(c))
  props.phoneClasses.add('vehicleReviewBoardMode')
  props.listClass.value = 'list vehicleReviewBoardList'
  props.typeLabel.value = '피드형 · 차량리뷰'
  if (modelCircle.value) {
    document.title = '테슬라 모델 Y 리뷰 | 보배드림'
    // 정적 판은 .boardSelectName 글자를 바꾸고, 게시판 프로필 · 배너 스크립트가 그 이름을 보고 소개 · 통계 · 배너를 다시 맞춘다
    if (page.boardNameOverride.value !== '모델 Y 리뷰') { page.boardNameOverride.value = '모델 Y 리뷰'; page.nameTick.value++ }
  } else if (page.boardNameOverride.value === '모델 Y 리뷰') { page.boardNameOverride.value = ''; page.nameTick.value++; document.title = '보배드림 커뮤니티' }
}
watch(() => JSON.stringify(q.value), () => applyMode(true), { immediate: true })
watch(() => page.renderSeq.value, () => applyMode(false))
// 정적 판은 주소가 바뀌면 새로 열려 필터 · 팔로우 상태가 처음으로 돌아간다
watch(() => JSON.stringify(q.value), () => { activePowertrain.value = 'all'; activeModelReviewFilter.value = 'all'; Object.keys(followed).forEach(k => delete followed[k]) })
watch(() => [activePowertrain.value, activeModelReviewFilter.value], () => applyMode(false))
watch(reviewId, (id) => {
  if (!id || !post.value) return
  localComments.value = commentRows(post.value.reviewId)
  commentVersion.value++
  likeVersion = commentVersion.value
  commentInput.value = ''
  subscribed.value = false
  detailPressed.save = detailPressed.helpful = detailPressed.unhelpful = false
  window.scrollTo(0, 0)
}, { immediate: true })
</script>

<template>
  <!-- 상세 -->
  <article v-if="detail" class="vrb-detail">
    <header class="vrb-detail-head"><button class="vrb-detail-back" type="button" aria-label="차량리뷰 목록으로" @click="go(listLink())"><img :src="ic('back')" alt=""></button><strong>차량 리뷰</strong><button class="vrb-detail-share" type="button" aria-label="공유" @click="share"><img :src="ic('share')" alt=""></button></header>
    <section class="vrb-detail-author"><span class="vrb-avatar is-large"><img :src="boardSrc(detail.avatar.src)" :alt="detail.avatar.alt"></span><span><h2>{{ detail.p.author || detail.p.user || '보배드림 회원' }}<em v-if="detail.p.owner"><img :src="ic('check')" alt=""> 실소유자</em></h2><p>{{ detail.p.brand + ' ' + detail.p.model + ' · ' + (detail.p.location || '지역 미입력') }}</p></span><button class="vrb-detail-subscribe" type="button" :aria-pressed="subscribed" @click="subscribed = !subscribed">{{ subscribed ? '구독 중' : '구독' }}</button></section>
    <section class="vrb-detail-title"><h1>{{ detail.p.title || detail.p.model + ' 사용자 리뷰' }}</h1></section>
    <section class="vrb-detail-score"><div><b>{{ detail.p.brand + ' ' + detail.p.model }}</b><VrbStars :score="detail.score" size="is-detail" /><strong>{{ detail.score.toFixed(2) }}</strong><em>{{ status(detail.score) }}</em></div><small>{{ detail.p.trim }} · {{ detail.p.benchmark || detail.powerLabel + ' 평균 4.3' }}</small></section>
    <section class="vrb-detail-ratings"><div v-for="r in detail.ratingRows" :key="r.label" class="vrb-score-row"><span><b>{{ r.label }}</b><small>{{ r.comment }}</small></span><strong>{{ r.value.toFixed(1) }}</strong><i><em :style="'width:' + (r.value * 20) + '%'" /></i></div></section>
    <dl v-if="detail.p.owner" class="vrb-detail-owner"><div><dt>소유자 인증</dt><dd>실소유자 리뷰</dd></div><div><dt>구매 시기</dt><dd>{{ detail.purchaseDate }}</dd></div><div><dt>구매 지역</dt><dd>{{ detail.p.location || '미입력' }}</dd></div><div><dt>차량 가격</dt><dd>{{ detail.price }}만원</dd></div><div><dt>{{ detail.metricLabel }}</dt><dd>{{ detail.metricValue }}</dd></div></dl>
    <section class="vrb-detail-body"><p>{{ detail.body }}</p><div v-if="detail.images.length" :class="'vrb-detail-gallery is-' + detail.images.length"><img v-for="(src, i) in detail.images" :key="i" :src="boardSrc(src)" :alt="detail.p.brand + ' ' + detail.p.model + ' 리뷰 사진 ' + (i + 1)"></div></section>
    <section id="reviewComments" ref="commentsEl" class="vrb-comments">
      <header><div><h3>전체 댓글 <span class="vrb-comment-count">{{ commentTotal }}</span></h3><p>차량 경험에 도움이 되는 댓글을 먼저 보여드려요.</p></div><button type="button">추천순</button></header>
      <form class="vrb-comment-form" @submit.prevent="submitComment"><input ref="inputEl" v-model="commentInput" type="text" maxlength="300" placeholder="댓글을 입력하세요" aria-label="댓글 입력"><button type="submit" :disabled="!commentInput.trim()">등록</button></form>
      <div :key="commentVersion" class="vrb-comment-list"><article v-for="(item, i) in commentList" :key="i" class="vrb-comment" :data-local-index="item.local ? item.index : ''"><span class="vrb-avatar"><img :src="boardSrc(detail.avatar.src)" :alt="detail.avatar.alt"></span><div><b>{{ item.author }}<small>{{ item.role }}</small></b><p>{{ item.body }}</p><footer><span>{{ item.meta }}</span><button type="button">답글</button><button v-if="item.replies" type="button" class="vrb-replies">답글 {{ item.replies }}개 보기</button></footer></div><button class="vrb-comment-like" type="button" :aria-pressed="likeState(i, item.likes).on" @click="toggleCommentLike(i, item.likes)"><img :src="ic('like')" alt=""> <span>{{ likeState(i, item.likes).n }}</span></button></article></div>
    </section>
    <footer class="vrb-detail-actions"><button type="button" data-action="comments" @click="goComments"><img :src="ic('chat')" alt=""> 댓글 <span>{{ commentTotal }}</span></button><button type="button" data-action="save" :aria-pressed="detailPressed.save" @click="detailPressed.save = !detailPressed.save"><img :src="ic('bookmark')" alt=""> <span>{{ detailPressed.save ? '저장됨' : '저장' }}</span></button><button type="button" data-action="helpful" :aria-pressed="detailPressed.helpful" @click="detailPressed.helpful = !detailPressed.helpful"><img :src="ic('like')" alt=""> 도움돼요 <span>{{ Number(detail.p.likes || 0) + (detailPressed.helpful ? 1 : 0) }}</span></button><button type="button" data-action="unhelpful" :aria-pressed="detailPressed.unhelpful" @click="detailPressed.unhelpful = !detailPressed.unhelpful"><img :src="ic('dislike')" alt=""> 별로예요</button></footer>
    <p :class="['vrb-copy-toast', { show: copyShow }]" role="status">{{ copyToast }}</p>
  </article>

  <!-- 목록 -->
  <section v-else-if="!reviewId" :class="'vrb-shell ' + (modelCircle ? 'is-model-circle' : '')">
    <template v-if="modelCircle">
      <header class="vrb-model-head"><div class="vrb-model-title"><button class="vrb-model-back" type="button" aria-label="전체 차량 리뷰로" @click="modelBack"><img :src="ic('back')" alt=""></button><img class="vrb-model-logo" :src="boardSrc(modelCircle.brandLogo)" alt="테슬라 로고"><span><small>{{ modelCircle.brand }} 오너 서클</small><h2>{{ modelCircle.modelKo }}</h2><p>전기 SUV · 구독 {{ modelCircle.subscribers }}명</p></span><button class="vrb-write" type="button" @click="writer"><img :src="ic('write')" alt="">리뷰 등록</button></div><div class="vrb-model-overall"><span><strong>{{ modelCircle.score.toFixed(2) }}</strong><VrbStars :score="modelCircle.score" size="is-model" /><em>“우수”</em></span><p><b>리뷰 {{ modelCircle.reviewCount.toLocaleString('ko-KR') }}개</b> · {{ modelCircle.segment }} {{ modelCircle.rank }}위</p><small>동급 평균 {{ modelCircle.segmentAverage.toFixed(2) }}보다 <b>+{{ (modelCircle.score - modelCircle.segmentAverage).toFixed(2) }}</b></small></div></header>
      <section class="vrb-model-score"><header><span><small>MODEL SCORE</small><h3>모델 Y 항목별 평가</h3></span><em>동급 평균 비교</em></header><div class="vrb-model-stats"><article v-for="item in modelCircle.scores" :key="item.label" class="vrb-model-stat"><span><b>{{ item.label }}</b><small>{{ item.comment }}</small></span><strong>{{ item.score.toFixed(2) }}</strong><i><em :style="'width:' + (item.score * 20) + '%'" /></i><small :class="item.score >= item.average ? 'is-up' : 'is-down'">동급 {{ item.average.toFixed(2) }}</small></article></div></section>
      <section class="vrb-model-tags"><header><h3>오너들이 많이 말한 점</h3><small>리뷰 키워드 분석</small></header><b>좋았어요</b><div><span v-for="t in modelCircle.positives" :key="t[0]" class="is-good">{{ t[0] }} <b>{{ t[1] }}</b></span></div><b>아쉬워요</b><div><span v-for="t in modelCircle.negatives" :key="t[0]" class="is-bad">{{ t[0] }} <b>{{ t[1] }}</b></span></div></section>
      <nav class="vrb-model-tabs" aria-label="모델 Y 리뷰 필터"><button type="button" data-model-filter="all" :aria-selected="activeModelReviewFilter === 'all'" @click="activeModelReviewFilter = 'all'">전체 리뷰</button><button type="button" data-model-filter="owner" :aria-selected="activeModelReviewFilter === 'owner'" @click="activeModelReviewFilter = 'owner'">실소유자</button><button type="button" data-model-filter="latest" :aria-selected="activeModelReviewFilter === 'latest'" @click="activeModelReviewFilter = 'latest'">최신순</button><span>현재 예시 {{ rows.length }}개 · 실소유자 {{ owners }}명</span></nav>
    </template>
    <template v-else>
      <header class="vrb-intro"><div class="vrb-intro-top"><div><small>BOBAE VEHICLE SCORE</small><h2>차량 경험 리뷰</h2><p>실제 오너와 시승자가 남긴 솔직한 평가</p></div><button class="vrb-write" type="button" @click="writer"><img :src="ic('write')" alt="">리뷰 등록</button></div><div class="vrb-summary"><strong>{{ total.toFixed(1) }}</strong><div class="vrb-summary-copy"><VrbStars :score="total" /><b>리뷰 {{ rows.length }}개 · 실소유자 {{ owners }}명</b><span>차량·동력방식별 평가 항목을 제공합니다</span></div></div></header>
      <button class="vrb-model-entry" type="button" @click="openModel"><img :src="boardSrc(teslaModelYStats.brandLogo)" alt=""><span><small>모델 오너 서클</small><b>테슬라 모델 Y 통계와 리뷰</b><em>종합 {{ teslaModelYStats.score.toFixed(2) }} · 리뷰 {{ teslaModelYStats.reviewCount.toLocaleString('ko-KR') }}개</em></span><img :src="ic('back')" alt=""></button>
      <nav class="vrb-filter" aria-label="동력 방식 필터"><button v-for="item in powertrains" :key="item[0]" type="button" :data-powertrain="item[0]" :aria-selected="activePowertrain === item[0]" @click="activePowertrain = item[0]">{{ item[1] }}</button></nav>
    </template>
    <div class="vrb-cards">
      <article v-for="c in cards" :key="String(c.post.reviewId)" class="vrb-card" :data-review-id="c.post.reviewId">
        <header class="vrb-card-head"><span class="vrb-avatar"><img :src="boardSrc(c.avatar.src)" :alt="c.avatar.alt"></span><span class="vrb-user"><b>{{ c.post.author || c.post.user || '보배드림 회원' }}</b><small>{{ c.post.brand + ' ' + c.post.model + ' ' + c.ownerLabel }}</small></span><button class="vrb-subscribe" type="button" :aria-pressed="!!followed[c.post.reviewId]" @click="followed[c.post.reviewId] = !followed[c.post.reviewId]">{{ followed[c.post.reviewId] ? '팔로잉' : '팔로우' }}</button></header>
        <button class="vrb-card-main" type="button" @click="go(reviewLink(c.post.reviewId))"><div class="vrb-rating"><VrbStars :score="c.score" /><strong>{{ c.score.toFixed(2) }}</strong><em>“{{ status(c.score) }}”</em><span v-if="c.year">{{ c.year }}</span><small>{{ c.post.ownershipLabel || '시승 리뷰' }}</small></div><h3>{{ c.post.title || c.post.model + ' 사용자 리뷰' }}</h3><p>{{ c.body }}</p><div v-if="c.images.length" :class="'vrb-card-gallery is-' + c.images.length"><img v-for="(src, i) in c.images" :key="i" :src="boardSrc(src)" :alt="c.post.brand + ' ' + c.post.model + ' 리뷰 사진 ' + (i + 1)"></div><time class="vrb-date">{{ c.post.time || c.post.publishedAt || '' }}</time><footer class="vrb-metrics"><span><img :src="ic('share')" alt="">공유</span><span><img :src="ic('chat')" alt="">댓글 {{ Number(c.post.reply || c.post.comments || 0) }}</span><span class="vrb-vote"><img :src="ic('like')" alt="">도움돼요 {{ Number(c.post.likes || 0) }}<i /><img :src="ic('dislike')" alt=""></span></footer></button>
      </article>
      <div v-if="!cards.length" class="vrb-empty">조건에 맞는 리뷰가 아직 없습니다.</div>
    </div>
  </section>
</template>
