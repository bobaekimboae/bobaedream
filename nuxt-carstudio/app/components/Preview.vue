<script setup lang="ts">
// 템플릿 카드의 ▶: 고른 사진(없으면 예시 매물)으로 그 템플릿을 바로 그려 보여 준다(원본은 예시 영상 재생)
import { onBeforeUnmount, onMounted, ref } from "vue";
import Icon from "./Icon.vue";
import { buildPlan, drawFrame, planSeconds, type Plan } from "../lib/render";
import { defaultOptions, type Aspect, type Details, type Lang, type TemplateId } from "../lib/types";
import { rd } from "../lib/site";
const props = defineProps<{ template: TemplateId; photos: string[]; details: Details; aspect: Aspect; lang: Lang }>();
const emit = defineEmits<{ close: [] }>();
const cv = ref<HTMLCanvasElement | null>(null);
const msg = ref("불러오는 중…");
let raf = 0;
let plan: Plan | null = null;
onMounted(async () => {
  try {
    plan = await buildPlan(props.photos, props.details, { ...defaultOptions(), template: props.template, aspect: props.aspect, lang: props.lang, voiceover: true });
  } catch (e) { msg.value = e instanceof Error ? e.message : "미리보기를 못 만들었어요."; return; }
  msg.value = "";
  const c = cv.value!;
  const s = 540 / Math.min(plan.W, plan.H);
  c.width = Math.round(plan.W * s);
  c.height = Math.round(plan.H * s);
  const ctx = c.getContext("2d")!;
  ctx.scale(s, s);
  const total = planSeconds(plan);
  const t0 = performance.now();
  const loop = () => { drawFrame(ctx, plan!, ((performance.now() - t0) / 1000) % total); raf = requestAnimationFrame(loop); };
  loop();
});
const esc = (e: KeyboardEvent) => { if (e.key === "Escape") emit("close"); };
onMounted(() => window.addEventListener("keydown", esc));
onBeforeUnmount(() => { cancelAnimationFrame(raf); window.removeEventListener("keydown", esc); });
</script>
<template>
  <div class="pv" role="dialog" aria-label="템플릿 미리보기" @click.self="emit('close')">
    <button class="x" type="button" aria-label="닫기" @click="emit('close')"><Icon :src="rd('close-outline')" /></button>
    <canvas ref="cv" :style="{ aspectRatio: aspect.replace(':', ' / '), width: aspect === '16:9' ? 'min(92vw, 440px)' : undefined }" />
    <p>{{ msg || "미리보기 · 음성 없이 화면만" }}</p>
  </div>
</template>
