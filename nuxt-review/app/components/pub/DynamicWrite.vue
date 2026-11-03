<script setup lang="ts">
// 일상(动态) 쓰기 — 동처띠 실측 2026-11-03:
// 사진 칸(AI 그림 · 사진 올리기 → 올리면 대표 · 편집 · 계속 추가, 최대 9장) → 제목(선택) · 본문 → 「써 줘」(사진을 올리면 자동으로 초안)
// → 팁 줄 → 화제 · 차량 모임 → 내용 성격 표시 → 아래 도구 줄(표정 · 투표 · 구매가 · 위치).
// 머리: 내용이 없으면 「임시저장함」, 사진이나 글이 생기면 「미리보기」 + 「등록」.
import { computed, nextTick, reactive, ref } from "vue";
import WriteHead from "../WriteHead.vue";
import PubMedia from "./PubMedia.vue";
import PubMeta from "./PubMeta.vue";
import PubToolbar from "./PubToolbar.vue";
import AttachCards from "./AttachCards.vue";
import AiWrite from "./AiWrite.vue";
import AiImage from "./AiImage.vue";
import PhotoPicker from "./PhotoPicker.vue";
import PhotoEditor from "../PhotoEditor.vue";
import PostPreview from "./PostPreview.vue";
import DraftBox from "./DraftBox.vue";
import { aiDraft, type Media, type OwnerPrice, type PartCard, type Vote } from "../../lib/publish";
import { usePub } from "../../lib/usePub";
import { toast } from "../../lib/ui";
import type { Kind } from "../../lib/route";

const emit = defineEmits<{ switch: [Kind] }>();
const MAX = 9;
const BODY_MAX = 2000;
const media = ref<Media[]>([]);
const title = ref("");
const body = ref("");
const s = reactive({ topic: "", circle: "", claim: "", city: "" });
const vote = ref<Vote | null>(null);
const price = ref<OwnerPrice | null>(null);
const layer = ref<"" | "pick" | "edit" | "ai" | "preview" | "drafts">("");
const editAt = ref(0);
const bodyEl = ref<HTMLTextAreaElement | null>(null);
const ai = ref<InstanceType<typeof AiWrite> | null>(null);

const has = computed(() => Boolean(media.value.length || body.value.trim() || title.value.trim()));
const can = computed(() => Boolean(media.value.length || body.value.trim()));
const snap = () => ({ media: media.value, title: title.value, body: body.value, s: { ...s }, vote: vote.value, price: price.value });
const { close, publish } = usePub("dynamic", {
  snapshot: snap, dirty: () => has.value,
  restore: (d) => { media.value = d.media; title.value = d.title; body.value = d.body; Object.assign(s, d.s); vote.value = d.vote; price.value = d.price; },
  watchOn: [media, title, body, s, vote, price],
});

const grow = () => { const t = bodyEl.value; if (!t) return; t.style.height = "auto"; t.style.height = `${t.scrollHeight}px`; };
const insert = (txt: string) => {
  const t = bodyEl.value; const a = t?.selectionStart ?? body.value.length; const b = t?.selectionEnd ?? a;
  body.value = (body.value.slice(0, a) + txt + body.value.slice(b)).slice(0, BODY_MAX);
  void nextTick(() => { t?.setSelectionRange(a + txt.length, a + txt.length); grow(); });
};
const backspace = () => { const t = bodyEl.value; const a = t?.selectionStart ?? body.value.length; if (!a) return; const ch = [...body.value.slice(0, a)]; ch.pop(); const head = ch.join(""); body.value = head + body.value.slice(a); void nextTick(() => t?.setSelectionRange(head.length, head.length)); };
const addImages = (srcs: string[]) => {
  const room = MAX - media.value.length;
  if (srcs.length > room) toast(`사진은 ${MAX}장까지 올릴 수 있어요`);
  const first = !media.value.length;
  media.value.push(...srcs.slice(0, room).map((src) => ({ kind: "image" as const, src })));
  layer.value = "";
  // 원본: 첫 사진을 올리면 본문이 비어 있을 때 바로 「사진 내용을 알아보는 중…」 초안을 시작
  if (first && !body.value.trim()) void nextTick(() => ai.value?.start(true));
};
const onEdit = (i: number) => { editAt.value = i; layer.value = "edit"; };
const onEdited = (imgs: string[]) => { imgs.forEach((src, i) => { if (media.value[i]) media.value[i] = { kind: "image", src }; }); layer.value = ""; };
const moveMedia = (a: number, b: number) => { const [m] = media.value.splice(a, 1); media.value.splice(b, 0, m!); };
const post = () => {
  if (!can.value) return toast("사진이나 글을 넣어 주세요");
  publish({ title: title.value.trim(), body: body.value.trim(), media: media.value, topic: s.topic, circle: s.circle, claim: s.claim, city: s.city, vote: vote.value, ownerPrice: price.value });
};
const preview = computed(() => ({ kind: "dynamic" as const, title: title.value, body: body.value, media: media.value, topic: s.topic, circle: s.circle, city: s.city, vote: vote.value, ownerPrice: price.value }));
</script>

