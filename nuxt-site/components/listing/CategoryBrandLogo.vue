<script setup lang="ts">
// 리액트 src/prototype/listing/bbm-brand-logos.tsx 의 CategoryBrandLogo
import BikeBrandLogo from "./BikeBrandLogo.vue";
import TruckBrandLogo from "./TruckBrandLogo.vue";
import KrBrandLogo from "./KrBrandLogo.vue";

withDefaults(defineProps<{ category?: string; name: string; kind: "rail" | "list" | "plain"; initialFallback?: boolean }>(), { initialFallback: false });
</script>
<template>
  <BikeBrandLogo v-if="category === '바이크'" :name="name" :kind="kind" :initial-fallback="initialFallback" />
  <TruckBrandLogo v-else-if="category === '트럭 · 특장'" :name="name" :kind="kind" :initial-fallback="initialFallback" />
  <KrBrandLogo v-else :name="name" :kind="kind" :initial-fallback="initialFallback" />
</template>
