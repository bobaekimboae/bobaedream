<script setup lang="ts">
// 원본: src/ChoTotFilterSheet.tsx Section (children → 기본 slot). 이름은 HTML section 과 헷갈리지 않게 FilterSection.
import type { ChoTotFilterFocus } from "@src/ChoTotFilterSheet";

defineProps<{ title: string; focus: ChoTotFilterFocus }>();
</script>
<template>
  <section class="chotot-filter-section" :data-filter-focus="focus"><h3>{{ title }}</h3><slot /></section>
</template>
