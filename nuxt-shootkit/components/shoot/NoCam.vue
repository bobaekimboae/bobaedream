<script setup lang="ts">
// 카메라가 안 켜졌을 때 안내
import { permHelp } from "../../lib/core";
defineProps<{ denied: boolean }>();
</script>
<template>
  <div v-if="denied" class="shoot-nocam">카메라 권한을 허용해 주세요<small>{{ permHelp() }}</small></div>
  <div v-else class="shoot-nocam">카메라를 켜는 중이에요<small>카메라 사용을 물으면 「허용」을 눌러 주세요</small></div>
</template>
