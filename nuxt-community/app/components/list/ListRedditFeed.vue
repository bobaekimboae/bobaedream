<script setup lang="ts">
// 레딧 피드형(reddit-feed.js 이식). 정적 판처럼 처음 불릴 때의 글 5개를 계속 쓴다.
import type { ListPost } from '~/composables/list/listData'
import { cleanTitle } from '~/composables/list/listFormat'
import { useListPageCtx } from '~/composables/list/useListPage'

const emit = defineEmits<{ options: [] }>()
const page = useListPageCtx()
const router = useRouter()
const a = (p: string) => communityAsset(p)
const icon = (name: string) => a('assets/chzzk-detail/icons/' + name + '.svg?v=20261015redditfeed1')
const uiIcon = (name: string) => a('assets/reddit-ui/' + name + '.svg?v=20261016redditicons1')
const votes = reactive<Record<string, string>>({})
const recShow = ref(false)
const recUsed = ref(false) // 정적 판처럼 처음 쓸 때 만든다
const recText = ref('보배드림 커뮤니티에서 이 게시물을 좋아할 수도 있습니다')
const recPostId = ref('1')
let recTimer: ReturnType<typeof setTimeout> | undefined
const posts = computed(() => page.redditPosts.value)
function href(p: ListPost) { return router.resolve({ path: '/posts/' + p.id, query: { v: '20261015redditfeed1' } }).href }
function showRecommendation(id: string) {
  recPostId.value = id
  recUsed.value = true
  recShow.value = true
  clearTimeout(recTimer)
  recTimer = setTimeout(() => { recShow.value = false }, 3600)
}
function flash(text: string, ms: number) {
  recText.value = text
  recUsed.value = true
  recShow.value = true
  clearTimeout(recTimer)
  recTimer = setTimeout(() => { recShow.value = false; recText.value = '보배드림 커뮤니티에서 이 게시물을 좋아할 수도 있습니다' }, ms)
}
function setVote(p: ListPost, dir: string) {
  const key = String(p.id)
  const was = votes[key] === dir
  votes[key] = ''
  if (was) return
  votes[key] = dir
  if (dir === 'up') showRecommendation(key)
}
async function share(id: string) {
  const post = posts.value.find(c => String(c.id) === String(id)) || posts.value[0]
  if (!post) return
  const url = location.origin + router.resolve({ path: '/posts/' + post.id }).href
  try {
    if (navigator.share) { await navigator.share({ title: cleanTitle(post.title), text: cleanTitle(post.title), url }); return }
    await navigator.clipboard.writeText(url)
  } catch (error) { if (error && (error as Error).name === 'AbortError') return }
  flash('게시물 링크를 복사했습니다', 2200)
}
</script>

<template>
  <div class="redditFeedControls"><button class="redditFeedOption" type="button" data-reddit-options @click="emit('options')"><img :src="a('assets/reddit-ui/view-compact.svg')" alt="">피드 옵션</button></div>
  <article v-for="(post, index) in posts" :key="String(post.id)" class="redditFeedCard" :data-post-id="post.id">
    <div class="redditFeedIdentity"><img class="redditFeedAvatar" :src="a(post.authorAvatar || 'assets/rank-avatars/minimal/avatar-01.png')" :alt="post.user + ' 프로필'"><div class="redditFeedAuthor">{{ post.user }}<time>{{ post.time }}</time></div><button class="redditFeedMore" type="button" aria-label="게시물 더보기" @click="flash('게시물 메뉴를 준비 중입니다', 1800)"><img :src="icon('more-reddit')" alt=""></button></div>
    <a class="redditFeedTitle" :href="href(post)">{{ cleanTitle(post.title) }}</a>
    <span class="redditFeedTag">{{ post.category || '자유게시판' }}</span>
    <p class="redditFeedPreview">{{ Array.isArray(post.body) && post.body.length ? post.body[0] : '실사용하면서 확인한 내용을 사진과 함께 공유합니다.' }}</p>
    <a v-if="index !== 0 && post.detailImage" class="redditFeedMedia" :href="href(post)" :aria-label="cleanTitle(post.title) + ' 상세 보기'"><img :src="/^(https?:|\/)/.test(post.detailImage) ? post.detailImage : a(post.detailImage)" :alt="cleanTitle(post.title)" loading="lazy"></a>
    <div class="redditFeedActions" aria-label="게시물 반응">
      <div class="redditActionPill"><button :class="['redditVoteButton', { 'is-up': votes[String(post.id)] === 'up' }]" type="button" data-vote="up" aria-label="추천" :aria-pressed="votes[String(post.id)] === 'up' ? 'true' : 'false'" @click="setVote(post, 'up')"><img :src="a('assets/reactions/recommend.svg')" alt=""><span class="redditScore">{{ votes[String(post.id)] === 'up' ? '1' : votes[String(post.id)] === 'down' ? '-1' : '0' }}</span></button><span class="redditVoteDivider" aria-hidden="true" /><button :class="['redditVoteButton', { 'is-down': votes[String(post.id)] === 'down' }]" type="button" data-vote="down" aria-label="비추천" :aria-pressed="votes[String(post.id)] === 'down' ? 'true' : 'false'" @click="setVote(post, 'down')"><img :src="a('assets/reactions/dislike.svg')" alt=""></button></div>
      <button class="redditActionButton" type="button" :data-comment="post.id" :aria-label="'댓글 ' + post.reply + '개'" @click="router.push({ path: '/posts/' + post.id, hash: '#comments' })"><img :src="a('assets/reactions/comment-outline.svg')" alt=""><span>{{ post.reply }}</span></button>
      <button class="redditActionButton reshare" type="button" :data-reshare="post.id" aria-label="재공유" @click="showRecommendation(String(post.id))"><img :src="uiIcon('repost')" alt=""></button>
      <button class="redditActionButton" type="button" :data-share="post.id" aria-label="공유" @click="share(String(post.id))"><img :src="icon('share-reddit')" alt=""></button>
    </div>
  </article>
  <Teleport to="body">
    <aside v-if="recUsed" id="redditRecommendation" :class="['redditRecommendation', { show: recShow }]" role="status" :data-post-id="recPostId"><p>{{ recText }}</p><button type="button" @click="share(recPostId)">공유</button></aside>
  </Teleport>
</template>
