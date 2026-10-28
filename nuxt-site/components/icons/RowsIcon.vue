<script setup lang="ts">
// @radix-ui/react-icons RowsIcon과 같은 SVG(경로 글자 그대로). 나머지 속성(aria-hidden 등)은 svg로 넘어간다.
withDefaults(defineProps<{ color?: string }>(), { color: "currentColor" });
</script>
<template>
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 12.85L1 12.85L1 14.15L14 14.15L14 12.85ZM14 8.85002L1 8.85002L1 10.15L14 10.15L14 8.85002ZM1 4.85003L14 4.85003L14 6.15003L1 6.15002L1 4.85003ZM14 0.850025L1 0.850025L1 2.15002L14 2.15002L14 0.850025Z" :fill="color" fill-rule="evenodd" clip-rule="evenodd" /></svg>
</template>
