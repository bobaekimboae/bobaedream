<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-mileage.tsx 의 MileageFinalPanel. onChange → emit("change", next)
// 주행거리 내용(입력 → 슬라이더·눈금 → 구간 칩). sheet: 입력 한 줄 · 칩 3열 / sidebar: 입력 세로 · 칩 2열
// QF-119 PC 사이드바(sidebar): 조작 중에는 이 부품 안에서만 값을 바꾸고 목록 반영(change)은 한 번만 —
// 손잡이는 놓을 때·키보드 조작 끝, 입력은 0.4초 멈춤·Enter·포커스 이동, 칩은 누를 때. 시트(sheet)는 이미 임시 값이라 그대로 바로 반영
import { computed, onBeforeUnmount, shallowRef, watch } from "vue";
import { MILEAGE_CHIPS, mileageBounds, mileageChipOf, mileageInvalid, mileageRange } from "@proto/filters/bbm-mileage";
import { setBbmRange, type BbmFilterValues, type BbmRange } from "@proto/filters/bbm-filter-state";
import DualSlider from "./DualSlider.vue";
import Field from "./Field.vue";
import "@proto/filters/bbm-mileage.css";

const TYPE_COMMIT_MS = 400;
const props = defineProps<{ value: BbmFilterValues; layout: "sheet" | "sidebar" }>();
const emit = defineEmits<{ change: [next: BbmFilterValues] }>();
const deferred = computed(() => props.layout === "sidebar");
const outer = computed(() => props.value.ranges.mileage);
const local = shallowRef<BbmRange | undefined>(outer.value);
let localRef = local.value;
let pending = false;
let timer: number | undefined;
// 바깥 값이 바뀌면(초기화·상단 칩 ×·반영 완료) 조작 중이 아닐 때만 따라감
watch([() => outer.value?.min, () => outer.value?.max, () => outer.value?.preset], () => { if (!pending) { localRef = outer.value; local.value = outer.value; } });
onBeforeUnmount(() => window.clearTimeout(timer));
const range = computed(() => deferred.value ? local.value : outer.value);
const bounds = computed(() => mileageBounds(range.value));
const chip = computed(() => mileageChipOf(bounds.value.min, bounds.value.max));
const commit = () => {
  window.clearTimeout(timer);
  if (!pending) return;
  pending = false;
  const next = localRef ?? { min: "", max: "" };
  const now = props.value.ranges.mileage;
  if ((now?.min ?? "") === next.min && (now?.max ?? "") === next.max && now?.preset === next.preset) return;
  emit("change", setBbmRange(props.value, "mileage", next));
};
const update = (next: BbmRange, when: "now" | "later" | "typing") => {
  if (!deferred.value) { emit("change", setBbmRange(props.value, "mileage", next)); return; }
  localRef = next; local.value = next; pending = true;
  window.clearTimeout(timer);
  if (when === "now") commit();
  else if (when === "typing") timer = window.setTimeout(commit, TYPE_COMMIT_MS);
};
const apply = (nextMin: number, nextMax: number | null, when: "now" | "later" = "now") => update(mileageRange(nextMin, nextMax), when);
// 직접 입력은 입력한 글자 그대로(최소 > 최대여도 남겨 두고 적용 버튼만 막음)
const typed = (key: "min" | "max", text: string) => {
  const next = { min: range.value?.min ?? "", max: range.value?.max ?? "", [key]: text };
  const b = mileageBounds(next);
  update(!next.min && !next.max ? { min: "", max: "" } : { ...next, preset: mileageChipOf(b.min, b.max) }, "typing");
};
const done = () => { if (deferred.value) commit(); };
</script>
<template>
  <div :class="`mf-panel is-${layout}`">
    <!-- QF-119: 오류 문구는 입력 아래 여백 위에 겹쳐 그려 높이를 바꾸지 않음 -->
    <div class="mf-input-block">
      <div class="mf-inputs">
        <Field label="최소 거리" :value="range?.min ?? ''" @change="typed('min', $event)" @done="done" />
        <span class="mf-sep" aria-hidden="true">–</span>
        <Field label="최대 거리" :value="range?.max ?? ''" @change="typed('max', $event)" @done="done" />
      </div>
      <p v-if="mileageInvalid(range)" class="mf-error" role="alert">최소 주행거리가 최대 주행거리보다 높습니다.</p>
    </div>
    <DualSlider :min="bounds.min" :max="bounds.max" @change="(a, b) => apply(a, b, 'later')" @commit="done" />
    <div class="mf-chips" role="group" aria-label="주행거리 구간">
      <button v-for="item in MILEAGE_CHIPS" :key="item.id" type="button" :class="`mf-chip${chip === item.id ? ' is-selected' : ''}`" :aria-pressed="chip === item.id" @click="chip === item.id ? apply(0, null) : apply(item.min, item.max)">{{ item.id }}</button>
    </div>
  </div>
</template>
