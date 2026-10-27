<script setup lang="ts">
// 리액트 src/prototype/listing/maker-hierarchy-modal.tsx 의 MakerHierarchyModal
// onClose → emit("close"), onApply → emit("apply", maker, model, generation), onPreviewMaker → emit("previewMaker", maker)
// renderMakerLogo(ReactNode 를 돌려주는 함수) → 이름 있는 scoped slot "makerLogo"(slot props: { maker })
// formatModel 은 값을 돌려받으므로 함수 prop 그대로
// 원본은 mode 에 따라 BbmSheet / BbmModal 로 같은 본문을 감싼다 → 두 갈래에 같은 본문을 그린다.
import { computed, ref } from "vue";
import type { QuickGenerationOption, QuickModelVisual } from "@proto/data";
import type { MakerHierarchyOption } from "@proto/listing/maker-hierarchy-modal";
import BbmModal from "../filters/BbmModal.vue";
import BbmSheet from "../filters/BbmSheet.vue";
import CheckIcon from "../icons/CheckIcon.vue";
import ChevronRightIcon from "../icons/ChevronRightIcon.vue";
import Cross2Icon from "../icons/Cross2Icon.vue";
import MagnifyingGlassIcon from "../icons/MagnifyingGlassIcon.vue";
import "@proto/listing/maker-hierarchy-modal.css";

type Step = "maker" | "model" | "generation";

const props = defineProps<{
  mode: "modal" | "sheet";
  initialMaker: string | null;
  initialModel: string | null;
  initialGeneration: string | null;
  startStep?: Step;
  makers: MakerHierarchyOption[];
  modelsByMaker: Record<string, string[]>;
  modelVisualsByMaker: Record<string, Record<string, QuickModelVisual>>;
  generationsByMakerModel: Record<string, Record<string, QuickGenerationOption[]>>;
  formatModel: (name: string) => string;
}>();
const emit = defineEmits<{ close: []; apply: [maker: string | null, model: string | null, generation: string | null]; previewMaker: [maker: string] }>();
defineSlots<{ makerLogo?: (props: { maker: MakerHierarchyOption }) => unknown }>();

const numberFromCount = (value?: string) => value ? Number(value.replace(/[^0-9]/g, "")) || 0 : 0;
const formatCount = (value: number) => value.toLocaleString("ko-KR");

const inferStep = (maker: string | null, model: string | null, requested?: Step): Step => {
  if (requested === "maker") return "maker";
  if (!maker) return "maker";
  if (requested === "model") return "model";
  if (requested === "generation" && model) return "generation";
  return model ? "generation" : "model";
};

const step = ref<Step>(inferStep(props.initialMaker, props.initialModel, props.startStep));
const query = ref("");
const draftMaker = ref<string | null>(props.initialMaker);
const draftModel = ref<string | null>(props.initialModel);
const draftGeneration = ref<string | null>(props.initialGeneration);

const modelNames = computed(() => draftMaker.value ? props.modelsByMaker[draftMaker.value] ?? [] : []);
const modelVisuals = computed(() => draftMaker.value ? props.modelVisualsByMaker[draftMaker.value] ?? {} : {});
const generationsByModel = computed(() => draftMaker.value ? props.generationsByMakerModel[draftMaker.value] ?? {} : {});
const keyword = computed(() => query.value.trim().toLowerCase());
const visibleMakers = computed(() => props.makers.filter((maker) => !keyword.value || maker.name.toLowerCase().includes(keyword.value)));
const makerSections = computed(() => {
  const kinds = ["국산", "수입", "기타"];
  return kinds.map((kind) => ({
    key: kind,
    label: kind === "국산" ? "국산차" : kind === "수입" ? "수입차" : "기타",
    rows: visibleMakers.value.filter((maker) => (maker.kind ?? "기타") === kind),
  })).filter((section) => section.rows.length);
});
const modelRows = computed(() => modelNames.value.filter((name) => !keyword.value || props.formatModel(name).toLowerCase().includes(keyword.value)));
const generationRows = computed(() => draftModel.value ? (generationsByModel.value[draftModel.value] ?? []).filter((item) => (
  !keyword.value || `${item.cardLabel ?? item.displayLabel ?? item.name} ${item.cardSub ?? item.years}`.toLowerCase().includes(keyword.value)
)) : []);
const makerCount = (maker: string) => (props.modelsByMaker[maker] ?? []).reduce((sum, name) => (
  sum + numberFromCount(props.modelVisualsByMaker[maker]?.[name]?.count)
), 0);
const selectedGeneration = computed(() => draftModel.value && draftGeneration.value ? (generationsByModel.value[draftModel.value] ?? []).find((item) => item.name === draftGeneration.value) : undefined);
const modelCount = computed(() => draftModel.value ? numberFromCount(modelVisuals.value[draftModel.value]?.count) : modelNames.value.reduce((sum, name) => sum + numberFromCount(modelVisuals.value[name]?.count), 0));
const resultCount = computed(() => selectedGeneration.value?.count ?? modelCount.value);

