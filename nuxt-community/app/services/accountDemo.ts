// Explicit browser-only SAMPLE adapter. This is not an authentication or payment API.
export const accountDemoKey = 'bbm.account.demo.v2'
export const listingActivityKey = 'bbm.account.listing-activity.v1'
export interface DemoVehicle { id: string; title: string; image: string; price: string; specs: string; url: string; status?: 'active' | 'sold'; premium?: boolean }
export interface DemoSearch { id: string; title: string; url: string; notify: boolean }
export interface DemoReview { id: string; kind: 'vehicle' | 'complex'; subject: string; rating: number; text: string; createdAt: string }
export interface DemoCoupon { id: string; title: string; discount: number; claimed: boolean; used: boolean }
export interface DemoTransaction { id: string; title: string; amount: number; type: 'gift' | 'premium' | 'refund'; listingId?: string; status: 'applied' | 'cancelled'; createdAt: string }
export interface DemoState {
  version: 2; signedIn: boolean
  profile: { name: string; role: 'buyer' | 'dealer'; shop: string; bio: string; notifications: boolean }
  favorites: DemoVehicle[]; recent: DemoVehicle[]; searches: DemoSearch[]; reviews: DemoReview[]; following?: string[]
  listings: DemoVehicle[]; coupons: DemoCoupon[]; transactions: DemoTransaction[]; giftClaimed: boolean
  partner: { company: string; note: string; createdAt: string } | null
  feedback: { id: string; text: string; createdAt: string }[]
}
export interface StoragePort { getItem(key: string): string | null; setItem(key: string, value: string): void }
export const demoPlans = [{ id: 'highlight', name: '매물 강조', points: 9900 }, { id: 'premium', name: '프리미엄 노출', points: 19900 }] as const
export const demoVehicles: DemoVehicle[] = [
  { id: 'sample-g80', title: '제네시스 G80 RG3', image: 'listing-photos/charancha-domestic-v01/g80_1003.webp', price: '4,290만원', specs: '2021년 · 40,000km · 가솔린', url: '?qf=guazi&lang=ko&category=국산차&maker=제네시스&model=G80', status: 'active' },
  { id: 'sample-carnival', title: '기아 카니발 하이리무진', image: 'listing-photos/charancha-domestic-v01/carnivalhigh_1002.webp', price: '7,450만원', specs: '샘플 매물 · 하이리무진', url: '?qf=guazi&lang=ko&category=국산차&maker=기아&model=카니발', status: 'active' },
]
export function emptyDemoState(): DemoState {
  return { version: 2, signedIn: false, profile: { name: '보배 회원', role: 'dealer', shop: '보배 샘플 모터스', bio: '', notifications: true }, favorites: [], recent: [], searches: [], reviews: [], listings: structuredClone(demoVehicles), coupons: [{ id: 'welcome', title: '첫 프리미엄 등록 혜택', discount: 5000, claimed: false, used: false }, { id: 'dealer', title: '딜러 체험 혜택', discount: 3000, claimed: false, used: false }], transactions: [{ id: 'welcome-gift', title: '체험 시작 포인트', amount: 30000, type: 'gift', status: 'applied', createdAt: '2026-11-03T00:00:00.000Z' }], giftClaimed: false, partner: null, feedback: [] }
}
export function balanceOf(state: DemoState) { return state.transactions.reduce((sum, t) => sum + t.amount, 0) }
export function safeListingUrl(value: string, origin: string): string | null {
  try { const u = new URL(value, origin); return u.origin === new URL(origin).origin && ['http:', 'https:'].includes(u.protocol) ? u.href : null } catch { return null }
}
function safeVehicle(value: unknown): value is DemoVehicle {
  const v = value as DemoVehicle
  return !!v && ['id', 'title', 'image', 'price', 'specs', 'url'].every(key => typeof v[key as keyof DemoVehicle] === 'string') && v.id.length < 300 && v.title.length < 300 && !/^(?:javascript|data):/i.test(v.url) && !/^(?:javascript|data):/i.test(v.image)
}
export function readDemo(storage: StoragePort): DemoState {
  const fallback = emptyDemoState()
  try {
    const s = JSON.parse(storage.getItem(accountDemoKey) || 'null') as DemoState | null
    if (!s || s.version !== 2 || typeof s.signedIn !== 'boolean' || !s.profile || typeof s.profile.name !== 'string' || !['buyer', 'dealer'].includes(s.profile.role)) return fallback
    if (!['favorites', 'recent', 'searches', 'reviews', 'listings', 'coupons', 'transactions', 'feedback'].every(k => Array.isArray(s[k as keyof DemoState]) && (s[k as keyof DemoState] as unknown[]).length <= 200)) return fallback
    if (![...s.favorites, ...s.recent, ...s.listings].every(safeVehicle)) return fallback
    if (!s.transactions.every(t => Number.isSafeInteger(t.amount) && typeof t.id === 'string') || balanceOf(s) < 0) return fallback
    if (!s.searches.every(x => typeof x.title === 'string' && typeof x.url === 'string' && !/^(?:javascript|data):/i.test(x.url))) return fallback
    return s
  } catch { return fallback }
}
export function saveDemo(storage: StoragePort, state: DemoState) { storage.setItem(accountDemoKey, JSON.stringify(state)) }
export function addPremium(state: DemoState, listingId: string, planId: string, couponId: string, operationId: string, now: string) {
  if (!state.signedIn) throw new Error('샘플 계정으로 로그인해 주세요.')
  if (state.transactions.some(t => t.id === operationId)) return
  const listing = state.listings.find(v => v.id === listingId)
  const plan = demoPlans.find(p => p.id === planId)
  if (!listing || listing.status !== 'active' || !plan) throw new Error('판매 중인 매물과 상품을 선택해 주세요.')
  if (listing.premium) throw new Error('이미 프리미엄이 적용된 샘플 매물입니다.')
  const coupon = couponId ? state.coupons.find(c => c.id === couponId && c.claimed && !c.used) : null
  if (couponId && !coupon) throw new Error('사용할 수 없는 쿠폰입니다.')
  const amount = Math.max(0, plan.points - (coupon?.discount || 0))
  if (balanceOf(state) < amount) throw new Error('체험 포인트가 부족합니다.')
  state.transactions.unshift({ id: operationId, title: `${plan.name} · ${listing.title}`, amount: -amount, type: 'premium', listingId, status: 'applied', createdAt: now })
  listing.premium = true
  if (coupon) coupon.used = true
}
export function refundPremium(state: DemoState, id: string, refundId: string, now: string) {
  const transaction = state.transactions.find(t => t.id === id && t.type === 'premium' && t.status === 'applied')
  if (!transaction) throw new Error('이미 취소했거나 취소할 수 없는 내역입니다.')
  transaction.status = 'cancelled'
  state.transactions.unshift({ id: refundId, title: `신청 취소 · ${transaction.title}`, amount: -transaction.amount, type: 'refund', status: 'applied', createdAt: now })
  const listing = state.listings.find(v => v.id === transaction.listingId)
  if (listing) listing.premium = false
}
export function validateReview(subject: string, rating: number, text: string) {
  if (!subject.trim() || subject.trim().length > 100 || !text.trim() || text.trim().length > 1000 || !Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('대상과 후기(1~1,000자), 별점 1~5점을 입력해 주세요.')
}
export function readActivity(storage: StoragePort): { favorites: DemoVehicle[]; recent: DemoVehicle[] } | null {
  try { const a = JSON.parse(storage.getItem(listingActivityKey) || 'null'); return a && Array.isArray(a.favorites) && Array.isArray(a.recent) && [...a.favorites, ...a.recent].every(safeVehicle) ? { favorites: a.favorites.slice(0, 100), recent: a.recent.slice(0, 100) } : null } catch { return null }
}
