<script setup lang="ts">
// 리액트 SellerCard(detail/index.tsx). 실매물이면 그리지 않는다(시안 폴백 전용).
import { asset, getActiveDetailCar, sellerScenario } from "@proto/data";
const hasCar = !!getActiveDetailCar();
</script>
<template>
  <section v-if="!hasCar" class="detail-card seller-card">
    <div class="seller-profile"><img :src="asset('detail/raw-10.jpeg')" :alt="sellerScenario.name" /><div><h2>{{ sellerScenario.name }}</h2><p>● {{ sellerScenario.location }}</p></div></div>
    <dl class="detail-rows"><div><dt>종사원번호</dt><dd>{{ sellerScenario.staffNumber }} <u>상사/조합정보</u></dd></div><div><dt>매매유형</dt><dd>매매알선(소속 상사 매물)</dd></div></dl>
  </section>
</template>
