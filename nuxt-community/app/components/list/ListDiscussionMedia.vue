<script setup lang="ts">
// 네이버 토론형 카드의 사진 · 영상 줄(naver-discussion-feed.js mediaFor · initMediaCarousels 이식).
// 여러 장이면 Embla 캐러셀 8.6.0(정적 판과 같은 vendor 파일)으로 끌어 넘긴다.
import { legacy, type EmblaApi, type ListPost, type MediaSource } from '~/composables/list/listData'
import { cleanTitle } from '~/composables/list/listFormat'

const props = defineProps<{ post: ListPost; index: number; sources: MediaSource[]; detailHref: (photoIndex?: number) => string }>()
const a = (p: string) => communityAsset(p)
const shell = ref<HTMLElement | null>(null)
const multiple = computed(() => props.sources.length > 1)
const title = computed(() => cleanTitle(props.post.title))
const postVideo = computed(() => legacy.media()?.videoFor(props.post) || '')
const measured = reactive<Record<number, number>>({})
const ready = ref(false)
const fit = ref(false)
const dragging = ref(false)
const prevHidden = ref(true)
const nextHidden = ref(false)
const current = ref(1)
const playing = reactive<Record<number, boolean>>({})
let api: EmblaApi | null = null

function clampRatio(value: number) { const r = Number(value) || 1; return Math.min(16 / 9, Math.max(9 / 16, r)) }
const items = computed(() => props.sources.map((item, itemIndex) => {
  const source = item.src || ''
  const isVideo = item.kind === 'video' || (Boolean(postVideo.value) && itemIndex === 0)
  const ratio = measured[itemIndex] ?? (item.ratio ? clampRatio(item.ratio) : 1)
  return {
    itemIndex, source: source && !/^(https?:|data:|blob:|\/)/.test(source) ? a(source) : source, isVideo, ratio,
    contain: /\.png(?:\?|$)/i.test(source), localId: item.id, needsRatio: !item.ratio,
    videoSource: item.kind === 'video' ? source : postVideo.value ? a(postVideo.value) : '', poster: item.kind === 'video' ? '' : source,
  }
}))
const singleRatio = computed(() => {
  const first = props.sources[0]
  if (!first) return 1
  return Math.max(1, measured[0] ?? (first.ratio ? clampRatio(first.ratio) : 16 / 9))
})
function onImgLoad(e: Event, itemIndex: number, needs: boolean) {
  if (!needs) return
  const img = e.target as HTMLImageElement
  if (!img.naturalWidth || !img.naturalHeight) return
  measured[itemIndex] = clampRatio(img.naturalWidth / img.naturalHeight)
  nextTick(() => api?.reInit())
}
function sync() {
  if (!api || !shell.value) return
  prevHidden.value = !api.canScrollPrev()
  nextHidden.value = !api.canScrollNext()
  fit.value = !(api.canScrollPrev() || api.canScrollNext())
  const nodes = api.slideNodes()
  const left = shell.value.getBoundingClientRect().left
  let first = 0
  for (let i = 0; i < nodes.length; i++) {
    const r = nodes[i]!.getBoundingClientRect()
    if (r.left + r.width / 2 >= left) { first = i; break }
  }
  if (!api.canScrollNext()) first = nodes.length - 1
  current.value = first + 1
}
function toggleVideo(e: Event, itemIndex: number) {
  const video = (e.currentTarget as HTMLElement).parentElement?.querySelector('video')
  if (!video) return
  document.querySelectorAll<HTMLVideoElement>('#list .naverDiscussionMediaItem video').forEach((other) => { if (other !== video) other.pause() })
  if (video.paused) { video.controls = true; video.play().catch(() => {}) } else video.pause()
  void itemIndex
}
let wheelSum = 0, wheelTimer: ReturnType<typeof setTimeout> | undefined, wheelLock = false
function onWheel(event: WheelEvent) {
  if (!api) return
  const dx = event.deltaX || (event.shiftKey ? event.deltaY : 0)
  if (Math.abs(dx) <= Math.abs(event.shiftKey ? 0 : event.deltaY)) return
  event.preventDefault()
  wheelSum += dx
  clearTimeout(wheelTimer)
  wheelTimer = setTimeout(() => { wheelSum = 0; wheelLock = false }, 180)
  if (wheelLock || Math.abs(wheelSum) < 30) return
  wheelLock = true
  if (wheelSum > 0) api.scrollNext()
  else api.scrollPrev()
  wheelSum = 0
}
function onKey(event: KeyboardEvent) {
  if (!api) return
  if (event.key === 'ArrowRight') { event.preventDefault(); api.scrollNext() }
  if (event.key === 'ArrowLeft') { event.preventDefault(); api.scrollPrev() }
}
onMounted(() => {
  if (!multiple.value || !shell.value) return
  const Embla = legacy.embla()
  if (typeof Embla !== 'function') return
  ready.value = true
  api = Embla(shell.value, { align: 'start', containScroll: 'trimSnaps', dragFree: true, loop: false, duration: 24 })
  ;['init', 'scroll', 'select', 'reInit', 'settle'].forEach(ev => api!.on(ev, sync))
  sync()
  api.on('pointerDown', () => { dragging.value = true })
  api.on('pointerUp', () => { dragging.value = false })
  shell.value.addEventListener('wheel', onWheel, { passive: false })
})
onBeforeUnmount(() => { api?.destroy(); api = null })
</script>

