<script setup lang="ts">
// 리액트 src/prototype/quick-filter/index.tsx 의 DepthTextChip. onClick → emit("click")
withDefaults(defineProps<{ label: string; sub?: string; title?: boolean }>(), { title: false });
const emit = defineEmits<{ click: [] }>();
</script>
<template>
  <button type="button" :class="`depth-text-chip${title ? ' is-title' : ''}`" :aria-label="(sub ? `${label}, ${sub}` : label).replace('\n', ' ')" @click="emit('click')">
    <strong>{{ label }}</strong>
    <small v-if="sub">{{ sub }}</small>
  </button>
</template>
