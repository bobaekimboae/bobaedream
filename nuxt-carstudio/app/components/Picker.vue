<script setup lang="ts">
// 고르기 칸을 누르면 아래에서 올라오는 목록(원본 드롭다운 대신 휴대폰 시트)
import { onMounted, onBeforeUnmount } from "vue";
import Icon from "./Icon.vue";
import { rd } from "../lib/site";
defineProps<{ title: string; list: { v: string; ko: string }[]; value: string }>();
const emit = defineEmits<{ pick: [v: string]; close: [] }>();
const esc = (e: KeyboardEvent) => { if (e.key === "Escape") emit("close"); };
onMounted(() => window.addEventListener("keydown", esc));
onBeforeUnmount(() => window.removeEventListener("keydown", esc));
</script>
<template>
  <div class="dim" @click.self="emit('close')">
    <div class="sheet" role="dialog" :aria-label="title">
      <div class="sheet-h">{{ title }}</div>
      <button v-for="x in list" :key="x.v" class="sheet-o" type="button" :aria-selected="x.v === value" @click="emit('pick', x.v)">{{ x.ko }}<Icon v-if="x.v === value" :src="rd('checkmark-fill')" /></button>
    </div>
  </div>
</template>
