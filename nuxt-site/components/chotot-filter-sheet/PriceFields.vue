<script setup lang="ts">
// 원본: src/ChoTotFilterSheet.tsx 의 가격 입력 두 칸 + 가격 구간 칩(ChoTotFilterSheet · ChoTotQuickFilterSheet 에 똑같이 들어 있던 JSX). 감싸는 요소 없이 두 덩어리를 그린다.
// 대응: setValue("price", …) → emit change(price)
import type { ChoTotFilterState } from "@src/ChoTotFilterSheet";
import { syncControlled } from "../../lib/controlled-input";

type Price = ChoTotFilterState["price"];
const props = defineProps<{ price: Price }>();
const emit = defineEmits<{ change: [price: Price] }>();
const onMin = (event: Event) => { emit("change", { ...props.price, min: Number((event.currentTarget as HTMLInputElement).value.replaceAll(",", "")) || 0 }); syncControlled(event, () => String(props.price.min || "")); };
const onMax = (event: Event) => { const v = (event.currentTarget as HTMLInputElement).value; emit("change", { ...props.price, max: v ? Number(v.replaceAll(",", "")) : null }); syncControlled(event, () => String(props.price.max ?? "")); };
</script>
<template>
  <div class="chotot-price-fields"><label><span>최소</span><input inputmode="numeric" :value="price.min || ''" placeholder="최소 금액" @input="onMin"><b>만원</b></label><span>~</span><label><span>최대</span><input inputmode="numeric" :value="price.max ?? ''" placeholder="최대 금액" @input="onMax"><b>만원</b></label></div>
  <div class="chotot-choice-chips compact"><button type="button" :class="price.min === 0 && price.max === 1000 ? 'is-selected' : ''" @click="emit('change', { ...price, min: 0, max: 1000 })">1천만원 이하</button><button type="button" :class="price.min === 1000 && price.max === 3000 ? 'is-selected' : ''" @click="emit('change', { ...price, min: 1000, max: 3000 })">1천~3천만원</button><button type="button" :class="price.min === 3000 && price.max === 7000 ? 'is-selected' : ''" @click="emit('change', { ...price, min: 3000, max: 7000 })">3천~7천만원</button></div>
</template>
