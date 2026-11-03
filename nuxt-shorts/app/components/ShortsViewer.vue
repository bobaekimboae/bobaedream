<!--
  보배드림 숏폼 매물 보기(카스24 비디오 투어형) — 상용 화면
  · 위아래로 한 장씩 넘기는 전체 화면 세로 영상, 보이는 영상 하나만 재생, 앞뒤 한 장만 미리 받음
  · 끝에 가까워지면 다음 매물을 이어 받음(원본 API 의 다음 매물 번호를 따라감)
  · 부위 시각이 있는 영상은 아래 부위 아이콘 줄(누르면 그 장면으로, 부위 끝에서 다음 부위로)
  · 찜(로그인하면 계정에, 아니면 이 기기에) · 공유 · 소리, 두 번 누르면 찜
  · 매물 카드: 차명 · 연식 · 주행 · 연료 · 가격 · 지역 · 판매자, 딜러 보기 · 전화 문의(안심번호)
  키보드: ↑↓ 영상, ←→ 앞·뒤 부위, 스페이스 재생·멈춤, M 소리, Esc 닫기
-->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRuntimeConfig, useState } from "#app";
import Mask from "./Mask.vue";
import ShortPlayer from "./ShortPlayer.vue";
import TourChapters from "./TourChapters.vue";
import { pickSource, SourceError, type ShortsSource } from "~/lib/source";
import { chotot, redditShoot, redditVideo, sitePath } from "~/lib/site";
import type { ShortItem } from "~/lib/types";

const cfg = useRuntimeConfig().public as { shortsApi: string; liveBase: string; siteBase: string };
const site = cfg.siteBase.replace(/\/$/, "");
const q = new URLSearchParams(window.location.search);
const category = q.get("category") || "cars";
const debug = q.get("debug") === "1";

const TOKEN_KEY = "bbm-auth-token";
const token = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
let source: ShortsSource;
const sourceLabel = ref("");
const snapshotAt = ref("");

const items = useState<ShortItem[]>("shorts.items", () => []);
const next = ref<string | null>(null);
const state = ref<"loading" | "ready" | "error" | "empty">("loading");
const errorMsg = ref("");
const loadingMore = ref(false);
const active = ref(0);
const muted = ref(true);
const paused = ref(false);
const time = ref(0);
const dur = ref(0);
const burst = ref(-1);
const toast = ref("");
const feed = ref<HTMLElement | null>(null);
const players = ref<(InstanceType<typeof ShortPlayer> | null)[]>([]);

// 찜(로그인 전): 이 기기에만 기억
const WISH_KEY = "bbm-shorts-wish-v1";
const guestWish = ref<Set<string>>(new Set());
try {
  guestWish.value = new Set(JSON.parse(localStorage.getItem(WISH_KEY) || "[]"));
} catch {
  /* 저장소를 쓸 수 없음 — 화면은 그대로 */
}
const saveWish = () => {
  try {
    localStorage.setItem(WISH_KEY, JSON.stringify([...guestWish.value]));
  } catch {
    /* 저장소를 쓸 수 없음 */
  }
};
const isLiked = (s: ShortItem) => s.liked || guestWish.value.has(s.id);
const likeCount = (s: ShortItem) => s.likes + (!s.liked && guestWish.value.has(s.id) ? 1 : 0);

let toastT = 0;
const say = (m: string, ms = 1800) => {
  toast.value = m;
  window.clearTimeout(toastT);
  toastT = window.setTimeout(() => (toast.value = ""), ms);
};

const cur = computed(() => items.value[active.value]);
const chapterNow = computed(() => {
  const ch = cur.value?.chapters ?? [];
  if (!ch.length) return -1;
  const t = time.value;
  const i = ch.findIndex((c) => t >= c.from && t < c.to);
  return i === -1 ? (t >= ch[ch.length - 1]!.to - 0.05 ? ch.length - 1 : 0) : i;
});
const chapterProgress = computed(() => {
  const c = cur.value?.chapters[chapterNow.value];
  return c ? Math.min(1, Math.max(0, (time.value - c.from) / (c.to - c.from || 1))) : 0;
});

