<script setup lang="ts">
import type { DemoVehicle } from '~/services/accountDemo'
import { savedTab, savedVehicleUrl, type SavedTab } from '~/services/savedListings'

const route = useRoute(), router = useRouter()
const d = useAccountDemo()
const { state, error } = d
const siteBase = useRuntimeConfig().app.baseURL.replace(/nuxt-community\/$/, '')
const icons = `${useRuntimeConfig().app.baseURL}icons/saved/`
const tab = computed(() => savedTab(route.query.tab))
const rows = ref<DemoVehicle[]>([])
const ready = ref(false)
const base = useListingHomeUrl(siteBase)
const tabs: {id:SavedTab;label:string}[] = [{id:'ad',label:'매물'},{id:'video',label:'영상'},{id:'post',label:'게시글'}]
const selectedKind = computed(()=>tabs.find(t=>t.id===tab.value)!.label)
const hasRows = computed(()=>tab.value==='ad' && rows.value.length>0)
const isSaved = (id:string) => state.value.favorites.some(v=>v.id===id)
const image = (src:string) => /^https?:/.test(src) ? src : `${siteBase}assets/${src}`
const unavailable = (v:DemoVehicle) => v.unavailable || v.status==='sold'
function vehicleHref(v:DemoVehicle) { try {return savedVehicleUrl(v,location.origin,siteBase,matchMedia("(min-width:768px)").matches)} catch {return '#'} }
function avatarFallback(event:Event) { const el=event.target as HTMLImageElement; if(!el.src.endsWith('/default-user.png'))el.src=`${icons}default-user.png` }
const chatVehicle = computed(()=>rows.value.find(v=>v.id===route.query.chat)||null)
const draft = ref('')
const drafts = ref<Record<string,string>>({})
const draftNotice = ref('')

useHead({ title:'저장 목록 · 보배드림',htmlAttrs:{class:'saved-document'},bodyAttrs:{class:'saved-body'},link:[{rel:'stylesheet',href:`${siteBase}assets/fonts/pretendard/pretendard-guazi.css`}],script:[{src:`${siteBase}assets/account-menu-bridge.js?v=saved-20261103`,defer:true}] })
onMounted(()=>{ rows.value=structuredClone(toRaw(state.value.favorites)); ready.value=true; error.value='' })
watch(()=>state.value.favorites,values=>{ if(!ready.value)return; for(const v of values)if(!rows.value.some(r=>r.id===v.id))rows.value.unshift(structuredClone(toRaw(v))) },{deep:true})
function chooseTab(value:SavedTab) { router.push({path:'/saved',query:{...route.query,tab:value}}) }
function toggle(v:DemoVehicle) { d.toggleFavorite(v) }
function open(v:DemoVehicle) {
  if(unavailable(v))return
  try { const url=savedVehicleUrl(v,location.origin,siteBase,matchMedia("(min-width:768px)").matches); d.recordVehicle(v); location.assign(url) } catch(e) {error.value=e instanceof Error?e.message:'매물을 열 수 없습니다.'}
}
function startChat(v:DemoVehicle) {
  router.push({path:'/saved',query:{...route.query,chat:v.id}})
}
watch(chatVehicle,v=>{
  draftNotice.value=''; draft.value=v?drafts.value[v.id]||'':''
  nextTick(()=>document.querySelector<HTMLTextAreaElement>('.saved-chat textarea')?.focus())
})
function closeChat(){
  if(typeof history.state.back==='string' && history.state.back.includes('/saved') && !history.state.back.includes('chat=')) {router.back();return}
  const query={...route.query};delete query.chat;router.replace({path:'/saved',query})
}
function saveDraft() { if(!chatVehicle.value || !draft.value.trim())return; try { drafts.value[chatVehicle.value.id]=draft.value.trim(); localStorage.setItem('bbm.account.chat-drafts.v1',JSON.stringify(drafts.value));draftNotice.value='문의 내용을 임시 저장했습니다. 실제 판매자에게 전송되지 않습니다.' } catch {draftNotice.value='브라우저 저장 공간을 확인해 주세요.'} }
onMounted(()=>{try{const v=JSON.parse(localStorage.getItem('bbm.account.chat-drafts.v1')||'{}');if(v&&typeof v==='object'&&!Array.isArray(v))drafts.value=v}catch{ /* no saved drafts */ }})
function keydown(e:KeyboardEvent){ if(e.key==='Escape'&&chatVehicle.value)closeChat() }
onMounted(()=>document.addEventListener('keydown',keydown));onBeforeUnmount(()=>document.removeEventListener('keydown',keydown))
</script>

