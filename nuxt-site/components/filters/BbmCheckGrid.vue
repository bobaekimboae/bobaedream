<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 BbmCheckGrid. children → 기본 slot
import "@proto/filters/bbm-filter-parts.css";

withDefaults(defineProps<{ columns?: 1 | 2; label?: string }>(), { columns: 1 });
</script>
<template>
  <div :class="`bbmf-check-grid is-col-${columns}`" role="group" :aria-label="label"><slot /></div>
</template>
