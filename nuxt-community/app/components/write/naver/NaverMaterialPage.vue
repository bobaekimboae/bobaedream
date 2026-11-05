<!-- 글감(네이버 카페 앱 2026-11-06 폰 확인): 취소 · 가운데 「글감」, 회색 알약 검색칸 「글감을 검색해 보세요.」,
     분류 알약(전체 글감 · 책 · 음악 · 스포츠 · 공연·전시 …), 최근 검색어(자동저장 끄기 | 전체삭제 · 「검색내역이 없습니다.」), 추천 글감 목록.
     보배드림: 책 · 음악 대신 차량을 글감으로 쓴다. 차량 기준표(public/data/vehicle-catalog/cars-index-v1.json)의 세대에서 찾고,
     고르면 본문에 차량 카드(제조사 로고 · 세대 이름 · 판매 기간)가 들어간다 -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

interface Make { id: string, kind: string, name: string, popular?: boolean, logoPath?: string | null }
interface Generation { id: string, makeId: string, makeName: string, groupName: string, name: string, generationCode: string | null, releaseYm: string | null, endYm: string | null, saleStatus: string | null, sortOrder: number }
export interface MaterialCard { title: string, sub: string, meta: string, image: string }
const emit = defineEmits<{ attach: [card: MaterialCard], close: [] }>()

const RECENT_KEY = 'bbm.community.write.materialRecent.v1'
const AUTO_KEY = 'bbm.community.write.materialAuto.v1'
const tabs = [['all', '전체 글감'], ['국산', '국산차'], ['수입', '수입차'], ['sale', '판매 중'], ['ended', '단종']] as const
type Tab = typeof tabs[number][0]
const tab = ref<Tab>('all')
const query = ref('')
const makes = ref<Make[]>([])
const gens = ref<Generation[]>([])
const failed = ref(false)
const input = ref<HTMLInputElement | null>(null)
const read = (key: string) => { try { return localStorage.getItem(key) } catch { return null } }
const recent = ref<string[]>((() => { try { return JSON.parse(read(RECENT_KEY) || '[]') as string[] } catch { return [] } })())
const autoSave = ref(read(AUTO_KEY) !== 'off')

