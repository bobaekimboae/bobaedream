<script setup lang="ts">
// 투후 오너 리뷰 게시판(board=tuhu-review). 정본: public/community/tuhu-review-board.js
//  - 목록(?powertrain=) · 상세(?tuhu=<id>) · 등록(?tuhu=write) · 등록 완료
import type { Ref } from 'vue'
import { boardSrc, boardTable, readJson, setPhoneClass, useBoardQuery, type Row } from '~/composables/boards/boardUtil'
import { useListPageCtx } from '~/composables/list/useListPage'

const props = defineProps<{ phoneClasses: Set<string>; listClass: Ref<string> }>()
const page = useListPageCtx()
const { q, edit, go } = useBoardQuery()
const store = 'bobae-tuhu-reviews-v1'
const commentStore = 'bobae-tuhu-comments-v1'
const star = boardSrc('../assets/icons/chotot/chotot-list-detail-review-star.svg')
const powerLabels: Record<string, string> = { ice: '내연기관', ev: '전기차', hybrid: '하이브리드', phev: '플러그인 하이브리드' }
const satisfaction: Record<number, [string, string]> = { 1: ['사지 마세요', '0% 만족도 · 추천하기 어렵습니다'], 2: ['아쉬워요', '20% 만족도 · 단점이 많이 느껴져요'], 3: ['보통이에요', '50% 만족도 · 일상 용도는 충분해요'], 4: ['좋아요', '80% 만족도 · 전반적으로 만족해요'], 5: ['최고예요', '100% 만족도 · 망설임 없이 추천해요'] }
const tags: Record<string, { good: string[]; bad: string[] }> = {
  공간: { good: ['트렁크가 넉넉해요', '뒷좌석 3명도 편해요', '머리 공간이 여유로워요', '공간 활용이 유연해요', '다리 공간이 편해요'], bad: ['수납공간이 적어요', '트렁크 입구가 좁아요', '뒷좌석은 2명이 적당해요', '앞좌석 머리 공간이 좁아요', '다리 공간이 부족해요', '좌석 조절이 아쉬워요'] },
  동력: { good: ['고속 추월이 여유로워요', '가속 반응이 빨라요', '오르막 힘이 충분해요', '가속감이 좋아요'], bad: ['반응이 늦어요', '추월할 때 답답해요', '오르막에서 힘이 부족해요', '출발이 굼떠요'] },
  '조작·주행': { good: ['제동감이 좋아요', '조향이 정확해요', '변속이 부드러워요', '차와 하나 된 느낌이에요', '출력이 매끄러워요'], bad: ['사각지대가 커요', '하체 소음이 있어요', '저속 떨림이 있어요', '변속 충격이 있어요', '조향 유격이 느껴져요'] },
  외관: { good: ['고급스러워요', '차체가 당당해요', '스포티해요', '선이 예뻐요'], bad: ['디자인이 아쉬워요', '차체가 둔해 보여요', '후면 디자인이 아쉬워요'] },
  실내: { good: ['실내 디자인이 좋아요', '소재 감촉이 좋아요', '새차 냄새가 적어요', '마감이 꼼꼼해요'], bad: ['플라스틱 느낌이 강해요', '소재가 저렴해 보여요', '실내 디자인이 올드해요', '냄새가 나요'] },
  '기술·안전': { good: ['차체가 든든해요', '주차 보조가 좋아요', '화면 반응이 빨라요', '음성 인식이 좋아요'], bad: ['에어백 구성이 아쉬워요', '내비게이션이 불편해요', '차체 강성이 불안해요', '전자 장비 오류가 잦아요', '첨단 기능이 부족해요'] },
  승차감: { good: ['승차감이 편해요', '방음이 좋아요', '과속방지턱을 잘 넘어요', '냉방 성능이 좋아요', '좌석이 편안해요'], bad: ['승차감이 불편해요', '방음이 아쉬워요', '서스펜션이 너무 단단해요', '냉방 성능이 약해요', '좌석이 불편해요'] },
  가성비: { good: ['정비비가 합리적이에요', '잔존가치가 좋아요', '기본 옵션이 많아요', '효율이 좋아요', '구매 혜택이 좋았어요'], bad: ['정비비가 비싸요', '보증기간이 짧아요', '감가가 커요', '구매 혜택이 적어요', '기본 옵션이 부족해요', '효율이 아쉬워요'] },
}
const reactions: Record<string, string> = { 'chzzk-detail/icons/comment-reddit.svg': 'reactions/comment-outline.svg', 'reddit-ui/recommend-thumb-up.svg': 'reactions/recommend.svg', 'detail-parity/reddit-dislike.svg': 'reactions/dislike.svg' }
const im = (name: string) => communityAsset('assets/' + (reactions[name] || name))
const local = () => readJson<Row[]>(store, []) || []
const tick = ref(0)
const rows = computed<Row[]>(() => { void tick.value; return local().concat(boardTable('tuhu-review').rows || []) })
function route(v: string) { return edit((p) => { p.board = 'tuhu-review'; if (v) p.tuhu = v; else delete p.tuhu }) }
const view = computed(() => q.value.tuhu || '')

