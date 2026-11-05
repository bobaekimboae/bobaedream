<!-- 장소 첨부(네이버 카페 앱 2026-11-06 폰 확인): 취소 · 가운데 「장소 첨부」 · 완료, 「국내 ▾ | 장소명을 입력하세요. 🔍」 검색칸,
     회색 바탕에 「첨부하려는 장소를 검색해보세요.」. 보배드림: 네이버 지도 대신 전국 매매단지(KB차차차 지역별 매매단지 마스터 343곳)에서 찾고,
     목록에 없으면 적은 이름을 그대로 넣는다. 카드를 누르면 네이버 지도 검색으로 연다 -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

interface Complex { sido: string, gugun: string, name: string, listings: number }
export interface PlaceCard { title: string, sub: string, meta: string, link: string }
const emit = defineEmits<{ attach: [card: PlaceCard], close: [] }>()
const scope = ref<'complex' | 'free'>('complex')
const query = ref('')
const picked = ref<Complex | null>(null)
const all = ref<Complex[]>([])
const input = ref<HTMLInputElement | null>(null)
import('../../../../../src/prototype/data/kb-danji-master-20260826.json').then((mod) => {
  const data = (mod.default || mod) as { complexes?: Complex[] }
  all.value = data.complexes || []
}).catch(() => { all.value = [] })

const squash = (text: string) => text.replace(/\s+/g, '').toLowerCase()
const results = computed(() => {
  const q = squash(query.value)
  if (!q || scope.value === 'free') return []
  return all.value
    .filter(item => squash(`${item.name}${item.sido}${item.gugun}`).includes(q))
    .sort((a, b) => b.listings - a.listings)
    .slice(0, 40)
})
const canDone = computed(() => Boolean(picked.value) || (scope.value === 'free' && Boolean(query.value.trim())))
const mapLink = (name: string) => `https://map.naver.com/p/search/${encodeURIComponent(name)}`

function done() {
  if (picked.value) {
    const item = picked.value
    emit('attach', { title: item.name, sub: `${item.sido} ${item.gugun}`, meta: `중고차 매매단지 · 매물 ${item.listings.toLocaleString('ko-KR')}대`, link: mapLink(`${item.sido} ${item.gugun} ${item.name}`) })
    return
  }
  const name = query.value.trim()
  if (name) emit('attach', { title: name, sub: '직접 입력한 장소', meta: '', link: mapLink(name) })
}
function onKey(event: KeyboardEvent) { if (event.key === 'Escape') emit('close') }
onMounted(() => { document.addEventListener('keydown', onKey); nextTick(() => input.value?.focus()) })
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <section class="nwx" role="dialog" aria-modal="true" aria-labelledby="nwpTitle">
    <header class="nwx-head">
      <button type="button" @click="emit('close')">취소</button>
      <h2 id="nwpTitle">장소 첨부</h2>
      <button type="button" class="is-done" :disabled="!canDone" @click="done">완료</button>
    </header>
    <div class="nwx-search">
      <label class="nwx-scope"><span class="sr-only">찾는 범위</span>
        <select v-model="scope" @change="picked = null"><option value="complex">매매단지</option><option value="free">직접 입력</option></select>
      </label>
      <label class="nwx-input"><span class="sr-only">장소명</span><input ref="input" v-model="query" type="search" :placeholder="scope === 'free' ? '장소 이름을 입력하세요.' : '장소명을 입력하세요.'" autocomplete="off" enterkeyhint="search" @input="picked = null"></label>
      <img :src="communityAsset('assets/reddit-write/icon-search-outline.svg')" alt="">
    </div>
    <div class="nwx-body is-gray">
      <ul v-if="results.length" class="nwx-results" role="radiogroup" aria-label="찾은 장소">
        <li v-for="item in results" :key="`${item.sido}-${item.gugun}-${item.name}`">
          <button type="button" role="radio" :aria-checked="picked === item" @click="picked = item">
            <span class="nwx-pin" aria-hidden="true"><img :src="communityAsset('assets/reddit-write/icon-location-outline.svg')" alt=""></span>
            <span class="nwx-text"><strong>{{ item.name }}</strong><small>{{ item.sido }} {{ item.gugun }} · 매물 {{ item.listings.toLocaleString('ko-KR') }}대</small></span>
            <i :class="{ 'is-on': picked === item }" aria-hidden="true" />
          </button>
        </li>
      </ul>
      <div v-else class="nwx-empty">
        <strong>{{ scope === 'free' ? (query.trim() ? `‘${query.trim()}’을 장소로 넣을까요?` : '넣을 장소 이름을 적어 주세요.') : query.trim() ? '찾는 매매단지가 없어요.' : '첨부하려는 장소를 검색해보세요.' }}</strong>
        <span>{{ scope === 'free' ? '완료를 누르면 본문에 장소 카드가 들어가요.' : query.trim() ? '‘직접 입력’으로 바꾸면 적은 이름을 그대로 넣을 수 있어요.' : '전국 중고차 매매단지 343곳에서 찾아요.' }}</span>
      </div>
    </div>
  </section>
</template>
