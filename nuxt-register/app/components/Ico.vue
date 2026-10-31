<script setup lang="ts">
// 원본 아이콘 파일을 mask로 그린다(색 = currentColor)
defineProps<{ src: string }>();
</script>
<template><span class="ico" aria-hidden="true" :style="{ '--src': `url('${src}')` }" /></template>
