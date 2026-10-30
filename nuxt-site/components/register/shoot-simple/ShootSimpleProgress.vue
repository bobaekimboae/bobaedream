<script setup lang="ts">
// 리액트 ShootSimplePrototype.tsx 안의 Progress 부품.
defineProps<{ step: number }>();
</script>
<template>
  <div class="sc-progress" :aria-label="`전체 4단계 중 ${step}단계`">
    <span :style="{ width: `${step * 25}%` }" />
  </div>
</template>
