<script setup lang="ts">
// ── 사진 촬영 + 앨범 ───────────────────────────────────
// 원본: src/prototype/register/shoot-kit/ShootRegister.tsx PhotoCapture
//
// props
//   existing: Photo[]            이미 메인(등록 화면)에 있는 사진
//   startMode: "cam" | "album"   처음 열 화면
// emits
//   close  ()                    닫기(찍은 사진 없음 · 「버리고 나가기」 · 권한 화면 닫기)
//   done   (added: Photo[])      완료: 이번에 고른 사진(고른 순서)
//   notify (t: string)           알림(토스트) 문구
// CamSession 형식은 lib/photo-capture.ts 에 있다.
import { computed, onBeforeUnmount, ref, watch } from "vue";
import Mask from "./Mask.vue";
import Confirm from "./Confirm.vue";
import ModeTabs from "./ModeTabs.vue";
import LiveVideo from "./LiveVideo.vue";
import FlashToggle from "./FlashToggle.vue";
import PhotoCounter from "./PhotoCounter.vue";
import NoCam from "./NoCam.vue";
import CamPermission from "./CamPermission.vue";
import ShotGuide from "./ShotGuide.vue";
import { useCamera } from "../../composables/useCamera";
import { useSwipe } from "../../composables/useSwipe";
import { grabFrame } from "../../lib/camera";
import { normalizeFile, placeholderShot } from "../../lib/image-ops";
import { playShutter } from "../../lib/sound";
import { ALLOW_FAKE, ENFORCE, MAX_PHOTOS, OTHER, PHOTO_SLOTS, PLUS, reqLabel, uid, type Photo } from "../../lib/core";
import { REQUIRED_IDS, isRequiredItem, itemLabel, itemOf } from "../../lib/items";
import { rd } from "../../lib/site";
import { GUIDE_ON, type CamSession } from "../../lib/photo-capture";

const props = defineProps<{ existing: Photo[]; startMode: "cam" | "album" }>();
const emit = defineEmits<{ close: []; done: [added: Photo[]]; notify: [t: string] }>();
const notify = (t: string) => emit("notify", t);

const mode = ref<"cam" | "album">(props.startMode);
const { stream, error, torchSupported, retry, setTorch } = useCamera(
  () => mode.value === "cam",
  () => false,
);
// 실기 대비(2026-10-27): 5초가 지나도 카메라 화면이 안 뜨면 안내 화면으로(영상 화면과 같게)
const camSlow = ref(false);
watch(
  [mode, stream, error],
  (_v, _o, onCleanup) => {
    camSlow.value = false;
    if (!PLUS || mode.value !== "cam" || stream.value || error.value) return;
    const t = window.setTimeout(() => (camSlow.value = true), 5000);
    onCleanup(() => window.clearTimeout(t));
  },
  { immediate: true },
);
// 찍은 사진이 있으면 닫기 전에 묻는다(영상과 같게)
const askClose = ref(false);
const flash = ref(false);
// 실기 대비: 다시 그릴 때마다 플래시 설정을 보내지 않게, 플래시·지원 여부가 바뀔 때만
watch(
  [flash, torchSupported, stream],
  () => {
    if (torchSupported.value) setTorch(flash.value);
  },
  { immediate: true },
);
const videoRef = ref<HTMLDivElement | null>(null);
// 2026-10-25 컨설팅 6건: 번호판 가리기는 켜짐이 기본(58 원본 재현은 꺼짐)
const plate = ref(PLUS);
const guide = ref(GUIDE_ON);
const session = ref<CamSession>({ shots: [], picked: [], imported: [] });
// 이미 채운 각도는 레일에서 빠진다(다시 열면 「정면」부터 시작 확인). 처음 상태로만 쓴다(원본 useState 초기값).
const initialRail = (() => {
  const filledByMain = new Set(props.existing.map((p) => p.slot));
  const names: string[] = [];
  let otherSkip = props.existing.filter((p) => p.slot === OTHER).length;
  for (const s of PHOTO_SLOTS) {
    if (s === OTHER) {
      if (otherSkip > 0) {
        otherSkip -= 1;
        continue;
      }
      names.push(s);
    } else if (!filledByMain.has(s)) names.push(s);
  }
  return names;
})();
const rail = ref<string[]>(initialRail);
const slotShots = ref<(Photo | null)[]>(initialRail.map(() => null));
// 키트: 처음 고른 칸 = 아직 안 찍은 필수 칸(부위 나누기에서 「빠진 칸 바로 찍기」로 들어온 경우 포함)
const sel = ref(
  (() => {
    if (!PLUS) return 0;
    const i = initialRail.findIndex((s) => isRequiredItem(s));
    return i < 0 ? 0 : i;
  })(),
);
// 연속 촬영에서도 최신 값을 읽는다: Vue의 ref 값은 바로 바뀌므로 원본의 slotShotsRef · railRef · selRef · pickedRef 대신 .value를 그대로 읽는다.
const railEl = ref<HTMLDivElement | null>(null);
const fileRef = ref<HTMLInputElement | null>(null);
const total = computed(() => props.existing.length + session.value.picked.length);
// 필수 칸 채움 수: 메인에 이미 있는 사진 + 이번에 찍어 고른 사진의 필수 항목(중복 제외)
const requiredNow = computed(() => {
  const picked = new Set(session.value.picked);
  const got = new Set([...props.existing, ...session.value.shots.filter((p) => picked.has(p.id))].map((p) => p.slot).filter(isRequiredItem));
  return got.size;
});
const swipe = useSwipe(
  () => (mode.value = "album"),
  () => (mode.value = "cam"),
);

