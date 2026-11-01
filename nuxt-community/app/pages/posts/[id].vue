<script setup lang="ts">
import { previewStorageKey } from '~/services/communityApi'
import type { CommunityPost, PublishPostPayload } from '~/types/community'

const route = useRoute()
const router = useRouter()
const { posts, boards } = useCommunity()
const iconRoot = `${useRuntimeConfig().app.baseURL}icons`
const liked = ref(false)
const disliked = ref(false)
const post = ref<(CommunityPost & Partial<PublishPostPayload>) | null>(null)

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

function toggleLike() {
  liked.value = !liked.value
  if (liked.value) disliked.value = false
}

function toggleDislike() {
  disliked.value = !disliked.value
  if (disliked.value) liked.value = false
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
    <section v-if="post" class="comment-section"><header><h2>댓글 {{ post.comments }}</h2><button type="button">최신순</button></header><div class="comment-empty"><img :src="`${iconRoot}/reaction-comment.svg`" alt="" /><p>첫 댓글을 남겨보세요.</p></div><div class="comment-composer"><input placeholder="댓글을 입력해주세요." aria-label="댓글" /><button type="button">등록</button></div></section>
  </main>
</template>
