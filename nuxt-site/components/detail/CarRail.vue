<script setup lang="ts">
// 리액트 CarRail(detail/index.tsx). 실제 상세정보가 연결된 매물(ferrariDetail)은 가상 추천 매물을 보여주지 않는다.
import { asset, formatMileage, getActiveDetailCar } from "@proto/data";
import { useDetailUi } from "../../composables/detail/useDetailUi";
import Carousel from "../mobile/Carousel.vue";
import type { RailCar } from "./detail-local";

defineProps<{ title: string; cars: RailCar[] }>();
const ui = useDetailUi();
const hidden = !!getActiveDetailCar()?.ferrariDetail;
</script>
<template>
  <section v-if="!hidden" class="related-section"><h2>{{ title }}</h2><Carousel :aria-label="title" class-name="related-carousel" content-class-name="related-track">
    <button v-for="car in cars" :key="`${title}-${car.title}`" class="related-card" type="button" @click="ui.notify(`${car.title} 매물을 열었어요`)"><div class="related-photo"><img :src="asset(`detail/${car.image}`)" :alt="car.title" :draggable="false" /><span>{{ car.posted }}</span><b>10 ▣</b></div><div><h3>{{ car.title }}</h3><p v-if="car.meta">{{ formatMileage(car.meta) }}</p><strong>{{ car.price }}</strong><small>● {{ car.place }}</small></div></button>
  </Carousel></section>
</template>
