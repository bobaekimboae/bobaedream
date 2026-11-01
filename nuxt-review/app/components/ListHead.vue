<script setup lang="ts">
// 목록 머리(동처띠 차량 모임 머리 실측): 뒤로 · 제목 · 검색 → 탭(动态 · 问答 · ★懂车分 · 车主价 → 보배드림 「★리뷰 · 연비·전비」, 고른 탭은 흰 판이 위로 솟음)
import { nextTick, ref } from "vue";
import Ico from "./Ico.vue";
import { IC } from "../lib/icons";
import { back, go, type Board } from "../lib/route";

const p = defineProps<{ board: Board; title: string; q: string }>();
const emit = defineEmits<{ "update:q": [string] }>();
const searching = ref(Boolean(p.q));
const input = ref<HTMLInputElement | null>(null);
const openSearch = async () => { searching.value = true; await nextTick(); input.value?.focus(); };
const closeSearch = () => { searching.value = false; emit("update:q", ""); };
</script>

<template>
  <header class="lhead">
    <div class="lhead__bar">
      <button type="button" class="lhead__icon" aria-label="뒤로" @click="back"><Ico :src="IC.back" /></button>
      <h1 v-if="!searching">{{ title }}</h1>
      <label v-else class="lhead__search"><Ico :src="IC.search" /><input ref="input" :value="q" type="search" enterkeyhint="search" placeholder="모델 · 내용으로 찾기" aria-label="게시판 검색" @input="emit('update:q', ($event.target as HTMLInputElement).value)" @keydown.esc="closeSearch" /></label>
      <button v-if="!searching" type="button" class="lhead__icon" aria-label="검색" @click="openSearch"><Ico :src="IC.search" /></button>
      <button v-else type="button" class="lhead__cancel" @click="closeSearch">취소</button>
    </div>
    <nav class="btabs" aria-label="게시판">
      <button type="button" :class="{ on: board === 'review' }" :aria-current="board === 'review' ? 'page' : undefined" @click="board !== 'review' && go({ board: 'review', view: 'list' })"><Ico v-if="board === 'review'" :src="IC.star" class="btabs__star" />리뷰</button>
      <button type="button" :class="{ on: board === 'fuel' }" :aria-current="board === 'fuel' ? 'page' : undefined" @click="board !== 'fuel' && go({ board: 'fuel', view: 'list' })"><Ico v-if="board === 'fuel'" :src="IC.star" class="btabs__star" />연비·전비</button>
    </nav>
  </header>
</template>
