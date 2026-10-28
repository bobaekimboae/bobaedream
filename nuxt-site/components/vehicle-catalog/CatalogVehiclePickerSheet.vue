<script setup lang="ts">
// 원본: src/prototype/vehicle-catalog/index.tsx CatalogVehiclePickerSheet
// 대응: onChoose → emit choose(record) · onReset → emit reset. catalog 는 composables/vehicle-catalog/useVehicleCatalog 가 돌려준 reactive 객체.
import { computed, ref, watch } from "vue";
import MagnifyingGlassIcon from "../icons/MagnifyingGlassIcon.vue";
import ChevronLeftIcon from "../icons/ChevronLeftIcon.vue";
import CatalogLogo from "./CatalogLogo.vue";
import CatalogVehicleImage from "./CatalogVehicleImage.vue";
import CatalogSearchResults from "./CatalogSearchResults.vue";
import type { VehicleSearchRecord } from "@proto/vehicle-catalog/search.mjs";
import type { VehicleCatalog } from "../../composables/vehicle-catalog/useVehicleCatalog";
import { daangnGenerationImage, daangnModelImage, yearsLabel } from "../../lib/vehicle-catalog/internal";
import "@proto/vehicle-catalog/vehicle-catalog.css";

const props = withDefaults(defineProps<{ catalog: VehicleCatalog; maker: string | null; model: string | null; generation: string | null; initialRecord?: VehicleSearchRecord | null }>(), { initialRecord: null });
const emit = defineEmits<{ choose: [record: VehicleSearchRecord]; reset: [] }>();

const initialPath = () => props.initialRecord?.path ?? ([props.maker, props.model, props.generation].filter(Boolean) as string[]);
const initialIds = () => props.initialRecord?.pathIds ?? [];
const path = ref<string[]>(initialPath());
const ids = ref<string[]>(initialIds());
const query = ref("");
const step = ref(path.value.length);
const make = computed(() => props.catalog.index?.manufacturers.find((item) => item.name === path.value[0]));
const makeFile = computed(() => make.value ? props.catalog.makeFiles[make.value.id] ?? null : null);

watch(() => [props.maker, props.model, props.generation, props.initialRecord], () => {
  const nextPath = initialPath();
  path.value = nextPath;
  ids.value = initialIds();
  step.value = nextPath.length;
});
watch(() => [path.value, props.catalog.index, props.catalog.makeFiles], () => { if (path.value[0]) void props.catalog.loadMake(path.value[0]); }, { immediate: true });

const choose = (name: string, id: string) => {
  const nextPath = [...path.value.slice(0, step.value), name];
  const nextIds = [...ids.value.slice(0, step.value), id];
  path.value = nextPath;
  ids.value = nextIds;
  step.value = step.value + 1;
};
const chooseLeaf = (name: string, id: string, type: VehicleSearchRecord["type"]) => emit("choose", { id, type, name, path: [...path.value.slice(0, step.value), name], pathIds: [...ids.value.slice(0, step.value), id] });
const goBack = () => { step.value = Math.max(0, step.value - 1); path.value = path.value.slice(0, -1); ids.value = ids.value.slice(0, -1); };
const groups = computed(() => props.catalog.index?.modelGroups.filter((group) => group.makeId === make.value?.id).sort((a, b) => a.sortOrder - b.sortOrder) ?? []);
const selectedGroup = computed(() => groups.value.find((group) => group.name === path.value[1]));
const carFile = computed(() => makeFile.value && "generations" in makeFile.value ? makeFile.value : null);
const bikeFile = computed(() => makeFile.value && "models" in makeFile.value ? makeFile.value : null);
const generations = computed(() => carFile.value?.generations.filter((item) => item.groupId === selectedGroup.value?.id).sort((a, b) => a.sortOrder - b.sortOrder) ?? []);
const selectedGeneration = computed(() => generations.value.find((item) => item.name === path.value[2]));
const fuels = computed(() => carFile.value?.fuelDrive.filter((item) => item.generationId === selectedGeneration.value?.id).sort((a, b) => a.sortOrder - b.sortOrder) ?? []);
const selectedFuel = computed(() => fuels.value.find((item) => item.name === path.value[3]));
const grades = computed(() => carFile.value?.grades.filter((item) => item.fuelId === selectedFuel.value?.id).sort((a, b) => a.sortOrder - b.sortOrder) ?? []);
const selectedGrade = computed(() => grades.value.find((item) => item.name === path.value[4]));
const subgrades = computed(() => carFile.value?.subgrades.filter((item) => item.gradeId === selectedGrade.value?.id).sort((a, b) => a.sortOrder - b.sortOrder) ?? []);
const bikeModels = computed(() => bikeFile.value?.models.filter((item) => item.groupId === selectedGroup.value?.id).sort((a, b) => a.sortOrder - b.sortOrder) ?? []);
const titles = computed(() => props.catalog.scope === "bike" ? ["제조사", "모델그룹", "모델"] : ["제조사", "모델그룹", "세대", "연료·구동", "등급", "세부등급"]);

