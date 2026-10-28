<script setup lang="ts">
// 리액트 src/mobile/BottomSheet.tsx 를 옮김. children → 기본 slot.
// 콜백 대응: onOpenChange(open) → emit("openChange", open)  (부모 @open-change). v-model:open 도 되게 update:open 을 같이 보낸다.
//
// 리액트는 @radix-ui/react-dialog + motion/react + @use-gesture/react 를 썼다. 넉스트 판에는 없으므로 같은 결과를 직접 만든다:
//  · Radix Dialog DOM: 덮개 div.sheet-overlay[data-state] → 내용 div.bottom-sheet[role=dialog][data-state][aria-labelledby][aria-describedby][tabindex=-1],
//    제목 h2.sheet-title · 설명 p.sheet-description. 화면(PhoneFrame screenRef) 안으로 Teleport(없으면 body).
//  · 열릴 때 내용 안 첫 포커스 가능 요소(링크 제외)로 포커스, Tab 은 시트 안에서만 돈다, Esc · 바깥 누름 → openChange(false),
//    열린 동안 body pointer-events:none(덮개 · 시트만 auto). 닫힐 때 포커스는 되돌리지 않는다(리액트도 Trigger 가 없어 되돌리지 않음).
//  · 애니메이션: 덮개 opacity 0.16s, 시트 y 스프링(열림 stiffness 500 · damping 43 · mass 0.9 / 닫힘 250 · 30 · 1.05).
//    닫힘 애니메이션이 끝난 뒤 DOM 에서 뺀다(리액트 AnimatePresence 와 같음).
//  · 손잡이 끌기: y 축, 96px 넘게 내리거나 아래로 빠르게(0.55px/ms 초과) 놓으면 닫힘.
//  못 옮긴 것: Radix 의 바깥 요소 aria-hidden 처리(hideOthers) · 스크롤 잠금(react-remove-scroll).
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useKeyboard, useKeyboardInsets } from "../../composables/mobile/useKeyboard";
import { useScreenPortal } from "../../composables/mobile/useScreenPortal";
import { useMobileDevice } from "../../composables/mobile/useMobileDevice";
import { Spring, type SpringOptions } from "../../composables/mobile/spring";

const props = withDefaults(defineProps<{ open: boolean; title: string; description?: string; snap?: number }>(), { snap: 0.72 });
const emit = defineEmits<{ openChange: [open: boolean]; "update:open": [open: boolean] }>();

const ENTER: SpringOptions = { stiffness: 500, damping: 43, mass: 0.9 };
const EXIT: SpringOptions = { stiffness: 250, damping: 30, mass: 1.05 };

const ctx = useMobileDevice();
const { screenRef } = useScreenPortal();
const keyboard = useKeyboard();
const insets = useKeyboardInsets();
const dragY = ref(0);
const rendered = ref(false);
const state = ref<"open" | "closed">("closed");
const overlayOpacity = ref(0);
const y = ref(0);
const contentRef = ref<HTMLDivElement | null>(null);
const measure = ref(0);
const spring = new Spring(0, (value) => { y.value = value; });

const uid = `bbm-sheet-${Math.random().toString(36).slice(2, 9)}`;
const titleId = `${uid}-title`;
const descriptionId = `${uid}-description`;

function requestOpenChange(next: boolean) {
  emit("openChange", next);
  emit("update:open", next);
}

const layout = computed(() => {
  void measure.value;
  const viewportHeight = screenRef.value?.clientHeight ?? ctx.device.geometry.screen.height;
  const sheetHeight = Math.round(viewportHeight * props.snap);
  const effectiveHeight = Math.max(260, sheetHeight - Math.min(insets.keyboardHeight, 180));
  const sheetBottom = ctx.device.platform === "android" ? Math.max(ctx.device.geometry.safeArea.bottom, insets.keyboardHeight) : insets.keyboardHeight;
  return { effectiveHeight, sheetBottom };
});

