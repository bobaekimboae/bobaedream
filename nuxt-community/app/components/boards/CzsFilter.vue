<script setup lang="ts">
// 처즈왕 필터(?czw=filter, 순위용 ?czw=filter&for=rank). 정본: chezhiwang-complaint-stats.js renderFilter
import { boardSrc, type Row } from '~/composables/boards/boardUtil'
import { allRows, BODY, cats, current, czsHref, czsIcons, fmtDate, FUEL, initial, KEYS, match, PRICE, SALES, vals } from '~/composables/boards/chezhiwang'

const props = defineProps<{ q: Record<string, string> }>()
const emit = defineEmits<{ go: [p: Record<string, string>] }>()
const go = (p: Record<string, string>) => emit('go', p)
const si = (n: string) => boardSrc(czsIcons[n])
const BICON = '../%61ssets/icons/body-type/'
const forRank = props.q.for === 'rank'
const rankTab = props.q.rank || ''
const rows = allRows()
const draft = reactive<Record<string, string[]>>({})
KEYS.forEach((k) => { draft[k] = vals(current(props.q), k) })
if (forRank && !draft.f_from!.length && !draft.f_to!.length) { draft.f_from = ['2026-09-18']; draft.f_to = ['2026-10-17'] }
if (forRank && rankTab === 'ratio' && !draft.f_sales!.length) draft.f_sales = ['1000']
const open = reactive<Record<string, boolean>>({})
const D = (k: string) => draft[k] || []
const c = cats()
type Group = [string, string, string[]?]
const groups: Group[] = forRank
  ? ([['기간', 'date'], ['가격', 'price'], ['차종', 'body'], ['연료', 'fuel'], ['브랜드 속성', 'f_origin', ['국산', '국내 생산 수입 브랜드', '수입']], ['국가', 'f_country', ['국산', '독일', '미국', '일본', '중국', '프랑스', '유럽 기타']]] as Group[])
      .concat(rankTab === 'ratio' ? [['월 판매량', 'sales']] as Group[] : [], [['품질 문제', 'f_quality', c['품질']], ['서비스 문제', 'f_service', c['서비스']]] as Group[])
  : [['제조사', 'pick:f_brand'], ['모델', 'pick:f_model'], ['세부 모델', 'pick:f_trim'], ['기간', 'date'], ['차종', 'body'], ['연료', 'fuel'], ['고장 발생 시기', 'f_age', ['1개월 이내', '1~3개월', '3~6개월', '6~12개월', '1~3년', '3년 이상']], ['품질 문제', 'f_quality', c['품질']], ['서비스 문제', 'f_service', c['서비스']], ['기타 문제', 'f_other', c['기타']]]

