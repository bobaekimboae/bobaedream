<!-- 게시판 선택 시트 본문. 원본: public/community/chzzk-write.js renderBoardSheet -->
<script setup lang="ts">
defineProps<{ groups: { section: string, items: string[] }[], selected: string }>()
const emit = defineEmits<{ pick: [name: string] }>()
const icon = communityAsset('assets/reddit-ui/icon-communities-outline.svg')
</script>

<template>
  <template v-for="group in groups" :key="group.section">
    <h3 class="sheet-section-title">{{ group.section }}</h3>
    <button v-for="name in group.items" :key="name" class="board-option" :class="{ 'is-selected': selected === name }" type="button" :data-board="name" @click="emit('pick', name)"><img :src="icon" alt=""><span>{{ name }}</span></button>
  </template>
</template>
