// 리액트 src/mobile/Keyboard.tsx 의 KeyboardContext · useKeyboard · useKeyboardInsets · useKeyboardDismissDrag.
// Provider 는 components/mobile/KeyboardProvider.vue, 값 만들기는 createKeyboard().
// 돌려주는 값은 리액트와 같은 이름의 reactive 객체다(keyboard.visible, keyboard.hide() …).
// 구조 분해하면 반응성이 사라지므로 const kb = useKeyboard(); kb.visible 처럼 읽는다(필요하면 toRefs).
import { computed, inject, markRaw, reactive, ref, shallowRef, type InjectionKey } from "vue";
import { useMobileDevice, type MobileDeviceContextValue } from "./useMobileDevice";

export type KeyboardContextValue = {
  readonly visible: boolean;
  readonly height: number;
  readonly fullHeight: number;
  readonly progress: number;
  readonly dragOffset: number;
  readonly isDragging: boolean;
  readonly focusedElement: HTMLElement | null;
  setDragOffset: (offset: number) => void;
  setDragging: (dragging: boolean) => void;
  show: (element?: HTMLElement | null) => void;
  hide: () => void;
};

export const KeyboardKey: InjectionKey<KeyboardContextValue> = Symbol("Keyboard");

export function createKeyboard(device: MobileDeviceContextValue, simulated: () => boolean): KeyboardContextValue {
  const visible = ref(false);
  const dragOffset = ref(0);
  const isDragging = ref(false);
  const focusedElement = shallowRef<HTMLElement | null>(null);
  const fullHeight = computed(() => (simulated() ? device.device.geometry.keyboard.height : 0));

  return reactive({
    visible,
    height: computed(() => (visible.value ? Math.max(0, fullHeight.value - dragOffset.value) : 0)),
    fullHeight,
    dragOffset,
    isDragging,
    progress: computed(() => (visible.value ? 1 : 0)),
    focusedElement,
    setDragOffset: (offset: number) => {
      dragOffset.value = Math.max(0, Math.min(fullHeight.value, offset));
    },
    setDragging: (dragging: boolean) => {
      isDragging.value = dragging;
    },
    show: (element?: HTMLElement | null) => {
      dragOffset.value = 0;
      isDragging.value = false;
      focusedElement.value = element ? markRaw(element) : null;
      visible.value = simulated();
    },
    hide: () => {
      focusedElement.value?.blur();
      isDragging.value = false;
      focusedElement.value = null;
      visible.value = false;
    },
  }) as KeyboardContextValue;
}

export function useKeyboard() {
  const context = inject(KeyboardKey, null);
  if (!context) throw new Error("useKeyboard must be used inside KeyboardProvider");
  return context;
}

export type KeyboardInsets = {
  readonly keyboardHeight: number;
  readonly keyboardFullHeight: number;
  readonly keyboardDragging: boolean;
  readonly bottomInset: number;
  readonly availableHeight: number;
  readonly isKeyboardVisible: boolean;
};

export function useKeyboardInsets(): KeyboardInsets {
  const keyboard = useKeyboard();
  const ctx = useMobileDevice();
  const reservesAndroidNavigation = computed(() => ctx.device.platform === "android" && !keyboard.visible);

  return reactive({
    keyboardHeight: computed(() => keyboard.height),
    keyboardFullHeight: computed(() => keyboard.fullHeight),
    keyboardDragging: computed(() => keyboard.isDragging),
    bottomInset: computed(() =>
      reservesAndroidNavigation.value
        ? 0
        : ctx.device.platform === "android"
          ? keyboard.height
          : Math.max(ctx.device.geometry.safeArea.bottom, keyboard.height),
    ),
    availableHeight: computed(
      () =>
        ctx.device.geometry.screen.height -
        keyboard.height -
        (reservesAndroidNavigation.value ? ctx.device.geometry.safeArea.bottom : 0),
    ),
    isKeyboardVisible: computed(() => keyboard.visible),
  }) as KeyboardInsets;
}

// 리액트는 { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } 를 펼쳐 붙였다.
// Vue 에서는 템플릿에 v-on="dismissDrag" 로 붙인다(키가 Vue 이벤트 이름).
export function useKeyboardDismissDrag() {
  const keyboard = useKeyboard();
  const drag = { pointerId: null as number | null, startY: 0, lastY: 0, lastTime: 0, velocityY: 0 };

  const endDismissDrag = (event: PointerEvent) => {
    if (drag.pointerId !== event.pointerId) return;
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      // Capture may already be gone after pointer cancel.
    }
    const nextY = Math.max(0, event.clientY - drag.startY);
    const shouldDismiss = nextY > 76 || drag.velocityY > 0.45;
    drag.pointerId = null;
    if (shouldDismiss) {
      keyboard.setDragOffset(nextY);
      keyboard.hide();
      return;
    }
    keyboard.setDragging(false);
    keyboard.setDragOffset(0);
  };

  return {
    pointerdown: (event: PointerEvent) => {
      if (!keyboard.visible) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (
        event.target instanceof Element &&
        event.target.closest('button, input, textarea, select, a, [role="button"], [contenteditable="true"]')
      ) {
        return;
      }
      keyboard.setDragging(true);
      drag.pointerId = event.pointerId;
      drag.startY = event.clientY;
      drag.lastY = event.clientY;
      drag.lastTime = performance.now();
      drag.velocityY = 0;
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    },
    pointermove: (event: PointerEvent) => {
      if (drag.pointerId !== event.pointerId) return;
      const now = performance.now();
      const elapsed = Math.max(1, now - drag.lastTime);
      drag.velocityY = (event.clientY - drag.lastY) / elapsed;
      drag.lastY = event.clientY;
      drag.lastTime = now;
      keyboard.setDragOffset(Math.max(0, event.clientY - drag.startY));
    },
    pointerup: endDismissDrag,
    pointercancel: endDismissDrag,
  };
}
