<script setup lang="ts">
// 리액트 SaleCard(detail/index.tsx).
import { getActiveDetailCar } from "@proto/data";
import { useDetailUi } from "../../composables/detail/useDetailUi";
import SectionCard from "./SectionCard.vue";
import LockClosedIcon from "../icons/LockClosedIcon.vue";

const ui = useDetailUi();
const car = getActiveDetailCar();
</script>
<template>
  <SectionCard v-if="car" title="판매 정보" class-name="is-sale-card">
    <dl class="detail-rows is-facts-size"><div><dt>차량가</dt><dd>{{ car.price }}</dd></div><div v-if="car.ferrariDetail"><dt>판매구분</dt><dd>{{ car.ferrariDetail.saleType }}</dd></div></dl>
    <button class="cost-entry-button" type="button" @click="ui.setSheet('cost')"><span><b>구매비용 계산기</b><small>취득세·이전비·할부금까지 한 번에</small></span><strong>계산하기</strong></button>
  </SectionCard>
  <SectionCard v-else title="판매 정보" class-name="is-sale-card">
    <div class="cost-box"><dl><div><dt>차량가</dt><dd>1억5,980만원</dd></div><div><dt>이전 등록비(예상)</dt><dd>314만원</dd></div><div><dt>매도비</dt><dd>33만원</dd></div></dl><div class="cost-total"><span>예상 총 비용</span><strong>1억 6,328만원</strong></div></div>
    <div class="sale-actions"><button type="button" @click="ui.setSheet('cost')">비용계산기</button><button type="button" @click="ui.notify('동급매물로 이동했어요')">동급매물</button><button type="button" @click="ui.notify('할부매물을 확인해요')">할부매물</button></div>
    <button class="report-button" type="button" @click="ui.notify('신고 접수 화면을 준비했어요')"><LockClosedIcon /> 신고하기</button>
  </SectionCard>
</template>
