<script setup lang="ts">
// 리액트 src/prototype/quick-filter/index.tsx 의 MakerMark
import type { MakerOption } from "@proto/data";
defineProps<{ option: MakerOption }>();
</script>
<template>
  <img v-if="option.logo" class="maker-option-logo" :src="option.logo" alt="" aria-hidden="true" :draggable="false" />
  <svg v-else-if="option.icon" class="maker-option-logo" viewBox="0 0 24 24" :fill="option.color ?? `#${option.icon.hex}`" aria-hidden="true"><path :d="option.icon.path" /></svg>
</template>
