<script setup lang="ts">
// 리액트 src/prototype/listing/stable-top.tsx 의 StableYearRow. onChange → emit("change", next)
// ④ 연식 알약 줄: 2026 · 2025 · … · 2019 · 이전. 누르면 바로 적용([2023년 ×]), 다른 연식은 바꿈, 다시 누르면 해제(줄은 그대로). 값은 개발 시안형 필터 "연식"
import { computed } from "vue";
import { setBbmRange, type BbmFilterValues } from "@proto/filters/bbm-filter-state";
import { STABLE_YEAR_OPTIONS, stableYearSelected } from "@proto/listing/stable-top";
import PillRow from "./PillRow.vue";

const props = defineProps<{ value: BbmFilterValues }>();
const emit = defineEmits<{ change: [next: BbmFilterValues] }>();
const yearRange = (option: string) => (option === "이전" ? { min: "", max: "2018", preset: "이전" } : { min: option, max: option });
const selected = computed(() => stableYearSelected(props.value));
const pick = (option: string) => {
  const on = selected.value === option;
  emit("change", setBbmRange(props.value, "year", on ? { min: "", max: "" } : yearRange(option)));
};
</script>
<template>
  <section class="depth-rail is-trim-row is-year-row no-label" aria-label="연식 빠른 선택">
    <PillRow label="" class-name="stable-year-pills">
      <button v-for="option in STABLE_YEAR_OPTIONS" :key="option" type="button" :class="`stable-pill${selected === option ? ' is-selected' : ''}`" :aria-pressed="selected === option" @click="pick(option)">{{ option }}</button>
    </PillRow>
  </section>
</template>
