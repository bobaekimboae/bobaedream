<!--
  PhotoPreview — 사진 미리보기·편집(번호판 가리기 · 모자이크 · 회전 · 자르기 · 빼기 · 다시 올리기)
  props:
    photos: Photo[]
    startId: string
  emits:
    close()                         (원본 onClose)
    done(next: Photo[])             (원본 onDone)
    addMore(saved?: Photo[])        (원본 onAddMore. 키트(PLUS)는 지금까지 고친 사진을 굽고 넘긴다, 58은 인자 없음)
  ※ photos · startId는 처음 열 때 한 번만 읽는다(원본 useState 초기값과 같음).
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Mask from "./Mask.vue";
import StickerBox from "./StickerBox.vue";
import EditorScreen from "./EditorScreen.vue";
import { rd } from "../../lib/site";
import { OTHER, PLUS, plateLocked, type Photo } from "../../lib/core";
import { itemLabel } from "../../lib/items";
import { bakeSticker, defaultSticker, normalizeFile, type Sticker } from "../../lib/image-ops";
import { useBox } from "../../composables/useBox";
import { useFit } from "../../composables/useFit";
import { useLayerEsc } from "../../composables/useLayerEsc";

// ── 사진 미리보기·편집 ─────────────────────────────────
type EditTool = null | "mosaic" | "rotate" | "crop";

const props = defineProps<{ photos: Photo[]; startId: string }>();
const emit = defineEmits<{ close: []; done: [next: Photo[]]; addMore: [saved?: Photo[]]; notify: [t: string] }>();

const draft = ref<(Photo & { removed?: boolean })[]>(props.photos.map((p) => (p.raw && p.sticker ? { ...p, src: p.raw } : { ...p })));
const cur = ref(Math.max(0, props.photos.findIndex((p) => p.id === props.startId)));
const tool = ref<EditTool>(null);
const { el: stageEl, box } = useBox<HTMLDivElement>();
const photo = computed(() => draft.value[cur.value]);
const fit = useFit(() => photo.value?.src ?? "", box);
const busy = ref(false);
const replaceEl = ref<HTMLInputElement | null>(null);
const layerEl = ref<HTMLDivElement | null>(null);
// 키트: Esc = 편집기가 열려 있으면 편집 취소, 아니면 닫기(2026-10-26 크로스체크)
useLayerEsc(layerEl, () => (tool.value ? (tool.value = null) : emit("close")), () => PLUS);
// 키트(2026-10-27): 아래 썸네일 줄도 번호판 가림을 그려 등록 화면 사진과 같아 보이게 한다(가림을 옮기면 잠시 뒤 따라 바뀜)
const stripThumbs = ref<Record<string, string>>({});
const thumbKey = computed(() => draft.value.map((p) => `${p.id}:${p.src.length}:${p.sticker?.visible ? `${p.sticker.cx},${p.sticker.cy},${p.sticker.w},${p.sticker.rot}` : ""}`).join("|"));
watch(
  thumbKey,
  (_k, _o, onCleanup) => {
    if (!PLUS) return;
    let alive = true;
    const list = draft.value;
    const t = window.setTimeout(() => {
      void Promise.all(list.map(async (p) => [p.id, p.sticker?.visible ? await bakeSticker(p.src, p.sticker, true) : p.src] as const)).then((r) => {
        if (alive) stripThumbs.value = Object.fromEntries(r);
      });
    }, 250);
    onCleanup(() => {
      alive = false;
      window.clearTimeout(t);
    });
  },
  { immediate: true },
);

const patch = (p: Partial<Photo & { removed: boolean }>) => {
  const at = cur.value;
  draft.value = draft.value.map((x, i) => (i === at ? { ...x, ...p } : x));
};

const commit = async (then?: (out: Photo[]) => void) => {
  busy.value = true;
  const out: Photo[] = [];
  for (const p of draft.value) {
    if (p.removed) continue;
    const src = await bakeSticker(p.src, p.sticker, PLUS);
    // 키트: 가림을 굽기 전 원본과 가림 위치를 남겨 다시 열면 옮길 수 있다(58은 구운 사진만 남긴다)
    const keep = PLUS && p.sticker?.visible ? { raw: p.src, sticker: p.sticker } : {};
    out.push({ id: p.id, src, slot: p.slot, uploading: p.uploading, fromAlbum: p.fromAlbum, ...keep });
  }
  busy.value = false;
  (then ?? ((o: Photo[]) => emit("done", o)))(out);
};

