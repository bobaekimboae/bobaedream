<script setup lang="ts">
// 연비·전비 게시판(board=fuel-economy). 정본: public/community/fuel-economy-board.js
//  - 목록(동력 방식 필터) · 상세(?energy=<id>)
import type { Ref } from 'vue'
import { boardSrc, boardTable, readJson, setPhoneClass, useBoardQuery, writeJson, type Row } from '~/composables/boards/boardUtil'
import { useListPageCtx } from '~/composables/list/useListPage'

const props = defineProps<{ posts: Row[]; phoneClasses: Set<string>; listClass: Ref<string>; typeLabel: Ref<string> }>()
const page = useListPageCtx()
const { q, edit, go } = useBoardQuery()
const storageKey = 'bobae-fuel-economy-posts-v1'
const commentKey = 'bobae-fuel-economy-comments-v1'
const icons: Record<string, string> = {
  back: 'assets/reddit-ui/back.svg', share: '../%61ssets/detail/autoscout24-share.svg', chat: 'assets/reactions/comment-outline.svg', like: 'assets/reactions/recommend.svg',
  bookmark: '../icons/chotot/chotot-common-bookmark.svg', write: 'assets/reddit-ui/write.svg', check: '../%61ssets/register/chotot-v01/check-mark.svg', location: '../icons/chotot/chotot-common-location-icon.svg',
}
const ic = (name: string) => boardSrc(icons[name])
const modelMeta: Record<string, Row> = {
  'bmw-m3': { brand: 'BMW', model: 'M3', trim: '2023 M3 xDrive 컴페티션 M', powertrain: 'ice', brandLogo: '../%61ssets/brand/kr/bmw.png', photoKey: 'sag-01' },
  'porsche-taycan': { brand: '포르쉐', model: '타이칸', trim: '2023 EV', powertrain: 'ev', brandLogo: '../%61ssets/brand/kr/porsche.png', photoKey: 'sag-02' },
  'lamborghini-urus-phev': { brand: '람보르기니', model: '우루스 SE', trim: '2025 플러그인 하이브리드', powertrain: 'phev', brandLogo: '../%61ssets/brand/kr/lamborghini.png' },
  'lexus-rx450h': { brand: '렉서스', model: 'RX', trim: '2022 RX 450h', powertrain: 'hybrid', brandLogo: '../%61ssets/brand/kr/lexus.png', photoKey: 'sag-06' },
  'mercedes-gls': { brand: '벤츠', model: 'GLS클래스', trim: '2022 GLS 580 4매틱', powertrain: 'ice', brandLogo: '../%61ssets/brand/kr/mercedes-benz.png', photoKey: 'sag-03' },
}
const labels: Record<string, string> = { ice: '내연기관', hybrid: '하이브리드', ev: '전기차', phev: '플러그인 하이브리드' }
const types: Array<[string, string]> = [['all', '전체'], ['ev', '전기차'], ['phev', '플러그인'], ['hybrid', '하이브리드'], ['ice', '내연기관']]
const fixedComments = [{ body: '같은 모델을 운행 중인데 주행 조건을 함께 적어주셔서 비교하기 좋네요.', author: '주말오너' }, { body: '공조 사용과 평균 속도도 다음 기록에 추가해 주시면 더 도움이 될 것 같아요.', author: '전비연구소' }]

/* FUEL_ECONOMY_50_MODELS: share the same model catalogue with list, detail and writer. */
function tableModelMeta(modelId: string): Row {
  const models: Row[] = boardTable('fuel-economy').models || []
  for (const m of models) if (String(m.id) === String(modelId)) return m
  return modelMeta[modelId] || modelMeta['bmw-m3']!
}
function localRows(): Row[] {
  try {
    return (readJson<Row[]>(storageKey, []) || []).map((row) => {
      const meta = tableModelMeta(row.modelId)
      return Object.assign({ energyId: row.id, likes: 0, comments: 0, time: '방금 전', verified: true, images: row.imageData || meta.photo || '', thumbnail: row.imageData || meta.photo || '' }, meta, row)
    })
  } catch { return [] }
}
const rows = computed<Row[]>(() => {
  const byId: Record<string, Row> = {}
  ;(boardTable('fuel-economy').rows || []).forEach((row: Row) => { byId[String(row.energyId || row.id || '')] = row })
  const merged = (props.posts || []).map(row => Object.assign({}, byId[String(row.energyId || row.id || '')] || {}, row))
  return localRows().concat(merged)
})
function images(post: Row): string[] {
  let r: string[] = Array.isArray(post.images) ? post.images : String(post.images || '').split('|')
  if (!r.filter(Boolean).length && post.thumbnail) r = [post.thumbnail]
  return r.filter(Boolean).slice(0, 3)
}
function metrics(post: Row) {
  const out: Array<[string, string, string]> = []
  if (post.energyConsumption) out.push(['평균 전비', post.energyConsumption, 'kWh/100km'])
  if (post.fuelConsumption) out.push(['평균 연비', post.fuelConsumption, 'L/100km'])
  if (post.fullChargeRange) out.push(['완충 실주행', post.fullChargeRange, 'km'])
  return out
}
const cleanTitle = (v: unknown) => String(v || '').replace(/^\[[^\]]+\]\s*/, '')
const bodyLine = (post: Row) => (Array.isArray(post.body) ? post.body.join(' ') : (post.body || post.summary || ''))
const logo = (post: Row) => boardSrc(post.brandLogo || '../%61ssets/brand/kr/hyundai.png')

