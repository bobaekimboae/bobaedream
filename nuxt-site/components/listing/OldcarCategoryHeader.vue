<script setup lang="ts">
// 리액트 src/prototype/listing/oldcar-category-header.tsx 의 OldcarCategoryHeader
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { asset } from "@proto/data";
import "@proto/listing/oldcar-category-header.css";

type OldcarHeroSlide = { id: string; year: string; model: string; src: string; shiftX: string; shiftY: string; scale: number };

// 리액트 파일 안에서만 쓰는 슬라이드 목록(export 되지 않아 복사)
const OLDCAR_HERO_SLIDES: OldcarHeroSlide[] = [
  { id: "brisa", year: "1974", model: "기아 브리사", src: asset("oldcar-header/kia-brisa-official-kv-1920x1080.webp"), shiftX: "24%", shiftY: "-4%", scale: 0.88 },
  { id: "brisa-2", year: "1977", model: "기아 브리사 Ⅱ", src: asset("oldcar-header/kia-brisa-2-official-kv-1920x1080.webp"), shiftX: "22%", shiftY: "-4%", scale: 0.9 },
  { id: "bongo-truck", year: "1980", model: "기아 봉고 트럭", src: asset("oldcar-header/kia-bongo-truck-official-kv-1920x1080.webp"), shiftX: "19%", shiftY: "-2%", scale: 0.76 },
  { id: "bongo", year: "1981", model: "기아 봉고", src: asset("oldcar-header/kia-bongo-official-kv-1920x1080.webp"), shiftX: "19%", shiftY: "-2%", scale: 0.75 },
  { id: "besta", year: "1986", model: "기아 베스타", src: asset("oldcar-header/kia-besta-official-kv-1920x1080.webp"), shiftX: "19%", shiftY: "-2%", scale: 0.75 },
  { id: "pride", year: "1987", model: "기아 프라이드", src: asset("oldcar-header/kia-pride-official-kv-1920x1080.webp"), shiftX: "24%", shiftY: "-5%", scale: 0.9 },
  { id: "concord", year: "1987", model: "기아 콩코드", src: asset("oldcar-header/kia-concord-official-kv-1920x1080.webp"), shiftX: "22%", shiftY: "-5%", scale: 0.9 },
  { id: "rocsta", year: "1990", model: "기아 록스타", src: asset("oldcar-header/kia-rocsta-official-kv-1920x1080.webp"), shiftX: "24%", shiftY: "-3%", scale: 0.84 },
  { id: "potentia", year: "1992", model: "기아 포텐샤", src: asset("oldcar-header/kia-potentia-official-kv-1920x1080.webp"), shiftX: "22%", shiftY: "-5%", scale: 0.9 },
  { id: "elan", year: "1996", model: "기아 엘란", src: asset("oldcar-header/kia-elan-official-kv-1920x1080.webp"), shiftX: "24%", shiftY: "-4%", scale: 0.98 },
];

const HERO_INTERVAL_MS = 6000;
const MAX_VISIBLE_DOTS = 5;

function getVisibleDotIndices(activeIndex: number, total: number) {
  const count = Math.min(MAX_VISIBLE_DOTS, total);
  const maxStart = Math.max(0, total - count);
  const start = Math.min(Math.max(activeIndex - Math.floor(count / 2), 0), maxStart);
  return Array.from({ length: count }, (_, index) => start + index);
}

const activeIndex = ref(0);
const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const slide = computed(() => OLDCAR_HERO_SLIDES[activeIndex.value]);
const visibleDotIndices = computed(() => getVisibleDotIndices(activeIndex.value, OLDCAR_HERO_SLIDES.length));
const total = OLDCAR_HERO_SLIDES.length;

let timer = 0;
const advance = () => { activeIndex.value = (activeIndex.value + 1) % total; };
const onVisibilityChange = () => {
  window.clearInterval(timer);
  if (!document.hidden) timer = window.setInterval(advance, HERO_INTERVAL_MS);
};
onMounted(() => {
  if (typeof window === "undefined" || reduceMotion) return;
  timer = window.setInterval(advance, HERO_INTERVAL_MS);
  document.addEventListener("visibilitychange", onVisibilityChange);
});
onBeforeUnmount(() => {
  window.clearInterval(timer);
  document.removeEventListener("visibilitychange", onVisibilityChange);
});

const dotClass = (index: number, visibleIndex: number) => {
  const isLeadingEdge = visibleIndex === 0 && index > 0;
  const isTrailingEdge = visibleIndex === visibleDotIndices.value.length - 1 && index < total - 1;
  return `${index === activeIndex.value ? "is-active" : ""} ${isLeadingEdge || isTrailingEdge ? "is-edge" : ""}`.trim();
};
</script>
<template>
  <section class="oldcar-category-hero" aria-label="보배드림 올드카 소개">
    <button class="oldcar-category-hero-hit" type="button" aria-label="다음 올드카 배너 보기" @click="advance">
      <img
        :key="slide.id"
        class="oldcar-category-hero-media"
        :src="slide.src"
        :alt="`${slide.year} ${slide.model}`"
        :style="{ transform: `translate(${slide.shiftX}, ${slide.shiftY}) scale(${slide.scale})` }"
        :draggable="false"
      />
      <span class="oldcar-category-hero-shade" aria-hidden="true" />
      <span class="oldcar-category-hero-copy">
        <strong>보배드림 올드카</strong>
        <span class="oldcar-category-hero-subtitle">올드카ㆍ클래식카 판매</span>
      </span>
    </button>
    <span class="oldcar-category-hero-model">
      <small>{{ slide.year }}</small>
      <em>{{ slide.model }}</em>
    </span>
    <div class="oldcar-category-hero-dots" role="group" :aria-label="`올드카 배너 선택, ${activeIndex + 1}/${total}`">
      <button
        v-for="(index, visibleIndex) in visibleDotIndices"
        :key="OLDCAR_HERO_SLIDES[index].id"
        type="button"
        :class="dotClass(index, visibleIndex)"
        :aria-label="`${index + 1}/${total} ${OLDCAR_HERO_SLIDES[index].year} ${OLDCAR_HERO_SLIDES[index].model} 배너`"
        :aria-current="index === activeIndex ? 'true' : undefined"
        @click="activeIndex = index"
      />
    </div>
  </section>
</template>
