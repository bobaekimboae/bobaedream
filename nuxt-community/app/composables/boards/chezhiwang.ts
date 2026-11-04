// 처즈왕 결함·불만(board=chezhiwang-complaint) 공용 계산.
// 정본: chezhiwang-complaint-board.js(목록 · 상세 · 등록) + chezhiwang-complaint-enhancements.js(등록 보강) + chezhiwang-complaint-stats.js(순위 · 필터 · 검색 · 소식)
import { boardTable, readJson, type Row } from './boardUtil'

export const czwStorageKey = 'bobae-chezhiwang-complaints-v1'
export const czwCommentKey = 'bobae-chezhiwang-complaint-comments-v1'
export const czwSearchKey = 'bobae-chezhiwang-search-v1'
export const czwIcons: Record<string, string> = {
  back: 'assets/reddit-ui/back.svg', share: 'assets/chzzk-detail/icons/share-reddit.svg', chat: 'assets/reactions/comment-outline.svg', like: 'assets/reactions/recommend.svg',
  save: 'assets/chzzk-detail/icons/bookmark.svg', write: 'assets/reddit-ui/write.svg', photo: 'assets/chzzk-detail/icons/camera.svg', check: '../%61ssets/register/chotot-v01/check-mark.svg',
}
export const czsIcons: Record<string, string> = {
  search: 'assets/reddit-ui/search.svg', right: 'assets/reddit-ui/chevron-right.svg', del: 'assets/reddit-ui/delete.svg', chat: 'assets/reactions/comment-outline.svg',
  like: 'assets/reactions/recommend.svg', back: 'assets/reddit-ui/back.svg', share: 'assets/chzzk-detail/icons/share-reddit.svg', filter: 'assets/chzzk-detail/icons/filter.svg',
  chevron: 'assets/reddit-ui/chevron-down.svg',
}
export const KEYS = ['f_from', 'f_to', 'f_pmin', 'f_pmax', 'f_brand', 'f_model', 'f_trim', 'f_body', 'f_fuel', 'f_price', 'f_origin', 'f_country', 'f_age', 'f_quality', 'f_service', 'f_other', 'f_sales']

export const T = () => boardTable('chezhiwang-complaint')
export const cats = (): Record<string, string[]> => T().categories || { 품질: [], 서비스: [], 기타: [] }
export const localRows = () => readJson<Row[]>(czwStorageKey, []) || []
export const allRows = (): Row[] => localRows().concat(T().rows || [])
export function findRow(id: string) { const rows = allRows(); return rows.find(r => String(r.complaintId || r.id) === String(id)) || rows[0] }

// ── 주소 ──
/** 처즈왕 board.js route(id): board · czw 만 바꾸고 나머지 쿼리는 그대로 */
export function czwRoute(q: Record<string, string>, id: string) {
  const p: Record<string, string> = { ...q, board: 'chezhiwang-complaint' }
  if (id) p.czw = id
  else delete p.czw
  delete p.v
  return p
}
/** 통계 href(params): 하위 화면 · 필터 키를 모두 지우고 params 만 넣는다 */
export function czsHref(q: Record<string, string>, params: Record<string, string | undefined>) {
  const p: Record<string, string> = { ...q, board: 'chezhiwang-complaint' }
  ;['czw', 'for', 'rank', 'czwtab', 'qs', 'czsort', ...KEYS, 'v'].forEach(k => delete p[k])
  Object.keys(params || {}).forEach((k) => { if (params[k]) p[k] = params[k]! })
  return p
}
export function current(q: Record<string, string>) { const o: Record<string, string> = {}; KEYS.forEach((k) => { if (q[k]) o[k] = q[k]! }); return o }
export function vals(o: Record<string, string | undefined>, k: string) { return String(o[k] || '').split(',').filter(Boolean) }

