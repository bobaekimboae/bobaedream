<script setup lang="ts">
// 댓글·답글 작업 줄 (정적 commentActionsHtml() 과 같은 DOM)
import type { DetailComment } from '~/composables/detail/types'

const props = withDefaults(defineProps<{ item: DetailComment; label?: '댓글' | '답글'; parentId?: string }>(), { label: '댓글', parentId: '' })
const emit = defineEmits<{
  reply: [payload: { id: string; parentId: string; user: string }]
  share: [anchor: string]
  vote: [payload: { id: string; parentId: string; direction: 'up' | 'down' }]
  more: [payload: { id: string; parentId: string; owned: boolean }]
}>()

const ic = (path: string) => communityAsset(path)
const itemId = computed(() => String(props.item.id || props.label))
const user = computed(() => String(props.item.user || '회원'))
const likeCount = computed(() => Math.max(0, Number(props.item.like) || 0))
const dislikeCount = computed(() => Math.max(0, Number(props.item.dislike) || 0))
const viewerVote = computed(() => props.item.viewerVote || '')
</script>

<template>
  <div :class="label === '답글' ? 'nestedTools' : 'commentTools'" :aria-label="`${label} 작업`">
    <button class="commentTextButton replyButton" :data-reply-user="user" :data-reply-id="itemId" :data-parent-id="parentId" @click="emit('reply', { id: itemId, parentId: parentId || itemId, user })"><img :src="ic('assets/chzzk-detail/icons/reply-reddit.svg')" alt=""><span>답글</span></button>
    <button class="commentTextButton commentShareButton" :data-comment-share="itemId" :aria-label="`${label} 공유`" @click="emit('share', itemId)"><img :src="ic('assets/chzzk-detail/icons/share-reddit.svg')" alt=""><span>공유</span></button>
    <span class="commentVoteGroup" :aria-label="`${label} 추천 및 비추천`">
      <button class="commentVoteButton" :class="{ isActive: viewerVote === 'up' }" type="button" data-comment-vote="up" :data-comment-id="itemId" :data-parent-id="parentId" :aria-label="`${label} 추천 ${likeCount}`" :aria-pressed="viewerVote === 'up'" @click="emit('vote', { id: itemId, parentId, direction: 'up' })"><img :src="ic('assets/reactions/recommend.svg')" alt=""><span>{{ likeCount }}</span></button>
      <button class="commentVoteButton" :class="{ isActive: viewerVote === 'down' }" type="button" data-comment-vote="down" :data-comment-id="itemId" :data-parent-id="parentId" :aria-label="`${label} 비추천 ${dislikeCount}`" :aria-pressed="viewerVote === 'down'" @click="emit('vote', { id: itemId, parentId, direction: 'down' })"><img :src="ic('assets/reactions/dislike.svg')" alt=""><span>{{ dislikeCount }}</span></button>
    </span>
    <button class="commentIconButton moreCommentButton" :data-comment-id="itemId" :data-parent-id="parentId" :data-owned="String(item.own === true)" :aria-label="`${label} 더보기`" @click="emit('more', { id: itemId, parentId, owned: item.own === true })"><img :src="ic('assets/chzzk-detail/icons/more-reddit.svg')" alt=""></button>
  </div>
</template>
