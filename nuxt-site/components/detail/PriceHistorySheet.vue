<script setup lang="ts">
// 리액트 PriceHistorySheet(detail/index.tsx). onClose → emit("close"). 바텀시트 덮개([data-testid="sheet-overlay"]) 누름도 닫기.
import { onBeforeUnmount, onMounted, ref } from "vue";
import { asset, priceHistoryRows } from "@proto/data";

const emit = defineEmits<{ close: [] }>();
const page = ref(1);
const visiblePages = [1, 2, 3, 4, 5, 10];
const selectPage = (nextPage: number) => { page.value = Math.min(10, Math.max(1, nextPage)); };
const onOverlay = () => emit("close");
let overlay: HTMLElement | null = null;
onMounted(() => {
  overlay = document.querySelector<HTMLElement>('[data-testid="sheet-overlay"]');
  overlay?.addEventListener("click", onOverlay);
});
onBeforeUnmount(() => overlay?.removeEventListener("click", onOverlay));
</script>
<template>
  <div class="price-history-sheet">
    <button class="price-history-close" type="button" aria-label="가격 변동 내역 닫기" @click="emit('close')">
      <img :src="asset('detail/price-history-close.svg')" alt="" />
    </button>
    <div class="price-history-table" role="table" aria-label="가격 변동 내역">
      <div class="price-history-head" role="row">
        <span role="columnheader">날짜</span><span role="columnheader">변동</span><span role="columnheader">가격</span>
      </div>
      <div v-for="row in priceHistoryRows" :key="row.date" class="price-history-row" role="row">
        <span role="cell">{{ row.date }}</span>
        <strong :class="row.direction === 'down' ? 'is-down' : ''" role="cell"><span v-if="row.direction === 'first'" class="price-history-tag-icon"><img :src="asset('detail/price-tag.svg')" alt="" /><img :src="asset('detail/price-tag-dot.svg')" alt="" /></span><img v-else :src="asset(`detail/price-${row.direction}.svg`)" alt="" />{{ row.change }}</strong>
        <b role="cell">{{ row.price }}</b>
      </div>
    </div>
    <p class="price-history-note">가격 변동 내역은 판매자가 제공한 정보를 기준으로 합니다.</p>
    <nav class="price-history-pagination" aria-label="가격 변동 페이지">
      <button type="button" aria-label="이전 페이지" :disabled="page === 1" @click="selectPage(page - 1)"><span class="price-history-pagination-arrow is-previous" aria-hidden="true"><img :src="asset('detail/pagination-left.svg')" alt="" /></span></button>
      <span v-for="(pageNumber, index) in visiblePages" :key="pageNumber" class="price-history-page-slot">
        <img v-if="index === visiblePages.length - 1" class="price-history-ellipsis" :src="asset('detail/pagination-ellipsis.svg')" alt="" />
        <button type="button" :aria-label="`${pageNumber} 페이지`" :aria-current="page === pageNumber ? 'page' : undefined" @click="selectPage(pageNumber)">{{ pageNumber }}</button>
      </span>
      <button type="button" aria-label="다음 페이지" :disabled="page === 10" @click="selectPage(page + 1)"><span class="price-history-pagination-arrow is-next" aria-hidden="true"><img :src="asset('detail/pagination-right.svg')" alt="" /></span></button>
    </nav>
  </div>
</template>
