<script setup lang="ts">
// 댓글 한 개 + 답글 (정적 commentHtml() · replyHtml() 과 같은 DOM)
import type { DetailComment } from '~/composables/detail/types'
import { communityUrl } from '~/composables/detail/legacyAssets'

defineProps<{ comment: DetailComment }>()
const emit = defineEmits<{
  reply: [payload: { id: string; parentId: string; user: string }]
  share: [anchor: string]
  vote: [payload: { id: string; parentId: string; direction: 'up' | 'down' }]
  more: [payload: { id: string; parentId: string; owned: boolean }]
}>()

/** 정적 onerror="this.onerror=null;this.src='assets/rank-avatars/minimal/avatar-01.png'" */
function onAvatarError(event: Event) {
  const img = event.target as HTMLImageElement
  if (img.dataset.fallback) return
  img.dataset.fallback = '1'
  img.src = communityAsset('assets/rank-avatars/minimal/avatar-01.png')
}
</script>

<template>
  <li :id="String(comment.id)" class="commentItem">
    <img class="commentAvatar" :src="communityUrl(comment.avatar)" :alt="`${comment.user} 프로필`" @error="onAvatarError">
    <div class="commentContent">
      <div class="commentAuthor"><strong>{{ comment.user }} · LV {{ comment.level || 1 }}</strong><span v-if="comment.writer" class="authorBadge">작성자</span><span>{{ comment.date }}</span></div>
      <p>{{ comment.text }}</p>
      <DetailCommentTools :item="comment" label="댓글" @reply="emit('reply', $event)" @share="emit('share', $event)" @vote="emit('vote', $event)" @more="emit('more', $event)" />
      <div v-for="reply in comment.replies || []" :id="String(reply.id)" :key="String(reply.id)" class="nestedReply">
        <img class="replyAvatar" :src="communityUrl(reply.avatar)" :alt="`${reply.user} 프로필`" @error="onAvatarError">
        <div>
          <div class="replyAuthor"><strong>{{ reply.user }} · LV {{ reply.level || 1 }}</strong><span v-if="reply.writer" class="authorBadge">작성자</span><span>{{ reply.date }}</span></div>
          <p class="replyText">{{ reply.text }}</p>
          <DetailCommentTools :item="reply" label="답글" :parent-id="String(comment.id)" @reply="emit('reply', $event)" @share="emit('share', $event)" @vote="emit('vote', $event)" @more="emit('more', $event)" />
        </div>
      </div>
    </div>
  </li>
</template>
