<script setup lang="ts">
// 처즈왕 결함·불만 게시판(board=chezhiwang-complaint). 정본: chezhiwang-complaint-board.js · -enhancements.js · -stats.js
// czw 값으로 화면을 고른다(정적 판 stats.js render 와 같은 순서):
//   rank · filter · search · news · news-N · official · legal · czw-b…(업체 불만) · write · <글 id> · ''(목록)
import type { Ref } from 'vue'
import { setPhoneClass, useBoardQuery } from '~/composables/boards/boardUtil'
import { T } from '~/composables/boards/chezhiwang'
import { useListPageCtx } from '~/composables/list/useListPage'
import CzwList from './CzwList.vue'
import CzwDetail from './CzwDetail.vue'
import CzwWriter from './CzwWriter.vue'
import CzsFilter from './CzsFilter.vue'
import CzsRank from './CzsRank.vue'
import CzsPages from './CzsPages.vue'

const props = defineProps<{ phoneClasses: Set<string>; listClass: Ref<string> }>()
const page = useListPageCtx()
const { q, go } = useBoardQuery()
const id = computed(() => q.value.czw || '')
type View = 'rank' | 'filter' | 'search' | 'news' | 'newsDetail' | 'official' | 'legal' | 'biz' | 'write' | 'detail' | 'list'
const view = computed<View>(() => {
  const v = id.value
  if (v === 'rank') return 'rank'
  if (v === 'filter') return 'filter'
  if (v === 'search') return 'search'
  if (v === 'news') return 'news'
  if (/^news-\d+$/.test(v)) return 'newsDetail'
  if (v === 'official') return 'official'
  if (v === 'legal') return 'legal'
  if (/^czw-b/.test(v) && (T().businesses || []).some((x: { complaintId: string }) => x.complaintId === v)) return 'biz'
  if (v === 'write') return 'write'
  if (v) return 'detail'
  return 'list'
})
const statsState: Partial<Record<View, string>> = { rank: 'chezhiwangComplaintRank', filter: 'chezhiwangComplaintFilter', search: 'chezhiwangComplaintSearch', news: 'chezhiwangComplaintNews', newsDetail: 'chezhiwangComplaintNews', official: 'chezhiwangComplaintNews', legal: 'chezhiwangComplaintNews', biz: 'chezhiwangComplaintDetail' }
function applyMode(load = false) {
  const v = view.value
  const s = statsState[v]
  if (s) {
    setPhoneClass(props.phoneClasses, 'phone chezhiwangComplaintMode czsMode ' + s, load)
    props.listClass.value = 'list czw czs'
  } else {
    const communityHeader = q.value.header === 'community' ? ' communityTitleHeader' : ''
    setPhoneClass(props.phoneClasses, 'phone chezhiwangComplaintMode' + communityHeader + ' ' + (v === 'detail' ? 'chezhiwangComplaintDetail' : v === 'write' ? 'chezhiwangComplaintWriter' : ''), load)
    props.listClass.value = 'list czw'
  }
}
// 정적 판 처즈왕은 첫 화면에서도 headerYouTube 가 다시 붙지 않는다(board-header-variants.js 초기화가 붙이지 않음, 실측) → load=false
watch(() => JSON.stringify(q.value), () => applyMode(false), { immediate: true })
watch(() => page.renderSeq.value, () => applyMode(false))
watch(() => q.value, () => window.scrollTo(0, 0), { immediate: true })

// stats.js toast: body 끝에 잠깐 붙는 알림
const toasts = ref<Array<{ id: number; text: string }>>([])
let seq = 0
function toast(text: string) { const t = { id: ++seq, text }; toasts.value.push(t); setTimeout(() => { toasts.value = toasts.value.filter(x => x !== t) }, 1800) }
// 화면이 바뀔 때 하위 화면을 새로 만든다(정적 판은 주소마다 새로 그렸다)
const viewKey = computed(() => JSON.stringify(q.value))
</script>

<template>
  <CzsRank v-if="view === 'rank'" :key="viewKey" :q="q" @go="go" @toast="toast" />
  <CzsFilter v-else-if="view === 'filter'" :key="viewKey" :q="q" @go="go" />
  <CzsPages v-else-if="['search', 'news', 'newsDetail', 'official', 'legal', 'biz'].includes(view)" :key="viewKey" :q="q" :kind="view as 'search'" @go="go" @toast="toast" />
  <CzwWriter v-else-if="view === 'write'" :key="viewKey" :q="q" @go="go" />
  <CzwDetail v-else-if="view === 'detail'" :key="viewKey" :q="q" :id="id" @go="go" />
  <CzwList v-else :key="viewKey" :q="q" @go="go" />
  <Teleport to="body"><div v-for="t in toasts" :key="t.id" class="czs-toast">{{ t.text }}</div></Teleport>
</template>
