<script setup lang="ts">
// 리액트 bbm-list.tsx 의 BbmMakerList.
// ── QF-085·086: 제조사 칩 모달·시트(원본: 검색칸 + 국산차/수입차 인기/수입차 이름순 로고 목록, 매물 수, 오른쪽 셰브론)
// renderLogo(key, label) → 이름 있는 scoped slot #logo="{ key, label }"(slot prop 이름 key 는 Vue 예약어라 rowKey 로 넘긴다). onChoose(key) → emit("choose", key)
import { ref } from "vue";
import { bbmIcon, type BbmMakerRow } from "@proto/listing/bbm-list";
import "@proto/listing/bbm-tokens.css";
import "@proto/listing/thumbnail-states.css";

withDefaults(defineProps<{ allowEmpty?: boolean; sections: Array<{ title: string; rows: BbmMakerRow[] }>; selected?: string | null }>(), { allowEmpty: false });
const emit = defineEmits<{ choose: [key: string] }>();
defineSlots<{ logo(props: { rowKey: string; label: string }): unknown }>();
const query = ref("");
const visibleRows = (rows: BbmMakerRow[]) => { const keyword = query.value.trim(); return rows.filter((row) => !keyword || row.label.includes(keyword)); };
</script>
<template>
  <div class="bbm-maker-list">
    <div class="bbm-maker-search-wrap"><label class="bbm-maker-search"><img :src="bbmIcon('m-header-search')" alt="" aria-hidden="true" /><input :value="query" placeholder="검색" aria-label="제조사 검색" @input="query = ($event.target as HTMLInputElement).value" /></label></div>
    <template v-for="section in sections" :key="section.title">
      <section v-if="visibleRows(section.rows).length" class="bbm-maker-section">
        <p class="bbm-maker-section-title">{{ section.title }}</p>
        <button v-for="row in visibleRows(section.rows)" :key="`${section.title}-${row.label}`" type="button" :class="`bbm-maker-row${selected === row.key ? ' is-selected' : ''}${row.count === 0 ? ' is-empty' : ''}`" :disabled="row.count === 0 && !allowEmpty" @click="emit('choose', row.key)">
          <span class="bbm-maker-logo"><slot name="logo" :row-key="row.key" :label="row.label" /></span>
          <span class="bbm-maker-name">{{ row.label }}</span>
          <span v-if="row.count !== null" class="bbm-maker-count">{{ row.count.toLocaleString("ko-KR") }}</span>
          <i class="bbm-maker-chevron" aria-hidden="true" />
        </button>
      </section>
    </template>
  </div>
</template>
