<!-- 투표(치지직 앱: 화면 전체 · X · 「투표」 · 등록. 제목, 항목 3개(번호 · 이미지 · 끌어서 순서), 항목 추가,
     복수 선택 · 무기명 투표(기본 켜짐) · 투표 현황 보기 · 자동 종료일(켜면 날짜 · 시간)). 닫으면 「그만두시겠어요?」 -->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { PollData } from '~/composables/write/legacyLibs'
import { dateOptions, deadlineDefaults } from '~/composables/write/writeUtils'
import WriteAlert from './WriteAlert.vue'
import WriteToolPage from './WriteToolPage.vue'

const props = defineProps<{ current: PollData | null }>()
const emit = defineEmits<{ apply: [poll: PollData], close: [], toast: [message: string] }>()
const icon = (name: string) => communityAsset(`assets/reddit-write/${name}.svg`)

let seq = 0
interface Row { key: number, text: string, image: string }
const makeRow = (text = '', image = ''): Row => ({ key: (seq += 1), text, image })
const cur = props.current
const rows = ref<Row[]>((cur?.options || ['', '', '']).map((text, index) => makeRow(text, (cur?.images || [])[index] || '')))
const pollTitle = ref(cur?.title || '')
const multiple = ref(Boolean(cur?.multiple))
const anonymous = ref(cur?.anonymous !== false)
const visibility = ref(cur?.visibility || 'after_vote')
const autoEnd = ref(Boolean(cur?.endsAt))
const base = deadlineDefaults(cur?.endsAt || '')
const endYear = ref(base.year)
const endMonth = ref(base.month)
const endDay = ref(base.day)
const endHour = ref(base.hour)
const endMinute = ref(Math.floor(base.minute / 10) * 10)
const thisYear = new Date().getFullYear()
const years = dateOptions(thisYear, thisYear + 1, '년')
const months = dateOptions(1, 12, '월')
const days = dateOptions(1, 31, '일')
const hours = dateOptions(0, 23, '시')
const minutes = dateOptions(0, 59, '분').filter(item => item.value % 10 === 0)
const focusedRow = ref<number | null>(null)
const leaving = ref(false)
const list = ref<HTMLElement | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)
let imageRow: Row | null = null

/* 치지직 앱(2026-11-05 폰 2차 확인): 제목 + 내용이 있는 항목 2개 이상이면 등록이 켜지고, 빈 항목은 등록할 때 빠진다 */
const filled = computed(() => rows.value.filter(item => item.text.trim()))
const disabled = computed(() => !pollTitle.value.trim() || filled.value.length < 2)

function addRow() {
  if (rows.value.length >= 20) { emit('toast', '항목은 최대 20개까지 넣을 수 있어요.'); return }
  rows.value.push(makeRow())
  nextTick(() => list.value?.querySelector<HTMLInputElement>('.aw-poll-row:last-child input')?.focus())
}
function removeRow(row: Row) {
  if (rows.value.length <= 2) { emit('toast', '항목은 2개 이상 있어야 해요.'); return }
  rows.value = rows.value.filter(item => item !== row)
}
function pickImage(row: Row) { imageRow = row; imageInput.value?.click() }
function onImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  const row = imageRow
  input.value = ''
  if (!file || !row) return
  if (!/^image\//.test(file.type) || file.size > 8 * 1024 * 1024) { emit('toast', '8MB 이하 사진만 넣을 수 있어요.'); return }
  const reader = new FileReader()
  reader.onload = () => {
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, 720 / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
      row.image = canvas.toDataURL('image/jpeg', 0.82)
    }
    image.src = String(reader.result)
  }
  reader.readAsDataURL(file)
}

