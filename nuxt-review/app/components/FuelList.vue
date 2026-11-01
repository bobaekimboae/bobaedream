<script setup lang="ts">
// 연비·전비 목록(동처띠 차량 모임 「车主续航」 탭 실측 2026-11-01):
//   차종 고르기(검은 알약 ▾) → 실주행 분포 카드(계절 탭 · 두 칸 수치 · 실측 링크) → 기준 안내 → 「오너 실측 데이터」 동력 알약 → 공유 카드 피드 → 「기록 쓰기」
import { computed, ref } from "vue";
import Ico from "./Ico.vue";
import ListHead from "./ListHead.vue";
import EnergyCard from "./EnergyCard.vue";
import Sheet from "./Sheet.vue";
import { IC } from "../lib/icons";
import { asset, site } from "../lib/site";
import { avg, ymdKo, type FuelPost } from "../lib/data";
import { R, likeCount } from "../lib/react";
import { doVote, useFuel } from "../lib/actions";
import { go } from "../lib/route";
import { toast } from "../lib/ui";

const allRef = useFuel();
const all = computed(() => allRef.value);
const model = ref("");
const season = ref<"mild" | "summer" | "winter">("mild");
const mode = ref<"" | FuelPost["powertrain"]>("");
const q = ref("");
const sheet = ref<"" | "model" | "about">("");

const seasonOf = (iso: string) => { const m = new Date(iso).getMonth() + 1; return m >= 6 && m <= 8 ? "summer" : m === 12 || m <= 2 ? "winter" : "mild"; };
const scope = computed(() => all.value.filter((p) => !model.value || `${p.brand} ${p.model}` === model.value));
const inSeason = computed(() => scope.value.filter((p) => seasonOf(p.publishedAt) === season.value));
const isEvScope = computed(() => scope.value.length > 0 && scope.value.every((p) => p.powertrain === "ev"));
const stat = computed(() => {
  const xs = inSeason.value;
  const ev = xs.filter((p) => p.energy);
  const ice = xs.filter((p) => p.fuel);
  return {
    left: ev.length ? { v: `${Math.round(avg(ev.map((p) => p.range ?? 0).filter(Boolean)))}km`, l: "평균 완충 주행거리", s: `${avg(ev.map((p) => 100 / p.energy!)).toFixed(1)}km/kWh`, sl: "평균 전비", n: ev.length } : null,
    right: ice.length ? { v: `${avg(ice.map((p) => p.fuel!)).toFixed(1)}km/L`, l: "평균 연비", s: `${Math.round(avg(ice.map((p) => p.odometer)) / 1000)}천km`, sl: "평균 누적 주행", n: ice.length } : null,
  };
});
const models = computed(() => {
  const m = new Map<string, number>();
  for (const p of all.value) m.set(`${p.brand} ${p.model}`, (m.get(`${p.brand} ${p.model}`) ?? 0) + 1);
  return [...m.entries()];
});
const MODES: [typeof mode.value, string][] = [["", "전체"], ["ev", "전기차"], ["phev", "플러그인"], ["hybrid", "하이브리드"], ["ice", "내연기관"]];
const list = computed(() => {
  const k = q.value.replace(/\s/g, "").toLowerCase();
  return scope.value.filter((p) => (!mode.value || p.powertrain === mode.value) && (!k || `${p.brand}${p.model}${p.title}${p.body}`.replace(/\s/g, "").toLowerCase().includes(k)));
});
const open = (p: FuelPost) => go({ board: "fuel", view: "detail", id: p.id });
const share = async (p: FuelPost) => {
  const url = new URL(`?board=fuel&view=detail&id=${p.id}`, window.location.href).href;
  try { if (navigator.share) await navigator.share({ title: p.title, url }); else { await navigator.clipboard.writeText(url); toast("링크를 복사했어요"); } } catch { /* 취소 */ }
};
</script>

