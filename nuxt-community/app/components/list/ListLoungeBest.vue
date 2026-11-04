<script setup lang="ts">
// 베스트글 라운지형 · 간결형 · 좌측 썸네일형(naver-discussion-feed.js renderLoungeBest 이식).
import { legacy, type ListPost } from '~/composables/list/listData'
import { categoryFor, cleanTitle, metric } from '~/composables/list/listFormat'
import { useListPageCtx } from '~/composables/list/useListPage'

const props = defineProps<{ view: string }>()
const page = useListPageCtx()
const router = useRouter()
const a = (p: string) => communityAsset(p)
const site = (p: string) => siteAsset(p)
const infoOpen = ref(false)
const infoBtn = ref<HTMLElement | null>(null)
const failed = reactive(new Set<string>())
const clean = computed(() => props.view === 'lounge-best-clean' || props.view === 'lounge-best-left')
function timeLabel() { const hour = new Date().getHours(); return (hour < 12 ? '오전 ' : '오후 ') + (hour % 12 || 12) + '시 기준' }
const time = timeLabel()
function detailHref(post: ListPost) {
  return router.resolve({ path: '/posts/' + encodeURIComponent(String(post.id)), query: { ...(post.local ? { local: '1' } : {}), from: 'discussion', v: '20261016naverdiscussion3' } }).href
}
const rows = computed(() => {
  void page.renderSeq.value
  return page.discussionPosts().map((post, index) => {
    const photos = (post.local ? [] : legacy.media()?.photosFor(post) || []).filter(p => p.src)
    const src = photos.length ? photos[0]!.src : post.thumb || ''
    return { post, index, key: String(post.id), photos: photos.length, thumb: src && !/^(https?:|data:|\/)/.test(src) ? a(src) : src, title: cleanTitle(post.title), category: categoryFor(post) }
  })
})
function closeInfo() { infoOpen.value = false; infoBtn.value?.focus() }
</script>

<template>
  <section class="loungeBestIntro" aria-labelledby="loungeBestHeading">
    <div class="loungeBestHead"><h2 id="loungeBestHeading"><em>지금</em> 보배드림 트렌드<img :src="site('assets/bbm/header-notification.svg')" alt=""></h2><button ref="infoBtn" class="loungeBestTime" type="button" data-lounge-best-info :aria-expanded="(infoOpen)" @click="infoOpen = !infoOpen">{{ time }}<span aria-hidden="true">i</span></button></div>
    <div class="loungeBestInfo" data-lounge-best-popover :hidden="!infoOpen"><strong>인기 게시글 선정 기준</strong><p>게시글의 조회·댓글·추천 반응을 종합해 순위를 업데이트합니다.</p><button type="button" data-lounge-best-close aria-label="선정 기준 닫기" @click="closeInfo"><img :src="a('assets/reddit-ui/icon-close-outline.svg')" alt=""></button></div>
  </section>
  <div class="loungeBestRows">
    <template v-if="rows.length">
      <a v-for="r in rows" :key="r.key" class="loungeBestRow" :href="detailHref(r.post)" :data-lounge-best-post="r.post.id"><span v-if="!clean" class="loungeBestRank">{{ r.index + 1 }}</span><span class="loungeBestCopy"><span class="loungeBestTitleLine"><strong>{{ r.title }}</strong><b v-if="Number(r.post.reply || 0) > 0" class="loungeBestReply">{{ metric(r.post.reply) }}</b></span><span class="loungeBestMeta"><span>{{ r.category }}</span><span>조회 {{ metric(r.post.view) }}</span></span></span><span v-if="r.thumb && !failed.has(r.key)" class="loungeBestThumb"><img :src="r.thumb" alt="" :loading="r.index < 4 ? 'eager' : 'lazy'" referrerpolicy="no-referrer" @error="failed.add(r.key)"><b v-if="r.photos > 1">{{ r.photos }}</b></span></a>
    </template>
    <div v-else class="loungeBestEmpty">등록된 베스트글이 없습니다.</div>
  </div>
</template>