const onInput = (event: Event) => { query.value = (event.currentTarget as HTMLInputElement).value; void props.catalog.ensureSearch(); };
const chooseGrade = (item: { id: string; name: string }) => {
  const children = carFile.value?.subgrades.filter((child) => child.gradeId === item.id) ?? [];
  if (children.length) choose(item.name, item.id); else chooseLeaf(item.name, item.id, "GRADE");
};
const reset = () => { path.value = []; ids.value = []; step.value = 0; query.value = ""; emit("reset"); };
</script>
<template>
  <div class="catalog-picker" data-testid="catalog-picker">
    <label class="catalog-picker-search"><MagnifyingGlassIcon /><input :value="query" placeholder="제조사·모델·등급 검색" @focus="void catalog.ensureSearch()" @input="onInput"></label>
    <CatalogSearchResults v-if="query" :records="catalog.records" :query="query" :scope="catalog.scope" @choose="(record) => emit('choose', record)" />
    <template v-else>
      <header><button type="button" :disabled="step === 0" aria-label="이전 단계" @click="goBack"><ChevronLeftIcon /></button><strong>{{ titles[Math.min(step, titles.length - 1)] }}</strong><small>{{ path.join(" › ") || "전체 차량" }}</small></header>
      <div class="catalog-picker-list">
        <template v-if="step === 0"><button v-for="item in catalog.index?.manufacturers ?? []" :key="item.id" type="button" @click="choose(item.name, item.id)"><CatalogLogo :path="item.logoPath" :name="item.name" :scope="catalog.scope" /><span>{{ item.name }}</span></button></template>
        <template v-if="step === 1"><button v-for="item in groups" :key="item.id" type="button" @click="choose(item.name, item.id)"><CatalogVehicleImage :path="item.imagePath ?? daangnModelImage(item.makeName, item.name)" :name="item.name" compact /><span>{{ item.name }}</span></button></template>
        <template v-if="catalog.scope === 'bike' && step === 2"><button v-for="item in bikeModels" :key="item.id" type="button" @click="chooseLeaf(item.name, item.id, 'BIKE_MODEL')"><CatalogVehicleImage :name="item.name" compact /><span><strong>{{ item.name }}</strong><small>{{ [item.genre, item.displacementBand].filter(Boolean).join(" · ") }}</small></span></button></template>
        <template v-if="catalog.scope === 'car' && step === 2"><button v-for="item in generations" :key="item.id" type="button" @click="choose(item.name, item.id)"><CatalogVehicleImage :path="item.imagePath ?? daangnGenerationImage(item)" :name="item.name" compact /><span><strong>{{ item.name }}</strong><small>{{ yearsLabel(item.releaseYm, item.endYm) }}</small></span></button></template>
        <template v-if="catalog.scope === 'car' && step === 3"><button v-for="item in fuels" :key="item.id" type="button" @click="choose(item.name, item.id)"><span>{{ item.name }}</span></button></template>
        <template v-if="catalog.scope === 'car' && step === 4"><button v-for="item in grades" :key="item.id" type="button" @click="chooseGrade(item)"><span>{{ item.name }}</span></button></template>
        <template v-if="catalog.scope === 'car' && step === 5"><button v-for="item in subgrades" :key="item.id" type="button" @click="chooseLeaf(item.name, item.id, 'SUBGRADE')"><span>{{ item.name }}</span></button></template>
        <p v-if="make && !makeFile && step > 0">선택한 제조사 기준표를 불러오는 중입니다.</p>
      </div>
    </template>
    <div class="catalog-picker-actions"><button type="button" @click="reset">초기화</button></div>
  </div>
</template>
