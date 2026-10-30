<script setup lang="ts">
// 리액트 src/mobile/FlowStack.tsx 를 옮김. 읽는 쪽은 composables/mobile/useFlow (provide/inject).
//
// ── FlowScreen 모양(Vue 판, composables/mobile/useFlow.ts 의 FlowScreen) ──
//   {
//     id: string;
//     title?: string;
//     component: Component;             // 리액트 render(flow) 자리 — 화면 본문 Vue 부품
//     props?: Record<string, unknown>;  // component 에 넘길 props(선택)
//     header?: Component;               // 리액트 header(flow) 자리 — header.flow-fixed-header 안에 그림
//     headerHeight?: number;
//     footer?: Component;               // 리액트 footer(flow) 자리 — footer.flow-fixed-footer 안에 그림
//     footerHeight?: number;
//   }
//   부품에는 flow 를 props 로 넘기지 않는다. 부품 안에서 useFlow() 로 읽는다. 함수형 부품(() => h(...))도 된다.
//   예) const listScreen: FlowScreen = { id: "marketplace", component: MarketplaceScreenWithBack };
//       <FlowStack :initial="listScreen" />
//
// 리액트는 motion/react(AnimatePresence · spring) 와 @use-gesture/react(왼쪽 가장자리 밀기)를 썼다. 같은 값으로 직접 만든다:
//  · 화면 전환 스프링 stiffness 360 · damping 38 · mass 0.9. 새 맨 위 화면은 오른쪽 밖(push) / 왼쪽 -28%(pop)에서 들어오고,
//    빠지는 화면은 애니메이션이 끝날 때까지 남아 있다(AnimatePresence 와 같음, 처음 화면은 애니메이션 없음).
//  · 왼쪽 가장자리 28px 안에서 시작한 가로 터치 밀기: 92px 넘게 또는 오른쪽으로 빠르게(0.45px/ms 초과) 놓으면 pop.
//  · header/footer 가 "있는지"는 부품을 줬는지로 정한다(리액트는 render 결과가 null 이면 숨겼다).
import { computed, markRaw, provide, reactive, ref, shallowRef, watch } from "vue";
import { useMobileDevice } from "../../composables/mobile/useMobileDevice";
import { useKeyboard, useKeyboardDismissDrag, useKeyboardInsets } from "../../composables/mobile/useKeyboard";
import { FlowKey, type FlowControls, type FlowEntry, type FlowScreen } from "../../composables/mobile/useFlow";
import { Spring, type SpringOptions } from "../../composables/mobile/spring";

const props = defineProps<{ initial: FlowScreen }>();

const ctx = useMobileDevice();
const keyboard = useKeyboard();
const insets = useKeyboardInsets();
const dismissKeyboardDrag = useKeyboardDismissDrag();
let sequence = 1;
const toEntryWithKey = (screen: FlowScreen, key: string): FlowEntry => markRaw({ ...screen, key });
const stack = shallowRef<FlowEntry[]>([toEntryWithKey(props.initial, `${props.initial.id}-0`)]);
const direction = ref(1);
const swipeX = ref(0);

function toEntry(screen: FlowScreen): FlowEntry {
  const next = sequence;
  sequence += 1;
  return toEntryWithKey(screen, `${screen.id}-${next}`);
}

function pop() {
  keyboard.hide();
  direction.value = -1;
  if (stack.value.length <= 1) return;
  stack.value = stack.value.slice(0, -1);
}

const controls = reactive({
  current: computed(() => stack.value[stack.value.length - 1]),
  previous: computed(() => (stack.value.length > 1 ? stack.value[stack.value.length - 2] : null)),
  stack: computed(() => stack.value),
  canGoBack: computed(() => stack.value.length > 1),
  push: (screen: FlowScreen) => {
    keyboard.hide();
    direction.value = 1;
    swipeX.value = 0;
    stack.value = [...stack.value, toEntry(screen)];
  },
  pop,
  replace: (screen: FlowScreen) => {
    keyboard.hide();
    direction.value = 1;
    swipeX.value = 0;
    stack.value = [...stack.value.slice(0, -1), toEntry(screen)];
  },
}) as FlowControls;
provide(FlowKey, controls);