const mmss = (s: number) => (Number.isFinite(s) && s > 0 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");
const specOf = (s: ShortItem) => [s.registered ? s.registered.replace(/^20(\d\d)\.(\d\d)$/, "$1년$2월") : s.year ? String(s.year) : null, s.mileage, s.fuel?.replace(/\s*일반인구입$/, "")].filter(Boolean).join(" · ");
const placeOf = (s: ShortItem) => [s.region, s.complex].filter(Boolean).join(" · ");
const sellerOf = (s: ShortItem) => [s.seller.name, s.seller.company].filter(Boolean).join(" · ") || (s.seller.type === "dealer" ? "딜러" : "개인 판매자");
const detailUrl = (s: ShortItem) => `${site}/car/detail/${encodeURIComponent(s.id)}`;
const dealerUrl = (s: ShortItem) => (s.seller.id && s.seller.type === "dealer" ? `${site}/car/dealer/${encodeURIComponent(s.seller.id)}` : detailUrl(s));
const telOf = (p: string) => p.replace(/^(050\d)(\d{4})(\d{4})$/, "$1-$2-$3").replace(/^(0\d{1,2})(\d{3,4})(\d{4})$/, "$1-$2-$3");

// ── 재생 ──
const playActive = () => {
  players.value.forEach((p, i) => {
    if (!p) return;
    if (i === active.value && !paused.value) p.play();
    else p.pause();
  });
};
const onTime = (i: number, t: number, d: number) => {
  if (i !== active.value) return;
  time.value = t;
  dur.value = d;
  watched.add(t);
};
const seekChapter = (n: number) => {
  const c = cur.value?.chapters[n];
  const p = players.value[active.value];
  if (!c || !p) return;
  p.seek(c.from);
  time.value = c.from;
  paused.value = false;
  playActive();
};
const togglePlay = () => {
  paused.value = !paused.value;
  playActive();
};
const toggleMute = () => {
  muted.value = !muted.value;
};
const go = (n: number) => {
  const el = feed.value?.children[n] as HTMLElement | undefined;
  if (!el) return;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
};

// ── 시청 기록: 한 장에서 실제로 본 시간을 모아, 다른 장으로 넘길 때 한 번 보낸다(2초 미만은 안 보냄) ──
const watched = {
  id: "" as string,
  last: -1,
  sum: 0,
  sent: new Set<string>(),
  add(t: number) {
    if (this.last >= 0 && t > this.last && t - this.last < 1.5) this.sum += t - this.last;
    this.last = t;
  },
  flush() {
    if (this.id && this.sum >= 2 && !this.sent.has(this.id)) {
      this.sent.add(this.id);
      source?.view(this.id, this.sum);
    }
    this.last = -1;
    this.sum = 0;
  },
};

// ── 찜 ──
const toggleWish = async (s: ShortItem, on?: boolean) => {
  const want = on ?? !isLiked(s);
  if (want === isLiked(s)) return;
  const was = { liked: s.liked, likes: s.likes };
  if (s.liked || !want) {
    // 계정 찜을 푸는 경우 또는 기기 찜을 푸는 경우
    if (guestWish.value.has(s.id)) {
      const g = new Set(guestWish.value);
      g.delete(s.id);
      guestWish.value = g;
      saveWish();
      if (!s.liked) return say("찜을 풀었어요");
    }
  }
  // 먼저 화면에 반영하고(낙관적 반영), 실패하면 되돌린다
  s.liked = want;
  s.likes = Math.max(0, s.likes + (want ? 1 : -1));
  const r = await source.like(s.id, want);
  if (r.ok) {
    if (r.likes != null) s.likes = r.likes;
    say(want ? "찜했어요" : "찜을 풀었어요");
    return;
  }
  s.liked = was.liked;
  s.likes = was.likes;
  if (r.reason === "login" && want) {
    const g = new Set(guestWish.value);
    g.add(s.id);
    guestWish.value = g;
    saveWish();
    say("이 기기에 찜했어요 · 로그인하면 계정에 저장돼요", 2600);
  } else say(r.message);
};

// 한 번 누르면 재생·멈춤, 두 번 빠르게 누르면 찜(인스타그램 · 틱톡과 같은 손짓)
let tapT = 0;
let lastTap = 0;
const onTap = (i: number) => {
  const now = Date.now();
  if (now - lastTap < 280) {
    window.clearTimeout(tapT);
    lastTap = 0;
    const s = items.value[i];
    if (s) void toggleWish(s, true);
    burst.value = i;
    window.setTimeout(() => (burst.value = -1), 700);
    return;
  }
  lastTap = now;
  tapT = window.setTimeout(togglePlay, 280);
};

const share = async (s: ShortItem) => {
  const url = new URL(window.location.href);
  url.searchParams.set("id", s.id);
  url.hash = "";
  const text = [s.title, s.price, sellerOf(s)].filter(Boolean).join(" · ");
  try {
    if (navigator.share) await navigator.share({ title: s.title, text, url: url.toString() });
    else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      say("링크를 복사했어요");
    }
  } catch {
    /* 공유창을 닫음 */
  }
};

