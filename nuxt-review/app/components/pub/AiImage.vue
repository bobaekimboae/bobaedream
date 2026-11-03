<script setup lang="ts">
// 「AI 그림」(Ai生图): 하고 싶은 말을 쓰고 분위기를 고르면 그림 4장을 만들어 고르게 한다.
// 서버 그림 AI 연결 전이라 고른 분위기의 색과 쓴 글로 그림을 캔버스로 만든다(실제 사진처럼 보이지 않는 그림임을 표시).
import { ref } from "vue";
import Sheet from "../Sheet.vue";
import { toast } from "../../lib/ui";

const emit = defineEmits<{ done: [string[]]; close: [] }>();
const STYLES = [
  { id: "sunset", name: "노을 드라이브", c: ["#ff7e5f", "#feb47b", "#3a1c71"] },
  { id: "night", name: "도시 야경", c: ["#0f2027", "#203a43", "#2c5364"] },
  { id: "mint", name: "맑은 날", c: ["#a8edea", "#fed6e3", "#5ee7df"] },
  { id: "mono", name: "흑백 필름", c: ["#232526", "#414345", "#9e9e9e"] },
];
const prompt = ref("");
const style = ref(STYLES[0]!.id);
const busy = ref(false);
const out = ref<string[]>([]);
const sel = ref<number[]>([]);

const draw = (seed: number) => {
  const s = STYLES.find((x) => x.id === style.value)!;
  const cv = document.createElement("canvas"); cv.width = 900; cv.height = 1200;
  const g = cv.getContext("2d")!;
  const lg = g.createLinearGradient(0, 0, seed % 2 ? 900 : 0, 1200);
  lg.addColorStop(0, s.c[0]!); lg.addColorStop(0.6, s.c[1]!); lg.addColorStop(1, s.c[2]!);
  g.fillStyle = lg; g.fillRect(0, 0, 900, 1200);
  // 길과 차 실루엣(단순 도형)
  g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.moveTo(0, 1200); g.lineTo(380 + seed * 20, 760); g.lineTo(520 + seed * 20, 760); g.lineTo(900, 1200); g.fill();
  g.fillStyle = "rgba(255,255,255,.85)";
  const y = 860 + seed * 10; const x = 250 + seed * 30;
  g.beginPath(); g.roundRect(x, y, 400, 90, 30); g.fill();
  g.beginPath(); g.roundRect(x + 80, y - 60, 220, 80, 40); g.fill();
  g.fillStyle = "#111"; [x + 80, x + 320].forEach((cx) => { g.beginPath(); g.arc(cx, y + 92, 34, 0, Math.PI * 2); g.fill(); });
  g.fillStyle = "#fff"; g.font = "700 54px Pretendard, sans-serif"; g.textAlign = "center";
  const words = (prompt.value.trim() || "나의 드라이브").slice(0, 28);
  g.fillText(words, 450, 260 + seed * 40);
  g.font = "500 28px Pretendard, sans-serif"; g.fillStyle = "rgba(255,255,255,.8)"; g.fillText("AI 그림", 450, 1150);
  return cv.toDataURL("image/jpeg", 0.88);
};
const make = () => {
  if (!prompt.value.trim()) return toast("어떤 그림을 원하는지 써 주세요");
  busy.value = true; out.value = []; sel.value = [];
  setTimeout(() => { out.value = [0, 1, 2, 3].map(draw); busy.value = false; }, 1200);
};
const toggle = (i: number) => { const a = sel.value.indexOf(i); if (a >= 0) sel.value.splice(a, 1); else sel.value.push(i); };
</script>

<template>
  <Sheet title="AI 그림" full @close="emit('close')">
    <div class="aiimg">
      <textarea v-model="prompt" maxlength="60" rows="3" placeholder="예: 바닷가 도로를 달리는 하얀 SUV" aria-label="그림 설명" />
      <p class="aiimg__label">분위기</p>
      <div class="aiimg__styles"><button v-for="s in STYLES" :key="s.id" type="button" :class="{ on: style === s.id }" :style="{ background: `linear-gradient(135deg, ${s.c[0]}, ${s.c[2]})` }" @click="style = s.id"><span>{{ s.name }}</span></button></div>
      <button type="button" class="btn-pri" :class="{ 'is-off': busy }" @click="make">{{ busy ? "그리는 중…" : out.length ? "다시 그리기" : "그림 만들기" }}</button>
      <div v-if="out.length" class="aiimg__out">
        <button v-for="(src, i) in out" :key="i" type="button" :class="{ on: sel.includes(i) }" :aria-pressed="sel.includes(i)" @click="toggle(i)"><img :src="src" alt="" /><b>{{ sel.includes(i) ? sel.indexOf(i) + 1 : "" }}</b></button>
      </div>
      <p class="aiimg__note">AI로 만든 그림이에요. 실제 차량 사진처럼 쓰지 말아 주세요.</p>
    </div>
    <template #foot><button type="button" class="btn-pri" :class="{ 'is-off': !sel.length }" @click="sel.length && emit('done', sel.map((i) => out[i]!))">{{ sel.length ? `${sel.length}장 넣기` : "그림을 골라 주세요" }}</button></template>
  </Sheet>
</template>
