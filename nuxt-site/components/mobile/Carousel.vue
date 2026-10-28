<script setup lang="ts">
// 리액트 src/mobile/Carousel.tsx 를 그대로 옮김(같은 물리값 · 같은 DOM). children → 기본 slot.
// 리액트 data-dragging={bool} 은 "true"/"false" 글자로 그려지므로 Vue 에서도 글자로 넣는다.
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(defineProps<{
  className?: string;
  contentClassName?: string;
  ariaLabel?: string;
  showScrollbar?: boolean;
  draggingEnabled?: boolean;
}>(), { showScrollbar: false, draggingEnabled: true });

const physics = {
  friction: 2.1,
  velocityScale: 890,
  velocityTolerance: 18,
  bounceTension: 200,
  bounceFriction: 40,
  overdragScale: 0.5,
  maxOverdrag: 96,
  sampleWindow: 100,
  dragThreshold: 8,
} as const;

type Sample = { value: number; time: number };
type DragSession = {
  pointerId: number;
  startPrimary: number;
  startCross: number;
  startOffset: number;
  captured: boolean;
  dragged: boolean;
};

const scrollRef = ref<HTMLDivElement | null>(null);
let session: DragSession | null = null;
let samples: Sample[] = [];
let frame: number | null = null;
let overdragValue = 0;
let suppressClick = false;
const dragging = ref(false);
const overdrag = ref(0);
const thumb = ref({ visible: false, offset: 0, size: 0 });

const offset = (node: HTMLDivElement) => node.scrollLeft;
const setOffset = (node: HTMLDivElement, value: number) => { node.scrollLeft = value; };
const clientSize = (node: HTMLDivElement) => node.clientWidth;
const scrollSize = (node: HTMLDivElement) => node.scrollWidth;
const maxOffset = (node: HTMLDivElement) => Math.max(0, scrollSize(node) - clientSize(node));

function stopMotion() {
  if (frame !== null) window.cancelAnimationFrame(frame);
  frame = null;
}
function setRubberBand(value: number) {
  const next = Math.max(-physics.maxOverdrag, Math.min(physics.maxOverdrag, value));
  overdragValue = next;
  overdrag.value = next;
}

function updateThumb(visible = true) {
  if (!props.showScrollbar || !scrollRef.value) return;
  const node = scrollRef.value;
  const viewport = clientSize(node);
  const content = scrollSize(node);
  const enabled = content > viewport + 2;
  const size = enabled ? Math.max(36, (viewport / content) * viewport) : 0;
  const track = Math.max(0, viewport - size - 8);
  const progress = offset(node) / Math.max(1, content - viewport);
  thumb.value = { visible: visible && enabled, size, offset: enabled ? 4 + progress * track : 0 };
}

function springBack(initialVelocity = 0) {
  stopMotion();
  let position = overdragValue;
  let velocity = Math.max(-1400, Math.min(1400, initialVelocity));
  let previous: number | null = null;
  const tick = (time: number) => {
    const seconds = Math.min(0.034, ((previous === null ? 16 : time - previous) || 16) / 1000);
    previous = time;
    velocity += (-physics.bounceTension * position - physics.bounceFriction * velocity) * seconds;
    position += velocity * seconds;
    if (Math.abs(position) < 0.5 && Math.abs(velocity) < 0.5) {
      setRubberBand(0);
      frame = null;
      return;
    }
    setRubberBand(position);
    frame = window.requestAnimationFrame(tick);
  };
  frame = window.requestAnimationFrame(tick);
}

function momentum(node: HTMLDivElement, initialVelocity: number) {
  let velocity = initialVelocity;
  let previous: number | null = null;
  const tick = (time: number) => {
    const seconds = (previous === null ? 16 : Math.min(34, time - previous)) / 1000;
    previous = time;
    velocity *= Math.exp(-physics.friction * seconds);
    if (Math.abs(velocity) < physics.velocityTolerance) {
      frame = null;
      updateThumb(true);
      return;
    }
    const next = offset(node) + velocity * seconds;
    const maximum = maxOffset(node);
    if (next < 0 || next > maximum) {
      setOffset(node, Math.max(0, Math.min(maximum, next)));
      // Match MobileScroll's edge convention: positive displacement at the
      // leading edge, negative displacement at the trailing edge.
      setRubberBand((next < 0 ? -next : maximum - next) * physics.overdragScale);
      springBack(velocity * physics.overdragScale);
      return;
    }
    setOffset(node, next);
    updateThumb(true);
    frame = window.requestAnimationFrame(tick);
  };
  if (Math.abs(velocity) >= physics.velocityTolerance) frame = window.requestAnimationFrame(tick);
}

