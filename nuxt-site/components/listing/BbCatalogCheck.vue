<script setup lang="ts">
// 원본: src/prototype/listing/pc-bbmuseum.tsx BbMakerGradeFilter 안의 checkbox() 도우미(감싸는 요소 없이 아이콘만)
import BbIcon from "./BbIcon.vue";
import BbAssetIcon from "./BbAssetIcon.vue";

withDefaults(defineProps<{ checked: boolean; mixed?: boolean; referenceStyle?: boolean }>(), { mixed: false, referenceStyle: false });
</script>
<template>
  <BbAssetIcon v-if="referenceStyle" :name="checked || mixed ? 'circle-check' : 'circle-check-off'" :size="24" />
  <BbIcon v-else-if="checked" name="check" :size="16" />
  <span v-else-if="mixed" class="bbm-checkbox-mixed" />
</template>
