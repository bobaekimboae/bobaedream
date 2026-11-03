<script setup lang="ts">
// 긴 글(长帖) 쓰기 — 동처띠 실측: 제목(필수) → 본문(글 사이에 사진 · 구매가 카드 · 튜닝 부품 카드를 끼워 넣는 블록 글) → 「꿀팁 모음」 · 「임시저장 중…」
// → 화제 → (아래 고정) 차량 모임 + 도구 줄(표정 · 사진 · 구매가 · 튜닝 부품). 본문을 누르면 머리가 「긴 글 ⇄ · 임시저장함 · 등록」으로 바뀐다.
import { computed, nextTick, reactive, ref, watch } from "vue";
import WriteHead from "../WriteHead.vue";
import PubMeta from "./PubMeta.vue";
import PubToolbar from "./PubToolbar.vue";
import AttachCards from "./AttachCards.vue";
import PhotoEditor from "../PhotoEditor.vue";
import PostPreview from "./PostPreview.vue";
import DraftBox from "./DraftBox.vue";
import Ico from "../Ico.vue";
import { IC } from "../../lib/icons";
import { readFile, type OwnerPrice, type PartCard } from "../../lib/publish";
import { usePub } from "../../lib/usePub";
import { toast } from "../../lib/ui";
import type { Kind } from "../../lib/route";

type Block = { t: "text"; v: string } | { t: "image"; src: string } | { t: "price"; d: OwnerPrice } | { t: "part"; d: PartCard };
const emit = defineEmits<{ switch: [Kind] }>();
const title = ref("");
const blocks = ref<Block[]>([{ t: "text", v: "" }]);
const s = reactive({ topic: "", circle: "" });
const focusAt = ref(0);
const started = ref(false);
const saving = ref("");
const layer = ref<"" | "edit" | "preview" | "drafts">("");
const editSrc = ref("");
const editIdx = ref(-1);
const box = ref<HTMLElement | null>(null);

const text = computed(() => blocks.value.filter((b) => b.t === "text").map((b) => (b as { v: string }).v).join("\n").trim());
const images = computed(() => blocks.value.filter((b) => b.t === "image").map((b) => (b as { src: string }).src));
const has = computed(() => Boolean(title.value.trim() || text.value || images.value.length));
const can = computed(() => Boolean(title.value.trim() && (text.value || images.value.length)));
const { close, publish } = usePub("long", {
  snapshot: () => ({ title: title.value, blocks: blocks.value, s: { ...s } }),
  restore: (d) => { title.value = d.title; blocks.value = d.blocks; Object.assign(s, d.s); },
  dirty: () => has.value, watchOn: [title, blocks, s],
});
let st: ReturnType<typeof setTimeout> | undefined;
watch([title, blocks], () => { if (!has.value) return; saving.value = "임시저장 중…"; clearTimeout(st); st = setTimeout(() => (saving.value = "임시저장했어요"), 900); }, { deep: true });

