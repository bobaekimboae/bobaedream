<script setup lang="ts">
// 리액트 src/mobile/MobileScroll.tsx 를 그대로 옮김(같은 물리값 · 같은 DOM · 같은 data 속성). children → 기본 slot.
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useKeyboardInsets } from "../../composables/mobile/useKeyboard";

defineProps<{ className?: string }>();

const scrollPhysics = {
  momentumFriction: 2.1,
  momentumVelocityScale: 890,
  momentumTolerance: 18,
  bounceTension: 200,
  bounceFriction: 40,
  bounceTolerance: 0.5,
  overdragScale: 0.5,
  maxOverdrag: 96,
  velocitySampleWindow: 100,
  tapSlop: 8,
} as const;

function shouldIgnoreScrollDrag(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('[data-scroll-drag="ignore"]'));
}

type DragSample = { y: number; time: number };
type DragSession = {
  active: boolean;
  captured: boolean;
  pointerId: number | null;
  startY: number;
  startScrollTop: number;
  hasDragged: boolean;
};

const emptySession = (): DragSession => ({ active: false, captured: false, pointerId: null, startY: 0, startScrollTop: 0, hasDragged: false });

const insets = useKeyboardInsets();
const scrollRef = ref<HTMLDivElement | null>(null);
let hideTimer: number | null = null;
let inertiaFrame: number | null = null;
let lastInertiaTime: number | null = null;
let overscroll = 0;
let dragSamples: DragSample[] = [];
let isDraggingNow = false;
let suppressNextClick = false;
let suppressClickTimer: number | null = null;
let dragSession: DragSession = emptySession();
const isDragging = ref(false);
const overscrollY = ref(0);
const thumb = ref({ visible: false, top: 0, height: 0, enabled: false });

function stopInertia() {
  if (inertiaFrame !== null) {
    window.cancelAnimationFrame(inertiaFrame);
    inertiaFrame = null;
  }
  lastInertiaTime = null;
}

function suppressUpcomingClick() {
  suppressNextClick = true;
  if (suppressClickTimer !== null) window.clearTimeout(suppressClickTimer);
  suppressClickTimer = window.setTimeout(() => {
    suppressNextClick = false;
    suppressClickTimer = null;
  }, 180);
}

function setRubberBand(value: number) {
  const clamped = Math.max(-scrollPhysics.maxOverdrag, Math.min(scrollPhysics.maxOverdrag, value));
  overscroll = clamped;
  overscrollY.value = clamped;
}

const maxScrollTop = (scroll: HTMLDivElement) => Math.max(0, scroll.scrollHeight - scroll.clientHeight);
const rubberBand = (distance: number) => distance * scrollPhysics.overdragScale;

function pushDragSample(y: number) {
  const time = performance.now();
  dragSamples = [...dragSamples, { y, time }].filter((sample) => time - sample.time <= scrollPhysics.velocitySampleWindow);
}

function releaseVelocity() {
  const samples = dragSamples;
  if (samples.length < 2) return 0;
  const first = samples[0];
  const last = samples[samples.length - 1];
  const elapsed = Math.max(1, last.time - first.time);
  const pointerVelocity = (last.y - first.y) / elapsed;
  return -pointerVelocity * scrollPhysics.momentumVelocityScale;
}

function springBack(initialVelocity = 0) {
  stopInertia();
  let position = overscroll;
  let velocity = Math.max(-1400, Math.min(1400, initialVelocity));
  let lastTime: number | null = null;
  const step = (time: number) => {
    const deltaTime = Math.min(0.034, ((lastTime === null ? time : time - lastTime) || 16) / 1000);
    lastTime = time;
    const acceleration = -scrollPhysics.bounceTension * position - scrollPhysics.bounceFriction * velocity;
    velocity += acceleration * deltaTime;
    position += velocity * deltaTime;
    if (Math.abs(position) < scrollPhysics.bounceTolerance && Math.abs(velocity) < scrollPhysics.bounceTolerance) {
      setRubberBand(0);
      inertiaFrame = null;
      return;
    }
    setRubberBand(position);
    inertiaFrame = window.requestAnimationFrame(step);
  };
  inertiaFrame = window.requestAnimationFrame(step);
}

