<script setup lang="ts">
import Icon from "./Icon.vue";
import { ct } from "../lib/site";
const emit = defineEmits<{ back: [] }>();
</script>
<template>
  <header class="top"><button class="back" type="button" @click="emit('back')"><Icon :src="ct('chotot-pc-detail-chevron-left-white-bg')" />뒤로</button></header>
</template>