// ── 문제 분류 ──
export function carName(r: Row) { return [r.brand, r.model].filter(Boolean).join(' ') }
function partClass(r: Row) { return r.issueType === '서비스' ? 'is-service' : r.issueType === '기타' ? 'is-other' : 'is-quality' }
/** board.js pairClass(cat, r) */
export function boardPairClass(cat: string, r: Row) {
  const c = cats()
  if ((c['서비스'] || []).indexOf(cat) > -1) return 'is-service'
  if ((c['기타'] || []).indexOf(cat) > -1) return 'is-other'
  if ((c['품질'] || []).indexOf(cat) > -1) return 'is-quality'
  return partClass(r)
}
export function boardPairs(r: Row): Array<{ cls: string; a: string; b: string }> {
  const list: string[][] = r.problems && r.problems.length ? r.problems : [[r.issueType, r.subtypes]]
  return list.map(p => ({ cls: boardPairClass(p[0]!, r), a: p[0]!, b: p[1]! }))
}
/** stats.js pairClass(c) */
export function pairClass(c: string) { const k = cats(); return (k['서비스'] || []).indexOf(c) > -1 ? 'is-service' : (k['기타'] || []).indexOf(c) > -1 ? 'is-other' : 'is-quality' }
export function groupName(c: string) { const k = cats(); return (k['서비스'] || []).indexOf(c) > -1 ? '서비스' : (k['기타'] || []).indexOf(c) > -1 ? '기타' : '품질' }
export function groupKey(c: string) { return ({ 서비스: 'f_service', 기타: 'f_other' } as Record<string, string>)[groupName(c)] || 'f_quality' }

// ── 필터 일치 ──
function problemCats(r: Row) { return (r.problems || []).map((p: string[]) => p[0]).concat(String(r.subtypes || '').split(/\s+·\s+/)) }
function ageBucket(r: Row) {
  const a = new Date(r.purchaseDate); const b = new Date(r.problemDate)
  if (isNaN(a.valueOf()) || isNaN(b.valueOf())) return ''
  const m = (b.valueOf() - a.valueOf()) / 864e5 / 30.4
  return m <= 1 ? '1개월 이내' : m <= 3 ? '1~3개월' : m <= 6 ? '3~6개월' : m <= 12 ? '6~12개월' : m <= 36 ? '1~3년' : '3년 이상'
}
export const PRICE: Array<[string, number, number]> = [['1천만원 이하', 0, 1000], ['1~2천만원', 1000, 2000], ['2~3천만원', 2000, 3000], ['3~4천만원', 3000, 4000], ['4~5천만원', 4000, 5000], ['5~6천만원', 5000, 6000], ['6~7천만원', 6000, 7000], ['7~8천만원', 7000, 8000], ['8천만원~1억', 8000, 10000], ['1억~1억5천', 10000, 15000], ['1억5천 이상', 15000, 1e9]]
export const BODY: Array<[string, string, string[]?]> = [['세단', 'sedan', ['경차', '소형', '준중형', '중형', '준대형', '대형']], ['SUV', 'suv', ['소형', '준중형', '중형', '준대형', '대형']], ['MPV', 'rv', ['준중형', '중형', '준대형', '대형']], ['스포츠카', 'coupe'], ['승합', 'cargo-van'], ['픽업', 'pickup'], ['기타', 'other']]
export const FUEL: Array<[string, string[]?]> = [['가솔린'], ['디젤'], ['하이브리드'], ['친환경차', ['전기', '플러그인 하이브리드', '주행거리 연장형', '수소']], ['마일드 하이브리드', ['가솔린+48V', '가솔린+24V']], ['LPG']]
export const SALES: Array<[string, string]> = [['500', '500대 이상'], ['1000', '1,000대 이상'], ['3000', '3,000대 이상'], ['5000', '5,000대 이상']]
function priceOk(r: Row, o: Record<string, string | undefined>) {
  const p = Number(r.price); const sel = vals(o, 'f_price')
  if (!sel.length && !o.f_pmin && !o.f_pmax) return true
  if (!p) return false
  if (sel.length && !sel.some((l) => { const b = PRICE.filter(x => x[0] === l)[0]; return b && p >= b[1] && p < b[2] })) return false
  if (o.f_pmin && p < Number(o.f_pmin)) return false
  if (o.f_pmax && p > Number(o.f_pmax)) return false
  return true
}
function bodyOk(r: Row, o: Record<string, string | undefined>) { const sel = vals(o, 'f_body'); return !sel.length || sel.some(v => v === r.bodyType || v === r.bodyType + '-' + r.carClass) }
function fuelOk(r: Row, o: Record<string, string | undefined>) {
  const sel = vals(o, 'f_fuel')
  return !sel.length || sel.some((v) => { if (v === r.fuel) return true; const g = FUEL.filter(f => f[0] === v && f[1])[0]; return !!(g && g[1]!.indexOf(r.fuel) > -1) })
}
export function match(r: Row, o: Record<string, string | undefined>) {
  const d = String(r.publishedAt || '').slice(0, 10)
  if (o.f_from && d < o.f_from) return false
  if (o.f_to && d > o.f_to) return false
  const checks = [['f_brand', 'brand'], ['f_model', 'model'], ['f_trim', 'trim'], ['f_origin', 'brandOrigin'], ['f_country', 'country']]
  for (const c of checks) { const v = vals(o, c[0]!); if (v.length && v.indexOf(r[c[1]!]) < 0) return false }
  if (!priceOk(r, o) || !bodyOk(r, o) || !fuelOk(r, o)) return false
  const age = vals(o, 'f_age'); if (age.length && age.indexOf(ageBucket(r)) < 0) return false
  const pc = problemCats(r); const need = vals(o, 'f_quality').concat(vals(o, 'f_service'), vals(o, 'f_other'))
  if (need.length && !pc.some((c: string) => need.indexOf(c) > -1)) return false
  return true
}

