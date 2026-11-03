import { accountDemoKey, listingActivityKey, emptyDemoState, readDemo, saveDemo, readActivity, balanceOf, demoVehicles, addPremium, refundPremium, validateReview, type DemoState, type DemoVehicle } from '~/services/accountDemo'

export function useAccountDemo() {
  const state = useState<DemoState>('account-demo-v2', emptyDemoState)
  const ready = useState('account-demo-ready', () => false)
  const notice = useState('account-demo-notice', () => '')
  const error = useState('account-demo-error', () => '')
  const context = useState('account-demo-context', () => ({ title: '전체 차량', url: '' }))
  function mutate(fn: (value: DemoState) => void, success = '저장했습니다.') {
    error.value = ''; notice.value = ''
    try {
      const next = structuredClone(toRaw(state.value)); fn(next)
      saveDemo(localStorage, next); state.value = next; notice.value = success
      return true
    } catch (e) { error.value = e instanceof Error ? e.message : '저장할 수 없습니다. 브라우저 저장 공간을 확인해 주세요.'; return false }
  }
  function syncActivity() {
    const a = readActivity(localStorage)
    if (a) { state.value.favorites = a.favorites; state.value.recent = a.recent }
  }
  function persistActivity() {
    try { localStorage.setItem(listingActivityKey, JSON.stringify({ favorites: state.value.favorites, recent: state.value.recent })); window.dispatchEvent(new Event('bbm-account-activity')); window.parent?.postMessage({ channel: 'bbm-account-v1', type: 'activity' }, location.origin) }
    catch { error.value = '브라우저에서 저장을 허용하지 않아 목록을 동기화하지 못했습니다.' }
  }
  function message(event: MessageEvent) {
    if (event.origin !== location.origin || event.source !== window.parent || event.data?.channel !== 'bbm-account-v1') return
    if (event.data.type === 'context' && typeof event.data.url === 'string' && typeof event.data.title === 'string') context.value = { title: event.data.title.slice(0, 150), url: event.data.url }
    if (event.data.type === 'activity') syncActivity()
  }
  onMounted(() => {
    if (!ready.value) { state.value = readDemo(localStorage); ready.value = true }
    syncActivity(); window.addEventListener('storage', syncActivity); window.addEventListener('message', message)
  })
  onBeforeUnmount(() => { window.removeEventListener('storage', syncActivity); window.removeEventListener('message', message) })
  function signIn(name: string, role: 'buyer' | 'dealer') {
    return mutate(s => { if (!name.trim() || name.trim().length > 30) throw new Error('닉네임을 1~30자로 입력해 주세요.'); s.signedIn = true; s.profile.name = name.trim(); s.profile.role = role }, '샘플 계정으로 로그인했습니다.')
  }
  function logout() { mutate(s => { s.signedIn = false }, '샘플 계정에서 로그아웃했습니다.') }
  function samples() { if (mutate(s => { s.favorites = [...s.favorites, ...structuredClone(demoVehicles).filter(v => !s.favorites.some(x => x.id === v.id))].slice(0, 100) }, '샘플 매물을 관심 목록에 추가했습니다.')) persistActivity() }
  function removeFavorite(id: string) { if (mutate(s => { s.favorites = s.favorites.filter(v => v.id !== id) }, '관심 매물에서 삭제했습니다.')) persistActivity() }
  function clearRecent() { if (mutate(s => { s.recent = [] }, '최근 본 기록을 지웠습니다.')) persistActivity() }
  function recordVehicle(vehicle: DemoVehicle) { if (mutate(s => { s.recent = [vehicle, ...s.recent.filter(v => v.id !== vehicle.id)].slice(0, 100) }, '매물을 엽니다.')) persistActivity() }
  function saveSearch(title: string, url: string) {
    return mutate(s => { const u = new URL(url, location.origin); if (u.origin !== location.origin || !['http:', 'https:'].includes(u.protocol)) throw new Error('올바른 검색 주소가 아닙니다.'); u.searchParams.delete('v'); u.searchParams.delete('pcauth'); if (s.searches.some(x => x.url === u.href)) throw new Error('이미 저장한 검색 조건입니다.'); if(s.searches.length >= 10) throw new Error('검색 조건은 최대 10개까지 저장할 수 있습니다.'); s.searches.unshift({ id: crypto.randomUUID(), title: title.trim() || '저장한 검색', url: u.href, notify: false }) }, '검색 조건을 저장했습니다.')
  }
  function saveReview(kind: 'vehicle' | 'complex', id: string, subject: string, rating: number, text: string) {
    return mutate(s => { if (!s.signedIn) throw new Error('샘플 계정으로 로그인해 주세요.'); validateReview(subject, rating, text); const value = { id: id || crypto.randomUUID(), kind, subject: subject.trim(), rating, text: text.trim(), createdAt: new Date().toISOString() }; s.reviews = [value, ...s.reviews.filter(r => r.id !== value.id)].slice(0, 100) }, '후기를 저장했습니다.')
  }
  function premium(listing: string, plan: string, coupon: string, operation: string) { return mutate(s => addPremium(s, listing, plan, coupon, operation, new Date().toISOString()), '샘플 프리미엄이 적용됐습니다. 실제 결제는 없습니다.') }
  function refund(id: string) { return mutate(s => refundPremium(s, id, crypto.randomUUID(), new Date().toISOString()), '샘플 신청을 취소하고 체험 포인트를 돌려드렸습니다.') }
  function reset() { return mutate(s => { Object.assign(s, emptyDemoState()) }, '샘플 계정 데이터를 초기화했습니다.') }
  return { state, ready, notice, error, context, balance: computed(() => balanceOf(state.value)), mutate, signIn, logout, samples, removeFavorite, clearRecent, recordVehicle, saveSearch, saveReview, premium, refund, reset }
}
