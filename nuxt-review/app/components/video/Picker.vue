<script setup lang="ts">
// 1단계: 위 = 카메라 미리보기 + 둥근 카메라 버튼, 아래 = 「최근 추가」 앨범 시트(동처띠 视频 탭).
// 브라우저는 앨범 목록을 읽을 수 없어 첫 칸 「앨범에서 영상 고르기」로 파일을 고르고, 고른 영상만 4열로 보여 준다.
import { onBeforeUnmount, onMounted, ref } from "vue";
import Ico from "../Ico.vue";
import { VI } from "../../lib/video-icons";
import { mmss, type Clip } from "./render";

const props = defineProps<{ clips: Clip[]; selected: string[]; loading: number; max: number }>();
const emit = defineEmits<{ add: [files: File[]]; toggle: [id: string]; next: []; record: []; close: [] }>();

const cam = ref<HTMLVideoElement | null>(null);
const camOk = ref(false);
const file = ref<HTMLInputElement | null>(null);
let stream: MediaStream | null = null;

onMounted(async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    if (cam.value) { cam.value.srcObject = stream; await cam.value.play().catch(() => {}); }
    camOk.value = true;
  } catch { camOk.value = false; }
});
onBeforeUnmount(() => stream?.getTracks().forEach((t) => t.stop()));

const order = (id: string) => props.selected.indexOf(id) + 1;
const pick = (e: Event) => {
  const el = e.target as HTMLInputElement;
  const list = Array.from(el.files || []).filter((f) => f.type.startsWith("video/") || /\.(mp4|mov|webm|m4v)$/i.test(f.name));
  if (list.length) emit("add", list);
  el.value = "";
};
defineExpose({ esc: () => false });
</script>

<template>
  <div class="vf-pick">
    <div class="vf-pick__cam">
      <video v-show="camOk" ref="cam" class="vf-pick__live" muted playsinline autoplay />
      <div v-if="!camOk" class="vf-pick__nocam"><Ico :src="VI.video" /><span>카메라를 켤 수 없어요</span></div>
      <button class="vf-x" type="button" aria-label="닫기" @click="emit('close')"><Ico :src="VI.close" /></button>
      <button class="vf-pick__shot" type="button" aria-label="촬영하기" @click="emit('record')"><Ico :src="VI.camera" /></button>
    </div>

    <section class="vf-sheet" aria-label="최근 추가">
      <span class="vf-sheet__grip" aria-hidden="true" />
      <header class="vf-sheet__head">
        <h2>최근 추가</h2>
        <button class="vf-pill" type="button" :disabled="!selected.length" @click="emit('next')">선택 ({{ selected.length }})</button>
      </header>
      <div class="vf-grid">
        <button class="vf-tile vf-tile--add" type="button" @click="file?.click()">
          <Ico :src="VI.add" />
          <span>앨범에서<br />영상 고르기</span>
        </button>
        <div v-for="n in loading" :key="'l' + n" class="vf-tile vf-tile--load" aria-label="불러오는 중"><span class="vf-spin" /></div>
        <button
          v-for="c in clips"
          :key="c.id"
          class="vf-tile"
          type="button"
          :aria-pressed="order(c.id) > 0"
          :aria-label="`${c.name} ${mmss(c.dur)}`"
          :class="{ 'is-on': order(c.id) > 0, 'is-full': !order(c.id) && selected.length >= max }"
          @click="emit('toggle', c.id)"
        >
          <img :src="c.thumb" alt="" />
          <span class="vf-tile__dur">{{ mmss(c.dur) }}</span>
          <span class="vf-check" :class="{ 'is-on': order(c.id) > 0 }">{{ order(c.id) || "" }}</span>
        </button>
      </div>
      <p v-if="!clips.length && !loading" class="vf-sheet__hint">영상을 골라 주세요 · 최대 {{ max }}개까지 이어 붙일 수 있어요</p>
      <input ref="file" class="vf-hide" type="file" accept="video/*" multiple @change="pick" />
    </section>
  </div>
</template>
