// 원본: src/prototype/vehicle-catalog/index.tsx useVehicleCatalog
// 인자: scope · selectedMake 는 값, ref, getter 모두 받는다(toValue).
// 돌려주는 값: reactive 객체 — 리액트 판과 같이 `catalog.index`, `catalog.makeFiles[id]`, `catalog.loadMake(name)` 처럼 .value 없이 읽는다.
import { computed, reactive, shallowRef, toValue, watch, type MaybeRefOrGetter } from "vue";
import type { QuickGenerationOption, QuickModelVisual } from "@proto/data";
import type { CatalogGradeTreeNode } from "@proto/vehicle-catalog";
import type { VehicleSearchRecord } from "@proto/vehicle-catalog/search.mjs";
import {
  daangnGenerationImage, daangnModelImage, fetchJson, publicCatalogAsset, yearsLabel,
  type CatalogIndex, type CatalogMakeFile, type CatalogScope,
} from "../../lib/vehicle-catalog/internal";

export function useVehicleCatalog(scopeSource: MaybeRefOrGetter<CatalogScope>, selectedMakeSource?: MaybeRefOrGetter<string | null | undefined>) {
  const scope = computed(() => toValue(scopeSource));
  const selectedMake = computed(() => toValue(selectedMakeSource) ?? null);
  const index = shallowRef<CatalogIndex | null>(null);
  const records = shallowRef<VehicleSearchRecord[] | null>(null);
  const makeFiles = shallowRef<Record<string, CatalogMakeFile>>({});
  const error = shallowRef<string | null>(null);

  watch(scope, (value, _old, onCleanup) => {
    let active = true;
    index.value = null;
    records.value = null;
    makeFiles.value = {};
    error.value = null;
    fetchJson<CatalogIndex>(`${value === "bike" ? "bikes" : "cars"}-index-v1.json`)
      .then((result) => { if (active) index.value = result; })
      .catch((reason: Error) => { if (active) error.value = reason.message; });
    onCleanup(() => { active = false; });
  }, { immediate: true });

  const ensureSearch = async () => {
    if (records.value) return records.value;
    const payload = await fetchJson<{ records: VehicleSearchRecord[] }>(`${scope.value === "bike" ? "bikes" : "cars"}-search-v1.json`);
    records.value = payload.records;
    return payload.records;
  };

  const loadMake = async (makeName: string) => {
    const make = index.value?.manufacturers.find((item) => item.name === makeName);
    if (!make) return null;
    if (makeFiles.value[make.id]) return makeFiles.value[make.id];
    const file = await fetchJson<CatalogMakeFile>(`${scope.value === "bike" ? "bikes" : "cars"}/${make.id}.json`);
    makeFiles.value = { ...makeFiles.value, [make.id]: file };
    return file;
  };

  // 원본 deps [loadMake, selectedMake] — loadMake 가 index · makeFiles · scope 에 따라 새로 만들어지므로 같은 값을 지켜본다
  watch([selectedMake, index, makeFiles, scope], () => {
    if (selectedMake.value) void loadMake(selectedMake.value).catch((reason: Error) => { error.value = reason.message; });
  }, { immediate: true });

  const activeMakeFile = computed(() => {
    const makeId = index.value?.manufacturers.find((item) => item.name === selectedMake.value)?.id;
    return makeId ? makeFiles.value[makeId] ?? null : null;
  });

  const modelsByMaker = computed<Record<string, string[]>>(() => {
    const idx = index.value;
    if (!idx) return {};
    const result: Record<string, string[]> = {};
    for (const make of idx.manufacturers) result[make.name] = idx.modelGroups.filter((group) => group.makeId === make.id).sort((a, b) => a.sortOrder - b.sortOrder).map((group) => group.name);
    return result;
  });

  const generationsByMakerModel = computed<Record<string, Record<string, QuickGenerationOption[]>>>(() => {
    const idx = index.value;
    if (!idx) return {};
    const result: Record<string, Record<string, QuickGenerationOption[]>> = {};
    for (const make of idx.manufacturers) result[make.name] = {};
    if (scope.value === "bike") {
      for (const model of idx.models ?? []) {
        const variants = result[model.makeName][model.groupName] ??= [];
        variants.push({ name: model.name, years: yearsLabel(model.firstYear, model.latestYear), variants: [], count: 1 });
      }
    } else {
      const file = activeMakeFile.value;
      const details = file && "grades" in file ? file : null;
      for (const generation of idx.generations ?? []) {
        const variants = details?.grades.filter((grade) => grade.generationId === generation.id).sort((a, b) => a.sortOrder - b.sortOrder).map((grade) => ({ name: grade.name, count: 1 })) ?? [];
        const rows = result[generation.makeName][generation.groupName] ??= [];
        // 원본은 image 에 null 이 들어갈 수 있다(형식만 undefined 로 맞춤, 화면은 같은 거짓 값)
        rows.push({ name: generation.name, years: yearsLabel(generation.releaseYm, generation.endYm), variants, image: publicCatalogAsset(generation.imagePath) ?? daangnGenerationImage(generation) ?? undefined, count: 1, cardLabel: generation.generationCode ?? generation.name, cardSub: yearsLabel(generation.releaseYm, generation.endYm) });
      }
    }
    return result;
  });

  const gradeTreeByGeneration = computed<Record<string, CatalogGradeTreeNode[]>>(() => {
    const file = activeMakeFile.value;
    if (!file || !("grades" in file)) return {};
    const result: Record<string, CatalogGradeTreeNode[]> = {};
    const generationNames = new Map(file.generations.map((generation) => [generation.id, generation.name]));
    for (const fuel of [...file.fuelDrive].sort((a, b) => a.name.localeCompare(b.name, "ko") || a.sortOrder - b.sortOrder)) {
      const grades = file.grades
        .filter((grade) => grade.fuelId === fuel.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((grade) => {
          const subgrades = file.subgrades
            .filter((subgrade) => subgrade.gradeId === grade.id)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((subgrade) => ({
              id: subgrade.id,
              name: subgrade.name,
              count: 1,
              token: `${fuel.name} › ${grade.name} › ${subgrade.name}`,
            }));
          const fallback = subgrades.length ? subgrades : [{ id: grade.id, name: grade.name, count: 1, token: `${fuel.name} › ${grade.name}` }];
          return { id: grade.id, name: grade.name, count: fallback.length, subgrades: fallback };
        });
      const generationName = generationNames.get(fuel.generationId);
      if (!generationName) continue;
      result[generationName] ??= [];
      result[generationName].push({ id: fuel.id, name: fuel.name, count: grades.reduce((sum, grade) => sum + grade.count, 0), grades });
    }
    return result;
  });

  const modelVisualsByMaker = computed<Record<string, Record<string, QuickModelVisual>>>(() => {
    const idx = index.value;
    if (!idx) return {};
    const result: Record<string, Record<string, QuickModelVisual>> = {};
    for (const make of idx.manufacturers) result[make.name] = {};
    for (const group of idx.modelGroups) result[group.makeName][group.name] = {
      image: publicCatalogAsset(group.imagePath) ?? daangnModelImage(group.makeName, group.name) ?? "",
      count: "1대",
    };
    return result;
  });

  return reactive({ scope, index, records, makeFiles, activeMakeFile, error, ensureSearch, loadMake, modelsByMaker, generationsByMakerModel, gradeTreeByGeneration, modelVisualsByMaker });
}

export type VehicleCatalog = ReturnType<typeof useVehicleCatalog>;
