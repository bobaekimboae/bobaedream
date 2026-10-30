<script setup lang="ts">
// 원본: src/ChoTotFilterSheet.tsx ChoTotQuickFilterSheet
// 대응: onChange → emit change(next) · onClose → emit close · onConfirm → emit confirm
import { computed, ref } from "vue";
import ChoiceChips from "./chotot-filter-sheet/ChoiceChips.vue";
import VehicleCategoryChooser from "./chotot-filter-sheet/VehicleCategoryChooser.vue";
import PriceFields from "./chotot-filter-sheet/PriceFields.vue";
import type { ChoTotFilterFocus, ChoTotFilterState } from "@src/ChoTotFilterSheet";
import type { SellerType } from "@src/Prototype";
import { colorOptions, makerOptions, modelsByMaker, originOptions, quickFilterTitles, uiAsset } from "../lib/chotot-filter-internal";
import { syncControlled } from "../lib/controlled-input";
import "@src/chotot-filter.css";

const props = defineProps<{ focus: ChoTotFilterFocus; value: ChoTotFilterState; resultCount: number }>();
const emit = defineEmits<{ change: [value: ChoTotFilterState]; close: []; confirm: [] }>();
const modelSearch = ref("");
const onChange = (next: ChoTotFilterState) => emit("change", next);
const setValue = <K extends keyof ChoTotFilterState>(key: K, next: ChoTotFilterState[K]) => onChange({ ...props.value, [key]: next });
const chooseCategory = (next: string) => onChange({ ...props.value, category: next, maker: null, model: null });
const reset = () => {
  const { focus, value } = props;
  if (focus === "category") setValue("category", "전체");
  else if (focus === "price") onChange({ ...value, price: { mode: "cash", min: 0, max: null } });
  else if (focus === "seats") setValue("seats", "전체");
  else if (focus === "maker") onChange({ ...value, maker: null, model: null });
  else if (focus === "model") setValue("model", null);
  else if (focus === "year") setValue("year", "전체");
  else if (focus === "condition") onChange({ ...value, condition: "전체", mileageMax: "" });
  else if (focus === "mileage") setValue("mileageMax", "");
  else if (focus === "owners") setValue("owners", "전체");
  else if (focus === "transmission") setValue("transmission", "전체");
  else if (focus === "fuel") setValue("fuel", "전체");
  else if (focus === "color") setValue("colors", []);
  else if (focus === "origin") setValue("origin", "전체");
  else if (focus === "body") setValue("body", "전체");
  else if (focus === "video") setValue("videoOnly", false);
  else setValue("seller", "전체");
};
const title = computed(() => quickFilterTitles[props.focus]);
const modelOptions = computed(() => props.value.maker ? modelsByMaker[props.value.maker] ?? [] : []);
const searchedModels = computed(() => modelOptions.value.filter((model) => model.toLowerCase().includes(modelSearch.value.toLowerCase())));
const tall = computed(() => ["category", "maker", "model", "color", "origin"].includes(props.focus));
const toggleColor = (color: string) => setValue("colors", props.value.colors.includes(color) ? props.value.colors.filter((entry) => entry !== color) : [...props.value.colors, color]);
const onMileage = (event: Event) => { setValue("mileageMax", (event.currentTarget as HTMLInputElement).value.replaceAll(",", "")); syncControlled(event, () => props.value.mileageMax); };
const onModelSearch = (event: Event) => { modelSearch.value = (event.currentTarget as HTMLInputElement).value; };
</script>
<template>
  <div :class="`chotot-filter-sheet chotot-quick-sheet${tall ? ' is-tall' : ''}`" :data-quick-filter="focus">
    <header :class="`chotot-filter-header${focus === 'category' ? ' is-category-header' : ''}`">
      <button v-if="focus === 'category'" type="button" :aria-label="`${title} 닫기`" @click="emit('close')"><img :src="uiAsset('notion-close.svg')" alt=""></button>
      <h2>{{ title }}</h2>
      <span v-if="focus === 'category'" aria-hidden="true" />
      <button v-else type="button" :aria-label="`${title} 닫기`" @click="emit('close')"><img :src="uiAsset('notion-close.svg')" alt=""></button>
    </header>
    <div class="chotot-filter-scroll">
      <section class="chotot-filter-section chotot-quick-section">
        <VehicleCategoryChooser v-if="focus === 'category'" :value="value.category" @change="chooseCategory" />
        <PriceFields v-if="focus === 'price'" :price="value.price" @change="(price) => setValue('price', price)" />
        <ChoiceChips v-if="focus === 'seats'" :options="['전체', '2인승', '4인승', '5인승', '6인승', '7인승 이상']" :value="value.seats" @change="(next) => setValue('seats', next)" />
        <ChoiceChips v-if="focus === 'maker'" :options="makerOptions" :value="value.maker ?? ''" @change="(next) => onChange({ ...value, maker: next, model: null })" />
        <template v-if="focus === 'model'"><label v-if="value.maker" class="chotot-search"><img :src="uiAsset('notion-search.svg')" alt=""><input :value="modelSearch" :placeholder="`${value.maker} 모델 검색`" @input="onModelSearch"></label><div class="chotot-radio-list"><template v-if="value.maker"><button v-for="model in searchedModels" :key="model" type="button" @click="setValue('model', model)"><span>{{ model }}</span><i :class="value.model === model ? 'is-selected' : ''" /></button></template><p v-else class="chotot-empty-copy">제조사를 먼저 선택하세요.</p></div></template>
        <ChoiceChips v-if="focus === 'year'" :options="['전체', '2024~2026', '2021~2023', '2018~2020', '2017 이전']" :value="value.year" @change="(next) => setValue('year', next)" />
        <ChoiceChips v-if="focus === 'condition'" :options="['전체', '신차', '중고']" :value="value.condition" @change="(next) => setValue('condition', next)" />
        <label v-if="focus === 'mileage'" class="chotot-inline-field chotot-mileage-field"><span>최대 주행거리</span><input inputmode="numeric" :value="value.mileageMax" placeholder="예: 50,000" @input="onMileage"><b>km 이하</b></label>
        <ChoiceChips v-if="focus === 'owners'" :options="['전체', '1인', '2인', '3인 이상']" :value="value.owners" @change="(next) => setValue('owners', next)" />
        <ChoiceChips v-if="focus === 'transmission'" :options="['전체', '오토', '수동', 'CVT']" :value="value.transmission" @change="(next) => setValue('transmission', next)" />
        <ChoiceChips v-if="focus === 'fuel'" :options="['전체', '가솔린', '디젤', '전기']" :value="value.fuel" @change="(next) => setValue('fuel', next)" />
        <div v-if="focus === 'color'" class="chotot-check-list"><label v-for="color in colorOptions" :key="color"><span>{{ color }}</span><input type="checkbox" :checked="value.colors.includes(color)" @change="toggleColor(color)"></label></div>
        <div v-if="focus === 'origin'" class="chotot-radio-list"><button v-for="origin in originOptions" :key="origin" type="button" @click="setValue('origin', origin)"><span>{{ origin }}</span><i :class="value.origin === origin ? 'is-selected' : ''" /></button></div>
        <ChoiceChips v-if="focus === 'body'" :options="['전체', '세단', 'SUV', '해치백', '승합', '스포츠카']" :value="value.body" @change="(next) => setValue('body', next)" />
        <button v-if="focus === 'video'" type="button" :class="`chotot-toggle-row${value.videoOnly ? ' is-on' : ''}`" role="switch" :aria-checked="value.videoOnly" @click="setValue('videoOnly', !value.videoOnly)"><span>숏폼이 있는 매물만 보기</span><i /></button>
        <ChoiceChips v-if="focus === 'seller'" :options="['전체', '개인', '딜러']" :value="value.seller" @change="(next) => setValue('seller', next as SellerType)" />
      </section>
    </div>
    <footer class="chotot-filter-actions"><button type="button" @click="reset">초기화</button><button type="button" @click="emit('confirm')">{{ resultCount.toLocaleString("ko-KR") }}대 결과 보기</button></footer>
  </div>
</template>