function updateThumb(visible = true) {
  const scroll = scrollRef.value;
  if (!scroll) return;
  const { clientHeight, scrollHeight, scrollTop } = scroll;
  const enabled = scrollHeight > clientHeight + 2;
  const height = enabled ? Math.max(36, (clientHeight / scrollHeight) * clientHeight) : 0;
  const maxThumbTop = Math.max(0, clientHeight - height - 8);
  const maxTop = Math.max(1, scrollHeight - clientHeight);
  const top = enabled ? 4 + (scrollTop / maxTop) * maxThumbTop : 0;
  thumb.value = { visible: visible && enabled, top, height, enabled };
  if (hideTimer !== null) window.clearTimeout(hideTimer);
  if (visible && enabled && !isDraggingNow) {
    hideTimer = window.setTimeout(() => {
      thumb.value = { ...thumb.value, visible: false };
    }, 650);
  }
}

function applyDragPosition(startScrollTop: number, movementY: number, scroll: HTMLDivElement) {
  const desiredScrollTop = startScrollTop - movementY;
  const maxTop = maxScrollTop(scroll);
  if (desiredScrollTop < 0) {
    scroll.scrollTop = 0;
    setRubberBand(rubberBand(-desiredScrollTop));
  } else if (desiredScrollTop > maxTop) {
    scroll.scrollTop = maxTop;
    setRubberBand(-rubberBand(desiredScrollTop - maxTop));
  } else {
    scroll.scrollTop = desiredScrollTop;
    setRubberBand(0);
  }
  updateThumb(true);
}

let resizeObserver: ResizeObserver | null = null;
const handleScroll = () => updateThumb(true);

onMounted(() => {
  updateThumb(false);
  const scroll = scrollRef.value;
  if (!scroll) return;
  resizeObserver = new ResizeObserver(() => updateThumb(false));
  scroll.addEventListener("scroll", handleScroll, { passive: true });
  resizeObserver.observe(scroll);
  if (scroll.firstElementChild) resizeObserver.observe(scroll.firstElementChild);
});

onBeforeUnmount(() => {
  scrollRef.value?.removeEventListener("scroll", handleScroll);
  resizeObserver?.disconnect();
  if (hideTimer !== null) window.clearTimeout(hideTimer);
  if (suppressClickTimer !== null) window.clearTimeout(suppressClickTimer);
  stopInertia();
});

watch(() => insets.keyboardHeight, () => updateThumb(false));

function startMomentum(scroll: HTMLDivElement, initialVelocity: number) {
  let velocity = initialVelocity;
  const step = (time: number) => {
    const deltaTime = lastInertiaTime === null ? 16 : Math.min(34, time - lastInertiaTime);
    const deltaSeconds = deltaTime / 1000;
    lastInertiaTime = time;
    velocity *= Math.exp(-scrollPhysics.momentumFriction * deltaSeconds);
    if (Math.abs(velocity) < scrollPhysics.momentumTolerance) {
      updateThumb(true);
      lastInertiaTime = null;
      inertiaFrame = null;
      return;
    }
    const maxTop = maxScrollTop(scroll);
    const attempted = scroll.scrollTop + velocity * deltaSeconds;
    const before = scroll.scrollTop;
    if (attempted < 0) {
      scroll.scrollTop = 0;
      setRubberBand(rubberBand(-attempted));
      springBack(velocity * scrollPhysics.overdragScale);
      return;
    }
    if (attempted > maxTop) {
      scroll.scrollTop = maxTop;
      setRubberBand(-rubberBand(attempted - maxTop));
      springBack(velocity * scrollPhysics.overdragScale);
      return;
    }
    scroll.scrollTop = attempted;
    updateThumb(true);
    if (scroll.scrollTop === before) {
      lastInertiaTime = null;
      inertiaFrame = null;
      return;
    }
    inertiaFrame = window.requestAnimationFrame(step);
  };
  if (Math.abs(velocity) > scrollPhysics.momentumTolerance) {
    lastInertiaTime = null;
    inertiaFrame = window.requestAnimationFrame(step);
  } else {
    updateThumb(true);
  }
}