const active = ref('all')
const followed = reactive<Record<string, boolean>>({})
const visible = computed(() => rows.value.filter(r => active.value === 'all' || r.powertrain === active.value))
function detailLink(id: string) { return edit((p) => { p.board = 'fuel-economy'; p.energy = id }) }
function listLink() { return edit((p) => { p.board = 'fuel-economy'; delete p.energy }) }
function writer() { location.href = siteAsset('?community=fuel-economy&fuel=write&from=community') }

// ── 상세 ──
const energyId = computed(() => q.value.energy || '')
const post = computed<Row | undefined>(() => (energyId.value ? rows.value.find(r => String(r.energyId) === String(energyId.value)) || rows.value[0] : undefined))
const localComments = ref<Row[]>([])
const commentInput = ref('')
const loadedLocal = ref(0) // 정적 판은 댓글을 더해도 댓글 수를 다시 쓰지 않는다
const detailFollow = ref(false)
const saved = ref(false)
const helped = ref(false)
const toastText = ref('')
const toastShow = ref(false)
const commentsEl = ref<HTMLElement | null>(null)
const commentRows = computed(() => (localComments.value as Array<Row | string>).concat(fixedComments))
function share() {
  const done = () => { toastText.value = '주소를 복사했어요'; toastShow.value = true; setTimeout(() => { toastShow.value = false }, 1300) }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(done, done)
  else done()
}
function submit() {
  if (!commentInput.value.trim() || !post.value) return
  localComments.value.unshift({ author: '보배드림 회원', body: commentInput.value.trim() })
  writeJson(commentKey + '.' + post.value.energyId, localComments.value)
  commentInput.value = ''
}

function applyMode(load = false) {
  if (energyId.value) {
    if (!post.value) { go(listLink()); return }
    setPhoneClass(props.phoneClasses, 'phone fuelEconomyDetailMode', load)
    props.listClass.value = 'list fuelEconomyDetailList'
    return
  }
  setPhoneClass(props.phoneClasses, 'phone fuelEconomyBoardMode', load)
  props.listClass.value = 'list fuelEconomyBoardList'
  props.typeLabel.value = '피드형 · 연비·전비 · ' + rows.value.length + '대'
}
watch(() => JSON.stringify(q.value), () => applyMode(true), { immediate: true })
watch(() => page.renderSeq.value, () => applyMode(false))
watch(() => JSON.stringify(q.value), () => { active.value = 'all'; Object.keys(followed).forEach(k => delete followed[k]) })
watch(energyId, (id) => {
  if (!id || !post.value) return
  localComments.value = readJson<Row[]>(commentKey + '.' + post.value.energyId, []) || []
  loadedLocal.value = localComments.value.length
  commentInput.value = ''
  detailFollow.value = saved.value = helped.value = false
  window.scrollTo(0, 0)
}, { immediate: true })
</script>

