<script setup lang="ts">
// 피드 카드 안의 뉴스 · 링크 카드(naver-discussion-feed.js newsCardFor · community-embed.js cardHtml 이식).
// 대표 이미지가 없고 저장된 메타가 없으면 원문 제목 · 요약 · 이미지를 불러와 채운다(정적 판과 같은 microlink 요청).
import { legacy, type ListEmbed } from '~/composables/list/listData'

const props = defineProps<{ item: ListEmbed; fallbackTitle: string }>()
const a = (p: string) => communityAsset(p)
const meta = ref<Record<string, string> | null>(null)
const imageFailed = ref(false)
const logoFailed = ref(false)
const host = computed(() => String(props.item.url || '').replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || '')
const hydrateHost = computed(() => { try { return new URL(String(props.item.url)).hostname } catch { return host.value } })
const needsHydrate = computed(() => !props.item.image && !props.item.metaReady && !props.item.noHydrate)
const card = computed(() => {
  const api = legacy.embed()
  if (meta.value) {
    const m = meta.value
    const item = { url: props.item.url, title: m.title || props.fallbackTitle, description: m.description, image: m.image, logo: m.logo, site: m.site, lang: m.lang }
    return { ...item, logo: item.logo || (api?.faviconFor ? api.faviconFor(item.url) : ''), hostText: hydrateHost.value, titleText: item.title || hydrateHost.value, placeholder: false, hydrated: true }
  }
  const logo = props.item.logo || (api?.faviconFor ? api.faviconFor(props.item.url) : '')
  return {
    url: props.item.url, title: props.item.title, description: props.item.description, image: props.item.image, logo, site: props.item.site || props.item.provider,
    lang: props.item.lang, hostText: host.value, titleText: props.item.title || props.fallbackTitle || host.value, placeholder: true, hydrated: false,
  }
})
const overseas = computed(() => !!card.value.lang && !/^ko/i.test(String(card.value.lang)))
const logoSrc = computed(() => (card.value.logo && /^\.\//.test(card.value.logo) ? a(card.value.logo) : card.value.logo))
function onLogoLoad(e: Event) {
  const img = e.target as HTMLImageElement
  if (/google\.com\/s2\/favicons/.test(String(card.value.logo)) && img.naturalWidth <= 16) logoFailed.value = true
}
onMounted(() => {
  const api = legacy.embed()
  if (!needsHydrate.value || !api?.fetchMeta) return
  api.fetchMeta(String(props.item.url)).then((m) => { if (m && (m.title || m.image)) meta.value = m }).catch(() => {})
})
</script>

<template>
  <a
    class="news-card"
    data-news-hydrated
    v-bind="!card.hydrated && needsHydrate && !meta ? { 'data-embed-title': fallbackTitle } : {}"
    :href="card.url"
    target="_blank"
    rel="noopener noreferrer"
  ><span v-if="card.image && !imageFailed" class="news-card-image"><img :src="card.image" alt="" loading="lazy" referrerpolicy="no-referrer" @error="imageFailed = true"></span><span v-else-if="card.placeholder && !card.image" class="news-card-placeholder" aria-hidden="true"><img :src="a('assets/reddit-ui/icon-link-outline.svg')" alt=""></span><span class="news-card-copy"><span class="news-card-site"><img v-if="card.logo && !logoFailed" :src="logoSrc" alt="" referrerpolicy="no-referrer" @load="onLogoLoad" @error="logoFailed = true"><span>{{ card.site || card.hostText }}</span><em v-if="overseas">해외</em></span><strong class="news-card-title">{{ card.titleText }}</strong><span v-if="card.description" class="news-card-desc">{{ card.description }}</span><small class="news-card-url">{{ card.hostText }}</small></span></a>
</template>
