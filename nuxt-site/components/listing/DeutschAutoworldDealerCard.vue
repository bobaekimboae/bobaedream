<script setup lang="ts">
// 리액트 deutsch-autoworld-directory.tsx 안의 (export 안 된) DealerCard. 누르면 판매자페이지로 이동(원본과 같이 emit 없음).
import { computed } from "vue";
import { deutschDealerPhoto, deutschShopByNo, displayCompany } from "@proto/listing/deutsch-autoworld-directory";
import type { SeoulAutoGalleryDealer } from "@proto/listing/seoul-auto-gallery-dealer-rail";
import { openDealer } from "./deutsch-autoworld-local";

const props = defineProps<{ dealer: SeoulAutoGalleryDealer; showCompany?: boolean }>();
const company = computed(() => (props.showCompany ? displayCompany(deutschShopByNo.get(props.dealer.shopNo)?.company ?? "") : ""));
</script>
<template>
  <button type="button" class="sag-dealer-card" :aria-label="`${dealer.name} 딜러${company ? ` · ${company}` : ''} 매물 ${dealer.listingCount}대 보기`" @click="openDealer(dealer)">
    <span class="sag-dealer-photo"><img :src="deutschDealerPhoto(dealer)" alt="" aria-hidden="true" :draggable="false" loading="lazy" /></span>
    <strong>{{ dealer.name }}</strong>
    <em v-if="company">{{ company }}</em>
    <span>{{ dealer.listingCount }}대</span>
  </button>
</template>