watch(
  sel,
  (s) => {
    const el = railEl.value?.querySelector<HTMLElement>(`[data-i="${s}"]`);
    el?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  },
  { immediate: true, flush: "post" },
);
// 칸 줄 오른쪽 밖에 남은 필수 빈 칸 수(「+N」 표시). 누르면 그 칸으로 이동한다.
const hiddenReq = ref<number[]>([]);
watch(
  [rail, slotShots, mode],
  (_v, _o, onCleanup) => {
    const el = railEl.value;
    if (!el) return;
    const measure = () => {
      const right = el.getBoundingClientRect().right;
      const out: number[] = [];
      el.querySelectorAll<HTMLElement>(".shoot-slot.is-required:not(.is-shot)").forEach((n) => {
        if (n.getBoundingClientRect().right > right + 1) out.push(Number(n.dataset.i));
      });
      if (hiddenReq.value.join() !== out.join()) hiddenReq.value = out;
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    onCleanup(() => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    });
  },
  { immediate: true, flush: "post" },
);

const shotPicked = (p: Photo | null | undefined) => Boolean(p && session.value.picked.includes(p.id));
/** 30장이 차서 지금 칸에 새로 찍을 수 없는지(지금 칸 사진을 다시 찍는 것은 허용) */
const atCap = computed(() => PLUS && total.value >= MAX_PHOTOS && !shotPicked(slotShots.value[sel.value]));

