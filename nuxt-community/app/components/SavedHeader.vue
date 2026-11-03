<script setup lang="ts">
const props = defineProps<{ siteBase: string }>()
const savedIcons = `${useRuntimeConfig().app.baseURL}icons/saved/`
const query = ref('')
const menu = ref(false)
const regionOpen = ref(false)
const region = ref('전국')
const root = useListingHomeUrl(props.siteBase)
function search() { location.assign(`${root.value}&q=${encodeURIComponent(query.value)}`) }
function closeMenus(e: KeyboardEvent) { if(e.key === 'Escape') {menu.value=false;regionOpen.value=false} }
onMounted(()=>document.addEventListener('keydown',closeMenus))
onBeforeUnmount(()=>document.removeEventListener('keydown',closeMenus))
</script>

<template>
  <header class="saved-site-header">
    <div class="saved-brand-line">
      <button class="saved-icon-button" aria-label="전체 메뉴" :aria-expanded="menu" @click="menu = !menu"><img :src="`${siteBase}assets/bbm/header-menu.svg`" alt="" /></button>
      <a :href="root" class="saved-logo" aria-label="보배드림 홈"><img :src="`${siteBase}assets/bbm/main-home-logo.svg`" alt="보배드림" /></a>
      <a :href="`${siteBase}?register=1`" class="saved-mobile-publish">매물등록</a>
    </div>
    <div class="saved-region-wrap">
      <button class="saved-region" :aria-expanded="regionOpen" @click="regionOpen=!regionOpen"><img :src="`${siteBase}assets/bbm/m-region-location.svg`" alt="" /><span>{{ region }}</span><img :src="`${siteBase}assets/bbm/chip-chevron-down.svg`" alt="" /></button>
      <div v-if="regionOpen" class="saved-region-panel"><a v-for="r in ['전국','서울','경기','인천','부산','대구','광주','대전','울산','세종','강원','충북','충남','전북','전남','경북','경남','제주']" :key="r" :href="r==='전국'?root:`${root}&q=${encodeURIComponent(r)}`">{{ r }}</a></div>
    </div>
    <div class="saved-search-line">
      <form class="saved-site-search" role="search" @submit.prevent="search"><img :src="`${siteBase}assets/bbm/header-search.svg`" alt="" /><input v-model="query" aria-label="차량 검색" placeholder="어떤 차를 찾으세요?" /><button aria-label="검색" type="submit"><img :src="`${siteBase}assets/bbm/header-search.svg`" alt="" /></button></form>
      <NuxtLink class="saved-icon-button saved-header-heart" to="/saved" aria-label="저장 목록"><img :src="`${siteBase}assets/bbm/header-heart.svg`" alt="" /></NuxtLink>
      <NuxtLink class="saved-icon-button saved-notifications" to="/account?initial=searches" aria-label="저장한 검색 알림"><img :src="`${siteBase}assets/bbm/header-notification.svg`" alt="" /></NuxtLink>
      <NuxtLink class="saved-contact" to="/account?initial=support"><img :src="`${savedIcons}chat.svg`" alt="" /><span>문의하기</span></NuxtLink>
      <NuxtLink class="saved-manage" to="/account?initial=dealer">매물관리</NuxtLink>
      <a class="saved-publish" :href="`${siteBase}?register=1`">매물등록</a>
      <button class="saved-profile bbm-account-button" aria-label="로그인 및 계정 메뉴"><img :src="`${siteBase}assets/bbm/favicon.svg`" alt="" /><img :src="`${siteBase}assets/bbm/chip-chevron-down.svg`" alt="" /></button>
    </div>
    <nav v-if="menu" class="saved-menu-panel" aria-label="보배드림 바로가기"><a :href="root">전체 차량</a><a :href="`${siteBase}community/naver-cafe-list.html`">커뮤니티</a><NuxtLink to="/saved" @click="menu=false">저장 목록</NuxtLink><NuxtLink to="/account" @click="menu=false">마이</NuxtLink></nav>
  </header>
