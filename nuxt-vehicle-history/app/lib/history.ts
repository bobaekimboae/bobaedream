export type Mode = 'dealer' | 'owner'
export type ItemState = 'ok' | 'warn' | 'unknown'
export type Category = 'ownership' | 'accident' | 'maintenance' | 'special'
export type Filter = 'all' | 'warn' | Category
type Scalar = string | number | null
export interface EventRecord {
  date?: string; title?: string; type?: string; result?: string; source?: string; mileage?: Scalar
}
export interface Accident extends EventRecord {
  paidAmount?: Scalar; partsAmount?: Scalar; laborAmount?: Scalar; paintingAmount?: Scalar; estimateAmount?: Scalar
}
export interface CountInfo {
  activeCount?: Scalar; unresolvedCount?: Scalar; productRegistrationCount?: Scalar
  hasHistory?: boolean | null; status?: string; label?: string
}
export interface Registration {
  ownerChangeCount?: Scalar; plateChangeCount?: Scalar
  ownerHistory?: EventRecord[] | null; plateHistory?: EventRecord[] | null; usageHistory?: EventRecord[] | null
  inspectionHistory?: EventRecord[] | null; maintenanceHistory?: EventRecord[] | null
  performanceCheckHistory?: EventRecord[] | null; mileageHistory?: EventRecord[] | null; timeline?: EventRecord[] | null
  recall?: CountInfo | null; seizure?: CountInfo | null; mortgage?: CountInfo | null; taxArrears?: CountInfo | null
  dealerHistory?: CountInfo | null; auction?: CountInfo | null; exportDeregistration?: CountInfo | null
  manufacturerWarranty?: CountInfo | null
}
export interface HistoryReport {
  plate?: string; lookupMode?: Mode; queriedAt?: string; grade?: string; riskGrade?: string
  vehicle?: {
    name?: string; manufacturer?: string; model?: string; trim?: string; trimName?: string
    modelYear?: Scalar; year?: string; fuel?: string; mileage?: Scalar; vinMasked?: string; plateMasked?: string
  }
  risk?: { grade?: string; reasons?: string[] }
  registration?: Registration
  insurance?: {
    accidentCount?: Scalar; ownDamageCount?: Scalar; ownDamageTotal?: Scalar; otherDamageCount?: Scalar
    otherDamageTotal?: Scalar; uninsuredPeriodCount?: Scalar
    totalLoss?: boolean | null; flood?: boolean | null; theft?: boolean | null; accidents?: Accident[] | null
  }
  sourceStatus?: { carHistory?: string; molit?: string }
}
export interface HistoryItem { id: string; name: string; value: string; category: Category; state: ItemState; note: string }
export interface LookupInput { plate: string; owner: string; mode: Mode; consent: boolean }
export interface LookupRequest {
  plate: string; owner?: string; consentId: string; purpose: string; molitLookupType: string
}
export const MODES = {
  dealer: {
    title: '번호판 단독 조회', detail: '매매용차량 · 소유자미동의 일부조회',
    badge: '국토부 기준 · 매매용차량/소유자미동의 일부조회',
    note: '제공 기관이 허용한 매매용차량·소유자미동의 일부 이력을 확인합니다. 소유자명은 전송하지 않습니다.',
    consent: '딜러 상품 차량의 이력조회를 위해 차량번호를 조회기관에 제공하는 데 동의합니다.',
    purpose: 'USED_CAR_DEALER_LISTING_CHECK', molitLookupType: 'SALE_VEHICLE_OR_OWNER_UNCONSENTED',
  },
  owner: {
    title: '소유자 확인 조회', detail: '소유자명 입력 · 기관별 제공 범위 확인',
    badge: '국토부 기준 · 소유자 정보 입력 조회',
    note: '소유자명은 조회 요청에만 사용하고 검색이력에는 저장하지 않습니다. 소유자명 입력만으로 본인 인증·소유자 동의가 증명되지는 않습니다.',
    consent: '조회 권한을 확인했으며 차량번호와 소유자명을 조회기관에 제공하는 데 동의합니다.',
    purpose: 'OWNER_VERIFIED_HISTORY_CHECK', molitLookupType: 'OWNER_CONSENTED_OR_SELF',
  },
} as const
export const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '전체' }, { key: 'warn', label: '주의 이력' },
  { key: 'ownership', label: '소유·용도' }, { key: 'accident', label: '사고·보험' },
  { key: 'maintenance', label: '검사·정비' }, { key: 'special', label: '특수 이력' },
]
export const normalizePlate = (v: string) => v.replace(/\s+/g, '').toUpperCase()
// Preserve legal entity names, digits and punctuation instead of silently changing the identity.
export const normalizeOwner = (v: string) => v.trim().replace(/\s+/g, ' ')
export const formatPlate = (v = '') => v.replace(/^(\d{2,3}[가-힣])(.+)$/, '$1 $2')
export function numeric(v: unknown): number | null {
  if (typeof v !== 'number' && typeof v !== 'string') return null
  if (typeof v === 'string' && !v.trim()) return null
  const n = Number(typeof v === 'string' ? v.replace(/,/g, '') : v)
  return Number.isFinite(n) && n >= 0 ? n : null
}
export const number = (v: unknown, suffix = '') => {
  const n = numeric(v); return n === null ? '정보 없음' : `${n.toLocaleString('ko-KR')}${suffix}`
}
export const money = (v: unknown) => number(v, '원')
export function date(v?: string) {
  if (!v) return '정보 없음'
  const normalized = /^\d{8}$/.test(v) ? `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}` : v
  const d = new Date(normalized)
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('ko-KR')
}
function dateOrder(v?: string) {
  if (!v) return Number.NEGATIVE_INFINITY
  const stamp = Date.parse(/^\d{8}$/.test(v) ? `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}` : v)
  return Number.isFinite(stamp) ? stamp : Number.NEGATIVE_INFINITY
}
export function validateLookup(input: LookupInput) {
  // Older regional plates and non-passenger vehicle plates must not be rejected solely by the UI.
  if (!/^(?:[가-힣]{2})?\d{2,3}[가-힣]\d{4}$/.test(normalizePlate(input.plate))) return '차량번호 형식을 확인해주세요.'
  if (input.mode === 'owner' && normalizeOwner(input.owner).length < 2) return '소유자 확인 조회는 소유자명을 입력해야 합니다.'
  if (!input.consent) return '조회 동의가 필요합니다.'
  return ''
}
export function makeRequest(input: LookupInput, consentId: string): LookupRequest {
  const validation = validateLookup(input)
  if (validation) throw new Error(validation)
  const mode = MODES[input.mode]
  return {
    plate: normalizePlate(input.plate), consentId, purpose: mode.purpose, molitLookupType: mode.molitLookupType,
    ...(input.mode === 'owner' ? { owner: normalizeOwner(input.owner) } : {}),
  }
}
export function countState(v: unknown): ItemState {
  if (typeof v === 'boolean') return v ? 'warn' : 'ok'
  const n = numeric(v); return n === null ? 'unknown' : n > 0 ? 'warn' : 'ok'
}
function countInfo(value?: CountInfo | null): { value: string; state: ItemState } {
  if (!value) return { value: '정보 없음', state: 'unknown' }
  const n = numeric(value.activeCount ?? value.unresolvedCount ?? value.productRegistrationCount)
  if (n !== null) return { value: number(n, '건'), state: countState(n) }
  if (typeof value.hasHistory === 'boolean') return { value: value.hasHistory ? '있음' : '없음', state: countState(value.hasHistory) }
  return { value: value.label || value.status || '정보 없음', state: 'unknown' }
}
export function buildHistory(data: HistoryReport): HistoryItem[] {
  const r = data.registration || {}, i = data.insurance || {}
  const items: HistoryItem[] = []
  const add = (id: string, name: string, value: string, category: Category, state: ItemState, note: string) => items.push({ id, name, value, category, state, note })
  const count = (id: string, name: string, value: unknown, category: Category, note: string) => add(id, name, number(value, '회'), category, countState(value), note)
  count('owners', '소유자 변경', r.ownerChangeCount, 'ownership', '변경 횟수 확인')
  count('plates', '번호판 변경', r.plateChangeCount, 'ownership', '번호판 변경 이력')
  add('usage', '용도 변경', Array.isArray(r.usageHistory) ? number(r.usageHistory.length, '건') : '정보 없음', 'ownership', Array.isArray(r.usageHistory) ? countState(r.usageHistory.length) : 'unknown', '영업용·관용 등 용도')
  add('accidents', '보험사고', number(i.accidentCount, '건'), 'accident', countState(i.accidentCount), '보험 미기록은 무사고를 의미하지 않습니다.')
  for (const [id, name, count, amount] of [
    ['own', '내 차 피해', i.ownDamageCount, i.ownDamageTotal], ['other', '상대 차 피해', i.otherDamageCount, i.otherDamageTotal],
  ] as const) add(id, name, numeric(count) === null ? '정보 없음' : `${number(count, '건')} · ${money(amount)}`, 'accident', countState(count), '수리비·보험금 구분 확인')
  const special = [i.totalLoss, i.flood, i.theft]
  const positive = special.some(v => v === true), complete = special.every(v => v === false)
  add('special', '전손·침수·도난', positive ? '있음' : complete ? '없음' : '일부 또는 전체 미확인', 'accident', positive ? 'warn' : complete ? 'ok' : 'unknown', '세 항목의 확인 여부를 함께 반영합니다.')
  add('uninsured', '보험 미가입 기간', number(i.uninsuredPeriodCount, '건'), 'accident', countState(i.uninsuredPeriodCount), '보험 공백 기간')
  const mileage = mileageRecords(data).at(-1)?.mileage
  add('mileage', '주행거리', number(mileage, 'km'), 'maintenance', numeric(mileage) === null ? 'unknown' : 'ok', '최근 제공 기록 기준')
  for (const [id, name, list] of [
    ['inspection', '자동차 검사', r.inspectionHistory], ['maintenance', '정비 이력', r.maintenanceHistory], ['performance', '성능·상태점검', r.performanceCheckHistory],
  ] as const) add(id, name, Array.isArray(list) ? number(list.length, '건') : '정보 없음', 'maintenance', Array.isArray(list) ? 'ok' : 'unknown', '제공 기관의 기록 범위 기준')
  for (const [id, name, info] of [
    ['recall', '리콜', r.recall], ['seizure', '압류', r.seizure], ['mortgage', '저당', r.mortgage], ['tax', '자동차세 체납', r.taxArrears],
  ] as const) { const v = countInfo(info); add(id, name, v.value, 'special', v.state, '현재 제공 상태 확인') }
  const dealer = countInfo(r.dealerHistory), auction = countInfo(r.auction)
  add('dealer', '매매상사·경매', `${dealer.value} · ${auction.value}`, 'special', [dealer.state, auction.state].includes('warn') ? 'warn' : [dealer.state, auction.state].includes('unknown') ? 'unknown' : 'ok', '상품용·경매 이력')
  for (const [id, name, info] of [['export', '수출·말소', r.exportDeregistration], ['warranty', '제조사 보증', r.manufacturerWarranty]] as const) {
    const v = countInfo(info); add(id, name, v.value, 'special', id === 'warranty' && v.state !== 'unknown' ? 'ok' : v.state, '기관 제공 정보 기준 · 상세 내용 확인')
  }
  return items
}
export function mileageRecords(data: HistoryReport): EventRecord[] {
  const r = data.registration || {}
  let list = Array.isArray(r.mileageHistory) ? r.mileageHistory.filter(x => numeric(x.mileage) !== null) : []
  if (!list.length && Array.isArray(r.inspectionHistory)) list = r.inspectionHistory.filter(x => numeric(x.mileage) !== null)
  if (!list.length && numeric(data.vehicle?.mileage) !== null) list = [{ date: data.queriedAt, mileage: data.vehicle!.mileage }]
  return [...list].sort((a,b) => dateOrder(a.date) - dateOrder(b.date))
}
export function mileageSummary(data: HistoryReport) {
  const valid = mileageRecords(data).filter(x => x.date && !Number.isNaN(new Date(/^\d{8}$/.test(x.date) ? `${x.date.slice(0,4)}-${x.date.slice(4,6)}-${x.date.slice(6,8)}` : x.date).getTime()))
  if (valid.length < 2) return { text: '비교 기록 부족', state: 'unknown' as ItemState }
  const reversed = valid.some((x, n) => n > 0 && numeric(x.mileage)! < numeric(valid[n - 1]!.mileage)!)
  return { text: reversed ? '감소 기록 확인 · 추가 확인 필요' : '제공 기록상 감소 없음', state: reversed ? 'warn' as ItemState : 'ok' as ItemState }
}
export function timeline(data: HistoryReport): EventRecord[] {
  const r = data.registration || {}
  let events = Array.isArray(r.timeline) ? [...r.timeline] : []
  if (!events.length) {
    for (const key of ['ownerHistory', 'plateHistory', 'usageHistory', 'inspectionHistory', 'maintenanceHistory', 'performanceCheckHistory'] as const) {
      if (Array.isArray(r[key])) events.push(...r[key]!.map(e => ({ ...e, title: e.title || e.type || ({ ownerHistory: '소유자 변경', plateHistory: '번호판 변경', usageHistory: '용도 변경', inspectionHistory: '검사', maintenanceHistory: '정비', performanceCheckHistory: '성능점검' })[key] })))
    }
    events.push(...(data.insurance?.accidents || []).map(a => ({ date: a.date, title: '보험사고', result: money(a.paidAmount) })))
  }
  return events.sort((a,b) => dateOrder(b.date) - dateOrder(a.date))
}
export function acceptReport(value: unknown): HistoryReport {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('API 응답 형식이 올바르지 않습니다.')
  const v = value as Record<string, unknown>
  if (!['vehicle', 'insurance', 'registration'].some(k => v[k] && typeof v[k] === 'object' && !Array.isArray(v[k]) && Object.keys(v[k] as object).length > 0)) throw new Error('API에서 조회 결과를 반환하지 않았습니다.')
  for (const key of ['vehicle', 'insurance', 'registration', 'sourceStatus', 'risk']) {
    if (v[key] != null && (typeof v[key] !== 'object' || Array.isArray(v[key]))) throw new Error('API 응답 형식이 올바르지 않습니다.')
  }
  const report = v as HistoryReport
  const registration = report.registration || {}
  for (const key of ['ownerHistory', 'plateHistory', 'usageHistory', 'inspectionHistory', 'maintenanceHistory', 'performanceCheckHistory', 'mileageHistory', 'timeline'] as const) {
    const list = registration[key]
    if (list != null && (!Array.isArray(list) || list.some(x => !x || typeof x !== 'object' || Array.isArray(x)))) throw new Error('API 이력 목록 형식이 올바르지 않습니다.')
  }
  const accidents = report.insurance?.accidents
  if (accidents != null && (!Array.isArray(accidents) || accidents.some(x => !x || typeof x !== 'object' || Array.isArray(x)))) throw new Error('API 사고 목록 형식이 올바르지 않습니다.')
  const statuses = Object.values(report.sourceStatus || {})
  if (statuses.some(s => typeof s !== 'string')) throw new Error('API 조회기관 상태 형식이 올바르지 않습니다.')
  if ([report.sourceStatus?.carHistory, report.sourceStatus?.molit].every(s => s && ['failed', 'unavailable', 'error'].includes(s))) throw new Error('모든 조회 기관에서 결과를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.')
  // Failed providers may still leave stale fields in an upstream payload. Never render them as a successful lookup.
  const failed = (s?: string) => s != null && s !== 'success' && s !== 'demo'
  return {
    ...report,
    insurance: failed(report.sourceStatus?.carHistory) ? undefined : report.insurance,
    registration: failed(report.sourceStatus?.molit) ? undefined : report.registration,
    vehicle: failed(report.sourceStatus?.molit) && report.vehicle ? { ...report.vehicle, mileage: null } : report.vehicle,
  }
}
export function providerLabel(status?: string) {
  return ({ success: '정상', failed: '조회 실패', unavailable: '조회 불가', error: '오류', demo: '시연값', pending: '조회 대기' } as Record<string, string>)[status || ''] || '상태 미확인'
}
export interface Recent { plate: string; name: string; grade: string; mode: Mode; date: string }
export const RECENT_KEY = 'bobaedream-vehicle-history'
export function readRecent(raw: string | null): Recent[] {
  try {
    const list: unknown = JSON.parse(raw || '[]')
    return Array.isArray(list) ? list.filter((x): x is Recent => x && typeof x.plate === 'string' && typeof x.name === 'string' && typeof x.date === 'string').slice(0,10).map(x => ({ plate: x.plate, name: x.name, grade: typeof x.grade === 'string' ? x.grade : '—', mode: x.mode === 'owner' ? 'owner' : 'dealer', date: x.date })) : []
  } catch { return [] }
}