const screenWidth = computed(() => ctx.device.geometry.screen.width);
const parkedX = computed(() => -screenWidth.value * 0.28);
const current = computed(() => controls.current);
const headerHeight = computed(() => current.value.headerHeight ?? 0);
const headerSafeArea = computed(() => (current.value.header ? ctx.device.geometry.safeArea.top : 0));
const totalHeaderHeight = computed(() => (current.value.header ? headerSafeArea.value + headerHeight.value : 0));
const footerHeight = computed(() => current.value.footerHeight ?? 0);

// ── 화면별 스프링(x · scale)
const SPRING_X: SpringOptions = { stiffness: 360, damping: 38, mass: 0.9 };
const SPRING_S: SpringOptions = { stiffness: 360, damping: 38, mass: 0.9, restDelta: 0.005, restSpeed: 0.01 };
type Anim = { x: Spring; s: Spring };
const pos = reactive<Record<string, { x: number; s: number }>>({});
const anims = new Map<string, Anim>();
type Exiting = { entry: FlowEntry; index: number; isTop: boolean; isVisible: boolean };
const exiting = shallowRef<Exiting[]>([]);

function ensureAnim(key: string, x: number, s: number) {
  let anim = anims.get(key);
  if (anim) return anim;
  pos[key] = { x, s };
  anim = {
    x: new Spring(x, (value) => { if (pos[key]) pos[key].x = value; }),
    s: new Spring(s, (value) => { if (pos[key]) pos[key].s = value; }),
  };
  anims.set(key, anim);
  return anim;
}

function dropAnim(key: string) {
  const anim = anims.get(key);
  anim?.x.stop();
  anim?.s.stop();
  anims.delete(key);
  delete pos[key];
}

function retarget() {
  const list = stack.value;
  const top = list.length - 1;
  list.forEach((entry, index) => {
    const isTop = index === top;
    const anim = ensureAnim(entry.key, isTop ? swipeX.value : parkedX.value, isTop ? 1 : 0.985);
    anim.x.to(isTop ? swipeX.value : parkedX.value, SPRING_X);
    anim.s.to(isTop ? 1 : 0.985, SPRING_S);
  });
}

// 처음 화면: AnimatePresence initial={false} → 애니메이션 없이 제자리
ensureAnim(stack.value[0].key, 0, 1);

watch(stack, (next, prev) => {
  const nextKeys = new Set(next.map((entry) => entry.key));
  const prevKeys = new Set(prev.map((entry) => entry.key));
  const prevTop = prev.length - 1;
  prev.forEach((entry, index) => {
    if (nextKeys.has(entry.key)) return;
    const record: Exiting = { entry, index, isTop: index === prevTop, isVisible: index >= prevTop - 1 };
    exiting.value = [...exiting.value, record];
    const anim = ensureAnim(entry.key, parkedX.value, 0.985);
    const exitX = direction.value < 0 ? screenWidth.value : parkedX.value;
    const exitS = direction.value < 0 ? 1 : 0.985;
    let pending = 2;
    const done = () => {
      pending -= 1;
      if (pending > 0) return;
      exiting.value = exiting.value.filter((item) => item !== record);
      dropAnim(entry.key);
    };
    anim.x.to(exitX, SPRING_X, done);
    anim.s.to(exitS, SPRING_S, done);
  });
  const top = next.length - 1;
  next.forEach((entry, index) => {
    if (prevKeys.has(entry.key) || anims.has(entry.key)) return;
    if (index === top) {
      // variants.enter
      ensureAnim(entry.key, direction.value > 0 ? screenWidth.value : parkedX.value, direction.value > 0 ? 1 : 0.985);
    }
  });
  retarget();
});

watch([swipeX, parkedX], retarget);

const renderList = computed(() => {
  const list = stack.value;
  const top = list.length - 1;
  const items = list.map((entry, index) => ({ entry, isTop: index === top, isVisible: index >= top - 1 }));
  for (const record of exiting.value) {
    items.splice(Math.min(record.index, items.length), 0, { entry: record.entry, isTop: record.isTop, isVisible: record.isVisible });
  }
  return items;
});

function transformOf(key: string) {
  const value = pos[key];
  if (!value) return "none";
  const parts: string[] = [];
  if (value.x !== 0) parts.push(`translateX(${value.x}px)`);
  if (value.s !== 1) parts.push(`scale(${value.s})`);
  return parts.length ? parts.join(" ") : "none";
}

