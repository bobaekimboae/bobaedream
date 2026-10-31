<script setup lang="ts">
// 촬영 쇼츠 키트 한 화면 앱. 주소 검색어(?vstage=58 · ?debug · ?fakecam · ?guide=on)는 리액트 판과 같게 쓴다.
// ?shoot=<촬영 번호> = 올린 내용 보기(2026-10-31 실제 업로드)
import ShootRegister from "~/components/shoot/ShootRegister.vue";
import ShootView from "~/components/shoot/ShootView.vue";

const shootId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("shoot") : null;
</script>
<template>
  <ShootView v-if="shootId" :id="shootId" />
  <ShootRegister v-else />
</template>
