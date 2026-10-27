<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-panels.tsx 의 BbmModalPanel — 모달형 20개 안쪽
// onChange → emit("change", next). countOf 는 값을 돌려받으므로 함수 prop 그대로
import { computed, ref } from "vue";
import { bikeNeighborhoodsForDistrict } from "@proto/data";
import { bbmAdPeriods, bbmCheckOptions, bbmOptionGroups, type BbmFilterItem } from "@proto/filters/bbm-filter-options";
import { setBbmAdPeriod, setBbmChecks, toggleBbmCheck, type BbmFilterValues, type BbmRangeKey } from "@proto/filters/bbm-filter-state";
import { exteriorSwatches, originalCount, seatSwatches, type CountOf } from "../../lib/filters/bbm-filter-panels";
import BbmCheckGrid from "./BbmCheckGrid.vue";
import BbmCheckRow from "./BbmCheckRow.vue";
import BbmChoiceGrid from "./BbmChoiceGrid.vue";
import BbmColorChips from "./BbmColorChips.vue";
import BbmSelectBox from "./BbmSelectBox.vue";
import BbmTabs from "./BbmTabs.vue";
import BikeGenreList from "./BikeGenreList.vue";
import CheckList from "./CheckList.vue";
import Presets from "./Presets.vue";
import RangeFields from "./RangeFields.vue";
import RangeSlider from "./RangeSlider.vue";
import SellerTypeList from "./SellerTypeList.vue";

const props = withDefaults(defineProps<{ item: BbmFilterItem; value: BbmFilterValues; countOf?: CountOf }>(), { countOf: undefined });
const emit = defineEmits<{ change: [next: BbmFilterValues] }>();
const change = (next: BbmFilterValues) => emit("change", next);
const optionTab = ref(bbmOptionGroups[0][0]);
const sectionRefs: Record<string, HTMLElement | null> = {};
const optionTabs = bbmOptionGroups.map(([name]) => name);
const sizeSections = [["전장", "length"], ["전폭", "width"], ["전고", "height"]] as Array<[string, BbmRangeKey]>;

// 바이크 지역
const province = computed(() => props.value.checks.region?.[0] ?? "");
const districtPath = computed(() => props.value.checks.district?.[0] ?? "");
const district = computed(() => districtPath.value.split(" ").slice(1).join(" "));
const neighborhood = computed(() => (props.value.checks.neighborhood?.[0] ?? "").split(" ").slice(2).join(" "));
const districts = computed(() => province.value
  ? bbmCheckOptions.district.filter((option) => option.startsWith(`${province.value} `)).map((option) => option.slice(province.value.length + 1))
  : []);
