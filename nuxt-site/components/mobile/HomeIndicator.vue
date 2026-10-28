<script setup lang="ts">
// 리액트 src/mobile/components.tsx 의 HomeIndicator.
import { asset } from "@proto/data";
import { useKeyboard } from "../../composables/mobile/useKeyboard";
import { useMobileDevice } from "../../composables/mobile/useMobileDevice";

const ctx = useMobileDevice();
const keyboard = useKeyboard();
const navSrc = asset("android/navigation-bar.svg");
</script>
<template>
  <template v-if="ctx.device.platform === 'android'">
    <img
      v-if="!keyboard.visible"
      class="android-navigation-bar"
      data-testid="android-navigation-bar"
      :src="navSrc"
      alt=""
      aria-hidden="true"
      :draggable="false"
    />
  </template>
  <svg
    v-else
    class="home-indicator-svg"
    data-testid="home-indicator"
    width="393"
    height="34"
    viewBox="0 0 393 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="129.5" y="21" width="134" height="5" rx="2.5" fill="black" />
  </svg>
</template>
