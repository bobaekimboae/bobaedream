<script setup lang="ts">
// 리액트 src/prototype/listing/deutsch-autoworld-header.tsx 의 DeutschAutoworldHeader
import { asset } from "@proto/data";
import "@proto/listing/seoul-auto-gallery-header.css";
</script>
<template>
  <section class="sag-category-hero sag-category-hero--deutsch" aria-label="도이치오토월드 안내">
    <img class="sag-category-hero__building" :src="asset('deutsch-autoworld/header/building-bluehour-v01.png')" alt="" aria-hidden="true" :draggable="false" />
    <div class="sag-category-hero__shade" aria-hidden="true" />
    <div class="sag-category-hero__content">
      <div class="sag-category-hero__copy">
        <h1>도이치오토월드</h1>
        <p>수입차 전문 매매단지</p>
      </div>
    </div>
  </section>
</template>