// ── 목록 ──
const active = computed(() => q.value.powertrain || 'all')
const visible = computed(() => rows.value.filter(r => active.value === 'all' || r.powertrain === active.value))
const chips: Array<[string, string]> = [['all', '전체'], ['ice', '내연기관'], ['ev', '전기차'], ['hybrid', '하이브리드'], ['phev', 'PHEV']]
const followed = reactive<Record<string, boolean>>({})
function filterTo(f: string) { const p = { ...q.value }; if (f === 'all') delete p.powertrain; else p.powertrain = f; go(p) }
function listBack() { if (history.length > 1) history.back(); else go({}) }
const mediaOf = (row: Row): string[] => row.images || [row.thumbnail]

// ── 상세 ──
const row = computed<Row | undefined>(() => (view.value && view.value !== 'write' ? rows.value.find(r => String(r.tuhuReviewId || r.id) === String(view.value)) || rows.value[0] : undefined))
const thread = ref<Row[]>([])
const likeOn = ref(false)
const detailFollow = ref(false)
function addComment() {
  const body = prompt('댓글을 입력하세요')
  if (!body) return
  thread.value.unshift({ author: '보배드림 회원', body })
  localStorage.setItem(commentStore + '-' + view.value, JSON.stringify(thread.value))
  likeOn.value = false; detailFollow.value = false
  applyMode(false)
}
function share() { if (navigator.clipboard) navigator.clipboard.writeText(location.href) }

