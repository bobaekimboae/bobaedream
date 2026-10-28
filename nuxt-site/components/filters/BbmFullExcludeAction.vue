<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 BbmFullExcludeAction. onClick → emit("click")
import "@proto/filters/bbm-filter-parts.css";

const emit = defineEmits<{ click: [] }>();
</script>
<template>
  <div class="bbmf-full-action"><button type="button" class="bbmf-exclude" @click="emit('click')"><i class="bbmf-circle-icon is-minus" aria-hidden="true" />제조사·모델 제외하기</button></div>
</template>
