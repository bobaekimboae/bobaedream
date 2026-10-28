<script setup lang="ts">
// 리액트 detail/index.tsx 에서 여러 번 반복되던 `label === "제조사" ? <a className="detail-fact-link" …> : value` 를 한 곳에 모은 작은 부품(DOM 같음).
defineProps<{ label: string; value: string }>();
</script>
<template>
  <a v-if="label === '제조사'" class="detail-fact-link" :href="`?qf=guazi&maker=${encodeURIComponent(value)}`">{{ value }}</a>
  <template v-else>{{ value }}</template>
</template>
