<script setup lang="ts">
// 리액트 DetailSellerInfo(detail/index.tsx).
import { computed } from "vue";
import { asset, sellerDetailPhoto, sellerLabel, type Car } from "@proto/data";
import { carShopName } from "./detail-local";

const props = defineProps<{ car: Car }>();
const view = computed(() => {
  const { car } = props;
  const isDealer = car.sellerType === "딜러";
  // 판매완료 대수는 실제 값이 없어 매물 번호로 정한 가상 값이다(2026-10-13)
  const label = sellerLabel(car);
  const [personName, ...shopParts] = label.split(" ");
  const sellerName = isDealer && !/딜러$/.test(label) && shopParts.length ? `${personName} 딜러` : label;
  return { isDealer, sellerName, shop: carShopName(car), soldCount: 12 + ((car.id * 37) % 188) };
});
</script>
<template>
  <section class="detail-seller-info" aria-label="판매자 정보">
    <img class="detail-seller-avatar" :src="asset(sellerDetailPhoto(car))" alt="" :draggable="false" />
    <div class="detail-seller-text">
      <div class="detail-seller-name"><strong>{{ view.sellerName }}</strong><span v-if="view.isDealer && view.shop" class="bbm-card-location-part detail-seller-shop">{{ view.shop }}</span></div>
      <span v-if="view.isDealer"><b>{{ car.stock }}대</b> 판매중 · <b>{{ view.soldCount }}대</b> 판매완료</span>
      <span v-if="view.isDealer" class="detail-seller-activity">딜러 경력 7년</span>
    </div>
  </section>
</template>
