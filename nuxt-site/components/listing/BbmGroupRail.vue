<script setup lang="ts">
// 리액트 bbm-list.tsx 의 BbmGroupRail. onChoose(label, detail) → emit("choose", value, detail)
import { computed } from "vue";
import { bbmCategoryGroups } from "@proto/listing/bbm-list";
import "@proto/listing/bbm-tokens.css";
import "@proto/listing/thumbnail-states.css";

const props = defineProps<{ groupValue: string }>();
const emit = defineEmits<{ choose: [label: string, detail?: string] }>();
const group = computed(() => bbmCategoryGroups.find((item) => item.value === props.groupValue));
</script>
<template>
  <section v-if="group" class="bbm-theme-rail" :aria-label="`${group.label} 하위 카테고리`">
    <button v-for="child in group.children" :key="`${child.value}-${child.detail ?? child.label}`" type="button" @click="emit('choose', child.value, child.detail)">{{ child.label }}</button>
  </section>
</template>