const grow = (e: Event) => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = `${t.scrollHeight}px`; };
const textEl = (i: number) => box.value?.querySelector<HTMLTextAreaElement>(`[data-bi="${i}"]`) ?? null;
/** 지금 글 칸의 커서 자리에서 글을 자르고 그 사이에 블록을 넣는다 */
const insertBlock = (nb: Block) => {
  const i = Math.min(focusAt.value, blocks.value.length - 1);
  const cur = blocks.value[i];
  if (cur?.t === "text") {
    const el = textEl(i); const at = el?.selectionStart ?? cur.v.length;
    const before = cur.v.slice(0, at); const after = cur.v.slice(at);
    blocks.value.splice(i, 1, { t: "text", v: before }, nb, { t: "text", v: after });
    focusAt.value = i + 2;
  } else { blocks.value.splice(i + 1, 0, nb, { t: "text", v: "" }); focusAt.value = i + 2; }
  void nextTick(() => textEl(focusAt.value)?.focus());
};
const putEmoji = (e: string) => {
  const i = focusAt.value; const b = blocks.value[i];
  if (b?.t !== "text") { insertBlock({ t: "text", v: e }); return; }
  const el = textEl(i); const at = el?.selectionStart ?? b.v.length;
  b.v = b.v.slice(0, at) + e + b.v.slice(at);
  void nextTick(() => el?.setSelectionRange(at + e.length, at + e.length));
};
const backspace = () => { const b = blocks.value[focusAt.value]; if (b?.t === "text") { const ch = [...b.v]; ch.pop(); b.v = ch.join(""); } };
const addImages = async (fs: File[]) => {
  if (images.value.length + fs.length > 30) toast("사진은 30장까지 넣을 수 있어요");
  for (const f of fs.slice(0, 30 - images.value.length)) insertBlock({ t: "image", src: await readFile(f) });
};
const rmBlock = (i: number) => {
  blocks.value.splice(i, 1);
  // 앞뒤 글 칸을 다시 붙인다
  const a = blocks.value[i - 1]; const b = blocks.value[i];
  if (a?.t === "text" && b?.t === "text") { a.v = [a.v, b.v].filter(Boolean).join("\n"); blocks.value.splice(i, 1); }
  if (!blocks.value.length) blocks.value.push({ t: "text", v: "" });
};
const editImage = (i: number) => { const b = blocks.value[i]; if (b?.t !== "image") return; editIdx.value = i; editSrc.value = b.src; layer.value = "edit"; };
const onEdited = (imgs: string[]) => { const b = blocks.value[editIdx.value]; if (b?.t === "image" && imgs[0]) b.src = imgs[0]; layer.value = ""; };
const post = () => {
  if (!title.value.trim()) return toast("제목을 써 주세요");
  if (!text.value && !images.value.length) return toast("본문을 써 주세요");
  publish({
    title: title.value.trim(), body: text.value, media: images.value.map((src) => ({ kind: "image" as const, src })), topic: s.topic, circle: s.circle,
    ownerPrice: (blocks.value.find((b) => b.t === "price") as { d: OwnerPrice } | undefined)?.d ?? null,
    parts: blocks.value.filter((b) => b.t === "part").map((b) => (b as { d: PartCard }).d),
  });
};
</script>

<template>
  <main class="write write--pub write--long">
    <WriteHead kind="long" :picked="started || has" :can-post="can" drafts @close="close" @post="post" @switch="emit('switch', $event)" @drafts="layer = 'drafts'" />
    <section class="pcard ptext plong">
      <input v-model="title" class="ptext__title ptext__title--req" maxlength="40" placeholder="제목을 쓰면 더 많이 추천돼요(필수)" aria-label="제목(필수)" @focus="started = true" />
      <div ref="box" class="plong__blocks">
        <template v-for="(b, i) in blocks" :key="i">
          <textarea v-if="b.t === 'text'" v-model="b.v" :data-bi="i" class="ptext__body" :rows="i === 0 && blocks.length === 1 ? 10 : 1" :placeholder="i === 0 ? '눌러서 본문을 쓰세요. 차를 사고 타면서 겪은 일, 차와 함께하는 생활을 나눠 주세요' : ''" :aria-label="`본문 ${i + 1}`" @focus="focusAt = i; started = true" @input="grow" />
          <figure v-else-if="b.t === 'image'" class="plong__img"><img :src="b.src" alt="" @click="editImage(i)" /><button type="button" class="plong__x" aria-label="사진 빼기" @click="rmBlock(i)"><Ico :src="IC.remove" /></button><span class="pmedia__edit"><Ico :src="IC.edit" />편집</span></figure>
          <div v-else class="plong__card"><AttachCards v-if="b.t === 'price'" :price="b.d" @rm-price="rmBlock(i)" /><AttachCards v-else :parts="[b.d]" @rm-part="rmBlock(i)" /></div>
        </template>
      </div>
      <p class="ptext__tips">💡 이런 글이 인기가 많아요 · <a href="#" @click.prevent="toast('꿀팁 모음은 준비 중이에요')">꿀팁 모음</a><span v-if="saving" class="ptext__count">{{ saving }}</span></p>
    </section>
    <PubMeta v-model:topic="s.topic" v-model:circle="s.circle" :show-circle="false" />
    <div class="pask-circle"><PubMeta v-model:topic="s.topic" v-model:circle="s.circle" :show-topic="false" /></div>
    <div class="pfoot-space" />
    <PubToolbar :tools="['emoji', 'image', 'price', 'refit']" @emoji="putEmoji" @backspace="backspace" @image="addImages" @price="insertBlock({ t: 'price', d: $event })" @part="insertBlock({ t: 'part', d: $event })" />
    <PhotoEditor v-if="layer === 'edit'" :images="[editSrc]" @done="onEdited" @close="layer = ''" />
    <PostPreview v-if="layer === 'preview'" :post="{ kind: 'long', title, body: text, media: images.map((src) => ({ kind: 'image', src })) }" @close="layer = ''" />
    <DraftBox v-if="layer === 'drafts'" @close="layer = ''" @switch="layer = ''; emit('switch', $event)" />
  </main>
</template>
