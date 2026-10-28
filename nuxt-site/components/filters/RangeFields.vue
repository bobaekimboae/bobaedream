<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-panels.tsx 의 RangeFields(내보내지 않은 부품). onChange → emit("change", next)
import { computed } from "vue";
import { bbmRangePresets } from "@proto/filters/bbm-filter-options";
import { setBbmRange, type BbmFilterValues, type BbmRangeKey } from "@proto/filters/bbm-filter-state";
import BbmRangeInputs from "./BbmRangeInputs.vue";

const props = defineProps<{ rangeKey: BbmRangeKey; value: BbmFilterValues; layout: "stack" | "inline" | "pair"; unit?: string }>();
const emit = defineEmits<{ change: [next: BbmFilterValues] }>();
const range = computed(() => props.value.ranges[props.rangeKey] ?? { min: "", max: "" });
// 직접 입력하면 구간 칩 선택은 풀린다
const onRange = (next: { min: string; max: string }) => emit("change", setBbmRange(props.value, props.rangeKey, { min: next.min, max: next.max }));
</script>
<template>
  <BbmRangeInputs :layout="layout" :unit="unit ?? bbmRangePresets[rangeKey]?.unit ?? ''" :min="range.min" :max="range.max" @change="onRange" />
</template>
