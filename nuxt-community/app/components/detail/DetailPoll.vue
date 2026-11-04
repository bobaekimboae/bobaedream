<script setup lang="ts">
// 치지직 투표 카드 (정적 community-poll.js 의 html() · 클릭 처리를 Vue 로 옮긴 것, 상세 화면 interactive 모드)
// 투표 결과는 정적 판과 같은 localStorage 키(bbm-community-poll-v1)에 저장한다.
import type { PollData } from '~/composables/detail/types'
import { communityUrl } from '~/composables/detail/legacyAssets'

const props = defineProps<{ poll: PollData; pollId: string }>()
const KEY = 'bbm-community-poll-v1'

type PollState = { counts?: number[]; voters?: number; mine?: number[]; voted?: boolean; ended?: boolean }

function load(): Record<string, PollState> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {} }
  catch { return {} }
}
function save(all: Record<string, PollState>) {
  try { localStorage.setItem(KEY, JSON.stringify(all)) }
  catch { /* 저장 공간이 없으면 화면만 바꾼다 */ }
}

const p = computed(() => {
  const poll = props.poll || {}
  const note = String(poll.note || '')
  return {
    title: String(poll.title || '투표').replace(/^📊\s*/, ''),
    options: (poll.options || []).map(o => String(o).replace(/^○\s*/, '')).filter(Boolean),
    images: (poll.images || []).map(value => String(value || '')),
    multiple: poll.multiple != null ? !!poll.multiple : /복수/.test(note),
    anonymous: poll.anonymous != null ? !!poll.anonymous : !/기명 투표/.test(note.replace(/무기명/g, '')),
    visibility: ['after_vote', 'after_close', 'hidden', 'always'].includes(String(poll.visibility)) ? String(poll.visibility) : 'after_vote',
    endsAt: poll.endsAt || '',
  }
})

function remain(endsAt: string): string {
  const end = Date.parse(endsAt || '')
  if (!end) return ''
  const ms = end - Date.now()
  if (ms <= 0) return '투표기간 종료'
  const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4)
  return `투표기간 ${d ? `${d}일 ` : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} 남음`
}

const st = ref<PollState>({})
const picked = ref<number[]>([])
function refresh() {
  st.value = (props.pollId && load()[props.pollId]) || {}
  picked.value = []
}
onMounted(refresh)
watch(() => props.pollId, refresh)

const counts = computed(() => p.value.options.map((_, i) => Number((st.value.counts || [])[i] || 0)))
const voters = computed(() => Number(st.value.voters || 0))
const time = computed(() => remain(p.value.endsAt))
const ended = computed(() => !!st.value.ended || time.value === '투표기간 종료')
const mine = computed(() => st.value.mine || [])
const showResults = computed(() => p.value.visibility === 'always' || (p.value.visibility === 'after_vote' && !!st.value.voted) || (p.value.visibility === 'after_close' && ended.value))
const resultNote = computed(() => p.value.visibility === 'after_vote' ? '참여 후 결과 공개' : p.value.visibility === 'after_close' ? '종료 후 결과 공개' : p.value.visibility === 'hidden' ? '결과 비공개' : '')
const metaItems = computed(() => [
  time.value ? { icon: 'clock', text: time.value } : null,
  p.value.multiple ? { icon: 'check', text: '복수 선택 가능' } : null,
  resultNote.value ? { icon: 'info', text: resultNote.value } : null,
].filter(Boolean) as Array<{ icon: string; text: string }>)
const selectable = computed(() => !ended.value && !st.value.voted)
const pct = (i: number) => (voters.value ? Math.round((counts.value[i] || 0) / voters.value * 100) : 0)

function pick(i: number) {
  const on = !picked.value.includes(i)
  if (!p.value.multiple) picked.value = picked.value.filter(value => value === i)
  picked.value = on ? [...picked.value.filter(value => value !== i), i] : picked.value.filter(value => value !== i)
}

