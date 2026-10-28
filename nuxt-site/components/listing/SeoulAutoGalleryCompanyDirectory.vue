<script setup lang="ts">
// 리액트 seoul-auto-gallery-directory.tsx 의 SeoulAutoGalleryCompanyDirectory.
import { computed } from "vue";
import { companyIndexOf, matchCompany } from "@proto/listing/company-finder";
import { useCompanyFinder } from "../../composables/listing/useCompanyFinder";
import CompanyFinder from "./CompanyFinder.vue";
import ChevronRightIcon from "../icons/ChevronRightIcon.vue";
import { roomLabel, sagCompanies as companies, sagDisplayCompany as displayCompany } from "./seoul-auto-gallery-local";
import "@proto/listing/seoul-auto-gallery-directory.css";
import "@proto/listing/seoul-auto-gallery-dealer-rail.css";

const finder = useCompanyFinder();
const names = companies.map((company) => displayCompany(company.company));
const list = computed(() => {
  const letter = finder.letter.value;
  const query = finder.query.value;
  return companies
    .filter((company) => (!letter || companyIndexOf(displayCompany(company.company)) === letter) && matchCompany(query, displayCompany(company.company), [...company.owners, roomLabel(company.room)]))
    .sort((a, b) => letter ? displayCompany(a.company).localeCompare(displayCompany(b.company), "ko") : 0);
});
const open = (shopNo: string, emp = "1") => {
  window.location.assign(`${window.location.pathname}?profile=dealer&shop=${shopNo}&emp=${emp}`);
};
const reset = () => { finder.setQuery(""); finder.setLetter(""); };
</script>
<template>
  <section class="sag-company-directory" aria-labelledby="sag-company-directory-title">
    <CompanyFinder :finder="finder" :names="names" />
    <h2 id="sag-company-directory-title">상사 {{ list.length }}곳</h2>
    <div v-if="!list.length" class="sag-dealer-empty">
      <p>찾는 상사가 없어요. 상사명이나 대표 이름을 다시 확인해 주세요.</p>
      <button type="button" @click="reset">검색 초기화</button>
    </div>
    <div class="sag-company-list">
      <button
        v-for="company in list"
        :key="company.shopNo"
        type="button"
        class="sag-company-row"
        :aria-label="`${displayCompany(company.company)} 대표 ${company.owners.join(', ')} 판매자페이지 보기`"
        @click="open(company.shopNo)"
      >
        <img v-if="company.photo" class="sag-company-photo" :src="company.photo" alt="" loading="lazy" />
        <i v-else class="sag-company-photo" aria-hidden="true" />
        <span>
          <strong>{{ displayCompany(company.company) }}</strong>
          <small><span>{{ roomLabel(company.room) }}</span> · <span>대표 {{ company.owners.join(" · ") }}</span> · <span>소속딜러 {{ company.memberCount }}명</span></small>
        </span>
        <b>매물 {{ company.listingCount }}대</b>
        <ChevronRightIcon aria-hidden="true" />
      </button>
    </div>
  </section>
</template>
