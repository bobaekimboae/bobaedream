<script setup lang="ts">
// 내 정보 · 스튜디오 설정(Car Studio Profile · Studio Settings 자리). 영상 끝 장면 명함에 쓰는 값만 이 브라우저에 둔다.
import { reactive } from "vue";
import Icon from "./Icon.vue";
import { go, say, ui } from "../lib/app";
import { I, sitePath } from "../lib/site";
import { readProfile, writeProfile } from "../lib/store";

const p = reactive(readProfile());
function save() {
  if (/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/.test(p.phone)) return say("휴대폰 번호 대신 상사 대표 번호나 050 안심번호를 넣어 주세요.");
  writeProfile({ ...p });
  say("저장했어요.");
}
</script>
<template>
  <section style="max-width: 720px; margin: 0 auto; display: grid; gap: 16px">
    <div class="ord-top"><h1>내 정보</h1></div>
    <div class="sec">
      <h2>판매자 정보 <small style="font-weight: 500; color: var(--sub); font-size: 12px">영상 끝 장면에 들어가요</small></h2>
      <div class="cols">
        <label class="field"><span>딜러 이름</span><input v-model="p.name" class="input" /></label>
        <label class="field"><span>상사</span><input v-model="p.company" class="input" /></label>
        <label class="field"><span>대표 번호</span><input v-model="p.phone" class="input" placeholder="050 안심번호 권장" /></label>
      </div>
      <button class="btn btn-pri" type="button" style="justify-self: start" @click="save">저장</button>
    </div>
    <div class="sec">
      <h2>크레딧</h2>
      <div class="row"><span>남은 크레딧 <b style="font-size: 20px">{{ ui.credits }}</b>개</span><button class="btn btn-dark btn-sm" type="button" @click="ui.buyOpen = true"><Icon :src="I.spark" /> 더 사기</button></div>
      <button class="btn btn-line btn-sm" type="button" style="justify-self: start" @click="go('pricing')">요금제 보기</button>
    </div>
    <div class="sec">
      <h2>촬영 키트 연동</h2>
      <p style="margin: 0; color: var(--sub)">촬영 키트에서 각도 안내를 따라 찍은 사진을 이 편집기로 가져와 배경 · 번호판을 처리하고, 영상까지 만들 수 있어요.</p>
      <a class="btn btn-line btn-sm" style="justify-self: start" :href="sitePath('nuxt-shootkit') + '/'"><Icon :src="I.camera" /> 촬영 키트 열기</a>
    </div>
  </section>
</template>