const goMaker = () => { step.value = "maker"; query.value = ""; };
const goModel = () => { step.value = "model"; query.value = ""; draftModel.value = null; draftGeneration.value = null; };
const reset = () => { step.value = "maker"; query.value = ""; draftMaker.value = null; draftModel.value = null; draftGeneration.value = null; };
const chooseMaker = (maker: string) => {
  draftMaker.value = maker;
  draftModel.value = null;
  draftGeneration.value = null;
  step.value = "model";
  query.value = "";
  emit("previewMaker", maker);
};
const chooseModel = (name: string) => { draftModel.value = name; draftGeneration.value = null; step.value = "generation"; query.value = ""; };
const back = () => { if (step.value === "generation") goModel(); else if (step.value === "model") goMaker(); };
const title = computed(() => step.value === "maker" ? "제조사" : step.value === "model" ? `${draftMaker.value ?? ""} 모델` : props.formatModel(draftModel.value ?? "세부모델"));
const placeholder = computed(() => step.value === "maker" ? "제조사 검색" : step.value === "model" ? "모델 검색" : "세부모델 검색");
const apply = () => emit("apply", draftMaker.value, draftModel.value, draftGeneration.value);
const generationLabel = (item: QuickGenerationOption) => item.cardLabel ?? item.displayLabel ?? item.name;
</script>
<template>
  <component :is="mode === 'sheet' ? BbmSheet : BbmModal" :title="title" :variant="mode === 'sheet' ? undefined : 'vehicle-hierarchy'" flush :show-back="step !== 'maker'" @back="back" @close="emit('close')">
    <div class="maker-hierarchy" data-testid="maker-hierarchy">
      <label class="maker-hierarchy-search">
        <MagnifyingGlassIcon aria-hidden="true" />
        <input :value="query" :placeholder="placeholder" :aria-label="placeholder" @input="query = ($event.currentTarget as HTMLInputElement).value">
      </label>
      <div v-if="draftMaker" class="maker-hierarchy-path" aria-label="선택한 차량 경로">
        <button type="button" @click="goMaker">{{ draftMaker }} <Cross2Icon aria-hidden="true" /></button>
        <button v-if="draftModel" type="button" @click="goModel">{{ formatModel(draftModel) }} <Cross2Icon aria-hidden="true" /></button>
        <button v-if="selectedGeneration" type="button" @click="draftGeneration = null">{{ generationLabel(selectedGeneration) }} <Cross2Icon aria-hidden="true" /></button>
      </div>
      <div v-if="step === 'maker'" class="maker-hierarchy-maker-sections">
        <section v-for="section in makerSections" :key="section.key" class="maker-hierarchy-section">
          <p>{{ section.label }}</p>
          <button v-for="maker in section.rows" :key="maker.name" type="button" class="maker-hierarchy-row is-maker" :data-maker="maker.name" @click="chooseMaker(maker.name)">
            <span class="maker-hierarchy-logo"><slot name="makerLogo" :maker="maker" /></span>
            <span class="maker-hierarchy-copy"><strong>{{ maker.name }}</strong></span>
            <small>{{ formatCount(makerCount(maker.name)) }}</small>
            <ChevronRightIcon aria-hidden="true" />
          </button>
        </section>
        <p v-if="!visibleMakers.length" class="maker-hierarchy-empty">검색 결과가 없습니다.</p>
      </div>
      <section v-if="step === 'model'" class="maker-hierarchy-section is-list">
        <p>모델</p>
        <button v-for="name in modelRows" :key="name" type="button" class="maker-hierarchy-row is-vehicle" :data-model="name" @click="chooseModel(name)">
          <span :class="`maker-hierarchy-image is-${modelVisuals[name]?.bodyFit ?? 'width'}`"><img v-if="modelVisuals[name]?.image" :src="modelVisuals[name]?.image" alt="" :draggable="false"></span>
          <span class="maker-hierarchy-copy"><strong>{{ formatModel(name) }}</strong><em>{{ modelVisuals[name]?.bodyType ?? "중고차" }}</em></span>
          <small>{{ formatCount(numberFromCount(modelVisuals[name]?.count)) }}</small><ChevronRightIcon aria-hidden="true" />
        </button>
        <p v-if="!modelRows.length" class="maker-hierarchy-empty">등록된 모델이 없습니다.</p>
      </section>
      <section v-if="step === 'generation'" class="maker-hierarchy-section is-list">
        <p>세부모델</p>
        <button v-for="item in generationRows" :key="item.name" type="button" :class="`maker-hierarchy-row is-vehicle${draftGeneration === item.name ? ' is-selected' : ''}`" :data-generation="item.name" :aria-pressed="draftGeneration === item.name" @click="draftGeneration = item.name">
          <span :class="`maker-hierarchy-image is-${item.bodyFit ?? 'width'}`"><img v-if="item.image" :src="item.image" alt="" :draggable="false"></span>
          <span class="maker-hierarchy-copy"><strong>{{ generationLabel(item) }}</strong><em>{{ item.cardSub ?? item.years }}</em></span>
          <small>{{ formatCount(item.count ?? 0) }}</small><CheckIcon v-if="draftGeneration === item.name" aria-hidden="true" /><ChevronRightIcon v-else aria-hidden="true" />
        </button>
        <p v-if="!generationRows.length" class="maker-hierarchy-empty">세부모델 정보가 없습니다. 모델까지만 선택할 수 있습니다.</p>
      </section>
    </div>
    <template #footer>
      <div class="maker-hierarchy-actions">
        <button type="button" class="maker-hierarchy-reset" @click="reset">초기화</button>
        <button type="button" class="maker-hierarchy-confirm" :disabled="!draftMaker" @click="apply">{{ draftMaker ? `${formatCount(resultCount)}대 보기` : "제조사를 선택해 주세요" }}</button>
      </div>
    </template>
  </component>
</template>
