<script setup lang="ts">
import { previewStorageKey } from '~/services/communityApi'
import type { CommunityPost, PublishPostPayload } from '~/types/community'

type CommentVote = 'up' | 'down' | null
type DetailComment = {
  id: string
  author: string
  text: string
  createdAt: string
  likes: number
  dislikes: number
  viewerVote: CommentVote
  replies?: DetailComment[]
}

const route = useRoute()
const router = useRouter()
const { posts, boards } = useCommunity()
const iconRoot = `${useRuntimeConfig().app.baseURL}icons`
const liked = ref(false)
const disliked = ref(false)
const post = ref<(CommunityPost & Partial<PublishPostPayload>) | null>(null)
const commentDraft = ref('')
const comments = ref<DetailComment[]>([
  {
    id: 'comment-1',
    author: '전기차궁금',
    text: '실사용 정보 잘 봤습니다. 충전 속도도 궁금하네요.',
    createdAt: '12분 전',
    likes: 3,
    dislikes: 0,
    viewerVote: null,
    replies: [
      {
        id: 'reply-1',
        author: '하이랜드초보',
        text: '급속 충전 기준도 함께 정리해 주시면 좋겠습니다.',
        createdAt: '5분 전',
        likes: 1,
        dislikes: 0,
        viewerVote: null,
      },
    ],
  },
])

onMounted(() => {
  const id = String(route.params.id)
  const existing = posts.value.find(item => item.id === id)
  if (existing) {
    post.value = existing
    return
  }
  try {
    const previews = JSON.parse(localStorage.getItem(previewStorageKey) || '[]') as Array<PublishPostPayload & { id: string; createdAt: string }>
    const found = previews.find(item => item.id === id)
    if (found) {
      post.value = { ...found, excerpt: found.text, author: '보배회원', updatedAt: found.createdAt, comments: 0, likes: 0, dislikes: 0, views: 1 }
    }
  } catch { /* preview storage is optional */ }
})

const boardName = computed(() => boards.value.find(board => board.id === post.value?.boardId)?.name || '커뮤니티')
const likeCount = computed(() => (post.value?.likes || 0) + (liked.value ? 1 : 0))
const dislikeCount = computed(() => (post.value?.dislikes || 0) + (disliked.value ? 1 : 0))
const commentCount = computed(() => comments.value.reduce((total, item) => total + 1 + (item.replies?.length || 0), 0))

function toggleLike() {
  liked.value = !liked.value
  if (liked.value) disliked.value = false
}

function toggleDislike() {
  disliked.value = !disliked.value
  if (disliked.value) liked.value = false
}

function toggleCommentVote(comment: DetailComment, direction: Exclude<CommentVote, null>) {
  if (comment.viewerVote === direction) {
    if (direction === 'up') comment.likes = Math.max(0, comment.likes - 1)
    else comment.dislikes = Math.max(0, comment.dislikes - 1)
    comment.viewerVote = null
    return
  }

  if (comment.viewerVote === 'up') comment.likes = Math.max(0, comment.likes - 1)
  if (comment.viewerVote === 'down') comment.dislikes = Math.max(0, comment.dislikes - 1)
  if (direction === 'up') comment.likes += 1
  else comment.dislikes += 1
  comment.viewerVote = direction
}

function addComment() {
  const text = commentDraft.value.trim()
  if (!text) return
  comments.value.unshift({
    id: `comment-${Date.now()}`,
    author: '보배회원',
    text,
    createdAt: '방금 전',
    likes: 0,
    dislikes: 0,
    viewerVote: null,
  })
  commentDraft.value = ''
}

useHead({ title: computed(() => post.value ? `${post.value.title} | 보배드림` : '게시글 | 보배드림') })
</script>

