// 보배드림 리뉴얼 백엔드(staging.bbmuseum.co.kr /v1) 연결.
// 켜는 법: 주소에 ?bbm=proxy (같은 서버의 /api/bbm 중계 → 보배드림 서버) 또는 NUXT_PUBLIC_BBM_API.
//   보배드림 서버의 CORS 는 dev.bbmuseum.co.kr 만 허용하므로, 다른 주소(GitHub Pages)에서는 중계 서버가 있어야 한다.
// 로그인: 보배드림 로그인 토큰(Bearer)을 ?bbmtoken= 으로 한 번 넘기면 이 탭(sessionStorage)에만 둔다. 비밀번호는 받지 않는다.
import type { Uploaded } from './bbmArticle'

const TOKEN_KEY = 'bbm.api.token'

export interface BbmBoard { code: string, name: string, type: string, adultOnly: boolean }
export interface BbmBoardGroup { name: string, boards: BbmBoard[] }
export class BbmError extends Error {
  constructor(message: string, readonly status: number, readonly fields: Record<string, string[]> = {}) { super(message) }
}

function readQuery(name: string): string {
  if (typeof window === 'undefined') return ''
  const fromSearch = new URLSearchParams(window.location.search).get(name)
  if (fromSearch) return fromSearch
  const hash = window.location.hash
  const at = hash.indexOf('?')
  return at >= 0 ? new URLSearchParams(hash.slice(at + 1)).get(name) || '' : ''
}

/** 연결할 서버 주소. '' 이면 연결하지 않는다(브라우저 안 미리보기) */
export function bbmBase(): string {
  const configured = String(useRuntimeConfig().public.bbmApi || '')
  const chosen = readQuery('bbm') || configured
  if (!chosen || chosen === 'off') return ''
  if (chosen === 'proxy') return `${useRuntimeConfig().app.baseURL.replace(/\/$/, '')}/api/bbm`
  return /^https:\/\//.test(chosen) ? chosen.replace(/\/$/, '') : ''
}

/** ?bbmtoken= 을 이 탭에만 기억하고 주소에서 지운다 */
export function bbmToken(): string {
  if (typeof window === 'undefined') return ''
  const given = readQuery('bbmtoken')
  if (given) {
    try { sessionStorage.setItem(TOKEN_KEY, given) } catch { /* 저장 못 하면 이번만 쓴다 */ }
    const url = new URL(window.location.href)
    url.searchParams.delete('bbmtoken')
    url.hash = url.hash.replace(/([?&])bbmtoken=[^&]*&?/, '$1').replace(/[?&]$/, '')
    window.history.replaceState(window.history.state, '', url.toString())
    return given
  }
  try { return sessionStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}

async function call<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const base = bbmBase()
  if (!base) throw new BbmError('보배드림 서버 연결이 꺼져 있어요.', 0)
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (init.auth) {
    const token = bbmToken()
    if (!token) throw new BbmError('보배드림에 로그인해야 글을 올릴 수 있어요.', 401)
    headers.set('Authorization', `Bearer ${token}`)
  }
  let response: Response
  try { response = await fetch(`${base}${path}`, { ...init, headers }) }
  catch { throw new BbmError('보배드림 서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.', 0) }
  const text = await response.text()
  let body: Record<string, unknown> = {}
  try { body = text ? JSON.parse(text) : {} } catch { body = {} }
  if (!response.ok) {
    const fields = (body.errors || {}) as Record<string, string[]>
    const first = Object.values(fields)[0]?.[0]
    const message = response.status === 401 ? '로그인이 만료됐어요. 보배드림에 다시 로그인해 주세요.'
      : String(first || body.message || `보배드림 서버 오류(${response.status})`)
    throw new BbmError(message, response.status, fields)
  }
  return body as T
}

/** 게시판 묶음(GET /v1/board-groups). 딜러 페이지 · 차량 리뷰 전용 게시판은 이 화면에서 빼고 보인다 */
export async function loadBoardGroups(): Promise<BbmBoardGroup[]> {
  const res = await call<{ data: Array<{ name: string, boards: Array<{ code: string, name: string, type: string, is_adult_only: boolean }> }> }>('/v1/board-groups')
  return (res.data || []).map(group => ({
    name: group.name,
    boards: (group.boards || []).filter(board => board.type === 'general').map(board => ({ code: board.code, name: board.name, type: board.type, adultOnly: Boolean(board.is_adult_only) })),
  })).filter(group => group.boards.length)
}

export async function loadCategories(boardCode: string): Promise<Array<{ id: number, name: string }>> {
  const res = await call<{ data: Array<{ id: number, name: string }> }>(`/v1/boards/${encodeURIComponent(boardCode)}/categories`)
  return res.data || []
}

export async function uploadMedia(files: Blob[], alts: string[]): Promise<Uploaded[]> {
  const form = new FormData()
  files.forEach((file, index) => {
    const name = file instanceof File ? file.name : `upload-${index}.${file.type.split('/')[1] || 'bin'}`
    form.append('files[]', file, name)
    form.append('alt[]', alts[index] ?? '')
  })
  const res = await call<{ data: Uploaded[] }>('/v1/articles/media-uploads', { method: 'POST', body: form, auth: true })
  return res.data || []
}

export async function createArticle(payload: unknown): Promise<{ data?: { public_id?: string, id?: number } }> {
  return call('/v1/articles', { method: 'POST', body: JSON.stringify(payload), auth: true })
}

export async function saveArticleDraft(payload: unknown, draftId: number | string | null): Promise<number | string> {
  const res = draftId
    ? await call<{ data: { id: number } }>(`/v1/article-drafts/${draftId}`, { method: 'PATCH', body: JSON.stringify(payload), auth: true })
    : await call<{ data: { id: number } }>('/v1/article-drafts', { method: 'POST', body: JSON.stringify(payload), auth: true })
  return res.data.id
}

/** 지금 주소(blob: · data:)의 파일 내용 */
export async function fileOf(src: string, name: string): Promise<Blob> {
  const blob = await (await fetch(src)).blob()
  return new File([blob], name, { type: blob.type || 'application/octet-stream' })
}
