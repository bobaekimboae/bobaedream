<script setup lang="ts">
// 리액트 src/prototype/listing/company-finder.tsx 의 CompanyFinder.
// finder = composables/listing/useCompanyFinder 가 돌려준 값.
import { computed } from "vue";
import { asset } from "@proto/data";
import { COMPANY_INDEX, companyIndexOf } from "@proto/listing/company-finder";
import type { CompanyFinderState } from "../../composables/listing/useCompanyFinder";

const props = defineProps<{ finder: CompanyFinderState; names: string[] }>();
const counts = computed(() => {
  const map = new Map<string, number>();
  for (const name of props.names) map.set(companyIndexOf(name), (map.get(companyIndexOf(name)) ?? 0) + 1);
  return map;
});
const query = computed(() => props.finder.query.value);
const letter = computed(() => props.finder.letter.value);
const onInput = (event: Event) => props.finder.setQuery((event.target as HTMLInputElement).value);
</script>
<template>
  <label class="sag-dealer-search sag-company-search">
    <img :src="asset('bbm/header-search.svg')" alt="" aria-hidden="true" />
    <input type="search" :value="query" placeholder="상사명 · 대표 · 호수 · 초성으로 검색" aria-label="상사 검색" @input="onInput" />
    <button v-if="query" type="button" aria-label="검색어 지우기" @click="finder.setQuery('')">×</button>
  </label>
  <div class="sag-dealer-shops sag-company-index" role="group" aria-label="상사명 첫 글자">
    <button type="button" :aria-pressed="!letter" :class="!letter ? 'is-selected' : ''" @click="finder.setLetter('')">전체</button>
    <button
      v-for="item in COMPANY_INDEX"
      :key="item"
      type="button"
      :disabled="!(counts.get(item) ?? 0)"
      :aria-pressed="letter === item"
      :class="letter === item ? 'is-selected' : ''"
      :aria-label="`${item} 상사 ${counts.get(item) ?? 0}곳`"
      @click="finder.setLetter(letter === item ? '' : item)"
    >{{ item }}</button>
  </div>
</template>
