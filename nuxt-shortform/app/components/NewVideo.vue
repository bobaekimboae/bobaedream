<script setup lang="ts">
// 새 영상: autohaus-video 「Neues Video」와 같은 2단계(① 차량 정보 → ② 사진 올리기 · 요청사항 → 주문 1크레딧).
// 같은 동작: 크레딧 0이면 구매 안내, 제조사·모델 없으면 다음 버튼 막힘, 사진 4장 전에는 주문 버튼 막힘, 주문하면 주문 화면으로.
// 보배드림이 더한 것: 틀 · 음악 · 길이 고르기, 판매자 정보 · 로고(끝 장면), 접수하면 바로 이 폰에서 만든다(24시간 기다림 없음).
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import Icon from "./Icon.vue";
import { state, submit } from "../lib/jobs";
import { MUSIC } from "../lib/music";
import { MAX_PHOTOS, MIN_PHOTOS } from "../lib/make";
import { clearDraft, newId, readDraft, readProfile, writeDraft, writeProfile, type Car, type Style } from "../lib/store";
import { ct, rd } from "../lib/site";
import { guard, guardText } from "@kit/text-guard";

const emit = defineEmits<{ go: [view: string, id?: string]; toast: [t: string] }>();
const step = ref<1 | 2>(1);
const car = reactive<Car>({ maker: "", model: "", year: "", price: "", mileage: "", color: "", url: "" });
const note = ref("");
const style = reactive<Style>({ template: "reels", music: "drive", seconds: 20 });
const profile = reactive(readProfile());
const photos = ref<{ blob: Blob; url: string }[]>([]);
const over = ref(false);
const busy = ref(false);
const tried = ref(false);
const fileEl = ref<HTMLInputElement | null>(null);
const logoEl = ref<HTMLInputElement | null>(null);
const draftRestored = ref(false);
const draftSavedAt = ref(0);
let draftTimer = 0;

const need1 = computed(() => !car.maker.trim() || !car.model.trim());
const issues = computed(() => guard([["요청사항", note.value], ["색상", car.color], ["판매자 이름", profile.name], ["상사", profile.company], ["전화", profile.phone]]));

const next = () => {
  tried.value = true;
  if (need1.value) return emit("toast", "제조사와 모델은 꼭 적어 주세요");
  tried.value = false;
  step.value = 2;
  window.scrollTo({ top: 0 });
};

/** 사진은 고치지 않는다. 긴 변 1920으로 줄이기만 한다(폰 메모리 · 저장 공간 보호) */
async function shrink(file: File): Promise<Blob | null> {
  try {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, 1920 / Math.max(bmp.width, bmp.height));
    if (s === 1 && /jpe?g|png|webp/.test(file.type)) return file;
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * s);
    c.height = Math.round(bmp.height * s);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close();
    return await new Promise((r) => c.toBlob(r, "image/jpeg", 0.9));
  } catch {
    return null;
  }
}

async function add(files: FileList | File[] | null) {
  if (!files) return;
  const source = Array.from(files);
  const list = source.filter((f) => (f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name)) && f.size <= 30 * 1024 * 1024);
  const rejected = source.length - list.length;
  if (rejected) emit("toast", `${rejected}장은 지원하지 않거나 30MB를 넘어서 제외했어요`);
  const room = MAX_PHOTOS - photos.value.length;
  if (list.length > room) emit("toast", `사진은 최대 ${MAX_PHOTOS}장이에요 · ${Math.max(0, room)}장만 넣었어요`);
  let bad = 0;
  for (const f of list.slice(0, Math.max(0, room))) {
    const b = await shrink(f);
    if (b) photos.value.push({ blob: b, url: URL.createObjectURL(b) });
    else bad += 1;
  }
  if (bad) emit("toast", `${bad}장은 열지 못했어요 · JPG · PNG로 올려 주세요`);
}
const onPick = (e: Event) => {
  void add((e.target as HTMLInputElement).files);
  (e.target as HTMLInputElement).value = "";
};
const onDrop = (e: DragEvent) => {
  over.value = false;
  void add(e.dataTransfer?.files ?? null);
};
const remove = (i: number) => {
  URL.revokeObjectURL(photos.value[i]!.url);
  photos.value.splice(i, 1);
};
const toFront = (i: number) => {
  const [p] = photos.value.splice(i, 1);
  photos.value.unshift(p!);
};
const move = (i: number, delta: -1 | 1) => {
  const target = i + delta;
  if (target < 0 || target >= photos.value.length) return;
  const [p] = photos.value.splice(i, 1);
  photos.value.splice(target, 0, p!);
};

