<script setup lang="ts">
// 리액트 src/prototype/listing/bbm-top-chotot.tsx 의 BbmChipScroller. children → 기본 slot
// 3줄 칩 줄의 가로 스크롤(초톳 WrapperScrollV2): 넘치면 양옆 화살표 28, 누르면 한 화면 폭만큼 이동
import { onBeforeUnmount, onMounted, ref } from "vue";
import { bbmIcon } from "@proto/listing/bbm-list";
import "@proto/listing/bbm-top-chotot.css";

const scrollerRef = ref<HTMLDivElement | null>(null);
const edges = ref({ prev: false, next: false });
let cleanup: (() => void) | null = null;
onMounted(() => {
  const scroller = scrollerRef.value;
  if (!scroller) return;
  const update = () => { edges.value = { prev: scroller.scrollLeft > 1, next: scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1 }; };
  update();
  scroller.addEventListener("scroll", update, { passive: true });
  const observer = new ResizeObserver(update);
  observer.observe(scroller);
  if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);
  cleanup = () => { scroller.removeEventListener("scroll", update); observer.disconnect(); };
});
onBeforeUnmount(() => cleanup?.());
const move = (direction: 1 | -1) => { const scroller = scrollerRef.value; scroller?.scrollBy({ left: direction * (scroller.clientWidth - 80), behavior: "smooth" }); };
</script>
<template>
  <div class="bbm-ct-chip-scroll">
    <div ref="scrollerRef" class="bbm-ct-chip-track-wrap">
      <div class="bbm-ct-chip-track"><slot /></div>
    </div>
    <button v-if="edges.prev" type="button" class="bbm-ct-chip-arrow is-prev" aria-label="이전 칩" @click="move(-1)"><img :src="bbmIcon('filter-chevron')" alt="" aria-hidden="true" /></button>
    <button v-if="edges.next" type="button" class="bbm-ct-chip-arrow is-next" aria-label="다음 칩" @click="move(1)"><img :src="bbmIcon('filter-chevron')" alt="" aria-hidden="true" /></button>
  </div>
</template>