const count = computed(() => { const o: Record<string, string> = {}; KEYS.forEach((k) => { if (D(k).length) o[k] = D(k).join(',') }); return rows.filter(r => match(r, o)).length })
const resetDisabled = computed(() => !KEYS.some(k => k !== 'f_sales' && D(k).length))
const sel = computed(() => {
  const out: Array<[string, string]> = []
  ;['f_trim', 'f_model', 'f_brand'].concat(KEYS.filter(k => ['f_from', 'f_to', 'f_trim', 'f_model', 'f_brand', 'f_sales', 'f_pmin', 'f_pmax'].indexOf(k) < 0)).forEach((k) => { D(k).forEach(v => out.push([k, v])) })
  if (D('f_pmin').length || D('f_pmax').length) out.push(['price-range', (D('f_pmin')[0] || '') + '~' + (D('f_pmax')[0] || '') + '만원'])
  return out
})
const period = computed(() => (D('f_from')[0] || '처음').replace(/-/g, '.') + ' ~ ' + (D('f_to')[0] || '오늘').replace(/-/g, '.'))
const isOn = (k: string, v: string) => D(k).indexOf(v) > -1
function toggle(k: string, v: string) {
  const arr = D(k).slice(); const i = arr.indexOf(v)
  if (i > -1) { arr.splice(i, 1); draft[k] = arr; return }
  arr.push(v); draft[k] = arr
  if (k === 'f_body') { const base = v.split('-')[0]!; draft.f_body = arr.filter(x => x === v || (v.indexOf('-') > -1 ? x !== base : x.indexOf(base + '-') !== 0)) }
  if (k === 'f_fuel') { const g = FUEL.filter(f => f[1] && (f[0] === v || f[1].indexOf(v) > -1))[0]; if (g) draft.f_fuel = arr.filter(x => x === v || (v === g[0] ? g[1]!.indexOf(x) < 0 : x !== g[0])) }
}
function unsel(k: string, v: string) {
  if (k === 'price-range') { draft.f_pmin = []; draft.f_pmax = [] } else if (/^f_(brand|model|trim)$/.test(k)) clearPick(k); else draft[k] = D(k).filter(x => x !== v)
}
function clearPick(k: string) { draft[k] = []; if (k === 'f_brand') { draft.f_model = []; draft.f_trim = [] } if (k === 'f_model') draft.f_trim = [] }
function openToggle(k: string) {
  Object.keys(open).forEach((x) => { if (x !== k && x.charAt(0) === k.charAt(0) && k !== 'price') open[x] = false })
  open[k] = !open[k]
  if (k === 'price' && !open[k]) { draft.f_pmin = []; draft.f_pmax = [] }
}
function bodyClick(name: string) {
  const def = BODY.filter(x => x[0] === name)[0]!
  if (def[2]) { const k = 'b-' + name; Object.keys(open).forEach((x) => { if (x !== k && x.indexOf('b-') === 0) open[x] = false }); open[k] = !open[k] } else toggle('f_body', name)
}
const bodyOn = (b: string) => D('f_body').some(v => v === b || v.indexOf(b + '-') === 0)
const openB = computed(() => BODY.filter(b => open['b-' + b[0]])[0])
const openF = computed(() => FUEL.filter(f => f[1] && open['f-' + f[0]])[0])
const fuelOn = (f: [string, string[]?]) => D('f_fuel').some(v => v === f[0] || f[1]!.indexOf(v) > -1)
const priceOpen = computed(() => !!(open.price || D('f_pmin').length || D('f_pmax').length))
function numInput(e: Event) { const t = e.target as HTMLInputElement; t.value = t.value.replace(/\D/g, '').slice(0, 6) }
function numChange(k: string, e: Event) { const v = (e.target as HTMLInputElement).value; draft[k] = v ? [v] : [] }
function dateChange(k: string, e: Event) {
  const v = (e.target as HTMLInputElement).value; draft[k] = v ? [v] : []
  if (D('f_from')[0] && D('f_to')[0] && D('f_from')[0]! > D('f_to')[0]!) { const t = draft.f_from; draft.f_from = draft.f_to!; draft.f_to = t! }
}
function sub(k: string, name: string, subs: string[], label: string) { return [{ v: name, label: label + ' 전체' }].concat(subs.map(x => ({ v: k === 'f_body' ? name + '-' + x : x, label: x }))) }

