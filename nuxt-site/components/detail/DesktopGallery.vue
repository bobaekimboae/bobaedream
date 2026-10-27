<script setup lang="ts">
// 리액트 DesktopGallery(detail/index.tsx). onBack → emit("back").
// 실매물은 그 매물의 사진 · 사진 수, 영상 표시는 영상이 있을 때만(시안 폴백만 벤틀리 24장 · 영상 표시).
import { ref, watch } from "vue";
import { asset, getActiveDetailCar } from "@proto/data";
import { useDetailUi } from "../../composables/detail/useDetailUi";
import Carousel from "../mobile/Carousel.vue";
import { detailPhotosOf, pcAsset } from "./detail-local";

const emit = defineEmits<{ back: [] }>();
const ui = useDetailUi();
const selected = ref(0);
const thumbs = ref<HTMLDivElement | null>(null);
const activeCar = getActiveDetailCar();
const isMock = !activeCar;
const photos = isMock ? Array.from({ length: 24 }, (_, i) => pcAsset(`9573-imgImage${i % 8 || ""}.png`)) : detailPhotosOf(activeCar);
const showPlay = isMock || !!activeCar?.filter?.video;
const ratio = activeCar?.imageAspectRatio;
const choose = (index: number) => { selected.value = (index + photos.length) % photos.length; };
watch(selected, (value) => {
  const rail = thumbs.value?.querySelector<HTMLElement>(".pc-thumbnails");
  const thumb = rail?.querySelector<HTMLElement>(`[data-photo="${value}"]`);
  if (rail && thumb) rail.scrollTo({ left: Math.max(0, thumb.offsetLeft - rail.clientWidth / 2 + 48), behavior: "smooth" });
}, { flush: "post" });
const share = async () => {
  try { await navigator.clipboard.writeText(window.location.href); ui.notify("공유 링크를 복사했어요"); }
  catch { ui.notify("주소창의 링크를 복사해 공유해 주세요."); }
};
const onKey = (event: KeyboardEvent) => { if (event.key === "ArrowRight") choose(selected.value + 1); if (event.key === "ArrowLeft") choose(selected.value - 1); };
</script>
<template>
  <section class="pc-gallery" aria-label="차량 사진">
    <div class="pc-hero" tabindex="0" @keydown="onKey">
      <img class="pc-hero-photo" :src="isMock && selected === 0 ? pcAsset('9550-imgFrame1000006297.png') : photos[selected]" :alt="`${isMock ? '벤틀리 ' : ''}차량 사진 ${selected + 1}`" :draggable="false" />
      <div class="pc-hero-tools"><button aria-label="목록으로 돌아가기" @click="emit('back')"><img :src="asset('detail/reddit-back.svg')" alt="" /></button><div><button aria-label="공유하기" @click="share"><img :src="asset('detail/autoscout24-share.svg')" alt="" /></button><button aria-label="더보기" @click="ui.setSheet('more')"><img :src="asset('detail/autoscout24-more-vertical.svg')" alt="" /></button></div></div>
      <span v-if="showPlay && selected === 0" class="pc-play" aria-hidden="true"><img :src="pcAsset('9550-imgMaskGroup.svg')" alt="" /><img :src="pcAsset('9550-imgFill7.svg')" alt="" /></span>
      <button class="pc-photo-prev" aria-label="이전 사진" @click="choose(selected - 1)"><img :src="pcAsset('9573-imgFrame1000006284.svg')" alt="" /></button>
      <button class="pc-photo-next" aria-label="다음 사진" @click="choose(selected + 1)"><img :src="pcAsset('9573-imgFrame1000006284.svg')" alt="" /></button>
      <span class="pc-photo-counter" aria-live="polite">{{ selected + 1 }}/{{ photos.length }}</span>
    </div>
    <div ref="thumbs" class="pc-thumbnail-region">
      <Carousel aria-label="차량 사진 썸네일" class-name="pc-thumbnails" content-class-name="pc-thumbnail-track">
        <button v-for="(src, i) in photos" :key="i" :data-photo="i" :aria-label="`사진 ${i + 1} 보기`" :aria-pressed="i === selected" :style="ratio ? { height: `${84 / ratio}px` } : undefined" @click="choose(i)"><img :src="src" alt="" :draggable="false" :style="ratio ? { height: '100%', objectFit: 'contain' } : undefined" /><span v-if="showPlay && i === 0" class="pc-thumb-play" aria-hidden="true"><img :src="pcAsset('9550-imgMaskGroup.svg')" alt="" /><img :src="pcAsset('9550-imgFill7.svg')" alt="" /></span></button>
      </Carousel>
      <button class="pc-rail-next" aria-label="다음 썸네일" @click="choose(selected + 1)"><img :src="pcAsset('9573-imgFrame1000006284.svg')" alt="" /></button>
    </div>
  </section>
</template>
