<script setup lang="ts">
// vehicle-review-board.js stars(score, sizeClass)
import { boardSrc } from '~/composables/boards/boardUtil'
import { vrbStarEmpty, vrbStarFilled } from '~/composables/boards/vehicleReview'

const props = defineProps<{ score: number; size?: string }>()
const fills = computed(() => [0, 1, 2, 3, 4].map(i => Math.max(0, Math.min(1, props.score - i)) * 100 + '%'))
</script>

<template>
  <span :class="'vrb-stars ' + (size || '')" :aria-label="'평점 ' + score.toFixed(1) + '점'"><span v-for="(w, i) in fills" :key="i" class="vrb-star"><img class="is-empty" :src="boardSrc(vrbStarEmpty)" alt=""><i :style="'width:' + w"><img class="is-filled" :src="boardSrc(vrbStarFilled)" alt=""></i></span></span>
</template>
