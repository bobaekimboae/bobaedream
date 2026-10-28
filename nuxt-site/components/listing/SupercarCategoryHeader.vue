<script setup lang="ts">
// 리액트 src/prototype/listing/supercar-category-header.tsx 의 SupercarCategoryHeader
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { asset } from "@proto/data";
import "@proto/listing/supercar-category-header.css";

type SupercarHeroSlide = { id: string; kind: "image" | "video"; src: string; poster?: string; position: string };

// 리액트 파일 안에서만 쓰는 슬라이드 목록(export 되지 않아 복사)
const SUPERCAR_HERO_SLIDES: SupercarHeroSlide[] = [
  { id: "ferrari-f80", kind: "image", src: asset("supercar-header/ferrari-f80.jpg"), position: "58% 52%" },
  { id: "enzo-ferrari", kind: "image", src: asset("supercar-header/enzo-ferrari.jpg"), position: "50% 14%" },
  { id: "lamborghini-motion", kind: "video", src: asset("supercar-header/lamborghini-official-hero.mp4"), poster: asset("supercar-header/lamborghini-official-poster.jpg"), position: "50% 50%" },
];
const HERO_INTERVAL_MS = 6000;
const total = SUPERCAR_HERO_SLIDES.length;

const activeIndex = ref(Math.floor(Math.random() * total));
const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const slide = computed(() => SUPERCAR_HERO_SLIDES[activeIndex.value]);

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
</script>
<template>
  <section class="supercar-category-hero" aria-label="보배드림 슈퍼카 소개">
    <button class="supercar-category-hero-hit" type="button" aria-label="다음 슈퍼카 배너 보기" @click="advance">
      <video
        v-if="slide.kind === 'video'"
        :key="slide.id"
        class="supercar-category-hero-media"
        :src="slide.src"
        :poster="slide.poster"
        :style="{ objectPosition: slide.position }"
        muted
        :autoplay="!reduceMotion"
        playsinline
        loop
        preload="metadata"
        aria-hidden="true"
      />
      <img
        v-else
        :key="slide.id"
        class="supercar-category-hero-media"
        :src="slide.src"
        :style="{ objectPosition: slide.position }"
        alt=""
        aria-hidden="true"
        :draggable="false"
      />
      <span class="supercar-category-hero-shade" aria-hidden="true" />
      <span class="supercar-category-hero-copy">
        <strong>보배드림 슈퍼카</strong>
        <span>국내 유일 슈퍼카 쇼핑몰</span>
      </span>
    </button>
    <div class="supercar-category-hero-dots" role="group" aria-label="슈퍼카 배너 선택">
      <button
        v-for="(item, index) in SUPERCAR_HERO_SLIDES"
        :key="item.id"
        type="button"
        :class="index === activeIndex ? 'is-active' : ''"
        :aria-label="`${index + 1}번째 배너`"
        :aria-current="index === activeIndex ? 'true' : undefined"
        @click="activeIndex = index"
      />
    </div>
  </section>
</template>
