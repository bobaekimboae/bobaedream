<script setup lang="ts">
// 리액트 bbm-list.tsx 의 BbmCategoryChildPills(파일 안 전용 부품). onChoose → emit("choose", value, detail)
import type { BbmCategoryGroup } from "./bbm-list-local";

defineProps<{ group: BbmCategoryGroup; selected?: string; selectedChild?: string | null }>();
const emit = defineEmits<{ choose: [value: string, detail?: string] }>();
</script>
<template>
  <div class="bbm-category-child-pills" role="group" :aria-label="`${group.label} 하위 카테고리`">
    <button v-for="child in group.children" :key="`${child.value}-${child.detail ?? child.label}`" type="button" :class="(child.detail ? selected === child.value && selectedChild === child.detail : selected === child.value && !selectedChild) ? 'is-selected' : ''" :aria-pressed="child.detail ? selected === child.value && selectedChild === child.detail : selected === child.value && !selectedChild" @click="emit('choose', child.value, child.detail)">{{ child.label }}</button>
  </div>
</template>
