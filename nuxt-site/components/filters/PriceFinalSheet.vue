<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-price.tsx 의 PriceFinalSheet(createPortal → Teleport to body)
// onApply → emit("apply", next), onClose → emit("close"). countOf · returnFocus 는 값을 돌려받으므로 함수 prop 그대로
// 닫기·배경·Esc는 임시값을 버리고, 아래 결과 버튼만 가격을 적용한다.
// 차이: 리액트는 의존 배열 없는 useEffect 라 다시 그릴 때마다(모달이면) 닫기 버튼에 포커스를 다시 줬다. Vue 판은 열 때 한 번만 준다.
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from "vue";
import type { BbmFilterValues } from "@proto/filters/bbm-filter-state";
import { FOCUSABLE, clearPrice, priceInvalid } from "../../lib/filters/bbm-price";
import { useScrollLock } from "../../composables/filters/useScrollLock";
import PriceFinalPanel from "./PriceFinalPanel.vue";
import "@proto/filters/bbm-mileage.css";
import "@proto/filters/bbm-price.css";

const props = withDefaults(defineProps<{ presets?: string[]; hideTabs?: boolean; value: BbmFilterValues; countOf: (next: BbmFilterValues) => number; variant?: "sheet" | "modal"; returnFocus?: () => HTMLElement | null }>(), { presets: undefined, hideTabs: undefined, variant: "sheet", returnFocus: undefined });
const emit = defineEmits<{ apply: [next: BbmFilterValues]; close: [] }>();
const modal = computed(() => props.variant === "modal");
const draft = shallowRef(props.value);
const count = ref(props.countOf(props.value));
const dialog = ref<HTMLElement | null>(null);
const titleId = useId();
useScrollLock(() => modal.value, false);
watch([draft, () => props.countOf], (_, __, onCleanup) => {
  const timer = window.setTimeout(() => { count.value = props.countOf(draft.value); }, 100);
  onCleanup(() => window.clearTimeout(timer));
}, { immediate: true });
const close = () => { emit("close"); window.requestAnimationFrame(() => props.returnFocus?.()?.focus({ preventScroll: true })); };
const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
onMounted(() => {
  window.addEventListener("keydown", onKey);
  if (modal.value) window.requestAnimationFrame(() => dialog.value?.querySelector<HTMLElement>(".mf-close")?.focus({ preventScroll: true }));
});
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
const trap = (event: KeyboardEvent) => {
  if (!modal.value || event.key !== "Tab" || !dialog.value) return;
  const items = [...dialog.value.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((element) => element.offsetParent !== null || element === document.activeElement);
  if (!items.length) return;
  const first = items[0]; const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus({ preventScroll: true }); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus({ preventScroll: true }); }
};
const hasPrice = computed(() => { const range = draft.value.ranges.price; return Boolean(range?.min || range?.max || draft.value.priceTab !== "일반"); });
const invalid = computed(() => priceInvalid(draft.value));
const confirm = () => { emit("apply", { ...props.value, priceTab: draft.value.priceTab, ranges: { ...props.value.ranges, price: draft.value.ranges.price } }); close(); };
</script>
<template>
  <Teleport to="body">
    <div :class="`bbmf-overlay mf-overlay ${modal ? 'mf-modal-overlay' : 'is-sheet'}`" @click.self="close">
      <section ref="dialog" :class="`mf-sheet pf-sheet${modal ? ' is-modal' : ''}`" role="dialog" aria-modal="true" :aria-labelledby="titleId" @keydown="trap">
        <header class="mf-header"><h3 :id="titleId" class="mf-title">가격</h3><button type="button" class="mf-close" aria-label="닫기" @click="close"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg></button></header>
        <div class="mf-body"><PriceFinalPanel :value="draft" :presets="presets" :hide-tabs="hideTabs" @change="draft = $event" /></div>
        <div class="mf-actions"><button type="button" class="mf-reset" :disabled="!hasPrice" @click="draft = clearPrice(draft)">초기화</button><button type="button" class="mf-confirm" :disabled="invalid" @click="confirm">{{ count.toLocaleString("ko-KR") }}대 보기</button></div>
      </section>
    </div>
  </Teleport>
</template>
