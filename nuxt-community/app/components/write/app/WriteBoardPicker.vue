<!-- 게시판 선택(치지직 앱: 화면 위쪽까지 올라오는 시트, 가운데 제목 · 오른쪽 닫기, 묶음 제목 아래 게시판 줄) -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

defineProps<{ groups: { section: string, items: string[] }[], selected: string }>()
const emit = defineEmits<{ pick: [name: string], close: [] }>()
const icon = (name: string) => communityAsset(`assets/reddit-write/${name}.svg`)
function onKey(event: KeyboardEvent) { if (event.key === 'Escape') emit('close') }
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="aw-dim is-sheet" @click.self="emit('close')">
    <section class="aw-board-sheet" role="dialog" aria-modal="true" aria-label="게시판 선택">
      <header><h2>게시판 선택</h2><button type="button" aria-label="닫기" @click="emit('close')"><img :src="icon('icon-close-outline')" alt=""></button></header>
      <div class="aw-board-list">
        <template v-for="group in groups" :key="group.section">
          <h3>{{ group.section }}</h3>
          <button v-for="name in group.items" :key="name" type="button" :class="{ 'is-selected': selected === name }" :aria-pressed="selected === name" :data-board="name" @click="emit('pick', name)">
            <img :src="icon('icon-communities-outline')" alt=""><span>{{ name }}</span>
          </button>
        </template>
      </div>
    </section>
  </div>
</template>
