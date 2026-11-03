<script setup lang="ts">
import Icon from "./Icon.vue";
import { rd } from "../lib/site";
const emit = defineEmits<{ back: [] }>();
</script>
<template>
  <header class="top"><button class="back" type="button" @click="emit('back')"><Icon :src="rd('back-outline-24')" />뒤로</button></header>
</template>
