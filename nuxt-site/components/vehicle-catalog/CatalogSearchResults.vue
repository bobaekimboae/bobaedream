<script setup lang="ts">
// 원본: src/prototype/vehicle-catalog/index.tsx CatalogSearchResults (onChoose → emit choose(record))
import { computed } from "vue";
import CatalogLogo from "./CatalogLogo.vue";
import CatalogVehicleImage from "./CatalogVehicleImage.vue";
import { searchVehicleCatalog, type VehicleSearchRecord } from "@proto/vehicle-catalog/search.mjs";
import { daangnRecordImage, yearsLabel, type CatalogScope } from "../../lib/vehicle-catalog/internal";
import "@proto/vehicle-catalog/vehicle-catalog.css";

const props = withDefaults(defineProps<{ records: VehicleSearchRecord[] | null; query: string; scope?: CatalogScope }>(), { scope: "car" });
const emit = defineEmits<{ choose: [record: VehicleSearchRecord] }>();
const results = computed(() => props.records ? searchVehicleCatalog(props.records, props.query, 30) : []);
</script>
<template>
  <div v-if="query.trim()" class="catalog-search-results" role="listbox" aria-label="차량 기준표 검색 결과" data-testid="catalog-search-results">
    <p v-if="!records">차량 기준표를 불러오는 중입니다.</p>
    <template v-else-if="results.length">
      <button v-for="record in results" :key="record.id" type="button" role="option" :data-testid="`catalog-result-${record.id}`" @mousedown.prevent @click="emit('choose', record)">
        <CatalogLogo :path="record.logoPath" :name="record.path[0]" :scope="scope" />
        <CatalogVehicleImage :path="record.imagePath ?? daangnRecordImage(record)" :name="record.path[2] ?? record.name" compact />
        <span><strong>{{ record.path.join(" › ") }}</strong><small>{{ yearsLabel(record.releaseYm, record.endYm) }}</small></span>
      </button>
    </template>
    <p v-else>일치하는 제조사·모델·등급이 없습니다.</p>
  </div>
</template>
