<script setup lang="ts">
// 리액트 src/mobile/Keyboard.tsx 의 KeyboardDock. motion.div 의 y 애니메이션(0.26s · ease [0.2,0.8,0.2,1], 끌 때 0초)은
// CSS transition 으로 같은 값을 쓴다. 처음 그릴 때는 리액트 initial 처럼 y = fullHeight 에서 시작한다.
import { computed, onMounted, ref } from "vue";
import { asset } from "@proto/data";
import { useKeyboard, useKeyboardDismissDrag } from "../../composables/mobile/useKeyboard";
import { useMobileDevice } from "../../composables/mobile/useMobileDevice";

const keyboard = useKeyboard();
const ctx = useMobileDevice();
const dismissDrag = useKeyboardDismissDrag();
const mounted = ref(false);
onMounted(() => window.requestAnimationFrame(() => { mounted.value = true; }));

const y = computed(() => (!mounted.value ? keyboard.fullHeight : keyboard.visible ? keyboard.dragOffset : keyboard.fullHeight));
const style = computed(() => ({
  height: `${keyboard.fullHeight}px`,
  transform: y.value === 0 ? "none" : `translateY(${y.value}px)`,
  transition: keyboard.isDragging || !mounted.value ? "none" : "transform 0.26s cubic-bezier(0.2, 0.8, 0.2, 1)",
}));
const src = computed(() => asset(ctx.device.platform === "android" ? "android/Keyboard.png" : "iphone/Keyboard.png"));
</script>
<template>
  <div
    class="keyboard-dock"
    :data-platform="ctx.device.platform"
    data-testid="keyboard-dock"
    :data-visible="keyboard.visible ? 'true' : 'false'"
    :aria-hidden="keyboard.visible ? undefined : 'true'"
    :style="style"
    v-on="dismissDrag"
  >
    <img class="keyboard-asset" :src="src" alt="" aria-hidden="true" :draggable="false" />
  </div>
</template>