<template>
  <SavedHeader :site-base="siteBase" />
  <main v-if="!chatVehicle" class="saved-main">
    <section class="saved-content" aria-labelledby="saved-title">
      <nav class="saved-breadcrumb" aria-label="현재 위치"><a :href="base">보배드림</a><span>/</span><span>저장 목록</span></nav>
      <h1 id="saved-title">저장 목록</h1>
      <nav class="saved-tabs" aria-label="저장한 콘텐츠 유형">
        <button v-for="t in tabs" :key="t.id" :class="{active:tab===t.id}" :aria-pressed="tab===t.id" @click="chooseTab(t.id)">{{ t.label }} {{ t.id==='ad'?state.favorites.length:0 }}/100</button>
      </nav>
      <p v-if="error" role="alert" class="saved-error">{{ error }}</p>
      <div v-if="!ready" class="saved-loading" role="status" aria-label="저장 목록 불러오는 중"><span /></div>
      <div v-else-if="!hasRows" class="saved-empty-wrap"><div class="saved-empty"><img :src="`${icons}heartOff.svg`" alt="" /><p>저장한 {{ selectedKind }}이 없습니다!</p><p>매물에서 <strong>하트 버튼</strong>을 누르면 저장하고 나중에 다시 볼 수 있습니다.</p></div><div class="saved-empty-line" /></div>
      <div v-else class="saved-list" aria-label="저장한 매물 목록">
        <article v-for="v in rows" :key="v.id" class="saved-row" :class="{'is-unavailable':unavailable(v)}">
          <a class="saved-row-link" :href="vehicleHref(v)" :aria-label="`${v.title} 상세 보기`" :aria-disabled="unavailable(v)||undefined" @click.prevent="open(v)">
            <div class="saved-photo"><img :src="image(v.image)" :alt="v.title" loading="lazy" /><span v-if="unavailable(v)" class="saved-unavailable"><span>{{ v.status==='sold'?'판매 완료':'숨김 매물' }}</span></span></div>
            <div class="saved-row-info"><div class="saved-row-top"><h2>{{ v.title }}</h2><p class="saved-price">{{ v.price }}</p><div v-if="v.location" class="saved-location"><img :src="`${icons}location.svg`" alt="" /><span>{{ v.location }}</span></div></div><div class="saved-row-bottom"><div class="saved-seller" v-if="!unavailable(v)"><img :src="v.avatarReady===true && v.sellerAvatar?image(v.sellerAvatar):`${icons}default-user.png`" alt="" @error="avatarFallback" /><span>{{ v.posted || '저장한 매물' }}</span></div></div></div>
          </a>
          <div class="saved-row-actions"><button v-if="!unavailable(v)" class="saved-chat-button" :aria-label="`${v.title} 판매자와 채팅`" @click="startChat(v)"><img :src="`${icons}chat.svg`" alt="" />채팅</button><button class="saved-heart" :aria-pressed="isSaved(v.id)" :aria-label="`${v.title} ${isSaved(v.id)?'저장 해제':'다시 저장'}`" @click="toggle(v)"><img :src="`${icons}${isSaved(v.id)?'heartOn':'heartOff'}.svg`" alt="" /></button></div>
        </article>
      </div>
    </section>
  </main>
  <footer v-if="!chatVehicle" class="saved-footer"><div class="saved-footer-inner"><div class="saved-footer-brand"><a :href="base"><img :src="`${siteBase}assets/bbm/main-home-logo.svg`" alt="보배드림" /></a><span>좋은 차를 만나는 시작</span></div><div class="saved-footer-content"><section><strong>보배드림 앱에서 만나보세요</strong><div class="saved-app-badges"><a href="https://apps.apple.com/kr/app/id496444795" aria-label="보배드림 App Store"><img :src="`${icons}appstore-dowload.webp`" alt="App Store" /></a><a href="https://play.google.com/store/apps/details?id=co.kr.bobaedream" aria-label="보배드림 Google Play"><img :src="`${icons}googleplay-dowload.webp`" alt="Google Play" /></a></div></section><nav aria-label="이용 안내"><NuxtLink to="/account?initial=support">고객센터</NuxtLink><NuxtLink to="/account?initial=settings">계정 설정</NuxtLink><NuxtLink to="/account?initial=feedback">의견 보내기</NuxtLink><a :href="`${siteBase}community/naver-cafe-list.html`">커뮤니티</a></nav><section><strong>고객센터</strong><a href="tel:027842329">02-784-2329</a><p>평일 09:00–18:00</p></section></div><p class="saved-footer-disclosure">체험 화면 · 저장 내용은 현재 브라우저에서 유지됩니다. 영상·게시글 저장과 실제 판매자 채팅은 아직 연결되지 않았습니다.</p><p class="saved-copyright">Copyright © 보배네트워크</p></div></footer>
  <main v-if="chatVehicle" class="saved-chat-page"><section class="saved-chat" aria-labelledby="saved-chat-title"><header><h2 id="saved-chat-title">{{ chatVehicle.seller||'판매자' }} 문의</h2><button aria-label="저장 목록으로 돌아가기" @click="closeChat"><img :src="`${siteBase}assets/icons/bb/close.svg`" alt="" /></button></header><div class="saved-chat-vehicle"><img :src="image(chatVehicle.image)" alt="" /><div><strong>{{ chatVehicle.title }}</strong><p>{{ chatVehicle.price }}</p></div></div><p class="saved-chat-disclosure">문의 내용 임시 저장용 화면입니다. 실제 메시지는 전송되지 않습니다.</p><div class="saved-chat-prompts"><button v-for="q in ['현재 판매 중인가요?','가격 협의가 가능한가요?','차량 사진을 더 볼 수 있을까요?']" :key="q" @click="draft=q">{{ q }}</button></div><form @submit.prevent="saveDraft"><label for="saved-message">문의 내용</label><textarea id="saved-message" v-model="draft" maxlength="1000" rows="4" placeholder="차량에 대해 궁금한 점을 입력하세요."/><button class="saved-draft-save" :disabled="!draft.trim()" type="submit">문의 임시 저장</button><p role="status">{{ draftNotice }}</p></form></section></main>
