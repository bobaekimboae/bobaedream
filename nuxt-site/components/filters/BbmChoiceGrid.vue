<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 BbmChoiceGrid. onToggle → emit("toggle", option)
import "@proto/filters/bbm-filter-parts.css";

withDefaults(defineProps<{ options: string[]; selected: string[]; size?: "md" | "lg"; firstFull?: boolean }>(), { size: "md", firstFull: false });
const emit = defineEmits<{ toggle: [option: string] }>();
</script>
<template>
  <div :class="`bbmf-choices is-${size}${firstFull ? ' is-first-full' : ''}`">
    <button v-for="option in options" :key="option" type="button" :aria-pressed="selected.includes(option)" :class="selected.includes(option) ? 'is-selected' : ''" @click="emit('toggle', option)">{{ option }}</button>
  </div>
</template>