function draftPayload() {
  return {
    car: { ...car },
    note: note.value,
    style: { ...style },
    profile: { ...profile },
    savedAt: Date.now(),
  };
}
function scheduleDraftSave() {
  window.clearTimeout(draftTimer);
  draftTimer = window.setTimeout(() => {
    const draft = draftPayload();
    writeDraft(state.owner, draft);
    draftSavedAt.value = draft.savedAt;
  }, 350);
}
function resetDraft() {
  if (!window.confirm("작성 중인 차량 정보와 설정을 초기화할까요? 올린 사진도 모두 빠집니다.")) return;
  Object.assign(car, { maker: "", model: "", year: "", price: "", mileage: "", color: "", url: "" });
  note.value = "";
  Object.assign(style, { template: "reels", music: "drive", seconds: 20 });
  photos.value.forEach((p) => URL.revokeObjectURL(p.url));
  photos.value = [];
  clearDraft(state.owner);
  draftSavedAt.value = 0;
  draftRestored.value = false;
  step.value = 1;
}

onMounted(() => {
  const draft = readDraft(state.owner);
  if (!draft) return;
  Object.assign(car, draft.car);
  note.value = draft.note;
  Object.assign(style, draft.style);
  Object.assign(profile, draft.profile);
  draftSavedAt.value = draft.savedAt;
  draftRestored.value = true;
});
watch(() => ({ car: { ...car }, note: note.value, style: { ...style }, profile: { ...profile } }), scheduleDraftSave, { deep: true });
onBeforeUnmount(() => {
  window.clearTimeout(draftTimer);
  photos.value.forEach((p) => URL.revokeObjectURL(p.url));
});

async function onLogo(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  (e.target as HTMLInputElement).value = "";
  if (!f) return;
  try {
    const bmp = await createImageBitmap(f);
    const s = Math.min(1, 300 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * s);
    c.height = Math.round(bmp.height * s);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    profile.logo = c.toDataURL("image/png");
  } catch {
    emit("toast", "로고를 열지 못했어요 · PNG · JPG로 올려 주세요");
  }
}

