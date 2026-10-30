<script setup lang="ts">
// 리액트 VehicleInfoCard(detail/index.tsx). 차량 정보 카드 — 도이치 원본 / &facts=chotot / &facts=icons·mudah·icons-charancha / 기본 / 시안 폴백.
import { ref } from "vue";
import { asset, extraInfo, getActiveDetailCar, vehicleInfo } from "@proto/data";
import SectionCard from "./SectionCard.vue";
import FactValue from "./FactValue.vue";
import { carFactGroups, carFacts, chototFactRows, FACT_ICONS, FACTS_VISIBLE, FACTS_VISIBLE_ICONS, VEHICLE_INFO_TOTAL_LABEL } from "./detail-local";

const expanded = ref(false);
const car = getActiveDetailCar();
const facts = car ? carFacts(car) : [];
const factGroups = car ? carFactGroups(car) : [];
const factsMode = new URLSearchParams(window.location.search).get("facts");
const chototRows = car && factsMode === "chotot" ? chototFactRows(car, factGroups) : null;
const iconsMode = factsMode === "icons" || factsMode === "mudah" || factsMode === "icons-charancha";
</script>
<template>
  <SectionCard v-if="car?.deutschSource" title="차량 정보" class-name="vehicle-info-card">
    <dl class="detail-facts"><div v-for="[label, value] in facts" :key="label"><dt>{{ label }}</dt><dd>{{ value }}</dd></div></dl>
    <p>도이치오토월드 · {{ car.deutschSource.collectedAt }} 확인</p>
    <a class="detail-more" :href="car.deutschSource.url" target="_blank" rel="noreferrer">원본 매물 보기</a>
  </SectionCard>
  <SectionCard v-else-if="car && chototRows" title="차량 정보" class-name="vehicle-info-card is-facts-chotot">
    <div class="chotot-fact-groups">
      <section class="chotot-fact-group">
        <h3>차량 상태</h3>
        <dl><template v-for="(row, rowIndex) in chototRows.condition" :key="rowIndex"><div v-for="[label, factValue] in row" :key="`${rowIndex}-${label}`"><dt>{{ label }}</dt><dd>{{ factValue }}</dd></div></template></dl>
      </section>
      <section class="chotot-fact-group">
        <h3>기술 제원</h3>
        <dl><template v-for="(row, rowIndex) in chototRows.technical" :key="rowIndex"><div v-for="[label, factValue] in row" :key="`${rowIndex}-${label}`"><dt>{{ label }}</dt><dd><FactValue :label="label" :value="factValue" /></dd></div></template></dl>
      </section>
    </div>
  </SectionCard>
  <SectionCard v-else-if="car && iconsMode" title="차량 정보" class-name="vehicle-info-card is-facts-icons">
    <dl v-if="!expanded" :class="`detail-facts is-icons${factsMode === 'icons-charancha' ? ' is-charancha' : ''}`"><div v-for="[label, value] in facts.slice(0, FACTS_VISIBLE_ICONS)" :key="label"><img v-if="FACT_ICONS[label]" :src="asset(`bbm/detail-icons/${FACT_ICONS[label]}.svg`)" :data-icon="FACT_ICONS[label]" alt="" aria-hidden="true" :draggable="false" /><span v-else class="detail-fact-icon-gap" /><span class="detail-fact-text"><dt>{{ label }}</dt><dd><FactValue :label="label" :value="value" /></dd></span></div></dl>
    <div v-else class="detail-fact-groups">
      <section v-for="group in factGroups.filter((g) => g.title !== '차량 히스토리')" :key="group.title" :class="`detail-fact-group${group.basic ? ' is-basic' : ''}`">
        <h3>{{ group.title }}</h3>
        <dl><div v-for="[label, factValue] in group.rows" :key="label">
          <img v-if="group.basic && FACT_ICONS[label]" :src="asset(`bbm/detail-icons/${FACT_ICONS[label]}.svg`)" :data-icon="FACT_ICONS[label]" alt="" aria-hidden="true" :draggable="false" />
          <dt>{{ label }}</dt>
          <dd><FactValue :label="label" :value="factValue" /></dd>
        </div></dl>
      </section>
    </div>
    <button v-if="facts.length > FACTS_VISIBLE_ICONS" type="button" class="detail-more is-airbnb" :aria-expanded="expanded" @click="expanded = !expanded"><span>{{ expanded ? "차량 정보 접기" : `차량 정보 ${VEHICLE_INFO_TOTAL_LABEL}개 모두 보기` }}</span></button>
  </SectionCard>
  <SectionCard v-else-if="car" title="차량 정보" class-name="vehicle-info-card">
    <dl :class="`detail-facts${factsMode === 'left' ? ' is-left' : ''}`"><div v-for="[label, value] in (expanded ? facts : facts.slice(0, FACTS_VISIBLE))" :key="label"><dt>{{ label }}</dt><dd><FactValue :label="label" :value="value" /></dd></div></dl>
    <button v-if="facts.length > FACTS_VISIBLE" type="button" class="detail-more" :aria-expanded="expanded" @click="expanded = !expanded"><span>{{ expanded ? "정보 접기" : "정보 더보기" }}</span><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" :style="{ transformOrigin: '8px 8px', transform: expanded ? 'rotate(180deg)' : 'none' }" /></svg></button>
  </SectionCard>
  <SectionCard v-else title="차량 정보" class-name="vehicle-info-card">
    <dl class="vehicle-info-rows">
      <div v-for="[label, value] in (expanded ? [...vehicleInfo, ...extraInfo] : vehicleInfo)" :key="label"><dt>{{ label }}</dt><dd>{{ value }}</dd></div>
    </dl>
    <button class="vehicle-info-toggle" type="button" :aria-expanded="expanded" @click="expanded = !expanded">{{ expanded ? "접기" : "더보기" }}<img :class="expanded ? 'is-expanded' : ''" :src="asset('detail/vehicle-info-chevron.svg')" alt="" /></button>
  </SectionCard>
</template>
