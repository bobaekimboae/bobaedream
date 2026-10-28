<script setup lang="ts">
// 원본: src/prototype/listing/pc-bbmuseum.tsx BbMakerGradeFilter
// PC 좌측 필터 제조사 → 모델 → 세부모델 → 등급 드릴다운. 선택 상태는 목록 화면(퀵필터와 같은 원본)에서 받아서 읽고 쓴다.
// 대응: setView(view) 콜백 → emit setView(view). selection 객체 안의 onXxx 함수는 데이터 그대로 부른다.
import { computed, ref } from "vue";
import BbAssetIcon from "./BbAssetIcon.vue";
import BbCatalogCount from "./BbCatalogCount.vue";
import BbCatalogCheck from "./BbCatalogCheck.vue";
import CategoryBrandLogo from "./CategoryBrandLogo.vue";
import { bbCatalog, bbMakerLabel, type BbMakerSection, type BbMakerSelection, type BbModelRow } from "@proto/listing/pc-bbmuseum";
import { popularModelsByMaker, type BbDrillView } from "../../lib/listing/pc-bbmuseum-internal";
import { useHalfRowFit } from "../../composables/listing/useHalfRowFit";

const props = withDefaults(defineProps<{ selection: BbMakerSelection; view: BbDrillView; brandLogos?: boolean; brandLogoCategory?: string; makerSections?: BbMakerSection[]; referenceStyle?: boolean; showInventoryCounts?: boolean; allowEmptyOptions?: boolean }>(), {
  brandLogos: false,
  brandLogoCategory: undefined,
  makerSections: () => bbCatalog,
  referenceStyle: false,
  showInventoryCounts: true,
  allowEmptyOptions: false,
});
const emit = defineEmits<{ setView: [view: BbDrillView] }>();
const setView = (view: BbDrillView) => emit("setView", view);

const catalogRef = ref<HTMLDivElement | null>(null);
// 차란차 원본은 제조사 → 모델 → 세부모델 → 등급 화면이 바뀔 때마다
// 같은 500px 목록 상자를 맨 위에서 다시 시작한다. 이전 단계의 scrollTop을
// 유지하면 짧아진 다음 목록의 중간/끝으로 브라우저가 보정해 화면이 꼬인다.
useHalfRowFit(catalogRef, () => props.referenceStyle, () => [props.view], () => {
  if (props.referenceStyle && catalogRef.value) catalogRef.value.scrollTop = 0;
});

type PathRow = { key: string; label: string; sublabel?: string | null; onOpen: () => void; onClear: () => void };
const pathRows = computed(() => {
  const { selection } = props;
  const { maker, model } = selection;
  const rows: Array<PathRow | null> = [
    maker ? { key: "maker", label: bbMakerLabel(maker), onOpen: () => setView({ stage: "maker" }), onClear: selection.onClearMaker } : null,
    maker && model ? { key: "model", label: selection.modelLabel ?? model, onOpen: () => setView({ stage: "model", maker }), onClear: selection.onClearModel } : null,
    maker && model && selection.generation ? { key: "generation", label: selection.generationLabel ?? selection.generation, sublabel: selection.generationYears ?? null, onOpen: () => setView({ stage: "generation", maker, model }), onClear: selection.onClearGrades } : null,
  ];
  return rows.filter((row): row is PathRow => Boolean(row));
});
const modelRows = computed(() => props.view.stage === "model" ? props.selection.modelsFor(props.view.maker) : []);
const popularRows = computed(() => {
  const view = props.view;
  const popularNames = view.stage === "model" ? popularModelsByMaker[view.maker] ?? [] : [];
  return props.referenceStyle ? [] : popularNames.map((name) => modelRows.value.find((row) => row.name === name || row.label === name)).filter((row): row is BbModelRow => Boolean(row));
});
const compactReferenceYears = (years?: string | null) => years?.replace(/\d{2}(\d{2})/g, "$1년").replace("~현재", "~현재");
const chooseModelRow = (makerName: string, row: BbModelRow) => {
  if (props.selection.maker !== makerName || props.selection.model !== row.name) props.selection.onChooseModel(row.name);
  setView({ stage: "generation", maker: makerName, model: row.name });
};
const chooseMaker = (key: string) => {
  if (props.selection.maker !== key) props.selection.onChooseMaker(key);
  setView({ stage: "model", maker: key });
};
const generationGroups = computed(() => props.view.stage === "generation" ? props.selection.gradeGroupsFor(props.view.maker, props.view.model).filter((group) => Boolean(group.name)) : []);
const chooseGeneration = (generationName: string) => {
  const view = props.view;
  if (view.stage !== "generation") return;
  if (props.selection.generation !== generationName) props.selection.onChooseGeneration?.(generationName);
  setView({ stage: "grade", maker: view.maker, model: view.model, generation: generationName });
};

