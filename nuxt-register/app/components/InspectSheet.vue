<script setup lang="ts">
// 테스트 서버 「성능 · 상태 점검기록부」: 제시번호(12자) 입력 + 과태료 안내. 초톳 바텀시트 · 테두리 입력칸 모양.
import { ref } from "vue";
import Sheet from "./Sheet.vue";
import OField from "./OField.vue";
import { INSPECTION_WARN } from "../lib/devform";
const props = defineProps<{ value: string }>();
const emit = defineEmits<{ close: []; apply: [string] }>();
const no = ref(props.value);
</script>
<template>
  <Sheet title="성능 · 상태 점검기록부" @close="emit('close')">
    <div class="inspect">
      <OField id="f-inspect" v-model="no" label="제시번호" :maxlength="12" clearable placeholder="제시번호를 입력해 주세요" @clear="no = ''" />
      <ul class="inspect__warn">
        <li v-for="w in INSPECTION_WARN" :key="w">{{ w }}</li>
      </ul>
    </div>
    <template #foot><button type="button" class="btn btn--pri" @click="emit('apply', no.trim())">저장</button></template>
  </Sheet>
</template>
