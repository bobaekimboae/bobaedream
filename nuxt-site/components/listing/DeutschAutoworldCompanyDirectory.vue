<script setup lang="ts">
// 리액트 deutsch-autoworld-directory.tsx 의 DeutschAutoworldCompanyDirectory.
import { computed } from "vue";
import { companyIndexOf, matchCompany } from "@proto/listing/company-finder";
import { deutschDealerPhoto, deutschShopLogo, displayCompany } from "@proto/listing/deutsch-autoworld-directory";
import { useCompanyFinder } from "../../composables/listing/useCompanyFinder";
import CompanyFinder from "./CompanyFinder.vue";
import ChevronRightIcon from "../icons/ChevronRightIcon.vue";
import { dawCompanies as companies, openDealer } from "./deutsch-autoworld-local";
import "@proto/listing/seoul-auto-gallery-dealer-rail.css";
import "@proto/listing/seoul-auto-gallery-directory.css";
import "@proto/listing/deutsch-autoworld-directory.css";

const finder = useCompanyFinder();
const names = companies.map(({ shop }) => displayCompany(shop.company));
const list = computed(() => {
  const letter = finder.letter.value;
  const query = finder.query.value;
  return companies
    .filter(({ shop }) => (!letter || companyIndexOf(displayCompany(shop.company)) === letter) && matchCompany(query, displayCompany(shop.company), [...shop.owners, shop.room]))
    .sort((a, b) => letter ? displayCompany(a.shop.company).localeCompare(displayCompany(b.shop.company), "ko") : 0);
});
const parts = (shop: (typeof companies)[number]["shop"], memberCount: number) => [shop.room, shop.owners.length ? `대표 ${shop.owners.join(" · ")}` : "", `소속딜러 ${memberCount}명`].filter(Boolean);
const reset = () => { finder.setQuery(""); finder.setLetter(""); };
</script>
<template>
  <section class="sag-company-directory" aria-labelledby="daw-company-directory-title">
    <CompanyFinder :finder="finder" :names="names" />
    <h2 id="daw-company-directory-title">상사 {{ list.length }}곳</h2>
    <div v-if="list.length" class="sag-company-list">
      <button
        v-for="{ shop, owner, memberCount, listingCount } in list"
        :key="shop.shopNo"
        type="button"
        class="sag-company-row"
        :aria-label="`${displayCompany(shop.company)} ${shop.owners.length ? `대표 ${shop.owners.join(', ')} ` : ''}판매자페이지 보기`"
        @click="openDealer(owner!)"
      >
        <img :class="`sag-company-photo${deutschShopLogo(shop.shopNo) ? ' is-logo' : ''}`" :src="deutschShopLogo(shop.shopNo) ?? deutschDealerPhoto(owner!)" alt="" loading="lazy" />
        <span>
          <strong>{{ displayCompany(shop.company) }}</strong>
          <small><template v-for="(text, index) in parts(shop, memberCount)" :key="text"><template v-if="index">{{ " · " }}</template><span>{{ text }}</span></template></small>
        </span>
        <b>매물 {{ listingCount.toLocaleString("ko-KR") }}대</b>
        <ChevronRightIcon aria-hidden="true" />
      </button>
    </div>
    <div v-else class="sag-dealer-empty">
      <p>찾는 상사가 없어요. 상사명이나 대표 이름을 다시 확인해 주세요.</p>
      <button type="button" @click="reset">검색 초기화</button>
    </div>
  </section>
</template>
