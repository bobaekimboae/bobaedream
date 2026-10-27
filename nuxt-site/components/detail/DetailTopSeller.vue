<script setup lang="ts">
// 리액트 DetailTopSeller(detail/index.tsx). 링크가 있으면 <a>, 없으면 <div>.
import { computed } from "vue";
import { asset, sellerDetailPhoto, type Car } from "@proto/data";
import { deutschDealerForCar } from "@proto/listing/deutsch-autoworld-directory";
import { carShopName, detailSellerName, sagDealerFor } from "./detail-local";

const props = defineProps<{ car: Car; overlay?: boolean }>();
const view = computed(() => {
  const { car, overlay } = props;
  const isDealer = car.sellerType === "딜러";
  const shop = carShopName(car);
  const sagDealer = car.seoulAutoGallery ? sagDealerFor(car) : undefined;
  const dawDealer = deutschDealerForCar(car);
  const href = sagDealer ? `${window.location.pathname}?profile=dealer&shop=${sagDealer.shopNo}&emp=${sagDealer.empNo}` : car.joyMotors ? `${window.location.pathname}?qf=guazi&profile=dealer&shop=joy&emp=1` : dawDealer ? `${window.location.pathname}?qf=guazi&profile=dealer&shop=${dawDealer.shopNo}&emp=${dawDealer.empNo}` : undefined;
  return {
    href,
    name: detailSellerName(car),
    small: isDealer ? [shop, `${car.stock}대 판매중`].filter(Boolean).join(" · ") : "개인 판매자",
    className: `detail-top-seller${overlay ? " is-overlay" : ""}`,
  };
});
</script>
<template>
  <component :is="view.href ? 'a' : 'div'" :class="view.className" :href="view.href" :aria-label="view.href ? `${view.name} 판매자 페이지` : undefined">
    <img class="detail-top-seller-avatar" :src="asset(sellerDetailPhoto(car))" alt="" :draggable="false" />
    <span class="detail-top-seller-text">
      <strong>{{ view.name }}</strong>
      <small v-if="!overlay">{{ view.small }}</small>
    </span>
    <svg class="detail-top-seller-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
  </component>
</template>
