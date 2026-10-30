<script setup lang="ts">
// 리액트 WarrantyCard(detail/index.tsx). 성능·상태점검 보증 안내 창: 열리면 body 스크롤 잠금 · 창에 포커스 · Esc로 닫고 버튼에 포커스.
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { getActiveDetailCar } from "@proto/data";
import SectionCard from "./SectionCard.vue";
import QuestionMarkCircledIcon from "../icons/QuestionMarkCircledIcon.vue";

const inspectionOpen = ref(false);
const inspectionTop = ref(0);
const inspectionDialogRef = ref<HTMLDivElement | null>(null);
const inspectionTriggerRef = ref<HTMLButtonElement | null>(null);
const car = getActiveDetailCar();
const year = car?.filter?.year;
const mileage = car?.filter?.mileage;
const isDealer = !car || car.sellerType === "딜러";
const hasManufacturerWarranty = !!car && (car.badges?.includes("제조사보증") || /제조사\s*보증/.test(`${car.title} ${car.trim}`));
const currentYear = 2026;

const manufacturerStatus = (years: number, distance: number) => {
  if (!year || mileage === undefined) return { label: "보증 여부 확인 필요", active: false };
  const remainingYears = year + years - currentYear;
  const remainingDistance = Math.max(0, distance - mileage);
  if (remainingYears <= 0 || remainingDistance <= 0) return { label: "보증기간 종료", active: false };
  if (!hasManufacturerWarranty) return { label: "보증 여부 확인 필요", active: false };
  return { label: `약 ${remainingYears}년 / ${remainingDistance.toLocaleString("ko-KR")}km 남음`, active: true };
};

const bodyWarranty = manufacturerStatus(3, 60000);
const powertrainWarranty = manufacturerStatus(5, 100000);
const inspectionLabel = isDealer ? "2,000km / 1개월" : "개인 매물 · 별도 확인";

let release: (() => void) | null = null;
watch(inspectionOpen, async (open) => {
  release?.();
  release = null;
  if (!open) return;
  await nextTick();
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  inspectionDialogRef.value?.focus();
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    inspectionOpen.value = false;
    inspectionTriggerRef.value?.focus();
  };
  window.addEventListener("keydown", onKeyDown);
  release = () => {
    document.body.style.overflow = previousOverflow;
    window.removeEventListener("keydown", onKeyDown);
  };
});
onBeforeUnmount(() => release?.());

const openInspectionGuide = (event: MouseEvent) => {
  const row = (event.currentTarget as HTMLElement).closest<HTMLElement>(".warranty-inspection");
  inspectionTop.value = (row?.getBoundingClientRect().bottom ?? window.innerHeight * 0.52) + 8;
  inspectionOpen.value = true;
};
const onOverlayDown = (event: MouseEvent) => { if (event.target === event.currentTarget) inspectionOpen.value = false; };
</script>
<template>
  <SectionCard title="보증 정보" class-name="warranty-card">
    <div class="warranty-box">
      <div :class="bodyWarranty.active ? 'is-active' : ''">
        <span>제조사 보증 <small>(차체·일반)</small></span>
        <strong>{{ bodyWarranty.label }}</strong>
      </div>
      <div :class="powertrainWarranty.active ? 'is-active' : ''">
        <span>제조사 보증 <small>(엔진·주요)</small></span>
        <strong>{{ powertrainWarranty.label }}</strong>
      </div>
      <div :class="isDealer ? 'is-active warranty-inspection' : 'warranty-inspection'">
        <button ref="inspectionTriggerRef" class="warranty-inspection-trigger" type="button" aria-haspopup="dialog" :aria-expanded="inspectionOpen" @click="openInspectionGuide"><span>성능·상태점검 보증 <QuestionMarkCircledIcon /></span></button>
        <strong>{{ inspectionLabel }}</strong>
      </div>
    </div>
    <div v-if="inspectionOpen" class="warranty-inspection-overlay" role="presentation" @mousedown="onOverlayDown">
      <div ref="inspectionDialogRef" class="warranty-inspection-dialog" role="dialog" aria-modal="true" aria-label="성능 상태점검 보증 안내" tabindex="-1" :style="{ top: `${inspectionTop}px` }">
        <h3>성능/상태 점검 보증</h3>
        <p>주요 부품의 점검 항목과 차량의 상태가 성능기록부와 다를 경우, 30일 또는 2,000km 이내에서 보증수리를 받을 수 있습니다. 자동차관리법에 따라 중고차 구매 시 의무 가입해야 하며, 일부 수입 또는 노후 차량의 경우 보증 요건이 다를 수 있으니 가입 가능여부를 꼭 확인하세요.</p>
      </div>
    </div>
  </SectionCard>
</template>
