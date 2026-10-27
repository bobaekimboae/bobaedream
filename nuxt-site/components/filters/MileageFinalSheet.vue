<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-mileage.tsx 의 MileageFinalSheet(createPortal → Teleport to body)
// onApply → emit("apply", next), onClose → emit("close"). countOf · returnFocus 는 값을 돌려받으므로 함수 prop 그대로
// 주행거리 임시 값 창(mileage-final). 임시 값(draft)과 적용 값 분리 — 닫기·배경·Esc 는 적용하지 않고 닫음.
// variant "sheet" = 모바일 바텀시트(QF-117) · "modal" = PC 가운데 모달(QF-118)
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from "vue";
import { mileageInvalid } from "@proto/filters/bbm-mileage";
import { setBbmRange, type BbmFilterValues } from "@proto/filters/bbm-filter-state";
import { FOCUSABLE, reducedMotion } from "../../lib/filters/bbm-mileage";
import { useScrollLock } from "../../composables/filters/useScrollLock";
import MileageFinalPanel from "./MileageFinalPanel.vue";
import "@proto/filters/bbm-mileage.css";

const props = withDefaults(defineProps<{ value: BbmFilterValues; countOf: (next: BbmFilterValues) => number; variant?: "sheet" | "modal"; returnFocus?: () => HTMLElement | null }>(), { variant: "sheet", returnFocus: undefined });
const emit = defineEmits<{ apply: [next: BbmFilterValues]; close: [] }>();
const modal = computed(() => props.variant === "modal");
const draft = shallowRef(props.value);
const count = ref(props.countOf(props.value));
const closing = ref(false);
const dialog = ref<HTMLElement | null>(null);
const titleId = useId();
useScrollLock(() => modal.value, true);
// 대수는 조작 반응을 막지 않게 짧게 늦춰 계산(손잡이는 즉시)
watch([draft, () => props.countOf], (_, __, onCleanup) => {
  const timer = window.setTimeout(() => { count.value = props.countOf(draft.value); }, 120);
  onCleanup(() => window.clearTimeout(timer));
}, { immediate: true });
// 모달: 닫는 움직임(0.15초) 뒤에 실제로 닫고 포커스를 칩으로 돌려놓음
const close = () => {
  if (!modal.value) { emit("close"); return; }
  if (closing.value) return;
  const finish = () => { emit("close"); window.requestAnimationFrame(() => props.returnFocus?.()?.focus({ preventScroll: true })); };
  if (reducedMotion()) { finish(); return; }
  closing.value = true;
  window.setTimeout(finish, 150);
};
const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
onMounted(() => {
  window.addEventListener("keydown", onKey);
  if (modal.value) dialog.value?.querySelector<HTMLElement>(".mf-close")?.focus({ preventScroll: true });
});
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
// Tab 은 모달 안에서만 돈다
const trap = (event: KeyboardEvent) => {
  if (!modal.value || event.key !== "Tab" || !dialog.value) return;
  const items = [...dialog.value.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
  if (!items.length) return;
  const first = items[0]; const last = items[items.length - 1];
  if (event.shiftKey && (document.activeElement === first || !dialog.value.contains(document.activeElement))) { event.preventDefault(); last.focus({ preventScroll: true }); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus({ preventScroll: true }); }
};
const invalid = computed(() => mileageInvalid(draft.value.ranges.mileage));
const hasMileage = computed(() => Boolean(draft.value.ranges.mileage?.min || draft.value.ranges.mileage?.max));
// 모달은 주행거리 값만 적용(다른 필터는 지금 적용 값 그대로)
const confirm = () => { emit("apply", modal.value ? setBbmRange(props.value, "mileage", draft.value.ranges.mileage ?? { min: "", max: "" }) : draft.value); close(); };
</script>
<template>
  <Teleport to="body">
    <div :class="`bbmf-overlay mf-overlay ${modal ? 'mf-modal-overlay' : 'is-sheet'}${closing ? ' is-closing' : ''}`" @click.self="close">
      <section ref="dialog" :class="`mf-sheet${modal ? ' is-modal' : ''}`" role="dialog" aria-modal="true" :aria-labelledby="modal ? titleId : undefined" :aria-label="modal ? undefined : '주행거리'" @keydown="trap">
        <header class="mf-header">
          <h3 :id="titleId" class="mf-title">주행거리</h3>
          <button type="button" class="mf-close" aria-label="닫기" @click="close"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg></button>
        </header>
        <div class="mf-body"><MileageFinalPanel :value="draft" layout="sheet" @change="draft = $event" /></div>
        <div class="mf-actions">
          <button type="button" class="mf-reset" :disabled="!hasMileage" @click="draft = setBbmRange(draft, 'mileage', { min: '', max: '' })">초기화</button>
          <button type="button" class="mf-confirm" :disabled="invalid" @click="confirm">{{ count.toLocaleString("ko-KR") }}대 보기</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
