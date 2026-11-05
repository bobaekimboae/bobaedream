// 전용 화면 게시판(차량리뷰 · 연비·전비 · 차량 결함·불만 · 처즈왕 결함·불만 · 투후 리뷰) 공용 도구 (2026-11-04 넉스트 이식)
// 정적 판은 하위 화면마다 location.href 로 주소를 바꿔 새로 그렸다. 넉스트 판은 같은 쿼리를 router.push 로 바꾸고
// 쿼리를 읽는 computed 로 같은 화면을 다시 그린다(주소 · 쿼리 이름은 정적 판과 같다).
import type { LocationQueryRaw } from 'vue-router'

export type Row = Record<string, any> // 데이터 파일(data/board-*.js) 한 줄. 정적 판과 같이 자유 모양이다.

/** 정적 판 그림 주소 → 실제 주소. 'assets/…' 는 community 기준, '../…' 는 사이트 맨 위 기준(정적 판 상대 주소와 같은 곳). */
export function boardSrc(src: unknown): string {
  const s = String(src == null ? '' : src)
  if (!s) return ''
  if (/^(https?:|data:|blob:|\/)/.test(s)) return s
  if (s.startsWith('../')) return siteRoot() + s.slice(3)
  return communityAsset(s)
}

export function readJson<T>(key: string, fallback: T): T {
  try { return (JSON.parse(localStorage.getItem(key) || 'null') as T) ?? fallback } catch { return fallback }
}
export function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* 무시 */ }
}

/** 데이터 파일 전역 테이블(window.BBM_BOARD_TABLES[id]) */
export function boardTable(id: string): Row {
  const tables = (globalThis as Record<string, unknown>).BBM_BOARD_TABLES as Record<string, Row> | undefined
  return (tables && tables[id]) || { rows: [] }
}

/** 지금 주소 쿼리를 문자열 값 하나씩으로 */
export function useBoardQuery() {
  const route = useRoute()
  const router = useRouter()
  const q = computed<Record<string, string>>(() => {
    const out: Record<string, string> = {}
    Object.entries(route.query).forEach(([k, v]) => {
      const one = Array.isArray(v) ? v[0] : v
      if (one != null) out[k] = String(one)
    })
    return out
  })
  /** 정적 판 new URL(location.href) → searchParams 고치기 → pathname+search 와 같은 주소(목록 화면 '/') */
  function edit(change: (p: Record<string, string>) => void): Record<string, string> {
    const p = { ...q.value }
    change(p)
    delete p.v
    return p
  }
  function href(p: Record<string, string>) {
    return router.resolve({ path: '/', query: p as LocationQueryRaw }).href
  }
  function go(p: Record<string, string>) {
    router.push({ path: '/', query: p as LocationQueryRaw })
  }
  return { q, edit, href, go, router }
}

/** 정적 판 phone.className = '…' (전부 바꾸기).
 *  정적 판은 하위 화면마다 페이지를 새로 열었고, 그때마다 DOMContentLoaded 의 board-header-variants.js initialize 가
 *  전용 게시판이 class 를 바꾼 뒤에 headerYouTube 를 다시 붙였다. 주소가 바뀌어 그리는 경우(load)는 그것까지 따라 한다.
 *  같은 화면 안에서 다시 그리는 경우(필터 누르기 · 목록 다시 그리기)는 붙이지 않는다(정적 판과 같음). */
export function setPhoneClass(set: Set<string>, names: string, load = false) {
  set.clear()
  names.split(/\s+/).filter(Boolean).filter(n => n !== 'phone').forEach(n => set.add(n))
  if (load) set.add('headerYouTube')
}

export function numberKo(n: number) { return Number(n || 0).toLocaleString('ko-KR') }
export function numberLocale(n: number) { return Number(n || 0).toLocaleString() }
