<script setup lang="ts">
// 「써 줘」(帮我写) 실측 흐름: 사진을 올리면 본문 칸 아래가 「正在识别图片内容...」 → 「帮写中... · 停止生成」 → 글이 한 글자씩 나오고 「取消 · 采用」.
// 서버 AI 연결 전이라 고른 차 · 사진 수로 초안을 만든다(사진 속 사실은 지어내지 않는다).
import { onBeforeUnmount, ref } from "vue";
import Ico from "../Ico.vue";
import { IC } from "../../lib/icons";

const p = defineProps<{ make: () => string; label?: string }>();
const emit = defineEmits<{ apply: [string] }>();
const stage = ref<"" | "read" | "write" | "done">("");
const text = ref("");
let t: ReturnType<typeof setTimeout> | undefined;
let full = "";
const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const type = () => {
  if (text.value.length >= full.length) { stage.value = "done"; return; }
  text.value = full.slice(0, text.value.length + 3);
  t = setTimeout(type, 30);
};
const start = (reading = true) => {
  clearTimeout(t); full = p.make(); text.value = "";
  stage.value = reading ? "read" : "write";
  t = setTimeout(() => { stage.value = "write"; if (reduce) { text.value = full; stage.value = "done"; } else type(); }, reading ? 1400 : 300);
};
const stop = () => { clearTimeout(t); stage.value = text.value ? "done" : ""; };
const cancel = () => { clearTimeout(t); stage.value = ""; text.value = ""; };
const use = () => { emit("apply", text.value); cancel(); };
onBeforeUnmount(() => clearTimeout(t));
defineExpose({ start });
</script>

<template>
  <div v-if="stage" class="aiw" role="status" aria-live="polite">
    <p v-if="stage === 'read'" class="aiw__ph">사진 내용을 알아보는 중…</p>
    <p v-else class="aiw__text">{{ text }}<i v-if="stage === 'write'" class="aiw__caret" /></p>
    <div class="aiw__bar">
      <span class="aiw__tag"><Ico :src="IC.powerup" />{{ stage === "done" ? "써 줘" : "쓰는 중…" }}</span>
      <template v-if="stage === 'done'"><button type="button" class="aiw__no" @click="cancel">취소</button><button type="button" class="aiw__ok" @click="use">쓰기</button></template>
      <button v-else type="button" class="aiw__no" @click="stop">그만 쓰기</button>
    </div>
  </div>
  <button v-else type="button" class="aiw__btn" @click="start(false)"><Ico :src="IC.powerup" />{{ label || "써 줘" }}</button>
</template>
