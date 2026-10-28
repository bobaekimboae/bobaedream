<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-panels.tsx 의 BbmExpandPanel — 사이드바 펼침형(바디타입 · 차급 · 연식 · 주행거리 · 가격 · 차량번호/판매자)
// onChange → emit("change", next). countOf 는 값을 돌려받으므로 함수 prop 그대로
import { computed } from "vue";
import { setBbmKeyword, setBbmRange, type BbmFilterValues, type BbmPriceTab } from "@proto/filters/bbm-filter-state";
import { months, years, type CountOf } from "../../lib/filters/bbm-filter-panels";
import BbmKeywordInput from "./BbmKeywordInput.vue";
import BbmSelectBox from "./BbmSelectBox.vue";
import BbmTabs from "./BbmTabs.vue";
import CheckList from "./CheckList.vue";
import MileageFinalPanel from "./MileageFinalPanel.vue";
import Presets from "./Presets.vue";
import RangeFields from "./RangeFields.vue";
import RangeSlider from "./RangeSlider.vue";

const props = withDefaults(defineProps<{ label: string; value: BbmFilterValues; countOf?: CountOf; variant?: "sidebar" | "chip"; mileageFinal?: boolean }>(), { variant: "sidebar", mileageFinal: false, countOf: undefined });
const emit = defineEmits<{ change: [next: BbmFilterValues] }>();
const change = (next: BbmFilterValues) => emit("change", next);
const priceTabs = ["일반", "리스 / 렌트"] as const;
const setPriceTab = (tab: BbmPriceTab) => emit("change", { ...props.value, priceTab: tab });

const year = computed(() => props.value.ranges.year ?? { min: "", max: "" });
const from = computed(() => { const [fromYear = "", fromMonth = ""] = year.value.min.split(" "); return { fromYear, fromMonth }; });
const to = computed(() => { const [toYear = "", toMonth = ""] = year.value.max.split(" "); return { toYear, toMonth }; });
const setYear = (key: "min" | "max", nextYear: string, nextMonth: string) => emit("change", setBbmRange(props.value, "year", { ...year.value, preset: undefined, [key]: [nextYear, nextMonth].filter(Boolean).join(" ") }));
</script>
<template>
  <!-- QF-117: 과쯔는 주행거리를 확정 시안(mileage-final)으로 — 입력 세로 · 듀얼 슬라이더 · 눈금 · 구간 칩 2열. 다른 모드는 아래 기존 그대로 -->
  <div v-if="label === '주행거리' && mileageFinal" class="bbmf-panel is-mileage-final"><MileageFinalPanel :value="value" layout="sidebar" @change="change" /></div>
  <div v-else-if="label === '바디타입' || label === '차급'" class="bbmf-panel"><CheckList :check-key="label === '바디타입' ? 'bodyType' : 'carClass'" size="sidebar" :value="value" :count-of="countOf" @change="change" /></div>
  <div v-else-if="label === '연식'" class="bbmf-panel">
    <div class="bbmf-period">
      <div><BbmSelectBox label="년" :value="from.fromYear" :options="years" @change="setYear('min', $event, from.fromMonth)" /><BbmSelectBox label="월" :value="from.fromMonth" :options="months" @change="setYear('min', from.fromYear, $event)" /><span class="bbmf-range-word">부터</span></div>
      <div><BbmSelectBox label="년" :value="to.toYear" :options="years" @change="setYear('max', $event, to.toMonth)" /><BbmSelectBox label="월" :value="to.toMonth" :options="months" @change="setYear('max', to.toYear, $event)" /><span class="bbmf-range-word">까지</span></div>
    </div>
    <div class="bbmf-panel-presets is-col-3"><Presets range-key="year" :value="value" @change="change" /></div>
  </div>
  <div v-else-if="label === '주행거리'" class="bbmf-panel"><RangeFields range-key="mileage" layout="stack" :value="value" @change="change" /><div class="bbmf-panel-presets"><Presets range-key="mileage" :value="value" @change="change" /></div></div>
  <!-- 상단 가격 칩 모달·시트(원본): 탭, [최저 만원] 부터 [최대 만원] 까지 한 줄, 슬라이더, 구간 칩 2열 10개 -->
  <div v-else-if="label === '가격' && variant === 'chip'" class="bbmf-price-chip">
    <BbmTabs label="가격 종류" :tabs="priceTabs" :value="value.priceTab" @change="setPriceTab" />
    <div class="bbmf-price-chip-fields"><RangeFields range-key="price" layout="pair" :value="value" @change="change" /></div>
    <RangeSlider range-key="price" :value="value" label="가격" />
    <Presets range-key="price" :value="value" @change="change" />
  </div>
  <div v-else-if="label === '가격'" class="bbmf-panel">
    <BbmTabs label="가격 종류" :tabs="priceTabs" :value="value.priceTab" @change="setPriceTab" />
    <div class="bbmf-panel-gap"><RangeFields range-key="price" layout="stack" :value="value" @change="change" /></div>
    <div class="bbmf-panel-presets"><Presets range-key="price" :value="value" @change="change" /></div>
  </div>
  <div v-else-if="label === '차량번호 / 판매자'" class="bbmf-panel"><BbmKeywordInput :value="value.keyword" placeholder="차량번호 / 판매자" @change="change(setBbmKeyword(value, $event))" /></div>
</template>
