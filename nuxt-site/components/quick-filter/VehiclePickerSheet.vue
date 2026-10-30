<script setup lang="ts">
// 리액트 src/prototype/quick-filter/index.tsx 의 VehiclePickerSheet
// onApply → emit("apply", maker, model, generation)
// renderMakerLogo(option) → 범위 slot "maker-logo"(#maker-logo="{ option }"). 슬롯을 넘기면 리액트에서 renderMakerLogo 를 준 것과 같다(has-kr-logo).
import { computed, ref, useSlots, watch } from "vue";
import {
  compactGenerationCardYearLabel,
  formatModelLabel,
  generationCardLabel,
  quickGenerationsByMakerModel,
  quickModelVisualsByMaker,
  quickModelsByMaker,
  toTrimOption,
  type BrandRailOption,
  type QuickGenerationOption,
  type QuickModelVisual,
} from "@proto/data";
import BrandRailMark from "./BrandRailMark.vue";

const props = withDefaults(defineProps<{
  maker: string | null;
  model: string | null;
  generation: string | null;
  makerOptions: BrandRailOption[];
  // QF-097: 과쯔 모드만 카탈로그 모델·세부 모델을 넘긴다. 없으면 기존 데이터(초톳·동처띠 그대로)
  modelsByMaker?: Record<string, string[]>;
  generationsByMakerModel?: Record<string, Record<string, QuickGenerationOption[]>>;
  modelVisualsByMaker?: Record<string, Record<string, QuickModelVisual>>;
}>(), {
  modelsByMaker: () => quickModelsByMaker,
  generationsByMakerModel: () => quickGenerationsByMakerModel,
  modelVisualsByMaker: () => quickModelVisualsByMaker,
});
const emit = defineEmits<{ apply: [maker: string | null, model: string | null, generation: string | null] }>();
// QF-096: 과쯔 모드만 넘긴다 — 제조사 이름 앞 로고(24×24). 없으면 기존 로고(초톳·동처띠 그대로)
const slots = useSlots();
const hasMakerLogo = computed(() => Boolean(slots["maker-logo"]));

const draftMaker = ref<string | null>(props.maker);
const draftModel = ref<string | null>(props.model);
const draftGeneration = ref<string | null>(props.generation);
const modelOptions = computed(() => (draftMaker.value ? props.modelsByMaker[draftMaker.value] ?? [] : []));
const generationOptions = computed(() => (draftMaker.value && draftModel.value ? props.generationsByMakerModel[draftMaker.value]?.[draftModel.value] ?? [] : []));
const generationEmptyText = computed(() => (draftModel.value ? "세대 정보 없음" : "모델을 먼저 선택하세요."));
const visibleMakerOptions = computed(() => props.makerOptions.filter((option) => option.maker));

watch([() => props.maker, () => props.model, () => props.generation], () => {
  draftMaker.value = props.maker;
  draftModel.value = props.model;
  draftGeneration.value = props.generation;
});

const chooseMaker = (nextMaker: string | null) => {
  draftMaker.value = nextMaker;
  draftModel.value = null;
  draftGeneration.value = null;
};
const chooseModel = (nextModel: string | null) => {
  draftModel.value = nextModel;
  draftGeneration.value = null;
};
const modelDisabled = (option: string) => props.modelVisualsByMaker[draftMaker.value ?? ""]?.[option]?.count === "0대";
const generationDisabled = (option: QuickGenerationOption) => (option.count ?? option.variants.reduce((sum, variant) => sum + toTrimOption(variant).count, 0)) === 0;
</script>
<template>
  <div class="vehicle-picker-sheet">
    <section class="vehicle-picker-section">
      <h3>제조사</h3>
      <div :class="`vehicle-picker-grid is-makers${hasMakerLogo ? ' has-kr-logo' : ''}`">
        <button v-for="option in visibleMakerOptions" :key="option.name" type="button" :class="draftMaker === option.maker ? 'is-selected' : ''" :aria-pressed="draftMaker === option.maker" @click="chooseMaker(option.maker ?? null)">
          <slot v-if="hasMakerLogo" name="maker-logo" :option="option" />
          <BrandRailMark v-else :option="option" />
          <span>{{ option.name }}</span>
        </button>
      </div>
    </section>
    <section class="vehicle-picker-section">
      <h3>모델</h3>
      <div class="vehicle-picker-grid">
        <template v-if="modelOptions.length">
          <button v-for="option in modelOptions" :key="option" type="button" :class="draftModel === option ? 'is-selected' : ''" :aria-pressed="draftModel === option" :disabled="modelDisabled(option)" @click="chooseModel(option)">{{ formatModelLabel(option) }}</button>
        </template>
        <p v-else>제조사를 먼저 선택하세요.</p>
      </div>
    </section>
    <section class="vehicle-picker-section">
      <h3>세대</h3>
      <div class="vehicle-picker-grid is-generations">
        <template v-if="generationOptions.length">
          <button v-for="option in generationOptions" :key="option.name" type="button" :class="draftGeneration === option.name ? 'is-selected' : ''" :aria-pressed="draftGeneration === option.name" :disabled="generationDisabled(option)" @click="draftGeneration = option.name">
            <strong>{{ generationCardLabel(option) }}</strong>
            <small>{{ option.cardSub ?? compactGenerationCardYearLabel(option.years) }}</small>
          </button>
        </template>
        <p v-else>{{ generationEmptyText }}</p>
      </div>
    </section>
    <div class="vehicle-picker-actions">
      <button type="button" class="vehicle-picker-reset" @click="chooseMaker(null)">초기화</button>
      <button type="button" class="vehicle-picker-apply" @click="emit('apply', draftMaker, draftModel, draftGeneration)">적용</button>
    </div>
  </div>
</template>
