<script setup lang="ts">
// 리액트 src/prototype/listing/bbm-brand-logos.tsx 의 TruckBrandLogo
/** 트럭·특장 전용 로고. 이처 PNG + 당근 국내 브랜드를 한 세트로 묶고 초톳형 무배경 슬롯에 배치한다. */
import { computed } from "vue";
import { asset } from "@proto/data";
import { krPlainLogoSize } from "@proto/listing/bbm-brand-logos";
import { truckBrandLogosV01 } from "@proto/listing/truck-brand-logos-v01";
import KrBrandLogo from "./KrBrandLogo.vue";
import "@proto/listing/bbm-brand-logos.css";

const props = withDefaults(defineProps<{ name: string; kind: "rail" | "list" | "plain"; initialFallback?: boolean }>(), { initialFallback: false });
const logo = computed(() => truckBrandLogosV01[props.name]);
const style = computed(() => {
  const current = logo.value;
  if (!current) return undefined;
  const wide = current.ratio >= 1.6;
  return props.kind === "plain"
    ? { ...krPlainLogoSize(current.ratio), objectFit: "contain" as const }
    : props.kind === "list"
      ? { width: wide ? "24px" : "20px", height: "20px", objectFit: "contain" as const }
      : { width: wide ? "44px" : "28px", height: "28px", objectFit: "contain" as const };
});
</script>
<template>
  <KrBrandLogo v-if="!logo" :name="name" :kind="kind" :initial-fallback="initialFallback" />
  <span v-else :class="`kr-brand-logo is-${kind} is-truck`" :data-brand="name" :data-ratio="logo.ratio" :data-logo-source="logo.source">
    <img :src="asset(`truck/brands/v01/${logo.file}`)" alt="" :draggable="false" :style="style" />
  </span>
</template>
