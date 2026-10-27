<script setup lang="ts">
// 사진 촬영 윤곽선 안내 시안(2026-10-24). ?guide=on 에서만 보인다. slot = 촬영 항목 id. 윤곽 종류 · 안내 문구는 JSON에서 읽는다.
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import GuideShape from "./GuideShape.vue";
import { itemOf } from "../../lib/items";

const props = defineProps<{ slot: string }>();
const def = computed(() => itemOf(props.slot).guide);
/** 기울기(휴대폰 좌우 기울임, 세로로 들었을 때 gamma). 센서가 없거나 권한이 없으면 null. */
const tilt = ref<number | null>(null);
const on = (e: DeviceOrientationEvent) => {
  if (typeof e.gamma === "number") tilt.value = Math.round(e.gamma);
};
onMounted(() => window.addEventListener("deviceorientation", on));
onBeforeUnmount(() => window.removeEventListener("deviceorientation", on));
const level = computed(() => (tilt.value === null ? null : Math.abs(tilt.value) <= 3));
</script>
<template>
  <div class="shoot-guide" aria-hidden="true">
    <svg :class="`shoot-guide__shape is-${def.kind}`" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid meet" :style="def.flip ? { transform: 'scaleX(-1)' } : undefined">
      <GuideShape :kind="def.kind" />
    </svg>
    <span v-if="tilt !== null && def.kind !== 'dash' && def.kind !== 'cluster'" :class="`shoot-guide__level ${level ? 'is-ok' : ''}`">
      <i :style="{ transform: `rotate(${-tilt}deg)` }" />
      {{ level ? "수평이 맞았어요" : `${Math.abs(tilt)}° 기울었어요` }}
    </span>
    <p class="shoot-guide__hint">{{ def.hint }}</p>
  </div>
</template>
