<script setup lang="ts">
// 노션 북마크형 링크 카드 (정적 community-embed.js cardHtml() 과 같은 DOM)
// hydrate=true 이면 정적 hydrateCards() 처럼 원문 제목·이미지·파비콘을 불러와 카드를 다시 채운다.
import type { EmbedItem } from '~/composables/detail/types'
import { communityUrl } from '~/composables/detail/legacyAssets'
import { legacyWin } from '~/composables/detail/detailData'

const props = defineProps<{ item: EmbedItem; hydrate?: boolean }>()

const hydrated = ref<EmbedItem | null>(null)
const imageFailed = ref(false)
const logoGone = ref(false)

const hostOf = (url?: string) => { try { return new URL(String(url)).hostname.replace(/^www\./, '') } catch { return String(url || '') } }
const card = computed<EmbedItem>(() => {
  const base = hydrated.value || props.item
  const logo = base.logo || legacyWin().BBM_EMBED?.faviconFor?.(String(base.url)) || ''
  return { ...base, logo }
})
const host = computed(() => hostOf(card.value.url))
const overseas = computed(() => !!card.value.lang && !/^ko/i.test(String(card.value.lang)))
const pendingHydrate = computed(() => !!props.hydrate && !hydrated.value)
const isGoogleFavicon = computed(() => /google\.com\/s2\/favicons/.test(String(card.value.logo)))

function onLogoLoad(event: Event) {
  if (isGoogleFavicon.value && (event.target as HTMLImageElement).naturalWidth <= 16) logoGone.value = true
}

onMounted(() => {
  if (!props.hydrate) return
  const url = String(props.item.url)
  legacyWin().BBM_EMBED?.fetchMeta?.(url)?.then((meta) => {
    if (!meta || !(meta.title || meta.image)) return
    imageFailed.value = false
    logoGone.value = false
    hydrated.value = { url, title: meta.title || '', description: meta.description, image: meta.image, logo: meta.logo, site: meta.site, lang: meta.lang }
  })
})
</script>

<template>
  <a class="news-card" :data-embed-hydrate="pendingHydrate ? '' : undefined" :href="card.url" target="_blank" rel="noopener noreferrer"><span v-if="card.image && !imageFailed" class="news-card-image"><img :src="communityUrl(card.image)" alt="" loading="lazy" referrerpolicy="no-referrer" @error="imageFailed = true"></span><span class="news-card-copy"><span class="news-card-site"><img v-if="card.logo && !logoGone" :src="communityUrl(card.logo)" alt="" referrerpolicy="no-referrer" @load="onLogoLoad" @error="logoGone = true"><span>{{ card.site || card.provider || host }}</span><em v-if="overseas">해외</em></span><strong class="news-card-title">{{ card.title || host }}</strong><span v-if="card.description" class="news-card-desc">{{ card.description }}</span><small class="news-card-url">{{ host }}</small></span></a>
</template>
