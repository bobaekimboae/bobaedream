<script setup lang="ts">
// 리액트 deutsch-autoworld-directory.tsx 의 DeutschAutoworldDealerRail(매물 많은 소속딜러 10명).
import DeutschAutoworldDealerCard from "./DeutschAutoworldDealerCard.vue";
import { railDealers } from "./deutsch-autoworld-local";
import "@proto/listing/seoul-auto-gallery-dealer-rail.css";
import "@proto/listing/seoul-auto-gallery-directory.css";
import "@proto/listing/deutsch-autoworld-directory.css";
</script>
<template>
  <section class="sag-dealer-rail" aria-labelledby="daw-dealer-rail-title">
    <h2 id="daw-dealer-rail-title">딜러</h2>
    <div class="sag-dealer-track">
      <DeutschAutoworldDealerCard v-for="dealer in railDealers" :key="`${dealer.shopNo}-${dealer.empNo}`" :dealer="dealer" />
    </div>
  </section>
</template>
