<!--
  숏폼 한 장의 영상. 매물 영상 파일(mp4 · HLS)은 video 로, 유튜브 쇼츠 주소는 유튜브 퍼가기(쿠키 없는 도메인)로 튼다.
  밖에서는 같은 방법으로 다룬다: play() · pause() · seek(초) · setMuted(on), 알림 time · ended · error.
  load=false 면 영상을 받지 않고 대표 사진만 보인다(화면 밖 영상은 받지 않음).
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ShortVideo } from "~/lib/types";

const props = defineProps<{ video: ShortVideo; poster: string | null; load: boolean; muted: boolean; label: string }>();
const emit = defineEmits<{ time: [t: number, d: number]; ended: []; error: []; playing: [] }>();

const el = ref<HTMLVideoElement | null>(null);
const frame = ref<HTMLIFrameElement | null>(null);
const failed = ref(false);
const ytReady = ref(false);
let want: "play" | "pause" = "pause";

const ytSrc = computed(() => {
  if (props.video.kind !== "youtube") return "";
  const id = props.video.id;
  const q = new URLSearchParams({
    enablejsapi: "1",
    playsinline: "1",
    mute: "1",
    controls: "0",
    rel: "0",
    loop: "1",
    playlist: id,
    modestbranding: "1",
    origin: window.location.origin,
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${q}`;
});

const yt = (func: string, args: unknown[] = []) =>
  frame.value?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "https://www.youtube-nocookie.com");

const onMsg = (e: MessageEvent) => {
  if (!frame.value || e.source !== frame.value.contentWindow) return;
  let d: { event?: string; info?: { currentTime?: number; duration?: number; playerState?: number } } | null = null;
  try {
    d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
  } catch {
    return;
  }
  if (!d) return;
  if (d.event === "onReady" || (d.event === "infoDelivery" && !ytReady.value)) {
    ytReady.value = true;
    yt(props.muted ? "mute" : "unMute");
    yt(want === "play" ? "playVideo" : "pauseVideo");
  }
  if (d.event === "onError") {
    failed.value = true;
    emit("error");
  }
  const info = d.info;
  if (info && typeof info.currentTime === "number") emit("time", info.currentTime, info.duration ?? 0);
  if (info?.playerState === 1) emit("playing");
};
const onFrameLoad = () => {
  // 유튜브 플레이어에게 상태를 알려 달라고 한다(이벤트 받기 시작)
  frame.value?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: props.label }), "https://www.youtube-nocookie.com");
};

function play() {
  want = "play";
  if (failed.value) return;
  if (props.video.kind === "youtube") {
    if (ytReady.value) yt("playVideo");
    return;
  }
  const v = el.value;
  if (!v) return;
  v.muted = props.muted;
  void v.play().then(() => emit("playing")).catch(() => {
    /* 자동 재생이 막히면 멈춘 상태로 둔다(누르면 재생) */
  });
}
function pause() {
  want = "pause";
  if (props.video.kind === "youtube") yt("pauseVideo");
  else el.value?.pause();
}
function seek(t: number) {
  if (props.video.kind === "youtube") yt("seekTo", [t, true]);
  else if (el.value) el.value.currentTime = t;
}
watch(
  () => props.muted,
  (m) => {
    if (props.video.kind === "youtube") yt(m ? "mute" : "unMute");
    else if (el.value) el.value.muted = m;
  },
);
watch(
  () => props.load,
  (l) => {
    if (!l) ytReady.value = false;
  },
);

const onTime = () => {
  const v = el.value;
  if (v) emit("time", v.currentTime, Number.isFinite(v.duration) ? v.duration : 0);
};
const onErr = () => {
  failed.value = true;
  emit("error");
};
const retry = () => {
  failed.value = false;
  ytReady.value = false;
  if (el.value) el.value.load();
  if (frame.value) frame.value.src = ytSrc.value;
  play();
};

onMounted(() => window.addEventListener("message", onMsg));
onBeforeUnmount(() => window.removeEventListener("message", onMsg));
defineExpose({ play, pause, seek });
</script>
<template>
  <div class="player">
    <img v-if="poster" class="player__poster" :src="poster" alt="" loading="lazy" decoding="async" />
    <template v-if="load && !failed">
      <video
        v-if="video.kind !== 'youtube'"
        ref="el"
        class="player__video"
        :src="video.url"
        :poster="poster ?? undefined"
        :aria-label="label"
        playsinline
        muted
        loop
        preload="metadata"
        @timeupdate="onTime"
        @loadedmetadata="onTime"
        @ended="emit('ended')"
        @error="onErr"
      />
      <iframe
        v-else
        ref="frame"
        class="player__yt"
        :src="ytSrc"
        :title="label"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerpolicy="strict-origin-when-cross-origin"
        loading="lazy"
        tabindex="-1"
        @load="onFrameLoad"
      />
    </template>
    <div v-if="failed" class="player__fail" role="alert">
      <p>영상을 불러오지 못했어요.</p>
      <button type="button" class="player__retry" @click.stop="retry">다시 불러오기</button>
    </div>
  </div>
</template>
