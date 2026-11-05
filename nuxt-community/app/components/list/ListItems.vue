<script setup lang="ts">
// 목록형 · 간결형 · 텍스트만 · 상세 목록형 · 앨범형(목록 스크립트 renderListBase + 덧붙이기 단계) 이식.
import { cleanTitle, count, countFull, viewCount } from '~/composables/list/listFormat'
import type { ListPost } from '~/composables/list/listData'
import { useListPageCtx } from '~/composables/list/useListPage'

const page = useListPageCtx()
const router = useRouter()
const a = (p: string) => communityAsset(p)
const failed = reactive(new Set<string>())
const metaIcons: Record<string, string> = {
  eye: 'assets/chzzk-view.svg?v=20261017chzzkicons1', thumb: 'assets/reactions/recommend.svg', comment: 'assets/reactions/comment-outline.svg', clock: 'assets/reddit-ui/icon-refresh-outline.svg',
}
const rankSymbols = ['−', '=', '≡', '▰', '⌄', '≡', '★']

const rows = computed(() => {
  void page.renderSeq.value
  const d = page.display
  const textMode = !d.thumbnail
  const noBadge = !d.commentBadge
  const textOnly = page.mode.value === 'text-only'
  const compact = page.mode.value === 'compact' || textOnly
  // 정적 판: 「추천수」를 켜면 첫 글 메타를 고치다가 오류로 멈춘다(그 뒤 글 · 간결형 처리 · 댓글 아이콘 없음)
  const broken = !!d.recommendCount
  const all = page.posts.value
  return page.filtered().map((p: ListPost, index: number) => {
    const key = String(p.id)
    const showThumb = !textMode && !!p.thumb && !(compact && !broken && failed.has(key))
    const post = all.find(c => String(c.id) === key)
    const postIndex = post ? all.indexOf(post) : -1
    const processed = !broken || index === 0
    const cls = ['item', showThumb ? '' : 'noThumb', showThumb && page.thumbPosition.value === 'left' && !(compact && !broken) ? 'thumbLeft' : '', p.fresh ? 'fresh' : '', noBadge ? 'noCommentBadge' : '', !broken && page.titleLines.value === 1 ? 'title1' : ''].filter(Boolean)
    if (compact && !broken && failed.has(key)) cls.push('noThumb')
    const c = count(p.reply)
    const day = String(Math.max(1, 15 - Math.floor(Math.max(0, postIndex) / 2))).padStart(2, '0')
    return {
      p, key, cls, showThumb, c, cf: countFull(p.reply), clean: cleanTitle(p.title),
      headword: d.categoryLabel && !!p.category ? '[' + p.category + ']' : '',
      titleText: d.categoryLabel ? (p.category ? cleanTitle(p.title) : p.title) : cleanTitle(p.title),
      compact: compact && !broken,
      textOnly,
      compactHeadword: compact && !broken && d.categoryLabel && post ? '[' + post.category + ']' : '',
      compactDate: p.local ? '방금 전' : '10.' + day,
      compactRecommend: p.local ? 0 : (postIndex * 7) % 4,
      processed,
      avatar: processed && d.profileAvatar ? (post && post.authorAvatar) || 'assets/rank-avatars/minimal/avatar-01.png' : '',
      timeIcon: processed && !!d.timeIcon,
      viewIcon: processed && !!d.viewIcon,
      rank: d.rankBadge ? rankSymbols[Number(p.rank) % 7] : '',
      rankAfter: processed && page.rankPosition.value === 'after',
      commentIcon: !broken && !!d.commentIcon,
    }
  })
})
function open(row: { p: ListPost }) {
  router.push({ path: '/posts/' + row.p.id, query: { ...(row.p.local ? { local: '1' } : {}), v: '20261015chzzk' } })
}
function onThumbError(key: string, compact: boolean) { if (compact) failed.add(key) }
</script>

<template>
  <template v-if="rows.length">
    <button
      v-for="row in rows"
      :key="row.key"
      :class="row.cls"
      :data-id="row.p.id"
      :data-local-post="row.p.local ? 'true' : 'false'"
      :aria-label="row.clean + ' 상세 보기'"
      @click="open(row)"
    >
      <div class="body">
        <span class="dot" />
        <div v-if="row.compact" class="itemTitle"><span v-if="row.compactHeadword" class="listHeadword">{{ row.compactHeadword }}</span><span class="compactTitleText">{{ row.clean }}</span><span class="compactReply">({{ row.cf }})</span><span v-if="row.textOnly && (row.p.thumb || Number(row.p.photos) > 0 || row.p.video)" class="compactMediaIndicators"><img v-if="row.p.thumb || Number(row.p.photos) > 0" :src="a('assets/chzzk-community/media-image.svg')" alt="이미지 첨부"><img v-if="row.p.video" :src="a('assets/chzzk-community/media-video.svg')" alt="영상 첨부"></span></div>
        <div v-else class="itemTitle"><span v-if="row.headword" class="listHeadword">{{ row.headword }}</span>{{ row.titleText }}<span v-if="!page.display.commentBadge" class="titleComment">({{ row.cf }})</span></div>
        <div v-if="row.compact" class="meta"><span>{{ row.p.user }}</span><span>{{ row.compactDate }}</span><span class="metaMetric metaRecommend"><img class="metaAsset" :src="a(metaIcons.thumb!)" alt="" aria-hidden="true">{{ row.compactRecommend }}</span><span class="metaMetric metaView"><img class="metaAsset" :src="a(metaIcons.eye!)" alt="" aria-hidden="true">{{ viewCount(row.p.view) }}</span></div>
        <div v-else class="meta"><span v-if="row.rank && !row.rankAfter" class="rank">{{ row.rank }}</span><img v-if="row.avatar" class="metaAvatar" alt="" :src="a(row.avatar)"><span>{{ row.p.user }}</span><span v-if="row.rank && row.rankAfter" class="rank">{{ row.rank }}</span><span><img v-if="row.timeIcon" class="metaAsset" :src="a(metaIcons.clock!)" alt="" aria-hidden="true">{{ row.p.time }}</span><span><img v-if="row.viewIcon" class="metaAsset" :src="a(metaIcons.eye!)" alt="" aria-hidden="true"><template v-else>조회 </template>{{ viewCount(row.p.view) }}</span></div>
      </div>
      <div v-if="row.showThumb" class="thumbWrap"><img class="thumb" :src="row.p.thumb" :alt="row.clean + ' 썸네일'" loading="lazy" @error="onThumbError(row.key, row.compact)"><span v-if="row.p.mediaLink" class="mediaLinkBadge"><img :src="a('assets/reddit-ui/icon-link-outline.svg')" alt="링크"></span><span v-else-if="Number(row.p.photos) > 1" class="photoBadge">{{ row.p.photos }}</span><template v-if="row.p.video"><span class="play" aria-label="동영상" /><span class="redditVideoBadge" aria-label="동영상"><img :src="a('assets/reddit-ui/video.svg')" alt="" aria-hidden="true"></span></template></div>
      <span v-if="page.display.commentBadge" class="commentBox" :data-wide="String(row.c.length >= 4)"><b>{{ row.c }}</b><span><img v-if="row.commentIcon" class="metaAsset" :src="a(metaIcons.comment!)" alt="" aria-hidden="true"><template v-else>댓글</template></span></span>
    </button>
  </template>
  <div v-else style="padding:30px 0;color:#999;font-size:14px">해당 보기 조건의 게시물이 없습니다.</div>
</template>
