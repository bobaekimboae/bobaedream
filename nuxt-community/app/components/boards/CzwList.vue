<script setup lang="ts">
// 처즈왕 목록: board.js renderList + stats.js enhanceList 를 마친 뒤의 모양(진입 카드 · 탭 · 필터 줄 · 건수 · 정렬 · 30건씩 더 보기 · 영상 · 업체 불만)
import { boardSrc, useBoardQuery, type Row } from '~/composables/boards/boardUtil'
import { allRows, boardPairs, carName, chipList, current, czsHref, czsIcons, czwIcons, czwRoute, dropChip, match, pairClass, T } from '~/composables/boards/chezhiwang'

const props = defineProps<{ q: Record<string, string> }>()
const emit = defineEmits<{ go: [p: Record<string, string>] }>()
const { href } = useBoardQuery()
const ic = (n: string) => boardSrc(czwIcons[n])
const si = (n: string) => boardSrc(czsIcons[n])
const logo = (r: Row) => boardSrc(r.brandLogo || '../%61ssets/vehicle-catalog/logos/logo_hyundai.png')
const photo = (r: Row) => boardSrc(String(r.thumbnail || '').split('|')[0] || '../%61ssets/cars/seoul-autogallery-v01/sag-01-1.webp')
const go = (p: Record<string, string>) => emit('go', p)
const H = (params: Record<string, string | undefined>) => czsHref(props.q, params)

const o = computed(() => current(props.q))
const tab = computed(() => props.q.czwtab || '')
const sort = computed(() => props.q.czsort || '')
const chips = computed(() => chipList(o.value, false))
// board.js renderList: 전체 글(issue 거르기) → stats.js: 정렬 · 필터 · 탭
const visible = computed(() => {
  let data = allRows()
  const issue = props.q.issue
  if (issue && issue !== '전체') data = data.filter(r => r.issueType === issue)
  if (sort.value && data.length) data = data.slice().sort((a, b) => (sort.value === 'like' ? Number(b.likes || 0) - Number(a.likes || 0) : Number(b.comments || 0) - Number(a.comments || 0)))
  if (tab.value === 'biz') return []
  return data.filter(r => match(r, o.value) && (tab.value !== 'video' || r.hasVideo))
})
const biz = computed(() => (tab.value === 'biz' ? ((T().businesses || []) as Row[]).filter(b => match({ ...b }, o.value)) : []))
const shown = computed(() => (tab.value === 'biz' ? biz.value.length : visible.value.length))
const PAGE = 30
const limit = ref(PAGE)
watch(() => props.q, () => { limit.value = PAGE })
const paged = computed(() => visible.value.slice(0, limit.value))
const tabs: Array<[string, string]> = [['', '불만 목록'], ['video', '불만 영상'], ['biz', '업체 불만']]
const sorts: Array<[string, string]> = [['', '최신순'], ['like', '공감순'], ['comment', '댓글순']]
const durations = ['0:42', '1:15', '0:58', '2:03', '0:36']
const trimLine = (r: Row) => [r.brand, r.model, r.trim].filter(Boolean).join(' / ')
const dealer = (r: Row) => [r.dealerGroup, r.dealerBranch].filter(Boolean).join(' · ')
</script>

