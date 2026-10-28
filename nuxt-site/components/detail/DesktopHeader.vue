<script setup lang="ts">
// 리액트 DesktopHeader(detail/index.tsx). onBack → emit("back").
import { useDetailUi } from "../../composables/detail/useDetailUi";
import { pcAsset } from "./detail-local";

const emit = defineEmits<{ back: [] }>();
const { notify } = useDetailUi();
const navItems = ["내차사기", "내차팔기", "딜러", "부품·용품", "커뮤니티", "컨텐츠", "더보기"];
const iconItems = [["검색", "img1IconSearchSize24"], ["마이페이지", "img1IconUserSmileSize24"], ["저장한 매물", "img1IconHeartSize24"], ["알림", "img1IconNoticeSize24"], ["전체 메뉴", "imgGroup1000005392"]];
</script>
<template>
  <header class="pc-header">
    <div class="pc-header-inner"><div class="pc-account"><button v-for="label in ['로그인', '회원가입', '고객센터']" :key="label" @click="notify(`${label}는 정식 서비스에서 이용해 주세요.`)">{{ label }}</button></div>
      <button class="pc-logo" aria-label="보배드림 목록" @click="emit('back')"><span><img :src="pcAsset('9546-imgGroup.svg')" alt="" /></span><img :src="pcAsset('9546-imgLogo.svg')" alt="보배드림" /></button>
      <div class="pc-navigation"><nav aria-label="주 메뉴"><button v-for="label in navItems" :key="label" :class="label === '커뮤니티' ? 'active' : ''" @click="label === '내차사기' ? emit('back') : notify(`${label}는 정식 서비스에서 이용해 주세요.`)">{{ label }}<img v-if="label === '더보기'" :src="pcAsset('9546-imgIcon.svg')" alt="" /></button></nav><div class="pc-nav-icons"><button v-for="[label, icon] in iconItems" :key="label" :aria-label="label" @click="label === '검색' ? emit('back') : notify(`${label}를 확인하려면 목록으로 돌아가 주세요.`)"><img :src="pcAsset(`9546-${icon}.svg`)" alt="" /></button></div></div>
    </div>
  </header>
</template>
