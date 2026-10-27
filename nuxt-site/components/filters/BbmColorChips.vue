<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 BbmColorChips. onToggle → emit("toggle", option)
import "@proto/filters/bbm-filter-parts.css";

defineProps<{ options: string[]; selected: string[]; swatches?: Record<string, string> }>();
const emit = defineEmits<{ toggle: [option: string] }>();
</script>
<template>
  <div class="bbmf-color-chips">
    <button v-for="option in options" :key="option" type="button" :aria-pressed="selected.includes(option)" :class="selected.includes(option) ? 'is-selected' : ''" @click="emit('toggle', option)">
      <i v-if="swatches?.[option]" class="bbmf-swatch" :style="{ background: swatches[option] }" aria-hidden="true" />
      <span>{{ option }}</span>
    </button>
  </div>
</template>
