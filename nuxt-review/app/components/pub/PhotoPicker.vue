<script setup lang="ts">
// 사진 고르기(동처띠 발행 화면 아래에서 올라오는 「最近照片」 앨범 판 실측):
// 첫 칸 = 사진 찍기, 나머지 = 고른 사진(번호 순서대로 선택) · 아래 「편집」 + 「완료 (n)」.
// 브라우저는 휴대폰 앨범 목록을 바로 읽을 수 없어서 「앨범에서 가져오기」로 사진을 불러온 뒤 같은 판에서 고른다.
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import Ico from "../Ico.vue";
import PhotoEditor from "../PhotoEditor.vue";
import { IC } from "../../lib/icons";
import { readFile } from "../../lib/publish";
import { toast } from "../../lib/ui";

const p = defineProps<{ max: number; title?: string }>();
const emit = defineEmits<{ done: [string[]]; close: [] }>();
const items = ref<string[]>([]);
const picked = ref<number[]>([]);
const editing = ref(false);
const album = ref<HTMLInputElement | null>(null);
const cam = ref<HTMLInputElement | null>(null);
const left = computed(() => p.max);

const load = async (e: Event) => {
  const fs = [...((e.target as HTMLInputElement).files ?? [])];
  (e.target as HTMLInputElement).value = "";
  for (const f of fs) {
    if (f.size > 15 * 1024 * 1024) { toast("사진은 15MB까지 올릴 수 있어요"); continue; }
    const src = await readFile(f);
    items.value.unshift(src);
    picked.value = picked.value.map((i) => i + 1);
    if (picked.value.length < left.value) picked.value.push(0);
  }
};
const toggle = (i: number) => {
  const at = picked.value.indexOf(i);
  if (at >= 0) picked.value.splice(at, 1);
  else if (picked.value.length >= left.value) toast(`사진은 ${left.value}장까지 고를 수 있어요`);
  else picked.value.push(i);
};
const chosen = computed(() => picked.value.map((i) => items.value[i]!).filter(Boolean));
const done = () => { if (!chosen.value.length) return; emit("done", chosen.value); };
const onEdited = (imgs: string[]) => { editing.value = false; emit("done", imgs); };
const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !editing.value) emit("close"); };
onMounted(() => { document.addEventListener("keydown", onKey); album.value?.click(); });
onBeforeUnmount(() => document.removeEventListener("keydown", onKey));
</script>

<template>
  <div class="layer">
    <div class="dim" @click="emit('close')" />
    <section class="ppick" role="dialog" aria-modal="true" :aria-label="title || '사진 고르기'">
      <header class="ppick__head"><i class="ppick__grab" /><b>{{ title || "최근 사진" }}</b><button type="button" class="ppick__x" aria-label="닫기" @click="emit('close')"><Ico :src="IC.close" /></button></header>
      <div class="ppick__grid">
        <label class="ppick__cam"><input ref="cam" type="file" accept="image/*" capture="environment" @change="load" /><Ico :src="IC.camera" /><span>사진 찍기</span></label>
        <label class="ppick__album"><input ref="album" type="file" accept="image/*" multiple @change="load" /><Ico :src="IC.image" /><span>앨범에서<br />가져오기</span></label>
        <button v-for="(src, i) in items" :key="i" type="button" class="ppick__cell" :class="{ on: picked.includes(i) }" :aria-pressed="picked.includes(i)" :aria-label="`사진 ${i + 1}`" @click="toggle(i)">
          <img :src="src" alt="" /><b class="ppick__num">{{ picked.includes(i) ? picked.indexOf(i) + 1 : "" }}</b>
        </button>
      </div>
      <footer v-if="picked.length" class="ppick__foot">
        <button type="button" class="ppick__edit" @click="editing = true">편집</button>
        <button type="button" class="ppick__done" @click="done">완료 ({{ picked.length }})</button>
      </footer>
    </section>
    <PhotoEditor v-if="editing" :images="chosen" @done="onEdited" @close="editing = false" />
  </div>
</template>
