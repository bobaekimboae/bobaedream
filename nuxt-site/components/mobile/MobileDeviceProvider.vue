<script setup lang="ts">
// 리액트 src/mobile/Device.tsx 의 MobileDeviceProvider. 기본 기기 iphone. 읽는 쪽은 composables/mobile/useMobileDevice.
import { provide } from "vue";
import { MobileDeviceKey, createMobileDevice } from "../../composables/mobile/useMobileDevice";

provide(MobileDeviceKey, createMobileDevice());
</script>
<template>
  <slot />
</template>
