<script setup lang="ts">
// 사진 넣는 방법(보배드림 추가). 초톳은 추가 칸을 누르면 바로 앱 안 앨범(「Máy ảnh」 칸 + 사진 격자)이 열린다.
// 웹 시안은 휴대폰 앨범을 직접 그릴 수 없어, 같은 자리에 ① 촬영 키트(추천) ② 앨범 ③ 카메라 세 가지를 둔다.
import { ref } from "vue";
import Sheet from "./Sheet.vue";
import Ico from "./Ico.vue";
import { IC } from "../lib/icons";

defineProps<{ kit: boolean; catName: string }>();
const emit = defineEmits<{ close: []; kit: ["dealer" | "crew"]; album: []; camera: [] }>();
const role = ref<"dealer" | "crew">("dealer");
</script>
<template>
  <Sheet title="사진 · 영상 추가" @close="emit('close')">
    <div class="src-list">
      <template v-if="kit">
        <button type="button" class="src-btn is-pri" @click="emit('kit', role)">
          <span class="src-btn__ico"><Ico :src="IC.camera" /></span>
          <b>촬영 키트로 찍기<span class="tag">추천</span></b>
          <small>{{ catName }} 각도 안내대로 찍고, 영상 · 쇼츠까지 한 번에 넘겨요</small>
        </button>
        <div class="role-row" role="radiogroup" aria-label="촬영하는 사람">
          <button type="button" class="pill" :class="{ 'is-on': role === 'dealer' }" role="radio" :aria-checked="role === 'dealer'" @click="role = 'dealer'">딜러 간편</button>
          <button type="button" class="pill" :class="{ 'is-on': role === 'crew' }" role="radio" :aria-checked="role === 'crew'" @click="role = 'crew'">촬영팀 전문</button>
        </div>
      </template>
      <button type="button" class="src-btn" @click="emit('album')">
        <span class="src-btn__ico"><Ico :src="IC.album" /></span>
        <b>앨범에서 고르기</b>
        <small>사진 · 영상을 여러 장 한 번에 고를 수 있어요</small>
      </button>
      <button type="button" class="src-btn" @click="emit('camera')">
        <span class="src-btn__ico"><Ico :src="IC.video" /></span>
        <b>카메라로 바로 찍기</b>
        <small>한 장씩 찍어서 바로 올려요</small>
      </button>
    </div>
    <p class="src-note">사진은 최대 30장, 첫 사진이 대표 사진이에요. 영상을 넣으면 매물이 더 잘 보여요.</p>
  </Sheet>
</template>
