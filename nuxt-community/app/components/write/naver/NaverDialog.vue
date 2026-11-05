<!-- 네이버 카페 앱 가운데 안내 창(2026-11-06 폰 확인).
     임시저장: 왼쪽 위 × · 굵은 제목 · 설명 두 줄 · 위아래로 쌓인 단추(연초록 「임시등록」 · 회색 「이 기기에 임시보관」)
     나가기: 가운데 정렬 글 · 가로로 놓인 단추(회색 「글쓰기 취소」 · 연초록 「이 기기에 임시보관」) -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Action { label: string, tone: 'green' | 'gray', run: () => void }
const props = withDefaults(defineProps<{ title?: string, lines: string[], actions: Action[], layout?: 'stack' | 'row', closable?: boolean }>(), { title: '', layout: 'row', closable: false })
const emit = defineEmits<{ close: [] }>()
const box = ref<HTMLElement | null>(null)
function onKey(event: KeyboardEvent) { if (event.key === 'Escape') emit('close') }
onMounted(() => { document.addEventListener('keydown', onKey); box.value?.querySelector<HTMLButtonElement>('.nwd-actions button')?.focus({ preventScroll: true }) })
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
void props
</script>

<template>
  <div class="nwd-dim" @click.self="emit('close')">
    <section ref="box" class="nwd" :class="`is-${layout}`" role="alertdialog" aria-modal="true" :aria-label="title || lines[0]">
      <button v-if="closable" class="nwd-close" type="button" aria-label="닫기" @click="emit('close')"><img :src="communityAsset('assets/reddit-write/icon-close-outline.svg')" alt=""></button>
      <h2 v-if="title">{{ title }}</h2>
      <p v-for="line in lines" :key="line">{{ line }}</p>
      <div class="nwd-actions">
        <button v-for="action in actions" :key="action.label" type="button" :class="`is-${action.tone}`" @click="action.run">{{ action.label }}</button>
      </div>
    </section>
  </div>
</template>
