<script setup lang="ts">
// 리액트 src/mobile/MobileRuntime.tsx. MobileAppViewport(작은 내부 부품)는 같은 div 를 그대로 그린다.
import MobileDeviceProvider from "./MobileDeviceProvider.vue";
import PhoneFrame from "./PhoneFrame.vue";
import KeyboardProvider from "./KeyboardProvider.vue";
</script>
<template>
  <MobileDeviceProvider>
    <PhoneFrame>
      <KeyboardProvider>
        <div class="mobile-app-viewport" data-keyboard-visible="false" data-platform="web" data-testid="mobile-app-viewport">
          <slot />
        </div>
      </KeyboardProvider>
    </PhoneFrame>
  </MobileDeviceProvider>
</template>
