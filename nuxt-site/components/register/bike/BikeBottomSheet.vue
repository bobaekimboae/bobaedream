<script setup lang="ts">
// 리액트 BikeRegister.tsx 의 BottomSheet. onClose → emit("close"), children → 기본 slot, footer → slot "footer".
import { onBeforeUnmount, onMounted } from "vue";
import { icons } from "./bike-register-icons";

defineProps<{ title: string }>();
const emit = defineEmits<{ close: [] }>();
const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") emit("close"); };
onMounted(() => document.addEventListener("keydown", onKey));
onBeforeUnmount(() => document.removeEventListener("keydown", onKey));
</script>
<template>
  <div class="bike-reg-sheet" role="dialog" aria-modal="true" :aria-label="title">
    <div class="bike-reg-sheet__dim" @click="emit('close')" />
    <section class="bike-reg-sheet__panel">
      <header><button type="button" aria-label="닫기" @click="emit('close')"><img :src="icons.close" alt=""></button><h2>{{ title }}</h2><span /></header>
      <div class="bike-reg-sheet__body"><slot /></div>
      <footer><slot name="footer" /></footer>
    </section>
  </div>
</template>