function screenStyle(item: { entry: FlowEntry; isTop: boolean; isVisible: boolean }) {
  return {
    opacity: item.isVisible ? 1 : 0,
    pointerEvents: (item.isTop ? "auto" : "none") as "auto" | "none",
    visibility: (item.isVisible ? "visible" : "hidden") as "visible" | "hidden",
    zIndex: item.isTop ? 2 : 1,
    transform: transformOf(item.entry.key),
  };
}

const stackStyle = computed(() => ({
  "--flow-header-height": `${totalHeaderHeight.value}px`,
  "--flow-header-content-height": `${headerHeight.value}px`,
  "--flow-header-safe-area": `${headerSafeArea.value}px`,
  "--flow-footer-height": `${current.value.footer ? footerHeight.value : 0}px`,
  "--keyboard-height": `${insets.bottomInset}px`,
}));

// ── 왼쪽 가장자리 밀기(useDrag axis x · filterTaps · pointer.touch → 터치 이벤트)
type EdgeGesture = { id: number; startX: number; startY: number; edge: boolean; axis: "x" | "y" | null; lastX: number; lastTime: number; velocity: number; direction: number };
let gesture: EdgeGesture | null = null;
const findTouch = (list: TouchList, id: number) => Array.from(list).find((touch) => touch.identifier === id) ?? null;

function onTouchStart(event: TouchEvent) {
  if (!controls.canGoBack || gesture) return;
  const touch = event.changedTouches[0];
  if (!touch) return;
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
  gesture = { id: touch.identifier, startX: touch.clientX, startY: touch.clientY, edge: touch.clientX - bounds.left < 28, axis: null, lastX: touch.clientX, lastTime: performance.now(), velocity: 0, direction: 0 };
}

function onTouchMove(event: TouchEvent) {
  if (!gesture) return;
  const touch = findTouch(event.changedTouches, gesture.id);
  if (!touch) return;
  if (!controls.canGoBack) return;
  const dx = touch.clientX - gesture.startX;
  const dy = touch.clientY - gesture.startY;
  if (gesture.axis === null) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 3) return;
    gesture.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
  }
  if (gesture.axis !== "x") return;
  const now = performance.now();
  const delta = touch.clientX - gesture.lastX;
  const elapsed = now - gesture.lastTime;
  if (elapsed > 0) gesture.velocity = Math.abs(delta) / elapsed;
  if (delta !== 0) gesture.direction = Math.sign(delta);
  gesture.lastX = touch.clientX;
  gesture.lastTime = now;
  if (!gesture.edge) return;
  swipeX.value = Math.max(0, Math.min(dx, screenWidth.value));
}

function onTouchEnd(event: TouchEvent) {
  if (!gesture) return;
  const touch = findTouch(event.changedTouches, gesture.id);
  if (!touch) return;
  const current = gesture;
  gesture = null;
  if (!controls.canGoBack || !current.edge || current.axis === "y") return;
  const now = performance.now();
  const velocityX = now - current.lastTime > 32 ? Math.abs(touch.clientX - current.lastX) / (now - current.lastTime) : current.velocity;
  const nextX = Math.max(0, Math.min(touch.clientX - current.startX, screenWidth.value));
  const shouldPop = nextX > 92 || (velocityX > 0.45 && current.direction > 0);
  swipeX.value = 0;
  if (shouldPop) controls.pop();
}
</script>
<template>
  <div
    class="flow-stack"
    data-testid="flow-stack"
    :data-keyboard-dragging="insets.keyboardDragging ? 'true' : 'false'"
    :style="stackStyle"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend.passive="onTouchEnd"
    @touchcancel.passive="onTouchEnd"
  >
    <header v-if="current.header" class="flow-fixed-header" data-testid="flow-fixed-header">
      <component :is="current.header" />
    </header>
    <div class="flow-scenes">
      <div
        v-for="item in renderList"
        :key="item.entry.key"
        class="flow-screen"
        :data-flow-current="item.isTop ? 'true' : 'false'"
        :data-testid="item.isTop ? 'flow-current' : undefined"
        :style="screenStyle(item)"
      >
        <component :is="item.entry.component" v-bind="item.entry.props ?? {}" />
      </div>
    </div>
    <footer v-if="current.footer" class="flow-fixed-footer" data-testid="flow-fixed-footer" v-on="dismissKeyboardDrag">
      <component :is="current.footer" />
    </footer>
  </div>
</template>
