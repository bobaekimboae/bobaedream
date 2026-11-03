<script setup lang="ts">
// 원본 만드는 중 화면: 주황 원 + 「Reviewing photos…」 단계 글자 · 「Back to My Videos」
import { computed, watch } from "vue";
import TopBack from "./TopBack.vue";
import { STEPS, stage, videoById } from "../lib/jobs";
const props = defineProps<{ id: string }>();
const emit = defineEmits<{ go: [v: string, extra?: Record<string, string>, replace?: boolean]; back: [] }>();
const v = computed(() => videoById(props.id));
const step = computed(() => (stage.id === props.id ? stage.step : 3));
watch(() => v.value?.status, (s) => { if (s === "done" || s === "failed") emit("go", "result", { id: props.id }, true); }, { immediate: true });
</script>
<template>
  <TopBack @back="emit('go', 'home', {}, true)" />
  <main class="mk">
    <div class="orb" role="status" aria-live="polite"><b>{{ STEPS[step] }}<small v-if="step === 3">{{ Math.round((v?.progress ?? 0) * 100) }}%</small></b></div>
    <button class="btn" type="button" @click="emit('go', 'home', {}, true)">내 영상으로 돌아가기</button>
  </main>
</template>
