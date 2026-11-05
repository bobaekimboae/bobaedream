<script setup lang="ts">
// 처즈왕 순위(?czw=rank&rank=brand|part|symptom|sales|ratio). 정본: chezhiwang-complaint-stats.js renderRank
import { boardSrc, useBoardQuery, type Row } from '~/composables/boards/boardUtil'
import { allRows, chipList, current, czsHref, czsIcons, dropChip, groupKey, groupName, match, pairClass } from '~/composables/boards/chezhiwang'

const props = defineProps<{ q: Record<string, string> }>()
const emit = defineEmits<{ go: [p: Record<string, string>]; toast: [text: string] }>()
const { href } = useBoardQuery()
const go = (p: Record<string, string>) => emit('go', p)
const si = (n: string) => boardSrc(czsIcons[n])
const H = (params: Record<string, string | undefined>) => czsHref(props.q, params)

interface Item { name?: string; img?: string; sub?: string; part?: string; brand?: string; model?: string; body?: string; sales?: number; ratio?: number; n: number; pairs: Record<string, number>; models?: Record<string, number>; link?: Record<string, string>; rank?: number }
function rankNo<T extends Record<string, any>>(arr: T[], key: string) { let prev: unknown = null; let rank = 0; return arr.map((x, i) => { if (prev === null || x[key] !== prev) rank = i + 1; prev = x[key]; (x as Row).rank = rank; return x }) }
function topPairs(m: Record<string, number>, n?: number) { return Object.keys(m).sort((a, b) => m[b]! - m[a]!).slice(0, n || 99).map(k => k.split('|')) }
const bump = (m: Record<string, number>, k: string) => { m[k] = (m[k] || 0) + 1 }

