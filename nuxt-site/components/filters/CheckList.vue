<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-panels.tsx 의 CheckList(내보내지 않은 부품). onChange → emit("change", next)
import { bbmCheckOptions } from "@proto/filters/bbm-filter-options";
import { toggleBbmCheck, type BbmCheckKey, type BbmFilterValues } from "@proto/filters/bbm-filter-state";
import { bodyTypeIcons, optionCount, type CountOf } from "../../lib/filters/bbm-filter-panels";
import BbmCheckGrid from "./BbmCheckGrid.vue";
import BbmCheckRow from "./BbmCheckRow.vue";

withDefaults(defineProps<{ checkKey: BbmCheckKey; value: BbmFilterValues; countOf?: CountOf; size?: "modal" | "sidebar"; columns?: 1 | 2 }>(), { size: "modal", columns: 1, countOf: undefined });
const emit = defineEmits<{ change: [next: BbmFilterValues] }>();
</script>
<template>
  <BbmCheckGrid :columns="columns" :label="checkKey">
    <BbmCheckRow v-for="option in bbmCheckOptions[checkKey]" :key="option" :size="size" :label="option" :count="optionCount(countOf, checkKey, option)" :checked="Boolean(value.checks[checkKey]?.includes(option))" :leading-icon="checkKey === 'bodyType' ? bodyTypeIcons[option] : undefined" @toggle="emit('change', toggleBbmCheck(value, checkKey, option))" />
  </BbmCheckGrid>
</template>
