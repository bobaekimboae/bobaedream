<script setup lang="ts">
// 리액트 DetailHighlights(detail/index.tsx). 차량 설명(Cars & Bids의 Highlights): 실제로 가진 값만으로 문장을 만든다.
import { ref } from "vue";
import { asset, getActiveDetailCar } from "@proto/data";
import { bbmCardSpec } from "@proto/data/bbm-card-samples";
import SectionCard from "./SectionCard.vue";
import { cleanValue } from "./detail-local";

const expanded = ref(false);
const car = getActiveDetailCar();
const lines: string[] = [];
if (car) {
  const fd = car.ferrariDetail;
  const yearText = bbmCardSpec(car, false).split(" · ")[0];
  const color = cleanValue(fd?.color ?? car.filter?.color);
  lines.push(`${yearText} ${car.title}${car.trim ? ` ${car.trim}` : ""}${color ? `, ${color} 외장` : ""} 차량입니다.`);
  if (car.filter?.mileage) lines.push(`주행거리는 ${car.filter.mileage.toLocaleString("ko-KR")}km이며 ${cleanValue(car.filter.fuel) || "연료 정보 없음"} 모델입니다.`);
  if (fd?.insurance) lines.push(`보험이력 조회 결과 내 차 피해 ${fd.insurance.own}건 · 상대 차 피해 ${fd.insurance.other}건, 소유자 변경 ${fd.insurance.owners}회, 번호판 변경 ${fd.insurance.plateChanges}회입니다.`);
  else if (fd) lines.push("등록된 보험이력 정보가 없어 직접 확인이 필요합니다.");
  if (fd?.options.length) lines.push(`판매자가 등록한 옵션은 ${fd.optionCount}개이며 주요 옵션은 ${fd.options.join(", ")} 등입니다.`);
  lines.push(`${car.place.split(" · ")[0]}에서 ${car.sellerType === "딜러" ? "매매업체" : "개인"}가 판매 중입니다. 실차 확인과 성능점검 기록부 확인 후 거래하세요.`);
}
const description = lines.join(" ");
</script>
<template>
  <SectionCard v-if="car" title="차량 설명" class-name="detail-highlights">
    <div :class="`detail-highlights-copy${expanded ? ' is-expanded' : ''}`">
      <p>{{ description }}</p>
    </div>
    <button v-if="lines.length > 2" class="detail-highlights-more" type="button" :aria-expanded="expanded" @click="expanded = !expanded">
      <span>{{ expanded ? "접기" : "더 보기" }}</span>
      <img :class="expanded ? 'is-expanded' : ''" :src="asset('icons/chotot/chotot-list-detail-dropdown-arrow-region-search.svg')" alt="" />
    </button>
  </SectionCard>
</template>
