<script setup lang="ts">
// 글에 붙인 투표 · 구매가 · 튜닝 부품 · 위치 카드(글쓰기 화면과 글 보기 화면이 같이 쓴다). readonly면 빼기 버튼을 숨긴다.
import { asset } from "../../lib/site";
import Ico from "../Ico.vue";
import { IC } from "../../lib/icons";
import type { OwnerPrice, PartCard, Vote } from "../../lib/publish";

defineProps<{ vote?: Vote | null; price?: OwnerPrice | null; parts?: PartCard[]; city?: string; readonly?: boolean }>();
const emit = defineEmits<{ "rm-vote": []; "rm-price": []; "rm-part": [number]; "rm-city": [] }>();
const won = (v: string) => (v ? `${Number(v).toLocaleString()}만원` : "-");
</script>

<template>
  <div v-if="vote || price || parts?.length || city" class="patt">
    <div v-if="vote" class="patt__card patt__vote">
      <b>{{ vote.title }}</b><small>{{ vote.multi ? "여러 개 고르기" : "하나만 고르기" }} · {{ vote.until }} 마감</small>
      <ol><li v-for="o in vote.options" :key="o">{{ o }}</li></ol>
      <button v-if="!readonly" type="button" class="patt__x" aria-label="투표 빼기" @click="emit('rm-vote')"><Ico :src="IC.clear" /></button>
    </div>
    <div v-if="price" class="patt__card patt__price">
      <img v-if="price.car?.photo" :src="asset(price.car.photo)" alt="" />
      <div><b>{{ price.car?.brand }} {{ price.car?.model }}</b><small>{{ price.car?.trim }}</small><p>실구매가 <em>{{ won(price.total) }}</em> · 차량가 {{ won(price.nake) }}</p><small>{{ price.month }} 구매 · {{ price.city || "지역 미정" }}</small></div>
      <button v-if="!readonly" type="button" class="patt__x" aria-label="구매가 빼기" @click="emit('rm-price')"><Ico :src="IC.clear" /></button>
    </div>
    <div v-for="(pt, i) in parts" :key="i" class="patt__card patt__part">
      <span class="patt__tag">{{ pt.type }}</span><div><b>{{ pt.brand }}</b><small>{{ [pt.metric, pt.price ? `${Number(pt.price).toLocaleString()}원` : ""].filter(Boolean).join(" · ") }}</small></div>
      <button v-if="!readonly" type="button" class="patt__x" :aria-label="`${pt.type} 부품 빼기`" @click="emit('rm-part', i)"><Ico :src="IC.clear" /></button>
    </div>
    <span v-if="city" class="patt__city"><Ico :src="IC.location" />{{ city }}<button v-if="!readonly" type="button" aria-label="위치 빼기" @click="emit('rm-city')">✕</button></span>
  </div>
</template>
