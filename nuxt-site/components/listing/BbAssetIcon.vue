<script setup lang="ts">
// 원본: src/prototype/listing/pc-bbmuseum.tsx BbAssetIcon
import { asset } from "@proto/data";

defineProps<{ name: "circle-check" | "circle-check-off" | "circle-close"; size: 20 | 24 }>();
</script>
<template>
  <img class="bb-asset-icon" :src="asset(`icons/bb/${name}.svg`)" :width="size" :height="size" alt="" aria-hidden="true" :draggable="false">
</template>
