<script setup lang="ts">
// 리액트 DesktopVehicleInfo(detail/index.tsx). 시안 폴백 PC 차량 정보.
import { ref } from "vue";
import { extraInfo, formatMileage } from "@proto/data";
import SectionCard from "./SectionCard.vue";
import { pcAsset } from "./detail-local";

const expanded = ref(false);
const rows = [
  ["주행거리", formatMileage("42,000km"), "imgPropertyStatus1"], ["연료", "가솔린", "imgImage213"],
  ["변속기", "자동 8단", "imgImage214"], ["배기량", "2,497 cc", "imgImage215"],
  ["색상", "검정색 (외장) · 흰색 (시트)", "imgImage216"], ["지역", "서울 서초구", "imgImage217"],
  ["사고이력", "없음", "imgImage218"],
];
</script>
<template>
  <SectionCard title="차량 정보" class-name="pc-info">
    <dl><div v-for="[label, value, icon] in rows" :key="label"><dt><img :src="pcAsset(`9626-${icon}.png`)" alt="" />{{ label }}</dt><dd>{{ value }}</dd></div><template v-if="expanded"><div v-for="[label, value] in extraInfo" :key="label"><dt>{{ label }}</dt><dd>{{ value }}</dd></div></template></dl>
    <button class="vehicle-info-toggle" :aria-expanded="expanded" @click="expanded = !expanded">{{ expanded ? "접기" : "더보기" }}<img :class="expanded ? 'is-expanded' : ''" :src="pcAsset('9626-imgFrame1000006238.svg')" alt="" /></button>
  </SectionCard>
</template>
