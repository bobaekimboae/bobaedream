<script setup lang="ts">
// 원본: src/ChoTotFilterSheet.tsx LabelRow (onClick → emit click)
import { uiAsset } from "../../lib/chotot-filter-internal";

defineProps<{ label: string; summary?: string }>();
const emit = defineEmits<{ click: [] }>();
</script>
<template>
  <button type="button" class="chotot-row" @click="emit('click')">
    <span>{{ label }}</span>
    <b :class="summary ? 'has-summary' : ''">{{ summary ?? "선택" }}</b>
    <img :src="uiAsset('notion-chevron-right.svg')" alt="" aria-hidden="true">
  </button>
</template>
