<script setup lang="ts">
import { demoPlans, type DemoVehicle, type DemoReview } from '~/services/accountDemo'
const props = defineProps<{ section: string; siteBase: string }>()
const uid = () => crypto.randomUUID()
const defaultSearch = () => new URL(`${props.siteBase}?qf=guazi&lang=ko`, location.origin).href
const emit = defineEmits<{ login: []; choose: [id: string]; navigate: [action: string] }>()
const d = useAccountDemo()
const { state, notice, error, balance, context } = d
const tab = ref('listing')
const confirmDelete = ref('')
const name = ref(state.value.profile.name)
const shop = ref(state.value.profile.shop)
const bio = ref(state.value.profile.bio)
const reviewId = ref(''); const subject = ref(''); const rating = ref(5); const text = ref('')
const listingId = ref(state.value.listings[0]?.id || '')
const planId = ref('highlight'); const couponId = ref(''); const operation = ref(crypto.randomUUID())
const partnerCompany = ref(state.value.partner?.company || '')
const partnerNote = ref(state.value.partner?.note || '')
const feedbackText = ref(''); const profileTab = ref('profile'); const resetConfirm = ref(false)
const vehicleTab = ref<'active' | 'sold'>('active')
const reviewKind = computed(() => props.section === 'complex-reviews' ? 'complex' : 'vehicle')
const reviews = computed(() => state.value.reviews.filter(r => r.kind === reviewKind.value))
const vehicles = computed(() => props.section === 'recent' ? state.value.recent : state.value.favorites)
const availableCoupons = computed(() => state.value.coupons.filter(c => c.claimed && !c.used))
const plan = computed(() => demoPlans.find(p => p.id === planId.value)!)
const total = computed(() => Math.max(0, plan.value.points - (availableCoupons.value.find(c => c.id === couponId.value)?.discount || 0)))
const gated = computed(() => !state.value.signedIn && !['favorites', 'recent', 'searches', 'support', 'offers'].includes(props.section))
const asset = (value: string) => /^https?:/.test(value) ? value : `${props.siteBase}assets/${value}`
const now = (value: string) => new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
function openVehicle(v: DemoVehicle) {
  d.recordVehicle(v)
  if (window.parent !== window) window.parent.postMessage({ channel: 'bbm-account-v1', type: 'vehicle', vehicle: v }, location.origin)
  else location.assign(new URL(v.url, new URL(props.siteBase, location.origin)).href)
}
function openSearch(url: string) {
  try { const u = new URL(url, location.origin); if (u.origin !== location.origin) return; if (window.parent !== window) window.parent.postMessage({ channel: 'bbm-account-v1', type: 'search', url: u.href }, location.origin); else location.assign(u.href) } catch { error.value = '검색 주소를 확인해 주세요.' }
}
function editReview(r: DemoReview) { reviewId.value = r.id; subject.value = r.subject; rating.value = r.rating; text.value = r.text }
function saveReview() { if (d.saveReview(reviewKind.value, reviewId.value, subject.value, Number(rating.value), text.value)) { reviewId.value = ''; subject.value = ''; text.value = '' } }
function claim(id: string) { d.mutate(s => { if (!s.signedIn) throw new Error('샘플 계정으로 로그인해 주세요.'); const c = s.coupons.find(c => c.id === id); if (!c || c.claimed) throw new Error('이미 받은 혜택입니다.'); c.claimed = true }, '쿠폰을 받았습니다.') }
function apply() { if (d.premium(listingId.value, planId.value, couponId.value, operation.value)) { operation.value = crypto.randomUUID(); emit('choose', 'payments') } }
function saveProfile() { d.mutate(s => { if (!name.value.trim() || name.value.trim().length > 30 || shop.value.length > 60 || bio.value.length > 300) throw new Error('닉네임 1~30자, 상사명 60자, 소개 300자 이내로 입력해 주세요.'); s.profile.name = name.value.trim(); s.profile.shop = shop.value.trim(); s.profile.bio = bio.value.trim() }, '프로필을 저장했습니다.') }
watch(() => props.section, () => { tab.value = 'listing'; confirmDelete.value = ''; notice.value = ''; error.value = ''; reviewId.value = ''; subject.value = ''; text.value = ''; name.value = state.value.profile.name; shop.value = state.value.profile.shop; bio.value = state.value.profile.bio })
onMounted(() => { notice.value = ''; error.value = '' })
</script>

