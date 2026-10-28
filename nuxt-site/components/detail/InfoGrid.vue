<script setup lang="ts">
// 리액트 InfoGrid(detail/index.tsx).
defineProps<{ items: string[][] }>();
</script>
<template>
  <dl class="detail-info-grid"><div v-for="[label, value] in items" :key="label"><dt>{{ label }}</dt><dd>{{ value }}</dd></div></dl>
</template>
