<script setup lang="ts">
// 원본: src/ChoTotFilterSheet.tsx ChoTotFilterSheet
// 대응: onChange → emit change(next) · onClose → emit close · onReset → emit reset · onConfirm → emit confirm
// 같은 파일의 ChoTotQuickFilterSheet → components/ChoTotQuickFilterSheet.vue, 작은 부품들 → components/chotot-filter-sheet/
import { computed, onMounted, ref, watch } from "vue";
import LabelRow from "./chotot-filter-sheet/LabelRow.vue";
import FilterSection from "./chotot-filter-sheet/FilterSection.vue";
import ChoiceChips from "./chotot-filter-sheet/ChoiceChips.vue";
import VehicleCategoryChooser from "./chotot-filter-sheet/VehicleCategoryChooser.vue";
import MiniHeader from "./chotot-filter-sheet/MiniHeader.vue";
import PriceFields from "./chotot-filter-sheet/PriceFields.vue";
import type { ChoTotFilterFocus, ChoTotFilterState } from "@src/ChoTotFilterSheet";
import type { SellerType } from "@src/Prototype";
import { colorOptions, makerOptions, modelsByMaker, originOptions, uiAsset, type View } from "../lib/chotot-filter-internal";
import { syncControlled } from "../lib/controlled-input";
import "@src/chotot-filter.css";

const props = withDefaults(defineProps<{ value: ChoTotFilterState; resultCount: number; focus?: ChoTotFilterFocus | null }>(), { focus: null });
const emit = defineEmits<{ change: [value: ChoTotFilterState]; close: []; reset: []; confirm: [] }>();
const view = ref<View>("root");
const search = ref("");
const rootRef = ref<HTMLDivElement | null>(null);
const priceSummary = computed(() => props.value.price.min || props.value.price.max !== null
  ? `${props.value.price.min ? `${props.value.price.min.toLocaleString("ko-KR")}만원` : "최소"} ~ ${props.value.price.max === null ? "전체" : `${props.value.price.max.toLocaleString("ko-KR")}만원`}`
  : undefined);
void priceSummary; // 원본도 계산만 하고 쓰지 않는다
const selectedColors = computed(() => props.value.colors.join(", "));
const modelOptions = computed(() => props.value.maker ? modelsByMaker[props.value.maker] ?? [] : []);
const searchedModels = computed(() => modelOptions.value.filter((model) => model.toLowerCase().includes(search.value.toLowerCase())));

const onChange = (next: ChoTotFilterState) => emit("change", next);
const setValue = <K extends keyof ChoTotFilterState>(key: K, next: ChoTotFilterState[K]) => onChange({ ...props.value, [key]: next });
const chooseMaker = (maker: string) => onChange({ ...props.value, maker, model: null });
const chooseCategory = (category: string) => onChange({ ...props.value, category, maker: null, model: null });

const scrollToFocus = () => {
  if (!props.focus || view.value !== "root") return;
  rootRef.value?.querySelector<HTMLElement>(`[data-filter-focus="${props.focus}"]`)?.scrollIntoView({ block: "start" });
};
onMounted(scrollToFocus);
watch(() => [props.focus, view.value], scrollToFocus, { flush: "post" });

