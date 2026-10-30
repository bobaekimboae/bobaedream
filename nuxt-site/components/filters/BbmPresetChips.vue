<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 BbmPresetChips. onPick → emit("pick", option)
import "@proto/filters/bbm-filter-parts.css";

withDefaults(defineProps<{ options: string[]; selected?: string | null; columns?: 2 | 3 }>(), { selected: undefined, columns: 2 });
const emit = defineEmits<{ pick: [option: string] }>();
</script>
<template>
  <div :class="`bbmf-presets is-col-${columns}`">
    <button v-for="option in options" :key="option" type="button" :aria-pressed="selected === option" :class="selected === option ? 'is-selected' : ''" @click="emit('pick', option)">{{ option }}</button>
  </div>
</template>
