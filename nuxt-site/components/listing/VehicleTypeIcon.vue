<script setup lang="ts">
// 원본: src/prototype/listing/bbm-vehicle-type-dropdown.tsx VehicleTypeIcon
import { computed } from "vue";
import { asset } from "@proto/data";

const props = defineProps<{ name: string }>();
const style = computed(() => ({ "--bbm-vehicle-type-icon": `url("${asset(`category/icons/v01/${props.name}`)}")` }));
</script>
<template>
  <span class="bbm-vehicle-type-icon" :style="style" aria-hidden="true" />
</template>
