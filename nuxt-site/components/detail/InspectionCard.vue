<script setup lang="ts">
// 리액트 InspectionCard(detail/index.tsx). action(제시번호) → SectionCard slot "action".
import { ref } from "vue";
import { getActiveDetailCar } from "@proto/data";
import SectionCard from "./SectionCard.vue";
import QuestionMarkCircledIcon from "../icons/QuestionMarkCircledIcon.vue";

const expanded = ref(false);
const hasCar = !!getActiveDetailCar();
const fd = getActiveDetailCar()?.ferrariDetail;
</script>
<template>
  <template v-if="hasCar && !fd" />
  <SectionCard v-else-if="fd" title="성능 점검" class-name="is-inspection-card"><p class="detail-real-note">{{ fd.inspection ? "성능·상태 점검기록부가 등록된 매물입니다." : "성능점검 기록부가 없습니다." }}</p></SectionCard>
  <SectionCard v-else title="성능 점검" class-name="is-inspection-card">
    <template #action><span class="muted-label">제시번호 : 262621002567</span></template>
    <dl class="detail-info-grid compact"><div><dt>사고이력 <QuestionMarkCircledIcon /></dt><dd>없음</dd></div><div><dt>단순수리 <QuestionMarkCircledIcon /></dt><dd>없음</dd></div></dl>
    <p v-if="expanded" class="inspection-note">성능·상태 점검기록부 기준으로 주요 골격 손상과 침수 이력이 없습니다.</p>
    <button class="outline-wide-button" type="button" :aria-expanded="expanded" @click="expanded = !expanded">{{ expanded ? "성능 점검 접기" : "성능 점검 전체 보기" }}</button>
  </SectionCard>
</template>