<template>
  <article v-if="energyId && post" class="feb-detail">
    <header class="feb-detail-head"><button type="button" data-back @click="go(listLink())"><img :src="ic('back')" alt=""></button><strong>연비·전비 기록</strong><button type="button" data-share @click="share"><img :src="ic('share')" alt=""></button></header>
    <section class="feb-author"><span class="feb-avatar is-large"><img :src="logo(post)" :alt="post.brand + ' 엠블럼'"></span><span><h2>{{ post.author || post.user || '보배드림 회원' }}<em v-if="post.verified"><img :src="ic('check')" alt=""> 실차주</em></h2><p>{{ post.brand + ' ' + post.model + ' · ' + (post.city || '지역 미입력') }}</p></span><button type="button" data-follow @click="detailFollow = !detailFollow">{{ detailFollow ? '구독 중' : '구독' }}</button></section>
    <section class="feb-detail-title"><small>{{ labels[post.powertrain] || '자동차' }}</small><h1>{{ cleanTitle(post.title) }}</h1><p>{{ post.trim }}</p></section>
    <section class="feb-detail-metrics"><span v-for="m in metrics(post)" :key="m[0]"><small>{{ m[0] }}</small><b>{{ m[1] }}</b><em>{{ m[2] }}</em></span></section>
    <dl class="feb-facts"><div><dt>현재 총주행거리</dt><dd>{{ Number(post.odometer || 0).toLocaleString() }}km</dd></div><div><dt>주행 지역</dt><dd>{{ post.city || '미입력' }}</dd></div><div><dt>동력 방식</dt><dd>{{ labels[post.powertrain] || '자동차' }}</dd></div><div v-if="post.temperature"><dt>측정 온도</dt><dd>{{ post.temperature }}℃</dd></div><div><dt>기록일</dt><dd>{{ String(post.publishedAt || post.createdAt || '').slice(0, 10) }}</dd></div></dl>
    <section class="feb-detail-body"><p>{{ Array.isArray(post.body) ? post.body.join('\n\n') : (post.body || post.summary || '') }}</p><div v-if="images(post).length" :class="'feb-gallery is-detail is-' + images(post).length"><img v-for="(src, i) in images(post)" :key="i" :src="boardSrc(src)" :alt="post.brand + ' ' + post.model + ' 연비·전비 사진 ' + (i + 1)"></div></section>
    <section ref="commentsEl" class="feb-comments"><header><h3>댓글 <span>{{ Number(post.comments || 0) + loadedLocal }}</span></h3><button type="button">추천순</button></header><form @submit.prevent="submit"><input v-model="commentInput" maxlength="300" placeholder="댓글을 입력하세요" aria-label="댓글 입력"><button :disabled="!commentInput.trim()">등록</button></form><div class="feb-comment-list"><article v-for="(row, i) in commentRows" :key="i"><span class="feb-avatar"><img :src="logo(post)" :alt="post.brand + ' 엠블럼'"></span><div><b>{{ (typeof row === 'object' && row.author) || '보배드림 회원' }}</b><p>{{ typeof row === 'object' ? (row.body || row) : row }}</p><small>방금 전 · 답글</small></div><button><img :src="ic('like')" alt=""></button></article></div></section>
    <footer class="feb-actions"><button data-comments @click="commentsEl?.scrollIntoView({ behavior: 'smooth' })"><img :src="ic('chat')" alt="">댓글 <span>{{ Number(post.comments || 0) + loadedLocal }}</span></button><button data-save :class="{ on: saved }" @click="saved = !saved"><img :src="ic('bookmark')" alt="">{{ saved ? '저장됨' : '저장' }}</button><button data-help :class="{ on: helped }" @click="helped = !helped"><img :src="ic('like')" alt="">도움돼요 <span>{{ Number(post.likes || 0) }}</span></button></footer>
    <p :class="['feb-toast', { show: toastShow }]" role="status">{{ toastText }}</p>
  </article>
  <section v-else-if="!energyId" class="feb-shell">
    <header class="feb-intro"><div><small>REAL WORLD ENERGY</small><h2>실주행 연비·전비</h2><p>차종과 주행 조건별 실제 에너지 기록</p></div><button type="button" data-write @click="writer"><img :src="ic('write')" alt="">기록 등록</button></header>
    <nav aria-label="동력 방식 필터"><button v-for="item in types" :key="item[0]" type="button" :data-type="item[0]" :aria-selected="active === item[0]" @click="active = item[0]; applyMode(false)">{{ item[1] }}</button></nav>
    <div class="feb-cards">
      <article v-for="p in visible" :key="String(p.energyId)" class="feb-card" :data-energy-id="p.energyId">
        <header><span class="feb-avatar"><img :src="logo(p)" :alt="p.brand + ' 엠블럼'"></span><span><b>{{ p.author || p.user || '보배드림 회원' }}<template v-if="p.verified">{{ ' ' }}<i><img :src="ic('check')" alt="">실차주</i></template></b><small>{{ p.brand + ' ' + p.model + ' · ' + labels[p.powertrain] }}</small></span><button type="button" class="feb-follow" @click="followed[p.energyId] = !followed[p.energyId]">{{ followed[p.energyId] ? '구독 중' : '구독' }}</button></header>
        <button type="button" class="feb-card-main" @click="go(detailLink(p.energyId))"><div class="feb-metrics"><span v-for="m in metrics(p)" :key="m[0]"><small>{{ m[0] }}</small><b>{{ m[1] }}</b><em>{{ m[2] }}</em></span></div><h3>{{ cleanTitle(p.title) }}</h3><p>{{ bodyLine(p) }}</p><div v-if="images(p).length" :class="'feb-gallery is-' + images(p).length"><img v-for="(src, i) in images(p)" :key="i" :src="boardSrc(src)" :alt="p.brand + ' ' + p.model + ' 연비·전비 사진 ' + (i + 1)"></div><time>{{ p.time || String(p.publishedAt || '').slice(0, 10) }}</time><footer><span><img :src="ic('location')" alt="">{{ p.city || '지역 미입력' }}</span><span><img :src="ic('chat')" alt="">댓글 {{ Number(p.comments || p.reply || 0) }}</span><span><img :src="ic('like')" alt="">도움돼요 {{ Number(p.likes || 0) }}</span></footer></button>
      </article>
    </div>
  </section>
</template>