const shoot = () => {
  const prev = slotShots.value[sel.value];
  const isReplace = Boolean(prev && session.value.picked.includes(prev.id));
  if (!isReplace && props.existing.length + session.value.picked.length >= MAX_PHOTOS) {
    notify(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요`);
    return;
  }
  const video = videoRef.value?.querySelector("video");
  // 빠른 연속 촬영(2026-10-26 크로스체크): 칸 이름도 최신 값으로 읽어 사진과 칸이 어긋나지 않게
  const label = rail.value[sel.value] ?? OTHER;
  const real = video && stream.value ? grabFrame(video) : null;
  if (!real && !ALLOW_FAKE) {
    notify("카메라 화면이 뜨면 찍을 수 있어요");
    return;
  }
  const src = real || placeholderShot(itemLabel(label), session.value.shots.length + props.existing.length);
  playShutter();
  const shot: Photo = { id: uid(), src, slot: label, plateOn: plate.value };
  const cur = sel.value;
  const next = [...slotShots.value];
  const replaced = cur < next.length ? next[cur] : null;
  if (cur >= next.length) next.push(shot);
  else next[cur] = shot;
  // 같은 칸을 다시 찍으면 앞 사진은 이번 선택에서 뺀다(앨범에는 남김) — 같은 칸 사진이 두 장 올라가지 않게
  const s = session.value;
  session.value = { ...s, shots: [shot, ...s.shots], picked: [...s.picked.filter((id) => id !== replaced?.id), shot.id] };
  // 다음 빈 칸으로. 빈 칸이 없으면 「기타」 칸을 하나 더 만든다.
  // 키트(2026-10-25 컨설팅 6건): 필수 칸이 남았으면 그 칸부터 채운다(필수 4장을 먼저 끝내게).
  const railNow = rail.value;
  const reqEmpty = (i: number) => !next[i] && i < railNow.length && isRequiredItem(railNow[i]) && !props.existing.some((e) => e.slot === railNow[i]);
  // 2026-10-25 강제를 끈 뒤에는 건너뛰지 않고 칸 줄 순서(차를 도는 순서)대로 간다.
  const jumpReq = PLUS && ENFORCE;
  let n = jumpReq ? next.findIndex((_, i) => i > cur && reqEmpty(i)) : -1;
  if (jumpReq && n < 0) n = next.findIndex((_, i) => reqEmpty(i));
  if (n < 0) n = next.findIndex((p, i) => !p && i > cur);
  if (n < 0) n = next.findIndex((p) => !p);
  if (n < 0) {
    n = next.length;
    next.push(null);
    rail.value = [...railNow, OTHER];
  }
  slotShots.value = next;
  sel.value = n;
};

const removeSlotShot = (i: number) => {
  const shot = slotShots.value[i];
  if (!shot) return;
  slotShots.value = slotShots.value.map((p, k) => (k === i ? null : p));
  const s = session.value;
  session.value = { ...s, shots: s.shots.filter((p) => p.id !== shot.id), picked: s.picked.filter((id) => id !== shot.id) };
  sel.value = i;
};

const albumItems = computed(() => [...session.value.shots, ...session.value.imported]);
const togglePick = (id: string) => {
  const s = session.value;
  if (s.picked.includes(id)) {
    session.value = { ...s, picked: s.picked.filter((x) => x !== id) };
    return;
  }
  if (props.existing.length + s.picked.length >= MAX_PHOTOS) {
    notify(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요`);
    return;
  }
  session.value = { ...s, picked: [...s.picked, id] };
};

