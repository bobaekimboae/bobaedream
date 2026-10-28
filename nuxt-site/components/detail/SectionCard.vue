<script setup lang="ts">
// 리액트 SectionCard(detail/index.tsx). children → 기본 slot, action(ReactNode) → slot "action".
withDefaults(defineProps<{ title: string; className?: string }>(), { className: "" });
</script>
<template>
  <section :class="`detail-card ${className}`">
    <div class="detail-section-heading"><h2>{{ title }}</h2><slot name="action" /></div>
    <slot />
  </section>
</template>
