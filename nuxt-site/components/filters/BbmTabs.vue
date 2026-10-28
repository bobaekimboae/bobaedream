<script setup lang="ts" generic="T extends string">
// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 BbmTabs. onChange → emit("change", tab)
import "@proto/filters/bbm-filter-parts.css";

withDefaults(defineProps<{ tabs: readonly T[]; value: T; label: string; variant?: "line" | "side" }>(), { variant: "line" });
const emit = defineEmits<{ change: [tab: T] }>();
</script>
<template>
  <div :class="`bbmf-tabs is-${variant}`" role="tablist" :aria-label="label">
    <button v-for="tab in tabs" :key="tab" type="button" role="tab" :aria-selected="tab === value" :class="tab === value ? 'is-selected' : ''" @click="emit('change', tab)">{{ tab }}</button>
  </div>
</template>
