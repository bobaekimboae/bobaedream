<script setup lang="ts">
// 리액트 VehicleHistoryCard(detail/index.tsx).
import { getActiveDetailCar } from "@proto/data";
import SectionCard from "./SectionCard.vue";
import { carFactGroups } from "./detail-local";

const car = getActiveDetailCar();
const rows = car ? carFactGroups(car).find((group) => group.title === "차량 히스토리")?.rows ?? [] : [];
const deliveryLabels = new Set(["생산 공장", "출고일", "출고가격(옵션 미포함)", "출고가격(옵션 포함)", "정식/직수입 여부", "구입 딜러"]);
const saleLabels = new Set(["판매 방식", "매도비(관리비용)", "제시번호"]);
const conditionLabels = new Set(["수리이력", "사고이력"]);
const historyGroups = [
  { title: "출고·유통 정보", rows: rows.filter(([label]) => deliveryLabels.has(label)) },
  { title: "판매 정보", rows: rows.filter(([label]) => saleLabels.has(label)) },
  { title: "소유·권리 정보", rows: rows.filter(([label]) => !deliveryLabels.has(label) && !saleLabels.has(label) && !conditionLabels.has(label)) },
];
</script>
<template>
  <SectionCard v-if="car" title="차량 히스토리" class-name="vehicle-history-card">
    <div class="vehicle-history-groups">
      <section v-for="group in historyGroups" :key="group.title" class="vehicle-history-group">
        <h3>{{ group.title }}</h3>
        <dl class="vehicle-history-grid">
          <div v-for="[label, value] in group.rows" :key="label"><dt>{{ label }}</dt><dd>{{ value }}</dd></div>
        </dl>
      </section>
    </div>
  </SectionCard>
</template>
