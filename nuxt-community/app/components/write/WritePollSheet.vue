<!-- 투표 만들기 · 고치기 시트 본문. 원본: public/community/chzzk-write.js renderPollSheet · pollRows · pollImageData -->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { PollData } from '~/composables/write/legacyLibs'
import { dateOptions, deadlineDefaults, pollApplyDisabled } from '~/composables/write/writeUtils'

const props = defineProps<{ current: PollData | null }>()
const emit = defineEmits<{ toast: [message: string], apply: [poll: PollData] }>()

const pollImageIcon = communityAsset('assets/reddit-ui/icon-image-post-outline.svg')
let rowSeq = 0
interface Row { key: number, text: string, image: string }
const makeRow = (text = '', image = ''): Row => ({ key: (rowSeq += 1), text, image })

const cur = props.current
const rows = ref<Row[]>((cur?.options || ['', '', '']).map((text, index) => makeRow(text, (cur?.images || [])[index] || '')))
const pollTitle = ref(cur?.title || '')
const multiple = ref(Boolean(cur?.multiple))
const anonymous = ref(cur?.anonymous !== false)
const visibility = ref(cur?.visibility || 'after_vote')
const endMode = ref<'date' | 'none'>(cur?.endsAt ? 'date' : 'none')
const base = deadlineDefaults(cur?.endsAt || '')
const endYear = ref(base.year)
const endMonth = ref(base.month)
const endDay = ref(base.day)
const endHour = ref(base.hour)
const endMinute = ref(base.minute)
const thisYear = new Date().getFullYear()
const yearOptions = dateOptions(thisYear, thisYear + 3, '년')
const monthOptions = dateOptions(1, 12, '월')
const dayOptions = dateOptions(1, 31, '일')
const hourOptions = dateOptions(0, 23, '시')
const minuteOptions = dateOptions(0, 59, '분')

const optionsBox = ref<HTMLElement | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)
let imageRow: Row | null = null

const disabled = computed(() => pollApplyDisabled(pollTitle.value, rows.value))

function addOption() {
  if (rows.value.length >= 20) { emit('toast', '선택지는 최대 20개입니다.'); return }
  rows.value.push(makeRow())
  nextTick(() => { optionsBox.value?.querySelector<HTMLInputElement>('.poll-row:last-child .poll-option')?.focus() })
}
function removeOption(row: Row) {
  if (rows.value.length <= 2) { emit('toast', '선택지는 2개 이상 필요합니다.'); return }
  rows.value = rows.value.filter(item => item !== row)
}
function pickImage(row: Row) { imageRow = row; imageInput.value?.click() }