// ── 등록 ──
const vehicles: Array<[string, string, string]> = [['ice', 'BMW M3', '2023 M3 xDrive 컴페티션'], ['ev', '테슬라 Model Y', '2026 Long Range RWD'], ['hybrid', '토요타 캠리', '2027 2.0 HEV 프리미엄'], ['phev', 'BYD Qin Plus DM-i', '2026 DM-i 128km']]
function metricFields(type: string): Array<[string, string, string]> {
  if (type === 'ice') return [['fuelConsumption', '실연비', 'L/100km']]
  if (type === 'ev' || type === 'phev') return [['fullChargeRange', '실주행거리', 'km']]
  return [['fuelConsumption', '실연비', 'L/100km'], ['fullChargeRange', '순수전기 주행거리', 'km']]
}
const selected = ref('ice')
const rating = ref(0)
const chosen = ref<string[]>([])
const polarity = reactive<Record<string, string>>({})
const shownOn = reactive<Record<string, boolean>>({})
const w = reactive<Record<string, string>>({ purchaseMonth: '', purchasePrice: '', fuelConsumption: '', fullChargeRange: '', title: '', body: '' })
const progress = ref('')
const errorText = ref('')
const errorShow = ref(false)
const success = ref('')
function onVehicle() { w.fuelConsumption = ''; w.fullChargeRange = '' }
function choosePolarity(name: string, pol: string) { polarity[name] = pol; Object.keys(shownOn).forEach((k) => { if (k.startsWith(name + '|')) delete shownOn[k] }) }
function toggleTag(name: string, t: string) { const i = chosen.value.indexOf(t); if (i < 0) chosen.value.push(t); else chosen.value.splice(i, 1); shownOn[name + '|' + t] = i < 0 }
function onBody() { progress.value = Math.min(100, w.body!.length / 30 * 70 + 30) + '%' }
function writerBack() {
  if (w.title || w.body) { if (confirm('작성 중인 리뷰를 임시 저장할까요?')) localStorage.setItem('bobae-tuhu-review-draft', JSON.stringify({ title: w.title, body: w.body })) }
  go(route(''))
}
function publish() {
  const missing = metricFields(selected.value).some(f => !w[f[0]])
  if (!w.purchaseMonth || !w.purchasePrice || missing || !rating.value || chosen.value.length < 2 || !w.title!.trim() || w.body!.trim().length < 30) {
    errorText.value = '차량 정보, 만족도, 평가 항목 2개, 제목과 30자 이상의 내용을 모두 입력해 주세요.'
    errorShow.value = true
    return
  }
  const v = vehicles.find(x => x[0] === selected.value)!
  const id = 'local-' + Date.now()
  const logo = selected.value === 'ev' ? '../assets/vehicle-catalog/logos/logo_tesla.png' : selected.value === 'hybrid' ? '../assets/vehicle-catalog/logos/logo_toyota.png' : selected.value === 'phev' ? '../assets/vehicle-catalog/logos/logo_byd.png' : '../assets/vehicle-catalog/logos/logo_bmw.png'
  const fields = metricFields(selected.value).map(f => f[0])
  const r = {
    id, tuhuReviewId: id, brand: v[1].split(' ')[0], model: v[1], trim: v[2], powertrain: selected.value, location: '서울', brandLogo: logo, author: '보배드림 회원', verified: true,
    ownershipLabel: '실소유자', title: w.title!.trim(), summary: w.body!.trim(), body: w.body!.trim(), satisfaction: rating.value, satisfactionLabel: satisfaction[rating.value]![0],
    purchaseMonth: w.purchaseMonth, purchasePrice: w.purchasePrice, fuelConsumption: fields.includes('fuelConsumption') ? w.fuelConsumption : '', fullChargeRange: fields.includes('fullChargeRange') ? w.fullChargeRange : '',
    highlights: chosen.value.slice(), drawbacks: [], images: ['../assets/cars/supercar-sheet-v01/sc-014.jpg', '../assets/cars/supercar-sheet-v01/sc-044.jpg'], thumbnail: '../assets/cars/supercar-sheet-v01/sc-014.jpg',
    comments: 0, likes: 0, views: 0, publishedAt: new Date().toISOString(),
  }
  const all = local(); all.unshift(r)
  localStorage.setItem(store, JSON.stringify(all))
  success.value = id
}

function applyMode(load = false) {
  const kind = view.value === 'write' ? 'tuhuReviewWriterMode' : view.value ? 'tuhuReviewDetailMode' : 'tuhuReviewBoardMode'
  if (view.value && view.value !== 'write' && !row.value) return
  setPhoneClass(props.phoneClasses, 'phone tuhuReviewMode ' + kind, load)
  props.listClass.value = 'list tuhuReviewList'
}
watch(() => JSON.stringify(q.value), () => applyMode(true), { immediate: true })
watch(() => page.renderSeq.value, () => applyMode(false))
watch(() => q.value, () => {
  success.value = ''
  tick.value++
  if (view.value && view.value !== 'write') { thread.value = readJson<Row[]>(commentStore + '-' + view.value, []) || []; likeOn.value = false; detailFollow.value = false }
  window.scrollTo(0, 0)
}, { immediate: true })
</script>