const tab = computed(() => props.q.rank || 'count')
const o = computed(() => { const x: Record<string, string> = current(props.q); if (tab.value === 'ratio' && !x.f_sales) x.f_sales = '1000'; return x })
const rows = computed(() => allRows().filter(r => r.kind !== 'business' && match(r, o.value)))
const arr = computed<Item[]>(() => {
  const by: Record<string, Item> = {}
  const t = tab.value
  if (t === 'brand') {
    rows.value.forEach((r) => { const x = by[r.brand] = by[r.brand] || { name: r.brand, img: r.brandLogo, sub: (r.brandOrigin === '국산' ? '국산' : '수입 · ' + (r.country || '')), n: 0, pairs: {}, models: {} }; x.n++; bump(x.models!, r.model); (r.problems || []).forEach((p: string[]) => bump(x.pairs, p[0] + '|' + p[1])) })
    return rankNo(Object.keys(by).map((k) => { const x = by[k]!; x.sub += ' · 최다 ' + topPairs(x.models!, 1)[0]; x.link = H({ f_brand: x.name }); return x }).sort((a, b) => b.n - a.n), 'n')
  }
  if (t === 'part') {
    rows.value.forEach((r) => { const seen: Record<string, number> = {}; (r.problems || []).forEach((p: string[]) => { if (seen[p[0]!]) return; seen[p[0]!] = 1; const x = by[p[0]!] = by[p[0]!] || { name: p[0], sub: groupName(p[0]!) + ' 문제', n: 0, pairs: {}, models: {} }; x.n++; bump(x.models!, r.brand + ' ' + r.model); (r.problems || []).forEach((z: string[]) => { if (z[0] === p[0]) bump(x.pairs, z[0] + '|' + z[1]) }) }) })
    return rankNo(Object.keys(by).map((k) => { const x = by[k]!; const l: Record<string, string> = {}; l[groupKey(x.name!)] = x.name!; x.sub += ' · 많은 차종 ' + topPairs(x.models!, 2).map(v => v[0]).join(', '); x.link = H(l); return x }).sort((a, b) => b.n - a.n), 'n')
  }
  if (t === 'symptom') {
    rows.value.forEach((r) => { (r.problems || []).forEach((p: string[]) => { const k = p[0] + '|' + p[1]; const x = by[k] = by[k] || { name: p[1], part: p[0], n: 0, pairs: {}, models: {} }; x.n++; bump(x.models!, r.brand + ' ' + r.model) }) })
    return rankNo(Object.keys(by).map((k) => { const x = by[k]!; x.sub = x.part + ' · 많은 차종 ' + topPairs(x.models!, 2).map(v => v[0]).join(', '); x.link = H({ czw: 'search', qs: x.name }); return x }).sort((a, b) => b.n - a.n).slice(0, 50), 'n')
  }
  rows.value.forEach((r) => { const k = r.brand + '|' + r.model; const x = by[k] = by[k] || { brand: r.brand, model: r.model, body: (r.carClass && r.bodyType !== '스포츠카' && r.bodyType !== 'MPV' ? r.carClass + ' ' : '') + (r.bodyType || ''), img: r.thumbnail, sales: Number(r.monthlySales || 0), n: 0, pairs: {} }; x.n++; (r.problems || []).forEach((p: string[]) => bump(x.pairs, p[0] + '|' + p[1])) })
  let list = Object.keys(by).map((k) => { const x = by[k]!; x.ratio = x.sales ? Math.round(x.n / x.sales * 10000 * 10) / 10 : 0; return x })
  if (t === 'sales') list = rankNo(list.sort((a, b) => b.sales! - a.sales!), 'sales')
  else if (t === 'ratio') list = rankNo(list.filter(x => x.sales! >= Number(o.value.f_sales)).sort((a, b) => a.ratio! - b.ratio!), 'ratio')
  else list = rankNo(list.sort((a, b) => b.n - a.n), 'n')
  return list
})
const tabs: Array<[string, string]> = [['count', '차종 불만'], ['brand', '브랜드'], ['part', '결함 부위'], ['symptom', '증상'], ['sales', '판매량'], ['ratio', '불만·판매 비율']]
const tabHref = (t: string) => H({ ...current(props.q), czw: 'rank', rank: t === 'count' ? '' : t })
const dates = computed(() => rows.value.map(r => String(r.publishedAt || '').slice(0, 10)).filter(Boolean).sort())
const from = computed(() => o.value.f_from || dates.value[0] || '')
const to = computed(() => o.value.f_to || dates.value[dates.value.length - 1] || '')
const subText = computed(() => ({ ratio: '만 대당 불만 건수 · 수치가 작을수록 좋습니다 · 판매량은 시안용 가상 값', sales: '월 판매량 · 시안용 가상 값', brand: '브랜드별 결함·불만 건수', part: '한 글에 같은 부위가 여러 번 나와도 1건으로 셉니다', symptom: '구체 증상별 건수 · 상위 50개' } as Record<string, string>)[tab.value] || '차종별 결함·불만 건수')
const chips = computed(() => chipList({ ...o.value, f_from: '', f_to: '' }, true))
const filterHref = computed(() => H({ ...current(props.q), czw: 'filter', for: 'rank', rank: tab.value === 'count' ? '' : tab.value }))
const openTypical = reactive<Record<number, boolean>>({})
const badgeClass = (n: number) => 'czs-rank r' + (n <= 3 ? n : 'n')
const typicalPairs = (x: Item) => (tab.value === 'symptom' ? [] : tab.value === 'count' ? topPairs(x.pairs).slice(0, 8) : ['brand', 'part'].includes(tab.value) ? topPairs(x.pairs, 8) : [])
const navEl = ref<HTMLElement | null>(null)
function centerTab() { const nav = navEl.value; const on = nav?.querySelector('a.on') as HTMLElement | null; if (nav && on) nav.scrollLeft = Math.max(0, on.offsetLeft - nav.clientWidth / 2 + on.offsetWidth / 2) }
// 정적 판은 글꼴이 다 받아진 뒤의 너비로 가운데를 맞춘 결과와 같다(넉스트는 처음 그릴 때 글꼴이 덜 받아졌을 수 있다)
onMounted(() => { centerTab(); document.fonts?.ready.then(centerTab); setTimeout(centerTab, 300) })
function share() { if (navigator.clipboard) navigator.clipboard.writeText(location.href); emit('toast', '순위 링크를 복사했습니다') }
</script>

