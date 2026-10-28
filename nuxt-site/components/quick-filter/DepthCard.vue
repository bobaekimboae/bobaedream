<script setup lang="ts">
// 리액트 src/prototype/quick-filter/index.tsx 의 DepthCard
// image(ReactNode) → 이름 있는 slot "image", onClick → emit("click")
import { computed } from "vue";
import type { VehicleBodyFit } from "@proto/data";
import ElectricSparkIcon from "./ElectricSparkIcon.vue";

const props = withDefaults(defineProps<{ className?: string; label: string; ariaLabel?: string; sub?: string; imageFit?: VehicleBodyFit; selected?: boolean; disabled?: boolean; mediaKind?: "brand"; isEV?: boolean }>(), { imageFit: "width", selected: false, disabled: false, isEV: false });
const emit = defineEmits<{ click: [] }>();
const mediaClassName = computed(() => `depth-card-media${props.mediaKind === "brand" ? " is-brand" : ` is-fit-${props.imageFit}`}`);
</script>
<template>
  <button type="button" :class="`depth-card${selected ? ' is-selected' : ''}${className ? ` ${className}` : ''}`" :disabled="disabled" :aria-label="ariaLabel" :aria-pressed="Boolean(selected)" @click="emit('click')">
    <span v-if="isEV" class="depth-card-ev" role="img" aria-label="전기차"><ElectricSparkIcon /></span>
    <span :class="mediaClassName"><slot name="image" /></span>
    <strong class="depth-card-label">{{ label }}</strong>
    <small v-if="sub" class="depth-card-sub">{{ sub }}</small>
  </button>
</template>
