<script setup lang="ts">
// 베스트글 네이버 랭킹뉴스형(naver-discussion-feed.js renderNaverRanking 이식).
import { legacy, type ListPost } from '~/composables/list/listData'
import { cleanTitle } from '~/composables/list/listFormat'
import { useListPageCtx } from '~/composables/list/useListPage'

const page = useListPageCtx()
const router = useRouter()
const a = (p: string) => communityAsset(p)
const site = (p: string) => siteAsset(p)
const infoOpen = ref(false)
const failed = reactive(new Set<string>())
const tabs: Array<[string, string]> = [['popular', '많이 본'], ['comment', '댓글 많은'], ['recommend', '추천 많은']]
function value(post: ListPost, m: string) { return m === 'comment' ? Number(post.reply) || 0 : m === 'recommend' ? Number(post.likes) || 0 : Number(post.view) || 0 }
function detailHref(post: ListPost) {
  return router.resolve({ path: '/posts/' + encodeURIComponent(String(post.id)), query: { ...(post.local ? { local: '1' } : {}), from: 'discussion', v: '20261016naverdiscussion3' } }).href
}
const groups = computed(() => {
  void page.renderSeq.value
  const m = page.rankingMetric.value
  const data = page.discussionPosts().sort((x, y) => value(y, m) - value(x, m) || Number(y.id) - Number(x.id)).map((post) => {
    const photos = (post.local ? [] : legacy.media()?.photosFor(post) || []).filter(p => p.src)
    const src = photos.length ? photos[0]!.src : post.thumb || ''
    return { post, key: String(post.id), thumb: src && !/^(https?:|data:|\/)/.test(src) ? a(src) : src, title: cleanTitle(post.title) }
  })
  const out: Array<{ start: number; left: Array<typeof data[number] & { i: number }>; right: Array<typeof data[number] & { i: number }> }> = []
  for (let start = 0; start < data.length; start += 10) {
    const chunk = data.slice(start, start + 10)
    const split = Math.min(5, chunk.length)
    out.push({ start, left: chunk.slice(0, split).map((r, i) => ({ ...r, i: start + i })), right: chunk.slice(split).map((r, i) => ({ ...r, i: start + split + i })) })
  }
  return out
})
const heading = computed(() => tabs.find(t => t[0] === page.rankingMetric.value)![1])
</script>

<template>
  <section class="naverRankingHeader">
    <div class="naverRankingTabs" role="tablist" aria-label="랭킹 기준">
      <button v-for="[id, label] in tabs" :key="id" type="button" role="tab" :aria-selected="(id === page.rankingMetric.value)" :class="id === page.rankingMetric.value ? 'on' : ''" :data-ranking-metric="id" @click="page.rankingMetric.value = id"><span>{{ label }}</span></button>
    </div>
    <div class="naverRankingHeading"><strong>{{ heading }} 랭킹</strong><button type="button" data-ranking-info aria-label="랭킹 집계 기준 안내" :aria-expanded="(infoOpen)" @click="infoOpen = !infoOpen"><img :src="site('icons/chotot/chotot-common-info.svg')" alt=""></button><div class="naverRankingPopover" data-ranking-popover :hidden="!infoOpen">조회·댓글·추천 반응을 기준으로 정렬합니다.<br>실시간 수치와 다를 수 있습니다.</div></div>
  </section>
  <div class="naverRankingRows">
    <template v-if="groups.length">
      <section v-for="g in groups" :key="g.start" class="naverRankingGroup">
        <div v-for="(col, ci) in (g.right.length ? [g.left, g.right] : [g.left])" :key="ci" class="naverRankingColumn">
          <a v-for="r in col" :key="r.key" :class="['naverRankingRow', { 'no-thumb': !r.thumb }]" :href="detailHref(r.post)" :data-naver-ranking-post="r.post.id"><span v-if="r.thumb && !failed.has(r.key)" class="naverRankingThumb"><img :src="r.thumb" alt="" :loading="r.i < 4 ? 'eager' : 'lazy'" referrerpolicy="no-referrer" @error="failed.add(r.key)"></span><span class="naverRankingCopy"><strong>{{ r.title }}</strong><span><template v-if="page.rankingMetric.value === 'comment'"><img :src="a('assets/reactions/comment-outline.svg')" alt=""><span class="blind">댓글수</span>{{ Number(r.post.reply || 0).toLocaleString('ko-KR') }}</template><template v-else-if="page.rankingMetric.value === 'recommend'"><img :src="a('assets/reactions/recommend.svg')" alt=""><span class="blind">추천수</span>{{ Number(r.post.likes || 0).toLocaleString('ko-KR') }}</template><template v-else><img :src="a('assets/reddit-ui/view-count.svg')" alt=""><span class="blind">조회수</span>{{ Number(r.post.view || 0).toLocaleString('ko-KR') }}</template></span></span></a>
        </div>
      </section>
    </template>
    <div v-else class="loungeBestEmpty">등록된 베스트글이 없습니다.</div>
  </div>
</template>
