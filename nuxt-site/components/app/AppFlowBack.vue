<script setup lang="ts">
// 리액트 src/prototype/app/AppFlowBack.tsx. 그리는 것은 없다.
// The native shell asks the current prototype screen to consume Back before
// falling back to WebView's document history. No native methods are exposed.
import { onBeforeUnmount, onMounted } from "vue";
import { useFlow } from "../../composables/mobile/useFlow";

const props = defineProps<{ screenId: string }>();
const flow = useFlow();

const back = (event: Event) => {
  if (event.defaultPrevented || flow.current.id !== props.screenId) return;
  if (document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]')) {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
    event.preventDefault();
  } else if (flow.canGoBack) {
    event.preventDefault();
    flow.pop();
  }
};
onMounted(() => window.addEventListener("bbm-app-back", back));
onBeforeUnmount(() => window.removeEventListener("bbm-app-back", back));
</script>
<template>
  <template v-if="false" />
</template>
