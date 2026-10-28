<script setup lang="ts">
// 원본: src/prototype/listing/pc-bbmuseum.tsx BbMakerGradeFilter · BbTruckFormatFilter 안의 count() 도우미(<em> 하나만 그린다)
// show=false 이거나 값이 없으면 아무것도 그리지 않는다(원본 null)
withDefaults(defineProps<{ value: number | null | undefined; show?: boolean }>(), { show: true });
</script>
<template>
  <em v-if="show && value !== null && value !== undefined" :class="value === 0 ? 'is-zero' : ''">{{ value.toLocaleString("ko-KR") }}</em>
</template>
