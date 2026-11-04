<script setup lang="ts">
// 목록 화면 맨 위 줄(.appbar). 정적 판 naver-cafe-list.html 의 <header class="appbar"> 와 같은 구조.
const props = defineProps<{ section: string }>()
const emit = defineEmits<{ search: []; menu: []; section: [name: string] }>()
const a = (p: string) => communityAsset(p)
const site = (p: string) => siteAsset(p)
const tabs: Array<[string, string]> = [['home', '홈'], ['board', '게시판'], ['report', '제보'], ['defect', '결함']]
function goMain() { location.href = siteAsset('') }
function goProfile() { location.href = communityAsset('reddit-profile.html') }
</script>

<template>
  <header class="appbar">
    <button class="back" aria-label="보배드림 메인으로" @click="goMain"><img :src="site('assets/bbm/m-header-back.svg')" alt=""></button>
    <button class="communitySearch" type="button" aria-label="커뮤니티 검색" @click="emit('search')"><img :src="a('assets/chotot-search-gray.svg')" alt=""><span>커뮤니티</span></button>
    <button class="headerProfile" type="button" aria-label="내 프로필" @click="goProfile"><img :src="a('assets/profile-avatars/naver-stock-default.png')" alt=""></button>
    <nav class="communitySectionNav" aria-label="커뮤니티 영역">
      <button
        v-for="[id, label] in tabs"
        :key="id"
        :class="['communitySectionTab', { on: props.section === id }]"
        type="button"
        :data-community-section="id"
        :aria-current="props.section === id ? 'page' : undefined"
        @click="emit('section', id)"
      >{{ label }}</button>
    </nav>
    <button class="communityHeaderSearchBar" type="button" aria-label="커뮤니티 게시글 검색" @click="emit('search')"><img :src="a('assets/community-title-search.svg')" alt=""><span>게시글 검색</span></button>
    <button class="communityTitleSearch" type="button" aria-label="커뮤니티 검색" @click="emit('search')"><img :src="a('assets/community-title-search.svg')" alt=""></button>
    <button class="headerAction hamburger" aria-label="전체 메뉴" @click="emit('menu')"><img class="headerAsset headerMenu" :src="a('assets/chotot-hamburger.svg')" alt=""><img class="headerAsset variantHeaderMenu" :src="a('assets/community-title-menu.svg')" alt=""></button>
  </header>
</template>
