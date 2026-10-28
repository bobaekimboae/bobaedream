<script setup lang="ts">
// 리액트 seoul-auto-gallery-dealer-rail.tsx 안의 (export 안 된) SeoulAutoGalleryDealerDirectory. onOpenDealer → emit("openDealer", dealer).
import { computed, ref } from "vue";
import { asset } from "@proto/data";
import { seoulAutoGalleryShops } from "@proto/data/seoul-autogallery-shops-v01";
import { companyIndexOf, matchDealer } from "@proto/listing/company-finder";
import { allSeoulAutoGalleryDealers, type SeoulAutoGalleryDealer } from "@proto/listing/seoul-auto-gallery-dealer-rail";
import { companyOf, iconBase, shopLabel, snsOf } from "./seoul-auto-gallery-local";
import DealerIndex from "./DealerIndex.vue";
import SeoulAutoGalleryDealerCard from "./SeoulAutoGalleryDealerCard.vue";
import "@proto/listing/seoul-auto-gallery-dealer-rail.css";

const emit = defineEmits<{ openDealer: [dealer: SeoulAutoGalleryDealer] }>();
const query = ref("");
const shopNo = ref("");
const letter = ref("");
const shops = seoulAutoGalleryShops
  .map((shop, index) => ({ shopNo: shop.shopNo, label: shopLabel(shop.company), count: allSeoulAutoGalleryDealers.filter((dealer) => dealer.shopNo === shop.shopNo).length, index }))
  .filter((shop) => shop.count > 0)
  .sort((a, b) => b.count - a.count || a.index - b.index);
const snsCount = allSeoulAutoGalleryDealers.filter((dealer) => snsOf(dealer)).length;
const scoped = computed(() => allSeoulAutoGalleryDealers.filter((dealer) => (!shopNo.value || (shopNo.value === "sns" ? Boolean(snsOf(dealer)) : dealer.shopNo === shopNo.value)) && matchDealer(query.value, dealer.name, companyOf(dealer))));
const list = computed(() => (letter.value ? scoped.value.filter((dealer) => companyIndexOf(dealer.name) === letter.value).sort((a, b) => a.name.localeCompare(b.name, "ko")) : scoped.value));
const scopedNames = computed(() => scoped.value.map((dealer) => dealer.name));
const onInput = (event: Event) => { query.value = (event.target as HTMLInputElement).value; };
const reset = () => { query.value = ""; shopNo.value = ""; letter.value = ""; };
</script>
<template>
  <section class="sag-dealer-rail is-all" aria-labelledby="sag-dealer-rail-title">
    <label class="sag-dealer-search">
      <img :src="asset('bbm/header-search.svg')" alt="" aria-hidden="true" />
      <input type="search" :value="query" placeholder="딜러 이름 · 상사 · 초성으로 검색" aria-label="딜러 검색" @input="onInput" />
      <button v-if="query" type="button" aria-label="검색어 지우기" @click="query = ''">×</button>
    </label>
    <div class="sag-dealer-shops" role="group" aria-label="소속 상사">
      <button type="button" :aria-pressed="!shopNo" :class="!shopNo ? 'is-selected' : ''" @click="shopNo = ''">전체 {{ allSeoulAutoGalleryDealers.length }}</button>
      <button type="button" :aria-pressed="shopNo === 'sns'" :class="`is-sns${shopNo === 'sns' ? ' is-selected' : ''}`" @click="shopNo = shopNo === 'sns' ? '' : 'sns'"><img :src="`${iconBase}icons/dealer-profile/instagram.svg`" alt="" aria-hidden="true" />인스타 · 유튜브 {{ snsCount }}</button>
      <button v-for="shop in shops" :key="shop.shopNo" type="button" :aria-pressed="shopNo === shop.shopNo" :class="shopNo === shop.shopNo ? 'is-selected' : ''" @click="shopNo = shopNo === shop.shopNo ? '' : shop.shopNo">{{ shop.label }} {{ shop.count }}</button>
    </div>
    <DealerIndex :names="scopedNames" :letter="letter" @change="(next) => (letter = next)" />
    <h2 id="sag-dealer-rail-title">딜러 {{ list.length }}명</h2>
    <div v-if="list.length" class="sag-dealer-track">
      <SeoulAutoGalleryDealerCard v-for="dealer in list" :key="`${dealer.shopNo}-${dealer.empNo}`" :dealer="dealer" show-company @open-dealer="(d) => emit('openDealer', d)" />
    </div>
    <div v-else class="sag-dealer-empty">
      <p>찾는 딜러가 없어요. 이름이나 상사명을 다시 확인해 주세요.</p>
      <button type="button" @click="reset">검색 초기화</button>
    </div>
  </section>
</template>
