<script setup lang="ts">
// 리액트 bbm-list.tsx 의 BbmTextViewTable. onOpen(car) → emit("open", car), onToggleLike(car) → emit("toggleLike", car)
// ── PC 한줄 광고로 보기(테스트 서버 dev.bbmuseum car-list-text-view 실측 10/9): 머리줄 #F4F4F4 반경 8 · 줄 56 · 구분선 #EBEBEB
// 열: 선택 30 · 모델 170 · 색상 56 · 연식(연형) 102 · 연료 108 · 주행거리 98 · 지역 72 · 판매자 72 · 가격(만원) 84 · 찜 36
import { computed, ref } from "vue";
import { sellerLabel, type Car } from "@proto/data";
import { bbmCardSpec } from "@proto/data/bbm-card-samples";
import { bbmIcon } from "@proto/listing/bbm-list";
import "@proto/listing/bbm-tokens.css";
import "@proto/listing/thumbnail-states.css";
import { cardTitleText, textViewColors, textViewYear, wishMaskStyle } from "./bbm-list-local";

const props = defineProps<{ cars: Car[]; likedIds: readonly number[] }>();
const emit = defineEmits<{ open: [car: Car]; toggleLike: [car: Car] }>();
const checked = ref<number[]>([]);
const wishOff = bbmIcon("card-wish-off");
const rows = computed(() => props.cars.map((car) => {
  const spec = bbmCardSpec(car, true);
  const parts = spec.split(" · ");
  const mileage = parts.find((part) => /\d(만|천)?km$|\d시간$/.test(part)) ?? "-";
  const fuel = car.filter?.fuel ?? parts.find((part) => /가솔린|디젤|전기|하이브리드|LPG|수소/.test(part)) ?? "-";
  const color = car.filter?.color;
  const price = car.price.match(/[\d,]+/)?.[0] ?? "상담";
  return { car, spec, mileage, fuel, color, price, title: cardTitleText(car) };
}));
const toggleCheck = (id: number) => { checked.value = checked.value.includes(id) ? checked.value.filter((value) => value !== id) : [...checked.value, id]; };
const onRowKey = (event: KeyboardEvent, car: Car) => { if (event.key === "Enter") { event.preventDefault(); emit("open", car); } };
</script>
<template>
  <div class="bbm-text-view" role="table" aria-label="한줄 광고 목록">
    <div class="bbm-text-view__head" role="row">
      <span class="bbm-text-view__cell is-check" role="columnheader" aria-label="선택" />
      <span class="bbm-text-view__cell is-model" role="columnheader">모델</span>
      <span class="bbm-text-view__cell" role="columnheader">색상</span>
      <span class="bbm-text-view__cell" role="columnheader">연식(연형)</span>
      <span class="bbm-text-view__cell" role="columnheader">연료</span>
      <span class="bbm-text-view__cell" role="columnheader">주행거리</span>
      <span class="bbm-text-view__cell" role="columnheader">지역</span>
      <span class="bbm-text-view__cell" role="columnheader">판매자</span>
      <span class="bbm-text-view__cell is-price" role="columnheader">가격(만원)</span>
      <span class="bbm-text-view__cell is-wish" role="columnheader" aria-label="찜" />
    </div>
    <div v-for="row in rows" :key="row.car.id" class="bbm-text-view__row" role="row" tabindex="0" :aria-label="`${row.title} 상세 보기`" @click="emit('open', row.car)" @keydown="onRowKey($event, row.car)">
      <span class="bbm-text-view__cell is-check" role="cell">
        <button type="button" :class="`bbm-text-view__check${checked.includes(row.car.id) ? ' is-checked' : ''}`" :aria-label="`${row.car.title} 선택`" :aria-pressed="checked.includes(row.car.id)" @click.stop="toggleCheck(row.car.id)" />
      </span>
      <span class="bbm-text-view__cell is-model" role="cell">{{ row.title }}</span>
      <span class="bbm-text-view__cell" role="cell"><i v-if="row.color" class="bbm-text-view__color" :style="{ background: textViewColors[row.color] ?? 'transparent' }" :title="row.color" :aria-label="row.color" /><template v-else>-</template></span>
      <span class="bbm-text-view__cell" role="cell">{{ textViewYear(row.car, row.spec) }}</span>
      <span class="bbm-text-view__cell" role="cell">{{ row.fuel.replace("가솔린 하이브리드", "하이브리드") }}</span>
      <span class="bbm-text-view__cell" role="cell">{{ row.mileage }}</span>
      <span class="bbm-text-view__cell" role="cell">{{ row.car.place.split(" ")[0] || "-" }}</span>
      <span class="bbm-text-view__cell" role="cell">{{ sellerLabel(row.car) }}</span>
      <span class="bbm-text-view__cell is-price" role="cell">{{ row.price }}</span>
      <span class="bbm-text-view__cell is-wish" role="cell">
        <button type="button" :class="`bbm-text-view__wish${likedIds.includes(row.car.id) ? ' is-liked' : ''}`" :aria-label="`${row.car.title} ${likedIds.includes(row.car.id) ? '찜 해제' : '찜'}`" :aria-pressed="likedIds.includes(row.car.id)" @click.stop="emit('toggleLike', row.car)">
          <span :style="wishMaskStyle(wishOff)" aria-hidden="true" />
        </button>
      </span>
    </div>
  </div>
</template>