let alive = true;
onBeforeUnmount(() => (alive = false));
const importFiles = async (files: FileList | null) => {
  if (!files?.length) return;
  // 2026-10-27 실기 대비: 한 장씩 처리하고(메모리), 못 여는 사진(HEIC 등)만 건너뛰고 몇 장인지 알린다.
  const photos: Photo[] = [];
  let failed = 0;
  for (const f of Array.from(files)) {
    try {
      photos.push({ id: uid(), src: await normalizeFile(f), slot: OTHER, fromAlbum: true });
    } catch {
      failed += 1;
    }
  }
  if (failed) notify(`${failed}장은 열 수 없는 사진이라 빼고 불러왔어요`);
  if (!photos.length || !alive) return;
  const s = session.value;
  const room = MAX_PHOTOS - props.existing.length - s.picked.length;
  if (photos.length > room) notify(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요`);
  session.value = { ...s, imported: [...photos, ...s.imported], picked: [...s.picked, ...photos.slice(0, Math.max(0, room)).map((p) => p.id)] };
};

const done = () => {
  const byId = new Map(albumItems.value.map((p) => [p.id, p]));
  emit(
    "done",
    session.value.picked.map((id) => byId.get(id)).filter((p): p is Photo => Boolean(p)),
  );
};

const onClickClose = () => (PLUS && session.value.picked.length ? (askClose.value = true) : emit("close"));
const curSlot = computed(() => rail.value[sel.value] ?? OTHER);
/** 칸에 보일 사진: 앨범에서 선택을 푼 사진은 칸에서도 빈 칸으로 보인다(2026-10-27 코드 검토) */
const slotShot = (i: number) => (shotPicked(slotShots.value[i]) ? slotShots.value[i] : null);
</script>

<template>
  <div class="shoot-layer shoot-capture" v-on="swipe">
    <div class="shoot-rotate-hint" role="status"><Mask :src="rd('rotate-image-outline')" />휴대폰을 세로로 들어 주세요</div>
    <header class="shoot-top">
      <button type="button" class="shoot-icon-btn" aria-label="닫기" @click="onClickClose">
        <Mask :src="rd('close-outline')" />
      </button>
      <h2 v-if="mode === 'cam'">사진 촬영</h2>
      <h2 v-else class="shoot-album-title">내 앨범 <Mask :src="rd('caret-down-fill')" cls="is-caret" /></h2>
      <!-- 2026-10-25: 빈 자리에 영상 화면과 같은 플래시 버튼. 윤곽선 시안(?guide=on)에서는 그 왼쪽에 켜고 끄는 버튼을 함께 둔다. -->
      <span v-if="mode === 'cam'" class="shoot-top__right">
        <button v-if="GUIDE_ON" type="button" :class="`shoot-guide-toggle ${guide ? 'is-on' : ''}`" :aria-pressed="guide" @click="guide = !guide">윤곽선</button>
        <FlashToggle :on="flash" @toggle="flash = !flash" />
      </span>
      <span v-else class="shoot-icon-btn" />
    </header>

    <template v-if="mode === 'cam'">
      <div ref="videoRef" class="shoot-view">
        <LiveVideo v-if="stream" :stream="stream" />
        <NoCam v-else :denied="error === 'denied'" />
        <ShotGuide v-if="guide" :slot="curSlot" />
        <span class="shoot-pill">{{ `${itemLabel(curSlot)}${curSlot === OTHER ? " 사진" : ""} 촬영` }}</span>
        <!-- 첫 칸(대표 사진): 왼쪽 위 「대표」 딱지(JSON note). -->
        <div ref="railEl" class="shoot-rail">
          <div
            v-for="(_, i) in rail"
            :key="i"
            :data-i="i"
            :class="`shoot-slot ${i === sel ? 'is-sel' : ''} ${isRequiredItem(itemOf(rail[i]).id) ? 'is-required' : ''} ${slotShot(i) ? 'is-shot' : ''}`"
          >
            <button
              type="button"
              class="shoot-slot__hit"
              :aria-label="`${itemOf(rail[i]).label}${isRequiredItem(itemOf(rail[i]).id) ? ` (${reqLabel()})` : ''} 칸 선택`"
              @click="sel = i"
            >
              <img v-if="slotShot(i)" :src="slotShot(i)!.src" alt="" />
              <span class="shoot-slot__label">{{ itemOf(rail[i]).label }}</span>
            </button>
            <em v-if="itemOf(rail[i]).note && i === 0" class="shoot-slot__tag">{{ itemOf(rail[i]).note }}</em>
            <i v-if="isRequiredItem(itemOf(rail[i]).id) && !slotShot(i) && ENFORCE" class="shoot-slot__req" aria-hidden="true" />
            <button v-if="slotShot(i)" type="button" class="shoot-slot__x" :aria-label="`${itemOf(rail[i]).label} 사진 지우기`" @click="removeSlotShot(i)">
              <Mask :src="rd('close-outline')" />
            </button>
          </div>
        </div>
        <button
          v-if="hiddenReq.length && ENFORCE"
          type="button"
          class="shoot-rail-more"
          :aria-label="`오른쪽에 ${reqLabel()} 칸 ${hiddenReq.length}개 더 있어요`"
          @click="sel = hiddenReq[0]"
        >+{{ hiddenReq.length }}</button>
      </div>
      <div class="shoot-bottom">
        <div class="shoot-controls">
          <button type="button" :class="`shoot-plate ${plate ? 'is-on' : ''}`" :aria-pressed="plate" @click="plate = !plate">
            <span class="shoot-plate__ico" aria-hidden="true">
              <i />
              <i />
            </span>번호판 가리기
          </button>
          <button
            type="button"
            class="shoot-shutter"
            :aria-label="atCap ? `사진 찍기 (최대 ${MAX_PHOTOS}장이라 더 찍을 수 없어요)` : '사진 찍기'"
            :disabled="atCap"
            @click="shoot"
          >
            <span />
          </button>
          <div class="shoot-count">
            <PhotoCounter :required="requiredNow" :total="total" />
            <!-- 2026-10-25 컨설팅 6건: 한 장도 없으면 완료를 막고, 몇 장을 가져가는지 보여 준다(나눠 찍기는 허용) -->
            <button v-if="PLUS" type="button" class="shoot-done" :disabled="!session.picked.length" @click="done">완료{{ session.picked.length ? ` ${session.picked.length}장` : "" }}</button>
            <button v-else type="button" class="shoot-done" @click="done">완료</button>
          </div>
        </div>
        <ModeTabs :mode="mode" :labels="['촬영', '앨범']" @change="(m) => (mode = m)" />
      </div>
    </template>
    <template v-else>
      <div class="shoot-album-banner">우선 업로드 각도: {{ REQUIRED_IDS.map(itemLabel).join(" | ") }}</div>
      <div class="shoot-album-grid">
        <button type="button" class="shoot-album-import" @click="fileRef?.click()"><Mask :src="rd('image-post-outline')" />휴대폰 사진<br />불러오기</button>
        <button
          v-for="p in albumItems"
          :key="p.id"
          type="button"
          :class="`shoot-album-cell ${session.picked.includes(p.id) ? 'is-on' : ''}`"
          :aria-pressed="session.picked.includes(p.id)"
          @click="togglePick(p.id)"
        >
          <img :src="p.src" alt="" />
          <span class="shoot-album-check"><Mask v-if="session.picked.includes(p.id)" :src="rd('checkmark-fill')" /></span>
        </button>
      </div>
      <input ref="fileRef" type="file" accept="image/*" multiple hidden @change="(e) => void importFiles((e.target as HTMLInputElement).files)" />
      <div class="shoot-bottom is-album">
        <ModeTabs :mode="mode" :labels="['촬영', '앨범']" @change="(m) => (mode = m)" />
        <span class="shoot-album-count">
          <PhotoCounter :required="requiredNow" :total="total" />
        </span>
        <button v-if="session.picked.length" type="button" class="shoot-done shoot-album-done" @click="done">완료</button>
      </div>
    </template>
    <!-- 2026-10-26 크로스체크: 사진 화면도 권한을 거절하면 따로 된 안내 화면(대체 그림을 실제 사진처럼 올리지 않게) -->
    <Confirm
      v-if="askClose"
      :text="`찍은 사진 ${session.picked.length}장을 올리지 않고 나갈까요?`"
      cancel-text="계속 찍기"
      ok-text="버리고 나가기"
      @cancel="askClose = false"
      @ok="emit('close')"
    />
    <CamPermission
      v-if="PLUS && mode === 'cam' && !stream && (error || camSlow)"
      :kind="error === 'denied' ? 'denied' : 'unavailable'"
      what="photo"
      @retry="retry"
      @album="mode = 'album'"
      @close="emit('close')"
    />
  </div>
</template>