// ── 불러오기 ──
const load = async () => {
  state.value = "loading";
  try {
    const page = await source.first(q.get("id"));
    items.value = page.items;
    next.value = page.next;
    state.value = page.items.length ? "ready" : "empty";
  } catch (e) {
    errorMsg.value = e instanceof SourceError ? e.message : "숏폼을 불러오지 못했어요.";
    state.value = "error";
  }
  await nextTick();
  observe();
  playActive();
};
const loadMore = async () => {
  if (loadingMore.value || !next.value) return;
  loadingMore.value = true;
  try {
    const page = await source.more(next.value);
    const have = new Set(items.value.map((s) => s.id));
    items.value = [...items.value, ...page.items.filter((s) => !have.has(s.id))];
    next.value = page.next;
    await nextTick();
    observe();
  } catch {
    /* 다음에 다시 시도(넘길 때마다) */
  } finally {
    loadingMore.value = false;
  }
};

let io: IntersectionObserver | null = null;
const observed = new WeakSet<Element>();
const observe = () => {
  if (!feed.value) return;
  io ??= new IntersectionObserver(
    (ents) => {
      for (const en of ents) {
        if (!en.isIntersecting || en.intersectionRatio < 0.6) continue;
        const i = Number((en.target as HTMLElement).dataset.i);
        if (i === active.value && watched.id) continue;
        watched.flush();
        active.value = i;
        watched.id = items.value[i]?.id ?? "";
        paused.value = false;
        time.value = 0;
        dur.value = 0;
        playActive();
      }
    },
    { root: feed.value, threshold: [0.6] },
  );
  feed.value.querySelectorAll<HTMLElement>(".shorts__slide").forEach((el) => {
    if (!observed.has(el)) {
      observed.add(el);
      io!.observe(el);
    }
  });
};

watch(active, (i) => {
  if (i >= items.value.length - 2) void loadMore();
  const s = items.value[i];
  if (s) {
    const url = new URL(window.location.href);
    url.searchParams.set("id", s.id);
    history.replaceState(history.state, "", url);
  }
});

const onKey = (e: KeyboardEvent) => {
  if ((e.target as HTMLElement)?.closest?.("input, textarea, select")) return;
  const ch = cur.value?.chapters ?? [];
  if (e.key === "ArrowDown" || e.key === "PageDown") {
    e.preventDefault();
    go(Math.min(items.value.length - 1, active.value + 1));
  } else if (e.key === "ArrowUp" || e.key === "PageUp") {
    e.preventDefault();
    go(Math.max(0, active.value - 1));
  } else if (e.key === "ArrowRight" && ch.length) seekChapter(Math.min(ch.length - 1, chapterNow.value + 1));
  else if (e.key === "ArrowLeft" && ch.length) seekChapter(Math.max(0, chapterNow.value - 1));
  else if (e.key === " " && !(e.target as HTMLElement)?.closest?.("button, a")) {
    e.preventDefault();
    togglePlay();
  } else if (e.key === "m" || e.key === "M") toggleMute();
  else if (e.key === "Escape") close();
};
const close = () => {
  watched.flush();
  if (history.length > 1 && document.referrer) history.back();
  else window.location.href = `${site}/car/list`;
};
// 다른 앱으로 가면 멈추고, 돌아오면 이어서
const onVis = () => {
  if (document.hidden) {
    players.value[active.value]?.pause();
    watched.flush();
  } else playActive();
};

