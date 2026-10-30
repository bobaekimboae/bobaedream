<script setup lang="ts">
// 리액트 src/prototype/listing/deutsch-autoworld-header.tsx 의 SkV1MotorsHeader
// SK V1 모터스 단지 머리(2026-10-21 「조이모터스 … 단지도 새로 입력하고」): 도이치오토월드 머리와 같은 칸에 대표 상사 바로가기를 붙인다.
import "@proto/listing/seoul-auto-gallery-header.css";
defineProps<{ cover?: string; shopCount: number }>();
const href = `${window.location.pathname}?qf=guazi&profile=dealer&shop=joy&emp=1`;
</script>
<template>
  <section class="sag-category-hero sag-category-hero--deutsch sag-category-hero--skv1" aria-label="SK V1 모터스 안내">
    <img v-if="cover" class="sag-category-hero__building" :src="cover" alt="" aria-hidden="true" :draggable="false" />
    <div class="sag-category-hero__shade" aria-hidden="true" />
    <div class="sag-category-hero__content">
      <div class="sag-category-hero__copy">
        <h1>SK V1 모터스</h1>
        <p>경기 수원시 권선구 수입차 매매단지</p>
      </div>
      <a class="sag-category-hero__shop" :href="href">e-조이모터스 <span>매물 {{ shopCount.toLocaleString("ko-KR") }}대</span> ›</a>
    </div>
  </section>
</template>
