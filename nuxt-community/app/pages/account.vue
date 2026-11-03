<script setup lang="ts">
import { accountGroups } from '~/data/account-menu'
import type { AccountItem } from '~/types/account'

const route = useRoute()
const router = useRouter()
const demo = useAccountDemo()
const { state, balance } = demo
const loginName = ref('보배 딜러')
const loginRole = ref<'buyer' | 'dealer'>('dealer')
const embedded = computed(() => route.query.embed === '1')
const popover = computed(() => route.query.surface === 'popover')
const memberPreview = computed(() => state.value.signedIn)
const activeItem = ref<AccountItem | null>(null)
const authView = ref<'login' | 'signup' | null>(route.query.initial === 'login' ? 'login' : null)
const iconRoot = `${useRuntimeConfig().app.baseURL}icons/`
const siteBase = useRuntimeConfig().app.baseURL.replace(/nuxt-community\/$/, '')
const icon = (name: string) => `${iconRoot}account/chotot-my-${name}.svg`
const title = computed(() => authView.value === 'login' ? '로그인' : authView.value === 'signup' ? '회원가입' : activeItem.value?.label || '마이')

useHead({ title: '마이 · 보배드림', htmlAttrs: { class: 'account-document' }, bodyAttrs: { class: 'account-body' }, link: [{ rel: 'stylesheet', href: `${siteBase}assets/fonts/pretendard/pretendard-guazi.css` }] })

function send(type: string, action?: string) {
  if (embedded.value && window.parent !== window) window.parent.postMessage({ channel: 'bbm-account-v1', type, action }, window.location.origin)
}
function close() {
  if (activeItem.value || authView.value) { activeItem.value = null; authView.value = null; return }
  if (embedded.value) send('close')
  else window.location.assign(`${siteBase}?qf=guazi&lang=ko&category=국산차`)
}
function choose(item: AccountItem) {
  activeItem.value = item
}
function navigate(action: string) {
  if (embedded.value) send('navigate', action)
  else {
    const suffix = action === 'register' ? '?register=1' : action === 'feedback' ? 'community/naver-cafe-list.html?board=suggestion' : '?qf=guazi&lang=ko'
    window.location.assign(`${siteBase}${suffix}`)
  }
}
function exitPreview() {
  demo.logout()
  if (embedded.value) send('session')
}
function chooseId(id: string) { const item = accountGroups.flatMap(g => g.items).find(i => i.id === id); if(item) activeItem.value = item; else if(id === 'followers' || id === 'following') activeItem.value = {id,label:id === 'followers'?'팔로워':'팔로잉',icon:'account-settings-01',description:''} }
function signIn() { if(demo.signIn(loginName.value, loginRole.value)) { authView.value = null; send('session') } }
function keydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); close(); return }
  if (event.key !== 'Tab' || !embedded.value) return
  const elements = [...document.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')].filter(el => el.getClientRects().length)
  const first = elements[0]; const last = elements.at(-1)
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}
onMounted(() => {
  document.addEventListener('keydown', keydown)
  send('ready')
  if (route.query.initial === 'dealer') chooseId('dealer')
  if (embedded.value) document.querySelector<HTMLElement>('button')?.focus({ preventScroll: true })
})
onBeforeUnmount(() => document.removeEventListener('keydown', keydown))
watch([activeItem, authView], async () => {
  if (embedded.value) send(activeItem.value || authView.value ? 'expand' : 'compact')
  await nextTick()
  document.querySelector<HTMLElement>('.account-body h1')?.focus({ preventScroll: true })
  window.scrollTo(0, 0)
})
</script>

