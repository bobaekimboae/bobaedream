<script setup lang="ts">
// 목록 카드의 투표 미리보기(community-poll.js html(poll, { compact: true }) 이식). 목록에서는 투표하지 않고 결과만 보여 준다.
import type { ListPoll } from '~/composables/list/listData'

const props = defineProps<{ poll: ListPoll; id: string }>()
const KEY = 'bbm-community-poll-v1'
function load(): Record<string, { counts?: number[]; voters?: number; ended?: boolean; mine?: number[]; voted?: boolean }> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {} } catch { return {} }
}
function normalize(poll: ListPoll) {
  const note = String(poll.note || '')
  const vis = String((poll as Record<string, unknown>).visibility || '')
  return {
    title: String(poll.title || '투표').replace(/^📊\s*/, ''),
    options: (poll.options || []).map(o => String(o).replace(/^○\s*/, '')).filter(Boolean),
    images: (((poll as Record<string, unknown>).images as unknown[]) || []).map(v => String(v || '')),
    multiple: (poll as Record<string, unknown>).multiple != null ? !!(poll as Record<string, unknown>).multiple : /복수/.test(note),
    anonymous: (poll as Record<string, unknown>).anonymous != null ? !!(poll as Record<string, unknown>).anonymous : !/기명 투표/.test(note.replace(/무기명/g, '')),
    visibility: ['after_vote', 'after_close', 'hidden', 'always'].includes(vis) ? vis : 'after_vote',
    endsAt: String((poll as Record<string, unknown>).endsAt || ''),
  }
}
function remain(endsAt: string) {
  const end = Date.parse(endsAt || '')
  if (!end) return ''
  const ms = end - Date.now()
  if (ms <= 0) return '투표기간 종료'
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4)
  return '투표기간 ' + (d ? d + '일 ' : '') + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ' 남음'
}
const view = computed(() => {
  const p = normalize(props.poll)
  if (p.options.length < 2) return null
  const st = load()[props.id] || {}
  const counts = p.options.map((_, i) => Number((st.counts || [])[i] || 0))
  const voters = Number(st.voters || 0)
  const time = remain(p.endsAt)
  const ended = !!st.ended || time === '투표기간 종료'
  const mine = st.mine || []
  const showResults = p.visibility === 'always' || (p.visibility === 'after_vote' && !!st.voted) || (p.visibility === 'after_close' && ended)
  const resultNote = p.visibility === 'after_vote' ? '참여 후 결과 공개' : p.visibility === 'after_close' ? '종료 후 결과 공개' : p.visibility === 'hidden' ? '결과 비공개' : ''
  const meta = [time ? { k: 'clock', t: time } : null, p.multiple ? { k: 'check', t: '복수 선택 가능' } : null, resultNote ? { k: 'info', t: resultNote } : null].filter(Boolean) as Array<{ k: string; t: string }>
  const rows = p.options.slice(0, 4).map((o, i) => {
    const pct = voters ? Math.round((counts[i]! / voters) * 100) : 0
    return { o, i, pct, on: mine.includes(i), image: p.images[i] || '', count: counts[i] }
  })
  return { p, voters, ended, showResults, meta, rows, more: p.options.length > 4 ? p.options.length - 4 : 0, json: JSON.stringify(p) }
})
</script>

<template>
  <section v-if="view" :class="['bbmPoll', 'is-compact', { 'is-ended': view.ended }]" aria-label="투표" :data-poll-id="id" :data-poll-json="view.json">
    <header class="bbmPollHead">
      <span class="bbmPollIcon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 6h7.5a4.5 4.5 0 0 1 0 9H7zM7 15v3M7 10.5h9M7 6v12" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
      <strong>{{ (view.p.anonymous ? '무기명 ' : '') + (view.ended ? '투표 종료' : '투표 중') }}</strong>
      <span class="bbmPollInfo" :title="view.p.anonymous ? '누가 투표했는지 공개되지 않습니다' : '투표한 사람이 공개됩니다'"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.4" /><path d="M8 7.2v4M8 4.9v.1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg></span>
      <em>{{ view.voters }}명 참여</em>
    </header>
    <h4 class="bbmPollTitle">{{ view.p.title }}</h4>
    <p v-if="view.meta.length" class="bbmPollMeta"><template v-for="(m, i) in view.meta" :key="m.k"><i v-if="i" aria-hidden="true">·</i><span><svg v-if="m.k === 'clock'" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" stroke-width="1.4" /><path d="M8 4.6V8l2.3 1.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" /></svg><svg v-else-if="m.k === 'check'" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" stroke-width="1.4" /><path d="m5.3 8.1 1.8 1.8 3.6-3.7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg><svg v-else viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.4" /><path d="M8 7.2v4M8 4.9v.1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>{{ m.t }}</span></template></p>
    <div class="bbmPollOptions" role="group" :aria-label="view.p.title + ' 선택지'">
      <div v-for="row in view.rows" :key="row.i" :class="['bbmPollOption', { 'is-mine': row.on, 'has-result': view.showResults }]" :style="{ '--pct': (view.showResults ? row.pct : 0) + '%' }"><img v-if="row.image" class="bbmPollOptionImage" :src="row.image" alt=""><span class="bbmPollLabel">{{ row.o }}</span><span v-if="view.showResults" class="bbmPollCount">{{ row.count }}명 {{ row.pct }}%</span></div>
    </div>
    <p v-if="view.more" class="bbmPollMore">+{{ view.more }}개 항목</p>
  </section>
</template>