</template>

<style>
.saved-document{background:#f4f4f4}.saved-document::-webkit-scrollbar{width:10px}.saved-body{margin:0;padding:0;min-width:320px;background:#f4f4f4;color:#222;font:14px/21px 'Pretendard Variable',Pretendard,sans-serif}.saved-body button,.saved-body a{-webkit-tap-highlight-color:transparent}.saved-body button:focus-visible,.saved-body a:focus-visible,.saved-body textarea:focus-visible{outline:2px solid #306bd9;outline-offset:2px}.saved-main{margin:16px 0 0;background:#f4f4f4}.saved-content{max-width:1140px;min-height:500px;margin:0 auto 16px;background:#fff;border-radius:12px;overflow:hidden}.saved-breadcrumb{display:flex;align-items:center;gap:4px;padding:16px 0 0 16px;font-size:12px;line-height:21px}.saved-breadcrumb a{color:#5866a7}.saved-content>h1{font-size:18px;font-weight:700;line-height:25.38px;margin:0;padding:16px 16px 0}.saved-tabs{display:flex;align-items:center;gap:8px;padding:16px}.saved-tabs button{height:32px;flex-shrink:0;display:flex;align-items:center;justify-content:center;padding:4px 12px;border-radius:9999px;background:#f4f4f4;font-size:14px;font-weight:500;line-height:20px;white-space:nowrap}.saved-tabs .active{background:#222;color:#fff}.saved-list{display:flex;flex-direction:column}.saved-row{position:relative;border-top:1px solid #eee}.saved-row-link{display:flex;gap:16px;padding:16px;min-height:200px}.saved-photo{position:relative;width:168px;height:168px;flex-shrink:0;border-radius:8px;overflow:hidden;background:#f4f4f4}.saved-photo>img{width:100%;height:100%;object-fit:cover;display:block}.saved-row-info{display:flex;flex-direction:column;justify-content:space-between;min-width:0;flex:1;height:168px}.saved-row-top{display:flex;flex-direction:column;gap:4px}.saved-row h2{margin:0;font-size:16px;line-height:24px;font-weight:600;color:#222;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.saved-price{margin:0;font-size:18px;line-height:26px;color:#f0325e;font-weight:700}.saved-location{display:flex;align-items:center;gap:4px;color:#8c8c8c;font-size:14px;line-height:20px}.saved-location img{width:14px;height:14px;opacity:.45}.saved-row-bottom{height:32px;display:flex;align-items:center;padding-right:120px}.saved-seller{display:flex;align-items:center;gap:20px;min-width:0;font-size:14px;line-height:20px;color:#8c8c8c}.saved-seller img{width:20px;height:20px;object-fit:cover;border-radius:50%}.saved-seller span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.saved-row-actions{position:absolute;right:16px;bottom:16px;display:flex;align-items:center;gap:8px}.saved-chat-button{display:flex;align-items:center;gap:4px;height:32px;min-width:72px;border:1px solid #dadada!important;border-radius:8px;padding:0 12px!important;background:#fff!important;font-size:14px;line-height:20px;font-weight:700}.saved-chat-button img{width:20px;height:20px}.saved-heart{width:28px;height:32px;display:grid;place-items:center}.saved-heart img{width:20px;height:20px}.saved-unavailable{position:absolute;inset:0;background:#0006;display:grid;place-items:center}.saved-unavailable>span{background:#fff;color:#666;border-radius:3px;font-size:12px;padding:0 4px}.saved-row.is-unavailable .saved-row-link{cursor:default}.saved-empty-wrap{padding:0 16px 16px}.saved-empty{padding:32px 16px;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center}.saved-empty>img{width:40px;height:40px;opacity:.65;margin-bottom:6px}.saved-empty p{margin:0;font-size:16px;line-height:24px;font-weight:600}.saved-empty p:last-child{font-size:14px;line-height:20px;font-weight:400;color:#8c8c8c}.saved-empty-line{height:1px;background:#eee}.saved-only-mobile{display:none}.saved-error{margin:0;padding:12px 16px;color:#a52c24;background:#fff0ed}.saved-loading{height:176px;background:linear-gradient(90deg,#fff,#f6f6f6,#fff);background-size:200% 100%;animation:saved-loading 1s linear infinite}.saved-loading span{display:block;height:32px}.saved-footer{background:#fff;padding:24px 16px;margin-top:8px}.saved-footer-inner{max-width:1140px;margin:auto}.saved-footer-brand{display:none}.saved-footer-content{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:40px}.saved-footer-content strong{display:block;margin-bottom:16px;font-size:14px;line-height:20px}.saved-footer-content nav{display:grid;gap:12px;align-content:start;color:#666;font-size:13px;line-height:20px}.saved-footer-content section>a{display:block;color:#666}.saved-footer-content p{font-size:13px;color:#8c8c8c}.saved-app-badges{display:flex;gap:12px}.saved-app-badges img{height:40px;width:130px;object-fit:contain}.saved-footer-disclosure,.saved-copyright{padding-top:16px;border-top:1px solid #eee;margin:24px 0 0;font-size:12px;line-height:20px;color:#8c8c8c}.saved-copyright{padding-top:0;border:0;margin-top:4px}.saved-chat-page{min-height:calc(100dvh - 65px);display:flex;justify-content:center;background:#f4f4f4}.saved-chat{width:min(100%,720px);min-height:calc(100dvh - 65px);background:#fff}.saved-chat header{display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid #eee}.saved-chat h2{font-size:18px;margin:0}.saved-chat header button{width:32px;height:32px}.saved-chat header img{width:24px;height:24px}.saved-chat-vehicle{display:flex;gap:12px;padding:16px}.saved-chat-vehicle>img{width:72px;height:72px;object-fit:cover;border-radius:8px}.saved-chat-vehicle p{color:#f0325e;font-weight:700}.saved-chat-disclosure{margin:0 16px 16px;color:#777;font-size:13px;line-height:20px}.saved-chat-prompts{display:flex;flex-direction:column;gap:8px;padding:0 16px}.saved-chat-prompts button{text-align:left;border:1px solid #ddd;border-radius:8px;padding:10px 12px;font-size:14px}.saved-chat form{display:grid;gap:8px;padding:16px}.saved-chat textarea{padding:12px;border:1px solid #ddd;border-radius:8px;resize:vertical;font:inherit;width:100%;box-sizing:border-box}.saved-draft-save{background:#306bd9;color:#fff;border-radius:8px;padding:12px}.saved-draft-save:disabled{opacity:.5}.saved-chat form>p{margin:0;font-size:13px;color:#666}
@keyframes saved-loading{to{background-position:-200% 0}}@media(prefers-reduced-motion:reduce){.saved-loading{animation:none}}
@media(max-width:767px){.saved-document::-webkit-scrollbar{width:4px}.saved-content{border-radius:0;min-height:444px;margin-bottom:8px}.saved-row-link{gap:12px;min-height:160px}.saved-photo{width:128px;height:128px}.saved-row-info{height:128px}.saved-row h2{font-size:14px;line-height:20px;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.saved-price{font-size:16px;line-height:24px}.saved-location{font-size:12px;line-height:18px}.saved-location img{width:12px;height:12px}.saved-row-actions{gap:4px}.saved-seller{gap:12px;font-size:12px;line-height:18px}.saved-row-bottom{padding-right:112px}.saved-tabs{overflow-x:auto;scrollbar-width:none}.saved-tabs::-webkit-scrollbar{display:none}.saved-empty-wrap{padding:12px}.saved-empty p:last-child{width:100%;max-width:none}.saved-empty-line{display:block;background:transparent}.saved-footer-brand{display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:1px solid #eee;margin-bottom:16px}.saved-footer-brand img{width:100px;height:28px}.saved-footer-brand span{font-size:12px;color:#999}.saved-footer-content{display:block}.saved-footer-content>section:last-child{display:none}.saved-footer-content>nav{margin-top:16px;padding-top:16px;border-top:1px solid #eee;display:grid;grid-template-columns:1fr 1fr;gap:12px}.saved-app-badges img{width:130px;height:40px}.saved-footer-disclosure{margin-top:16px}.saved-chat,.saved-chat-page{min-height:calc(100dvh - 104px)}}
@media(max-width:359px){.saved-row-actions{right:12px}.saved-seller{display:none}.saved-row-link{padding-inline:12px}.saved-row-bottom{padding-right:0}}
</style>
