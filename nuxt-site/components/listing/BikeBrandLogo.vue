<script setup lang="ts">
// 리액트 src/prototype/listing/bbm-brand-logos.tsx 의 BikeBrandLogo
/** 바이크 카테고리 전용 로고. 승용 로고와 경로를 분리하고 같은 슬롯 크기 규칙을 쓴다. */
import { computed } from "vue";
import { asset } from "@proto/data";
import { chototRailLogoSize, krListLogoSize } from "@proto/listing/bbm-brand-logos";
import { selectedBikeBrandLogo } from "@proto/listing/brand-logos-bike-motofan-v01";
import KrBrandLogo from "./KrBrandLogo.vue";
import "@proto/listing/bbm-brand-logos.css";

const props = withDefaults(defineProps<{ name: string; kind: "rail" | "list" | "plain"; initialFallback?: boolean }>(), { initialFallback: false });
const px = (value: number) => `${Math.round(value * 100) / 100}px`;
const selected = computed(() => selectedBikeBrandLogo(props.name));
const size = computed(() => {
  const current = selected.value;
  if (!current) return null;
  if (props.kind === "list") { const value = krListLogoSize(current.logo.ratio); return { width: px(value.width), height: px(value.height) }; }
  return chototRailLogoSize(current.logo.ratio);
});
</script>
<template>
  <KrBrandLogo v-if="!selected" :name="name" :kind="kind" :initial-fallback="initialFallback" />
  <span v-else :class="`kr-brand-logo is-${kind} is-bike`" :data-brand="name" :data-ratio="selected.logo.ratio" :data-logo-set="selected.set" :data-logo-source="selected.logo.source">
    <img :src="asset(`bike/logos/${selected.directory}/${selected.logo.file}`)" alt="" :draggable="false" :style="size ?? undefined" />
  </span>
</template>