<template>
  <div class="af-shell">
    <p class="af-sample">작동 샘플 · 이 브라우저에 저장 · 실제 결제 없음</p>
    <p v-if="notice" class="af-notice" role="status">{{ notice }}</p>
    <p v-if="error" class="af-error" role="alert">{{ error }}</p>
    <section v-if="gated" class="af-empty"><h2>내 정보를 관리해 보세요</h2><p>샘플 계정으로 로그인하면 프로필·후기·판매 관리를 체험할 수 있습니다.</p><button class="account-primary" @click="emit('login')">샘플 로그인</button></section>

    <template v-else-if="section === 'favorites' || section === 'recent'">
      <nav v-if="section === 'favorites'" class="af-tabs" aria-label="저장한 콘텐츠 유형"><button v-for="t in [{id:'listing',label:'매물'},{id:'video',label:'영상'},{id:'post',label:'게시글'}]" :key="t.id" :class="{active: tab === t.id}" :aria-pressed="tab === t.id" @click="tab = t.id">{{ t.label }} {{ t.id === 'listing' ? vehicles.length : 0 }}/100</button></nav>
      <div class="af-toolbar"><span>{{ vehicles.length }}개</span><button v-if="section === 'recent' && vehicles.length" @click="confirmDelete = 'recent'">기록 지우기</button><button v-if="section === 'favorites'" @click="d.samples">샘플 매물 담기</button></div>
      <div v-if="confirmDelete === 'recent'" class="af-confirm"><p>이 브라우저의 최근 본 매물 기록을 지울까요?</p><button @click="confirmDelete = ''">취소</button><button @click="d.clearRecent(); confirmDelete = ''">기록 지우기</button></div>
      <div v-if="!vehicles.length || (section === 'favorites' && tab !== 'listing')" class="af-empty"><img :src="`${siteBase}assets/icons/bb/heart.svg`" alt="" /><h2>저장한 {{ section === 'recent' ? '방문 기록' : tab === 'video' ? '영상' : tab === 'post' ? '게시글' : '매물' }}이 없습니다</h2><p>매물 리스트에서 차량을 열거나 관심 버튼을 누르면 여기에서 다시 볼 수 있습니다.</p><button class="account-primary" @click="emit('navigate','listing')">매물 둘러보기</button></div>
      <article v-for="v in (tab === 'listing' || section === 'recent' ? vehicles : [])" :key="v.id" class="af-vehicle"><button class="af-vehicle-main" @click="openVehicle(v)"><img :src="asset(v.image)" :alt="v.title" /><span><strong>{{ v.title }}</strong><small>{{ v.specs }}</small><b>{{ v.price }}</b></span></button><button v-if="section === 'favorites'" class="af-link" :aria-label="`${v.title} 관심 삭제`" @click="d.removeFavorite(v.id)">삭제</button></article>
    </template>

    <template v-else-if="section === 'followers' || section === 'following'">
      <div v-if="section === 'followers'" class="af-empty"><h2>팔로워 0명</h2><p>아직 샘플 팔로워가 없습니다.</p></div>
      <template v-else><p class="af-muted">샘플 판매자 팔로잉을 추가하거나 해제할 수 있습니다.</p><article v-for="seller in ['보배 샘플 모터스','보배 촬영팀']" :key="seller" class="af-card"><strong>{{ seller }}</strong><button class="account-secondary" @click="d.mutate(s => { const a=s.following || []; s.following = a.includes(seller)?a.filter(x => x !== seller):[...a,seller] }, '팔로잉 목록을 저장했습니다.')">{{ state.following?.includes(seller)?'팔로잉 해제':'팔로우' }}</button></article></template>
    </template>

    <template v-else-if="section === 'searches'">
      <div class="af-toolbar"><strong>저장한 검색 {{ state.searches.length }}/10</strong><button @click="d.saveSearch(context.title, context.url || defaultSearch())">현재 조건 저장</button></div>
      <div v-if="!state.searches.length" class="af-empty"><img :src="`${siteBase}assets/icons/bb/saved-search.svg`" alt="" /><h2>저장한 검색이 없습니다</h2><p>지금 보고 있는 제조사·모델·가격 조건을 저장해 보세요.</p></div>
      <article v-for="s in state.searches" :key="s.id" class="af-card"><button class="af-search-title" @click="openSearch(s.url)">{{ s.title }}</button><label class="af-switch"><input :checked="s.notify" type="checkbox" @change="d.mutate(v => { const item = v.searches.find(x => x.id === s.id); if(item) item.notify = !item.notify }, '샘플 알림 설정을 저장했습니다.')" />새 매물 알림 설정</label><small>샘플 설정이며 실제 푸시를 발송하지 않습니다.</small><button class="af-link" @click="d.mutate(v => { v.searches = v.searches.filter(x => x.id !== s.id) }, '검색 조건을 삭제했습니다.')">삭제</button></article>
    </template>

    <template v-else-if="section === 'reviews' || section === 'complex-reviews'">
      <form class="af-form af-card" @submit.prevent="saveReview"><h2>{{ reviewId ? '후기 수정' : '후기 작성' }}</h2><label>{{ reviewKind === 'complex' ? '매매단지' : '차량·거래 대상' }}<input v-model="subject" maxlength="100" required :placeholder="reviewKind === 'complex' ? '예: 도이치오토월드' : '예: 제네시스 G80'" /></label><label>별점<select v-model="rating"><option v-for="n in 5" :key="n" :value="n">{{ n }}점</option></select></label><label>후기<textarea v-model="text" maxlength="1000" required rows="4" placeholder="직접 경험한 내용을 남겨 주세요." /></label><small>{{ text.length }}/1,000 · 샘플 내역으로만 저장됩니다.</small><button class="account-primary" type="submit">{{ reviewId ? '수정 저장' : '후기 저장' }}</button></form>
      <article v-for="r in reviews" :key="r.id" class="af-card"><strong>{{ r.subject }} · {{ r.rating }}점</strong><p class="af-preline">{{ r.text }}</p><small>{{ now(r.createdAt) }}</small><div class="af-actions"><button @click="editReview(r)">수정</button><button @click="d.mutate(s => { s.reviews = s.reviews.filter(x => x.id !== r.id) }, '후기를 삭제했습니다.')">삭제</button></div></article><p v-if="!reviews.length" class="af-muted">작성한 후기가 없습니다.</p>
    </template>

    <template v-else-if="section === 'points'">
      <section class="af-card af-wallet"><span>내 체험 포인트</span><strong>{{ balance.toLocaleString() }} P</strong><small>현금 가치가 없는 샘플 포인트입니다.</small><button class="account-primary" :disabled="state.giftClaimed" @click="d.mutate(s => { if(s.giftClaimed) throw new Error('이미 받았습니다.'); s.giftClaimed = true; s.transactions.unshift({ id: uid(), type: 'gift', title: '추가 체험 포인트', amount:10000, status:'applied', createdAt:new Date().toISOString() }) }, '체험 포인트를 받았습니다.')">{{ state.giftClaimed ? '체험 포인트 받기 완료' : '체험 포인트 10,000 P 받기' }}</button></section><article v-for="t in state.transactions" :key="t.id" class="af-ledger"><span>{{ t.title }}<small>{{ now(t.createdAt) }}</small></span><b :class="{ 'af-debit': t.amount < 0 }">{{ t.amount > 0 ? '+' : '' }}{{ t.amount.toLocaleString() }} P</b></article>
    </template>

    <template v-else-if="section === 'premium'">
      <form class="af-form af-card" @submit.prevent="apply"><h2>프리미엄 등록 체험</h2><label>판매 매물<select v-model="listingId"><option v-for="v in state.listings.filter(v => v.status === 'active')" :key="v.id" :value="v.id">{{ v.title }}{{ v.premium ? ' · 적용 중' : '' }}</option></select></label><fieldset><legend>상품 선택 · 샘플 가격</legend><label v-for="p in demoPlans" :key="p.id" class="af-plan"><input v-model="planId" type="radio" :value="p.id" />{{ p.name }}<b>{{ p.points.toLocaleString() }} P</b></label></fieldset><label>쿠폰<select v-model="couponId"><option value="">선택 안 함</option><option v-for="c in availableCoupons" :key="c.id" :value="c.id">{{ c.title }} · {{ c.discount.toLocaleString() }} P 할인</option></select></label><div class="af-total"><span>적용 포인트</span><strong>{{ total.toLocaleString() }} P</strong></div><small>보유 {{ balance.toLocaleString() }} P · 실제 결제나 광고 노출은 발생하지 않습니다.</small><button class="account-primary" type="submit">샘플 포인트로 적용</button></form><button class="af-link" @click="emit('choose','offers')">사용할 쿠폰 받기</button>
    </template>

    <template v-else-if="section === 'payments'">
      <p class="af-muted">실제 영수증이 아닌 샘플 신청·취소 내역입니다.</p><p v-if="!state.transactions.some(t => t.type === 'premium')" class="af-empty">신청한 내역이 없습니다.<button class="account-primary" @click="emit('choose','premium')">프리미엄 체험</button></p><article v-for="t in state.transactions.filter(t => t.type === 'premium')" :key="t.id" class="af-card"><strong>{{ t.title }}</strong><p>{{ Math.abs(t.amount).toLocaleString() }} P · {{ t.status === 'cancelled' ? '취소 완료' : '신청 완료' }}</p><small>{{ now(t.createdAt) }} · {{ t.id.slice(0,8) }}</small><button v-if="t.status === 'applied'" class="af-link" @click="confirmDelete = t.id">샘플 신청 취소</button><div v-if="confirmDelete === t.id" class="af-confirm"><p>신청을 취소하고 사용 포인트를 돌려받을까요?</p><button @click="confirmDelete = ''">유지</button><button @click="d.refund(t.id); confirmDelete = ''">신청 취소</button></div></article>
    </template>

    <template v-else-if="section === 'dealer'">
      <section class="af-card"><h2>{{ state.profile.shop }}</h2><p>{{ state.profile.name }} · 샘플 딜러페이지</p><p class="af-preline">{{ state.profile.bio || '프로필을 편집해 상사 소개를 추가해 보세요.' }}</p><button class="af-link" @click="emit('choose','settings')">프로필 편집</button></section><nav class="af-tabs" aria-label="내 매물 상태"><button :class="{active: vehicleTab === 'active'}" @click="vehicleTab = 'active'">판매 중</button><button :class="{active: vehicleTab === 'sold'}" @click="vehicleTab = 'sold'">판매 완료</button></nav><article v-for="v in state.listings.filter(v => v.status === vehicleTab)" :key="v.id" class="af-card"><div class="af-vehicle-main"><img :src="asset(v.image)" :alt="v.title" /><span><strong>{{ v.title }}</strong><b>{{ v.price }}</b><small v-if="v.premium">프리미엄 적용 중 · 샘플</small></span></div><div class="af-actions"><button @click="d.mutate(s => { const item = s.listings.find(x => x.id === v.id); if(item) item.status = item.status === 'sold' ? 'active' : 'sold' }, '매물 상태를 저장했습니다.')">{{ v.status === 'sold' ? '다시 판매하기' : '판매 완료로 변경' }}</button><button v-if="v.status === 'active'" @click="listingId = v.id; emit('choose','premium')">프리미엄</button></div></article><button class="account-primary" @click="emit('navigate','register')">새 매물 등록 화면 열기</button>
    </template>

    <template v-else-if="section === 'partners'">
      <form class="af-card af-form" @submit.prevent="d.mutate(s => { if(!partnerCompany.trim() || partnerCompany.length > 60 || partnerNote.length > 500) throw new Error('상사명과 신청 내용을 확인해 주세요.'); s.partner = { company:partnerCompany.trim(), note:partnerNote.trim(), createdAt:new Date().toISOString() } }, '샘플 신청서를 저장했습니다. 실제 제휴 신청은 발송되지 않습니다.')"><h2>파트너 서비스 신청 체험</h2><label>상사명<input v-model="partnerCompany" maxlength="60" required /></label><label>관심 서비스<textarea v-model="partnerNote" maxlength="500" rows="4" placeholder="촬영·숏폼 제작·상사 페이지 등" /></label><button class="account-primary" type="submit">샘플 신청서 저장</button></form><div v-if="state.partner" class="af-card"><strong>샘플 신청서 저장 완료</strong><p>{{ state.partner.company }}</p><p>{{ state.partner.note }}</p><small>{{ now(state.partner.createdAt) }}</small></div>
    </template>

    <template v-else-if="section === 'offers' || section === 'coupons'">
      <p class="af-muted">프리미엄 등록을 체험하는 샘플 쿠폰입니다.</p><article v-for="c in state.coupons.filter(c => section === 'offers' || c.claimed)" :key="c.id" class="af-card af-coupon"><strong>{{ c.discount.toLocaleString() }} P</strong><h2>{{ c.title }}</h2><p>{{ c.used ? '사용 완료' : c.claimed ? '사용 가능' : '받을 수 있는 혜택' }}</p><button v-if="!c.claimed" class="account-primary" @click="state.signedIn ? claim(c.id) : emit('login')">쿠폰 받기</button><button v-else-if="!c.used" class="account-secondary" @click="emit('choose','premium')">프리미엄 등록에 사용</button></article><p v-if="section === 'coupons' && !state.coupons.some(c => c.claimed)" class="af-empty">받은 쿠폰이 없습니다.<button class="account-primary" @click="emit('choose','offers')">혜택 둘러보기</button></p>
    </template>

    <template v-else-if="section === 'settings'">
      <nav class="af-tabs" aria-label="계정 설정 구분"><button :class="{active:profileTab === 'profile'}" @click="profileTab = 'profile'">프로필</button><button :class="{active:profileTab === 'account'}" @click="profileTab = 'account'">계정·알림</button></nav><form v-if="profileTab === 'profile'" class="af-form af-card" @submit.prevent="saveProfile"><label>닉네임<input v-model="name" maxlength="30" required /></label><label>상사명<input v-model="shop" maxlength="60" /></label><label>소개<textarea v-model="bio" maxlength="300" rows="4" /></label><button class="account-primary" type="submit">변경사항 저장</button></form><section v-else class="af-card"><label class="af-switch"><input :checked="state.profile.notifications" type="checkbox" @change="d.mutate(s => { s.profile.notifications = !s.profile.notifications }, '샘플 알림 설정을 저장했습니다.')" />새 소식 알림 설정</label><p>샘플 설정만 저장하며 실제 알림 권한을 요청하지 않습니다.</p><button class="af-link" @click="d.logout()">샘플 로그아웃</button><button class="af-link" @click="resetConfirm = true">샘플 데이터 초기화</button><div v-if="resetConfirm" class="af-confirm"><p>샘플 계정 데이터를 초기화할까요? 실제 리스트의 관심·방문 기록은 유지됩니다.</p><button @click="resetConfirm = false">취소</button><button @click="d.reset(); resetConfirm = false">초기화</button></div></section>
    </template>

    <template v-else-if="section === 'support'">
      <section class="af-card"><h2>고객센터</h2><a class="account-contact" href="tel:027842329">02-784-2329</a><p>평일 09:00–18:00 · 점심 11:30–12:30</p></section><details class="af-card"><summary>저장한 검색 조건은 어떻게 사용하나요?</summary><p>매물 리스트에서 조건을 선택하고 저장하면 같은 검색으로 다시 이동할 수 있습니다.</p></details><details class="af-card"><summary>샘플 결제가 실제로 청구되나요?</summary><p>실제 결제·광고 노출 없이 체험용 포인트로 신청과 취소 흐름만 확인합니다.</p></details><details class="af-card"><summary>다른 기기에서도 내 정보가 보이나요?</summary><p>현재 샘플은 같은 브라우저에서만 유지됩니다. 운영 서비스는 Laravel 계정 API 연결이 필요합니다.</p></details>
    </template>

    <template v-else-if="section === 'feedback'">
      <form class="af-form af-card" @submit.prevent="d.mutate(s => { if(!feedbackText.trim() || feedbackText.length > 1000) throw new Error('의견을 1~1,000자로 입력해 주세요.'); s.feedback.unshift({ id:uid(), text:feedbackText.trim(), createdAt:new Date().toISOString() }); s.feedback = s.feedback.slice(0,100) }, '샘플 의견을 저장했습니다. 운영팀에 전송되지는 않습니다.') && (feedbackText = '')"><label>서비스 이용 의견<textarea v-model="feedbackText" required maxlength="1000" rows="5" /></label><button class="account-primary" type="submit">샘플 의견 저장</button><button type="button" class="af-link" @click="emit('navigate','feedback')">실제 시안 제안·건의 게시판 열기</button></form><article v-for="f in state.feedback" :key="f.id" class="af-card"><p class="af-preline">{{ f.text }}</p><small>{{ now(f.createdAt) }}</small></article>
    </template>
  </div>