<template>
  <main class="write write--pub">
    <WriteHead kind="dynamic" :picked="has" :can-post="can" :preview="has" drafts @close="close" @post="post" @switch="emit('switch', $event)" @preview="layer = 'preview'" @drafts="layer = 'drafts'" />
    <section class="pcard">
      <PubMedia :media="media" :max="MAX" mode="dynamic" @pick="layer = 'pick'" @ai="layer = 'ai'" @edit="onEdit" @remove="media.splice($event, 1)" @move="moveMedia" />
      <p v-if="!media.length" class="pcard__tip">좋은 사진을 올리면 <b>더 많이 노출</b>돼요 ✦</p>
    </section>
    <section class="pcard ptext">
      <input v-model="title" class="ptext__title" maxlength="30" placeholder="제목을 쓰면 더 많이 추천돼요(선택)" aria-label="제목" />
      <textarea ref="bodyEl" v-model="body" class="ptext__body" rows="4" :maxlength="BODY_MAX" aria-label="본문" placeholder="눌러서 본문을 쓰세요. 차를 사고 타면서 겪은 일, 차와 함께하는 생활을 나눠 주세요" @input="grow" />
      <AiWrite ref="ai" :make="() => aiDraft('dynamic', { photos: media.length })" @apply="body = $event; grow()" />
      <AttachCards :vote="vote" :price="price" :city="s.city" @rm-vote="vote = null" @rm-price="price = null" @rm-city="s.city = ''" />
      <p class="ptext__tips">💡 이런 글이 인기가 많아요 · <a href="#" @click.prevent="toast('꿀팁 모음은 준비 중이에요')">꿀팁 모음</a><span v-if="body" class="ptext__count">{{ [...body].length }}/{{ BODY_MAX }}</span></p>
    </section>
    <PubMeta v-model:topic="s.topic" v-model:circle="s.circle" v-model:claim="s.claim" show-claim />
    <div class="pfoot-space" />
    <PubToolbar :tools="['emoji', 'vote', 'price', 'map']" :city="s.city" :has-vote="Boolean(vote)" @emoji="insert" @backspace="backspace" @vote="vote = $event" @price="price = $event" @city="s.city = $event" />

    <PhotoPicker v-if="layer === 'pick'" :max="MAX - media.length" @done="addImages" @close="layer = ''" />
    <PhotoEditor v-if="layer === 'edit'" :images="media.map((m) => m.src)" :start="editAt" @done="onEdited" @close="layer = ''" />
    <AiImage v-if="layer === 'ai'" @done="addImages" @close="layer = ''" />
    <PostPreview v-if="layer === 'preview'" :post="preview" @close="layer = ''" />
    <DraftBox v-if="layer === 'drafts'" @close="layer = ''" @switch="layer = ''; emit('switch', $event)" />
  </main>
</template>