// ── 선택 조건 칩(chipsHtml) ──
const LABEL: Record<string, string> = { f_brand: '제조사', f_model: '모델', f_trim: '세부 모델', f_body: '차종', f_fuel: '연료', f_price: '가격', f_origin: '브랜드 속성', f_country: '국가', f_age: '고장 발생 시기', f_quality: '품질 문제', f_service: '서비스 문제', f_other: '기타 문제' }
export interface CzsChip { label: string; drop: string; value?: string }
export function chipList(o: Record<string, string | undefined>, forRank: boolean): CzsChip[] {
  const out: CzsChip[] = []
  if (o.f_from || o.f_to) out.push({ label: (o.f_from || '처음') + ' ~ ' + (o.f_to || '오늘'), drop: 'f_from,f_to' })
  if (o.f_pmin || o.f_pmax) out.push({ label: (o.f_pmin ? Number(o.f_pmin).toLocaleString('ko-KR') : '') + '~' + (o.f_pmax ? Number(o.f_pmax).toLocaleString('ko-KR') : '') + '만원', drop: 'f_pmin,f_pmax' })
  Object.keys(LABEL).forEach((k) => { vals(o, k).forEach((v) => { out.push({ label: v.replace('-', ' '), drop: k, value: v }) }) })
  if (forRank && o.f_sales) out.push({ label: Number(o.f_sales).toLocaleString('ko-KR') + '대 이상', drop: 'f_sales' })
  return out
}
/** bindChips 의 주소 바꾸기: 지금 주소에서 그 조건만 뺀다 */
export function dropChip(q: Record<string, string>, chip: CzsChip) {
  const p = { ...q }
  chip.drop.split(',').forEach((k) => {
    if (chip.value === undefined) { delete p[k]; return }
    const rest = (p[k] || '').split(',').filter(v => v && v !== chip.value)
    if (rest.length) p[k] = rest.join(',')
    else delete p[k]
  })
  return p
}

export function initial(v: string) {
  const c = String(v).charAt(0); const code = c.charCodeAt(0) - 0xAC00
  if (code >= 0 && code < 11172) return 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.charAt(Math.floor(code / 588)).replace('ㄲ', 'ㄱ').replace('ㄸ', 'ㄷ').replace('ㅃ', 'ㅂ').replace('ㅆ', 'ㅅ').replace('ㅉ', 'ㅈ')
  return /[A-Za-z]/.test(c) ? c.toUpperCase() : '#'
}
export function fmtDate(v: string) { return v ? v.replace(/^(\d{4})-(\d{2})-(\d{2})$/, (_m, y, mo, d) => y + '년 ' + Number(mo) + '월 ' + Number(d) + '일') : '' }