function pollImageData(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\/(png|jpe?g|gif|bmp)$/i.test(file.type)) { reject(new Error('type')); return }
    if (file.size > 8 * 1024 * 1024) { reject(new Error('size')); return }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('image'))
      image.onload = () => {
        const scale = Math.min(1, 720 / Math.max(image.naturalWidth, image.naturalHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
        canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
async function onImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  const row = imageRow
  input.value = ''
  if (!file || !row) return
  try {
    row.image = await pollImageData(file)
    emit('toast', '항목 이미지를 추가했습니다.')
  }
  catch (error) { emit('toast', (error as Error).message === 'size' ? '이미지는 8MB 이하만 추가할 수 있습니다.' : '이미지를 불러오지 못했습니다.') }
}

/* 끌어서 순서 바꾸기(정적 판과 같은 HTML5 끌어 놓기) */
const dragged = ref<Row | null>(null)
function onDragStart(row: Row) { dragged.value = row }
function onDragOver(event: DragEvent) { if (dragged.value) event.preventDefault() }
function onDrop(event: DragEvent, target: Row) {
  const from = dragged.value
  if (!from || from === target) return
  event.preventDefault()
  const el = (event.currentTarget as HTMLElement)
  const rect = el.getBoundingClientRect()
  const list = rows.value.filter(item => item !== from)
  const index = list.indexOf(target)
  list.splice(event.clientY < rect.top + rect.height / 2 ? index : index + 1, 0, from)
  rows.value = list
}
function onDragEnd() { dragged.value = null }

function primary() {
  const titleValue = pollTitle.value.trim()
  const options = rows.value.map(item => item.text.trim())
  if (!titleValue || options.length < 2 || options.some(option => !option)) { emit('toast', '제목과 모든 선택지를 입력해주세요.'); return }
  if (new Set(options).size !== options.length) { emit('toast', '같은 항목은 한 번만 입력해주세요.'); return }
  let endsAt = ''
  if (endMode.value === 'date') {
    const end = new Date(endYear.value, endMonth.value - 1, endDay.value, endHour.value, endMinute.value)
    if (end.getTime() <= Date.now()) { emit('toast', '현재보다 뒤의 종료 시각을 선택해주세요.'); return }
    endsAt = end.toISOString()
  }
  emit('apply', { title: titleValue, options, images: rows.value.map(item => item.image || ''), multiple: multiple.value, anonymous: anonymous.value, visibility: visibility.value, endsAt })
}

defineExpose({ primary, disabled })
</script>

<template>
  <div class="poll-form">
    <label class="poll-title-field"><span class="sr-only">투표 제목</span><input id="pollTitle" v-model="pollTitle" maxlength="100" placeholder="제목을 입력해주세요"></label>
    <div id="pollOptions" ref="optionsBox" class="poll-options">
      <div
        v-for="(row, index) in rows"
        :key="row.key"
        class="poll-row"
        :class="{ 'is-dragging': dragged === row }"
        draggable="true"
        :data-poll-image="row.image"
        @dragstart="onDragStart(row)"
        @dragover="onDragOver"
        @drop="onDrop($event, row)"
        @dragend="onDragEnd"
      >
        <b>{{ index + 1 }}</b>
        <input v-model="row.text" class="poll-option" maxlength="60" :aria-label="`항목 ${index + 1}`" placeholder="항목을 입력하세요">
        <button class="poll-image-button" :class="{ 'has-image': row.image }" type="button" data-poll-image-button :aria-label="`항목 ${index + 1} 이미지 추가`" @click="pickImage(row)"><img :src="row.image || pollImageIcon" alt=""></button>
        <button class="poll-reorder" type="button" data-poll-reorder :aria-label="`항목 ${index + 1} 순서 변경`" title="끌어서 순서 변경"><span /><span /><span /></button>
        <button class="poll-remove" type="button" data-remove-option :aria-label="`항목 ${index + 1} 삭제`" @click="removeOption(row)">×</button>
      </div>
    </div>
    <button class="add-option" type="button" data-add-option :disabled="rows.length >= 20" @click="addOption"><span>＋</span> 항목 추가</button>
    <p class="poll-limit"><span id="pollOptionCount">{{ rows.length }}</span>/20</p>
    <div class="poll-setting-list">
      <label class="poll-check-row"><span>복수 선택 허용</span><input id="pollMultiple" v-model="multiple" type="checkbox"></label>
      <label class="poll-check-row"><span>무기명 투표</span><input id="pollAnonymous" v-model="anonymous" type="checkbox"></label>
      <label class="poll-select-row"><strong>투표 현황 보기</strong><select id="pollVisibility" v-model="visibility" aria-label="투표 현황 보기"><option value="after_vote">투표 참여 후 보기</option><option value="after_close">투표 종료 후 보기</option><option value="hidden">비공개</option></select></label>
      <fieldset class="poll-deadline">
        <legend>자동 종료 설정</legend><label><input v-model="endMode" type="radio" name="pollEndMode" value="date">특정 날짜에 종료</label><label><input v-model="endMode" type="radio" name="pollEndMode" value="none">자동 종료 없음</label><div id="pollDeadlineFields" class="poll-deadline-fields" :hidden="endMode !== 'date'">
          <select id="pollEndYear" v-model.number="endYear" aria-label="종료 연도"><option v-for="item in yearOptions" :key="item.value" :value="item.value">{{ item.label }}</option></select>
          <select id="pollEndMonth" v-model.number="endMonth" aria-label="종료 월"><option v-for="item in monthOptions" :key="item.value" :value="item.value">{{ item.label }}</option></select>
          <select id="pollEndDay" v-model.number="endDay" aria-label="종료 일"><option v-for="item in dayOptions" :key="item.value" :value="item.value">{{ item.label }}</option></select>
          <select id="pollEndHour" v-model.number="endHour" aria-label="종료 시"><option v-for="item in hourOptions" :key="item.value" :value="item.value">{{ item.label }}</option></select>
          <select id="pollEndMinute" v-model.number="endMinute" aria-label="종료 분"><option v-for="item in minuteOptions" :key="item.value" :value="item.value">{{ item.label }}</option></select>
        </div>
      </fieldset>
    </div>
    <input id="pollImageInput" ref="imageInput" class="sr-only" type="file" accept="image/png,image/jpeg,image/gif,image/bmp" @change="onImageChange">
    <p class="sheet-note">선택지는 2개 이상 20개까지 추가할 수 있습니다. 이미지는 항목당 1장까지 등록됩니다.</p>
  </div>
</template>
