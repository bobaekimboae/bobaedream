<script setup lang="ts">
// 글 아래 「# 화제 추가 ▸」 · 「◎ 차량 모임 ▸」 줄 + 「내용 성격 표시 ▸」(동처띠 添加话题 · 关联圈子 · 内容自主声明 실측).
// 칩 줄: 인기 화제 2개 · 최근 본 차 모임 4개를 가로로 넘겨 바로 고른다. 「▸」를 누르면 전체 목록 시트.
import { computed, ref } from "vue";
import Sheet from "../Sheet.vue";
import Ico from "../Ico.vue";
import { IC } from "../../lib/icons";
import { CIRCLES, CLAIMS, TOPICS } from "../../lib/publish";

const p = withDefaults(defineProps<{ topic: string; circle: string; claim?: string; showClaim?: boolean; showTopic?: boolean; showCircle?: boolean }>(), { claim: "", showClaim: false, showTopic: true, showCircle: true });
const emit = defineEmits<{ "update:topic": [string]; "update:circle": [string]; "update:claim": [string] }>();
const sheet = ref<"" | "topic" | "circle" | "claim">("");
const q = ref("");
const hot = TOPICS.slice(0, 2);
const found = computed(() => { const k = q.value.trim(); return k ? TOPICS.filter((t) => t.name.includes(k)) : TOPICS; });
const fmt = (n: number) => (n >= 10000 ? `${(n / 10000).toFixed(1)}만` : n.toLocaleString());
const pickTopic = (n: string) => { emit("update:topic", p.topic === n ? "" : n); sheet.value = ""; };
const pickCircle = (n: string) => { emit("update:circle", p.circle === n ? "" : n); sheet.value = ""; };
</script>

<template>
  <section class="pmeta">
    <div v-if="showTopic !== false" class="pmeta__row">
      <button type="button" class="pmeta__lead" @click="sheet = 'topic'"><b class="pmeta__hash">#</b><span>{{ topic ? "화제" : "화제 추가" }}</span><i class="tri tri--r" /></button>
      <div class="pmeta__chips">
        <button v-if="topic && !hot.some((t) => t.name === topic)" type="button" class="on" @click="emit('update:topic', '')">{{ topic }} ✕</button>
        <button v-for="t in hot" :key="t.id" type="button" :class="{ on: topic === t.name }" @click="pickTopic(t.name)">{{ t.hot ? "" : "# " }}{{ t.name }}<em v-if="t.hot">상</em></button>
      </div>
    </div>
    <div v-if="showCircle !== false" class="pmeta__row">
      <button type="button" class="pmeta__lead" @click="sheet = 'circle'"><b class="pmeta__ring" /><span>차량 모임</span><i class="tri tri--r" /></button>
      <div class="pmeta__chips">
        <button v-for="c in CIRCLES.slice(0, 4)" :key="c" type="button" :class="{ on: circle === c }" @click="pickCircle(c)">{{ c }}</button>
        <button v-if="circle && !CIRCLES.slice(0, 4).includes(circle)" type="button" class="on" @click="emit('update:circle', '')">{{ circle }} ✕</button>
      </div>
    </div>
  </section>
  <button v-if="showClaim" type="button" class="pmeta__claim" @click="sheet = 'claim'">{{ claim || "내용 성격 표시" }}<i class="tri tri--r" /></button>

  <Sheet v-if="sheet === 'topic'" title="화제 추가" full @close="sheet = ''">
    <label class="pmeta__search"><Ico :src="IC.search" /><input v-model="q" placeholder="화제 검색" aria-label="화제 검색" /></label>
    <button v-for="t in found" :key="t.id" type="button" class="pmeta__item" :class="{ on: topic === t.name }" @click="pickTopic(t.name)">
      <b>#</b><span>{{ t.name }}<em v-if="t.hot">인기</em></span><small>글 {{ fmt(t.posts) }}</small>
    </button>
    <button v-if="q.trim() && !found.length" type="button" class="pmeta__item" @click="pickTopic(q.trim())"><b>#</b><span>「{{ q.trim() }}」 새 화제로 쓰기</span></button>
  </Sheet>
  <Sheet v-if="sheet === 'circle'" title="차량 모임" full @close="sheet = ''">
    <p class="pmeta__hint">글이 모임 게시판에도 함께 올라가요</p>
    <button v-for="c in CIRCLES" :key="c" type="button" class="pmeta__item" :class="{ on: circle === c }" @click="pickCircle(c)"><b class="pmeta__ring" /><span>{{ c }} 모임</span><small v-if="circle === c">선택됨</small></button>
  </Sheet>
  <Sheet v-if="sheet === 'claim'" title="내용 성격 표시" @close="sheet = ''">
    <div class="pmeta__claims">
      <button v-for="(c, i) in CLAIMS" :key="c" type="button" :class="{ on: claim === c, gap: i === CLAIMS.length - 1 }" @click="emit('update:claim', claim === c ? '' : c); sheet = ''">{{ c }}</button>
    </div>
  </Sheet>
</template>