onMounted(() => {
  source = pickSource({
    apiBase: cfg.shortsApi,
    liveBase: cfg.liveBase,
    category,
    token,
    snapshot: async () => {
      const m = await import("~/data/shorts-snapshot.json");
      const d = (m.default ?? m) as unknown as { fetched_at: string; items: ShortItem[] };
      snapshotAt.value = d.fetched_at;
      return d;
    },
  });
  sourceLabel.value = source.label;
  window.addEventListener("keydown", onKey);
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("pagehide", () => watched.flush());
  void load();
});
onBeforeUnmount(() => {
  io?.disconnect();
  window.removeEventListener("keydown", onKey);
  document.removeEventListener("visibilitychange", onVis);
});

const heart = (on: boolean) => chotot(on ? "chotot-common-favorite-selected.svg" : "chotot-common-favorite.svg");
const debugLabel = computed(() => `데이터: ${sourceLabel.value}${snapshotAt.value ? ` · ${snapshotAt.value.slice(0, 10)}` : ""} · ${items.value.length}대`);
</script>
<template>
  <div class="shorts" role="region" aria-roledescription="숏폼 영상 목록" aria-label="숏폼 매물">
    <header class="shorts__top">
      <button type="button" class="shorts__icon" aria-label="닫기" @click="close"><Mask :src="redditShoot('close-outline')" /></button>
      <h1>숏폼 매물</h1>
      <span v-if="state === 'ready'" class="shorts__count" aria-live="polite">{{ active + 1 }} / {{ items.length }}{{ next ? "+" : "" }}</span>
    </header>

    <div v-if="state === 'loading'" class="shorts__state" role="status">
      <span class="shorts__spin" aria-hidden="true" />
      <p>숏폼 매물을 불러오고 있어요</p>
    </div>
    <div v-else-if="state === 'error'" class="shorts__state" role="alert">
      <p>{{ errorMsg }}</p>
      <button type="button" class="shorts__retry" @click="load">다시 불러오기</button>
    </div>
    <div v-else-if="state === 'empty'" class="shorts__state">
      <p>아직 숏폼 영상이 있는 매물이 없어요.</p>
      <a class="shorts__retry" :href="`${site}/car/list`">매물 목록 보기</a>
    </div>

    <div v-show="state === 'ready'" ref="feed" class="shorts__feed">
      <section
        v-for="(s, i) in items"
        :key="s.id"
        class="shorts__slide"
        :data-i="i"
        :aria-label="`${i + 1}번째 영상 · ${s.title}`"
        :aria-hidden="i !== active ? 'true' : undefined"
        :inert="i !== active"
      >
        <ShortPlayer
          :ref="(el) => (players[i] = el as InstanceType<typeof ShortPlayer> | null)"
          :video="s.video"
          :poster="s.poster"
          :load="Math.abs(i - active) <= 1"
          :muted="muted"
          :label="`${s.title} 매물 영상`"
          @time="(t, d) => onTime(i, t, d)"
          @ended="players[i]?.play()"
        />
        <div class="shorts__tap" aria-hidden="true" @click="onTap(i)" />
        <span v-if="i === active && paused" class="shorts__play" aria-hidden="true"><Mask :src="redditShoot('play-fill')" /></span>
        <span v-if="burst === i" class="shorts__burst" aria-hidden="true"><img :src="heart(true)" alt="" /></span>

        <div class="shorts__bottom">
          <div class="shorts__rail">
            <button type="button" class="shorts__act" :aria-pressed="isLiked(s)" :aria-label="`찜 ${likeCount(s)}`" @click.stop="toggleWish(s)">
              <span class="shorts__act-ic"><img :src="heart(isLiked(s))" alt="" :class="{ 'is-on': isLiked(s) }" /></span>
              <span aria-hidden="true">{{ likeCount(s) || "찜" }}</span>
            </button>
            <button type="button" class="shorts__act" aria-label="공유" @click.stop="share(s)">
              <span class="shorts__act-ic"><img :src="chotot('chotot-common-share.svg')" alt="" /></span>
              <span aria-hidden="true">공유</span>
            </button>
            <button type="button" class="shorts__act" :aria-pressed="!muted" :aria-label="muted ? '소리 켜기' : '소리 끄기'" @click.stop="toggleMute">
              <span class="shorts__act-ic"><Mask :src="redditVideo(muted ? 'volume-mute-fill.svg' : 'volume-fill.svg')" /></span>
              <span aria-hidden="true">소리</span>
            </button>
          </div>

          <div class="shorts__row">
            <span v-if="s.chapters.length" class="shorts__tag">비디오 투어 · {{ s.chapters.length }}개 부위</span>
            <span v-else-if="s.hashtags.length" class="shorts__chips">
              <span v-for="h in s.hashtags.slice(0, 2)" :key="h" class="shorts__chip">{{ h }}</span>
            </span>
            <span v-if="i === active && dur" class="shorts__time">{{ mmss(time) }} / {{ mmss(dur) }}</span>
          </div>
          <TourChapters
            v-if="s.chapters.length"
            :chapters="s.chapters"
            :now="i === active ? chapterNow : 0"
            :progress="i === active ? chapterProgress : 0"
            @seek="(n) => i === active && seekChapter(n)"
          />
          <div v-else class="shorts__bar" aria-hidden="true">
            <b :style="{ width: i === active && dur ? `${Math.min(100, (time / dur) * 100)}%` : '0%' }" />
          </div>

          <article class="shorts__car">
            <a class="shorts__title" :href="detailUrl(s)">{{ s.title }}</a>
            <span v-if="specOf(s)" class="shorts__meta">{{ specOf(s) }}</span>
            <span class="shorts__price">{{ s.price || "가격 상담" }}</span>
            <span v-if="placeOf(s)" class="shorts__meta">{{ placeOf(s) }}</span>
            <div class="shorts__seller">
              <img v-if="s.seller.avatar" :src="s.seller.avatar" alt="" class="shorts__avatar" loading="lazy" />
              <span v-else class="shorts__avatar is-empty" aria-hidden="true" />
              <span class="shorts__seller-name">{{ sellerOf(s) }}</span>
              <span v-if="s.seller.type === 'dealer' && s.seller.selling" class="shorts__seller-meta">판매중 {{ s.seller.selling }}대</span>
            </div>
            <div class="shorts__cta">
              <a class="shorts__btn is-line" :href="dealerUrl(s)">{{ s.seller.type === "dealer" ? "딜러 보기" : "매물 상세" }}</a>
              <a v-if="s.seller.phone && s.seller.can_inquire" class="shorts__btn is-main" :href="`tel:${s.seller.phone}`" :aria-label="`안심번호 ${telOf(s.seller.phone)}로 전화 문의`">
                <Mask :src="sitePath('icons', 'dealer-profile', 'phone-as24.svg')" />전화 문의
              </a>
              <a v-else class="shorts__btn is-main" :href="detailUrl(s)">매물 상세 보기</a>
            </div>
          </article>
        </div>
      </section>
      <div v-if="loadingMore" class="shorts__more" role="status">다음 매물을 불러오고 있어요</div>
    </div>

    <p v-if="toast" class="shorts__toast" role="status">{{ toast }}</p>
    <p v-if="debug" class="shorts__debug">{{ debugLabel }}</p>
  </div>
</template>
