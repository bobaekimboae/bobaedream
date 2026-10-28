<script setup lang="ts">
// 리액트 video-listing-viewer.tsx 의 VideoListingViewer. onClose → emit("close"), onNotify(message) → emit("notify", message)
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { asset } from "@proto/data";
import { VIDEO_LISTINGS } from "@proto/listing/video-listing-viewer";
import "@proto/listing/video-listing-viewer.css";
import VideoSvgChevron from "./VideoSvgChevron.vue";
import VideoHorizontalChevron from "./VideoHorizontalChevron.vue";
import VideoActionIcon from "./VideoActionIcon.vue";

const emit = defineEmits<{ close: []; notify: [message: string] }>();

// 아래 작은 함수들은 리액트 파일에서 export 되지 않아 그대로 옮겼다
type VideoListing = (typeof VIDEO_LISTINGS)[number];
const icon = (name: string) => asset(`icons/chotot/${name}.svg`);
const priceLabel = (price: number | null) => price === null ? "가격 상담" : `${price.toLocaleString("ko-KR")}만원`;
const specLabel = (item: VideoListing) => `${item.row.year}년식 · ${item.row.mileage.toLocaleString("ko-KR")}km · ${item.row.fuel} · 자동`;
const dateLabel = (date: string) => {
  const days = Math.max(0, Math.floor((Date.now() - Date.parse(`${date}T00:00:00+09:00`)) / 86_400_000));
  if (days === 0) return "오늘";
  if (days === 1) return "1일 전";
  return `${days}일 전`;
};
const seconds = (value: number) => {
  if (!Number.isFinite(value)) return "0:00";
  const minute = Math.floor(value / 60);
  return `${minute}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
};

const index = ref(0);
const muted = ref(false);
const volume = 0.72;
const audioBlocked = ref(false);
const paused = ref(false);
const liked = ref<Set<string>>(new Set());
const saved = ref<Set<string>>(new Set());
const tab = ref<"info" | "comments">("info");
const elapsed = ref(0);
const duration = ref(0);
const videoRef = ref<HTMLVideoElement | null>(null);
const item = computed(() => VIDEO_LISTINGS[index.value]);
const thumbs = computed(() => Array.from({ length: 7 }, (_, offset) => ({ offset, item: VIDEO_LISTINGS[(index.value + offset) % VIDEO_LISTINGS.length] })));
const indicatorDots = computed(() => {
  const visible = Math.min(15, VIDEO_LISTINGS.length);
  const start = Math.min(Math.max(index.value - 7, 0), Math.max(VIDEO_LISTINGS.length - visible, 0));
  return Array.from({ length: visible }, (_, offset) => start + offset);
});

const choose = (next: number) => {
  index.value = (next + VIDEO_LISTINGS.length) % VIDEO_LISTINGS.length;
  elapsed.value = 0;
  duration.value = 0;
  paused.value = false;
  tab.value = "info";
};
const move = (delta: number) => choose(index.value + delta);
const toggleSet = (which: "liked" | "saved", code: string) => {
  const target = which === "liked" ? liked : saved;
  const next = new Set(target.value);
  if (next.has(code)) next.delete(code); else next.add(code);
  target.value = next;
};
const togglePlayback = () => {
  const video = videoRef.value;
  if (!video) return;
  if (video.paused) {
    video.muted = false;
    muted.value = false;
    void video.play().then(() => { audioBlocked.value = false; }).catch(() => { audioBlocked.value = true; });
  } else video.pause();
};
const toggleSound = () => {
  const video = videoRef.value;
  const nextMuted = !muted.value;
  muted.value = nextMuted;
  if (!video) return;
  video.muted = nextMuted;
  video.volume = volume;
  if (!nextMuted) void video.play().then(() => { audioBlocked.value = false; }).catch(() => { audioBlocked.value = true; });
};

const previousOverflow = document.body.style.overflow;
document.body.style.overflow = "hidden";
const onKey = (event: KeyboardEvent) => {
  if (event.key === "Escape") emit("close");
  if (event.key === "ArrowUp") move(-1);
  if (event.key === "ArrowDown") move(1);
  if (event.key === " ") { event.preventDefault(); togglePlayback(); }
};
window.addEventListener("keydown", onKey);
onBeforeUnmount(() => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKey); });
// 리액트 useEffect([index, muted, volume]): video 를 다시 그린 뒤 재생을 시도한다
const autoplay = () => {
  const video = videoRef.value;
  if (!video) return;
  video.muted = muted.value;
  video.volume = volume;
  const promise = video.play();
  const wasMuted = muted.value;
  promise?.then(() => { audioBlocked.value = false; }).catch(() => { audioBlocked.value = !wasMuted; paused.value = true; });
};
onMounted(autoplay);
watch([index, muted], autoplay, { flush: "post" });

const onPlay = () => { paused.value = false; audioBlocked.value = false; };
const onSeek = (event: Event) => { const value = Number((event.currentTarget as HTMLInputElement).value); if (videoRef.value) videoRef.value.currentTime = value; elapsed.value = value; };
</script>
<template>
  <main v-if="item" class="vlf" aria-label="영상 매물">
    <section class="vlf-shell">
      <div class="vlf-stage">
        <video
          :key="item.code"
          ref="videoRef"
          :src="asset(item.video)"
          :poster="asset(item.poster)"
          autoplay
          :muted="muted"
          playsinline
          preload="metadata"
          @click="togglePlayback"
          @play="onPlay"
          @pause="paused = true"
          @loadedmetadata="duration = ($event.currentTarget as HTMLVideoElement).duration"
          @timeupdate="elapsed = ($event.currentTarget as HTMLVideoElement).currentTime"
          @ended="move(1)"
        />
        <div class="vlf-stage-shade" />
        <button type="button" class="vlf-close" aria-label="영상 매물 닫기" @click="emit('close')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.2929 7.29301C15.6834 6.90249 16.3164 6.90249 16.707 7.29301C17.0975 7.68354 17.0975 8.31655 16.707 8.70708L13.414 12L16.707 15.293L16.7753 15.3692C17.0957 15.762 17.0731 16.341 16.707 16.7071C16.3408 17.0732 15.7618 17.0958 15.3691 16.7754L15.2929 16.7071L11.9999 13.4141L8.70696 16.7071C8.31643 17.0976 7.68342 17.0976 7.29289 16.7071C6.90237 16.3166 6.90237 15.6835 7.29289 15.293L10.5859 12L7.29289 8.70708L7.22453 8.63091C6.90418 8.23813 6.92678 7.65913 7.29289 7.29301C7.65901 6.9269 8.23801 6.9043 8.63078 7.22466L8.70696 7.29301L11.9999 10.586L15.2929 7.29301Z" fill="currentColor" /></svg>
        </button>
        <nav class="vlf-discovery" aria-label="영상 추천 방식"><button type="button" class="is-active">영상매물</button><button type="button">추천매물</button></nav>
        <button type="button" class="vlf-more" aria-label="영상 설정 더보기" @click="emit('notify', '영상 설정 메뉴입니다')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.7813 11.9924C13.7813 11.0081 12.9844 10.2112 12 10.2112C11.0156 10.2112 10.2188 11.0081 10.2188 11.9924C10.2188 12.9768 11.0156 13.7737 12 13.7737C12.9844 13.7737 13.7813 12.9768 13.7813 11.9924Z" fill="currentColor" /><path d="M13.7813 4.78149C13.7813 3.79712 12.9844 3.00024 12 3.00024C11.0156 3.00024 10.2188 3.79712 10.2188 4.78149C10.2188 5.76587 11.0156 6.56274 12 6.56274C12.9844 6.56274 13.7813 5.76587 13.7813 4.78149Z" fill="currentColor" /><path d="M13.7812 19.219C13.7812 18.2346 12.9844 17.4377 12 17.4377C11.0156 17.4377 10.2187 18.2346 10.2187 19.219C10.2187 20.2034 11.0156 21.0002 12 21.0002C12.9844 21.0002 13.7812 20.2034 13.7812 19.219Z" fill="currentColor" /></svg>
        </button>
        <div class="vlf-volume">
          <button type="button" class="vlf-sound" :aria-label="muted ? '소리 켜기' : '음소거'" :aria-pressed="!muted" @click="toggleSound">
            <svg v-if="muted" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.3926 5.21814C11.6929 4.97875 12.1042 4.93235 12.4502 5.099C12.7963 5.26567 13.0156 5.61625 13.0156 6.00036V18.0004C13.0156 18.3845 12.7963 18.7351 12.4502 18.9017C12.1042 19.0683 11.6929 19.022 11.3926 18.7826L7.29004 15.5101L3 15.5121C2.73488 15.5121 2.48049 15.4065 2.29297 15.2191C2.10546 15.0317 2.0001 14.7772 2 14.5121V9.48864C2.0002 8.93653 2.44784 8.48864 3 8.48864H7.29199L11.3926 5.21814ZM20.3018 9.00818C20.6972 8.62279 21.3303 8.63137 21.7158 9.02673C22.1013 9.42219 22.0936 10.0553 21.6982 10.4408L20.1826 11.9174L21.6982 13.3949L21.7676 13.4691C22.0932 13.8577 22.0773 14.4381 21.7158 14.809C21.3303 15.2041 20.6971 15.2119 20.3018 14.8265L18.75 13.3138L17.1982 14.8265C16.8029 15.2119 16.1697 15.2041 15.7842 14.809C15.3988 14.4136 15.4066 13.7804 15.8018 13.3949L17.3164 11.9174L15.8018 10.4408C15.4064 10.0553 15.3987 9.42219 15.7842 9.02673C16.1697 8.63137 16.8028 8.62279 17.1982 9.00818L18.75 10.5199L20.3018 9.00818Z" fill="currentColor" /></svg><svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M11.393 5.218a1 1 0 0 1 1.623.782v12a1 1 0 0 1-1.623.782L7.29 15.51H3a1 1 0 0 1-1-1V9.489a1 1 0 0 1 1-1h4.292l4.101-3.27Zm4.9 2.575a1 1 0 0 1 1.414 0 5.95 5.95 0 0 1 0 8.414 1 1 0 0 1-1.414-1.414 3.95 3.95 0 0 0 0-5.586 1 1 0 0 1 0-1.414Zm2.828-2.121a1 1 0 0 1 1.415 0 8.95 8.95 0 0 1 0 12.656 1 1 0 0 1-1.415-1.414 6.95 6.95 0 0 0 0-9.828 1 1 0 0 1 0-1.414Z" fill="currentColor" /></svg>
          </button>
        </div>
        <button v-if="paused" type="button" :class="`vlf-play${audioBlocked ? ' is-audio-blocked' : ''}`" :aria-label="audioBlocked ? '소리 켜고 재생' : '영상 재생'" @click="togglePlayback"><span /><b v-if="audioBlocked">소리 켜고 재생</b></button>
        <div class="vlf-progress">
          <input aria-label="재생 위치" type="range" min="0" :max="Math.max(duration, 1)" step="0.1" :value="Math.min(elapsed, Math.max(duration, 1))" :style="{ '--vlf-progress': `${duration ? elapsed / duration * 100 : 0}%` }" @input="onSeek" />
          <b>{{ seconds(elapsed) }} / {{ seconds(duration) }}</b>
        </div>
        <div class="vlf-filmstrip" :aria-label="`${index + 1} / ${VIDEO_LISTINGS.length}`">
          <button type="button" class="vlf-film-arrow" aria-label="이전 영상" :disabled="index === 0" @click="move(-1)"><VideoHorizontalChevron direction="left" /></button>
          <div><button v-for="dot in indicatorDots" :key="VIDEO_LISTINGS[dot].code" type="button" :class="dot === index ? 'is-active' : undefined" :aria-label="`${dot + 1}번 영상`" @click="choose(dot)" /></div>
          <button type="button" class="vlf-film-arrow" aria-label="다음 영상" @click="move(1)"><VideoHorizontalChevron direction="right" /></button>
        </div>
        <article class="vlf-mobile-summary">
          <small class="vlf-mobile-seller"><span>한</span><b>한지훈 인증딜러</b><i>판매 15대</i></small>
          <strong>{{ item.maker }} {{ item.model }}</strong><span>{{ specLabel(item) }}</span><b>{{ priceLabel(item.row.price) }}</b>
        </article>
      </div>

      <aside class="vlf-actions" aria-label="영상 매물 동작">
        <div class="vlf-actions-list">
          <div class="vlf-action-item"><button type="button" :class="liked.has(item.code) ? 'is-active' : undefined" aria-label="좋아요" :aria-pressed="liked.has(item.code)" @click="toggleSet('liked', item.code)"><VideoActionIcon kind="like" /></button><small>{{ liked.has(item.code) ? 1 : 0 }}</small></div>
          <div class="vlf-action-item"><button type="button" aria-label="댓글" @click="tab = 'comments'"><VideoActionIcon kind="comment" /></button></div>
          <div class="vlf-action-item"><button type="button" :class="saved.has(item.code) ? 'is-active' : undefined" aria-label="저장" :aria-pressed="saved.has(item.code)" @click="toggleSet('saved', item.code)"><VideoActionIcon kind="favorite" /></button><small>저장</small></div>
          <div class="vlf-action-item"><button type="button" aria-label="공유" @click="emit('notify', '영상 매물 링크를 복사했어요')"><VideoActionIcon kind="share" /></button><small>공유</small></div>
        </div>
        <div class="vlf-stepper"><button type="button" aria-label="이전 매물" :disabled="index === 0" @click="move(-1)"><VideoSvgChevron direction="up" /></button><button type="button" aria-label="다음 매물" @click="move(1)"><VideoSvgChevron direction="down" /></button></div>
      </aside>

      <article class="vlf-detail">
        <header>
          <h1>{{ item.maker }} {{ item.model }}</h1>
          <p class="vlf-specs"><span>{{ item.row.year }}년식</span><span>{{ item.row.mileage.toLocaleString("ko-KR") }}km</span><span>{{ item.row.fuel }}</span><span>자동</span></p>
          <strong>{{ priceLabel(item.row.price) }}</strong>
          <span><img :src="icon('chotot-list-detail-address-location')" alt="" />서울 서초구 · 서울오토갤러리</span>
          <span><img :src="icon('chotot-common-clock')" alt="" />{{ dateLabel(item.date) }}</span>
        </header>
        <div class="vlf-thumbs" aria-label="다른 영상 매물">
          <button v-for="{ offset, item: thumb } in thumbs" :key="`${item.code}-${thumb.code}-${offset}`" type="button" :class="offset === 0 ? 'is-active' : undefined" :aria-label="`${thumb.maker} ${thumb.model}`" @click="choose(index + offset)"><img :src="asset(thumb.poster)" alt="" /></button>
        </div>
        <section class="vlf-seller">
          <span class="vlf-avatar">한</span>
          <span class="vlf-seller-identity"><strong>한지훈 <img :src="icon('chotot-list-detail-verified-dealer-wavy-badge')" alt="인증" /></strong><small>15대 판매</small></span>
          <span class="vlf-seller-rating"><strong>-- <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.7 2.77 5.61 6.19.9-4.48 4.37 1.06 6.16L12 16.83l-5.54 2.91 1.06-6.16-4.48-4.37 6.19-.9L12 2.7Z" fill="currentColor" /></svg></strong><button type="button" @click="emit('notify', '등록된 딜러 후기가 아직 없어요')">후기 0개</button></span>
        </section>
        <nav class="vlf-tabs" role="tablist"><button type="button" role="tab" :aria-selected="tab === 'info'" :class="tab === 'info' ? 'is-active' : undefined" @click="tab = 'info'">정보</button><button type="button" role="tab" :aria-selected="tab === 'comments'" :class="tab === 'comments' ? 'is-active' : undefined" @click="tab = 'comments'">댓글 (0)</button></nav>
        <div class="vlf-detail-body">
          <template v-if="tab === 'info'"><h2>상세 설명</h2><p>{{ item.row.year }}년 {{ item.row.month }}월 등록 · {{ item.row.mileage.toLocaleString("ko-KR") }}km 실주행 차량입니다.<br />{{ item.row.fuel }} · {{ item.row.color }} · {{ item.row.cc ? `${item.row.cc.toLocaleString("ko-KR")}cc` : "친환경차" }}<br />공개 판매 영상으로 차량의 외관과 실내 상태를 확인해 보세요.</p><dl><div><dt>판매자</dt><dd>한지훈 인증딜러</dd></div><div><dt>매매단지</dt><dd>서울오토갤러리</dd></div></dl></template>
          <div v-else class="vlf-empty-comment"><img :src="icon('chotot-list-detail-listing-comment')" alt="" /><strong>첫 댓글을 남겨보세요</strong><p>차량에 궁금한 점은 채팅으로 바로 문의할 수 있어요.</p></div>
        </div>
        <footer><button type="button" @click="emit('notify', '한지훈 딜러와 채팅을 시작할 수 있어요')">채팅</button><button type="button" @click="emit('notify', '전화번호는 정식 서비스에서 확인할 수 있어요')"><img :src="icon('chotot-list-detail-phone')" alt="" />전화번호 보기</button></footer>
      </article>
    </section>
  </main>
</template>
