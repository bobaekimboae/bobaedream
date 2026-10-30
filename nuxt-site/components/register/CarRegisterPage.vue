<script setup lang="ts">
// 리액트 src/prototype/register/index.tsx 의 CarRegisterPage. 지금은 리액트와 같이 ChototParityRegister 만 그린다
// (LookupStep · RegisterForm 은 리액트에서도 쓰이지 않지만 같은 모양으로 옮겨 두었다).
import { onBeforeUnmount, onMounted } from "vue";
import ChototParityRegister from "./ChototParityRegister.vue";
import Toast from "./Toast.vue";
import { useToast } from "../../composables/register/useToast";

const { toast, notify } = useToast();
onMounted(() => {
  document.documentElement.classList.add("bbm-register-page");
  document.title = "매물 등록 - 보배드림";
  window.scrollTo(0, 0);
});
onBeforeUnmount(() => document.documentElement.classList.remove("bbm-register-page"));
</script>
<template>
  <div class="bbm-register">
    <div class="app-shell">
      <main class="app-shell__content">
        <div class="app-shell__content-inner">
          <ChototParityRegister :notify="notify" />
        </div>
      </main>
    </div>
    <Toast :text="toast" />
  </div>
</template>
