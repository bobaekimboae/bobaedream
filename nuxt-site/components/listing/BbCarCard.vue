<script setup lang="ts">
// 원본: src/prototype/listing/pc-bbmuseum.tsx BbCarCard
// 대응: onToggleLike → emit toggleLike · onOpen → emit open · onNotify → emit notify(원본도 쓰지 않음)
import { computed } from "vue";
import BbIcon from "./BbIcon.vue";
import { asset, displayListPlace, displaySpecs, sellerAvatar, sellerLabel, type Car } from "@proto/data";
import { thumbnailPostedText } from "@proto/listing/thumbnail-posted";

const props = defineProps<{ car: Car; liked: boolean }>();
const emit = defineEmits<{ toggleLike: []; open: []; notify: [message: string] }>();
const seller = computed(() => sellerLabel(props.car));
const badges = computed(() => props.car.badges ?? []);
const priceMatch = computed(() => props.car.price.match(/^(월\s*)?(.+?)\s*(만원)$/));
const specs = computed(() => [displaySpecs(props.car.specs.slice(0, 3)), props.car.filter?.transmission].filter(Boolean).join(" · "));
const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    emit("open");
  }
};
</script>
<template>
  <article class="bbm-card" role="link" tabindex="0" :aria-label="`${car.title} 상세 보기`" @click="emit('open')" @keydown="onKeyDown">
    <div class="bbm-card-main">
      <div class="bbm-card-image">
        <img :class="car.imageFit === 'contain' ? 'is-catalog' : ''" :src="asset(car.image)" :alt="`${car.title} ${car.trim}`" :draggable="false">
        <div class="bbm-card-media-footer" aria-hidden="true"><span :title="car.posted">{{ thumbnailPostedText(car.posted) }}</span></div>
      </div>
      <div class="bbm-card-content">
        <h2 class="bbm-card-title">{{ car.title }} {{ car.trim }}</h2>
        <p class="bbm-card-spec">{{ specs }}</p>
        <div class="bbm-card-price-row">
          <p class="bbm-card-price">{{ priceMatch?.[1] ?? "" }}{{ priceMatch?.[2] ?? car.price }}<span v-if="priceMatch">만원</span></p>
          <div v-if="badges.length" class="bbm-card-badges"><span v-for="badge in badges" :key="badge">{{ badge }}</span></div>
        </div>
        <p class="bbm-card-location"><BbIcon name="location-pin" :size="16" />{{ displayListPlace(car.place, car.sellerType) }}</p>
        <div class="bbm-card-meta">
          <div class="bbm-card-seller">
            <img :src="asset(sellerAvatar(car))" alt="" :draggable="false">
            <span class="bbm-card-seller-name">{{ seller }}</span>
            <span v-if="car.sellerType === '딜러'" class="bbm-card-seller-info"><b>{{ car.stock }}대</b> 판매중</span>
          </div>
          <div class="bbm-card-actions">
            <button type="button" :class="liked ? 'is-liked' : ''" :aria-label="`${car.title} ${liked ? '찜 해제' : '찜'}`" :aria-pressed="liked" @click.stop="emit('toggleLike')"><BbIcon :name="liked ? 'heart-filled' : 'heart'" :size="24" /></button>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>