// ── 고르기 화면(제조사 · 모델 · 세부 모델) ──
const picker = ref<{ k: string; title: string; index: string[]; heads: Array<{ h: string; id?: string; rows: Array<{ v: string; n: number; src: string; cls: string; sub: string }> }> } | null>(null)
const pickList = ref<HTMLElement | null>(null)
function opts(k: string) {
  const b = D('f_brand'); const m = D('f_model')
  let src = rows.filter(r => r.kind !== 'business')
  if (k === 'f_model') src = src.filter(r => !b.length || b.indexOf(r.brand) > -1)
  if (k === 'f_trim') src = src.filter(r => (!b.length || b.indexOf(r.brand) > -1) && (!m.length || m.indexOf(r.model) > -1))
  const field = ({ f_brand: 'brand', f_model: 'model', f_trim: 'trim' } as Record<string, string>)[k]!
  const seen: Record<string, { v: string; n: number; r: Row }> = {}; const out: Array<{ v: string; n: number; r: Row }> = []
  src.forEach((r) => { const v = r[field]; if (!v) return; if (!seen[v]) { seen[v] = { v, n: 0, r }; out.push(seen[v]!) } seen[v]!.n++ })
  return out
}
function openPicker(k: string) {
  const title = ({ f_brand: '제조사 선택', f_model: '모델 선택', f_trim: '세부 모델 선택' } as Record<string, string>)[k]!
  const items = opts(k)
  const heads: Array<{ h: string; id?: string; rows: Array<{ v: string; n: number; src: string; cls: string; sub: string }> }> = []
  let index: string[] = []
  const add = (h: string, id: string | undefined, row: { v: string; n: number; src: string; cls: string; sub: string }) => { let g = heads.find(x => x.h === h); if (!g) { g = { h, id, rows: [] }; heads.push(g) } g.rows.push(row) }
  if (k === 'f_brand') {
    items.sort((a, b) => a.v.localeCompare(b.v, 'ko')).forEach((x) => { const h = initial(x.v); add(h, 'czs-ix-' + h, { v: x.v, n: x.n, src: x.r.brandLogo, cls: 'is-logo', sub: x.r.brandOrigin === '국산' ? '국산' : '수입 · ' + x.r.country }) })
    index = heads.map(g => g.h)
  } else if (k === 'f_trim') {
    const yrs: Record<string, typeof items> = {}
    items.forEach((x) => { const y = (String(x.v).match(/^(\d{4})/) || [])[1] || '연식 정보 없음'; (yrs[y] = yrs[y] || []).push(x) })
    Object.keys(yrs).sort().reverse().forEach((y) => { yrs[y]!.forEach(x => add(/^\d{4}$/.test(y) ? y + '년형' : y, undefined, { v: x.v, n: x.n, src: '', cls: '', sub: x.r.brand + ' ' + x.r.model })) })
  } else {
    items.forEach(x => add(x.r.brand, undefined, { v: x.v, n: x.n, src: x.r.thumbnail, cls: 'is-car', sub: (x.r.carClass && x.r.bodyType !== '스포츠카' ? x.r.carClass + ' ' : '') + x.r.bodyType }))
  }
  picker.value = { k, title, index, heads }
}
function jumpIndex(h: string) {
  const l = pickList.value; const t = l?.querySelector('#czs-ix-' + CSS.escape(h)) as HTMLElement | null
  if (t && l) l.scrollTo({ top: t.offsetTop - l.offsetTop })
}
function pickRow(v: string) {
  const k = picker.value!.k
  clearPick(k)
  if (v) {
    draft[k] = [v]
    if (k === 'f_trim' || k === 'f_model') { const r = rows.filter(x => x[k === 'f_trim' ? 'trim' : 'model'] === v)[0]; if (r) { draft.f_brand = [r.brand]; if (k === 'f_trim') draft.f_model = [r.model] } }
  }
  picker.value = null
}
const pickAll = ({ f_brand: '제조사', f_model: '모델', f_trim: '세부 모델' } as Record<string, string>)

// ── 왼쪽 목차 · 스크롤 ──
const body = ref<HTMLElement | null>(null)
const navOn = ref(0)
function jump(i: number) { const t = body.value?.querySelector('#czs-f' + i) as HTMLElement | null; if (t && body.value) body.value.scrollTo({ top: t.offsetTop - body.value.offsetTop, behavior: 'smooth' }) }
function onScroll() {
  const b = body.value; if (!b) return
  let cur = 0
  b.querySelectorAll('section').forEach((sec, i) => { if ((sec as HTMLElement).offsetTop - b.offsetTop - 10 <= b.scrollTop) cur = i })
  if (b.scrollTop + b.clientHeight >= b.scrollHeight - 2) cur = groups.length - 1
  navOn.value = cur
}
function back() {
  if (history.length > 1) history.back()
  else go(czsHref(props.q, Object.assign(current(props.q), forRank ? { czw: 'rank' } : {})))
}
function reset() { KEYS.forEach((k) => { if (k !== 'f_sales') draft[k] = [] }); Object.keys(open).forEach(k => delete open[k]) }
function apply() {
  const p: Record<string, string> = forRank ? { czw: 'rank', rank: rankTab } : {}
  KEYS.forEach((k) => { if (D(k).length) p[k] = D(k).join(',') })
  go(czsHref(props.q, p))
}
const pickPh = ({ f_brand: '제조사 선택', f_model: '모델 선택', f_trim: '세부 모델 선택' } as Record<string, string>)
</script>