// ── 열린 시트 쌓기(맨 위 시트만 Esc · Tab · 바깥 누름을 받는다) · body pointer-events
const layers: object[] = ((globalThis as { __bbmSheetLayers?: object[] }).__bbmSheetLayers ??= []);
const me = {};
const bodyPointer: { count: number; original: string } = ((globalThis as { __bbmSheetBody?: { count: number; original: string } }).__bbmSheetBody ??= { count: 0, original: "" });
let active = false;
let outsideTimer: number | null = null;

function tabbables(root: HTMLElement) {
  const nodes = root.querySelectorAll<HTMLElement>('button, input, select, textarea, [tabindex], [contenteditable="true"]');
  return Array.from(nodes).filter((node) => {
    if (node.hasAttribute("disabled") || node.tabIndex < 0 || node.getAttribute("type") === "hidden") return false;
    if (node.closest("[hidden], [inert]")) return false;
    const style = window.getComputedStyle(node);
    return style.visibility !== "hidden" && style.display !== "none";
  });
}

function onKeydown(event: KeyboardEvent) {
  if (layers[layers.length - 1] !== me) return;
  if (event.key === "Escape") {
    if (event.defaultPrevented) return;
    event.preventDefault();
    requestOpenChange(false);
    return;
  }
  if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
  const content = contentRef.value;
  if (!content) return;
  const list = tabbables(content);
  const focused = document.activeElement as HTMLElement | null;
  if (!list.length) {
    if (focused === content) event.preventDefault();
    return;
  }
  const first = list[0];
  const last = list[list.length - 1];
  if (!event.shiftKey && focused === last) {
    event.preventDefault();
    first.focus();
  } else if (event.shiftKey && (focused === first || focused === content)) {
    event.preventDefault();
    last.focus();
  }
}

function onPointerDownOutside(event: PointerEvent) {
  if (layers[layers.length - 1] !== me) return;
  const content = contentRef.value;
  if (!content || (event.target instanceof Node && content.contains(event.target))) return;
  requestOpenChange(false);
}

function activate() {
  if (active) return;
  active = true;
  layers.push(me);
  if (bodyPointer.count === 0) bodyPointer.original = document.body.style.pointerEvents;
  bodyPointer.count += 1;
  document.body.style.pointerEvents = "none";
  document.addEventListener("keydown", onKeydown, true);
  // Radix 처럼 여는 누름이 곧바로 닫기로 읽히지 않게 한 박자 뒤에 붙인다.
  outsideTimer = window.setTimeout(() => {
    outsideTimer = null;
    document.addEventListener("pointerdown", onPointerDownOutside);
  }, 0);
}

function deactivate() {
  if (!active) return;
  active = false;
  const index = layers.indexOf(me);
  if (index >= 0) layers.splice(index, 1);
  bodyPointer.count = Math.max(0, bodyPointer.count - 1);
  if (bodyPointer.count === 0) document.body.style.pointerEvents = bodyPointer.original;
  document.removeEventListener("keydown", onKeydown, true);
  if (outsideTimer !== null) window.clearTimeout(outsideTimer);
  outsideTimer = null;
  document.removeEventListener("pointerdown", onPointerDownOutside);
}

function focusFirst() {
  const content = contentRef.value;
  if (!content || content.contains(document.activeElement)) return;
  const first = tabbables(content).find((node) => node.tagName !== "A");
  (first ?? content).focus({ preventScroll: true });
}

watch(() => props.open, (open) => {
  if (open) keyboard.hide();
}, { immediate: true });

watch(() => props.open, async (open) => {
  if (open) {
    measure.value += 1;
    state.value = "open";
    if (!rendered.value) {
      spring.set(layout.value.effectiveHeight + 36);
      overlayOpacity.value = 0;
      rendered.value = true;
      await nextTick();
      window.requestAnimationFrame(() => { if (state.value === "open") overlayOpacity.value = 1; });
    } else {
      overlayOpacity.value = 1;
    }
    spring.to(dragY.value, ENTER);
    activate();
    focusFirst();
    return;
  }
  if (!rendered.value) return;
  state.value = "closed";
  deactivate();
  overlayOpacity.value = 0;
  spring.to(layout.value.effectiveHeight + 36, EXIT, () => {
    if (state.value === "closed") rendered.value = false;
  });
}, { immediate: true });

