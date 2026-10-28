<script setup lang="ts">
// 리액트 DetailUiProvider(children → 기본 slot). 읽는 쪽은 composables/detail/useDetailUi.
import { provideDetailUi } from "../../composables/detail/useDetailUi";
provideDetailUi();
</script>
<template><slot /></template>
