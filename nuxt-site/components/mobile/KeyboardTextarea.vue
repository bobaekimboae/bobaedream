<script setup lang="ts">
// 리액트 src/mobile/Keyboard.tsx 의 KeyboardTextarea. 속성·이벤트는 textarea 로 넘어간다(값은 :value + @input).
import { ref } from "vue";
import { useKeyboard } from "../../composables/mobile/useKeyboard";

const keyboard = useKeyboard();
const el = ref<HTMLTextAreaElement | null>(null);
defineExpose({ el });
</script>
<template>
  <textarea ref="el" @focus="keyboard.show($event.currentTarget as HTMLElement)" />
</template>
