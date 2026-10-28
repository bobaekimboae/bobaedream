<script setup lang="ts">
// 리액트 src/mobile/Keyboard.tsx 의 KeyboardInput. 모든 속성·이벤트는 input 으로 그대로 넘어간다(값은 :value + @input).
// 포커스되면 keyboard.show(입력칸) 을 먼저 부르고, 부모의 @focus 가 그다음 불린다(리액트와 같은 순서).
// 리액트 ref 전달 → defineExpose({ el }) (el.value = input 요소).
import { ref } from "vue";
import { useKeyboard } from "../../composables/mobile/useKeyboard";

const keyboard = useKeyboard();
const el = ref<HTMLInputElement | null>(null);
defineExpose({ el });
</script>
<template>
  <input ref="el" @focus="keyboard.show($event.currentTarget as HTMLElement)" />
</template>
