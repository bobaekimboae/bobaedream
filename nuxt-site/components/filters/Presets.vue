<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-panels.tsx 의 Presets(내보내지 않은 부품). onChange → emit("change", next)
import { computed } from "vue";
import { bbmRangePresets } from "@proto/filters/bbm-filter-options";
import { bbmMileagePresetRange, bbmPricePresetRange, bbmYearPresetRange, setBbmRange, type BbmFilterValues, type BbmRangeKey } from "@proto/filters/bbm-filter-state";
import BbmPresetChips from "./BbmPresetChips.vue";

const props = defineProps<{ rangeKey: BbmRangeKey; value: BbmFilterValues }>();
const emit = defineEmits<{ change: [next: BbmFilterValues] }>();
const range = computed(() => props.value.ranges[props.rangeKey]);
// 구간 칩은 최저·최대 칸을 채운다(원본: 3천만원 → 3,000 ~ 3999, ~3년 → 2023년 9월 ~ 2026년 9월, 5천~1만km → 5,000 ~ 10,000). 같은 칩을 다시 누르면 해제
const pick = (preset: string) => {
  const { rangeKey, value } = props;
  if (range.value?.preset === preset) return emit("change", setBbmRange(value, rangeKey, { min: "", max: "" }));
  const filled = rangeKey === "price" ? bbmPricePresetRange(preset) : rangeKey === "year" ? bbmYearPresetRange(preset) : rangeKey === "mileage" ? bbmMileagePresetRange(preset) : { min: "", max: "", preset };
  emit("change", setBbmRange(value, rangeKey, filled));
};
</script>
<template>
  <BbmPresetChips :options="bbmRangePresets[rangeKey]?.presets ?? []" :selected="range?.preset ?? null" @pick="pick" />
</template>
