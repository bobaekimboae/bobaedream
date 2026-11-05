<!-- 일정(네이버 카페 앱 2026-11-06 폰 확인): ← 일정 · 첨부.
     일정 제목 · 하루 종일 · 시작 · 종료 · 장소 입력 · 중요 일정으로 표시 · 다른 사람이 일정 담아가기 허용 · 회색 안내.
     보배드림: 정모 · 시승회 · 차량 인도 일정 같은 모임 일정을 본문 카드로 넣는다(네이버 캘린더 연동은 없다) -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import WriteToolPage from '../app/WriteToolPage.vue'

export interface ScheduleCard { title: string, sub: string, meta: string }
const emit = defineEmits<{ attach: [card: ScheduleCard], close: [] }>()

const pad = (n: number) => String(n).padStart(2, '0')
const local = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
const now = new Date()
now.setMinutes(0, 0, 0)
now.setHours(now.getHours() + 1)
const later = new Date(now.getTime() + 3_600_000)

const title = ref('')
const allDay = ref(false)
const start = ref(local(now))
const end = ref(local(later))
const place = ref('')
const important = ref(false)
const shareable = ref(false)

/** 2026.11.06. 오전 08:00 (하루 종일이면 날짜만) */
function label(value: string, dateOnly: boolean): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const day = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}.`
  if (dateOnly) return day
  const h = d.getHours()
  return `${day} ${h < 12 ? '오전' : '오후'} ${pad(h % 12 || 12)}:${pad(d.getMinutes())}`
}
const backwards = computed(() => new Date(end.value).getTime() < new Date(start.value).getTime())
const canAttach = computed(() => Boolean(title.value.trim()) && !backwards.value)

function attach() {
  if (!canAttach.value) return
  const from = label(start.value, allDay.value)
  const to = label(end.value, allDay.value)
  const sub = from === to ? from : `${from} ~ ${to}`
  const meta = [place.value.trim(), important.value ? '중요 일정' : '', shareable.value ? '담아가기 허용' : ''].filter(Boolean).join(' · ')
  emit('attach', { title: title.value.trim(), sub, meta })
}
</script>

<template>
  <WriteToolPage title="일정" left-label="뒤로가기" action-label="첨부" action-tone="soft" :action-disabled="!canAttach" @left="emit('close')" @action="attach">
    <div class="nws">
      <label class="nws-title"><span class="sr-only">일정 제목</span><input v-model="title" maxlength="40" placeholder="일정 제목" autocomplete="off"></label>
      <label class="aw-switch-row"><span>하루 종일</span><input v-model="allDay" type="checkbox" role="switch"><i aria-hidden="true" /></label>
      <label class="nws-time"><span>시작</span><b>{{ label(start, allDay) }}</b><input v-model="start" :type="allDay ? 'date' : 'datetime-local'" aria-label="시작 날짜와 시간" @change="allDay && (start = `${start.slice(0, 10)}T00:00`)"></label>
      <label class="nws-time" :class="{ 'is-error': backwards }"><span>종료</span><b>{{ label(end, allDay) }}</b><input v-model="end" :type="allDay ? 'date' : 'datetime-local'" aria-label="종료 날짜와 시간" @change="allDay && (end = `${end.slice(0, 10)}T00:00`)"></label>
      <p v-if="backwards" class="nws-error" role="alert">종료 시간이 시작 시간보다 빨라요.</p>
      <label class="nws-place"><span class="sr-only">장소</span><input v-model="place" maxlength="60" placeholder="장소 입력" autocomplete="off"><img :src="communityAsset('assets/reddit-write/icon-location-outline.svg')" alt=""></label>
      <label class="aw-switch-row"><span>중요 일정으로 표시</span><input v-model="important" type="checkbox" role="switch"><i aria-hidden="true" /></label>
      <label class="aw-switch-row"><span>다른 사람이 일정 담아가기 허용</span><input v-model="shareable" type="checkbox" role="switch"><i aria-hidden="true" /></label>
      <p class="nws-note">일정은 본문에 카드로 들어가요. 정모 · 시승회 · 차량 인도처럼 날짜가 있는 모임을 알릴 때 써 주세요.</p>
    </div>
  </WriteToolPage>
</template>
