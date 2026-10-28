<script setup lang="ts">
// 리액트 src/prototype/listing/quick-rail-carousel.tsx 의 QuickRailCarousel. children → 기본 slot
/** 퀵필터 전용 가로 레일. 실제로 넘칠 때만 초톳 원본 이전·다음 버튼을 표시한다. */
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { asset } from "@proto/data";
// 의존: 모바일 묶음 담당(src/mobile/Carousel.tsx → Carousel.vue, props ariaLabel · className · contentClassName)
import Carousel from "../mobile/Carousel.vue";

const props = defineProps<{ ariaLabel: string; className?: string; contentClassName?: string }>();
const shellRef = ref<HTMLDivElement | null>(null);
const edges = ref({ previous: false, next: false });
const findScroller = () => shellRef.value?.querySelector<HTMLElement>(":scope > .mobile-carousel") ?? null;

let cleanup: (() => void) | null = null;
const bind = () => {
  cleanup?.();
  cleanup = null;
  const scroller = findScroller();
  if (!scroller) return;
  const update = () => {
    const maximum = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    edges.value = { previous: scroller.scrollLeft > 1, next: scroller.scrollLeft < maximum - 1 };
  };
  scroller.scrollLeft = 0;
  update();
  scroller.addEventListener("scroll", update, { passive: true });
  const observer = new ResizeObserver(update);
  observer.observe(scroller);
  if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);
  cleanup = () => { scroller.removeEventListener("scroll", update); observer.disconnect(); };
};
// 리액트 useEffect(…, [ariaLabel]) 와 같이 처음 그린 뒤와 ariaLabel 이 바뀐 뒤 다시 건다
onMounted(bind);
watch(() => props.ariaLabel, bind, { flush: "post" });
onBeforeUnmount(() => cleanup?.());

const move = (direction: -1 | 1) => {
  const scroller = findScroller();
  if (!scroller) return;
  scroller.scrollBy({ left: direction * Math.max(80, scroller.clientWidth - 80), behavior: "smooth" });
};
</script>
<template>
  <div ref="shellRef" class="quick-rail-carousel">
    <Carousel :aria-label="ariaLabel" :class-name="className" :content-class-name="contentClassName"><slot /></Carousel>
    <button v-if="edges.previous" type="button" class="quick-rail-nav is-previous" :aria-label="`${ariaLabel} 이전`" @click="move(-1)"><img :src="asset('bbm/quick-filter-prev.svg')" alt="" aria-hidden="true" /></button>
    <button v-if="edges.next" type="button" class="quick-rail-nav is-next" :aria-label="`${ariaLabel} 다음`" @click="move(1)"><img :src="asset('bbm/quick-filter-next.svg')" alt="" aria-hidden="true" /></button>
  </div>
</template>