let observer: ResizeObserver | null = null;
const onScroll = () => updateThumb(true);
onMounted(() => {
  const node = scrollRef.value;
  if (!node) return;
  observer = new ResizeObserver(() => updateThumb(false));
  node.addEventListener("scroll", onScroll, { passive: true });
  observer.observe(node);
  if (node.firstElementChild) observer.observe(node.firstElementChild);
  updateThumb(false);
});
onBeforeUnmount(() => {
  scrollRef.value?.removeEventListener("scroll", onScroll);
  observer?.disconnect();
  stopMotion();
});

const primary = (event: PointerEvent) => event.clientX;
const cross = (event: PointerEvent) => event.clientY;
const record = (value: number) => {
  const time = performance.now();
  samples = [...samples, { value, time }].filter((sample) => time - sample.time <= physics.sampleWindow);
};

function onPointerDown(event: PointerEvent) {
  const node = scrollRef.value;
  if (!props.draggingEnabled || !node || maxOffset(node) <= 2 || (event.pointerType === "mouse" && event.button !== 0)) return;
  stopMotion();
  samples = [];
  record(primary(event));
  setRubberBand(0);
  session = { pointerId: event.pointerId, startPrimary: primary(event), startCross: cross(event), startOffset: offset(node), captured: false, dragged: false };
}

function onPointerMove(event: PointerEvent) {
  const node = scrollRef.value;
  const current = session;
  if (!node || !current || current.pointerId !== event.pointerId) return;
  const delta = primary(event) - current.startPrimary;
  const crossDelta = cross(event) - current.startCross;
  if (!current.dragged) {
    // Keep the gesture pending until it clears tap slop. Pointer-down and
    // these early moves must bubble so a parent MobileScroll can still win.
    if (Math.max(Math.abs(delta), Math.abs(crossDelta)) < physics.dragThreshold) return;
    if (Math.abs(crossDelta) > Math.abs(delta)) {
      // The cross axis won. Abandon this session without capturing or
      // canceling the event so the parent can handle this move and release.
      session = null;
      return;
    }
    // The scroller owns the gesture from this move onward. Capture keeps
    // delivery stable outside its bounds; stopping propagation prevents the
    // parent from accumulating vertical drift or release momentum.
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    current.captured = true;
  }
  event.preventDefault();
  event.stopPropagation();
  current.dragged = true;
  dragging.value = true;
  suppressClick = true;
  record(primary(event));
  const desired = current.startOffset - delta;
  const maximum = maxOffset(node);
  setOffset(node, Math.max(0, Math.min(maximum, desired)));
  setRubberBand(desired < 0 ? -desired * physics.overdragScale : desired > maximum ? -(desired - maximum) * physics.overdragScale : 0);
  updateThumb(true);
}

function finish(event: PointerEvent) {
  const node = scrollRef.value;
  const current = session;
  if (!node || !current || current.pointerId !== event.pointerId) return;
  if (current.captured) (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
  const first = samples[0];
  const last = samples[samples.length - 1];
  const velocity = first && last ? -((last.value - first.value) / Math.max(1, last.time - first.time)) * physics.velocityScale : 0;
  session = null;
  dragging.value = false;
  if (current.dragged) event.preventDefault();
  if (Math.abs(overdragValue) > 0.1) springBack(velocity * physics.overdragScale);
  else momentum(node, velocity);
}

function onClickCapture(event: MouseEvent) {
  if (!suppressClick) return;
  suppressClick = false;
  event.preventDefault();
  event.stopPropagation();
}

const style = computed(() => ({ "--mobile-carousel-overdrag": `${overdrag.value}px` }));
const thumbStyle = computed(() => ({ width: `${thumb.value.size}px`, transform: `translateX(${thumb.value.offset}px)` }));
</script>
<template>
  <div
    ref="scrollRef"
    :class="`mobile-carousel ${className ?? ''}`"
    :data-dragging="dragging ? 'true' : 'false'"
    :data-overscroll="overdrag.toFixed(2)"
    :aria-label="ariaLabel"
    :role="ariaLabel ? 'region' : undefined"
    :style="style"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="finish"
    @pointercancel="finish"
    @click.capture="onClickCapture"
  >
    <div :class="`mobile-carousel-content ${contentClassName ?? ''}`"><slot /></div>
    <div v-if="showScrollbar" class="mobile-carousel-scrollbar" :data-visible="thumb.visible ? 'true' : 'false'" aria-hidden="true">
      <div class="mobile-carousel-scrollbar-thumb" :style="thumbStyle" />
    </div>
  </div>
</template>