const showPlate = () => {
  // 한 장에 스티커 하나. 지운 뒤 다시 누르면 마지막 위치·크기·각도 그대로 돌아온다(58 확인).
  const ph = photo.value!;
  // 대표 칸(첫 칸)은 번호판이 보여야 한다(2026-10-29 후속 ④ 결정)
  if (plateLocked(ph.slot)) return emit("notify", "대표 사진은 번호판이 보여야 해요 · 다른 각도에서 가릴 수 있어요");
  patch({ sticker: ph.sticker ? { ...ph.sticker, visible: true } : defaultSticker() });
};

const replace = async (files: FileList | null) => {
  const f = files?.[0];
  if (!f) return;
  try {
    patch({ src: await normalizeFile(f), removed: false, sticker: undefined });
  } catch {
    // 못 여는 사진(HEIC 등)은 바꾸지 않는다
  }
};

const onEditorSave = (src: string) => {
  // 모양이 바뀌는 편집(회전·자르기) 뒤에는 스티커를 가운데로 되돌린다.
  const ph = photo.value!;
  patch({ src, sticker: tool.value === "mosaic" ? ph.sticker : ph.sticker ? { ...defaultSticker(), visible: ph.sticker.visible } : undefined });
  tool.value = null;
};
const onAddMoreClick = () => (PLUS ? void commit((out) => emit("addMore", out)) : emit("addMore"));
const redoAt = (i: number) => {
  cur.value = i;
  replaceEl.value?.click();
};
const removeAt = (i: number) => {
  draft.value = draft.value.map((x, k) => (k === i ? { ...x, removed: true } : x));
};
const onSticker = (s: Sticker) => patch({ sticker: s });
const onReplaceChange = (e: Event) => void replace((e.target as HTMLInputElement).files);
</script>
<template>
  <template v-if="photo">
    <EditorScreen v-if="tool" :tool="tool" :src="photo.src" @cancel="tool = null" @save="onEditorSave" />
    <div ref="layerEl" class="shoot-layer shoot-preview" :hidden="Boolean(tool)">
      <header class="shoot-top">
        <button type="button" class="shoot-icon-btn" aria-label="닫기" @click="emit('close')"><Mask :src="rd('close-outline')" /></button>
        <h2>사진 미리보기({{ cur + 1 }})</h2>
        <span class="shoot-icon-btn" />
      </header>
      <div ref="stageEl" class="shoot-stage">
        <div class="shoot-stage-img" :style="{ width: `${fit.w}px`, height: `${fit.h}px` }">
          <img :src="photo.src" alt="" draggable="false" />
          <StickerBox v-if="photo.sticker?.visible" :sticker="photo.sticker" :frame="fit" @change="onSticker" />
        </div>
      </div>
      <div class="shoot-strip">
        <button type="button" class="shoot-strip__add" aria-label="사진 더 추가" :disabled="busy" @click="onAddMoreClick"><Mask :src="rd('add-outline-24')" /></button>
        <template v-for="(p, i) in draft" :key="p.id">
          <button v-if="p.removed" type="button" :class="`shoot-strip__redo ${i === cur ? 'is-sel' : ''}`" @click="redoAt(i)"><Mask :src="rd('camera-outline-24')" />다시 올리기<br />{{ p.slot === OTHER ? "차량" : itemLabel(p.slot) }}</button>
          <div v-else :class="`shoot-strip__item ${i === cur ? 'is-sel' : ''}`">
            <button type="button" class="shoot-strip__hit" :aria-label="`${itemLabel(p.slot)} 사진 보기`" @click="cur = i"><img :src="stripThumbs[p.id] ?? p.src" alt="" /><span>{{ itemLabel(p.slot) }}</span></button>
            <button type="button" class="shoot-strip__x" aria-label="이 사진 빼기" @click="removeAt(i)"><Mask :src="rd('close-outline')" /></button>
          </div>
        </template>
      </div>
      <input ref="replaceEl" type="file" accept="image/*" hidden @change="onReplaceChange" />
      <footer class="shoot-tools">
        <button type="button" :class="`is-accent ${photo && plateLocked(photo.slot) ? 'is-locked' : ''}`" :aria-disabled="photo ? plateLocked(photo.slot) : false" :title="photo && plateLocked(photo.slot) ? '대표 사진은 번호판이 보여야 해요' : undefined" @click="showPlate"><span class="shoot-plate__ico is-accent" aria-hidden="true"><i /><i /></span>번호판 가리기</button>
        <button type="button" @click="tool = 'mosaic'"><Mask :src="rd('view-grid-outline')" cls="is-ring" />모자이크</button>
        <button type="button" @click="tool = 'rotate'"><Mask :src="rd('rotate-image-outline')" />회전</button>
        <button type="button" @click="tool = 'crop'"><Mask :src="rd('crop-outline')" />자르기</button>
        <button type="button" class="shoot-done" :disabled="busy" @click="void commit()">완료</button>
      </footer>
    </div>
  </template>
</template>