<template>
  <main class="account-page" :class="{ 'is-popover': popover, 'is-detail': activeItem || authView }">
    <header v-if="!popover || activeItem || authView" class="account-header">
      <button type="button" :aria-label="activeItem || authView ? '마이 메뉴로 돌아가기' : '마이 닫기'" @click="close"><img :src="`${siteBase}assets/icons/bb/chevron-left.svg`" alt="" /></button>
      <h1 tabindex="-1">{{ title }}</h1>
      <button v-if="embedded" type="button" aria-label="마이 닫기" @click="send('close')"><img :src="`${iconRoot}write/close.svg`" alt="" /></button>
    </header>

    <template v-if="!activeItem && !authView">
      <section class="account-identity" :class="{'is-member':memberPreview}" aria-label="계정">
        <div class="account-welcome">
          <div><strong>{{ memberPreview ? state.profile.name : '좋은 차를 만나는 시작' }}</strong><p>{{ memberPreview ? '샘플 계정 · 이 브라우저에 저장됩니다.' : '로그인하고 보배드림을 더 편하게 이용하세요.' }}</p></div>
          <img class="account-brand" :src="`${siteBase}assets/bbm/favicon.svg`" alt="보배드림" />
        </div>
        <div class="account-auth-actions" v-if="!memberPreview">
          <button type="button" class="account-secondary" @click="authView = 'signup'">회원가입</button>
          <button type="button" class="account-primary" @click="authView = 'login'">로그인</button>
        </div>
        <button v-else type="button" class="account-profile-link" @click="activeItem = accountGroups[3]!.items[0]!">내 프로필 관리<img class="account-chevron" :src="`${siteBase}assets/icons/bb/chevron-left.svg`" alt="" /></button>
        <template v-if="memberPreview"><div class="account-member-tools"><button @click="chooseId('followers')">팔로워 0</button><button @click="chooseId('following')">팔로잉 {{ state.following?.length || 0 }}</button></div><div class="account-member-wallet"><span>체험 포인트<strong>{{ balance.toLocaleString() }} P</strong></span><button class="account-primary" @click="chooseId('points')">포인트 내역·체험</button></div></template>
      </section>

      <section v-for="group in accountGroups" :key="group.id" class="account-group" :aria-labelledby="`account-${group.id}`">
        <h2 :id="`account-${group.id}`">{{ group.label }}</h2>
        <div class="account-group-card">
          <button v-for="item in group.items" :key="item.id" type="button" class="account-row" :data-account-item="item.id" @click="choose(item)">
            <img class="account-row-icon" :src="icon(item.icon)" alt="" />
            <span>{{ item.label }}</span>
            <span v-if="item.id === 'favorites' && state.favorites.length" class="account-count">{{ state.favorites.length }}</span>
            <span v-if="item.id === 'searches' && state.searches.length" class="account-count">{{ state.searches.length }}</span>
            <span v-if="item.badge" class="account-badge">{{ item.badge }}</span>
            <img class="account-chevron" :src="`${siteBase}assets/icons/bb/chevron-left.svg`" alt="" />
          </button>
        </div>
      </section>
      <div v-if="memberPreview" class="account-signout"><button type="button" class="account-row" @click="exitPreview"><img class="account-row-icon" :src="icon('logout')" alt="" /><span>샘플 로그아웃</span></button></div>
      <footer class="account-footer">보배드림</footer>
    </template>

    <form v-else-if="authView" class="af-card af-form" @submit.prevent="signIn">
      <img class="account-detail-icon" :src="icon('account-settings-01')" alt="" />
      <h2>{{ authView === 'login' ? '샘플 계정 로그인' : '샘플 회원 만들기' }}</h2>
      <p class="af-sample">기능 체험용 계정입니다. 실제 비밀번호·인증번호를 입력하지 않습니다.</p>
      <label>샘플 닉네임<input v-model="loginName" autocomplete="off" maxlength="30" required /></label>
      <label>회원 유형<select v-model="loginRole"><option value="dealer">딜러</option><option value="buyer">구매자</option></select></label>
      <p v-if="demo.error.value" role="alert" class="af-error">{{ demo.error.value }}</p>
      <button type="submit" class="account-primary">샘플 계정으로 시작</button>
    </form>

    <AccountFeatures v-else-if="activeItem" :section="activeItem.id" :site-base="siteBase" @login="authView = 'login'" @choose="chooseId" @navigate="navigate" />
  </main>
</template>

