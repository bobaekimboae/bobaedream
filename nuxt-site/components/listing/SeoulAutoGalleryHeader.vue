<script setup lang="ts">
// 리액트 src/prototype/listing/seoul-auto-gallery-header.tsx 의 SeoulAutoGalleryHeader
import { asset } from "@proto/data";
import "@proto/listing/seoul-auto-gallery-header.css";
</script>
<template>
  <section class="sag-category-hero" aria-label="서울오토갤러리 안내">
    <img class="sag-category-hero__building" :src="asset('seoul-auto-gallery/header/building-bluehour-v01.png')" alt="" aria-hidden="true" :draggable="false" />
    <div class="sag-category-hero__shade" aria-hidden="true" />
    <div class="sag-category-hero__content">
      <img class="sag-category-hero__mark" :src="asset('seoul-auto-gallery/header/sag-mark-banner-v02.png')" alt="" aria-hidden="true" :draggable="false" />
      <div class="sag-category-hero__copy">
        <h1>서울오토갤러리</h1>
        <p>수입차 전문 매매단지</p>
      </div>
    </div>
  </section>
</template>
