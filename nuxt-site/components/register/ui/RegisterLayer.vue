<script setup lang="ts">
// 리액트 src/prototype/register/ui.tsx 의 toRegisterLayer(createPortal → .bbm-register 루트 바로 아래).
// dev는 팝업을 body 바로 아래에 둔다(폼 페이지 범위 규칙이 팝업에 닿지 않음). 시안은 원본 CSS를 .bbm-register 아래로 묶었으므로 그 루트 바로 아래로 옮긴다.
// 루트가 없으면(리액트와 같이) 그 자리에 그린다. 열릴 때만 그리므로 그때는 루트가 이미 화면에 있다.
const target = typeof document === "undefined" ? null : document.querySelector<HTMLElement>(".bbm-register");
</script>
<template>
  <Teleport :to="target ?? 'body'" :disabled="!target"><slot /></Teleport>
</template>
