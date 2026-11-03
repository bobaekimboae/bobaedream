<script setup lang="ts">
// 원본 Profile 자리: 마지막 장면에 넣을 딜러 정보를 기억해 둔다(다음 영상부터 자동으로 채움)
import Icon from "./Icon.vue";
import { saveProfile, state } from "../lib/store";
import { as, ct, rd, sitePath } from "../lib/site";
const emit = defineEmits<{ go: [v: string, extra?: Record<string, string>]; pay: []; toast: [t: string] }>();
function save() { saveProfile(); emit("toast", "저장했어요. 다음 영상의 마지막 장면에 넣어 드려요."); }
const shoot = sitePath("nuxt-shootkit", "");
</script>
<template>
  <main class="prof">
    <h1 class="h1" style="margin-top: 28px">프로필</h1>
    <p class="lead">마지막 장면에 들어갈 정보예요. 한 번 적어 두면 다음 영상부터 채워져요.</p>
    <div class="fld"><div class="fld-l">이름</div><input v-model="state.profile.name" class="inp" /></div>
    <div class="fld"><div class="fld-l">딜러 · 상사 이름</div><input v-model="state.profile.dealer" class="inp" /></div>
    <div class="fld"><div class="fld-l">전화</div><input v-model="state.profile.phone" class="inp" inputmode="tel" /></div>
    <div class="fld"><div class="fld-l">주소</div><input v-model="state.profile.address" class="inp" /></div>
    <button class="btn or" type="button" style="width: 100%" @click="save">저장</button>
    <button class="btn line" type="button" style="width: 100%; margin-top: 10px" @click="emit('pay')">크레딧 {{ state.credits }}개 · 더 사기</button>
  </main>
  <nav class="nav" aria-label="아래 메뉴">
    <button type="button" @click="emit('go', 'home')"><Icon :src="as('complex-home-as24')" />홈</button>
    <a class="fab" :href="shoot" aria-label="사진 촬영" style="display: flex; align-items: center"><Icon :src="rd('camera-outline-24')" /></a>
    <button type="button" aria-current="page"><Icon :src="ct('chotot-common-user')" />프로필</button>
  </nav>
</template>
