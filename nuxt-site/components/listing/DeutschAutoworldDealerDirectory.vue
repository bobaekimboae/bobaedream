<script setup lang="ts">
// 리액트 deutsch-autoworld-directory.tsx 의 DeutschAutoworldDealerDirectory.
import { computed, ref } from "vue";
import { asset } from "@proto/data";
import { companyIndexOf, matchDealer } from "@proto/listing/company-finder";
import { allDeutschDealers, deutschShopByNo, displayCompany } from "@proto/listing/deutsch-autoworld-directory";
import DealerIndex from "./DealerIndex.vue";
import DeutschAutoworldDealerCard from "./DeutschAutoworldDealerCard.vue";
import { DAW_PAGE as PAGE, dawCompanies as companies, sortedDealers } from "./deutsch-autoworld-local";
import "@proto/listing/seoul-auto-gallery-dealer-rail.css";
import "@proto/listing/seoul-auto-gallery-directory.css";
import "@proto/listing/deutsch-autoworld-directory.css";

const query = ref("");
const shopNo = ref("");
const letter = ref("");
const limit = ref(PAGE);
const shops = companies
  .map(({ shop, memberCount }) => ({ shopNo: shop.shopNo, label: displayCompany(shop.company), count: memberCount }))
  .sort((a, b) => b.count - a.count);
const scoped = computed(() => sortedDealers.filter((dealer) => (!shopNo.value || dealer.shopNo === shopNo.value) && matchDealer(query.value, dealer.name, deutschShopByNo.get(dealer.shopNo)?.company ?? "")));
const list = computed(() => (letter.value ? scoped.value.filter((dealer) => companyIndexOf(dealer.name) === letter.value).sort((a, b) => a.name.localeCompare(b.name, "ko")) : scoped.value));
const scopedNames = computed(() => scoped.value.map((dealer) => dealer.name));
const reset = (next: () => void) => { next(); limit.value = PAGE; };
const onInput = (event: Event) => reset(() => { query.value = (event.target as HTMLInputElement).value; });
const fmt = (n: number) => n.toLocaleString("ko-KR");
</script>
<template>
  <section class="sag-dealer-rail is-all" aria-labelledby="daw-dealer-directory-title">
    <label class="sag-dealer-search">
      <img :src="asset('bbm/header-search.svg')" alt="" aria-hidden="true" />
      <input type="search" :value="query" placeholder="딜러 이름 · 상사 · 초성으로 검색" aria-label="딜러 검색" @input="onInput" />
      <button v-if="query" type="button" aria-label="검색어 지우기" @click="reset(() => { query = '' })">×</button>
    </label>
    <div class="sag-dealer-shops" role="group" aria-label="소속 상사">
      <button type="button" :aria-pressed="!shopNo" :class="!shopNo ? 'is-selected' : ''" @click="reset(() => { shopNo = '' })">전체 {{ fmt(allDeutschDealers.length) }}</button>
      <button v-for="shop in shops" :key="shop.shopNo" type="button" :aria-pressed="shopNo === shop.shopNo" :class="shopNo === shop.shopNo ? 'is-selected' : ''" @click="reset(() => { shopNo = shopNo === shop.shopNo ? '' : shop.shopNo })">{{ shop.label }} {{ shop.count }}</button>
    </div>
    <DealerIndex :names="scopedNames" :letter="letter" @change="(next) => reset(() => { letter = next })" />
    <h2 id="daw-dealer-directory-title">딜러 {{ fmt(list.length) }}명</h2>
    <template v-if="list.length">
      <div class="sag-dealer-track">
        <DeutschAutoworldDealerCard v-for="dealer in list.slice(0, limit)" :key="`${dealer.shopNo}-${dealer.empNo}`" :dealer="dealer" show-company />
      </div>
      <button v-if="list.length > limit" type="button" class="daw-more" @click="limit += PAGE">딜러 더 보기 ({{ fmt(limit) }} / {{ fmt(list.length) }})</button>
    </template>
    <div v-else class="sag-dealer-empty">
      <p>찾는 딜러가 없어요. 이름이나 상사명을 다시 확인해 주세요.</p>
      <button type="button" @click="reset(() => { query = ''; shopNo = ''; letter = '' })">검색 초기화</button>
    </div>
  </section>
</template>
