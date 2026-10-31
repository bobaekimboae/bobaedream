<script setup lang="ts">
import { computed, ref } from "vue";
import { sitePath } from "../lib/site";

const emit = defineEmits<{ go: [view: string] }>();

const samples = [
  {
    id: "feature",
    title: "BMW X5 · 옵션 설명형",
    desc: "차량 부위를 따라가는 포인터와 옵션 문구, 음성 설명을 결합한 30초 세로 숏폼",
    duration: "30초",
    format: "9:16",
    use: "릴스 · 쇼츠 · 틱톡",
    src: sitePath("videos", "bmw-x5-features", "BMW_X5_FEATURES.mp4"),
    poster: sitePath("videos", "bmw-x5-features", "poster.jpg"),
    tags: ["옵션 애니메이션", "AI 음성", "자동 자막"],
  },
  {
    id: "reel",
    title: "BMW X5 · 빠른 매물 소개형",
    desc: "첫 3초에 시선을 잡고 차량 핵심 장면과 판매 포인트를 빠르게 보여 주는 15초 릴스",
    duration: "15초",
    format: "9:16",
    use: "광고 · 신착 매물",
    src: sitePath("videos", "open-source-reel-sample", "bobaedream-bmw-x5-ai-reel-sample.mp4"),
    poster: sitePath("videos", "open-source-reel-sample", "poster.png"),
    tags: ["빠른 컷", "키워드 강조", "BGM 싱크"],
  },
  {
    id: "option-3d",
    title: "차량 옵션 · 3D 설명형",
    desc: "차량 기능과 구조를 모션 그래픽으로 풀어내는 프리미엄 설명형 30초 샘플",
    duration: "30초",
    format: "9:16",
    use: "고급 매물 · 옵션 소개",
    src: sitePath("3d-options", "media", "demo.mp4"),
    poster: sitePath("3d-options", "media", "poster.jpg"),
    tags: ["3D 그래픽", "부위별 설명", "프리미엄"],
  },
] as const;

const selectedId = ref<(typeof samples)[number]["id"]>(samples[0].id);
const selected = computed(() => samples.find((sample) => sample.id === selectedId.value) ?? samples[0]);
</script>

<template>
  <section class="sf-wrap sf-samples">
    <header class="sf-sample-head">
      <div>
        <span class="sf-eyebrow">BOBAEDREAM AI VIDEO STUDIO</span>
        <h1>사진이 실제 매물 숏폼이 되는 방식</h1>
        <p>자막·음성·옵션 애니메이션까지 자동으로 완성된 영상 사례를 직접 재생해 보세요.</p>
      </div>
      <button class="btn is-main" type="button" @click="emit('go', 'new')">내 차량으로 만들기</button>
    </header>

    <div class="sf-sample-stage">
      <div class="card sf-sample-player">
        <video
          :key="selected.id"
          :src="selected.src"
          :poster="selected.poster"
          controls
          playsinline
          preload="metadata"
          :aria-label="`${selected.title} 샘플 영상`"
        />
      </div>
      <div class="sf-sample-info">
        <span class="badge is-making">선택한 샘플</span>
        <h2>{{ selected.title }}</h2>
        <p>{{ selected.desc }}</p>
        <dl>
          <div><dt>길이</dt><dd>{{ selected.duration }}</dd></div>
          <div><dt>화면</dt><dd>{{ selected.format }}</dd></div>
          <div><dt>추천</dt><dd>{{ selected.use }}</dd></div>
        </dl>
        <div class="sf-sample-tags">
          <span v-for="tag in selected.tags" :key="tag">{{ tag }}</span>
        </div>
      </div>
    </div>

    <div class="sf-sample-list" role="list" aria-label="샘플 영상 선택">
      <button
        v-for="sample in samples"
        :key="sample.id"
        type="button"
        role="listitem"
        :class="`card sf-sample-card ${selected.id === sample.id ? 'is-on' : ''}`"
        :aria-pressed="selected.id === sample.id"
        @click="selectedId = sample.id"
      >
        <span class="sf-sample-thumb"><img :src="sample.poster" alt="" loading="lazy" /><i aria-hidden="true">▶</i></span>
        <span>
          <b>{{ sample.title }}</b>
          <small>{{ sample.duration }} · {{ sample.use }}</small>
        </span>
      </button>
    </div>

    <div class="card sf-sample-cta">
      <div><b>사진 4장부터 바로 만들 수 있어요</b><span>차량 정보와 사진을 올리면 두 가지 영상 형식을 함께 제작합니다.</span></div>
      <button class="btn is-main" type="button" @click="emit('go', 'new')">새 영상 시작</button>
    </div>
  </section>
</template>
