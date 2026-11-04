<script setup lang="ts">
// 처즈왕 보조 화면: 검색(?czw=search&qs=) · 해결 소식(news, news-N) · 공식 발표(official) · 법률 상담(legal) · 업체 불만 상세(czw-b…)
// 정본: chezhiwang-complaint-stats.js renderSearch · renderNews · renderNewsDetail · renderOfficial · renderLegal · renderBiz
import { boardSrc, readJson, useBoardQuery, writeJson, type Row } from '~/composables/boards/boardUtil'
import { allRows, czsHref, czsIcons, czwSearchKey, pairClass, T } from '~/composables/boards/chezhiwang'

const props = defineProps<{ q: Record<string, string>; kind: 'search' | 'news' | 'newsDetail' | 'official' | 'legal' | 'biz' }>()
const emit = defineEmits<{ go: [p: Record<string, string>]; toast: [text: string] }>()
const { href } = useBoardQuery()
const go = (p: Record<string, string>) => emit('go', p)
const si = (n: string) => boardSrc(czsIcons[n])
const H = (params: Record<string, string | undefined>) => czsHref(props.q, params)
const id = computed(() => props.q.czw || '')

// 검색
const term = computed(() => props.q.qs || '')
const hist = ref<string[]>(readJson<string[]>(czwSearchKey, []) || [])
const searchInput = ref(term.value)
const inputEl = ref<HTMLInputElement | null>(null)
const results = computed(() => (term.value ? allRows().concat(T().businesses || []).filter((r: Row) => [r.brand, r.model, r.trim, r.title, r.businessName, (r.problems || []).map((p: string[]) => p.join(' ')).join(' ')].join(' ').toLowerCase().indexOf(term.value.toLowerCase()) > -1) : []))
function run() {
  const v = searchInput.value.trim(); if (!v) return
  const next = hist.value.filter(x => x !== v); next.unshift(v)
  writeJson(czwSearchKey, next.slice(0, 10))
  hist.value = next.slice(0, 10)
  go(H({ czw: 'search', qs: v }))
}
function clearHist() { try { localStorage.setItem(czwSearchKey, '[]') } catch { /* 무시 */ } hist.value = [] }
onMounted(() => { if (props.kind === 'search' && !term.value) setTimeout(() => inputEl.value?.focus(), 50) })
watch(term, (v) => { searchInput.value = v })

// 소식 · 공식 발표 · 업체
const news = computed<Row[]>(() => T().news || [])
const newsItem = computed(() => news.value[Number(id.value.slice(5))])
const official = computed<Row[]>(() => T().official || [])
const biz = computed<Row | undefined>(() => (T().businesses || []).find((x: Row) => x.complaintId === id.value))
const bizSame = computed(() => (T().businesses || []).filter((x: Row) => x !== biz.value).slice(0, 4))
const legalFields = ['신차 결함·교환·환불', '중고차 허위·누락 고지', '정비 과실·수리비', '리스·렌트 계약', '보험 처리 분쟁']
</script>

