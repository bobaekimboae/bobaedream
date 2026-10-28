<script setup lang="ts">
// 원본: src/prototype/listing/pc-bbmuseum.tsx BbTruckOptionLabel
import { asset } from "@proto/data";

defineProps<{ name: string; image: string | null; secondary?: string | null }>();
</script>
<template>
  <span class="bbm-truck-option"><span v-if="image" class="bbm-truck-option-image"><img :src="asset(image)" alt="" :draggable="false"></span><span class="bbm-truck-option-name">{{ name }}<small v-if="secondary">{{ secondary }}</small></span></span>
</template>
