<script setup lang="ts">
// 리액트 src/prototype/shared.tsx 의 Icon
import { asset } from "@proto/data";
withDefaults(defineProps<{ name: string; className?: string }>(), { className: "" });
</script>
<template>
  <img :class="`ui-icon ${className}`" :src="asset(`ui/${name}`)" alt="" aria-hidden="true" :draggable="false" />
</template>