<template>
  <div
    ref="shell"
    :class="['naverDiscussionMediaShell', multiple ? 'is-multi' : 'is-single', { 'is-embla-ready': ready, 'is-fit': ready && fit, 'is-dragging': dragging }]"
    :style="multiple ? undefined : { '--media-ratio': singleRatio.toFixed(4) }"
    :data-carousel-engine="ready ? 'embla' : undefined"
    @keydown="onKey"
  >
    <div class="naverDiscussionMediaRail" tabindex="0" :aria-label="title + ' 사진과 영상 ' + sources.length + '개, 좌우로 넘기기'">
      <div
        v-for="item in items"
        :key="item.itemIndex"
        :class="['naverDiscussionMediaItem', { 'is-contain': item.contain }]"
        :style="{ '--media-ratio': item.ratio.toFixed(4) }"
        :data-discussion-media-index="item.itemIndex"
        :data-media-post-id="post.id"
        :data-kind="item.isVideo ? 'video' : 'image'"
      >
        <template v-if="item.isVideo">
          <video muted playsinline preload="metadata" :data-local-media-id="item.localId || undefined" :poster="item.poster ? item.source : undefined" :src="item.videoSource || undefined" @play="playing[item.itemIndex] = true" @pause="playing[item.itemIndex] = false" />
          <button :class="['naverDiscussionVideoToggle', { 'is-playing': playing[item.itemIndex] }]" type="button" data-discussion-video :aria-label="playing[item.itemIndex] ? '영상 일시정지' : '영상 재생'" @click="toggleVideo($event, item.itemIndex)"><img :src="a('assets/reddit-video/play-fill.svg')" alt=""></button>
        </template>
        <a v-else class="naverDiscussionMediaLink" :href="detailHref(item.itemIndex)" draggable="false" :aria-label="title + ' 사진 ' + (item.itemIndex + 1) + ' / ' + sources.length + ' 상세 보기'"><img
          :src="item.source"
          :data-local-media-id="item.localId || undefined"
          :data-measure-ratio="item.needsRatio ? '' : undefined"
          alt=""
          draggable="false"
          :loading="index === 0 && item.itemIndex === 0 ? 'eager' : 'lazy'"
          :fetchpriority="index === 0 && item.itemIndex === 0 ? 'high' : undefined"
          @load="onImgLoad($event, item.itemIndex, item.needsRatio)"
        ></a>
      </div>
    </div>
    <template v-if="multiple">
      <button class="naverDiscussionMediaArrow is-prev" type="button" data-media-prev aria-label="이전 사진" :hidden="prevHidden" @click.prevent.stop="api?.scrollPrev()" />
      <button class="naverDiscussionMediaArrow is-next" type="button" data-media-next aria-label="다음 사진" :hidden="ready ? nextHidden : false" @click.prevent.stop="api?.scrollNext()" />
      <span class="naverDiscussionMediaCount" aria-hidden="true"><b data-media-current>{{ current }}</b>/{{ sources.length }}</span>
    </template>
  </div>
</template>
