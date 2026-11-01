<script setup lang="ts">
// 테스트 서버 「허위매물 운영정책」 팝업 원문을 초톳 바텀시트에 담는다. 아래 「동의하고 닫기」.
import Sheet from "./Sheet.vue";
import { POLICY_HTML } from "../lib/devform";
const emit = defineEmits<{ close: []; agree: [] }>();
</script>
<template>
  <Sheet title="허위매물 운영정책" full @close="emit('close')">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="policy" v-html="POLICY_HTML" />
    <template #foot><button type="button" class="btn btn--pri" @click="emit('agree')">동의하고 닫기</button></template>
  </Sheet>
</template>
