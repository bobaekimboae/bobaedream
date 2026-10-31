<script setup lang="ts">
import Icon from "./Icon.vue";
import { state } from "../lib/jobs";
import { ct, rd } from "../lib/site";
import { carTitle } from "../lib/make";
import type { Order } from "../lib/store";

const emit = defineEmits<{ go: [view: string, id?: string] }>();
const statusText: Record<Order["status"], string> = { queued: "순서 기다림", making: "만드는 중", done: "완성", failed: "다시 시도 필요" };
const when = (t: number) => new Date(t).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
</script>
<template>
  <div class="sf-wrap">
    <div class="sf-head">
      <div>
        <h1>대시보드</h1>
        <p>사진만 올리면 릴스 · 틱톡 · 쇼츠용 세로 영상을 바로 만들어 드려요.</p>
      </div>
      <button class="btn is-main" type="button" @click="emit('go', 'new')"><Icon :src="rd('add-outline-24')" />새 영상</button>
    </div>
    <div class="sf-stats">
      <div class="card sf-stat">
        <span class="sf-k">남은 크레딧</span>
        <strong>{{ state.credits }}</strong>
      </div>
      <div class="card sf-next">
        <div>
          <span class="sf-k">다음 단계</span>
          <b>사진 올리기 → 1분 안팎에 영상 완성</b>
        </div>
        <button class="btn" type="button" @click="emit('go', 'new')">영상 만들기</button>
      </div>
    </div>
    <h2 class="sf-h2">만든 영상</h2>
    <div v-if="!state.orders.length" class="card sf-empty">
      <span class="ico-wrap"><Icon :src="ct('chotot-common-video-play')" /></span>
      <p>아직 만든 영상이 없어요.</p>
      <a href="?v=new" @click.prevent="emit('go', 'new')">첫 영상 만들기</a>
    </div>
    <div v-else class="sf-orders">
      <a v-for="o in state.orders" :key="o.id" class="card sf-order" :href="`?v=order&id=${o.id}`" @click.prevent="emit('go', 'order', o.id)">
        <img v-if="o.poster" :src="o.poster" alt="" />
        <span v-else class="ph" />
        <span>
          <b>{{ carTitle(o.car) }}</b>
          <small>{{ when(o.createdAt) }} · 사진 {{ o.photos.length }}장{{ o.outputs.length ? ` · ${o.outputs[0]!.seconds}초` : "" }}</small>
        </span>
        <span :class="`badge is-${o.status === 'queued' ? 'making' : o.status}`">{{ o.status === "making" ? `만드는 중 ${o.progress}%` : statusText[o.status] }}</span>
      </a>
    </div>
  </div>
</template>
