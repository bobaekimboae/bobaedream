<script setup lang="ts">
// 질문(提问) 쓰기 — 동처띠 실측: 사진 추가 · 영상 추가 칸 → 본문 「有问必答，快速解决你的问题！」 0/2000(늘 보임)
// → 화제 줄 → (아래) 차량 모임 줄 → 도구 줄(표정 · 투표). 질문은 5자 이상이어야 등록된다.
import { computed, nextTick, reactive, ref } from "vue";
import WriteHead from "../WriteHead.vue";
import PubMedia from "./PubMedia.vue";
import PubMeta from "./PubMeta.vue";
import PubToolbar from "./PubToolbar.vue";
import AttachCards from "./AttachCards.vue";
import PhotoPicker from "./PhotoPicker.vue";
import PhotoEditor from "../PhotoEditor.vue";
import VideoFlow from "../VideoFlow.vue";
import PostPreview from "./PostPreview.vue";
import { type Media, type Vote } from "../../lib/publish";
import { usePub } from "../../lib/usePub";
import { toast } from "../../lib/ui";
import type { Kind } from "../../lib/route";

const emit = defineEmits<{ switch: [Kind] }>();
const MAX = 9;
const BODY_MAX = 2000;
const MIN = 5;
const media = ref<Media[]>([]);
const body = ref("");
const s = reactive({ topic: "", circle: "" });
const vote = ref<Vote | null>(null);
const layer = ref<"" | "pick" | "edit" | "video" | "preview">("");
const editAt = ref(0);
const bodyEl = ref<HTMLTextAreaElement | null>(null);

const len = computed(() => [...body.value.trim()].length);
const has = computed(() => Boolean(media.value.length || body.value.trim()));
const can = computed(() => len.value >= MIN);
const { close, publish } = usePub("ask", {
  snapshot: () => ({ media: media.value.filter((m) => m.kind === "image"), body: body.value, s: { ...s }, vote: vote.value }),
  restore: (d) => { media.value = d.media; body.value = d.body; Object.assign(s, d.s); vote.value = d.vote; },
  dirty: () => has.value, watchOn: [media, body, s, vote],
});
const insert = (t: string) => {
  const el = bodyEl.value; const a = el?.selectionStart ?? body.value.length;
  body.value = (body.value.slice(0, a) + t + body.value.slice(el?.selectionEnd ?? a)).slice(0, BODY_MAX);
  void nextTick(() => el?.setSelectionRange(a + t.length, a + t.length));
};
const backspace = () => { const ch = [...body.value]; ch.pop(); body.value = ch.join(""); };
const addImages = (srcs: string[]) => { media.value.push(...srcs.slice(0, MAX - media.value.length).map((src) => ({ kind: "image" as const, src }))); layer.value = ""; };
const onVideo = (v: { url: string; cover: string; duration: number }) => { media.value.unshift({ kind: "video", src: v.url, cover: v.cover, duration: v.duration }); layer.value = ""; };
const onEdit = (i: number) => { if (media.value[i]?.kind === "video") return toast("영상은 빼고 다시 넣어 편집해 주세요"); editAt.value = media.value.slice(0, i).filter((m) => m.kind === "image").length; layer.value = "edit"; };
const onEdited = (imgs: string[]) => { let k = 0; media.value = media.value.map((m) => (m.kind === "image" ? { kind: "image", src: imgs[k++] ?? m.src } : m)); layer.value = ""; };
const post = () => {
  if (!can.value) return toast(len.value ? `${MIN - len.value}자 더 써 주세요` : "궁금한 점을 써 주세요");
  publish({ title: "", body: body.value.trim(), media: media.value, topic: s.topic, circle: s.circle, vote: vote.value });
};
</script>

<template>
  <main class="write write--pub write--ask">
    <WriteHead kind="ask" :picked="has" :can-post="can" :preview="has" @close="close" @post="post" @switch="emit('switch', $event)" @preview="layer = 'preview'" />
    <section class="pcard pcard--media"><PubMedia :media="media" :max="MAX" mode="ask" @pick="layer = 'pick'" @video="layer = 'video'" @edit="onEdit" @remove="media.splice($event, 1)" @move="(a, b) => { const [m] = media.splice(a, 1); media.splice(b, 0, m!); }" /></section>
    <section class="pcard ptext">
      <textarea ref="bodyEl" v-model="body" class="ptext__body ptext__body--ask" rows="5" :maxlength="BODY_MAX" aria-label="질문" placeholder="물으면 답해요. 궁금한 걸 빠르게 해결하세요!" />
      <AttachCards :vote="vote" @rm-vote="vote = null" />
      <span class="ptext__count ptext__count--out">{{ [...body].length }}/{{ BODY_MAX }}</span>
    </section>
    <PubMeta v-model:topic="s.topic" v-model:circle="s.circle" :show-circle="false" />
    <div class="pask-circle"><PubMeta v-model:topic="s.topic" v-model:circle="s.circle" :show-topic="false" /></div>
    <div class="pfoot-space" />
    <PubToolbar :tools="['emoji', 'vote']" :has-vote="Boolean(vote)" @emoji="insert" @backspace="backspace" @vote="vote = $event" />

    <PhotoPicker v-if="layer === 'pick'" :max="MAX - media.length" @done="addImages" @close="layer = ''" />
    <PhotoEditor v-if="layer === 'edit'" :images="media.filter((m) => m.kind === 'image').map((m) => m.src)" :start="editAt" @done="onEdited" @close="layer = ''" />
    <VideoFlow v-if="layer === 'video'" start="album" @done="onVideo" @close="layer = ''" />
    <PostPreview v-if="layer === 'preview'" :post="{ kind: 'ask', body, media, topic: s.topic, circle: s.circle, vote }" @close="layer = ''" />
  </main>
</template>
