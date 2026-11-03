<script setup lang="ts">
// 원본 결과 화면: ● Ready to publish · 차명(✎) · 날짜 · 사진 수 · 영상(가운데 ▶) · Happy with the video? 👍👎 · Download → 「갤러리에 저장했어요」 시트 · Close
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import Icon from "./Icon.vue";
import TopBack from "./TopBack.vue";
import { fileName, startVideo, videoById } from "../lib/jobs";
import { saveVideo } from "../lib/store";
import { canSpeak, hush, speak } from "../lib/voice";
import { ct, rd } from "../lib/site";

const props = defineProps<{ id: string }>();
const emit = defineEmits<{ back: []; go: [v: string, extra?: Record<string, string>, replace?: boolean]; toast: [t: string] }>();
const v = computed(() => videoById(props.id));
const url = computed(() => (v.value?.video ? URL.createObjectURL(v.value.video) : ""));
onBeforeUnmount(() => { if (url.value) URL.revokeObjectURL(url.value); hush(); });
const el = ref<HTMLVideoElement | null>(null);
const playingNow = ref(false);
const saved = ref(false);
const editing = ref(false);
const title = ref("");
const input = ref<HTMLInputElement | null>(null);

const when = computed(() => {
  const d = new Date(v.value?.createdAt ?? 0);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
});

// AI 음성: 재생 시각이 대사 시각을 지나면 그 줄을 읽는다
let said = new Set<number>();
function onTime() {
  const vv = v.value;
  const e = el.value;
  if (!vv || !e || !vv.options.voiceover || !vv.lines) return;
  vv.lines.forEach((l, i) => {
    if (!said.has(i) && e.currentTime >= l.at && e.currentTime < l.at + 1.2) { said.add(i); speak(l.text, vv.options.lang); }
  });
}
function onSeek() {
  hush();
  const t = el.value?.currentTime ?? 0;
  said = new Set((v.value?.lines ?? []).map((l, i) => (l.at < t - 0.2 ? i : -1)).filter((i) => i >= 0));
}
function play() { void el.value?.play(); }

async function rate(r: "up" | "down") {
  if (!v.value) return;
  const nv = { ...v.value, rating: v.value.rating === r ? "" as const : r };
  await saveVideo(nv);
  emit("toast", nv.rating ? "의견 고마워요." : "의견을 지웠어요.");
}
async function startEdit() {
  title.value = v.value?.title ?? "";
  editing.value = true;
  await nextTick();
  input.value?.focus();
}
async function saveTitle() {
  editing.value = false;
  if (v.value && title.value.trim() && title.value.trim() !== v.value.title) await saveVideo({ ...v.value, title: title.value.trim() });
}
function download() {
  if (!v.value?.video) return;
  const a = document.createElement("a");
  a.href = url.value;
  a.download = fileName(v.value);
  a.click();
  saved.value = true;
}
async function again() {
  const old = v.value;
  if (!old) return;
  const id = await startVideo(old.details, old.options, old.photos, old.projectId);
  emit("go", "making", { id }, true);
}
</script>

<template>
  <TopBack @back="emit('back')" />
  <main v-if="v" class="res">
    <template v-if="v.status === 'done'">
      <span class="ready">게시 준비 완료</span>
      <h2 v-if="!editing">{{ v.title }} <button type="button" aria-label="이름 바꾸기" @click="startEdit"><Icon :src="rd('edit-outline')" /></button></h2>
      <h2 v-else><input ref="input" v-model="title" class="inp" style="font-size: 18px; text-align: center" @keydown.enter="saveTitle" @blur="saveTitle" /></h2>
      <p class="meta">{{ when }} · 사진 {{ v.photos.length }}장</p>
      <div class="player" :style="{ aspectRatio: v.options.aspect.replace(':', ' / ') }">
        <video ref="el" :src="url" :poster="v.poster" playsinline controls preload="metadata" @play="playingNow = true" @pause="playingNow = false; hush()" @ended="playingNow = false; said.clear()" @timeupdate="onTime" @seeking="onSeek" />
        <button v-if="!playingNow" class="big" type="button" aria-label="재생" @click="play"><span><Icon :src="rd('play-fill')" /></span></button>
      </div>
      <div class="happy">영상이 마음에 드세요?
        <button type="button" aria-label="좋아요" :aria-pressed="v.rating === 'up'" @click="rate('up')"><Icon :src="ct('chotot-common-like')" /></button>
        <button type="button" aria-label="별로예요" :aria-pressed="v.rating === 'down'" @click="rate('down')"><Icon :src="ct('chotot-common-dislike')" /></button>
      </div>
      <button class="btn or dl" type="button" @click="download"><Icon :src="rd('forward-outline')" style="transform: rotate(90deg)" /> 내려받기</button>
      <p v-if="v.options.voiceover" class="voice-note">{{ canSpeak() ? "AI 음성은 이 화면에서 재생할 때 함께 들려요. 내려받은 mp4에는 음악만 들어 있어요(음성 서버 연결 전)." : "이 브라우저는 AI 음성을 읽지 못해요." }}</p>
    </template>
    <template v-else-if="v.status === 'failed'">
      <h2>영상을 만들지 못했어요</h2>
      <p class="meta">{{ v.error }}</p>
      <button class="btn or dl" type="button" @click="again">다시 만들기</button>
    </template>
    <template v-else>
      <p class="meta" style="margin-top: 40px">아직 만드는 중이에요.</p>
      <button class="btn line" type="button" @click="emit('go', 'making', { id: v.id }, true)">진행 상황 보기</button>
    </template>
  </main>
  <main v-else class="res"><p class="meta" style="margin-top: 40px">이 영상을 찾을 수 없어요.</p></main>

  <div v-if="saved" class="dim" @click.self="saved = false">
    <div class="sheet toast-sheet" role="dialog" aria-label="저장 완료">영상을 기기에 저장했어요.<button class="btn ghost" type="button" @click="saved = false">닫기</button></div>
  </div>
</template>
