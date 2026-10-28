<script setup lang="ts">
// 리액트 OptionsCard(detail/index.tsx). 실매물인데 ferrariDetail 이 없으면 그리지 않는다.
import { ref } from "vue";
import { asset, getActiveDetailCar, optionItems } from "@proto/data";
import SectionCard from "./SectionCard.vue";
import { pcAsset } from "./detail-local";

withDefaults(defineProps<{ desktop?: boolean }>(), { desktop: false });
const expanded = ref(false);
const hasCar = !!getActiveDetailCar();
const fd = getActiveDetailCar()?.ferrariDetail;
const ferrariIconByKeyword: Array<[string, string]> = [
  ["후방카메라", "option-04.png"],
  ["주차감지", "option-03.png"],
  ["LED헤드램프", "option-02.png"],
  ["스마트키", "option-smart-key.png"],
  ["열선시트", "option-08.png"],
  ["전동시트", "option-09.png"],
  ["가죽시트", "option-06.png"],
];
const ferrariOptions = fd
  ? fd.options.map((label) => ({
    label,
    icon: ferrariIconByKeyword.find(([keyword]) => label.includes(keyword))?.[1] ?? "option-06.png",
  }))
  : [];
const normalizedFerrariLabels = new Set(ferrariOptions.map(({ label }) => label.replace(/\s+/g, "")));
const options = fd
  ? [
    ...ferrariOptions,
    ...optionItems.filter(({ label }) => !normalizedFerrariLabels.has(label.replace(/\s+/g, ""))),
  ]
  : optionItems;
const previewCount = Math.min(8, options.length);
const canToggle = options.length > previewCount;
</script>
<template>
  <SectionCard v-if="!(hasCar && !fd)" title="차량 옵션" class-name="airbnb-options-card">
    <ul class="option-amenity-list">
      <li v-for="({ label, icon }, index) in (expanded ? options : options.slice(0, previewCount))" :key="label">
        <img :src="!fd && desktop ? pcAsset(`9653-img${index + 1}.png`) : asset(`detail/${icon}`)" alt="" :draggable="false" />
        <span>{{ label }}</span>
      </li>
    </ul>
    <button v-if="canToggle" class="option-amenity-toggle" type="button" :aria-expanded="expanded" @click="expanded = !expanded">{{ expanded ? "옵션 간단히 보기" : `주요 옵션 ${options.length}개 모두 보기` }}</button>
    <p v-if="fd" class="detail-real-note option-amenity-note">판매자 등록 옵션 {{ fd.optionCount }}개 중 확인된 주요 옵션입니다.</p>
  </SectionCard>
</template>
