<script setup lang="ts">
// 원본 My Projects: 처리된 사진이 8장 이상인 프로젝트만. 없으면 「사진 올리기」
import Icon from "./Icon.vue";
import TopBack from "./TopBack.vue";
import { PROJECTS } from "../lib/projects";
import { rd } from "../lib/site";
const emit = defineEmits<{ back: []; go: [v: string, extra?: Record<string, string>] }>();
const list = PROJECTS.filter((p) => p.photos.length >= 8);
</script>
<template>
  <TopBack @back="emit('back')" />
  <main class="page">
    <h1 class="h1">내 프로젝트</h1>
    <p class="lead" style="margin-bottom: 11.7px">차량을 고르세요. 사진과 정보가 바로 채워져요.</p>
    <p class="note">처리된 사진이 8장 이상인 프로젝트만 보여요.</p>
    <div v-if="list.length" class="proj-list">
      <button v-for="p in list" :key="p.id" class="proj" type="button" @click="emit('go', 'details', { project: p.id })">
        <img :src="p.photos[0]" alt="" />
        <span><b>{{ p.title }}</b><span>{{ p.details.year }}년식 · 사진 {{ p.photos.length }}장 · {{ p.company }}</span></span>
        <Icon :src="rd('back-outline-24')" style="transform: rotate(180deg); color: #999" />
      </button>
    </div>
    <div v-else class="proj-empty">
      <b>아직 프로젝트가 없어요</b>
      <p>사진을 새로 올리면 영상을 만들 수 있어요.</p>
      <button class="btn or" type="button" @click="emit('go', 'details')">사진 올리기</button>
    </div>
  </main>
</template>
