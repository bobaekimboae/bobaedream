<script setup lang="ts">
// 정적 bobaedream-pc-interactions.js showLoginModal(): body 맨 끝에 붙는 시안용 로그인 창
import { usePcUi } from '~/composables/pc/usePcBoard'

const { loginOpen, confirmLogin, cancelLogin } = usePcUi()
</script>

<template>
  <Teleport to="body">
    <div v-if="loginOpen" class="mockLoginBackdrop">
      <div class="mockLoginModal" role="dialog" aria-modal="true" aria-label="로그인 필요">
        <div class="mockLoginTitle">보배드림</div>
        <div class="mockLoginBody">로그인이 필요한 서비스입니다.</div>
        <div class="mockLoginActions"><button class="mockLoginCancel" @click="cancelLogin">취소</button><button class="mockLoginConfirm" @click="confirmLogin">로그인</button></div>
      </div>
    </div>
  </Teleport>
</template>
