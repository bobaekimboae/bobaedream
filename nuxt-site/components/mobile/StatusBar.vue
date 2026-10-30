<script setup lang="ts">
// 리액트 src/mobile/components.tsx 의 StatusBar (+ 내부 StatusIndicators 를 같은 img 로 그린다).
import { computed, ref, watch } from "vue";
import { asset } from "@proto/data";
import { useMobileDevice } from "../../composables/mobile/useMobileDevice";

const now = ref(new Date());
const ctx = useMobileDevice();

watch(now, (value, _old, onCleanup) => {
  const syncToMinute = window.setTimeout(() => {
    now.value = new Date();
  }, (60 - value.getSeconds()) * 1000 - value.getMilliseconds());
  const interval = window.setInterval(() => { now.value = new Date(); }, 60_000);
  onCleanup(() => {
    window.clearTimeout(syncToMinute);
    window.clearInterval(interval);
  });
}, { immediate: true });

function formatStatusTime(date: Date) {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours % 12 || 12}:${minutes}`;
}
const indicatorSrc = computed(() => asset(ctx.device.platform === "android" ? "status/status-icons.svg" : "status/ios-status-icons.svg"));
</script>
<template>
  <div class="status-bar" aria-label="Device status bar">
    <span class="status-time" data-testid="status-time">{{ formatStatusTime(now) }}</span>
    <div class="status-indicators" aria-hidden="true">
      <img
        class="status-indicator-svg"
        data-testid="status-indicators"
        :data-platform="ctx.device.platform"
        :src="indicatorSrc"
        alt=""
        aria-hidden="true"
        :draggable="false"
      />
    </div>
  </div>
</template>