<template>
  <section class="czw-list">
    <header class="czw-bar"><button type="button" data-back @click="go(czwRoute(q, ''))"><img :src="ic('back')" alt="뒤로"></button><strong>처즈왕 결함·불만</strong><span class="czs-bar-links"><a class="czs-rank-link" :href="href(H({ czw: 'rank' }))" @click.prevent="go(H({ czw: 'rank' }))">순위</a><a class="czs-search-link" :href="href(H({ czw: 'search' }))" aria-label="검색" @click.prevent="go(H({ czw: 'search' }))"><img :src="si('search')" alt="" loading="lazy"></a></span></header>
    <div class="czw-hero"><h1>차량 결함·불만</h1><p>결함과 판매·정비 경험을 공개하고 같은 사례의 제보와 해결 경험을 모읍니다.</p></div>
    <nav class="czs-entry"><a class="is-legal" :href="href(H({ czw: 'legal' }))" @click.prevent="go(H({ czw: 'legal' }))"><b>법률 상담</b><small>LEGAL ADVICE</small></a><a class="is-official" :href="href(H({ czw: 'official' }))" @click.prevent="go(H({ czw: 'official' }))"><b>공식 발표</b><small>OFFICIAL</small></a><a class="is-news" :href="href(H({ czw: 'news' }))" @click.prevent="go(H({ czw: 'news' }))"><b>해결 소식</b><small>RESOLVED</small></a></nav>
    <nav class="czw-tabs czs-done"><a v-for="t in tabs" :key="t[0]" :class="tab === t[0] ? 'on' : ''" :href="href(H({ ...current(q), czwtab: t[0] }))" @click.prevent="go(H({ ...current(q), czwtab: t[0] }))">{{ t[1] }}</a></nav>
    <div class="czs-filterbar"><div class="czs-chips"><button v-for="(c, i) in chips" :key="i" type="button" class="czs-chip" :data-drop="c.drop" :data-value="c.value" @click.stop="go(dropChip(q, c))">{{ c.label }}<span>×</span></button></div><a :href="href(H({ ...o, czw: 'filter', czwtab: tab }))" @click.prevent="go(H({ ...o, czw: 'filter', czwtab: tab }))"><img :src="si('filter')" alt="" loading="lazy">필터</a></div>
    <article v-for="b in biz" :key="b.complaintId" class="czw-card czs-biz" :data-id="b.complaintId"><a class="czw-main" :href="href(H({ czw: b.complaintId }))" @click.prevent="go(H({ czw: b.complaintId }))"><h2>{{ b.title }}<span v-if="b.hasPhoto" class="czw-mark is-photo" aria-label="사진 첨부" /></h2><p class="czw-trimline">{{ b.businessType + ' · ' + b.businessName }}</p><div class="czw-typical"><b>대표 문제</b><div class="czw-pairs"><span v-for="(p, i) in b.problems" :key="i" :class="'czw-pair ' + pairClass(p[0])"><i>{{ p[0] }}</i><em>{{ p[1] }}</em></span></div></div><footer class="czw-meta"><span><img :src="si('chat')" alt="" loading="lazy">{{ Number(b.comments || 0) }}</span><span><img :src="si('like')" alt="" loading="lazy">{{ Number(b.likes || 0) }}</span><time>{{ String(b.publishedAt).slice(0, 10) }}</time></footer></a></article>
    <p v-if="!shown" class="czs-empty">조건에 맞는 결함·불만이 없습니다</p>
    <div v-if="tab !== 'biz'" class="czs-listmeta"><span>총 <b>{{ shown.toLocaleString('ko-KR') }}</b>건</span><nav aria-label="정렬"><a v-for="t in sorts" :key="t[0]" :class="sort === t[0] ? 'on' : ''" :href="href(H({ ...current(q), czwtab: tab, czsort: t[0] }))" @click.prevent="go(H({ ...current(q), czwtab: tab, czsort: t[0] }))">{{ t[1] }}</a></nav></div>
    <article v-for="r in paged" :key="String(r.complaintId || r.id)" :class="['czw-card', { 'is-video-card': tab === 'video' }]" :data-id="r.complaintId || r.id">
      <div class="czw-profile"><img class="czw-avatar" :src="logo(r)" :alt="r.brand + ' 로고'"><span><b>{{ r.author || '보배드림 회원' }}<template v-if="r.verified">{{ ' ' }}<i>✓ 실차주</i></template></b><small>{{ r.brand + ' ' + r.model + ' · ' + (r.city || '지역 미입력') }}</small></span><em>{{ r.publicLabel || '공개' }}</em></div>
      <button class="czw-main" type="button" @click="go(czwRoute(q, String(r.complaintId || r.id)))"><div class="czw-card-head"><div><h2><span class="czw-carname">{{ carName(r) }}</span> {{ r.title }}<span v-if="r.hasPhoto" class="czw-mark is-photo" aria-label="사진 첨부" /><span v-if="r.hasVideo" class="czw-mark is-video" aria-label="영상 첨부" /></h2><p class="czw-trimline">{{ trimLine(r) }}</p></div><span class="czw-thumb"><img :src="photo(r)" :alt="carName(r)" loading="lazy"></span></div><div v-if="tab === 'video'" class="czs-vthumb"><img :src="boardSrc(String(r.thumbnail || '').split('|')[0])" :alt="r.model" loading="lazy"><span class="czs-play" aria-label="영상 재생" /><em>{{ durations[Number(String(r.id).slice(-1)) % 5] }}</em></div><div class="czw-typical"><b>대표 문제</b><div class="czw-pairs"><span v-for="(p, i) in boardPairs(r)" :key="i" :class="'czw-pair ' + p.cls"><i>{{ p.a }}</i><em>{{ p.b }}</em></span></div></div><p v-if="dealer(r)" class="czw-dealer"><b>딜러</b>{{ dealer(r) }}</p><footer class="czw-meta"><span><img :src="ic('chat')" alt="">{{ Number(r.comments || 0) }}</span><span><img :src="ic('like')" alt="">{{ Number(r.likes || 0) }}</span><time>{{ String(r.publishedAt || '').slice(0, 10) }}</time></footer></button>
    </article>
    <button v-if="tab !== 'biz' && visible.length > limit" type="button" class="czs-more" @click="limit += PAGE">더 보기 ({{ Math.min(limit, visible.length).toLocaleString('ko-KR') }} / {{ visible.length.toLocaleString('ko-KR') }})</button>
    <button class="czw-fab" type="button" @click="go(czwRoute(q, 'write'))"><img :src="ic('write')" alt="">불만 등록</button>
  </section>
</template>