watch(dragY, (value) => {
  if (state.value === "open") spring.to(value, ENTER);
});

onBeforeUnmount(() => {
  spring.stop();
  deactivate();
});

// ── 손잡이 끌기(@use-gesture/react useDrag, axis y · filterTaps 대응)
let drag: { pointerId: number; startY: number; lastY: number; lastTime: number; velocity: number; direction: number } | null = null;

function onHandleDown(event: PointerEvent) {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  drag = { pointerId: event.pointerId, startY: event.clientY, lastY: event.clientY, lastTime: performance.now(), velocity: 0, direction: 0 };
  try { (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); } catch { /* 이미 취소된 포인터 */ }
}
function onHandleMove(event: PointerEvent) {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const now = performance.now();
  const delta = event.clientY - drag.lastY;
  const elapsed = now - drag.lastTime;
  if (elapsed > 0) drag.velocity = Math.abs(delta) / elapsed;
  if (delta !== 0) drag.direction = Math.sign(delta);
  drag.lastY = event.clientY;
  drag.lastTime = now;
  const movementY = event.clientY - drag.startY;
  if (Math.abs(movementY) < 3) return; // filterTaps
  dragY.value = Math.max(0, movementY);
}
function onHandleEnd(event: PointerEvent) {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const now = performance.now();
  // use-gesture 처럼 마지막 움직임 뒤 32ms 가 지나면 속도를 다시 잰다(멈췄다 놓으면 0).
  const velocityY = now - drag.lastTime > 32 ? Math.abs(event.clientY - drag.lastY) / (now - drag.lastTime) : drag.velocity;
  const nextY = Math.max(0, event.clientY - drag.startY);
  const shouldClose = nextY > 96 || (velocityY > 0.55 && drag.direction > 0);
  try { (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId); } catch { /* 이미 풀림 */ }
  drag = null;
  dragY.value = 0;
  if (shouldClose) requestOpenChange(false);
}

const portalTarget = computed<HTMLElement | string>(() => screenRef.value ?? "body");
const overlayStyle = computed(() => ({ opacity: overlayOpacity.value, pointerEvents: "auto" as const, transition: "opacity 0.16s ease-out" }));
const sheetStyle = computed(() => ({
  bottom: `${layout.value.sheetBottom}px`,
  maxHeight: `${layout.value.effectiveHeight}px`,
  transform: y.value === 0 ? "none" : `translateY(${y.value}px)`,
  pointerEvents: "auto" as const,
}));
</script>
<template>
  <Teleport v-if="rendered" :to="portalTarget">
    <div class="sheet-overlay" data-testid="sheet-overlay" :data-state="state" :style="overlayStyle" />
    <div
      ref="contentRef"
      class="bottom-sheet"
      data-testid="bottom-sheet"
      role="dialog"
      :id="uid"
      :aria-describedby="descriptionId"
      :aria-labelledby="titleId"
      :data-state="state"
      tabindex="-1"
      :style="sheetStyle"
    >
      <div
        class="sheet-handle-zone"
        data-testid="sheet-handle"
        @pointerdown="onHandleDown"
        @pointermove="onHandleMove"
        @pointerup="onHandleEnd"
        @pointercancel="onHandleEnd"
      >
        <div class="sheet-handle" />
      </div>
      <div class="sheet-header">
        <h2 :id="titleId" class="sheet-title">{{ title }}</h2>
        <p v-if="description" :id="descriptionId" class="sheet-description">{{ description }}</p>
      </div>
      <div class="sheet-content"><slot /></div>
    </div>
  </Teleport>
</template>
