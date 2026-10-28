<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-panels.tsx 의 RangeSlider(내보내지 않은 부품)
import { computed } from "vue";
import { bbmRangeBounds, type BbmFilterValues, type BbmRangeKey } from "@proto/filters/bbm-filter-state";
import { sliderMax } from "../../lib/filters/bbm-filter-panels";
import BbmSlider from "./BbmSlider.vue";

const props = defineProps<{ rangeKey: BbmRangeKey; value: BbmFilterValues; label: string }>();
const pos = computed(() => {
  const { min, max } = bbmRangeBounds(props.rangeKey, props.value.ranges[props.rangeKey]);
  const end = sliderMax[props.rangeKey] ?? 100;
  return { from: min === null ? 0 : Math.min(1, min / end), to: max === null ? 1 : Math.min(1, (max + 1) / end) };
});
</script>
<template>
  <BbmSlider :label="label" :from="pos.from" :to="pos.to" />
</template>