fetch(siteAsset('data/vehicle-catalog/cars-index-v1.json'))
  .then(response => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
  .then((data: { manufacturers?: Make[], generations?: Generation[] }) => { makes.value = data.manufacturers || []; gens.value = data.generations || [] })
  .catch(() => { failed.value = true })

const makeById = computed(() => new Map(makes.value.map(make => [make.id, make])))
const squash = (text: string) => text.replace(/[\s\-·]+/g, '').toLowerCase()
function inTab(item: Generation) {
  const make = makeById.value.get(item.makeId)
  if (tab.value === '국산' || tab.value === '수입') return make?.kind === tab.value
  if (tab.value === 'sale') return item.saleStatus === '판매중'
  if (tab.value === 'ended') return item.saleStatus === '단종'
  return true
}
const results = computed(() => {
  const q = squash(query.value)
  if (!q) return []
  return gens.value.filter(item => inTab(item) && squash(`${item.makeName}${item.groupName}${item.name}${item.generationCode || ''}`).includes(q)).slice(0, 40)
})
/** 추천 글감: 인기 제조사의 판매 중인 최신 세대 */
const suggested = computed(() => {
  const popular = new Set(makes.value.filter(make => make.popular && make.name !== '기타 제조사').map(make => make.id))
  const seen = new Set<string>()
  return gens.value
    .filter(item => popular.has(item.makeId) && item.saleStatus === '판매중' && inTab(item))
    .sort((a, b) => String(b.releaseYm || '').localeCompare(String(a.releaseYm || '')))
    .filter((item) => { if (seen.has(item.makeId)) return false; seen.add(item.makeId); return true })
    .slice(0, 8)
})
const period = (item: Generation) => `${item.releaseYm || '?'} ~ ${item.saleStatus === '판매중' ? '현재' : item.endYm || '?'}`
const logo = (item: Generation) => { const path = makeById.value.get(item.makeId)?.logoPath; return path ? siteAsset(path) : '' }

function remember(word: string) {
  if (!autoSave.value || !word.trim()) return
  recent.value = [word.trim(), ...recent.value.filter(item => item !== word.trim())].slice(0, 10)
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent.value)) } catch { /* 저장 못 하면 넘어간다 */ }
}
function toggleAuto() {
  autoSave.value = !autoSave.value
  try { localStorage.setItem(AUTO_KEY, autoSave.value ? 'on' : 'off') } catch { /* 넘어간다 */ }
}
function clearRecent() {
  recent.value = []
  try { localStorage.removeItem(RECENT_KEY) } catch { /* 넘어간다 */ }
}
function pick(item: Generation) {
  remember(query.value)
  emit('attach', { title: `${item.makeName} ${item.name}`, sub: [item.generationCode, period(item)].filter(Boolean).join(' · '), meta: item.saleStatus || '', image: logo(item) })
}
function onKey(event: KeyboardEvent) { if (event.key === 'Escape') emit('close') }
onMounted(() => { document.addEventListener('keydown', onKey); nextTick(() => input.value?.focus()) })
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <section class="nwx" role="dialog" aria-modal="true" aria-labelledby="nwmTitle">
    <header class="nwx-head">
      <button type="button" @click="emit('close')">취소</button>
      <h2 id="nwmTitle">글감</h2>
      <span aria-hidden="true" />
    </header>
    <label class="nwm-search">
      <img :src="communityAsset('assets/reddit-write/icon-search-outline.svg')" alt="">
      <span class="sr-only">글감 검색</span>
      <input ref="input" v-model="query" type="search" placeholder="글감을 검색해 보세요." autocomplete="off" enterkeyhint="search" @keydown.enter="remember(query)">
    </label>
    <nav class="nwm-tabs" aria-label="글감 분류">
      <button v-for="[key, name] in tabs" :key="key" type="button" :class="{ 'is-on': tab === key }" :aria-pressed="tab === key" @click="tab = key">
        <img v-if="key === 'all'" :src="communityAsset('assets/reddit-write/icon-topic-cars-outline.svg')" alt="">{{ name }}
      </button>
    </nav>
    <div class="nwx-body">
      <template v-if="query.trim()">
        <ul v-if="results.length" class="nwm-list" aria-label="찾은 글감">
          <li v-for="item in results" :key="item.id"><button type="button" @click="pick(item)">
            <span class="nwm-art"><img v-if="logo(item)" :src="logo(item)" alt=""></span>
            <span class="nwm-text"><strong>{{ item.makeName }} {{ item.name }}</strong><small>{{ [item.generationCode, period(item)].filter(Boolean).join(' · ') }}</small><em>{{ item.saleStatus || '차량' }}</em></span>
          </button></li>
        </ul>
        <p v-else class="nwm-none">{{ failed ? '차량 기준표를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.' : `‘${query.trim()}’ 글감이 없어요.` }}</p>
      </template>
      <template v-else>
        <div class="nwm-section-head"><h3>최근 검색어</h3><div><button type="button" @click="toggleAuto">{{ autoSave ? '자동저장 끄기' : '자동저장 켜기' }}</button><i aria-hidden="true" /><button type="button" @click="clearRecent">전체삭제</button></div></div>
        <ul v-if="recent.length" class="nwm-recent"><li v-for="word in recent" :key="word"><button type="button" @click="query = word">{{ word }}</button></li></ul>
        <p v-else class="nwm-empty">{{ autoSave ? '검색내역이 없습니다.' : '검색어 저장 기능이 꺼져 있습니다.' }}</p>
        <h3 class="nwm-title">추천 글감</h3>
        <ul class="nwm-list" aria-label="추천 글감">
          <li v-for="item in suggested" :key="item.id"><button type="button" @click="pick(item)">
            <span class="nwm-art"><img v-if="logo(item)" :src="logo(item)" alt=""></span>
            <span class="nwm-text"><strong>{{ item.name }}</strong><small>{{ item.makeName }} · {{ period(item) }}</small><em>{{ makeById.get(item.makeId)?.kind === '수입' ? '수입차' : '국산차' }}</em></span>
          </button></li>
        </ul>
        <p v-if="failed" class="nwm-none">차량 기준표를 불러오지 못했어요.</p>
      </template>
    </div>
  </section>
</template>
