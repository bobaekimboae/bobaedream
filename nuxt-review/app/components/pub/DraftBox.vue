<script setup lang="ts">
// 임시저장함(草稿箱): 원본처럼 시트가 아닌 새 화면(「← 草稿箱」). 종류마다 1건씩 남은 글을 보여 주고, 누르면 그 종류 글쓰기로 간다(들어가면 「불러올까요?」).
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import Ico from "../Ico.vue";
import { IC } from "../../lib/icons";
import { allDrafts, deleteDraft, KIND_LABEL } from "../../lib/publish";
import { ymdKo } from "../../lib/data";
import type { Kind } from "../../lib/route";

const emit = defineEmits<{ close: []; switch: [Kind] }>();
const n = ref(0);
const list = computed(() => { void n.value; return Object.entries(allDrafts()).map(([k, v]) => ({ k: k as Kind, at: v!.at, p: v!.payload as { title?: string; body?: string } })); });
const rm = (k: Kind) => { deleteDraft(k); n.value += 1; };
const back = ref<HTMLButtonElement | null>(null);
const onKey = (e: KeyboardEvent) => e.key === "Escape" && emit("close");
onMounted(async () => { document.addEventListener("keydown", onKey); await nextTick(); back.value?.focus({ preventScroll: true }); });
onBeforeUnmount(() => document.removeEventListener("keydown", onKey));
</script>
<template>
  <section class="pdpage" role="dialog" aria-modal="true" aria-label="임시저장함">
    <header class="pdpage__head"><button ref="back" type="button" class="pdpage__back" aria-label="뒤로" @click="emit('close')"><Ico :src="IC.back" /></button><h2>임시저장함</h2></header>
    <p v-if="!list.length" class="pdraft__empty">임시저장한 글이 없어요</p>
    <div v-for="d in list" :key="d.k" class="pdraft">
      <button type="button" class="pdraft__go" @click="emit('switch', d.k)"><em>{{ KIND_LABEL[d.k] }}</em><b>{{ d.p.title || d.p.body?.slice(0, 30) || "제목 없음" }}</b><small>{{ ymdKo(d.at) }}</small></button>
      <button type="button" class="pdraft__rm" @click="rm(d.k)">지우기</button>
    </div>
  </section>
</template>
