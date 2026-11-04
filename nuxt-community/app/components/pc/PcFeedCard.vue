<script setup lang="ts">
// 정적 renderRedditFeed() 카드 한 장 + renderFeedMedia()
import type { PcPost } from '~/composables/pc/pcBoardLogic'
import { feedMediaFor } from '~/composables/pc/usePcBoard'

const props = defineProps<{ post: PcPost; href: string }>()
const preview = computed(() => props.post[7] || props.post[1] + '에 관한 회원들의 경험과 의견을 나누는 게시글입니다.')
const initial = computed(() => (props.post[2] || '보').trim().slice(0, 1))
const media = computed(() => feedMediaFor(props.post[8]))
</script>

<template>
  <article class="redditFeedCard">
    <div class="redditFeedMeta"><span class="redditFeedAvatar" aria-hidden="true">{{ initial }}</span><span class="redditFeedAuthor">{{ post[2] }}</span><span class="redditFeedDot" /><span>{{ post[3] }}</span><span class="redditFeedCategory">{{ post[0] }}</span></div>
    <a class="redditFeedTitle" :href="href">{{ post[1] }}</a>
    <p class="redditFeedPreview">{{ preview }}</p>
    <div v-if="media && media.type === 'video'" class="redditFeedMedia is-video"><video controls preload="metadata" playsinline :poster="media.poster" aria-label="차량 영상"><source :src="media.src" type="video/mp4">영상 재생을 지원하지 않는 브라우저입니다.</video><span class="redditFeedMediaBadge">영상</span></div>
    <div v-else-if="media && media.type === 'gallery'" class="redditFeedMedia redditFeedGallery" :aria-label="'사진 ' + media.items.length + '장'"><img v-for="(src, i) in media.items" :key="i" :src="src" alt="" loading="lazy"><span class="redditFeedMediaBadge">사진 {{ media.items.length }}</span></div>
    <div v-else-if="media && media.type === 'image'" class="redditFeedMedia is-image" aria-label="사진"><img :src="media.src" alt="" loading="lazy"></div>
    <div class="redditFeedStats"><span class="redditFeedStat">추천 {{ post[5] || 0 }}</span><span class="redditFeedStat">댓글 {{ post[6] || 0 }}</span><span class="redditFeedStat">조회 {{ post[4] || 0 }}</span></div>
  </article>
</template>
