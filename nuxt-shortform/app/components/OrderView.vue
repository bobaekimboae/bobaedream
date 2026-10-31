<script setup lang="ts">
// 주문 상세: autohaus-video 주문 화면과 같은 구성(상태 · 완성 영상 · 내려받기 · 차량 정보 · 요청사항 · 올린 사진).
// 보배드림이 더한 것: 비율 3가지(세로 · 정사각 · 가로), SNS 앱으로 바로 올리기(휴대폰 공유창) + 함께 올릴 글, 틀 · 음악을 바꿔 다시 만들기.
import { computed, onBeforeUnmount, ref, watch } from "vue";
import Icon from "./Icon.vue";
import { addAspect, isQueued, outputOf, remake, removeOrder, state } from "../lib/jobs";
import { FORMATS, captionFor, carTitle, mileageText, yearText } from "../lib/make";
import { MUSIC } from "../lib/music";
import { readProfile, type Format, type Output } from "../lib/store";
import { as, ct, rd } from "../lib/site";
import { formatPrice } from "@kit/text-guard";
import type { ShortformAspect } from "@kit/render";

const props = defineProps<{ id: string }>();
const emit = defineEmits<{ go: [view: string, id?: string]; toast: [t: string] }>();
const order = computed(() => state.orders.find((o) => o.id === props.id));
const format = ref<Format>("A");
const aspect = ref<ShortformAspect>("9:16");
const out = computed<Output | undefined>(() => (order.value ? outputOf(order.value, format.value, aspect.value) : undefined));
const queuedHere = computed(() => !!order.value && isQueued(order.value, format.value, aspect.value));
const videoUrl = ref("");
watch(
  out,
  (o) => {
    if (videoUrl.value) URL.revokeObjectURL(videoUrl.value);
    videoUrl.value = o ? URL.createObjectURL(o.video) : "";
  },
  { immediate: true },
);
const photoUrls = computed(() => order.value?.photos.map((b) => URL.createObjectURL(b)) ?? []);
watch(photoUrls, (_n, old) => old?.forEach((u) => URL.revokeObjectURL(u)));
onBeforeUnmount(() => {
  if (videoUrl.value) URL.revokeObjectURL(videoUrl.value);
  photoUrls.value.forEach((u) => URL.revokeObjectURL(u));
});
const caption = ref("");
watch(order, (o) => o && !caption.value && (caption.value = captionFor(o, readProfile())), { immediate: true });

