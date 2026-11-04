<script setup lang="ts">
// 인스타그램 · 유튜브 같은 재생형 임베드 미리보기. 임베드 모양 · 재생 바꿔치기는 공용 라이브러리 community-embed.js(window.BBM_EMBED)가 맡는다
// (글쓰기 · 상세와 같은 파일을 쓰도록 이 화면에서는 다시 만들지 않는다).
import { legacy, type ListEmbed } from '~/composables/list/listData'

const props = defineProps<{ item: ListEmbed; autoplay?: boolean }>()
const root = ref<HTMLElement | null>(null)
const html = computed(() => {
  const api = legacy.embed()
  if (!api) return ''
  return props.autoplay ? api.frameHtml(props.item, { autoplay: true }) : api.previewHtml(props.item)
})
onMounted(() => { const api = legacy.embed(); if (api?.hydratePreviews && root.value) api.hydratePreviews(root.value) })
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div ref="root" :class="['naverDiscussionEmbed', { 'is-tall': item.tall }]" v-html="html" />
</template>
