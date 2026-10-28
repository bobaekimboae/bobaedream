<script setup lang="ts">
// 리액트 src/prototype/quick-filter/index.tsx 의 BrandRailMark
import { computed } from "vue";
import { dongchediBrandLogo, type BrandRailOption } from "@proto/data";

const props = withDefaults(defineProps<{ option: BrandRailOption; variant?: "default" | "depth" }>(), { variant: "default" });

const depthBrandLogoOverrides: Record<string, string> = {
  벤츠: dongchediBrandLogo("benz"),
  포르쉐: dongchediBrandLogo("porsche"),
};
const wordmarkBrandNames = new Set(["아우디", "기아", "미니", "랜드로버", "렉서스"]);

const isDepth = computed(() => props.variant === "depth");
const logoClass = computed(() => `brand-logo${isDepth.value ? " is-depth" : ""}${isDepth.value && wordmarkBrandNames.has(props.option.name) ? " is-wordmark" : ""}`);
const logo = computed(() => (isDepth.value && props.option.logo ? depthBrandLogoOverrides[props.option.name] ?? props.option.logo : props.option.logo));
</script>
<template>
  <span v-if="logo" :class="logoClass"><img :class="option.full ? 'brand-full' : ''" :src="logo" alt="" aria-hidden="true" :draggable="false" /></span>
  <span v-else-if="option.icon" :class="logoClass"><svg viewBox="0 0 24 24" :fill="option.color ?? `#${option.icon.hex}`" aria-hidden="true"><path :d="option.icon.path" /></svg></span>
  <span v-else :class="logoClass"><span class="brand-logo-fallback" aria-hidden="true">{{ option.name.slice(0, 2) }}</span></span>
</template>
