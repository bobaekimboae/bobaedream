<script setup lang="ts">
// 등록한 글 보기(미리보기와 상세가 같이 쓴다). 종류별로 사진 · 영상 · 판매 정보 · 구매가 표 · 부품 카드를 보여 준다.
import { computed, ref } from "vue";
import AttachCards from "./AttachCards.vue";
import Ico from "../Ico.vue";
import { IC } from "../../lib/icons";
import { asset, avatarUrl } from "../../lib/site";
import { KIND_LABEL, type Post } from "../../lib/publish";
import { ymdKo } from "../../lib/data";

/** 서버 글이면 글쓴이(author · avatar)가 함께 온다. 이 브라우저 글 · 미리보기는 「나」 */
type View = Partial<Post> & Pick<Post, "kind"> & { author?: string; avatar?: string };
const p = defineProps<{ post: View }>();
const at = ref(0);
const who = computed(() => ({ name: p.post.author || "나", avatar: avatarUrl((p.post.avatar || "avatar-01.svg").split("/").pop() || "avatar-01.svg") }));
const imgs = computed(() => p.post.media ?? []);
const rows = computed(() => Object.entries({ ...(p.post.sell ?? {}), ...(p.post.extra ?? {}) }).filter(([, v]) => v));
const onScroll = (e: Event) => { const el = e.target as HTMLElement; at.value = Math.round(el.scrollLeft / el.clientWidth); };
</script>

<template>
  <article class="pview">
    <header class="pview__who">
      <img :src="who.avatar" alt="" /><div><b>{{ who.name }}</b><small>{{ post.createdAt ? ymdKo(post.createdAt) : "방금" }} · {{ KIND_LABEL[post.kind] }}</small></div>
    </header>
    <div v-if="imgs.length" class="pview__media">
      <div class="pview__track" @scroll.passive="onScroll">
        <div v-for="(m, i) in imgs" :key="i" class="pview__slide">
          <video v-if="m.kind === 'video'" :src="m.src" :poster="m.cover" controls playsinline preload="metadata" />
          <img v-else :src="m.src" alt="" />
        </div>
      </div>
      <span v-if="imgs.length > 1" class="pview__count">{{ at + 1 }}/{{ imgs.length }}</span>
    </div>
    <div class="pview__body">
      <span v-if="post.kind === 'ask'" class="pview__ask">질문</span>
      <h2 v-if="post.title">{{ post.title }}</h2>
      <p v-if="post.body" class="pview__text">{{ post.body }}</p>
      <div v-if="post.car" class="pview__car"><img v-if="post.car.photo" :src="asset(post.car.photo)" alt="" /><div><b>{{ post.car.brand }} {{ post.car.model }}</b><small>{{ post.car.trim }}</small></div></div>
      <dl v-if="rows.length" class="pview__rows"><template v-for="[k, v] in rows" :key="k"><dt>{{ k }}</dt><dd>{{ v }}</dd></template></dl>
      <AttachCards :vote="post.vote" :price="post.ownerPrice" :parts="post.parts" :city="post.city" readonly />
      <div class="pview__tags">
        <span v-if="post.topic"># {{ post.topic }}</span><span v-if="post.circle"><Ico :src="IC.car" />{{ post.circle }} 모임</span><span v-if="post.claim" class="is-claim">{{ post.claim }}</span>
      </div>
    </div>
  </article>
</template>
