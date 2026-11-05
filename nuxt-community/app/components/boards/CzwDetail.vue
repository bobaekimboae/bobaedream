<script setup lang="ts">
// 처즈왕 상세: board.js renderDetail + stats.js enhanceDetail(차량 카드 · 해결 소식)
import { boardSrc, readJson, useBoardQuery, writeJson, type Row } from '~/composables/boards/boardUtil'
import { allRows, boardPairs, carName, czsHref, czsIcons, czwCommentKey, czwIcons, czwRoute, findRow, T } from '~/composables/boards/chezhiwang'

const props = defineProps<{ q: Record<string, string>; id: string }>()
const emit = defineEmits<{ go: [p: Record<string, string>] }>()
const { href } = useBoardQuery()
const ic = (n: string) => boardSrc(czwIcons[n])
const si = (n: string) => boardSrc(czsIcons[n])
const go = (p: Record<string, string>) => emit('go', p)
const H = (params: Record<string, string | undefined>) => czsHref(props.q, params)
const logo = (r: Row) => boardSrc(r.brandLogo || '../%61ssets/vehicle-catalog/logos/logo_hyundai.png')
const photo = (r: Row) => boardSrc(String(r.thumbnail || '').split('|')[0] || '../%61ssets/cars/seoul-autogallery-v01/sag-01-1.webp')

const r = computed(() => findRow(props.id)!)
// enhanceDetail 은 id 가 정확히 맞는 글에만 붙는다
const exact = computed(() => allRows().find(x => String(x.complaintId || x.id) === props.id))
const saved = ref<Row[]>(readJson<Row[]>(czwCommentKey + '.' + props.id, []) || [])
const input = ref('')
const loadedLocal = saved.value.length // 정적 판은 댓글을 더해도 제목의 댓글 수를 다시 쓰지 않는다
const saveOn = ref(false)
const likeOn = ref(false)
const fixed = [{ author: '정비노트', body: '재현 조건과 경고등 사진, 정비명세서를 함께 보관하면 원인 확인에 도움이 됩니다.' }, { author: '안전제보', body: '주행 안전과 관련된 증상이라면 운행을 멈추고 긴급출동을 먼저 이용하세요.' }]
const info = computed(() => ([['제조사', r.value.brand], ['모델', r.value.model], ['세부 모델', r.value.trim], ['딜러', [r.value.dealerGroup, r.value.dealerBranch].filter(Boolean).join(' · ')], ['등록 시각', String(r.value.publishedAt || '').slice(0, 16).replace('T', ' ')]] as Array<[string, string]>).filter(v => v[1]))
const facts = computed(() => [['구매일', r.value.purchaseDate || '미입력'], ['문제 발생일', r.value.problemDate || '미입력'], ['사고 여부', r.value.accident || '없음'], ['인명 피해', r.value.injury || '없음'], ['발생 주행거리', Number(r.value.odometer || 0).toLocaleString() + 'km']])
const related = computed(() => allRows().filter(x => x !== r.value && x.model === r.value.model).slice(0, 5))
const newsAll = computed<Row[]>(() => T().news || [])
const news = computed(() => { const pick = newsAll.value.filter(n => n[3] === exact.value?.brand); return (pick.length ? pick : newsAll.value).slice(0, 3) })
function add() {
  if (!input.value.trim()) return
  saved.value.unshift({ author: '보배드림 회원', body: input.value.trim() })
  writeJson(czwCommentKey + '.' + props.id, saved.value)
  input.value = ''
}
function share() { if (navigator.clipboard) navigator.clipboard.writeText(location.href) }
</script>