<template>
  <section class="czs-rankpage">
    <header class="czs-bar"><button type="button" data-back aria-label="뒤로" @click="go(H({}))"><img :src="si('back')" alt="" loading="lazy"></button><strong>순위</strong><span><button type="button" data-share aria-label="공유" @click="share"><img :src="si('share')" alt="" loading="lazy"></button></span></header>
    <nav ref="navEl" class="czs-tabs"><a v-for="t in tabs" :key="t[0]" :class="tab === t[0] ? 'on' : ''" :href="href(tabHref(t[0]))" @click.prevent="go(tabHref(t[0]))">{{ t[1] }}</a></nav>
    <div class="czs-rank-head"><div class="czs-chips"><span class="czs-period">{{ from.replace(/-/g, '.') + ' ~ ' + to.replace(/-/g, '.') }}</span><button v-for="(c, i) in chips" :key="i" type="button" class="czs-chip" :data-drop="c.drop" :data-value="c.value" @click.stop="go(dropChip(q, c))">{{ c.label }}<span>×</span></button></div><a :href="href(filterHref)" @click.prevent="go(filterHref)"><img :src="si('filter')" alt="" loading="lazy">필터</a></div>
    <p class="czs-rank-sub">{{ subText }} · 총 {{ rows.length.toLocaleString('ko-KR') }}건</p>
    <div class="czs-rank-list">
      <template v-if="arr.length">
        <article v-for="(x, i) in arr" :key="i" :class="'czs-rank-row' + (['brand', 'part', 'symptom'].includes(tab) ? ' is-' + tab : '')">
          <b :class="badgeClass(x.rank!)">{{ x.rank }}</b>
          <a v-if="['brand', 'part', 'symptom'].includes(tab)" class="czs-rank-car" :href="href(x.link!)" @click.prevent="go(x.link!)"><img v-if="tab === 'brand'" class="czs-rank-logo" :src="boardSrc(x.img)" :alt="x.name" loading="lazy"><i v-else :class="'czs-rank-dot ' + pairClass(x.part || x.name!)" /><span><b>{{ x.name }}</b><small>{{ x.sub }}</small></span><em><b>{{ x.n }}</b>건수(건)</em></a>
          <a v-else class="czs-rank-car" :href="href(H({ f_model: x.model }))" @click.prevent="go(H({ f_model: x.model }))"><img :src="boardSrc(x.img)" :alt="x.model" loading="lazy"><span><b>{{ x.model }}</b><small>{{ x.brand + ' / ' + x.body }}</small></span><em v-if="tab === 'sales'"><b>{{ x.sales!.toLocaleString('ko-KR') }}</b>판매량(대)</em><em v-else-if="tab === 'ratio'"><b><small>만 대당</small> {{ x.ratio!.toFixed(1) }}</b>불만·판매 비율</em><em v-else><b>{{ x.n }}</b>건수(건)</em></a>
          <div v-if="typicalPairs(x).length" :class="['czs-typical', { open: openTypical[i] }]"><button type="button" class="czs-typical-head" :aria-expanded="!!openTypical[i]" @click="openTypical[i] = !openTypical[i]"><b>대표 문제</b><img class="czs-chev" :src="si('chevron')" alt="" loading="lazy"></button><div class="czw-pairs"><span v-for="(p, j) in typicalPairs(x)" :key="j" :class="'czw-pair ' + pairClass(p[0]!)"><i>{{ p[0] }}</i><em>{{ p[1] }}</em></span></div></div>
        </article>
      </template>
      <p v-else class="czs-empty">조건에 맞는 차량이 없습니다</p>
    </div>
    <button type="button" class="czs-make" data-make @click="emit('toast', '순위표 이미지 만들기는 다음 단계에서 연결합니다')">순위표<br>만들기</button>
  </section>
</template>