<template>
  <main class="list list--fuel">
    <ListHead board="fuel" :title="model || '연비·전비'" :q="q" @update:q="q = $event" />

    <div class="fver"><span>차종</span><button type="button" @click="sheet = 'model'">{{ model || "전체 차종" }}<i class="tri tri--w" /></button></div>
    <section class="dist">
      <h2>실주행 분포</h2>
      <div class="dist__tabs" role="tablist" aria-label="계절">
        <button v-for="s in ([['mild', '봄·가을'], ['summer', '여름'], ['winter', '겨울']] as const)" :key="s[0]" type="button" role="tab" :aria-selected="season === s[0]" :class="{ on: season === s[0] }" @click="season = s[0]">{{ s[1] }} 주행</button>
      </div>
      <div v-if="stat.left || stat.right" class="dist__boxes">
        <div v-if="stat.left" class="dist__box"><b class="dist__bt">전기 주행</b><strong>{{ stat.left.v }}</strong><span>{{ stat.left.l }}</span><strong>{{ stat.left.s }}</strong><span>{{ stat.left.sl }}</span></div>
        <div v-if="stat.right" class="dist__box"><b class="dist__bt">연료 주행</b><strong>{{ stat.right.v }}</strong><span>{{ stat.right.l }}</span><strong>{{ stat.right.s }}</strong><span>{{ stat.right.sl }}</span></div>
      </div>
      <p v-else class="dist__none">이 계절에 올라온 기록이 아직 없어요</p>
      <div v-if="stat.left || stat.right" class="dist__links">
        <button v-if="stat.left" type="button" @click="mode = 'ev'">실측 전비 {{ stat.left.n }}건<Ico :src="IC.chevron" /></button>
        <button v-if="stat.right" type="button" @click="mode = isEvScope ? '' : 'ice'">실측 연비 {{ stat.right.n }}건<Ico :src="IC.chevron" /></button>
      </div>
    </section>
    <p class="dist__note">* {{ scope.length }}명 오너가 올린 실제 기록으로 계산했어요. <button type="button" @click="sheet = 'about'">기준 보기 ›</button></p>

    <h2 class="sec">오너 실측 데이터</h2>
    <div class="modes"><button v-for="m in MODES" :key="m[0]" type="button" :class="{ on: mode === m[0] }" :aria-pressed="mode === m[0]" @click="mode = m[0]">{{ m[1] }}</button></div>

    <div class="feed feed--fuel">
      <article v-for="p in list" :key="p.id" class="fpost" @click="open(p)">
        <header class="rcard__who">
          <img :src="site(p.avatar)" alt="" class="rcard__av" />
          <div><b>{{ p.author }}</b><span><img v-if="p.brandLogo" :src="asset(p.brandLogo)" alt="" />{{ p.model }} 오너 · 보유 {{ p.ownerYears }}년</span></div>
        </header>
        <h3 class="fpost__t">{{ p.title }}</h3>
        <p class="fpost__b">{{ p.body }}</p>
        <EnergyCard :post="p" :width="168" />
        <time class="rcard__date">{{ ymdKo(p.publishedAt) }}</time>
        <footer class="fpost__act" @click.stop>
          <button type="button" @click="share(p)"><Ico :src="IC.share" />공유</button>
          <button type="button" @click="open(p)"><Ico :src="IC.comment" />{{ p.comments || "댓글" }}</button>
          <button type="button" :class="{ on: R.like[p.id] === 1 }" :aria-pressed="R.like[p.id] === 1" @click="doVote('fuel', p.id, 1)"><Ico :src="IC.like" />{{ likeCount(p.id, p.likes) || "공감" }}</button>
        </footer>
      </article>
      <p v-if="!list.length" class="empty">조건에 맞는 기록이 없어요</p>
      <p v-else class="feed__end">더 이상 기록이 없어요</p>
    </div>

    <button type="button" class="fab" @click="go({ board: 'fuel', view: 'write' })"><Ico :src="IC.edit" />기록 쓰기</button>

    <Sheet v-if="sheet === 'model'" title="차종 선택" @close="sheet = ''">
      <button type="button" class="opt" :class="{ on: !model }" @click="model = ''; sheet = ''">전체 차종<span>{{ all.length }}</span></button>
      <button v-for="[m, n] in models" :key="m" type="button" class="opt" :class="{ on: model === m }" @click="model = m; mode = ''; sheet = ''">{{ m }}<span>{{ n }}</span></button>
    </Sheet>
    <Sheet v-if="sheet === 'about'" title="실주행 분포 기준" @close="sheet = ''">
      <div class="doc">
        <p>오너가 직접 올린 기록만 계산해요. 제조사 공인 수치가 아니에요.</p>
        <p>계절은 기록을 올린 달로 나눠요. 봄·가을 3~5월·9~11월, 여름 6~8월, 겨울 12~2월.</p>
        <p>전비는 km/kWh, 연비는 km/L로 보여 줘요. 플러그인 하이브리드는 두 값을 함께 써요.</p>
      </div>
    </Sheet>
  </main>
</template>
