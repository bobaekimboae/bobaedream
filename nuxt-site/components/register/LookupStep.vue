<script setup lang="ts">
// 리액트 src/prototype/register/index.tsx 의 LookupStep — 1단계: 유형 · 차량번호 · 임시번호 · 약관 동의 → 다음.
// onNext → emit("next"), notify 는 함수 prop(리액트와 같은 이름).
// 리액트 판에서도 지금은 CarRegisterPage 가 ChototParityRegister 만 그려 이 화면은 주소로 열리지 않는다(리액트와 같이 옮겨만 둔다).
import { ref, computed } from "vue";
import { mockLookup } from "@proto/register/data";
import { registerPolicyHtml } from "@proto/register/header-html";
import MobileHeader from "./MobileHeader.vue";
import FloatInput from "./ui/FloatInput.vue";
import Checkbox from "./ui/Checkbox.vue";
import ConfirmModal from "./ui/ConfirmModal.vue";
import Pop from "./ui/Pop.vue";

const props = defineProps<{ notify: (message: string) => void }>();
const emit = defineEmits<{ next: [] }>();
const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ");
const categories = [["자동차", "자동차"], ["오토바이", "오토바이"], ["화물·트럭", "화물 · 트럭"], ["기타", "기타"]];

const plate = ref("");
const imported = ref(false);
const agree = ref(false);
const policyOpen = ref(false);
const confirmOpen = ref(false);
// dev와 같이 차량번호만 있으면 「다음」이 켜지고, 동의 전에 누르면 「허위매물 운영정책에 동의하시겠습니까?」 확인창을 띄운다(2026-10-09 dev 크로스체크)
const ready = computed(() => plate.value.trim() !== "");
const lookup = () => {
  if (plate.value.replace(/\s/g, "") !== mockLookup.plate) { props.notify(`목업 조회는 ${mockLookup.plate}만 지원합니다.`); return; }
  emit("next");
};
const submit = () => {
  if (!ready.value) return;
  if (!agree.value) { confirmOpen.value = true; return; }
  lookup();
};
const goBack = () => window.history.back();
const confirm = () => { confirmOpen.value = false; agree.value = true; lookup(); };
</script>
<template>
  <section class="app-content-panel car-register-page">
    <MobileHeader title="매물 등록" class-name="car-register-mobile-header" @back="goBack" />
    <main class="mobile-page-main car-register-main" aria-label="매물 등록">
      <section class="ui-content-card car-register-lookup-card">
        <div class="car-register-lookup-card__body ui-content-card__body">
          <div class="car-register-lookup-content">
            <div class="car-lookup-fields">
              <div class="ui-choice-group ui-choice-group--sm ui-choice-group--mobile-sm car-register-category-choice" id="s1Cat">
                <label v-for="([value, label], index) in categories" :key="value" :class="cx('s1-ct', index === 0 ? 'is-selected' : 'is-disabled', 'ui-choice')">
                  <input :id="index === 0 ? 'cat-car' : `category-${index}`" type="radio" name="category" :value="value" :checked="index === 0" :disabled="index > 0" />
                  <span class="ui-choice__button"><span class="ui-choice__label">{{ label }}</span></span>
                </label>
              </div>
              <div class="car-form-group">
                <FloatInput label="차량번호" required class-name="car-register-number-input" id="f_vnum" name="vnum" :max-length="20" :value="plate" message="등록할 차량번호를 띄어쓰기 없이 입력해주세요" @change="plate = $event" />
                <div class="s1-import-row">
                  <Checkbox class-name="s1-import" id="import" name="import" :checked="imported" label="임시번호/직수입 차량등록" @change="imported = $event" />
                  <button type="button" class="s1-import-link" @click="notify('임시저장 목록은 정식 서비스에서 이용해 주세요.')">임시저장 (0)</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <footer class="car-register-lookup-card__footer ui-content-card__footer">
          <div class="s1-policy">
            <p class="s1-policy-text"><button type="button" class="s1-policy-text-strong" @click="policyOpen = true">허위매물 운영정책</button>{{ " " }}에 위반될 경우,<br />별도의 환불 없이 광고가 삭제되며 이용이 제한될 수 있습니다.</p>
            <Checkbox class-name="s1-policy-check" id="policy_agree" name="policy_agree" :checked="agree" label="위 내용을 확인하였으며 이에 동의합니다. (필수)" @change="agree = $event" />
          </div>
          <div class="car-register-next-action">
            <button type="button" class="ui-btn ui-btn--primary ui-btn--xl ui-btn--mobile-xl ui-btn--align-center ui-btn--full car-register-next-button" :disabled="!ready" @click="submit"><span class="ui-btn__label">다음</span></button>
          </div>
        </footer>
      </section>
    </main>
    <ConfirmModal :open="confirmOpen" title="허위매물 운영정책에 동의하시겠습니까?" cancel-label="아니요" confirm-label="동의" @cancel="confirmOpen = false" @confirm="confirm" />
    <Pop :open="policyOpen" title="허위매물 운영정책" raw-body @close="policyOpen = false">
      <div class="s1-policy-modal pop-body" v-html="registerPolicyHtml" />
    </Pop>
  </section>
</template>
