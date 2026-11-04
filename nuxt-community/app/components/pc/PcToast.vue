<script setup lang="ts">
// 정적 bobaedream-pc-interactions.js toast(): body 맨 끝 .bobaeToast, 1.8초 뒤 사라짐
import { usePcUi } from '~/composables/pc/usePcBoard'

const { toastText, toastKey } = usePcUi()
</script>

<template>
  <Teleport to="body">
    <div v-if="toastText" :key="toastKey" class="bobaeToast">{{ toastText }}</div>
  </Teleport>
</template>
