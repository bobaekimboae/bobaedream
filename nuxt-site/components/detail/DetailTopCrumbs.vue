<script setup lang="ts">
// 리액트 DetailTopCrumbs(detail/index.tsx).
import type { Car } from "@proto/data";
import { detailCrumbs } from "./detail-local";
defineProps<{ car: Car }>();
</script>
<template>
  <nav class="detail-top-crumbs" aria-label="현재 위치">
    <ol><li v-for="crumb in detailCrumbs(car)" :key="crumb">{{ crumb }}</li></ol>
  </nav>
</template>