<template>
  <section v-if="kind === 'search'" class="czs-page">
    <header class="czs-bar is-search"><button type="button" data-back aria-label="뒤로" @click="go(H({}))"><img :src="si('back')" alt="" loading="lazy"></button><label class="czs-sbox"><img :src="si('search')" alt="" loading="lazy"><input ref="inputEl" v-model="searchInput" type="search" placeholder="모델·증상·업체로 검색" aria-label="검색어" @keydown.enter="run"></label><button type="button" class="czs-go" data-go @click="run">검색</button></header>
    <template v-if="term">
      <p class="czs-rank-sub">검색 결과 <b>{{ results.length }}</b>건</p>
      <template v-if="results.length"><a v-for="(r, i) in results" :key="i" class="czs-result" :href="href(H({ czw: r.complaintId || r.id }))" @click.prevent="go(H({ czw: r.complaintId || r.id }))"><b>{{ (r.kind === 'business' ? '' : [r.brand, r.model].join(' ') + ' ') + r.title }}</b><span>{{ r.kind === 'business' ? r.businessType + ' · ' + r.businessName : [r.brand, r.model, r.trim].join(' / ') }}</span><div class="czw-pairs"><span v-for="(p, j) in (r.problems || [])" :key="j" :class="'czw-pair ' + pairClass(p[0])"><i>{{ p[0] }}</i><em>{{ p[1] }}</em></span></div></a></template>
      <p v-else class="czs-empty">검색 결과가 없습니다</p>
    </template>
    <div v-else class="czs-history"><div class="czs-sec-head"><h2>검색 기록</h2><button v-if="hist.length" type="button" data-clear aria-label="검색 기록 전체 삭제" @click="clearHist"><img :src="si('del')" alt="" loading="lazy"></button></div><div class="czs-hchips"><template v-if="hist.length"><a v-for="h in hist" :key="h" :href="href(H({ czw: 'search', qs: h }))" @click.prevent="go(H({ czw: 'search', qs: h }))">{{ h }}</a></template><p v-else class="czs-note">최근 검색어가 없습니다</p></div></div>
  </section>

  <article v-else-if="kind === 'newsDetail' && newsItem" class="czs-page">
    <header class="czs-bar"><button type="button" data-back aria-label="뒤로" @click="go(H({ czw: 'news' }))"><img :src="si('back')" alt="" loading="lazy"></button><strong>해결 소식</strong><span /></header>
    <section class="czs-main"><h1>{{ newsItem[1] }}</h1><div class="czs-who is-big"><span class="czs-avatar">{{ String(newsItem[0]).slice(0, 1) }}</span><span><b>{{ newsItem[0] }} <i>작성자</i></b><small>{{ newsItem[5] }}</small></span></div><p class="czs-body">{{ newsItem[2] }}</p><a class="czs-more" :href="href(H({ f_model: newsItem[4] }))" @click.prevent="go(H({ f_model: newsItem[4] }))">{{ newsItem[3] + ' ' + newsItem[4] }} 결함·불만 모아 보기 <img class="czs-chev-r" :src="si('right')" alt="" loading="lazy"></a></section>
    <section class="czs-sec"><div class="czs-sec-head"><h2>전체 댓글</h2></div><p class="czs-empty">아직 댓글이 없습니다</p></section>
  </article>

  <section v-else-if="kind === 'news' || kind === 'newsDetail'" class="czs-page">
    <header class="czs-bar"><button type="button" data-back aria-label="뒤로" @click="go(H({}))"><img :src="si('back')" alt="" loading="lazy"></button><strong>해결 소식</strong><span><a :href="href(H({ czw: 'search' }))" aria-label="검색" @click.prevent="go(H({ czw: 'search' }))"><img :src="si('search')" alt="" loading="lazy"></a></span></header>
    <p class="czs-rank-sub">결함·불만을 공개한 뒤 어떻게 해결됐는지 작성자가 직접 남긴 소식입니다.</p>
    <a v-for="(n, i) in news" :key="i" class="czs-news-item" :href="href(H({ czw: 'news-' + i }))" @click.prevent="go(H({ czw: 'news-' + i }))"><span class="czs-who"><span class="czs-avatar">{{ String(n[0]).slice(0, 1) }}</span>{{ n[0] }}</span><b>{{ n[1] }}</b><span class="czs-news-meta"><time>{{ n[5] }}</time><span>조회 {{ n[6] }}</span><span>댓글 {{ n[7] }}</span></span></a>
    <div class="czs-bottom"><button type="button" data-post @click="emit('toast', '해결 소식 작성은 다음 단계에서 연결합니다')">+ 소식 올리기</button></div>
  </section>

  <section v-else-if="kind === 'official'" class="czs-page">
    <header class="czs-bar"><button type="button" data-back aria-label="뒤로" @click="go(H({}))"><img :src="si('back')" alt="" loading="lazy"></button><strong>공식 발표</strong><span /></header>
    <article v-for="(x, i) in official" :key="i" class="czs-official"><b>{{ x[1] }}</b><p>{{ x[2] }}</p><span><i>{{ x[0] }}</i><time>{{ x[3] }}</time></span></article>
    <p class="czs-rank-sub">제조사·기관의 공식 입장은 확인되는 대로 이곳에 모읍니다.</p>
  </section>

  <section v-else-if="kind === 'legal'" class="czs-page">
    <header class="czs-bar"><button type="button" data-back aria-label="뒤로" @click="go(H({}))"><img :src="si('back')" alt="" loading="lazy"></button><strong>법률 상담</strong><span /></header>
    <div class="czs-legal-hero"><b>보배드림 &amp; 제휴 법률사무소</b><small>차량 분쟁 상담 연결 · 제휴 준비 중</small></div>
    <section class="czs-main"><h2 class="czs-legal-h">상담 가능 분야</h2><div class="czs-hchips"><a v-for="v in legalFields" :key="v">{{ v }}</a></div><h2 class="czs-legal-h">먼저 이용할 수 있는 곳</h2><ul class="czs-legal-list"><li><b>1372 소비자상담센터</b><span>한국소비자원 피해구제·분쟁조정 안내</span></li><li><b>자동차리콜센터</b><span>국토교통부 리콜 대상 조회·결함 신고</span></li></ul><p class="czs-private">제휴 변호사 정보와 상담 신청은 제휴가 확정되면 공개합니다.</p></section>
  </section>

  <article v-else-if="kind === 'biz' && biz" class="czs-page">
    <header class="czs-bar"><button type="button" data-back aria-label="뒤로" @click="go(H({ czwtab: 'biz' }))"><img :src="si('back')" alt="" loading="lazy"></button><strong>불만 상세</strong><span /></header>
    <section class="czs-main"><h1>{{ biz.title }}</h1><dl class="czw-infobox"><div><dt>업체 유형</dt><dd>{{ biz.businessType }}</dd></div><div><dt>업체</dt><dd>{{ biz.businessName }}</dd></div><div><dt>등록 시각</dt><dd>{{ String(biz.publishedAt).slice(0, 16).replace('T', ' ') }}</dd></div></dl><div class="czw-typical"><b>대표 문제</b><div class="czw-pairs"><span v-for="(p, j) in biz.problems" :key="j" :class="'czw-pair ' + pairClass(p[0])"><i>{{ p[0] }}</i><em>{{ p[1] }}</em></span></div></div><p class="czs-body">{{ biz.body }}</p><p class="czs-private">업체명은 가림 처리했습니다. 연락처·계약서 원본은 공개되지 않습니다.</p></section>
    <section class="czs-sec"><div class="czs-sec-head"><h2>다른 업체 불만</h2></div><a v-for="x in bizSame" :key="x.complaintId" class="czs-news-row" :href="href(H({ czw: x.complaintId }))" @click.prevent="go(H({ czw: x.complaintId }))"><b>{{ x.title }}</b><span><em>{{ x.businessType + ' · ' + x.businessName }}</em><time>{{ String(x.publishedAt).slice(0, 10) }}</time></span></a></section>
  </article>
</template>
