<script setup lang="ts">
// 리액트 src/prototype/listing/stable-top.tsx 의 PillRow(파일 안에서만 쓰는 부품). children → 기본 slot
/** 알약 줄: 이름표 + 가로 스크롤(스크롤바 숨김) + 넘치면 › 화살표. 높이 32 */
import { onBeforeUnmount, onMounted, ref } from "vue";
import { bbmIcon } from "@proto/listing/bbm-list";
import "@proto/listing/stable-top.css";
import "@proto/listing/qf-align.css";

defineProps<{ label: string; className?: string }>();
const scroller = ref<HTMLDivElement | null>(null);
const edges = ref({ prev: false, next: false });
let cleanup: (() => void) | null = null;
onMounted(() => {
  const element = scroller.value;
  if (!element) return;
  const update = () => { edges.value = { prev: element.scrollLeft > 1, next: element.scrollLeft + element.clientWidth < element.scrollWidth - 1 }; };
  update();
  element.addEventListener("scroll", update, { passive: true });
  const observer = new ResizeObserver(update);
  observer.observe(element);
  if (element.firstElementChild) observer.observe(element.firstElementChild);
  cleanup = () => { element.removeEventListener("scroll", update); observer.disconnect(); };
});
onBeforeUnmount(() => cleanup?.());
const move = (direction: 1 | -1) => scroller.value?.scrollBy({ left: direction * Math.max(80, (scroller.value?.clientWidth ?? 200) - 80), behavior: "smooth" });
</script>
<template>
  <div :class="`stable-pill-row${className ? ` ${className}` : ''}`">
    <span v-if="label" class="stable-pill-label">{{ label }}</span>
    <div class="stable-pill-scroll">
      <div ref="scroller" class="stable-pill-track-wrap">
        <div class="stable-pill-track"><slot /></div>
      </div>
      <button v-if="edges.prev" type="button" class="stable-pill-arrow is-prev" aria-label="이전" @click="move(-1)"><img :src="bbmIcon('filter-chevron')" alt="" aria-hidden="true" /></button>
      <button v-if="edges.next" type="button" class="stable-pill-arrow is-next" aria-label="다음" @click="move(1)"><img :src="bbmIcon('filter-chevron')" alt="" aria-hidden="true" /></button>
    </div>
  </div>
</template>
