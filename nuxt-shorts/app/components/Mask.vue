<!-- 한 가지 색 아이콘: 원본 SVG 를 그대로 두고 색만 글자색으로 칠한다(mask) -->
<script setup lang="ts">
defineProps<{ src: string }>();
</script>
<template>
  <span class="mask" aria-hidden="true" :style="{ maskImage: `url(${src})`, WebkitMaskImage: `url(${src})` }" />
</template>
