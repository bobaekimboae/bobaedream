<script setup lang="ts">
// 리액트 seoul-auto-gallery-dealer-rail.tsx 안의 (export 안 된) DealerCard.
// 같은 폴더에 도이치오토월드 DealerCard 도 있어 파일 이름을 SeoulAutoGalleryDealerCard 로 했다.
// onOpenDealer → emit("openDealer", dealer).
import { computed } from "vue";
import { dealerPhoto, type SeoulAutoGalleryDealer } from "@proto/listing/seoul-auto-gallery-dealer-rail";
import { companyOf, iconBase, snsOf } from "./seoul-auto-gallery-local";

const props = defineProps<{ dealer: SeoulAutoGalleryDealer; showCompany?: boolean }>();
const emit = defineEmits<{ openDealer: [dealer: SeoulAutoGalleryDealer] }>();
const company = computed(() => (props.showCompany ? companyOf(props.dealer) : ""));
const sns = computed(() => snsOf(props.dealer));
const label = computed(() => {
  const s = sns.value;
  return `${props.dealer.name} 딜러${company.value ? ` · ${company.value}` : ""}${s ? ` · ${[s.links.instagram ? "인스타그램" : "", s.links.youtube ? "유튜브" : ""].filter(Boolean).join("·")} 있음` : ""} 매물 ${props.dealer.listingCount}대 보기`;
});
</script>
<template>
  <button type="button" class="sag-dealer-card" :aria-label="label" @click="emit('openDealer', dealer)">
    <span class="sag-dealer-photo">
      <img :src="dealerPhoto(dealer)" alt="" aria-hidden="true" :draggable="false" />
      <span v-if="sns" class="sag-dealer-sns" aria-hidden="true"><img v-if="sns.links.instagram" :src="`${iconBase}icons/dealer-profile/instagram.svg`" alt="" /><img v-if="sns.links.youtube" :src="`${iconBase}icons/dealer-profile/youtube.svg`" alt="" /></span>
    </span>
    <strong>{{ dealer.name }}</strong>
    <em v-if="company">{{ company }}</em>
    <span>{{ dealer.listingCount }}대</span>
  </button>
</template>