<style>
.account-document { scrollbar-width: none; }
.account-document::-webkit-scrollbar { display: none; }
.account-body { min-width: 280px; background: #f7f7f7; }
.account-page { --account-blue: #2f6fe4; --account-blue-hover: #245bc2; min-height: 100dvh; color: #222; background: #f7f7f7; font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif; font-size: 16px; line-height: 24px; padding: 0 16px 12px; }
.account-page.is-popover { min-height: 100dvh; padding-top: 16px; }
.account-page button, .account-page a { -webkit-tap-highlight-color: transparent; }
.account-page button:focus-visible, .account-page a:focus-visible { outline: 2px solid var(--account-blue); outline-offset: -3px; border-radius: 6px; }
.account-header { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; gap: 8px; min-height: calc(56px + env(safe-area-inset-top)); padding: env(safe-area-inset-top) 4px 0; margin: 0 -16px 16px; background: #fff; border-bottom: 1px solid #eee; }
.account-header h1 { flex: 1; font-size: 20px; font-weight: 700; line-height: 28px; margin: 0; outline: none; }
.account-header button { display: grid; place-items: center; width: 44px; height: 44px; flex-shrink: 0; }
.account-header img { width: 24px; height: 24px; }
.account-identity { padding: 16px; background: #fff; border-radius: 12px; }
.account-welcome { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 48px; }
.account-welcome strong { display: block; font-size: 16px; font-weight: 700; line-height: 22px; }
.account-welcome p { color: #777; font-size: 14px; line-height: 20px; margin: 4px 0 0; word-break: keep-all; }
.account-brand { width: 48px; height: 48px; object-fit: contain; flex-shrink: 0; }
.account-auth-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
.account-primary, .account-secondary { display: inline-flex; justify-content: center; align-items: center; min-height: 40px; padding: 7px 16px !important; border-radius: 8px; font-size: 15px; line-height: 24px; font-weight: 600; }
.account-primary { background: var(--account-blue) !important; color: #fff !important; border: 1px solid var(--account-blue) !important; }
.account-primary:hover { background: var(--account-blue-hover) !important; }
.account-secondary { background: #fff; border: 1px solid #e1e1e1 !important; }
.account-secondary:hover { background: #f7f7f7; }
.account-profile-link { display: flex; justify-content: space-between; width: 100%; margin-top: 12px; font-size: 14px; }
.account-profile-link img { width: 20px; height: 20px; }
.account-member-tools { display:flex;justify-content:center;gap:24px;margin:12px 0;font-size:13px;color:#666; }
.account-identity.is-member .account-welcome { flex-direction:column-reverse;text-align:center;gap:8px; }.account-identity.is-member .account-brand { width:80px;height:80px; }.account-identity.is-member .account-profile-link { justify-content:center;gap:6px; }
.account-member-wallet { display:grid;gap:10px;padding:16px;background:#f7f9fc;border-radius:8px;margin-top:16px; }
.account-member-wallet>span { display:flex;justify-content:space-between;gap:12px;font-size:13px;color:#777; }.account-member-wallet strong { color:#222;font-size:17px; }.account-count {color:#2f6fe4;font-size:13px}
.account-page.is-detail { max-width:960px!important;margin:auto; }.account-page.is-detail .account-header {margin-bottom:16px}
.account-group { margin-top: 12px; }
.account-group h2 { color: #888; font-size: 14px; line-height: 20px; font-weight: 500; margin: 0 0 6px; padding: 0 12px; }
.account-group-card { border-radius: 12px; background: #fff; overflow: hidden; }
.account-row { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 48px; padding: 12px 16px !important; text-align: left; color: #444 !important; font-size: 16px; font-weight: 500; line-height: 24px; }
.account-row:hover { background: #f0f4fc; }
.account-row:active { background: #e7effc; }
.account-row > span:first-of-type { flex: 1; min-width: 0; }
.account-row-icon { display: block; width: 24px; height: 24px; flex: 0 0 24px; object-fit: contain; }
.account-chevron { display: block; width: 16px; height: 16px; flex: 0 0 16px; opacity: .55; transform: rotate(180deg); }
.account-badge { border-radius: 3px; background: #eef4ff; color: #2f6fe4; padding: 0 4px; font-size: 11px; white-space: nowrap; }
.account-signout { margin-top: 16px; background: #fff; border-radius: 12px; }
.account-footer { padding: 24px 0 calc(12px + env(safe-area-inset-bottom)); text-align: center; font-size: 12px; color: #999; }
.account-detail { min-height: 360px; display: flex; flex-direction: column; align-items: center; padding: 40px 12px; text-align: center; }
.account-detail-icon { width: 48px; height: 48px; object-fit: contain; }
.account-detail h2 { font-size: 20px; line-height: 28px; margin: 20px 0 0; }
.account-detail p { color: #666; font-size: 15px; line-height: 24px; margin: 12px 0; word-break: keep-all; }
.account-detail .account-disclosure { color: #888; font-size: 13px; line-height: 20px; }
.account-detail .account-primary { width: 100%; margin-top: 20px; }
.account-contact { display: block; font-size: 24px; font-weight: 700; color: var(--account-blue); padding: 16px; }
@media (min-width: 600px) { .account-page:not(.is-popover) { max-width: 600px; margin: auto; } }
@media (prefers-reduced-motion: reduce) { .account-page * { scroll-behavior: auto; } }
</style>
