<script setup lang="ts">
// 리액트 AccidentInspectionCard(detail/index.tsx).
import { detailVehiclePlate, getActiveDetailCar, vehicleHistoryUrl } from "@proto/data";
import SectionCard from "./SectionCard.vue";
import { carFactGroups, NO_INFO } from "./detail-local";

const car = getActiveDetailCar();
const historyRows = new Map(car ? carFactGroups(car).find((group) => group.title === "차량 히스토리")?.rows ?? [] : []);
const accidentHistory = historyRows.get("사고이력") ?? NO_INFO;
const repairHistory = historyRows.get("수리이력") ?? NO_INFO;
const inspectionRecord = car?.ferrariDetail?.inspection === false ? "기록부 없음" : "확인하기";
const historyHref = vehicleHistoryUrl(detailVehiclePlate);
</script>
<template>
  <SectionCard v-if="car" title="사고·성능점검" class-name="warranty-card accident-inspection-card">
    <div class="warranty-box">
      <div><span>사고이력</span><strong><a class="vehicle-history-link" :href="historyHref">{{ accidentHistory }}</a></strong></div>
      <div><span>수리이력</span><strong><a class="vehicle-history-link" :href="historyHref">{{ repairHistory }}</a></strong></div>
      <div><span>성능점검기록부</span><strong><a class="vehicle-history-link" :href="historyHref">{{ inspectionRecord }}</a></strong></div>
    </div>
  </SectionCard>
</template>