<template>
  <article class="czw-detail">
    <header class="czw-bar"><button type="button" data-back @click="go(czwRoute(q, ''))"><img :src="ic('back')" alt="뒤로"></button><strong>불만 상세</strong><button type="button" data-share @click="share"><img :src="ic('share')" alt="공유"></button></header>
    <div class="czw-profile"><img class="czw-avatar" :src="logo(r)" :alt="r.brand + ' 로고'"><span><b>{{ r.author || '보배드림 회원' }}<template v-if="r.verified">{{ ' ' }}<i>✓ 실차주</i></template></b><small>{{ r.brand + ' ' + r.model + ' · ' + (r.city || '지역 미입력') }}</small></span><em>{{ r.publicLabel || '공개' }}</em></div>
    <section class="czw-detail-title"><h1><span class="czw-carname">{{ carName(r) }}</span> {{ r.title }}<span v-if="r.hasPhoto" class="czw-mark is-photo" aria-label="사진 첨부" /><span v-if="r.hasVideo" class="czw-mark is-video" aria-label="영상 첨부" /></h1><dl class="czw-infobox"><div v-for="v in info" :key="v[0]"><dt>{{ v[0] }}</dt><dd>{{ v[1] }}</dd></div></dl><div class="czw-typical"><b>대표 문제</b><div class="czw-pairs"><span v-for="(p, i) in boardPairs(r)" :key="i" :class="'czw-pair ' + p.cls"><i>{{ p.a }}</i><em>{{ p.b }}</em></span></div></div></section>
    <section class="czw-facts"><h2>발생 정보</h2><dl class="czw-fact-grid"><div v-for="v in facts" :key="v[0]"><dt>{{ v[0] }}</dt><dd>{{ v[1] }}</dd></div></dl><p>차대번호·엔진번호·차량번호·연락처는 작성 확인용이며 공개되지 않습니다.</p></section>
    <section class="czw-content"><h2>불만 내용</h2><p>{{ r.body || r.summary }}</p><div class="czw-photo"><img :src="photo(r)" :alt="r.brand + ' ' + r.model"></div><a v-if="exact" class="czs-carcard" :href="href(H({ f_model: exact.model }))" @click.prevent="go(H({ f_model: exact.model }))"><img :src="boardSrc(exact.thumbnail)" :alt="exact.model" loading="lazy"><span><b>{{ exact.model }}</b><small>{{ exact.brand + ' / ' + (exact.bodyType || '') }}</small><small>연료: {{ exact.fuel || '-' }}</small><small>가격대: <em>{{ exact.priceBand || '-' }}</em></small></span></a></section>
    <section v-if="exact" class="czs-sec"><div class="czs-sec-head"><h2>해결 소식</h2><a :href="href(H({ czw: 'news' }))" @click.prevent="go(H({ czw: 'news' }))">소식 올리기 <img class="czs-chev-r" :src="si('right')" alt="" loading="lazy"></a></div><a v-for="n in news" :key="newsAll.indexOf(n)" class="czs-news-row" :href="href(H({ czw: 'news-' + newsAll.indexOf(n) }))" @click.prevent="go(H({ czw: 'news-' + newsAll.indexOf(n) }))"><b>{{ n[1] }}</b><span><i>해결 소식</i><time>{{ n[5] }}</time></span></a></section>
    <section v-if="related.length" class="czw-related"><h2>{{ carName(r) }} 다른 결함</h2><a v-for="x in related" :key="String(x.complaintId || x.id)" :href="href(czwRoute(q, String(x.complaintId || x.id)))" @click.prevent="go(czwRoute(q, String(x.complaintId || x.id)))"><b>{{ x.title }}</b><span><em>{{ (x.problems && x.problems[0] ? x.problems[0].join(' · ') : x.subtypes) || '' }}</em><time>{{ String(x.publishedAt || '').slice(0, 10) }}</time></span></a></section>
    <section class="czw-comments"><h2>댓글 {{ Number(r.comments || 0) + loadedLocal }}</h2><div data-comments><article v-for="(c, i) in saved.concat(fixed)" :key="i" class="czw-comment"><img :src="logo(r)" alt=""><div><b>{{ c.author }}</b><p>{{ c.body }}</p></div></article></div></section>
    <footer class="czw-actions"><input v-model="input" aria-label="댓글 입력" maxlength="300" placeholder="같은 사례나 해결 경험을 남겨주세요"><button data-comment @click="add"><img :src="ic('chat')" alt="등록"></button><button data-save :class="{ on: saveOn }" @click="saveOn = !saveOn"><img :src="ic('save')" alt="저장"></button><button data-like :class="{ on: likeOn }" @click="likeOn = !likeOn"><img :src="ic('like')" alt="공감"></button></footer>
  </article>
</template>
