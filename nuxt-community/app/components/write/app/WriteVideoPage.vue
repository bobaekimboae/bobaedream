<!-- 동영상 업로드 · 동영상 정보(치지직 앱 2026-11-05 폰 3차 확인)
     업로드: 머리줄(‹ · 「동영상 업로드」 · 연보라 「등록」) → 「대표 이미지 추출중  N / N MB」 초록 막대
            → 대표 이미지(사용자 지정 섬네일 추가 + 추천 섬네일 5장, 고른 것은 보라 3px 테두리 + 확대 단추)
            → 제목(최대 40자) · 정보(최대 100자) · 태그 편집(태그추가, 최대 10개) · 안내 문구
     정보 고치기(본문 동영상을 고른 뒤 도구 줄 단추): 「동영상 정보」 제목 · 정보 · 태그만 -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { formatDuration } from '~/composables/write/appExtensions'

export interface VideoMeta { poster: string, duration: string, title: string, info: string, tags: string }
const props = defineProps<{ mode: 'upload' | 'edit', file?: File | null, url?: string, initial?: Partial<VideoMeta> }>()
const emit = defineEmits<{ done: [meta: VideoMeta], close: [] }>()
const icon = (name: string) => communityAsset(`assets/reddit-write/${name}.svg`)

const title = ref(props.initial?.title || '')
const info = ref(props.initial?.info || '')
const tags = ref<string[]>((props.initial?.tags || '').split(',').map(t => t.trim()).filter(Boolean))
const tagEditing = ref(false)
const tagDraft = ref('')
const tagInput = ref<HTMLInputElement | null>(null)

const thumbs = ref<string[]>([])
const custom = ref('')
const picked = ref(0)
const duration = ref(props.initial?.duration || '')
const done = ref(0)
const preview = ref('')
const extracting = computed(() => props.mode === 'upload' && done.value < 5)
const sizeMb = computed(() => (props.file ? props.file.size / 1048576 : 0))
const fmtMb = (n: number) => `${n.toFixed(2)}MB`
const options = computed(() => (custom.value ? [custom.value, ...thumbs.value] : thumbs.value))

let cancelled = false
async function extract() {
  if (props.mode !== 'upload' || !props.url) return
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.src = props.url
  await new Promise<void>((resolve) => {
    video.addEventListener('loadeddata', () => resolve(), { once: true })
    video.addEventListener('error', () => resolve(), { once: true })
  })
  const length = Number.isFinite(video.duration) ? video.duration : 0
  duration.value = formatDuration(length)
  const canvas = document.createElement('canvas')
  const w = 320
  const h = Math.round(w * (video.videoHeight || 9) / (video.videoWidth || 16))
  canvas.width = w
  canvas.height = h || 180
  for (const at of [0.08, 0.28, 0.5, 0.7, 0.9]) {
    if (cancelled) return
    await new Promise<void>((resolve) => {
      const go = () => resolve()
      video.addEventListener('seeked', go, { once: true })
      video.currentTime = Math.min(Math.max(0, length * at), Math.max(0, length - 0.05))
      setTimeout(go, 1500)
    })
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    let shot = ''
    try { shot = canvas.toDataURL('image/jpeg', 0.8) } catch { shot = '' }
    thumbs.value = [...thumbs.value, shot]
    done.value += 1
  }
}
onMounted(() => { extract() })
onBeforeUnmount(() => { cancelled = true })

const customInput = ref<HTMLInputElement | null>(null)
function pickCustom(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !/^image\//.test(file.type)) return
  const reader = new FileReader()
  reader.onload = () => {
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, 720 / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
      custom.value = canvas.toDataURL('image/jpeg', 0.82)
      picked.value = 0
    }
    image.src = String(reader.result)
  }
  reader.readAsDataURL(file)
}