<template>
  <main class="detail-page">
    <header class="detail-header"><button type="button" aria-label="뒤로" @click="router.back()">‹</button><strong>{{ boardName }}</strong><div><button type="button" aria-label="검색" class="search-icon" /><button type="button" aria-label="더보기">•••</button></div></header>
    <article v-if="post" class="detail-article">
      <span v-if="post.headword" class="post-headword">{{ post.headword }}</span>
      <h1>{{ post.title }}</h1>
      <div class="detail-author"><span class="feed-avatar">{{ post.author.slice(0, 1) }}</span><div><strong>{{ post.author }}</strong><small>{{ new Date(post.createdAt).toLocaleString('ko-KR') }} · 조회 {{ post.views.toLocaleString() }}</small></div></div>
      <div v-if="post.html" class="detail-body" v-html="post.html" />
      <p v-else class="detail-body">{{ post.excerpt }}</p>
      <div v-if="post.tags?.length" class="detail-tags"><span v-for="tag in post.tags" :key="tag">#{{ tag }}</span></div>
      <footer class="detail-reactions"><button :class="{ 'is-active': liked }" type="button" @click="toggleLike"><img :src="`${iconRoot}/reaction-like.svg`" alt="추천" />추천 {{ likeCount }}</button><button :class="{ 'is-active': disliked }" type="button" @click="toggleDislike"><img :src="`${iconRoot}/reaction-dislike.svg`" alt="비추천" />비추천 {{ dislikeCount }}</button></footer>
    </article>
    <section v-else class="detail-empty"><h1>게시글을 찾을 수 없습니다.</h1><NuxtLink to="/">목록으로 돌아가기</NuxtLink></section>
    <section v-if="post" class="comment-section">
      <header><h2>댓글 {{ commentCount }}</h2><button type="button">최신순</button></header>
      <ol class="detail-comments">
        <li v-for="comment in comments" :key="comment.id" class="detail-comment">
          <span class="detail-comment-avatar">{{ comment.author.slice(0, 1) }}</span>
          <div class="detail-comment-content">
            <div class="detail-comment-author"><strong>{{ comment.author }}</strong><span>{{ comment.createdAt }}</span></div>
            <p>{{ comment.text }}</p>
            <div class="detail-comment-actions">
              <button type="button">답글</button>
              <span class="detail-comment-votes">
                <button :class="{ 'is-active': comment.viewerVote === 'up' }" type="button" :aria-pressed="comment.viewerVote === 'up'" :aria-label="`댓글 추천 ${comment.likes}`" @click="toggleCommentVote(comment, 'up')"><img :src="`${iconRoot}/reaction-like.svg`" alt="" />{{ comment.likes }}</button>
                <button :class="{ 'is-active': comment.viewerVote === 'down' }" type="button" :aria-pressed="comment.viewerVote === 'down'" :aria-label="`댓글 비추천 ${comment.dislikes}`" @click="toggleCommentVote(comment, 'down')"><img :src="`${iconRoot}/reaction-dislike.svg`" alt="" />{{ comment.dislikes }}</button>
              </span>
            </div>
            <ol v-if="comment.replies?.length" class="detail-replies">
              <li v-for="reply in comment.replies" :key="reply.id" class="detail-reply">
                <span class="detail-comment-avatar">{{ reply.author.slice(0, 1) }}</span>
                <div class="detail-comment-content">
                  <div class="detail-comment-author"><strong>{{ reply.author }}</strong><span>{{ reply.createdAt }}</span></div>
                  <p>{{ reply.text }}</p>
                  <div class="detail-comment-actions">
                    <button type="button">답글</button>
                    <span class="detail-comment-votes">
                      <button :class="{ 'is-active': reply.viewerVote === 'up' }" type="button" :aria-pressed="reply.viewerVote === 'up'" :aria-label="`답글 추천 ${reply.likes}`" @click="toggleCommentVote(reply, 'up')"><img :src="`${iconRoot}/reaction-like.svg`" alt="" />{{ reply.likes }}</button>
                      <button :class="{ 'is-active': reply.viewerVote === 'down' }" type="button" :aria-pressed="reply.viewerVote === 'down'" :aria-label="`답글 비추천 ${reply.dislikes}`" @click="toggleCommentVote(reply, 'down')"><img :src="`${iconRoot}/reaction-dislike.svg`" alt="" />{{ reply.dislikes }}</button>
                    </span>
                  </div>
                </div>
              </li>
            </ol>
          </div>
        </li>
      </ol>
      <form class="comment-composer" @submit.prevent="addComment"><input v-model="commentDraft" placeholder="댓글을 입력해주세요." aria-label="댓글" /><button type="submit">등록</button></form>
    </section>
  </main>
</template>