function endDrag(event: PointerEvent) {
  const scroll = scrollRef.value;
  const session = dragSession;
  if (!scroll || !session.active || session.pointerId !== event.pointerId) return;

  // A nested horizontal scroller can let pointer-down bubble, then claim
  // pointer-move. Its pointer-up may still reach this parent. Without a
  // completed parent drag there is no valid release velocity or click to
  // suppress, so discard the pending session without starting motion.
  if (!session.hasDragged) {
    dragSamples = [];
    dragSession = emptySession();
    isDragging.value = false;
    isDraggingNow = false;
    return;
  }

  if (session.captured) {
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture can already be gone after a browser-level cancel.
    }
  }

  if (session.hasDragged) {
    event.preventDefault();
    suppressUpcomingClick();
  }

  pushDragSample(event.clientY);
  const velocity = releaseVelocity();
  dragSession = emptySession();
  isDragging.value = false;
  isDraggingNow = false;

  if (Math.abs(overscroll) > 0.1) {
    springBack(velocity * scrollPhysics.overdragScale);
    return;
  }
  startMomentum(scroll, velocity);
}

function handlePointerDown(event: PointerEvent) {
  const scroll = scrollRef.value;
  if (!scroll || scroll.scrollHeight <= scroll.clientHeight) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  stopInertia();
  if (shouldIgnoreScrollDrag(event.target)) {
    setRubberBand(0);
    return;
  }
  isDraggingNow = false;
  dragSamples = [];
  pushDragSample(event.clientY);
  setRubberBand(0);
  thumb.value = { ...thumb.value, visible: thumb.value.enabled };
  dragSession = {
    active: true,
    captured: false,
    pointerId: event.pointerId,
    startY: event.clientY,
    startScrollTop: scroll.scrollTop,
    hasDragged: false,
  };
}

function handlePointerMove(event: PointerEvent) {
  const scroll = scrollRef.value;
  const session = dragSession;
  if (!scroll || !session.active || session.pointerId !== event.pointerId) return;
  const movementY = event.clientY - session.startY;
  if (!session.hasDragged && Math.abs(movementY) < scrollPhysics.tapSlop) return;
  if (!session.captured) {
    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      session.captured = true;
    } catch {
      // Pointer capture can fail if the browser has already canceled the pointer.
    }
  }
  event.preventDefault();
  session.hasDragged = true;
  suppressUpcomingClick();
  isDraggingNow = true;
  isDragging.value = true;
  pushDragSample(event.clientY);
  applyDragPosition(session.startScrollTop, movementY, scroll);
}

function suppressClickAfterDrag(event: MouseEvent) {
  if (!suppressNextClick) return;
  suppressNextClick = false;
  if (suppressClickTimer !== null) {
    window.clearTimeout(suppressClickTimer);
    suppressClickTimer = null;
  }
  event.preventDefault();
  event.stopPropagation();
}

const pageStyle = computed(() => ({ "--keyboard-height": `${insets.keyboardHeight}px` }));
</script>
<template>
  <section
    :class="`mobile-page ${className ?? ''}`"
    :data-keyboard-dragging="insets.keyboardDragging ? 'true' : 'false'"
    :data-keyboard-visible="insets.isKeyboardVisible ? 'true' : 'false'"
    :style="pageStyle"
  >
    <div
      ref="scrollRef"
      class="mobile-scroll"
      data-testid="mobile-scroll"
      :data-dragging="isDragging ? 'true' : 'false'"
      :data-overscroll="overscrollY.toFixed(2)"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @click.capture="suppressClickAfterDrag"
    >
      <div class="mobile-scroll-content" data-testid="mobile-scroll-content" :style="{ transform: `translateY(${overscrollY}px)` }">
        <slot />
      </div>
    </div>
    <div class="mobile-scrollbar" data-testid="mobile-scrollbar" :data-visible="thumb.visible ? 'true' : 'false'" aria-hidden="true">
      <div class="mobile-scrollbar-thumb" :style="{ height: `${thumb.height}px`, transform: `translateY(${thumb.top}px)` }" />
    </div>
  </section>
</template>