async function send() {
  tried.value = true;
  if (photos.value.length < MIN_PHOTOS) return;
  if (need1.value) return emit("toast", "제조사와 모델은 꼭 적어 주세요");
  if (issues.value.length) return emit("toast", guardText(issues.value[0]!));
  if (state.credits < 1) return emit("go", "pricing");
  const bytes = photos.value.reduce((sum, p) => sum + p.blob.size, 0);
  try {
    const estimate = await navigator.storage?.estimate?.();
    if (estimate?.quota && estimate.usage != null && estimate.usage + bytes * 5 > estimate.quota * 0.95) {
      return emit("toast", "저장 공간이 부족해요. 오래된 영상을 지운 뒤 다시 시도해 주세요");
    }
    await navigator.storage?.persist?.();
  } catch {
    /* 일부 브라우저는 저장 공간 API를 제공하지 않는다. 실제 저장 시 다시 검증한다. */
  }
  busy.value = true;
  writeProfile({ ...profile });
  const id = newId();
  try {
    await submit({ id, createdAt: Date.now(), car: { ...car }, note: note.value.trim(), photos: photos.value.map((p) => p.blob), style: { ...style }, status: "queued", progress: 0, outputs: [] });
    clearDraft(state.owner);
    emit("go", "order", id);
  } catch (e) {
    emit("toast", e instanceof Error ? e.message : "주문을 보내지 못했어요");
  } finally {
    busy.value = false;
  }
}
const TEMPLATES: { id: Style["template"]; label: string; desc: string }[] = [
  { id: "reels", label: "릴스형", desc: "사진을 꽉 채우고 큰 자막" },
  { id: "card", label: "매물 카드형", desc: "사진을 자르지 않고 정보 띠" },
  { id: "band", label: "가로 사진 띠형", desc: "가로 사진 그대로 · 위아래 정보" },
];
</script>
<template>
  <div class="sf-wrap" :style="{ maxWidth: '720px' }">
    <div v-if="state.loaded && state.credits < 1" class="card sf-empty">
      <span class="ico-wrap"><Icon :src="ct('chotot-common-bag')" /></span>
      <h2>크레딧이 없어요</h2>
      <p>크레딧을 사면 영상을 주문할 수 있어요.</p>
      <button class="btn is-main" type="button" @click="emit('go', 'pricing')">크레딧 구매</button>
    </div>
    <form v-else-if="step === 1" class="card sf-form" novalidate @submit.prevent="next">
      <div class="sf-step">
        <div>
          <h2>차량 정보</h2>
          <p>적은 내용이 영상 자막과 끝 장면에 들어가요.</p>
        </div>
        <span class="sf-pill">1/2단계</span>
      </div>
      <div class="sf-grid">
        <div class="sf-field"><label for="f-maker">제조사 *</label><input id="f-maker" v-model="car.maker" placeholder="예: 현대" autocomplete="off" :aria-invalid="tried && !car.maker.trim()" /></div>
        <div class="sf-field"><label for="f-model">모델 *</label><input id="f-model" v-model="car.model" placeholder="예: 그랜저 GN7" autocomplete="off" :aria-invalid="tried && !car.model.trim()" /></div>
        <div class="sf-field"><label for="f-year">연식</label><input id="f-year" v-model="car.year" inputmode="numeric" placeholder="예: 2023" /></div>
        <div class="sf-field"><label for="f-price">가격(만원)</label><input id="f-price" v-model="car.price" inputmode="numeric" placeholder="예: 3890" /></div>
        <div class="sf-field"><label for="f-km">주행거리(km)</label><input id="f-km" v-model="car.mileage" inputmode="numeric" placeholder="예: 32000" /></div>
        <div class="sf-field"><label for="f-color">색상</label><input id="f-color" v-model="car.color" placeholder="예: 블랙 펄" /></div>
        <div class="sf-field is-wide"><label for="f-url">매물 주소(선택)</label><input id="f-url" v-model="car.url" type="url" inputmode="url" placeholder="https://www.bobaedream.co.kr/..." /></div>
      </div>
      <div class="sf-draft-row">
        <span>{{ draftRestored ? "이전에 작성하던 내용을 불러왔어요" : draftSavedAt ? "작성 내용 자동 저장됨" : "입력 내용은 이 기기에 자동 저장됩니다" }}</span>
        <button class="btn is-sm" type="button" @click="resetDraft">초기화</button>
      </div>
      <p v-if="tried && need1" class="sf-hint" role="alert" :style="{ color: 'var(--bad)' }">제조사와 모델은 꼭 적어 주세요</p>
      <div class="sf-actions">
        <span class="grow" />
        <button class="btn is-main" type="submit" :disabled="need1">다음: 사진 올리기 <Icon :src="rd('forward-outline')" /></button>
      </div>
    </form>
    <div v-else class="card sf-form">
      <div class="sf-step">
        <div>
          <h2>사진 올리기</h2>
          <p>{{ MIN_PHOTOS }}장 이상 · 추천 8~12장 · 최대 {{ MAX_PHOTOS }}장. 첫 사진이 대표예요.</p>
        </div>
        <span class="sf-pill">2/2단계</span>
      </div>
      <div
        :class="`sf-drop ${over ? 'is-over' : ''}`"
        role="button"
        tabindex="0"
        @click="fileEl?.click()"
        @keydown.enter.prevent="fileEl?.click()"
        @keydown.space.prevent="fileEl?.click()"
        @dragover.prevent="over = true"
        @dragleave="over = false"
        @drop.prevent="onDrop"
      >
        <Icon :src="rd('image-post-outline')" />
        <b>사진을 끌어다 놓거나 눌러서 고르세요</b>
        <span>JPG · PNG · WebP · HEIC(기기 지원 시) · 장당 30MB · 최대 {{ MAX_PHOTOS }}장</span>
      </div>
      <p class="sf-count">{{ photos.length }} / {{ MAX_PHOTOS }}장</p>
      <input ref="fileEl" type="file" accept="image/*" multiple hidden @change="onPick" />
      <div v-if="photos.length" class="sf-thumbs">
        <div v-for="(p, i) in photos" :key="p.url" class="sf-thumb">
          <img :src="p.url" :alt="`${i + 1}번째 사진`" />
          <span :class="`n ${i === 0 ? 'is-cover' : ''}`">{{ i === 0 ? "대표" : i + 1 }}</span>
          <span class="ord">
            <button type="button" :disabled="i === 0" :aria-label="`${i + 1}번째 사진을 앞으로`" @click="move(i, -1)">←</button>
            <button type="button" :disabled="i === photos.length - 1" :aria-label="`${i + 1}번째 사진을 뒤로`" @click="move(i, 1)">→</button>
          </span>
          <button v-if="i > 0" class="mv" type="button" :aria-label="`${i + 1}번째 사진을 대표로`" @click="toFront(i)">대표로</button>
          <button class="x" type="button" :aria-label="`${i + 1}번째 사진 빼기`" @click="remove(i)"><Icon :src="rd('close-outline')" /></button>
        </div>
      </div>
      <p v-if="photos.length > 0 && photos.length < MIN_PHOTOS" class="sf-warn" role="alert">사진을 {{ MIN_PHOTOS }}장 이상 올려 주세요</p>
      <p class="sf-hint">사진은 고치지 않아요. 자르기 · 천천히 움직이기만 해요. 번호판은 촬영할 때 가려 주세요.</p>

      <div class="sf-sect">
        <div class="sf-field">
          <label for="f-note">강조할 점(선택) · 쉼표로 나누면 한 컷에 하나씩 자막이 돼요</label>
          <textarea id="f-note" v-model="note" placeholder="예: 파노라마 선루프, 겨울 타이어 포함, 1인 신조" />
        </div>
        <div>
          <span class="sf-label">영상 틀</span>
          <div class="sf-choice" role="radiogroup" aria-label="영상 틀" :style="{ marginTop: '8px' }">
            <button v-for="t in TEMPLATES" :key="t.id" type="button" role="radio" :aria-checked="style.template === t.id" @click="style.template = t.id">{{ t.label }}<small>{{ t.desc }}</small></button>
          </div>
        </div>
        <div>
          <span class="sf-label">음악 · 박자에 맞춰 사진이 넘어가요</span>
          <div class="sf-choice" role="radiogroup" aria-label="음악" :style="{ marginTop: '8px' }">
            <button v-for="m in MUSIC" :key="m.id" type="button" role="radio" :aria-checked="style.music === m.id" @click="style.music = m.id">{{ m.label }}<small>{{ m.desc }}</small></button>
          </div>
        </div>
        <div>
          <span class="sf-label">길이</span>
          <div class="sf-choice" role="radiogroup" aria-label="길이" :style="{ marginTop: '8px' }">
            <button v-for="s in [15, 20, 30] as const" :key="s" type="button" role="radio" :aria-checked="style.seconds === s" @click="style.seconds = s">{{ s }}초</button>
          </div>
        </div>
      </div>

      <div class="sf-sect">
        <h3>판매자 정보 · 끝 장면</h3>
        <div class="sf-grid">
          <div class="sf-field"><label for="f-name">딜러 이름</label><input id="f-name" v-model="profile.name" placeholder="예: 김보배" /></div>
          <div class="sf-field"><label for="f-co">상사</label><input id="f-co" v-model="profile.company" placeholder="예: 보배모터스" /></div>
          <div class="sf-field is-wide"><label for="f-tel">안심번호(050)</label><input id="f-tel" v-model="profile.phone" inputmode="tel" placeholder="예: 0507-1234-5678" /></div>
        </div>
        <div class="sf-logo">
          <img v-if="profile.logo" :src="profile.logo" alt="내 로고" />
          <button class="btn is-sm" type="button" @click="logoEl?.click()">{{ profile.logo ? "로고 바꾸기" : "로고 올리기" }}</button>
          <button v-if="profile.logo" class="btn is-sm" type="button" @click="profile.logo = null">로고 빼기</button>
          <input ref="logoEl" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden @change="onLogo" />
        </div>
        <p v-if="issues.length" class="sf-warn" role="alert">{{ guardText(issues[0]!) }}</p>
      </div>

      <div class="sf-actions">
        <button class="btn" type="button" @click="step = 1"><Icon :src="rd('back-outline-24')" />이전</button>
        <button class="btn is-main" type="button" :disabled="busy || photos.length < MIN_PHOTOS" @click="send">{{ busy ? "보내는 중…" : "주문 보내기(1크레딧)" }}</button>
      </div>
    </div>
  </div>
</template>
