<script setup lang="ts">
// 리액트 src/prototype/heavy/index.tsx 의 HeavySlotImage(내보내지 않은 부품). 후보 이미지를 차례로 시도하고 모두 실패하면 글자 표시
import { computed, ref } from "vue";
import { asset } from "@proto/data";
import type { HeavyImageCandidate } from "@proto/heavy/manifest";

const props = defineProps<{ candidates: readonly HeavyImageCandidate[]; alt: string }>();
// 원본 heavyAsset(`${BASE_URL}assets/heavy/${file}`)과 같은 주소(asset 은 같은 BASE_URL + assets/ 를 붙인다)
const heavyAsset = (fileName: string) => asset(`heavy/${fileName}`);
const index = ref(0);
const failed = ref(false);
const current = computed(() => props.candidates[index.value]);
const onError = () => { if (index.value + 1 < props.candidates.length) index.value += 1; else failed.value = true; };
</script>
<template>
  <span v-if="!current || failed" class="heavy-qf-text-mark" :aria-label="alt">{{ alt.slice(0, 3) }}</span>
  <img v-else :src="heavyAsset(current.file)" :alt="alt" :draggable="false" :data-fallback-level="current.fallbackLevel" @error="onError">
</template>
