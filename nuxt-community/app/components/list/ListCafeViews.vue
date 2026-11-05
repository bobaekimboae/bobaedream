<script setup lang="ts">
// 네이버 카페 계열 보기: 피드형(renderCafeFeed) · 좌측 썸네일(renderCafeLeft) · 인기글형(renderCafePopular). 목록 스크립트 이식.
import type { ListPost } from '~/composables/list/listData'
import { inlineImgIds } from '~/composables/list/listInlinePosts'
import { count, countFull, viewCount } from '~/composables/list/listFormat'
import { useListPageCtx } from '~/composables/list/useListPage'
import { centerChip } from '~/composables/list/centerChip'

const props = defineProps<{ kind: 'feed' | 'left' | 'popular'; left?: boolean }>()
const page = useListPageCtx()
const router = useRouter()
const a = (p: string) => communityAsset(p)
const headwordsEl = ref<HTMLElement | null>(null)
const feedBodies = [
  '공개 행사에서 직접 보고 왔습니다. 실차 비율이 생각보다 안정적이고 실내 마감도 꽤 좋아 보이네요.',
  '출퇴근하면서 며칠 써봤는데 생각보다 만족도가 높습니다. 같은 차주분들 의견도 궁금합니다.',
  '직접 장착하고 나서 주행해 봤습니다. 사진으로 보던 것보다 실제 분위기가 더 또렷하게 달라졌어요.',
  '정비소 다녀온 뒤 기록 남깁니다. 비용과 작업 시간은 본문에 같이 정리해 두었습니다.',
  '주말에 세차하고 찍은 사진입니다. 색감이 달라 보일 수 있는데 실제로는 더 차분한 편이에요.',
  '처음엔 걱정했는데 사용해 보니 크게 불편하지 않았습니다. 다음에는 비교 사진도 올려볼게요.',
]
const cafeFollowedAuthors: Record<string, boolean> = { 전기차궁금: true, 하이랜드초보: true, 송파T불빠따: true, 캠핑짐만렙: true, 차주인증러: true, 분진싫어: true }
const fallbackThumb = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=220&q=75'
function clean(p: ListPost) { return String(p.title).replace(/^\[[^\]]+\]\s*/, '') }
function category(p: ListPost) { return p.category || (p.title.match(/^\[([^\]]+)\]/) || [])[1] || page.topics.value[page.active.value] || '자유' }
function unsplash(p: ListPost, w: number, q: number) { return 'https://images.unsplash.com/' + inlineImgIds[(Number(p.id) + 4) % inlineImgIds.length] + '?auto=format&fit=crop&w=' + w + '&q=' + q }
function detail(p: ListPost, v: string) { return router.resolve({ path: '/posts/' + p.id, query: { v } }).href }

const data = computed(() => {
  void page.renderSeq.value
  let list = page.filtered()
  if (props.kind === 'popular') {
    list = list.slice()
    if (page.cafePopularMetric.value === 'popular') list.sort((x, y) => (Number(y.reply) || 0) * 20 + (Number(y.view) || 0) - ((Number(x.reply) || 0) * 20 + (Number(x.view) || 0)))
    if (page.cafePopularMetric.value === 'following') list = list.filter(p => !!cafeFollowedAuthors[p.user])
  }
  return list
})
const thumbPool = computed(() => data.value.filter(p => !!p.thumb).map(p => p.thumb!))
const tabs: Array<[string, string]> = [['all', '전체'], ['popular', '인기'], ['following', '팔로잉']]
function pickHeadword(i: number) {
  page.active.value = i
  page.renderTabs()
  nextTick(center)
}
function center() {
  const selected = headwordsEl.value?.querySelector('[data-cafe-headword="' + page.active.value + '"]')
  centerChip(selected)
}
onMounted(() => { if (props.kind === 'popular') nextTick(center) })
function openCard(p: ListPost) { router.push({ path: '/posts/' + p.id, query: { v: '20261015chzzkfeed' } }) }
function openPopular(p: ListPost) { router.push({ path: '/posts/' + p.id, query: { v: '20261017navercafe1' } }) }
</script>

