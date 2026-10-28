<script setup lang="ts">
// 리액트 src/prototype/listing/ferrari-category-header.tsx 의 FerrariCategoryHeader
import { ref } from "vue";
import "@proto/listing/ferrari-category-header.css";

// Ferrari 공식 홈페이지의 Sports Cars 히어로 영상과 포스터.
// 원본 출처: https://www.ferrari.com/en-EN
const FERRARI_HERO_VIDEO = "https://s7mbrstream-g1.scene7.com/is/content/ferrari/_media_/13d/13d2b055-5408-40dc-b461-c1e2439868f6-stream.mp4?utm_medium=fmp4_dash";
const FERRARI_HERO_POSTER = "https://ferrari.scene7.com/is/image/ferrari/GT-Cover_Auto_Gamma-AVS?fit=constrain,1&wid=1265&hei=720";

const videoFailed = ref(false);
const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
</script>
<template>
  <section class="ferrari-category-hero" aria-label="보배드림 페라리 소개">
    <img v-if="videoFailed || reduceMotion" class="ferrari-category-hero-media" :src="FERRARI_HERO_POSTER" alt="" aria-hidden="true" :draggable="false" />
    <video
      v-else
      class="ferrari-category-hero-media"
      :src="FERRARI_HERO_VIDEO"
      :poster="FERRARI_HERO_POSTER"
      muted
      autoplay
      playsinline
      loop
      preload="metadata"
      aria-hidden="true"
      @error="videoFailed = true"
    />
    <span class="ferrari-category-hero-shade" aria-hidden="true" />
    <span class="ferrari-category-hero-copy">
      <strong>보배드림 페라리</strong>
      <span>국내 유일 페라리 쇼핑몰</span>
    </span>
  </section>
</template>
