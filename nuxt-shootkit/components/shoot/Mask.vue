<script setup lang="ts">
// 아이콘 원본을 글자색으로 칠하는 마스크(리액트 Mask)
defineProps<{ src: string; cls?: string }>();
</script>
<template>
  <span :class="`shoot-mask ${cls ?? ''}`" :style="{ WebkitMaskImage: `url('${src}')`, maskImage: `url('${src}')` }" aria-hidden="true" />
</template>
