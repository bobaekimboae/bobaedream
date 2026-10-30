<script setup lang="ts">
// 리액트 deutsch-autoworld-directory.tsx 의 DeutschAutoworldAbout. onBrowse → emit("browse").
import { deutschAutoworldCars } from "@proto/data";
import { allDeutschDealers, DEUTSCH_MAIN_ADDRESS } from "@proto/listing/deutsch-autoworld-directory";
import SagGoogleMap from "./SagGoogleMap.vue";
import { dawCompanies as companies } from "./deutsch-autoworld-local";
import "@proto/listing/seoul-auto-gallery-dealer-rail.css";
import "@proto/listing/seoul-auto-gallery-directory.css";
import "@proto/listing/deutsch-autoworld-directory.css";

const emit = defineEmits<{ browse: [] }>();
</script>
<template>
  <section class="sag-about" aria-labelledby="daw-about-title">
    <div class="sag-about__lead">
      <p>DEUTSCH AUTOWORLD</p>
      <h2 id="daw-about-title">도이치오토월드</h2>
      <strong>수원 권선구 고색동,<br />수입차 · 국산차 중고차 매매단지</strong>
    </div>
    <dl class="sag-about__facts">
      <div><dt>판매 차량</dt><dd>{{ deutschAutoworldCars.length.toLocaleString("ko-KR") }}대</dd></div>
      <div><dt>상사</dt><dd>{{ companies.length }}곳</dd></div>
      <div><dt>딜러</dt><dd>{{ allDeutschDealers.length.toLocaleString("ko-KR") }}명</dd></div>
    </dl>
    <button type="button" class="sag-about__browse" @click="emit('browse')">판매 차량 보기</button>
    <SagGoogleMap title="오시는 길" :address="DEUTSCH_MAIN_ADDRESS" :query="`도이치오토월드 ${DEUTSCH_MAIN_ADDRESS}`" place="도이치오토월드 · 고색동" />
  </section>
</template>
