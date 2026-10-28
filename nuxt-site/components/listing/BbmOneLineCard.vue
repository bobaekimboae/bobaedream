<script setup lang="ts">
// 리액트 bbm-list.tsx 의 BbmOneLineCard. onToggleLike → emit("toggleLike"), onOpen → emit("open")
// 연식은 테스트 서버처럼 「15/07(16)」(등록 월을 모르면 「18/00(18)」), 제목은 카드와 같은 차명
import { computed } from "vue";
import type { Car } from "@proto/data";
import { bbmCardSpec } from "@proto/data/bbm-card-samples";
import { bbmIcon } from "@proto/listing/bbm-list";
import "@proto/listing/bbm-tokens.css";
import "@proto/listing/thumbnail-states.css";
import { cardTitleText, textViewYear, wishMaskStyle } from "./bbm-list-local";

const props = defineProps<{ car: Car; liked: boolean }>();
const emit = defineEmits<{ toggleLike: []; open: [] }>();
const year = computed(() => textViewYear(props.car, bbmCardSpec(props.car, true)));
const price = computed(() => props.car.price.match(/[\d,]+/)?.[0] ?? "상담");
const wishOff = bbmIcon("card-wish-off");
const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); emit("open"); } };
</script>
<template>
  <article class="bbm-one-line-card" role="link" tabindex="0" :aria-label="`${car.title} 상세 보기`" @click="emit('open')" @keydown="onKeyDown">
    <strong>{{ cardTitleText(car) }}</strong>
    <span>{{ year }}</span>
    <b>{{ price }}</b>
    <button type="button" :aria-label="`${car.title} ${liked ? '찜 해제' : '찜'}`" :aria-pressed="liked" @click.stop="emit('toggleLike')">
      <span v-if="liked" class="bbm-card-wish-on" :style="wishMaskStyle(wishOff)" aria-hidden="true" />
      <img v-else :src="wishOff" alt="" aria-hidden="true" />
    </button>
  </article>
</template>