function commit(next: PollState) {
  const all = load()
  all[props.pollId] = next
  save(all)
  refresh()
}
function vote() {
  const picks = p.value.options.map((_, i) => i).filter(i => picked.value.includes(i))
  if (!picks.length) return
  const cur = { ...st.value }
  cur.counts = p.value.options.map((_, i) => Number((cur.counts || [])[i] || 0) + (picks.includes(i) ? 1 : 0))
  cur.voters = Number(cur.voters || 0) + 1
  cur.mine = picks
  cur.voted = true
  commit(cur)
}
function revote() {
  const cur = { ...st.value }
  cur.counts = (cur.counts || []).map((c, i) => Math.max(0, c - ((cur.mine || []).includes(i) ? 1 : 0)))
  cur.voters = Math.max(0, Number(cur.voters || 0) - 1)
  cur.mine = []
  cur.voted = false
  commit(cur)
}
function end() {
  commit({ ...st.value, ended: true })
}
</script>

<template>
  <section v-if="p.options.length >= 2" class="bbmPoll" :class="{ 'is-ended': ended }" aria-label="투표">
    <header class="bbmPollHead"><span class="bbmPollIcon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 6h7.5a4.5 4.5 0 0 1 0 9H7zM7 15v3M7 10.5h9M7 6v12" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg></span><strong>{{ p.anonymous ? '무기명 ' : '' }}{{ ended ? '투표 종료' : '투표 중' }}</strong><span class="bbmPollInfo" :title="p.anonymous ? '누가 투표했는지 공개되지 않습니다' : '투표한 사람이 공개됩니다'"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.4" /><path d="M8 7.2v4M8 4.9v.1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg></span><em>{{ voters }}명 참여</em></header>
    <h4 class="bbmPollTitle">{{ p.title }}</h4>
    <p v-if="metaItems.length" class="bbmPollMeta"><template v-for="(meta, index) in metaItems" :key="meta.icon"><i v-if="index" aria-hidden="true">·</i><span><svg v-if="meta.icon === 'clock'" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" stroke-width="1.4" /><path d="M8 4.6V8l2.3 1.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" /></svg><svg v-else-if="meta.icon === 'check'" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" stroke-width="1.4" /><path d="m5.3 8.1 1.8 1.8 3.6-3.7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg><svg v-else viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.4" /><path d="M8 7.2v4M8 4.9v.1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>{{ meta.text }}</span></template></p>
    <div class="bbmPollOptions" role="group" :aria-label="`${p.title} 선택지`"><template v-for="(option, i) in p.options" :key="i"><button v-if="selectable" type="button" class="bbmPollOption" :class="{ 'is-mine': mine.includes(i), 'has-result': showResults, 'is-picked': picked.includes(i) }" :data-poll-option="i" :aria-pressed="picked.includes(i)" :style="`--pct:${showResults ? pct(i) : 0}%`" @click="pick(i)"><img v-if="p.images[i]" class="bbmPollOptionImage" :src="communityUrl(p.images[i])" alt=""><span class="bbmPollLabel">{{ option }}</span><span v-if="showResults" class="bbmPollCount">{{ counts[i] }}명 {{ pct(i) }}%</span></button><div v-else class="bbmPollOption" :class="{ 'is-mine': mine.includes(i), 'has-result': showResults }" :style="`--pct:${showResults ? pct(i) : 0}%`"><img v-if="p.images[i]" class="bbmPollOptionImage" :src="communityUrl(p.images[i])" alt=""><span class="bbmPollLabel">{{ option }}</span><span v-if="showResults" class="bbmPollCount">{{ counts[i] }}명 {{ pct(i) }}%</span></div></template></div>
    <div class="bbmPollActions"><button v-if="ended" type="button" disabled>투표 종료</button><template v-else-if="st.voted"><button type="button" data-poll-revote @click="revote">다시 투표하기</button><button type="button" data-poll-end @click="end">종료하기</button></template><template v-else><button type="button" data-poll-vote :disabled="!picked.length" @click="vote">투표하기</button><button type="button" data-poll-end @click="end">종료하기</button></template></div>
  </section>
</template>
