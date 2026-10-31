<script setup lang="ts">
// 로그인 · 가입: autohaus-video 로그인 화면과 같은 구성.
// 왼쪽 소개(제목 · 한 줄 · 장점 3개) + 오른쪽 양식(「다시 오셨네요 / 계정 만들기」, 구글 버튼, 「또는 이메일로」, 이메일 · 비밀번호).
// 가입하면 「확인 메일을 보냈어요」 화면이 나온다(시안: 메일은 가지 않고 「확인 완료」 버튼으로 이어 간다).
import { ref } from "vue";
import Brand from "./Brand.vue";
import Icon from "./Icon.vue";
import { confirmSignUp, signIn, signInWithGoogle, signUp } from "../lib/auth";
import { rd } from "../lib/site";

const emit = defineEmits<{ done: [] }>();
const mode = ref<"login" | "register">("login");
const email = ref("");
const password = ref("");
const error = ref("");
const busy = ref(false);
const sentTo = ref("");
const POINTS = ["사진만 올리면 1분 안팎에 완성", "보배드림 · 인스타 · 틱톡 · 쇼츠에 바로 올리기", "형식 A + B 포함"];

function toggle() {
  mode.value = mode.value === "login" ? "register" : "login";
  error.value = "";
}
function submit() {
  error.value = "";
  busy.value = true;
  try {
    if (mode.value === "login") {
      signIn(email.value, password.value);
      emit("done");
    } else {
      sentTo.value = signUp(email.value, password.value);
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : "다시 시도해 주세요.";
  } finally {
    busy.value = false;
  }
}
function google() {
  signInWithGoogle();
  emit("done");
}
function confirm() {
  confirmSignUp(sentTo.value);
  emit("done");
}
</script>
<template>
  <div v-if="sentTo" class="sf-auth is-sent">
    <div class="card sf-sent" role="status">
      <span class="ico-wrap"><Icon :src="rd('checkmark-fill')" /></span>
      <h2>확인 메일을 보냈어요</h2>
      <p><b>{{ sentTo }}</b>로 링크를 보냈어요. 링크를 눌러 계정을 켜 주세요.</p>
      <p class="sf-hint">시안이라 실제 메일은 가지 않아요. 아래 버튼으로 확인을 마친 것처럼 이어 갈 수 있어요.</p>
      <button class="btn is-main" type="button" @click="confirm">확인 완료하고 시작</button>
    </div>
  </div>
  <div v-else class="sf-auth">
    <section class="sf-auth-hero">
      <Brand />
      <div>
        <h1>사진만 올리면 완성되는<br />중고차 쇼츠.</h1>
        <p>사진을 올리면 영상이 나와요 — 카메라도, 촬영팀도 없이.</p>
        <ul>
          <li v-for="t in POINTS" :key="t"><span><Icon :src="rd('checkmark-fill')" /></span>{{ t }}</li>
        </ul>
      </div>
    </section>
    <section class="sf-auth-form">
      <div class="sf-auth-brand"><Brand /></div>
      <h2>{{ mode === "login" ? "다시 오셨네요" : "계정 만들기" }}</h2>
      <p class="sf-auth-switch">
        {{ mode === "login" ? "계정이 없으세요?" : "이미 가입하셨나요?" }}
        <button type="button" @click="toggle">{{ mode === "login" ? "가입하기" : "로그인" }}</button>
      </p>
      <button class="btn sf-google" type="button" @click="google">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Google로 {{ mode === "login" ? "로그인" : "가입" }}
      </button>
      <div class="sf-or"><span>또는 이메일로</span></div>
      <form class="sf-auth-fields" novalidate @submit.prevent="submit">
        <div class="sf-field"><label for="a-mail">이메일</label><input id="a-mail" v-model="email" type="email" placeholder="name@company.co.kr" autocomplete="email" required /></div>
        <div class="sf-field">
          <label for="a-pw">비밀번호</label>
          <input id="a-pw" v-model="password" type="password" :placeholder="mode === 'register' ? '8자 이상' : ''" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" required />
        </div>
        <p v-if="error" class="sf-warn" role="alert">{{ error }}</p>
        <button class="btn is-main" type="submit" :disabled="busy">{{ mode === "login" ? "로그인" : "계정 만들기" }}</button>
      </form>
      <p class="sf-hint">시안이라 계정은 이 브라우저에만 기억해요. 비밀번호는 저장하지 않아요.</p>
    </section>
  </div>
</template>
