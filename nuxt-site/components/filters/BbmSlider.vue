<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 BbmSlider. 양 끝 손잡이 + 사이 파랑 막대. from·to(0~1)
import { computed } from "vue";
import "@proto/filters/bbm-filter-parts.css";

const props = withDefaults(defineProps<{ label: string; from?: number; to?: number }>(), { from: 0, to: 1 });
// 값이 없으면 손잡이는 막대 양 끝(가운데가 끝점), 값이 있으면 원본 실측처럼 양 끝 10px 안쪽 구간에 비례해 놓는다
const unset = computed(() => props.from <= 0 && props.to >= 1);
const at = (p: number) => unset.value ? `${p * 100}%` : `calc(10px + ${p} * (100% - 20px))`;
</script>
<template>
  <div class="bbmf-slider" role="img" :aria-label="`${label} 범위 막대`">
    <em /><i :style="{ left: at(from), right: `calc(100% - ${at(to)})` }" />
    <b class="is-min" :style="{ left: `calc(${at(from)} - 12px)` }" /><b class="is-max" :style="{ left: `calc(${at(to)} - 12px)` }" />
  </div>
</template>