</template>

<style>
.saved-site-header{height:65px;display:flex;align-items:center;gap:16px;padding:12px 32px;background:#fff;border-bottom:1px solid #eee;position:relative;z-index:20;font-size:14px;line-height:20px;color:#222}
.saved-brand-line{display:flex;align-items:center;gap:32px;flex-shrink:0}.saved-logo img{display:block;width:96px;height:26px;object-fit:contain}.saved-icon-button{width:32px;height:32px;display:grid;place-items:center;flex-shrink:0}.saved-icon-button img{width:24px;height:24px}.saved-region-wrap{position:relative}.saved-region{height:40px;border-radius:24px;background:#f4f4f4;display:flex;align-items:center;gap:8px;padding:0 16px;font-weight:600;white-space:nowrap}.saved-region img:first-child{width:20px;height:20px}.saved-region img:last-child{width:16px;height:16px}.saved-search-line{display:flex;align-items:center;gap:12px;flex:1;min-width:0}.saved-site-search{display:flex;align-items:center;gap:8px;padding:4px 6px 4px 12px;height:40px;border-radius:24px;background:#f4f4f4;flex:1;min-width:80px;margin-right:12px}.saved-site-search>img{width:20px;height:20px;opacity:.5}.saved-site-search input{width:100%;min-width:0;border:0;outline:0;background:none;font-size:14px;line-height:20px}.saved-site-search button{border-radius:50%;background:#2f6fe4;display:grid;place-items:center;width:32px;height:32px;flex-shrink:0}.saved-site-search button img{width:20px;height:20px;filter:brightness(0) invert(1)}.saved-contact,.saved-manage,.saved-publish,.saved-profile{height:40px;display:flex;align-items:center;justify-content:center;border:1px solid #eee;border-radius:24px;padding:0 16px;gap:8px;white-space:nowrap;font-weight:600;flex-shrink:0}.saved-contact img{width:20px;height:20px}.saved-publish{background:#2f6fe4;color:#fff;border-color:#2f6fe4}.saved-profile{padding:0 8px}.saved-profile img:first-child{width:32px;height:32px}.saved-profile img:last-child{width:20px;height:20px}.saved-mobile-publish{display:none}.saved-menu-panel,.saved-region-panel{position:absolute;top:56px;left:24px;width:220px;padding:8px;background:#fff;border:1px solid #eee;border-radius:12px;box-shadow:0 8px 24px #0002}.saved-menu-panel a,.saved-region-panel a{display:block;padding:12px;border-radius:6px}.saved-menu-panel a:hover,.saved-region-panel a:hover{background:#f4f4f4}.saved-region-panel{top:48px;left:0;width:240px;display:grid;grid-template-columns:repeat(3,1fr)}
@media(max-width:1023px){.saved-site-header{gap:12px;padding-inline:16px}.saved-brand-line{gap:16px}.saved-region-wrap{display:none}.saved-contact span{display:none}.saved-contact{padding:0;width:40px}}
@media(max-width:767px){.saved-site-header{height:104px;display:block;padding:0;border:0}.saved-brand-line{height:56px;padding:8px 16px;display:grid;grid-template-columns:80px 1fr 80px}.saved-logo{justify-self:center}.saved-mobile-publish{display:flex;align-items:center;justify-content:center;height:32px;border-radius:24px;background:#2f6fe4;color:#fff;font-size:14px;font-weight:600}.saved-search-line{height:48px;padding:0 8px 8px 12px;gap:8px}.saved-site-search{height:40px;margin:0;padding:8px 12px;min-width:0}.saved-site-search button{display:none}.saved-notifications,.saved-manage,.saved-publish,.saved-profile{display:none}.saved-contact{height:32px;width:28px;border:0}.saved-contact img{width:24px;height:24px}.saved-header-heart{width:28px}.saved-menu-panel{top:52px;left:12px}}
</style>
