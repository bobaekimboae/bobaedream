<script setup lang="ts">
// 리액트 src/prototype/listing/company-finder.tsx 의 DealerIndex. onChange → emit("change", next).
import { computed } from "vue";
import { COMPANY_INDEX, companyIndexOf } from "@proto/listing/company-finder";

const props = defineProps<{ names: string[]; letter: string }>();
const emit = defineEmits<{ change: [next: string] }>();
const counts = computed(() => {
  const map = new Map<string, number>();
  for (const name of props.names) map.set(companyIndexOf(name), (map.get(companyIndexOf(name)) ?? 0) + 1);
  return map;
});
</script>
<template>
  <div class="sag-dealer-shops sag-company-index" role="group" aria-label="딜러 이름 첫 글자">
    <button type="button" :aria-pressed="!letter" :class="!letter ? 'is-selected' : ''" @click="emit('change', '')">전체</button>
    <button
      v-for="item in COMPANY_INDEX"
      :key="item"
      type="button"
      :disabled="!(counts.get(item) ?? 0)"
      :aria-pressed="letter === item"
      :class="letter === item ? 'is-selected' : ''"
      :aria-label="`${item} 딜러 ${counts.get(item) ?? 0}명`"
      @click="emit('change', letter === item ? '' : item)"
    >{{ item }}</button>
  </div>
</template>
