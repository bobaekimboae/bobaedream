<script setup lang="ts">
// 리액트 src/mobile/PhoneFrame.tsx. 화면 div 를 screenRef 로 내려 준다(읽는 쪽 useScreenPortal → screenRef.value).
import { provide, ref } from "vue";
import { ScreenPortalKey } from "../../composables/mobile/useScreenPortal";

const screenRef = ref<HTMLDivElement | null>(null);
provide(ScreenPortalKey, { screenRef });

function suppressNativeDrag(event: DragEvent) {
  if (event.target instanceof Element && event.target.closest('[data-native-drag="true"]')) {
    return;
  }
  event.preventDefault();
}
</script>
<template>
  <div class="mobile-web-stage" data-runtime="mobile-web" data-testid="phone-frame" @dragstart.capture="suppressNativeDrag">
    <div
      ref="screenRef"
      class="device-screen mobile-web-screen"
      data-phone-screen
      data-testid="device-screen"
      :style="{
        '--device-safe-area-top': 'env(safe-area-inset-top, 0px)',
        '--device-safe-area-bottom': 'env(safe-area-inset-bottom, 0px)',
      }"
    >
      <slot />
    </div>
  </div>
</template>
