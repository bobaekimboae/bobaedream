<script setup lang="ts">
// 원본: src/ChoTotFilterSheet.tsx MiniHeader (onBack → emit back)
import { uiAsset } from "../../lib/chotot-filter-internal";

defineProps<{ title: string }>();
const emit = defineEmits<{ back: [] }>();
</script>
<template>
  <header class="chotot-nested-header"><button type="button" :aria-label="`${title} 화면 닫기`" @click="emit('back')"><img :src="uiAsset('notion-close.svg')" alt=""></button><h2>{{ title }}</h2></header>
</template>
