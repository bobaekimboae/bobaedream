<!-- 글 종류 고르기(동처띠 발행 화면의 글 종류 탭을 커뮤니티용으로: 일반 · 차량 리뷰 · 연비 · 전비 · 질문 · 내 차 팔기 · 구매가) -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { POST_TYPES } from '~/composables/write/postTypes'

defineProps<{ selected: string }>()
const emit = defineEmits<{ pick: [id: string], close: [] }>()
const icon = (name: string) => communityAsset(`assets/reddit-write/${name}.svg`)
function onKey(event: KeyboardEvent) { if (event.key === 'Escape') emit('close') }
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="aw-dim is-sheet" @click.self="emit('close')">
    <section class="aw-board-sheet is-type" role="dialog" aria-modal="true" aria-label="글 종류 선택">
      <header><h2>글 종류</h2><button type="button" aria-label="닫기" @click="emit('close')"><img :src="icon('icon-close-outline')" alt=""></button></header>
      <div class="aw-type-list">
        <button v-for="type in POST_TYPES" :key="type.id" type="button" :class="{ 'is-selected': selected === type.id }" :aria-pressed="selected === type.id" :data-type="type.id" @click="emit('pick', type.id)">
          <span><strong>{{ type.label }}</strong><small>{{ type.description }}</small></span>
          <img v-if="selected === type.id" :src="icon('icon-checkmark-outline')" alt="선택됨">
        </button>
      </div>
      <p class="aw-type-note">글 종류마다 필요한 칸이 본문 위에 생겨요. 글 종류와 칸은 운영에서 바꿀 수 있어요.</p>
    </section>
  </div>
</template>