<template>
  <!-- 목록 -->
  <template v-if="!view">
    <header class="trb-top"><button class="trb-icon trb-back" type="button" aria-label="뒤로" @click="listBack"><img :src="im('reddit-ui/back.svg')" alt="" aria-hidden="true"></button><h1>투후 오너 리뷰</h1><button class="trb-icon trb-write-icon" type="button" @click="go(route('write'))"><img :src="im('reddit-ui/edit.svg')" alt="" aria-hidden="true"></button></header>
    <section class="trb-intro"><h2>진짜 오너의 솔직한 평가</h2><p>구매 가격부터 실연비·실주행거리, 장점과 단점까지 한 번에 확인하세요.</p><strong><b>{{ rows.length }}</b>개의 실사용 리뷰</strong></section>
    <nav class="trb-filter"><button v-for="c in chips" :key="c[0]" type="button" :data-filter="c[0]" :class="active === c[0] ? 'on' : ''" @click="filterTo(c[0])">{{ c[1] }}</button></nav>
    <main class="trb-feed">
      <article v-for="r in visible" :key="String(r.tuhuReviewId || r.id)" class="trb-card" :data-review="r.tuhuReviewId || r.id">
        <div class="trb-profile"><img class="trb-avatar" :src="boardSrc(r.brandLogo)" :alt="r.brand"><span class="trb-profile-copy"><b>{{ r.author }} · {{ r.ownershipLabel || '실소유자' }}</b><span>{{ r.brand + ' ' + r.model }} 인증 오너 · {{ r.location }}</span></span><button class="trb-follow" type="button" @click="followed[r.tuhuReviewId || r.id] = !followed[r.tuhuReviewId || r.id]">{{ followed[r.tuhuReviewId || r.id] ? '구독 중' : '구독' }}</button></div>
        <div class="trb-ratingline"><span class="trb-stars"><img v-for="i in 5" :key="i" :class="i > Number(r.satisfaction || 0) ? 'off' : ''" :src="star" alt=""></span><strong>{{ Number(r.satisfaction || 0).toFixed(1) }}</strong><em>{{ r.satisfactionLabel }}</em><span class="trb-model">{{ r.trim }}</span></div>
        <button class="trb-card-open" type="button" @click="go(route(String(r.tuhuReviewId || r.id)))"><h3>{{ r.title }}</h3><p class="trb-summary">{{ r.summary }}</p><span class="trb-media"><img :src="boardSrc(mediaOf(r)[0])" alt=""><img :src="boardSrc(mediaOf(r)[1] || mediaOf(r)[0])" alt=""></span></button>
        <footer class="trb-foot"><span><img :src="im('chzzk-detail/icons/share.svg')" alt="" aria-hidden="true"> 공유</span><span><img :src="im('chzzk-detail/icons/comment-reddit.svg')" alt="" aria-hidden="true"> {{ Number(r.comments || 0) }}</span><span><img :src="im('reddit-ui/recommend-thumb-up.svg')" alt="" aria-hidden="true"> {{ Number(r.likes || 0) }}</span><time>{{ String(r.publishedAt || '').slice(0, 10) }}</time></footer>
      </article>
    </main>
    <button class="trb-fab" type="button" @click="go(route('write'))"><img :src="im('reddit-ui/edit.svg')" alt="" aria-hidden="true"></button>
  </template>

  <!-- 등록 완료 -->
  <section v-else-if="view === 'write' && success" class="trb-success"><img :src="im('reddit-ui/recommend-thumb-up.svg')" alt="" aria-hidden="true"><h2>리뷰가 등록됐습니다</h2><p>실사용 경험이 같은 차를 고민하는 회원에게 도움이 됩니다.</p><button type="button" @click="go(route(success))">등록한 리뷰 보기</button></section>

  <!-- 등록 -->
  <form v-else-if="view === 'write'" class="trb-writer" @submit.prevent="publish">
    <header class="trb-top"><button class="trb-icon trb-back" type="button" aria-label="뒤로" @click="writerBack"><img :src="im('reddit-ui/back.svg')" alt="" aria-hidden="true"></button><h1>오너 리뷰 등록</h1><button class="trb-icon" type="submit">등록</button></header>
    <section class="trb-progress"><div class="trb-progress-label"><b>30자 작성 시 등록 가능</b><span>등록 가능</span><span>우수 리뷰 선정</span></div><div class="trb-progress-line"><i :style="progress ? 'width: ' + progress : undefined" /></div></section>
    <section class="trb-section"><h2>내 차 <small>필수</small></h2><label class="trb-field"><span>차량 선택</span><select v-model="selected" name="vehicle" @change="onVehicle"><option v-for="v in vehicles" :key="v[0]" :value="v[0]">{{ v[1] + ' · ' + v[2] }}</option></select></label><div class="trb-grid-fields"><label class="trb-field"><span>구매 시기 *</span><input v-model="w.purchaseMonth" name="purchaseMonth" type="month"></label><label class="trb-field"><span>실구매 가격 *</span><input v-model="w.purchasePrice" name="purchasePrice" inputmode="numeric" placeholder="만원"></label></div><div class="trb-grid-fields trb-metrics"><label v-for="f in metricFields(selected)" :key="selected + f[0]" class="trb-field"><span>{{ f[1] }} *</span><input v-model="w[f[0]]" :name="f[0]" inputmode="decimal" :placeholder="'0.0 ' + f[2]"></label></div></section>
    <section class="trb-section"><h2>차량 만족도 <small>이 차는 어떤가요?</small></h2><div class="trb-rating"><button v-for="n in 5" :key="n" :class="['trb-rate', { on: rating === n }]" type="button" :data-rating="n" @click="rating = n"><img :src="star" alt=""><span>{{ satisfaction[n]![0] }}</span></button></div><p class="trb-rate-comment"><template v-if="rating"><b>{{ satisfaction[rating]![0] }}</b> · {{ satisfaction[rating]![1] }}</template><template v-else>만족도를 선택하면 평가 문구를 보여드려요.</template></p></section>
    <section class="trb-section"><h2>내 차의 장점과 단점 <small>2개 이상 선택</small></h2><div v-for="name in Object.keys(tags)" :key="name" class="trb-eval-row" :data-category="name"><div class="trb-eval-head"><b>{{ name }}</b><button type="button" data-polarity="good" :class="{ on: polarity[name] === 'good' }" @click="choosePolarity(name, 'good')"><img :src="im('reddit-ui/recommend-thumb-up.svg')" alt="" aria-hidden="true"></button><button type="button" data-polarity="bad" :class="{ on: polarity[name] === 'bad' }" @click="choosePolarity(name, 'bad')"><img :src="im('detail-parity/reddit-dislike.svg')" alt="" aria-hidden="true"></button></div><div class="trb-tagpicker"><template v-if="polarity[name]"><button v-for="t in tags[name]![polarity[name] as 'good']" :key="t" type="button" :data-tag="t" :class="{ on: shownOn[name + '|' + t] }" @click="toggleTag(name, t)">{{ t }}</button></template></div></div></section>
    <section class="trb-section"><h2>솔직한 경험을 들려주세요 <small>30자 이상</small></h2><input v-model="w.title" class="trb-title" name="title" maxlength="60" placeholder="리뷰 제목을 입력하세요"><textarea v-model="w.body" class="trb-body" name="body" maxlength="1200" placeholder="연비, 주행 경험, 장점과 아쉬운 점을 구체적으로 적어주세요." @input="onBody" /><div class="trb-counter"><span>최소 30자</span><b><span class="trb-count-text">{{ w.body!.length }}</span> / 1200</b></div><button class="trb-media-add" type="button"><img :src="im('chzzk-detail/icons/camera.svg')" alt="" aria-hidden="true">사진·영상</button><p :class="['trb-error', { show: errorShow }]">{{ errorText }}</p></section>
    <button class="trb-publish" type="submit">리뷰 등록</button>
  </form>

  <!-- 상세 -->
  <template v-else-if="row">
    <article class="trb-detail">
      <header class="trb-top"><button class="trb-icon trb-back" type="button" aria-label="뒤로" @click="go(route(''))"><img :src="im('reddit-ui/back.svg')" alt="" aria-hidden="true"></button><h1>오너 리뷰</h1><button class="trb-icon trb-share" type="button" @click="share"><img :src="im('chzzk-detail/icons/share.svg')" alt="" aria-hidden="true"></button></header>
      <section class="trb-detail-head"><div class="trb-profile"><img class="trb-avatar" :src="boardSrc(row.brandLogo)" :alt="row.brand"><span class="trb-profile-copy"><b>{{ row.author }} · {{ row.ownershipLabel || '실소유자' }}</b><span>{{ row.brand + ' ' + row.model }} 인증 오너 · {{ row.location }}</span></span><button class="trb-follow" type="button" @click="detailFollow = !detailFollow">{{ detailFollow ? '구독 중' : '구독' }}</button></div></section>
      <div class="trb-detail-hero"><img :src="boardSrc(mediaOf(row)[0])" alt=""><span class="trb-count">1 / {{ mediaOf(row).length }}</span><span class="trb-dots"><i v-for="(m, i) in mediaOf(row)" :key="i" /></span></div>
      <section class="trb-article"><h2>{{ row.title }}</h2><p>{{ row.body }}</p><section class="trb-scorecard"><header><img :src="boardSrc(row.brandLogo)" alt=""><strong>{{ row.brand + ' ' + row.model }}</strong><b>{{ Number(row.satisfaction || 0).toFixed(1) }}</b></header><div class="trb-scoregrid"><span><b>만족도</b>{{ row.satisfactionLabel }}</span><span><b>동력원</b>{{ powerLabels[row.powertrain] }}</span><span><b>실연비</b>{{ row.fuelConsumption ? row.fuelConsumption + ' L/100km' : '해당 없음' }}</span><span><b>실주행거리</b>{{ row.fullChargeRange ? row.fullChargeRange + ' km' : '해당 없음' }}</span></div></section><div class="trb-tags"><span v-for="(t, i) in (row.highlights || []).concat(row.drawbacks || [])" :key="i">{{ t }}</span></div><div class="trb-ownerinfo"><span>구매 시기<b>{{ row.purchaseMonth }}</b></span><span>구매 가격<b>{{ row.purchasePrice }}만원</b></span><span>인증 여부<b>{{ row.ownershipLabel || '실소유자' }}</b></span><span>등록 지역<b>{{ row.location }}</b></span></div></section>
      <section class="trb-comments"><h3>댓글 {{ Number(row.comments || 0) + thread.length }}</h3><div v-for="(c, i) in thread" :key="i" class="trb-comment"><img :src="communityAsset('assets/profile-avatars/avatar-' + String(i % 48 + 1).padStart(2, '0') + '.svg')" alt=""><div><b>{{ c.author }}</b><p>{{ c.body }}</p></div></div><div class="trb-comment"><img :src="communityAsset('assets/profile-avatars/avatar-07.svg')" alt=""><div><b>승차감기록</b><p>실사용자가 정리해 주셔서 도움이 됐습니다. 장거리 피로도는 어떤가요?</p></div></div></section>
    </article>
    <footer class="trb-sticky"><button class="trb-comment-input" type="button" @click="addComment">댓글을 남겨보세요</button><button :class="['trb-like', { on: likeOn }]" type="button" @click="likeOn = !likeOn"><img :src="im('reddit-ui/recommend-thumb-up.svg')" alt="" aria-hidden="true"></button><button type="button"><img :src="im('heart.svg')" alt="" aria-hidden="true"></button></footer>
  </template>
</template>
