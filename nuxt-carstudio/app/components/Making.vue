<script setup lang="ts">
// 원본 만드는 중 화면: 머리 없이 가운데 큰 주황 원(276) + 「Reviewing photos…」 단계 글자 + 원 가장자리를 도는 작은 차 · 아래 「Back to My Videos」
import { computed, watch } from "vue";
import Icon from "./Icon.vue";
import { STEPS, stage, videoById } from "../lib/jobs";
import { sitePath } from "../lib/site";
const props = defineProps<{ id: string }>();
const emit = defineEmits<{ go: [v: string, extra?: Record<string, string>, replace?: boolean]; back: [] }>();
const v = computed(() => videoById(props.id));
const step = computed(() => (stage.id === props.id ? stage.step : 3));
watch(() => v.value?.status, (s) => { if (s === "done" || s === "failed") emit("go", "result", { id: props.id }, true); }, { immediate: true });
</script>
<template>
  <main class="mk">
    <div class="orb-wrap">
      <div class="orb" role="status" aria-live="polite"><b>{{ STEPS[step] }}<small v-if="step === 3">{{ Math.round((v?.progress ?? 0) * 100) }}%</small></b></div>
      <span class="orbit" aria-hidden="true"><i><Icon :src="sitePath('assets', 'bbm', 'detail-icons', 'maker.svg')" /></i></span>
    </div>
    <button class="btn mk-back" type="button" @click="emit('go', 'home', { tab: 'videos' }, true)">내 영상으로 돌아가기</button>
  </main>
</template>