<template>
  <section :class="'czs-filter' + (forRank ? ' is-rank' : '')">
    <header class="czs-bar"><button type="button" data-back aria-label="뒤로" @click="back"><img :src="si('back')" alt="" loading="lazy"></button><strong>필터</strong><span /></header>
    <div class="czs-fsummary" :hidden="!forRank && !sel.length"><span class="czs-period" data-summary :hidden="!forRank">{{ period }}</span><span class="czs-fsel" data-sel><button v-for="x in sel" :key="x[0] + x[1]" type="button" class="czs-chip" :data-unsel="x[0]" :data-value="x[1]" @click="unsel(x[0], x[1])">{{ String(x[1]).replace('-', ' ') }}<span>×</span></button></span></div>
    <div class="czs-fwrap">
      <nav class="czs-fnav"><button v-for="(g, i) in groups" :key="i" type="button" :data-jump="i" :class="{ on: navOn === i }" @click="jump(i)">{{ g[0] }}</button></nav>
      <div ref="body" class="czs-fbody" @scroll="onScroll">
        <section v-for="(g, i) in groups" :id="'czs-f' + i" :key="i"><h3>{{ g[0] }}</h3>
          <template v-if="g[1].indexOf('pick:') === 0"><button type="button" :class="'czs-pickbtn' + (D(g[1].slice(5))[0] ? ' on' : '')" :data-pick="g[1].slice(5)" @click="openPicker(g[1].slice(5))">{{ D(g[1].slice(5))[0] || pickPh[g[1].slice(5)] }}<span v-if="D(g[1].slice(5))[0]" :data-unpick="g[1].slice(5)" aria-label="선택 해제" @click.stop="clearPick(g[1].slice(5))">×</span></button></template>
          <div v-else-if="g[1] === 'date'" class="czs-dates"><template v-for="(k, j) in ['f_from', 'f_to']" :key="k"><span v-if="j">~</span><label :class="'czs-date' + (D(k)[0] ? ' on' : '')"><span>{{ D(k)[0] ? fmtDate(D(k)[0]!) : (j ? '종료일' : '시작일') }}</span><input type="date" :data-date="k" :value="D(k)[0] || ''" min="2020-01-01" max="2026-10-17" :aria-label="j ? '종료일' : '시작일'" @change="dateChange(k, $event)"></label></template></div>
          <template v-else-if="g[1] === 'price'"><div class="czs-fchips"><button v-for="p in PRICE" :key="p[0]" type="button" :class="'czs-fchip' + (isOn('f_price', p[0]) ? ' on' : '')" data-key="f_price" :data-value="p[0]" @click="toggle('f_price', p[0])">{{ p[0] }}</button><button type="button" :class="'czs-fchip' + (priceOpen ? ' on' : '')" data-open="price" @click="openToggle('price')">직접 입력</button></div><div v-if="priceOpen" class="czs-prange"><label><input inputmode="numeric" data-num="f_pmin" :value="D('f_pmin')[0] || ''" placeholder="최저" @input="numInput" @change="numChange('f_pmin', $event)"><i>만원</i></label><span>~</span><label><input inputmode="numeric" data-num="f_pmax" :value="D('f_pmax')[0] || ''" placeholder="최고" @input="numInput" @change="numChange('f_pmax', $event)"><i>만원</i></label></div></template>
          <template v-else-if="g[1] === 'body'"><div class="czs-bodys"><button v-for="b in BODY" :key="b[0]" type="button" :class="'czs-bodytile' + (bodyOn(b[0]) ? ' on' : '') + (open['b-' + b[0]] ? ' is-open' : '')" :data-body="b[0]" :aria-expanded="b[2] ? !!open['b-' + b[0]] : undefined" @click="bodyClick(b[0])"><img :src="boardSrc(BICON + b[1] + '.svg')" alt=""><span>{{ b[0] }}<i v-if="b[2]" class="czs-caret" /></span></button></div><div v-if="openB" class="czs-fsub"><div class="czs-fchips"><button v-for="x in sub('f_body', openB[0], openB[2]!, openB[0])" :key="x.v" type="button" :class="'czs-fchip' + (isOn('f_body', x.v) ? ' on' : '')" data-key="f_body" :data-value="x.v" @click="toggle('f_body', x.v)">{{ x.label }}</button></div></div></template>
          <template v-else-if="g[1] === 'fuel'"><div class="czs-fchips"><template v-for="fl in FUEL" :key="fl[0]"><button v-if="!fl[1]" type="button" :class="'czs-fchip' + (isOn('f_fuel', fl[0]) ? ' on' : '')" data-key="f_fuel" :data-value="fl[0]" @click="toggle('f_fuel', fl[0])">{{ fl[0] }}</button><button v-else type="button" :class="'czs-fchip' + (fuelOn(fl) ? ' on' : '')" :data-open="'f-' + fl[0]" :aria-expanded="!!open['f-' + fl[0]]" @click="openToggle('f-' + fl[0])">{{ fl[0] }}<i class="czs-caret" /></button></template></div><div v-if="openF" class="czs-fsub"><div class="czs-fchips"><button v-for="x in sub('f_fuel', openF[0], openF[1]!, openF[0])" :key="x.v" type="button" :class="'czs-fchip' + (isOn('f_fuel', x.v) ? ' on' : '')" data-key="f_fuel" :data-value="x.v" @click="toggle('f_fuel', x.v)">{{ x.label }}</button></div></div></template>
          <template v-else-if="g[1] === 'sales'"><div class="czs-fchips"><button v-for="x in SALES" :key="x[0]" type="button" :class="'czs-fchip' + (D('f_sales')[0] === x[0] ? ' on' : '')" :data-sales="x[0]" @click="draft.f_sales = [x[0]]">{{ x[1] }}</button></div><p class="czs-note">월 판매량이 적은 차는 비율이 크게 흔들려 기준 이상만 순위에 넣습니다.</p></template>
          <div v-else class="czs-fchips"><button v-for="v in (g[2] || [])" :key="v" type="button" :class="'czs-fchip' + (isOn(g[1], v) ? ' on' : '')" :data-key="g[1]" :data-value="v" @click="toggle(g[1], v)">{{ v }}</button></div>
        </section>
      </div>
    </div>
    <footer class="czs-factions"><button type="button" data-reset :disabled="resetDisabled" @click="reset">초기화</button><button type="button" data-apply @click="apply">{{ forRank ? '확인' : count + '건 보기' }}</button></footer>
    <div class="czs-picker" :hidden="!picker">
      <template v-if="picker">
        <header class="czs-bar"><button type="button" data-close aria-label="닫기" @click="picker = null"><img :src="si('back')" alt="" loading="lazy"></button><strong>{{ picker.title }}</strong><span /></header>
        <nav v-if="picker.k === 'f_brand'" class="czs-index"><button v-for="h in picker.index" :key="h" type="button" :data-ix="h" @click="jumpIndex(h)">{{ h }}</button></nav>
        <div ref="pickList" class="czs-picklist"><button v-if="D(picker.k)[0]" type="button" class="czs-pickrow is-all" data-v="" @click="pickRow('')">{{ pickAll[picker.k] }} 전체</button><template v-if="picker.heads.length"><template v-for="g in picker.heads" :key="g.h"><h4 :id="g.id">{{ g.h }}</h4><button v-for="x in g.rows" :key="x.v" type="button" :class="'czs-pickrow' + (D(picker.k)[0] === x.v ? ' on' : '')" :data-v="x.v" @click="pickRow(x.v)"><span v-if="x.src" :class="'czs-pickimg ' + x.cls"><img :src="boardSrc(x.src)" alt="" loading="lazy"></span><span class="czs-picktxt"><b>{{ x.v }}</b><small v-if="x.sub">{{ x.sub }}</small></span><em>{{ x.n }}</em></button></template></template><p v-else class="czs-empty">선택할 항목이 없습니다</p></div>
      </template>
    </div>
  </section>
</template>
