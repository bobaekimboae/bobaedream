<script setup lang="ts">
// 상세 본문 임베드 한 칸 (정적 community-embed.js blockHtml() · frameHtml() 과 chzzk-detail.js detailEmbedHtml() 을 옮긴 것)
// mode='block'  : 전용 테이블 게시판 글(자동차뉴스 등) — blockHtml 규칙
// mode='local'  : 글쓰기에서 올린 글 — detailEmbedHtml 규칙(인스타그램은 다시 info 로 풀어 block 규칙)
// iframe 높이 맞춤(인스타·레딧·X·스레드·틱톡 신호)은 community-embed.js 가 문서 전체 iframe 에 대해 처리한다.
import type { EmbedItem } from '~/composables/detail/types'
import { legacyWin } from '~/composables/detail/detailData'

const props = defineProps<{ item: EmbedItem; mode: 'block' | 'local' }>()

const ALLOW_FULL = 'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share'
const SANDBOX = 'allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts'

type Frame =
  | { type: 'card' }
  | { type: 'reel'; src: string; title: string }
  | { type: 'tiktok'; src: string; name: string; title: string; shape: Record<string, string> }
  | { type: 'iframe'; src: string; title: string; shape: Record<string, string>; style?: string; crop: boolean }

/** 정적 frameHtml(item) */
function frameOf(item: EmbedItem): Frame {
  if (!/^https:\/\//.test(item.src || '')) return { type: 'card' }
  if (item.reel && /instagram\.com\//.test(item.src || '')) return { type: 'reel', src: String(item.src).replace(/embed\/captioned\/?$/, 'embed/'), title: item.title || 'Instagram 릴스' }
  const crop = item.crop === 'instagram' || /instagram\.com\//.test(item.src || '')
  const src = crop ? String(item.src).replace(/embed\/captioned\/?$/, 'embed/') : String(item.src)
  const yt = /youtube(-nocookie)?\.com\/embed\//.test(src)
  const tt = /tiktok\.com\/(player|embed)\//.test(src)
  const shape: Record<string, string> = {}
  if (yt) shape[item.tall ? 'data-embed-short' : 'data-embed-wide'] = ''
  else if (tt) shape[/\/player\//.test(src) ? 'data-embed-short' : 'data-embed-tiktok-profile'] = ''
  if (tt) {
    const name = `__tt_embed__v${Math.floor(Math.random() * 1e15)}`
    const ttSrc = `${src}${src.indexOf('?') < 0 ? '?' : '&'}lang=ko-KR&referrer=${encodeURIComponent(location.href)}`
    return { type: 'tiktok', src: ttSrc, name, title: item.title || 'TikTok', shape }
  }
  if (!yt && item.wide) shape['data-embed-wide'] = ''
  if (/platform\.twitter\.com\//.test(src)) shape['data-embed-tweet'] = ''
  if (/threads\.com\/t\/[^/]+\/embed\//.test(src)) shape['data-embed-threads'] = ''
  return { type: 'iframe', src, title: item.title || item.provider || '임베드', shape, style: item.height ? `height:${Number(item.height)}px` : undefined, crop }
}

const view = computed(() => {
  let item = props.item
  if (!item || !/^https?:\/\//.test(item.url || '')) return null
  let mode = props.mode
  const embed = legacyWin().BBM_EMBED
  if (mode === 'local' && embed && /instagram\.com\//.test(String(item.url))) {
    const fresh = embed.info(String(item.url))
    if (fresh) { item = { ...fresh, caption: item.caption }; mode = 'block' }
  }
  if (mode === 'local') {
    if (item.render === 'iframe' && /^https:\/\//.test(item.src || '')) return { kind: 'localFrame' as const, item, tall: !!item.tall }
    return { kind: 'card' as const, item, tall: false, hydrate: false }
  }
  if (item.render === 'iframe') {
    const frame = frameOf(item)
    return { kind: 'frame' as const, item, tall: !!item.tall, frame }
  }
  return { kind: 'card' as const, item, tall: false, hydrate: !item.image && !item.noHydrate }
})
</script>

<template>
  <figure v-if="view" class="detailEmbed" :class="{ 'is-tall': view.tall }">
    <template v-if="view.kind === 'localFrame'">
      <iframe :src="view.item.src" :title="view.item.provider || '임베드'" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" :sandbox="SANDBOX" />
    </template>
    <template v-else-if="view.kind === 'frame'">
      <DetailNewsCard v-if="view.frame.type === 'card'" :item="view.item" />
      <div v-else-if="view.frame.type === 'reel'" class="bbm-embed-reel"><iframe data-embed-reel :src="view.frame.src" :title="view.frame.title" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen scrolling="no" sandbox="allow-scripts allow-same-origin allow-popups allow-presentation" /></div>
      <iframe v-else-if="view.frame.type === 'tiktok'" v-bind="view.frame.shape" :name="view.frame.name" :src="view.frame.src" :title="view.frame.title" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts allow-top-navigation allow-same-origin" />
      <div v-else-if="view.frame.crop" class="bbm-embed-crop"><iframe v-bind="view.frame.shape" :style="view.frame.style" :src="view.frame.src" :title="view.frame.title" loading="lazy" :allow="ALLOW_FULL" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" :sandbox="SANDBOX" /></div>
      <iframe v-else v-bind="view.frame.shape" :style="view.frame.style" :src="view.frame.src" :title="view.frame.title" loading="lazy" :allow="ALLOW_FULL" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" :sandbox="SANDBOX" />
    </template>
    <DetailNewsCard v-else :item="view.item" :hydrate="view.hydrate" />
    <figcaption v-if="view.item.caption">{{ view.item.caption }}</figcaption>
  </figure>
</template>
