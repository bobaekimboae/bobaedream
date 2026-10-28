<script setup lang="ts">
// 리액트 HistoryCard(detail/index.tsx). action(통합 이력조회 링크) → SectionCard slot "action".
import { ref } from "vue";
import { detailVehiclePlate, getActiveDetailCar, vehicleHistoryUrl } from "@proto/data";
import SectionCard from "./SectionCard.vue";

const expanded = ref(false);
const hasCar = !!getActiveDetailCar();
const fd = getActiveDetailCar()?.ferrariDetail;
const historyHref = vehicleHistoryUrl(detailVehiclePlate);
</script>
<template>
  <template v-if="hasCar && !fd" />
  <SectionCard v-else-if="fd" title="보험 이력" class-name="is-history-card">
    <template v-if="fd.insurance">
      <div class="insurance-summary"><div>내 차 피해<strong>{{ fd.insurance.own }}건</strong></div><div>상대 차 피해<strong>{{ fd.insurance.other }}건</strong></div><div>전손·침수·도난<strong>{{ fd.insurance.special }}</strong></div></div>
      <dl class="detail-rows"><div><dt>소유자 변경</dt><dd>{{ fd.insurance.owners }}회</dd></div><div><dt>번호판 변경</dt><dd>{{ fd.insurance.plateChanges === 0 ? "없음" : `${fd.insurance.plateChanges}회` }}</dd></div></dl>
    </template>
    <p v-else class="detail-real-note">등록된 보험 이력 정보가 없습니다.</p>
  </SectionCard>
  <SectionCard v-else title="보험 이력" class-name="is-history-card">
    <template #action><a class="history-link" :href="historyHref">통합 이력조회</a></template>
    <div class="insurance-summary"><div>내 차 피해<strong>0건</strong></div><div>상대 차 피해<strong>0건</strong></div><div>특수사항<strong>없음</strong></div></div>
    <h3 class="subheading">차량 이력 상세</h3>
    <dl class="detail-rows"><div><dt>특수 용도 이력</dt><dd>없음</dd></div><div><dt>용도 및 차종</dt><dd>자가용 승용</dd></div><template v-if="expanded"><div><dt>소유자 변경</dt><dd>1회</dd></div><div><dt>번호판 변경</dt><dd>없음</dd></div></template></dl>
    <button class="outline-wide-button" type="button" :aria-expanded="expanded" @click="expanded = !expanded">{{ expanded ? "보험 이력 접기" : "보험 이력 전체 보기" }}</button>
    <a class="history-cta" :href="historyHref">차량번호 {{ detailVehiclePlate }} 이력조회</a>
  </SectionCard>
</template>