/* 오른쪽 손잡이(≡)를 끌어서 순서 바꾸기 — 손가락 · 마우스 모두 */
const dragging = ref<Row | null>(null)
function onHandleDown(event: PointerEvent, row: Row) {
  dragging.value = row
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function onHandleMove(event: PointerEvent) {
  const row = dragging.value
  if (!row || !list.value) return
  const items = [...list.value.querySelectorAll<HTMLElement>('.aw-poll-row')]
  const index = items.findIndex(el => { const r = el.getBoundingClientRect(); return event.clientY >= r.top && event.clientY <= r.bottom })
  const from = rows.value.indexOf(row)
  if (index < 0 || index === from) return
  const next = rows.value.filter(item => item !== row)
  next.splice(index, 0, row)
  rows.value = next
}
function onHandleUp() { dragging.value = null }

function apply() {
  if (disabled.value) return
  const kept = filled.value
  const options = kept.map(item => item.text.trim())
  if (new Set(options).size !== options.length) { emit('toast', '같은 항목은 한 번만 넣어 주세요.'); return }
  let endsAt = ''
  if (autoEnd.value) {
    const end = new Date(endYear.value, endMonth.value - 1, endDay.value, endHour.value, endMinute.value)
    if (end.getTime() <= Date.now()) { emit('toast', '지금보다 뒤의 종료 시각을 골라 주세요.'); return }
    endsAt = end.toISOString()
  }
  emit('apply', { title: pollTitle.value.trim(), options, images: kept.map(item => item.image), multiple: multiple.value, anonymous: anonymous.value, visibility: visibility.value, endsAt })
}
</script>

<template>
  <WriteToolPage title="투표" action-label="등록" :action-disabled="disabled" @left="leaving = true" @action="apply">
    <div class="aw-poll">
      <label class="aw-poll-field"><span class="sr-only">투표 제목</span><input v-model="pollTitle" maxlength="60" placeholder="제목을 입력해주세요"></label>
      <div ref="list" class="aw-poll-list">
        <div v-for="(row, index) in rows" :key="row.key" class="aw-poll-row" :class="{ 'is-focus': focusedRow === row.key, 'is-dragging': dragging === row }">
          <b>{{ index + 1 }}</b>
          <input v-model="row.text" maxlength="40" :aria-label="`항목 ${index + 1}`" placeholder="항목을 입력하세요" @focus="focusedRow = row.key" @blur="focusedRow = null">
          <button class="aw-poll-image" :class="{ 'has-image': row.image }" type="button" :aria-label="`항목 ${index + 1} 사진`" @click="pickImage(row)"><img :src="row.image || icon('icon-image-post-outline')" alt=""></button>
          <button class="aw-poll-handle" type="button" :aria-label="`항목 ${index + 1} 끌어서 순서 바꾸기`" @pointerdown="onHandleDown($event, row)" @pointermove="onHandleMove" @pointerup="onHandleUp" @pointercancel="onHandleUp"><img :src="icon('icon-menu-outline')" alt=""></button>
          <button class="aw-poll-remove" type="button" :aria-label="`항목 ${index + 1} 지우기`" @mousedown.prevent @click="removeRow(row)"><img :src="icon('icon-close-outline')" alt=""></button>
        </div>
      </div>
      <button class="aw-poll-add" type="button" :disabled="rows.length >= 20" @click="addRow"><i class="aw-poll-add-mark" aria-hidden="true"><img :src="icon('icon-add-fill')" alt=""></i>항목 추가</button>
      <div class="aw-poll-settings">
        <label class="aw-switch-row"><span>복수 선택</span><input v-model="multiple" type="checkbox" role="switch"><i aria-hidden="true" /></label>
        <label class="aw-switch-row"><span>무기명 투표</span><input v-model="anonymous" type="checkbox" role="switch"><i aria-hidden="true" /></label>
        <label class="aw-select-row"><span>투표 현황 보기</span><select v-model="visibility" aria-label="투표 현황 보기"><option value="after_vote">투표 참여 후 보기</option><option value="after_close">투표 종료 후 보기</option><option value="hidden">비공개</option></select></label>
        <label class="aw-switch-row"><span>자동 종료일</span><input v-model="autoEnd" type="checkbox" role="switch"><i aria-hidden="true" /></label>
        <div v-if="autoEnd" class="aw-poll-deadline">
          <div><span>날짜</span><select v-model.number="endYear" aria-label="종료 연도"><option v-for="item in years" :key="item.value" :value="item.value">{{ item.value }}년</option></select><select v-model.number="endMonth" aria-label="종료 월"><option v-for="item in months" :key="item.value" :value="item.value">{{ item.label }}</option></select><select v-model.number="endDay" aria-label="종료 일"><option v-for="item in days" :key="item.value" :value="item.value">{{ item.label }}</option></select></div>
          <div><span>시간</span><select v-model.number="endHour" aria-label="종료 시"><option v-for="item in hours" :key="item.value" :value="item.value">{{ item.label }}</option></select><select v-model.number="endMinute" aria-label="종료 분"><option v-for="item in minutes" :key="item.value" :value="item.value">{{ item.label }}</option></select></div>
        </div>
      </div>
      <div class="aw-poll-rest" />
      <input ref="imageInput" class="sr-only" type="file" accept="image/*" @change="onImage">
    </div>
    <WriteAlert v-if="leaving" title="보배드림 커뮤니티" message="작성 중인 내용은 저장되지 않습니다. 투표 작성을 그만두시겠어요?" ok="그만두기" cancel="취소" tone="purple" @cancel="leaving = false" @ok="emit('close')" />
  </WriteToolPage>
</template>
