<script setup lang="ts">
// 리액트 src/prototype/build-badge.tsx 의 BuildBadge. OP-011: 주소에 &debug=1 이 있을 때만 오른쪽 아래에
// "브랜치 @ 커밋 7자리 · 빌드 시각"을 보여 준다. buildInfo 는 공용 파일에서 그대로 가져온다.
import { buildInfo } from "@proto/build-badge";
import DebugTools from "./DebugTools.vue";
import "@proto/build-badge.css";

const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";
</script>
<template>
  <div v-if="debug" class="debug-dock">
    <DebugTools />
    <div class="build-badge" role="status" aria-label="빌드 버전" :data-commit="buildInfo.commit">
      {{ buildInfo.branch }} @ {{ buildInfo.commit }}{{ buildInfo.time ? ` · ${buildInfo.time}` : "" }}
    </div>
  </div>
</template>
