<script setup lang="ts">
// 원본 아이콘 파일을 mask로 그린다(색 = currentColor). 파일은 고치지 않는다.
// 글쓰기 키트 아이콘 획은 24px 상자에서 1.5px로 맞춘다. 원본이 더 굵은 파일은 그림만 줄여 같은 두께로 보이게 한다
// (2026-11-03 실측: poll-post 2.0px → 75%, rich-text 2.06px → 73%).
import { computed } from "vue";
const p = defineProps<{ src: string }>();
const SCALE: Record<string, number> = { "poll-post-outline.svg": 0.75, "rich-text-outline.svg": 0.73 };
const k = computed(() => SCALE[p.src.split("/").pop() ?? ""] ?? 1);
</script>
<template><span class="ico" aria-hidden="true" :style="{ '--src': `url('${src}')`, ...(k !== 1 ? { '-webkit-mask-size': `${k * 100}%`, 'mask-size': `${k * 100}%` } : {}) }" /></template>