</template>

<style>
.af-shell { padding-bottom:24px; }
.af-sample { background:#eef4ff;color:#345c93;padding:10px 12px;border-radius:8px;font-size:12px;line-height:18px;margin:0 0 16px; }
.af-notice,.af-error { padding:12px;border-radius:8px;font-size:14px;line-height:22px; }
.af-notice { background:#eaf5ee;color:#22653c; }.af-error { background:#fff0ee;color:#a62c25; }
.af-card { padding:16px;margin:12px 0;background:white;border-radius:12px; }.af-card h2 {font-size:18px;line-height:26px;margin:0 0 12px}.af-card p {font-size:14px;line-height:22px;color:#666}.af-card small,.af-muted {font-size:13px;line-height:20px;color:#888}.af-preline{white-space:pre-wrap;overflow-wrap:anywhere}
.af-tabs {display:flex;gap:16px;border-bottom:1px solid #ddd;margin-bottom:16px}.af-tabs button{padding:12px 2px;font-size:15px;line-height:24px;white-space:nowrap;border-bottom:2px solid transparent;color:#777}.af-tabs .active{border-color:#2f6fe4;color:#2f6fe4;font-weight:700}
.af-toolbar {display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px;margin:12px 0}.af-toolbar button,.af-link {color:#2f6fe4!important;font-size:14px;padding:8px 0!important;display:block}
.af-vehicle {display:flex;align-items:center;gap:8px;background:white;border-radius:12px;padding:12px;margin:10px 0}.af-vehicle-main{display:flex;align-items:center;gap:12px;text-align:left;width:100%;min-width:0}.af-vehicle-main>img{width:100px;height:76px;object-fit:cover;border-radius:8px;flex-shrink:0}.af-vehicle-main>span{display:grid;gap:5px;min-width:0}.af-vehicle-main strong{font-size:15px;line-height:22px;overflow-wrap:anywhere}.af-vehicle-main b{font-size:16px}.af-vehicle-main small{font-size:12px;color:#777}.af-vehicle>.af-link{flex-shrink:0}
.af-empty {padding:40px 12px;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;color:#777}.af-empty img{width:40px;height:40px}.af-empty h2{font-size:18px;color:#333;margin:0}.af-empty p{font-size:14px;line-height:23px;margin:0}.af-empty>.account-primary{margin-top:12px}
.af-form {display:grid;gap:16px}.af-form label{display:grid;gap:8px;font-size:14px;font-weight:600}.af-form input:not([type=radio]),.af-form select,.af-form textarea{width:100%;min-height:44px;border:1px solid #ddd;border-radius:8px;background:white;padding:10px 12px;font:inherit;font-weight:400;line-height:22px;box-sizing:border-box}.af-form textarea{resize:vertical}.af-form fieldset{border:1px solid #ddd;border-radius:8px;padding:12px;margin:0}.af-form legend{font-size:13px;color:#777}.af-form .af-plan{display:flex;align-items:center;gap:8px;padding:12px 0}.af-plan b{margin-left:auto;font-size:14px}.af-form input[type=radio],.af-switch input{accent-color:#2f6fe4;width:18px;height:18px;flex-shrink:0}.af-switch{display:flex;align-items:center;gap:8px;font-size:14px;margin:12px 0}.af-card>small{display:block}.af-actions{display:flex;gap:16px;flex-wrap:wrap;margin-top:12px}.af-actions button{font-size:14px;color:#2f6fe4;padding:8px 0}
.af-wallet{display:grid;gap:12px}.af-wallet>strong{font-size:32px;line-height:44px;color:#222}.af-ledger{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 0;border-bottom:1px solid #e7e7e7;font-size:14px}.af-ledger small{display:block;color:#888;font-size:12px}.af-ledger b{white-space:nowrap;color:#2f6fe4}.af-ledger .af-debit{color:#555}.af-total{display:flex;justify-content:space-between;border-top:1px solid #eee;padding:16px 0 0}.af-coupon>strong{font-size:28px;line-height:38px;color:#2f6fe4}.af-coupon h2{margin:8px 0;font-size:16px}
.af-confirm {padding:12px;border:1px solid #c9d9f8;background:#f3f7ff;border-radius:8px;font-size:14px;margin:8px 0}.af-confirm button{padding:8px 12px!important;color:#2f6fe4}.af-card summary{cursor:pointer;font-size:15px;font-weight:600}.account-primary:disabled{opacity:.5;cursor:default}
</style>
