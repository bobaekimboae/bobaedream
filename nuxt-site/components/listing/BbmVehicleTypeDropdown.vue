<script setup lang="ts">
// 원본: src/prototype/listing/bbm-vehicle-type-dropdown.tsx BbmVehicleTypeDropdown (onChoose → emit choose)
import { onBeforeUnmount, ref, watch } from "vue";
import VehicleTypeIcon from "./VehicleTypeIcon.vue";
import "@proto/listing/bbm-vehicle-type-dropdown.css";

type VehicleTypeItem = { label: string; category: string; icon: string };

// 원본 파일 안 상수(export 안 됨) 사본
const vehicleTypes: readonly VehicleTypeItem[] = [
  { label: "전체차량", category: "전체", icon: "category_all_vehicles_v01.svg" },
  { label: "중고차", category: "중고차", icon: "category_used_car_v01.svg" },
  { label: "테마별 중고차", category: "테마별 중고차", icon: "category_theme_used_car_v01.svg" },
  { label: "트럭 · 특장", category: "트럭 · 특장", icon: "category_truck_special_v01.svg" },
  { label: "바이크", category: "바이크", icon: "category_bike_v01.svg" },
  { label: "캠핑카", category: "캠핑카", icon: "category_camper_v01.svg" },
  { label: "건설기계", category: "건설기계", icon: "category_construction_v01.svg" },
  { label: "자재운반장비", category: "자재운반장비", icon: "category_material_handling_v01.svg" },
  { label: "부품 · 용품", category: "부품 · 용품", icon: "category_parts_v01.svg" },
];

defineProps<{ active: boolean }>();
const emit = defineEmits<{ choose: [category: string] }>();
const open = ref(false);
const root = ref<HTMLDivElement | null>(null);

let cleanup: (() => void) | null = null;
watch(open, (value) => {
  cleanup?.();
  cleanup = null;
  if (!value) return;
  const close = (event: PointerEvent) => {
    if (!root.value?.contains(event.target as Node)) open.value = false;
  };
  document.addEventListener("pointerdown", close);
  cleanup = () => document.removeEventListener("pointerdown", close);
});
onBeforeUnmount(() => cleanup?.());
const choose = (item: VehicleTypeItem) => { open.value = false; emit("choose", item.category); };
</script>
<template>
  <div ref="root" class="bbm-vehicle-search-wrap">
    <button type="button" :class="`bbm-vehicle-search-trigger${active ? ' is-active' : ''}`" :aria-current="active ? 'page' : undefined" aria-haspopup="menu" :aria-expanded="open" @click="open = !open">
      <span>전체 차량</span>
    </button>
    <div v-if="open" class="bbm-vehicle-type-menu" role="menu" aria-label="차량 유형 선택">
      <div class="bbm-vehicle-type-heading">차량 유형</div>
      <div class="bbm-vehicle-type-grid">
        <button v-for="item in vehicleTypes" :key="item.label" type="button" class="bbm-vehicle-type-option" role="menuitem" @click="choose(item)">
          <VehicleTypeIcon :name="item.icon" /><span>{{ item.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
