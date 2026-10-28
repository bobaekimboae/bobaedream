<script setup lang="ts">
import { ref } from "vue";
import LookupStep from "../components/register/LookupStep.vue";
import RegisterForm from "../components/register/RegisterForm.vue";
import Toast from "../components/register/Toast.vue";
import { useToast } from "../composables/register/useToast";
const { toast, notify } = useToast();
const step = ref(new URLSearchParams(location.search).get("hstep") === "form" ? "form" : "lookup");
</script>
<template>
  <div class="bbm-register">
    <div class="app-shell"><main class="app-shell__content"><div class="app-shell__content-inner">
      <LookupStep v-if="step === 'lookup'" :notify="notify" @next="step = 'form'" />
      <RegisterForm v-else :notify="notify" @back="step = 'lookup'" />
    </div></main></div>
    <Toast :text="toast" />
  </div>
</template>
