<script setup lang="ts">
// 영상(视频) 쓰기 — 동처띠 실측: 탭을 누르면 바로 촬영 화면 + 아래 「最近添加」 영상 앨범 → 고르면 「视频编辑」(구간 · 속도)
// → 다음(字幕 · 封面 · 滤镜 · 特效 · 挡车牌 · 音量) → 다음 → 글 쓰기(표지 · 제목 · 본문 · 화제 · 차량 모임 · 내용 성격 표시).
import { computed, reactive, ref } from "vue";
import WriteHead from "../WriteHead.vue";
import PubMeta from "./PubMeta.vue";
import VideoFlow from "../VideoFlow.vue";
import PostPreview from "./PostPreview.vue";
import Ico from "../Ico.vue";
import { IC } from "../../lib/icons";
import type { Media } from "../../lib/publish";
import { usePub } from "../../lib/usePub";
import { toast } from "../../lib/ui";
import type { Kind } from "../../lib/route";

const emit = defineEmits<{ switch: [Kind] }>();
const video = ref<Media | null>(null);
const title = ref("");
const body = ref("");
const s = reactive({ topic: "", circle: "", claim: "" });
const flow = ref(true);
const preview = ref(false);
const can = computed(() => Boolean(video.value && title.value.trim()));
const has = computed(() => Boolean(video.value || title.value || body.value));
// 영상 파일은 임시저장에 넣을 수 없어 글만 저장한다
const { close, publish } = usePub("video", {
  snapshot: () => ({ title: title.value, body: body.value, s: { ...s } }),
  restore: (d) => { title.value = d.title; body.value = d.body; Object.assign(s, d.s); },
  dirty: () => has.value, watchOn: [title, body, s],
});
const onDone = (v: { url: string; cover: string; duration: number }) => { video.value = { kind: "video", src: v.url, cover: v.cover, duration: v.duration }; flow.value = false; };
const onFlowClose = () => { flow.value = false; if (!video.value) void close(); };
const post = () => {
  if (!video.value) { flow.value = true; return toast("영상을 먼저 골라 주세요"); }
  if (!title.value.trim()) return toast("제목을 써 주세요");
  publish({ title: title.value.trim(), body: body.value.trim(), media: [video.value], topic: s.topic, circle: s.circle, claim: s.claim });
};
const dur = (d = 0) => `${Math.floor(d / 60)}:${String(Math.round(d % 60)).padStart(2, "0")}`;
</script>

<template>
  <main class="write write--pub write--video">
    <WriteHead kind="video" :picked="Boolean(video)" :can-post="can" :preview="Boolean(video)" @close="close" @post="post" @switch="emit('switch', $event)" @preview="preview = true" />
    <section v-if="video" class="pcard pvid">
      <button type="button" class="pvid__cover" aria-label="영상 다시 편집" @click="flow = true"><img :src="video.cover" alt="" /><span class="pvid__dur"><Ico :src="IC.play" />{{ dur(video.duration) }}</span><b>다시 편집</b></button>
      <div class="pvid__text">
        <input v-model="title" maxlength="30" class="ptext__title" placeholder="제목을 써 주세요(필수)" aria-label="제목(필수)" />
        <textarea v-model="body" rows="4" maxlength="1000" class="ptext__body" placeholder="영상 설명을 쓰세요(선택)" aria-label="영상 설명" />
      </div>
    </section>
    <section v-else class="pcard pvid__empty"><button type="button" class="pmedia__add" @click="flow = true"><Ico :src="IC.video" /><span>영상 고르기</span></button></section>
    <PubMeta v-model:topic="s.topic" v-model:circle="s.circle" v-model:claim="s.claim" show-claim />
    <VideoFlow v-if="flow" start="camera" kind="video" @kind="emit('switch', $event)" @done="onDone" @close="onFlowClose" />
    <PostPreview v-if="preview && video" :post="{ kind: 'video', title, body, media: [video], topic: s.topic, circle: s.circle }" @close="preview = false" />
  </main>
</template>