const stepOf = computed(() => (!order.value ? 0 : order.value.status === "done" ? 3 : order.value.status === "making" ? 2 : 1));
const STEPS = ["주문 접수", "만드는 중", "완성"];
const ASPECTS: { id: ShortformAspect; label: string }[] = [
  { id: "9:16", label: "세로 쇼츠" },
  { id: "1:1", label: "정사각" },
  { id: "16:9", label: "가로" },
];
const fileName = () => `bobae_shortform_${props.id}_${format.value}_${aspect.value.replace(":", "x")}.mp4`;
function download() {
  if (!out.value) return;
  const a = document.createElement("a");
  a.href = videoUrl.value;
  a.download = fileName();
  a.click();
}
async function copy() {
  try {
    await navigator.clipboard.writeText(caption.value);
    emit("toast", "글을 복사했어요");
  } catch {
    emit("toast", "복사하지 못했어요 · 글을 길게 눌러 복사해 주세요");
  }
}
const APPS = [
  { id: "instagram", label: "인스타그램", icon: as("instagram") },
  { id: "tiktok", label: "틱톡", icon: as("tiktok") },
  { id: "youtube", label: "유튜브", icon: as("youtube") },
  { id: "facebook", label: "페이스북", icon: as("facebook") },
];
async function share(label: string) {
  if (!out.value) return;
  try {
    await navigator.clipboard.writeText(caption.value);
  } catch {
    /* 복사가 막혀도 공유는 계속 */
  }
  const file = new File([out.value.video], fileName(), { type: "video/mp4" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text: caption.value });
      return;
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return;
    }
  }
  download();
  emit("toast", `영상을 내려받았어요 · ${label} 앱에서 올리고 글은 붙여 넣으세요`);
}
async function del() {
  if (!order.value || !window.confirm("이 영상을 지울까요? 크레딧은 돌아오지 않아요.")) return;
  await removeOrder(props.id);
  emit("go", "dashboard");
}
const when = (t: number) => new Date(t).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
const dash = (v: string) => v.trim() || "–";
const safeUrl = (u: string) => /^https?:\/\//i.test(u.trim());
const headTitle = computed(() => (order.value ? `${carTitle(order.value.car)}${order.value.car.year.trim() ? ` (${order.value.car.year.trim()})` : ""}` : ""));
</script>
<template>
  <div class="sf-wrap">
    <a class="sf-back" href="?" @click.prevent="emit('go', 'dashboard')"><Icon :src="rd('back-outline-24')" />대시보드</a>
    <div v-if="!order && state.loaded" class="card sf-empty">
      <p>주문을 찾지 못했어요.</p>
      <a href="?" @click.prevent="emit('go', 'dashboard')">대시보드로</a>
    </div>
    <template v-else-if="order">
      <div class="sf-head">
        <div>
          <h1>{{ headTitle }}</h1>
          <p>주문일 {{ when(order.createdAt) }}</p>
        </div>
        <span :class="`badge is-${order.status === 'queued' ? 'making' : order.status}`">{{ order.status === "failed" ? "실패" : STEPS[stepOf - 1] }}</span>
      </div>
      <div class="sf-detail">
        <div class="card sf-player">
          <h3 class="sf-player-h">완성 영상</h3>
          <div class="sf-tabs is-format" role="group" aria-label="영상 형식">
            <button v-for="f in FORMATS" :key="f.id" type="button" :aria-pressed="format === f.id" @click="format = f.id">{{ f.label }}<small>{{ f.desc }}</small></button>
          </div>
          <div class="sf-tabs" role="group" aria-label="비율">
            <button v-for="a in ASPECTS" :key="a.id" type="button" :aria-pressed="aspect === a.id" @click="aspect = a.id">{{ a.label }}</button>
          </div>
          <video v-if="out && videoUrl" :key="videoUrl" :class="`is-${aspect.replace(':', 'x')}`" :src="videoUrl" controls playsinline loop />
          <div v-else-if="order.status === 'failed'" class="sf-making">
            <b>만들지 못했어요</b>
            <span :style="{ color: 'var(--muted)', fontSize: '14px' }">{{ order.error }}</span>
            <button class="btn is-main" type="button" @click="remake(order)">다시 만들기</button>
          </div>
          <div v-else-if="queuedHere || ((order.status === 'making' || order.status === 'queued') && aspect === '9:16')" class="sf-making" role="status">
            <b>{{ order.status === "making" ? "영상을 만드는 중이에요" : "순서를 기다리는 중이에요" }}</b>
            <div class="sf-bar"><i :style="{ width: `${order.progress}%` }" /></div>
            <span :style="{ color: 'var(--muted)', fontSize: '13px' }">{{ order.progress }}% · 이 화면을 열어 두세요</span>
          </div>
          <div v-else class="sf-making">
            <b>{{ FORMATS.find((f) => f.id === format)!.label }} · {{ ASPECTS.find((a) => a.id === aspect)!.label }} 판이 아직 없어요</b>
            <button class="btn is-main" type="button" @click="addAspect(order, format, aspect)">만들기 · 크레딧 안 씀</button>
          </div>
          <div class="sf-row" :style="{ marginTop: '12px' }">
            <button class="btn is-main" type="button" :disabled="!out" :style="{ flex: 1 }" @click="download">영상 내려받기</button>
          </div>
          <p v-if="out && !out.codec.startsWith('avc')" class="sf-hint">이 브라우저는 H.264로 못 만들어 다른 방식으로 만들었어요. 인스타그램 · 아이폰용은 크롬 · 사파리 최신판에서 만들어 주세요.</p>
        </div>
        <div>
          <div class="card sf-box">
            <h3>상태</h3>
            <ol class="sf-steps">
              <li v-for="(t, i) in STEPS" :key="t" :class="stepOf > i ? 'is-on' : ''"><i>{{ stepOf > i ? "✓" : i + 1 }}</i>{{ t }}{{ i === 2 && out ? ` · ${out.seconds}초` : "" }}</li>
            </ol>
          </div>
          <div class="card sf-box">
            <h3>SNS에 올리기</h3>
            <div class="sf-apps">
              <button v-for="a in APPS" :key="a.id" type="button" :disabled="!out" @click="share(a.label)"><span><img :src="a.icon" alt="" /></span>{{ a.label }}</button>
              <button type="button" :disabled="!out" @click="share('원하는')"><span><Icon :src="ct('chotot-common-share')" /></span>기타</button>
            </div>
            <label class="sf-label" for="cap" :style="{ display: 'block', margin: '14px 0 6px' }">함께 올릴 글</label>
            <textarea id="cap" v-model="caption" class="sf-cap" />
            <div class="sf-row" :style="{ marginTop: '8px' }"><button class="btn is-sm" type="button" @click="copy"><Icon :src="ct('chotot-common-copy')" />글 복사</button></div>
            <p class="sf-hint">휴대폰에서는 공유창이 열려요. 앱을 고르면 그 앱의 올리기 화면으로 가요. 계정 연결 · 예약 자동 올리기는 준비 중이에요.</p>
          </div>
          <div class="card sf-box">
            <h3>차량 정보</h3>
            <dl class="sf-dl">
              <dt>제조사</dt><dd>{{ dash(order.car.maker) }}</dd>
              <dt>모델</dt><dd>{{ dash(order.car.model) }}</dd>
              <dt>연식</dt><dd>{{ order.car.year.trim() ? yearText(order.car.year) : "–" }}</dd>
              <dt>가격</dt><dd>{{ order.car.price.trim() ? formatPrice(order.car.price) : "–" }}</dd>
              <dt>주행거리</dt><dd>{{ order.car.mileage.trim() ? mileageText(order.car.mileage) : "–" }}</dd>
              <dt>색상</dt><dd>{{ dash(order.car.color) }}</dd>
            </dl>
          </div>
          <div v-if="safeUrl(order.car.url)" class="card sf-box">
            <h3>매물</h3>
            <a class="sf-link" :href="order.car.url.trim()" target="_blank" rel="noopener">{{ order.car.url.trim() }}</a>
          </div>
          <div v-if="order.note" class="card sf-box">
            <h3>강조할 점</h3>
            <p class="sf-note">{{ order.note }}</p>
          </div>
          <div class="card sf-box">
            <h3>다시 만들기 · 크레딧 안 씀</h3>
            <div class="sf-choice" role="radiogroup" aria-label="영상 틀">
              <button v-for="t in [{ id: 'reels', l: '릴스형' }, { id: 'card', l: '매물 카드형' }, { id: 'band', l: '가로 사진 띠형' }] as const" :key="t.id" type="button" role="radio" :aria-checked="order.style.template === t.id" @click="order.style.template = t.id">{{ t.l }}</button>
            </div>
            <div class="sf-choice" role="radiogroup" aria-label="음악" :style="{ marginTop: '8px' }">
              <button v-for="m in MUSIC" :key="m.id" type="button" role="radio" :aria-checked="order.style.music === m.id" @click="order.style.music = m.id">{{ m.label }}</button>
            </div>
            <div class="sf-row" :style="{ marginTop: '12px' }">
              <button class="btn is-sm" type="button" :disabled="order.status === 'making'" @click="(remake(order), (aspect = '9:16'), (format = 'A'))"><Icon :src="rd('refresh-outline')" />이대로 다시 만들기</button>
              <button class="btn is-sm" type="button" @click="del"><Icon :src="rd('delete-outline')" />지우기</button>
            </div>
          </div>
          <div class="card sf-box">
            <h3>올린 사진 ({{ order.photos.length }})</h3>
            <div class="sf-photos"><img v-for="(u, i) in photoUrls" :key="u" :src="u" :alt="`${i + 1}번째 사진`" /></div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
