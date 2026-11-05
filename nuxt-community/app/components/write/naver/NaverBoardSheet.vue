<!-- 게시판 선택(네이버 카페 앱 2026-11-06 폰 확인): 아래에서 올라오는 흰 시트(위 모서리 둥금) ·
     왼쪽 굵은 「게시판 선택」 · 회색 알약 「게시판 검색」 · 게시판 줄 오른쪽 초록 동그라미(고른 게시판) -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{ groups: { section: string, items: string[] }[], selected: string }>()
const emit = defineEmits<{ pick: [name: string], close: [] }>()
const query = ref('')
const squash = (text: string) => text.replace(/\s+/g, '').toLowerCase()
const shown = computed(() => {
  const q = squash(query.value)
  return props.groups
    .map(group => ({ section: group.section, items: group.items.filter(name => !q || squash(name).includes(q)) }))
    .filter(group => group.items.length)
})
function onKey(event: KeyboardEvent) { if (event.key === 'Escape') emit('close') }
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="nwb-dim" @click.self="emit('close')">
    <section class="nwb" role="dialog" aria-modal="true" aria-labelledby="nwbTitle">
      <h2 id="nwbTitle">게시판 선택</h2>
      <label class="nwb-search">
        <img :src="communityAsset('assets/reddit-write/icon-search-outline.svg')" alt="">
        <span class="sr-only">게시판 검색</span>
        <input v-model="query" type="search" placeholder="게시판 검색" autocomplete="off" enterkeyhint="search">
      </label>
      <div class="nwb-list" role="radiogroup" aria-label="게시판">
        <template v-for="group in shown" :key="group.section">
          <h3 v-if="shown.length > 1 || groups.length > 1">{{ group.section }}</h3>
          <button v-for="name in group.items" :key="name" type="button" role="radio" :aria-checked="selected === name" :data-board="name" @click="emit('pick', name)">
            <span>{{ name }}</span><i :class="{ 'is-on': selected === name }" aria-hidden="true" />
          </button>
        </template>
        <p v-if="!shown.length" class="nwb-empty">‘{{ query }}’ 게시판이 없어요.</p>
      </div>
    </section>
  </div>
</template>
