<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-mileage.tsx 의 DualSlider(내보내지 않은 부품)
// 듀얼 슬라이더: 트랙 좌우 인셋 11 · 손잡이 22(누르는 영역 44) · 1,000km 단위 · 교차 금지 · 오른쪽 끝 = 제한 없음
// onChange → emit("change", min, max), onCommit → emit("commit")(QF-119: 끌기를 놓을 때·키보드 조작이 끝날 때 한 번 — PC 사이드바는 이때만 목록에 반영.
//   리액트는 onCommit?.() 이라 듣는 쪽이 없으면 아무 일 없음 — 같은 동작)
import { computed, ref } from "vue";
import { MILEAGE_MAX, MILEAGE_STEP, MILEAGE_TICKS } from "@proto/filters/bbm-mileage";
import { comma, pct, snap, snapPointer, tickLabel, valueFromPct } from "../../lib/filters/bbm-mileage";
import "@proto/filters/bbm-mileage.css";

const props = defineProps<{ min: number; max: number | null }>();
const emit = defineEmits<{ change: [min: number, max: number | null]; commit: [] }>();
const rail = ref<HTMLDivElement | null>(null);
const active = ref<"min" | "max" | null>(null);
let activeRef: "min" | "max" | null = null;
const shown = ref<"min" | "max" | null>(null);
const maxValue = computed(() => props.max === null ? MILEAGE_MAX : Math.min(props.max, MILEAGE_MAX));
// 포인터는 100km 단위로 촘촘히 따라가 시각적으로 부드럽게 움직인다.
// 키보드는 탐색 속도와 기존 규격을 위해 1,000km 단위를 유지한다.
const valueAt = (clientX: number) => { const box = rail.value!.getBoundingClientRect(); const inset = 11; return snapPointer(valueFromPct((clientX - box.left - inset) / (box.width - inset * 2))); };
const set = (which: "min" | "max", value: number) => {
  if (which === "min") emit("change", Math.min(value, maxValue.value), props.max);
  else { const next = Math.max(value, props.min); emit("change", props.min, next >= MILEAGE_MAX ? null : next); }
};
const start = (event: PointerEvent) => {
  const value = valueAt(event.clientX);
  const min = props.min; const mv = maxValue.value;
  const which = active.value ?? (Math.abs(value - min) <= Math.abs(value - mv) && !(min === mv && value > min) ? "min" : "max");
  activeRef = which; active.value = which; shown.value = which;
  // QF-119: 기본 포커스(mousedown)는 손잡이를 화면 안으로 끌어오며 스크롤을 움직일 수 있다 → 막고 preventScroll 로 직접 포커스
  event.preventDefault();
  const target = event.currentTarget as HTMLDivElement;
  target.querySelector<HTMLButtonElement>(`.mf-handle.is-${which}`)?.focus({ preventScroll: true });
  target.setPointerCapture(event.pointerId);
  set(which, value);
};
const move = (event: PointerEvent) => { const which = activeRef; if (which) set(which, valueAt(event.clientX)); };
const end = () => { if (activeRef) emit("commit"); activeRef = null; active.value = null; shown.value = null; };
const key = (which: "min" | "max", event: KeyboardEvent) => {
  const current = which === "min" ? props.min : maxValue.value;
  const next = event.key === "ArrowLeft" || event.key === "ArrowDown" ? current - MILEAGE_STEP : event.key === "ArrowRight" || event.key === "ArrowUp" ? current + MILEAGE_STEP : event.key === "Home" ? 0 : event.key === "End" ? MILEAGE_MAX : null;
  if (next === null) return;
  event.preventDefault();
  set(which, snap(next));
};
const keyEnd = (event: KeyboardEvent) => { if (["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp", "Home", "End"].includes(event.key)) emit("commit"); };
const left = (value: number) => `calc(11px + (100% - 22px) * ${pct(value)})`;
const minText = computed(() => `${comma(props.min)}km`);
const maxText = computed(() => props.max === null ? "제한 없음" : `${comma(props.max)}km`);
const handles = ["min", "max"] as const;
const valueOf = (which: "min" | "max") => which === "min" ? props.min : maxValue.value;
</script>
<template>
  <div class="mf-slider-block">
    <div ref="rail" class="mf-slider" @pointerdown="start" @pointermove="move" @pointerup="end" @pointercancel="end">
      <div class="mf-track" aria-hidden="true" />
      <div class="mf-fill" aria-hidden="true" :style="{ left: left(min), width: `calc((100% - 22px) * ${pct(maxValue) - pct(min)})` }" />
      <button
        v-for="which in handles"
        :key="which"
        type="button"
        role="slider"
        :class="`mf-handle is-${which}${active === which ? ' is-active' : ''}`"
        :style="{ left: left(valueOf(which)) }"
        :aria-label="which === 'min' ? '최소 주행거리' : '최대 주행거리'"
        :aria-valuemin="0"
        :aria-valuemax="MILEAGE_MAX"
        :aria-valuenow="valueOf(which)"
        :aria-valuetext="which === 'min' ? minText : maxText"
        @keydown="key(which, $event)"
        @keyup="keyEnd"
        @focus="shown = which"
        @blur="shown = null"
      >
        <span class="mf-handle-dot" aria-hidden="true" />
        <output :class="`mf-bubble${shown === which ? ' is-visible' : ''}${valueOf(which) >= MILEAGE_MAX ? ' is-edge-right' : valueOf(which) <= 0 ? ' is-edge-left' : ''}`" aria-hidden="true">{{ which === "min" ? minText : maxText }}</output>
      </button>
    </div>
    <div class="mf-ticks" aria-hidden="true">
      <!-- QF-119: 첫 눈금은 손잡이 중심에서 시작(왼쪽 정렬), 끝 눈금은 손잡이 중심에서 끝(오른쪽 정렬), 나머지 가운데 — 모두 슬라이더 안 -->
      <span v-for="tick in MILEAGE_TICKS" :key="tick" :class="`mf-tick${tick === 0 ? ' is-first' : tick === MILEAGE_MAX ? ' is-last' : ''}`" :style="tick === MILEAGE_MAX ? { right: '11px' } : { left: left(tick) }">{{ tickLabel(tick) }}</span>
    </div>
  </div>
</template>
