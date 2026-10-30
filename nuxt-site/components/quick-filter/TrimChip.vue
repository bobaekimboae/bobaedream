<script setup lang="ts">
// 리액트 src/prototype/quick-filter/index.tsx 의 TrimChip. onClick → emit("click")
withDefaults(defineProps<{ label: string; selected?: boolean; disabled?: boolean }>(), { selected: false, disabled: false });
const emit = defineEmits<{ click: [] }>();
</script>
<template>
  <button type="button" :class="`trim-chip${selected ? ' is-selected' : ''}`" :disabled="disabled" :aria-pressed="Boolean(selected)" @click="emit('click')">{{ label }}</button>
</template>