// 등급 단계
const gradeView = computed(() => props.view.stage === "grade" ? props.view : null);
const tree = computed(() => gradeView.value ? props.selection.gradeTreeFor?.(gradeView.value.generation) ?? [] : []);
const treeRows = computed(() => {
  const { selection } = props;
  const grades = selection.grades;
  return tree.value.map((fuel) => {
    const fuelTokens = fuel.grades.flatMap((grade) => grade.subgrades.map((subgrade) => subgrade.token));
    const fuelCheckedCount = fuelTokens.filter((token) => grades.includes(token)).length;
    const independentFuelSelection = Boolean(selection.gradeLevels && selection.onToggleGradeLevel);
    const fuelChecked = independentFuelSelection ? selection.gradeLevels!.includes(fuel.id) : fuelCheckedCount > 0 && fuelCheckedCount === fuelTokens.length;
    const fuelMixed = independentFuelSelection ? false : fuelCheckedCount > 0 && !fuelChecked;
    return {
      fuel, fuelTokens, fuelChecked, fuelMixed, independentFuelSelection,
      grades: fuel.grades.map((grade) => {
        const gradeTokens = grade.subgrades.map((subgrade) => subgrade.token);
        const gradeCheckedCount = gradeTokens.filter((token) => grades.includes(token)).length;
        const independentGradeSelection = Boolean(selection.gradeGroups && selection.onToggleGradeGroup);
        const gradeChecked = independentGradeSelection ? selection.gradeGroups!.includes(grade.id) : gradeCheckedCount > 0 && gradeCheckedCount === gradeTokens.length;
        const gradeMixed = independentGradeSelection ? false : gradeCheckedCount > 0 && !gradeChecked;
        return { grade, gradeTokens, gradeChecked, gradeMixed, independentGradeSelection, subgrades: grade.subgrades.map((subgrade) => ({ subgrade, checked: grades.includes(subgrade.token) })) };
      }),
    };
  });
});
const flatGroup = computed(() => gradeView.value ? props.selection.gradeGroupsFor(gradeView.value.maker, gradeView.value.model).find((item) => item.name === gradeView.value!.generation) : undefined);
const generation = () => gradeView.value?.generation ?? "";
const toggleFuel = (row: (typeof treeRows.value)[number]) => row.independentFuelSelection ? props.selection.onToggleGradeLevel?.(generation(), row.fuel.id) : props.selection.onToggleGrades?.(generation(), row.fuelTokens, !row.fuelChecked);
const toggleGradeRow = (row: (typeof treeRows.value)[number]["grades"][number]) => row.independentGradeSelection ? props.selection.onToggleGradeGroup?.(generation(), row.grade.id) : props.selection.onToggleGrades?.(generation(), row.gradeTokens, !row.gradeChecked);
const flatChecked = (name: string) => props.selection.model === gradeView.value?.model && props.selection.generation === gradeView.value?.generation && props.selection.grades.includes(name);
</script>
<template>
  <div :class="`bbm-maker-grade${referenceStyle ? ' is-reference' : ''}`">
    <div v-if="!referenceStyle && pathRows.length" class="bbm-selection-path" aria-label="선택한 제조사·모델·세부모델">
      <div v-for="row in pathRows" :key="row.key" class="bbm-selection-row">
        <button type="button" class="bbm-selection-label" @click="row.onOpen"><span>{{ row.label }}</span><small v-if="row.sublabel">{{ compactReferenceYears(row.sublabel) }}</small></button>
        <button type="button" class="bbm-selection-clear" :aria-label="`${row.label} 선택 해제`" @click="row.onClear"><BbAssetIcon name="circle-close" :size="20" /></button>
      </div>
    </div>
    <div ref="catalogRef" class="bbm-catalog">
      <div v-if="referenceStyle && pathRows.length" class="bbm-selection-path" aria-label="선택한 제조사·모델·세부모델">
        <div v-for="row in pathRows" :key="row.key" class="bbm-selection-row">
          <button type="button" class="bbm-selection-label" @click="row.onOpen"><span>{{ row.label }}</span><small v-if="row.sublabel">{{ compactReferenceYears(row.sublabel) }}</small></button>
          <button type="button" class="bbm-selection-clear" :aria-label="`${row.label} 선택 해제`" @click="row.onClear"><BbAssetIcon name="circle-close" :size="20" /></button>
        </div>
      </div>
      <template v-if="view.stage === 'maker'">
        <div v-for="section in makerSections" :key="section.title" class="bbm-catalog-section">
          <p class="bbm-catalog-title">{{ section.title }}</p>
          <button v-for="[name, rowCount, makerKey] in section.rows" :key="`${section.title}-${name}`" type="button" :class="`bbm-catalog-row${selection.maker === (makerKey ?? name) ? ' is-selected' : ''}`" :aria-pressed="selection.maker === (makerKey ?? name)" @click="chooseMaker(makerKey ?? name)"><span v-if="brandLogos" class="bbm-catalog-name"><CategoryBrandLogo :category="brandLogoCategory" :name="name" kind="list" initial-fallback /><span>{{ name }}</span></span><span v-else>{{ name }}</span><BbCatalogCount :value="rowCount" :show="showInventoryCounts" /></button>
        </div>
      </template>
      <div v-else-if="view.stage === 'model'" class="bbm-catalog-section is-drill">
        <div v-if="popularRows.length" class="bbm-model-group"><p class="bbm-catalog-title">인기모델</p><button v-for="row in popularRows" :key="`popular-${row.name}`" type="button" :class="`bbm-catalog-row${selection.maker === view.maker && selection.model === row.name ? ' is-selected' : ''}`" :aria-pressed="selection.maker === view.maker && selection.model === row.name" @click="chooseModelRow(view.maker, row)"><span>{{ row.label }}</span><BbCatalogCount :value="row.count" :show="showInventoryCounts" /></button></div>
        <div v-if="modelRows.length" class="bbm-model-group"><p class="bbm-catalog-title">{{ referenceStyle ? "모델" : "전체" }}</p><button v-for="row in modelRows" :key="row.name" type="button" :class="`bbm-catalog-row${selection.maker === view.maker && selection.model === row.name ? ' is-selected' : ''}`" :aria-pressed="selection.maker === view.maker && selection.model === row.name" @click="chooseModelRow(view.maker, row)"><span>{{ row.label }}</span><BbCatalogCount :value="row.count" :show="showInventoryCounts" /></button></div>
        <p v-else class="bbm-catalog-empty">모델 정보 없음</p>
      </div>
      <div v-else-if="view.stage === 'generation'" class="bbm-catalog-section is-drill">
        <p class="bbm-catalog-title">세부모델</p>
        <p v-if="!generationGroups.length" class="bbm-catalog-empty">세부모델 정보 없음</p>
        <template v-else><button v-for="group in generationGroups" :key="group.name!" type="button" :class="`bbm-catalog-row is-generation${selection.generation === group.name ? ' is-selected' : ''}`" :aria-pressed="selection.generation === group.name" @click="chooseGeneration(group.name!)">
          <span class="bbm-generation-copy"><span>{{ group.displayName ?? group.title ?? group.name }}</span><small v-if="group.years">{{ referenceStyle ? compactReferenceYears(group.years) : group.years }}</small></span><BbCatalogCount :value="group.count" :show="showInventoryCounts" />
        </button></template>
      </div>
      <div v-else class="bbm-catalog-section is-drill">
        <p class="bbm-catalog-title">등급</p>
        <div v-if="tree.length" class="bbm-grade-tree">
          <div v-for="row in treeRows" :key="row.fuel.id" class="bbm-grade-branch">
            <button type="button" role="checkbox" :aria-checked="row.fuelMixed ? 'mixed' : row.fuelChecked" :class="`bbm-grade-row is-level-0${row.fuelChecked || row.fuelMixed ? ' is-checked' : ''}${row.fuelMixed ? ' is-mixed' : ''}`" @click="toggleFuel(row)">
              <span class="bbm-checkbox" aria-hidden="true"><BbCatalogCheck :checked="row.fuelChecked" :mixed="row.fuelMixed" :reference-style="referenceStyle" /></span>
              <span class="bbm-grade-name">{{ row.fuel.name }}</span><BbCatalogCount :value="row.fuel.count" :show="showInventoryCounts" />
            </button>
            <div v-for="gradeRow in row.grades" :key="gradeRow.grade.id" class="bbm-grade-branch is-level-1">
              <button type="button" role="checkbox" :aria-checked="gradeRow.gradeMixed ? 'mixed' : gradeRow.gradeChecked" :class="`bbm-grade-row is-level-1${gradeRow.gradeChecked || gradeRow.gradeMixed ? ' is-checked' : ''}${gradeRow.gradeMixed ? ' is-mixed' : ''}`" @click="toggleGradeRow(gradeRow)">
                <span class="bbm-tree-elbow" aria-hidden="true" />
                <span class="bbm-checkbox" aria-hidden="true"><BbCatalogCheck :checked="gradeRow.gradeChecked" :mixed="gradeRow.gradeMixed" :reference-style="referenceStyle" /></span>
                <span class="bbm-grade-name">{{ gradeRow.grade.name }}</span><BbCatalogCount :value="gradeRow.grade.count" :show="showInventoryCounts" />
              </button>
              <button v-for="sub in gradeRow.subgrades" :key="sub.subgrade.id" type="button" role="checkbox" :aria-checked="sub.checked" :class="`bbm-grade-row is-level-2${sub.checked ? ' is-checked' : ''}`" @click="selection.onToggleGrade(generation(), sub.subgrade.token)">
                <span class="bbm-tree-elbow" aria-hidden="true" />
                <span class="bbm-checkbox" aria-hidden="true"><BbCatalogCheck :checked="sub.checked" :reference-style="referenceStyle" /></span>
                <span class="bbm-grade-name">{{ sub.subgrade.name }}</span><BbCatalogCount :value="sub.subgrade.count" :show="showInventoryCounts" />
              </button>
            </div>
          </div>
        </div>
        <p v-else-if="!flatGroup?.grades.length" class="bbm-catalog-empty">등급 정보 없음</p>
        <template v-else>
          <button v-for="grade in flatGroup.grades" :key="`${generation()}-${grade.name}`" type="button" role="checkbox" :aria-checked="flatChecked(grade.name)" :disabled="!allowEmptyOptions && grade.count === 0" :class="`bbm-grade-row${flatChecked(grade.name) ? ' is-checked' : ''}`" @click="selection.onToggleGrade(generation(), grade.name)">
            <span class="bbm-checkbox" aria-hidden="true"><BbCatalogCheck :checked="flatChecked(grade.name)" :reference-style="referenceStyle" /></span>
            <span class="bbm-grade-name">{{ grade.name }}</span>
            <BbCatalogCount :value="grade.count" :show="showInventoryCounts" />
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