<template>
  <template v-if="kind === 'feed'">
    <template v-if="data.length">
      <article v-for="(p, index) in data" :key="String(p.id)" class="cafeFeedCard" :data-id="p.id" tabindex="0" role="button" :aria-label="clean(p)" @click="openCard(p)" @keydown.enter.prevent="openCard(p)" @keydown.space.prevent="openCard(p)">
        <div class="cafeFeedProfile"><img class="cafeFeedAvatar" :src="a(p.authorAvatar || 'assets/rank-avatars/minimal/avatar-01.png')" alt=""><div class="cafeFeedAuthor"><strong class="cafeFeedName">{{ p.user }}</strong><span class="cafeFeedTime">{{ p.time }}</span></div></div>
        <h2 class="cafeFeedTitle"><span v-if="p.fresh" class="cafeFeedDot" aria-hidden="true" /><span class="listHeadword">[{{ category(p) }}]</span>{{ clean(p) }}</h2>
        <p class="cafeFeedExcerpt">{{ feedBodies[index % feedBodies.length] }}</p>
        <div class="cafeFeedMedia"><img :src="p.thumb || unsplash(p, 900, 82)" alt="" loading="lazy"><span v-if="p.photos" class="cafeFeedPhotoCount">{{ p.photos }}</span><span v-if="p.video" class="feedPlay" aria-hidden="true" /></div>
        <div class="cafeFeedStats"><span class="cafeFeedStat"><img :src="a('assets/reactions/recommend.svg')" alt="" aria-hidden="true">{{ ((Number(p.id) * 3) % 19) + 1 }}</span><span class="cafeFeedStat"><img :src="a('assets/reactions/comment-outline.svg')" alt="" aria-hidden="true">{{ countFull(p.reply) }}</span><span class="cafeFeedViews">조회 {{ viewCount(p.view) }}</span></div>
      </article>
    </template>
    <div v-else style="padding:30px 0;color:#999;font-size:14px">해당 보기 조건의 게시물이 없습니다.</div>
  </template>
  <template v-else-if="kind === 'left'">
    <template v-if="data.length">
      <a v-for="(p, index) in data" :key="String(p.id)" class="cafeLeftRow" :href="detail(p, '20261015chzzkfeed')" :data-cafe-left-post="p.id"><span class="cafeLeftThumb"><img :src="p.thumb || unsplash(p, 360, 78)" alt="" :loading="index < 5 ? 'eager' : 'lazy'"><b v-if="p.photos">{{ p.photos }}</b><span v-if="p.video" class="cafeLeftPlay" aria-hidden="true" /></span><span class="cafeLeftCopy"><strong><span class="listHeadword">[{{ category(p) }}]</span>{{ clean(p) }}</strong><span class="cafeLeftMeta"><span>{{ p.user }}</span><span>{{ p.time }}</span><span class="cafeLeftReply">댓글 {{ countFull(p.reply) }}</span><span>조회 {{ viewCount(p.view) }}</span></span></span></a>
    </template>
    <div v-else class="cafeLeftEmpty">해당 보기 조건의 게시물이 없습니다.</div>
  </template>
  <template v-else>
    <section class="naverCafePopularHeader">
      <div class="naverCafePopularTabs" role="tablist" aria-label="피드 보기">
        <button v-for="[id, label] in tabs" :key="id" type="button" role="tab" :aria-selected="(id === page.cafePopularMetric.value)" :class="id === page.cafePopularMetric.value ? 'on' : ''" :data-cafe-metric="id" @click="page.cafePopularMetric.value = id">{{ label }}</button>
      </div>
      <div ref="headwordsEl" class="naverCafePopularHeadwords" role="group" aria-label="말머리">
        <button v-for="(topic, i) in page.topics.value" :key="i" type="button" :class="i === page.active.value ? 'on' : ''" :aria-pressed="(i === page.active.value)" :data-cafe-headword="i" @click="pickHeadword(i)">{{ topic }}</button>
      </div>
    </section>
    <div class="naverCafePopularRows">
      <template v-if="data.length">
        <article v-for="(p, index) in data" :key="String(p.id)" :class="['naverCafePopularRow', { hasThumb: !!(p.thumb || (left ? thumbPool[index % thumbPool.length] || fallbackThumb : '')) }]" :data-id="p.id">
          <button type="button" class="naverCafePopularMain" :aria-label="clean(p)" @click="openPopular(p)"><i v-if="p.fresh && !left" class="naverCafeNew" aria-hidden="true" /><span class="naverCafePopularBody"><strong><span class="listHeadword">[{{ category(p) }}]</span>{{ clean(p) }}</strong><span class="naverCafePopularMeta"><span>{{ p.user }}</span><span>{{ p.local ? '방금 전' : '10.' + String(Math.max(1, 17 - Math.floor(index / 6))).padStart(2, '0') }}</span><span>조회 {{ viewCount(p.view) }}</span></span></span><span v-if="p.thumb || left" class="naverCafePopularThumb"><img :src="p.thumb || thumbPool[index % thumbPool.length] || fallbackThumb" alt="" :loading="index < 6 ? 'eager' : 'lazy'"><b v-if="p.photos">{{ p.photos }}+</b></span></button>
          <button type="button" class="naverCafePopularReply" :aria-label="'댓글 ' + countFull(p.reply) + '개'" @click="openPopular(p)"><b>{{ count(p.reply) }}</b><span>댓글</span></button>
        </article>
      </template>
      <div v-else class="naverCafePopularEmpty">팔로우한 작성자의 글이 없습니다.</div>
    </div>
  </template>
</template>
