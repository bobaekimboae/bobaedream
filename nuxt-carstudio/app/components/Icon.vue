<script setup lang="ts">
// 원본 아이콘(SVG)을 글자색으로 칠한다(파일은 고치지 않음)
defineProps<{ src: string }>();
</script>
<template>
  <span class="ico" :style="{ '--m': `url('${src}')` }" aria-hidden="true" />
</template>
