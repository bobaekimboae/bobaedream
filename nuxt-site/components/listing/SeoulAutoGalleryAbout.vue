<script setup lang="ts">
// 리액트 seoul-auto-gallery-directory.tsx 의 SeoulAutoGalleryAbout. onBrowse → emit("browse").
import SagGoogleMap from "./SagGoogleMap.vue";
import "@proto/listing/seoul-auto-gallery-directory.css";
import "@proto/listing/seoul-auto-gallery-dealer-rail.css";

const emit = defineEmits<{ browse: [] }>();
</script>
<template>
  <section class="sag-about" aria-labelledby="sag-about-title">
    <div class="sag-about__lead">
      <p>SEOUL AUTO GALLERY</p>
      <h2 id="sag-about-title">서울오토갤러리</h2>
      <strong>대한민국 수입차의 메카,<br />매일이 모터쇼인 전문 매매단지</strong>
    </div>
    <dl class="sag-about__facts">
      <div><dt>판매 차량</dt><dd>검증된 수입차 매물</dd></div>
      <div><dt>상사</dt><dd>단지 내 상사별 매물</dd></div>
      <div><dt>딜러</dt><dd>딜러별 보유 매물</dd></div>
    </dl>
    <button type="button" class="sag-about__browse" @click="emit('browse')">판매 차량 보기</button>
    <SagGoogleMap />
  </section>
</template>
