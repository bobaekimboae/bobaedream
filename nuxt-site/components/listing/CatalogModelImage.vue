<script setup lang="ts">
// 리액트 src/prototype/listing/model-catalog-kr.tsx 의 CatalogModelImage
/** 세부 모델 카드 이미지 칸: 이미지가 없으면 점선 빈 칸 */
import "@proto/listing/model-catalog-kr.css";
import "@proto/listing/qf-plain.css";
import "@proto/listing/qf-trim.css";
import "@proto/listing/qf-rail-vertical.css";
import "@proto/listing/qf-model-images.css";
defineProps<{ src?: string }>();
</script>
<template>
  <img v-if="src" :src="src" alt="" aria-hidden="true" :draggable="false" />
  <span v-else class="kr-model-empty" aria-hidden="true" />
</template>
