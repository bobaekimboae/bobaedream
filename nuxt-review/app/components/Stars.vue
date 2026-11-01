<script setup lang="ts">
// 별점 보기(0.5 단위): 빈 별 위에 채운 별을 폭으로 겹친다. 동처띠 목록 별 14 · 상세 별 16
import { IC } from "../lib/icons";
const p = withDefaults(defineProps<{ score: number; size?: number }>(), { size: 14 });
const fill = (i: number) => Math.max(0, Math.min(1, p.score - i)) * 100;
</script>
<template>
  <span class="stars" :style="{ '--s': `${size}px` }" role="img" :aria-label="`별점 ${score.toFixed(1)}점`">
    <span v-for="i in 5" :key="i" class="stars__one">
      <i class="stars__bg" :style="{ '--src': `url('${IC.star}')` }" />
      <i class="stars__fg" :style="{ '--src': `url('${IC.star}')`, width: `${fill(i - 1)}%` }" />
    </span>
  </span>
</template>