const toggleColor = (color: string) => setValue("colors", props.value.colors.includes(color) ? props.value.colors.filter((entry) => entry !== color) : [...props.value.colors, color]);
const onSearch = (event: Event) => { search.value = (event.currentTarget as HTMLInputElement).value; };
const onMileage = (event: Event) => { setValue("mileageMax", (event.currentTarget as HTMLInputElement).value); syncControlled(event, () => props.value.mileageMax); };
const openView = (next: View) => { search.value = ""; view.value = next; };
const chooseOrigin = (origin: string) => { setValue("origin", origin); search.value = ""; view.value = "root"; };
const chooseModel = (model: string) => { setValue("model", model); search.value = ""; view.value = "root"; };
</script>
<template>
  <div v-if="view === 'color'" class="chotot-filter-sheet chotot-nested-sheet">
    <MiniHeader title="색상" @back="view = 'root'" />
    <div class="chotot-nested-content"><label class="chotot-search"><img :src="uiAsset('notion-search.svg')" alt=""><input :value="search" placeholder="색상 검색" @input="onSearch"></label>
      <div class="chotot-check-list"><label v-for="color in colorOptions.filter((entry) => entry.includes(search))" :key="color"><span>{{ color }}</span><input type="checkbox" :checked="value.colors.includes(color)" @change="toggleColor(color)"></label></div>
    </div>
    <div class="chotot-nested-actions"><button type="button" @click="setValue('colors', [])">초기화</button><button type="button" @click="openView('root')">적용</button></div>
  </div>
  <div v-else-if="view === 'origin'" class="chotot-filter-sheet chotot-nested-sheet">
    <MiniHeader title="원산지" @back="view = 'root'" />
    <div class="chotot-nested-content"><label class="chotot-search"><img :src="uiAsset('notion-search.svg')" alt=""><input :value="search" placeholder="원산지 검색" @input="onSearch"></label>
      <div class="chotot-radio-list"><button v-for="origin in originOptions.filter((entry) => entry.includes(search))" :key="origin" type="button" @click="chooseOrigin(origin)"><span>{{ origin }}</span><i :class="value.origin === origin ? 'is-selected' : ''" /></button></div>
    </div>
    <div class="chotot-nested-actions"><button type="button" @click="setValue('origin', '전체'); view = 'root'">초기화</button></div>
  </div>
  <div v-else-if="view === 'model'" class="chotot-filter-sheet chotot-nested-sheet">
    <MiniHeader :title="value.maker ? `${value.maker} 모델` : '모델'" @back="view = 'root'" />
    <div class="chotot-nested-content"><label class="chotot-search"><img :src="uiAsset('notion-search.svg')" alt=""><input :value="search" placeholder="모델 검색" @input="onSearch"></label>
      <div class="chotot-radio-list"><button v-for="model in searchedModels" :key="model" type="button" @click="chooseModel(model)"><span>{{ model }}</span><i :class="value.model === model ? 'is-selected' : ''" /></button><p v-if="!value.maker" class="chotot-empty-copy">제조사를 먼저 선택하세요.</p></div>
    </div>
    <div class="chotot-nested-actions"><button type="button" @click="setValue('model', null); view = 'root'">초기화</button></div>
  </div>
  <div v-else ref="rootRef" class="chotot-filter-sheet">
    <header class="chotot-filter-header"><h2>필터</h2><button type="button" aria-label="필터 닫기" @click="emit('close')"><img :src="uiAsset('notion-close.svg')" alt=""></button></header>
    <div class="chotot-filter-scroll">
      <FilterSection title="차량 카테고리" focus="category"><VehicleCategoryChooser :value="value.category" @change="chooseCategory" /></FilterSection>
      <FilterSection title="가격" focus="price">
        <PriceFields :price="value.price" @change="(price) => setValue('price', price)" />
      </FilterSection>
      <FilterSection title="좌석 수" focus="seats"><ChoiceChips :options="['전체', '2인승', '4인승', '5인승', '6인승', '7인승 이상']" :value="value.seats" @change="(seats) => setValue('seats', seats)" /></FilterSection>
      <FilterSection title="제조사" focus="maker"><ChoiceChips :options="makerOptions" :value="value.maker ?? ''" @change="chooseMaker" /><LabelRow v-if="value.maker" label="모델" :summary="value.model ?? `${value.maker} 전체`" @click="openView('model')" /></FilterSection>
      <FilterSection title="연식" focus="year"><ChoiceChips :options="['전체', '2024~2026', '2021~2023', '2018~2020', '2017 이전']" :value="value.year" @change="(year) => setValue('year', year)" /></FilterSection>
      <FilterSection title="차량 상태" focus="condition"><ChoiceChips :options="['전체', '신차', '중고']" :value="value.condition" @change="(condition) => setValue('condition', condition)" /><label v-if="value.condition === '중고'" class="chotot-inline-field"><span>주행거리</span><input inputmode="numeric" :value="value.mileageMax" placeholder="최대 주행거리" @input="onMileage"><b>km 이하</b></label></FilterSection>
      <FilterSection title="소유자 수" focus="owners"><ChoiceChips :options="['전체', '1인', '2인', '3인 이상']" :value="value.owners" @change="(owners) => setValue('owners', owners)" /></FilterSection>
      <FilterSection title="변속기" focus="transmission"><ChoiceChips :options="['전체', '오토', '수동', 'CVT']" :value="value.transmission" @change="(transmission) => setValue('transmission', transmission)" /></FilterSection>
      <FilterSection title="연료" focus="fuel"><ChoiceChips :options="['전체', '가솔린', '디젤', '전기']" :value="value.fuel" @change="(fuel) => setValue('fuel', fuel)" /></FilterSection>
      <FilterSection title="색상" focus="color"><LabelRow label="외장 색상" :summary="selectedColors || undefined" @click="openView('color')" /></FilterSection>
      <FilterSection title="원산지" focus="origin"><LabelRow label="원산지" :summary="value.origin === '전체' ? undefined : value.origin" @click="openView('origin')" /></FilterSection>
      <FilterSection title="차체 유형" focus="body"><ChoiceChips :options="['전체', '세단', 'SUV', '해치백', '승합', '스포츠카']" :value="value.body" @change="(body) => setValue('body', body)" /></FilterSection>
      <FilterSection title="숏폼매물" focus="video"><button type="button" :class="`chotot-toggle-row${value.videoOnly ? ' is-on' : ''}`" role="switch" :aria-checked="value.videoOnly" @click="setValue('videoOnly', !value.videoOnly)"><span>숏폼이 있는 매물만 보기</span><i /></button></FilterSection>
      <FilterSection title="판매자" focus="seller"><ChoiceChips :options="['전체', '개인', '딜러']" :value="value.seller" @change="(seller) => setValue('seller', seller as SellerType)" /></FilterSection>
    </div>
    <footer class="chotot-filter-actions"><button type="button" @click="emit('reset')">초기화</button><button type="button" @click="emit('confirm')">{{ resultCount.toLocaleString("ko-KR") }}대 결과 보기</button></footer>
  </div>
</template>
