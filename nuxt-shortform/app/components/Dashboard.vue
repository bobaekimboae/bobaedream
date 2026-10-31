<script setup lang="ts">
// 대시보드: autohaus-video 「Dashboard」와 같은 동작.
// - 제목 아래 로그인한 이메일, 「새 영상」 버튼은 크레딧이 있을 때만
// - 크레딧 카드: 0개일 때만 「크레딧 구매」 링크
// - 다음 단계: 0개면 「크레딧 사고 → 영상 주문」 + 주 버튼 「지금 구매」, 있으면 「사진 올리기 → 영상 완성」 + 보조 버튼
// - 결제 직후(?payment=success) 알림 띠, 불러오는 동안 자리 표시, 빈 목록 안내(크레딧 있을 때만 첫 주문 링크)
import Icon from "./Icon.vue";
import { state } from "../lib/jobs";
import { auth } from "../lib/auth";
import { ct, rd } from "../lib/site";
import { carTitle } from "../lib/make";
import type { Order } from "../lib/store";

defineProps<{ paid: boolean }>();
const emit = defineEmits<{ go: [view: string, id?: string] }>();
const statusText: Record<Order["status"], string> = { queued: "주문 접수", making: "만드는 중", done: "완성", failed: "실패" };
const when = (t: number) => new Date(t).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
const initial = (o: Order) => (o.car.maker.trim()[0] ?? "?").toUpperCase();
const title = (o: Order) => `${carTitle(o.car)}${o.car.year.trim() ? ` (${o.car.year.trim()})` : ""}`;
</script>
<template>
  <div class="sf-wrap">
    <div class="sf-head">
      <div>
        <h1>대시보드</h1>
        <p>{{ auth.email }}</p>
      </div>
      <button v-if="state.loaded && state.credits > 0" class="btn is-main" type="button" @click="emit('go', 'new')"><Icon :src="rd('add-outline-24')" />새 영상</button>
    </div>
    <div v-if="paid" class="sf-banner" role="status"><Icon :src="rd('checkmark-fill')" /><span><b>결제가 끝났어요</b> — 크레딧을 넣었어요.</span></div>
    <div class="sf-stats">
      <div class="card sf-stat">
        <span class="sf-k">남은 크레딧</span>
        <strong>{{ state.loaded ? state.credits : "–" }}</strong>
        <a v-if="state.loaded && state.credits === 0" href="?v=pricing" @click.prevent="emit('go', 'pricing')">크레딧 구매</a>
      </div>
      <div class="card sf-next">
        <div>
          <span class="sf-k">다음 단계</span>
          <b>{{ state.credits === 0 ? "크레딧을 사고 영상 주문하기" : "사진 올리기 → 1분 안팎에 영상 완성" }}</b>
        </div>
        <button v-if="state.credits === 0" class="btn is-main" type="button" @click="emit('go', 'pricing')">지금 구매</button>
        <button v-else class="btn" type="button" @click="emit('go', 'new')">영상 주문</button>
      </div>
    </div>
    <h2 class="sf-h2">주문</h2>
    <div v-if="!state.loaded" class="sf-orders" aria-busy="true" aria-label="불러오는 중">
      <div v-for="n in 3" :key="n" class="card sf-order is-skel"><span class="ph" /><span><i /><i /></span></div>
    </div>
    <div v-else-if="!state.orders.length" class="card sf-empty">
      <span class="ico-wrap"><Icon :src="ct('chotot-common-video-play')" /></span>
      <p>아직 주문이 없어요.</p>
      <a v-if="state.credits > 0" href="?v=new" @click.prevent="emit('go', 'new')">첫 주문 만들기</a>
    </div>
    <div v-else class="sf-orders">
      <a v-for="o in state.orders" :key="o.id" class="card sf-order" :href="`?v=order&id=${o.id}`" @click.prevent="emit('go', 'order', o.id)">
        <img v-if="o.poster" :src="o.poster" alt="" />
        <span v-else class="ph is-letter">{{ initial(o) }}</span>
        <span>
          <b>{{ title(o) }}</b>
          <small>{{ when(o.createdAt) }} · 사진 {{ o.photos.length }}장</small>
        </span>
        <span :class="`badge is-${o.status === 'queued' ? 'making' : o.status}`">{{ o.status === "making" ? `만드는 중 ${o.progress}%` : statusText[o.status] }}</span>
        <Icon class="sf-arrow" :src="rd('forward-outline')" />
      </a>
    </div>
  </div>
</template>
