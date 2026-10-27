<script setup lang="ts">
// 리액트 src/mobile/Keyboard.tsx 의 KeyboardProvider. 읽는 쪽은 composables/mobile/useKeyboard.
import { provide } from "vue";
import { KeyboardKey, createKeyboard } from "../../composables/mobile/useKeyboard";
import { useMobileDevice } from "../../composables/mobile/useMobileDevice";

const props = withDefaults(defineProps<{ simulated?: boolean }>(), { simulated: false });
provide(KeyboardKey, createKeyboard(useMobileDevice(), () => props.simulated));
</script>
<template>
  <slot />
</template>
