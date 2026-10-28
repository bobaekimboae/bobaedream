<script setup lang="ts">
// 리액트 bbm-list.tsx 의 BbmModelList. ── "모델" 칩 모달·시트: 그 제조사의 모델 목록. 고르면 퀵필터 모델 선택과 같은 동작
// onChoose(name) → emit("choose", name)
import { computed, ref } from "vue";
import { bbmIcon } from "@proto/listing/bbm-list";
import "@proto/listing/bbm-tokens.css";
import "@proto/listing/thumbnail-states.css";

const props = defineProps<{ rows: Array<{ name: string; label: string; count: number | null }>; selected?: string | null }>();
const emit = defineEmits<{ choose: [name: string] }>();
const query = ref("");
const visibleRows = computed(() => {
  const keyword = query.value.trim().toLocaleLowerCase("ko-KR");
  return props.rows.filter((row) => !keyword || `${row.label} ${row.name}`.toLocaleLowerCase("ko-KR").includes(keyword));
});
const availableCount = computed(() => props.rows.filter((row) => (row.count ?? 0) > 0).length);
</script>
<template>
  <p v-if="!rows.length" class="bbm-maker-empty">모델 정보 없음</p>
  <div v-else class="bbm-maker-list is-model-list">
    <div class="bbm-maker-search-wrap"><label class="bbm-maker-search"><img :src="bbmIcon('m-header-search')" alt="" aria-hidden="true" /><input :value="query" placeholder="모델 검색" aria-label="모델 검색" @input="query = ($event.target as HTMLInputElement).value" /></label></div>
    <p class="bbm-model-summary">전체 {{ rows.length.toLocaleString("ko-KR") }}개 · 현재 매물 {{ availableCount.toLocaleString("ko-KR") }}개 모델</p>
    <button v-for="row in visibleRows" :key="row.name" type="button" :class="`bbm-maker-row is-model${selected === row.name ? ' is-selected' : ''}${row.count === 0 ? ' is-empty' : ''}`" :disabled="row.count === 0" @click="emit('choose', row.name)">
      <i class="bbm-model-check" aria-hidden="true" />
      <span class="bbm-maker-name">{{ row.label }}</span>
      <span v-if="row.count !== null" class="bbm-maker-count">{{ row.count.toLocaleString("ko-KR") }}</span>
    </button>
    <p v-if="!visibleRows.length" class="bbm-maker-empty">검색 결과가 없습니다.</p>
  </div>
</template>
