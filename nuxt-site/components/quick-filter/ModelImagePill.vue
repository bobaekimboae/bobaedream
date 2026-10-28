<script setup lang="ts">
// 리액트 src/prototype/quick-filter/index.tsx 의 ModelImagePill
// image(ReactNode) → slot "image", onClick → emit("click")
withDefaults(defineProps<{ label: string; selected?: boolean; disabled?: boolean; variant?: "model" | "brand"; className?: string }>(), { selected: false, disabled: false, variant: "model" });
const emit = defineEmits<{ click: [] }>();
</script>
<template>
  <button type="button" :class="`model-image-pill is-${variant}${selected ? ' is-selected' : ''}${className ? ` ${className}` : ''}`" :disabled="disabled" :aria-pressed="Boolean(selected)" @click="emit('click')">
    <span class="model-image-pill__media"><slot name="image" /></span>
    <strong class="model-image-pill__label">{{ label }}</strong>
  </button>
</template>
