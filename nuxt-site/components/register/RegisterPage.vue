<script setup lang="ts">
// 리액트 src/prototype/register/index.tsx 의 RegisterPage(맨 아래 주소별 화면 고르기).
// register=shootsimple · shoot · bike(또는 category=바이크)는 각 화면의 Vue 판을 그린다. 그 밖은 자동차 매물 등록(CarRegisterPage).
// register=shootkit(촬영 쇼츠 키트)은 이미 따로 된 넉스트 앱(/bobaedream/nuxt-shootkit/)으로 옮겨져 있어서, 여기서 다시 그리지 않고
// 그 주소로 바꿔 보낸다(register 를 뺀 나머지 검색어는 그대로). 문서 기준 주소가 <base href="/bobaedream/"> 라 그 기준으로 계산한다.
import "@proto/preload-guard";
import "@proto/listing/bbm-list-area.css";
import "@proto/register/register.css";
import BikeRegister from "./BikeRegister.vue";
import ShootRegister from "./shoot/ShootRegister.vue";
import ShootSimplePrototype from "./shoot-simple/ShootSimplePrototype.vue";
import CarRegisterPage from "./CarRegisterPage.vue";

const params = new URLSearchParams(window.location.search);
const mode = params.get("register");
const view = mode === "shootsimple" ? "shootsimple"
  : mode === "shoot" ? "shoot"
  : mode === "shootkit" ? "shootkit"
  : mode === "bike" || params.get("category") === "바이크" ? "bike"
  : "car";
if (view === "shootkit") {
  const rest = new URLSearchParams(window.location.search);
  rest.delete("register");
  const target = new URL("nuxt-shootkit/", document.baseURI);
  target.search = rest.toString();
  target.hash = window.location.hash;
  window.location.replace(target.toString());
}
</script>
<template>
  <ShootSimplePrototype v-if="view === 'shootsimple'" />
  <ShootRegister v-else-if="view === 'shoot'" />
  <template v-else-if="view === 'shootkit'" />
  <BikeRegister v-else-if="view === 'bike'" />
  <CarRegisterPage v-else />
</template>