const neighborhoods = computed(() => districtPath.value ? bikeNeighborhoodsForDistrict(districtPath.value) : []);
const provinces = bbmCheckOptions.region.filter((option) => option !== "전남광주");
const chooseProvince = (next: string) => {
  let out = setBbmChecks(props.value, "region", next ? [next] : []);
  out = setBbmChecks(out, "district", []);
  change(setBbmChecks(out, "neighborhood", []));
};
const chooseDistrict = (next: string) => {
  const path = province.value && next ? `${province.value} ${next}` : "";
  let out = setBbmChecks(props.value, "district", path ? [path] : []);
  out = setBbmChecks(out, "neighborhood", []);
  change(out);
};
const chooseNeighborhood = (next: string) => change(setBbmChecks(props.value, "neighborhood", districtPath.value && next ? [`${districtPath.value} ${next}`] : []));
const pickOptionTab = (tab: string) => { optionTab.value = tab; sectionRefs[tab]?.scrollIntoView({ block: "start", behavior: "smooth" }); };
const setSectionRef = (group: string) => (element: unknown) => { sectionRefs[group] = (element as HTMLElement | null) ?? null; };
</script>
<template>
  <div v-if="item.label === '바이크 지역'" class="bbmf-region-depth">
    <section><h4 class="bbmf-section-title">시/도</h4><BbmSelectBox label="시/도 선택" :value="province" :options="provinces" @change="chooseProvince" /></section>
    <section><h4 class="bbmf-section-title">시/군/구</h4><BbmSelectBox label="시/군/구 선택" :value="district" :options="districts" @change="chooseDistrict" /></section>
    <section><h4 class="bbmf-section-title">동·읍·면</h4><BbmSelectBox label="동·읍·면 선택" :value="neighborhood" :options="neighborhoods" @change="chooseNeighborhood" /></section>
  </div>
  <BbmColorChips v-else-if="item.label === '외부색상'" :options="bbmCheckOptions.exteriorColor" :swatches="exteriorSwatches" :selected="value.checks.exteriorColor ?? []" @toggle="change(toggleBbmCheck(value, 'exteriorColor', $event))" />
  <div v-else-if="item.label === '시트색상'" class="bbmf-sections">
    <section><h4 class="bbmf-section-title is-muted">시트 색상</h4><BbmColorChips :options="bbmCheckOptions.seatColor" :swatches="seatSwatches" :selected="value.checks.seatColor ?? []" @toggle="change(toggleBbmCheck(value, 'seatColor', $event))" /></section>
    <section><h4 class="bbmf-section-title is-muted">시트 마감</h4><BbmColorChips :options="bbmCheckOptions.seatFinish" :selected="value.checks.seatFinish ?? []" @toggle="change(toggleBbmCheck(value, 'seatFinish', $event))" /></section>
  </div>
  <BbmChoiceGrid v-else-if="item.label === '변속기'" :options="bbmCheckOptions.transmission" :selected="value.checks.transmission ?? []" @toggle="change(toggleBbmCheck(value, 'transmission', $event))" />
  <BikeGenreList v-else-if="item.checkKey === 'bikeGenre'" :value="value" :count-of="countOf" @change="change" />
  <BbmChoiceGrid v-else-if="item.label === '광고기간'" size="lg" first-full :options="bbmAdPeriods" :selected="[value.adPeriod]" @toggle="change(setBbmAdPeriod(value, $event))" />
  <!-- 왼쪽 세로 탭 → 오른쪽 목록의 해당 섹션으로 이동(원본처럼 한 목록 안에 여섯 섹션) -->
  <div v-else-if="item.label === '옵션'" class="bbmf-options">
    <BbmTabs variant="side" label="옵션 분류" :tabs="optionTabs" :value="optionTab" @change="pickOptionTab" />
    <div class="bbmf-options-list">
      <section v-for="[group, list] in bbmOptionGroups" :key="group" :ref="setSectionRef(group)">
        <h4 class="bbmf-section-title is-option">{{ group }}</h4>
        <BbmCheckGrid><BbmCheckRow v-for="option in list" :key="option" size="option" :label="option" :count="originalCount('options', option)" :checked="Boolean(value.checks.options?.includes(option))" @toggle="change(toggleBbmCheck(value, 'options', option))" /></BbmCheckGrid>
      </section>
    </div>
  </div>
  <div v-else-if="item.label === '크기'" class="bbmf-sections is-size">
    <section v-for="[title, rangeKey] in sizeSections" :key="title"><h4 class="bbmf-section-title">{{ title }}</h4><RangeFields :range-key="rangeKey" unit="mm" layout="inline" :value="value" @change="change" /><RangeSlider :range-key="rangeKey" :value="value" :label="title" /></section>
  </div>
  <div v-else-if="item.rangeKey"><RangeFields :range-key="item.rangeKey" layout="inline" :value="value" @change="change" /><RangeSlider :range-key="item.rangeKey" :value="value" :label="item.label" /><Presets :range-key="item.rangeKey" :value="value" @change="change" /></div>
  <SellerTypeList v-else-if="item.checkKey === 'sellerKind'" :value="value" :count-of="countOf" @change="change" />
  <CheckList v-else-if="item.checkKey" :check-key="item.checkKey" :columns="item.columns ?? 1" :value="value" :count-of="countOf" @change="change" />
</template>