function startTag() {
  if (tags.value.length >= 10) return
  tagEditing.value = true
  nextTick(() => tagInput.value?.focus())
}
function commitTag() {
  const value = tagDraft.value.replace(/^#/, '').trim()
  if (value && !tags.value.includes(value) && tags.value.length < 10) tags.value = [...tags.value, value.slice(0, 20)]
  tagDraft.value = ''
  if (tags.value.length >= 10) tagEditing.value = false
}
function endTag() { commitTag(); tagEditing.value = false }
function removeTag(tag: string) { tags.value = tags.value.filter(t => t !== tag) }

function submit() {
  if (tagDraft.value.trim()) commitTag()
  emit('done', {
    poster: props.mode === 'upload' ? (options.value[picked.value] || '') : (props.initial?.poster || ''),
    duration: duration.value,
    title: title.value.trim(),
    info: info.value.trim(),
    tags: tags.value.join(','),
  })
}
</script>

<template>
  <section class="awp awv" role="dialog" aria-modal="true" :aria-label="mode === 'upload' ? '동영상 업로드' : '동영상 정보'">
    <header class="awp-head">
      <button class="awp-left" type="button" aria-label="취소" @click="emit('close')"><img :src="icon('icon-left-outline')" alt=""></button>
      <h2>{{ mode === 'upload' ? '동영상 업로드' : '동영상 정보' }}</h2>
      <button class="awp-action awv-submit" type="button" @click="submit">등록</button>
    </header>
    <div v-if="extracting" class="awv-progress" role="status">
      <span>대표 이미지 추출중</span>
      <b>{{ fmtMb(sizeMb * done / 5) }}</b><em>/ {{ fmtMb(sizeMb) }}</em>
      <i :style="{ width: `${(done / 5) * 100}%` }" aria-hidden="true" />
    </div>
    <div class="awp-body awv-body">
      <template v-if="mode === 'upload'">
        <h3 class="awv-label is-first">대표 이미지</h3>
        <div class="awv-thumbs" role="listbox" aria-label="대표 이미지">
          <button class="awv-thumb is-add" type="button" aria-label="사용자 지정 섬네일 추가" @click="customInput?.click()"><img :src="icon('icon-add-media-outline')" alt=""></button>
          <template v-for="(src, index) in options" :key="index">
            <div class="awv-thumb" :class="{ 'is-on': picked === index }" role="option" :aria-selected="picked === index" :aria-label="custom && index === 0 ? '사용자 지정 섬네일' : `추천 섬네일 ${custom ? index : index + 1}`" tabindex="0" @click="picked = index" @keydown.enter="picked = index">
              <img v-if="src" :src="src" alt="">
              <button v-if="picked === index" class="awv-zoom" type="button" aria-label="확대" @click.stop="preview = src"><img :src="icon('icon-expand-right-outline')" alt=""></button>
            </div>
          </template>
          <div v-for="n in Math.max(0, 5 - thumbs.length)" :key="`wait-${n}`" class="awv-thumb is-wait" aria-hidden="true" />
        </div>
        <input ref="customInput" class="sr-only" type="file" accept="image/*" @change="pickCustom">
      </template>
      <label class="awv-label" :class="{ 'is-first': mode === 'edit' }" for="awv-title">제목</label>
      <input id="awv-title" v-model="title" class="awv-input is-title" maxlength="40" placeholder="제목을 입력하세요. (최대 40자)">
      <label class="awv-label" for="awv-info">정보</label>
      <input id="awv-info" v-model="info" class="awv-input" maxlength="100" placeholder="정보를 입력해주세요. (최대 100자)">
      <h3 class="awv-label">태그 편집</h3>
      <div class="awv-tags">
        <span v-for="tag in tags" :key="tag" class="awv-tag">{{ tag }}<button type="button" :aria-label="`${tag} 태그 빼기`" @click="removeTag(tag)"><img :src="icon('icon-close-outline')" alt=""></button></span>
        <input v-if="tagEditing" ref="tagInput" v-model="tagDraft" class="awv-tag-add is-edit" maxlength="20" placeholder="태그추가" aria-label="태그 입력" @keydown.enter.prevent="commitTag" @blur="endTag">
        <button v-else-if="tags.length < 10" class="awv-tag-add" type="button" @click="startTag">태그추가</button>
        <span class="awv-tag-max">최대 10개</span>
      </div>
      <p class="awv-notice">불법촬영물 및 아동·청소년 성착취 영상, 저작권 또는 사생활 침해 등의 영상은 관련 법률 및 이용약관에 따라 제재를 받을 수 있습니다.</p>
    </div>
    <div v-if="preview" class="awv-preview" role="dialog" aria-label="대표 이미지 크게 보기" @click="preview = ''"><img :src="preview" alt=""></div>
  </section>
</template>
