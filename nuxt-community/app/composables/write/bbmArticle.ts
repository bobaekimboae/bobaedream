// 보배드림 리뉴얼 백엔드(Laravel 12, staging.bbmuseum.co.kr /v1) 게시글 등록 형식으로 바꾸기.
// 기준: dev.bbmuseum.co.kr /community/write 화면이 보내는 값(2026-11-05 배포본 번들에서 확인).
//   POST /v1/articles/media-uploads  FormData files[] · alt[]  → data: [{ upload_id, url }]
//   POST /v1/articles { board_code, category_id, title, content, type, link_url, draft_id, media, poll? }
//     type: normal(일반) · feed · link · poll(설문조사)
//     media: 사진 { upload_id, sort_order, alt } · 동영상 { upload_id, thumbnail_upload_id, sort_order }
//     poll: { selection_type: single|multiple, duration_days: 1~7, result_visibility: 'voters_only', options: [{ label, upload_id, sort_order }] }
//     본문의 동영상은 <video src data-type="community-video" controls playsinline preload="metadata" poster>
// 이 파일은 DOM 만 쓰는 순수 변환이라 시험(vitest)으로 확인한다.
import type { PollData } from './legacyLibs'

export interface Uploaded { upload_id: number | string, url: string }

/** 올려야 할 파일 한 개(본문 사진 · 동영상 · 동영상 대표 이미지 · 투표 항목 사진) */
export interface PendingUpload {
  key: string // 본문 안의 지금 주소(blob: · data:)
  role: 'image' | 'video' | 'poster' | 'poll'
  alt: string
}

export interface ArticleInput {
  html: string
  title: string
  boardCode: string
  categoryId?: number | null
  draftId?: number | string | null
  /** 본문 위에 붙일 글 종류 요약 줄(서버에 따로 칸이 없는 값) */
  summary?: string[]
}

export interface BbmArticlePayload {
  board_code: string
  category_id: number | null
  title: string
  content: string | null
  type: 'normal' | 'poll'
  link_url: null
  draft_id: number | string | null
  media: Array<{ upload_id: number | string, sort_order: number, alt?: string, thumbnail_upload_id?: number | string }>
  poll?: { selection_type: 'single' | 'multiple', duration_days: number, result_visibility: 'voters_only', options: Array<{ label: string, upload_id: number | string | null, sort_order: number }> }
}

const isLocal = (src: string) => /^(blob:|data:)/.test(src)

function parse(html: string): HTMLElement {
  const box = document.createElement('div')
  box.innerHTML = html
  return box
}

function pollOf(box: HTMLElement): PollData | null {
  const el = box.querySelector<HTMLElement>('section.editor-poll[data-poll]')
  if (!el) return null
  try { return JSON.parse(el.getAttribute('data-poll') || '') as PollData } catch { return null }
}

/** 본문에서 서버에 먼저 올려야 할 파일 목록(같은 주소는 한 번만) */
export function pendingUploads(html: string): PendingUpload[] {
  const box = parse(html)
  const out: PendingUpload[] = []
  const seen = new Set<string>()
  const push = (key: string, role: PendingUpload['role'], alt = '') => {
    if (!key || !isLocal(key) || seen.has(key)) return
    seen.add(key)
    out.push({ key, role, alt })
  }
  box.querySelectorAll<HTMLElement>('figure.write-media').forEach((figure) => {
    const caption = figure.querySelector('figcaption')?.textContent?.trim() || ''
    if (figure.getAttribute('data-kind') === 'video') {
      const video = figure.querySelector('video')
      push(video?.getAttribute('src') || '', 'video')
      push(video?.getAttribute('poster') || '', 'poster')
    }
    else push(figure.querySelector('img')?.getAttribute('src') || '', 'image', caption)
  })
  for (const image of pollOf(box)?.images || []) push(image, 'poll')
  return out
}

/** 자동 종료일 → 1~7일(서버가 받는 범위). 없으면 1일 */
export function pollDays(endsAt: string, now = Date.now()): number {
  if (!endsAt) return 1
  const days = Math.ceil((new Date(endsAt).getTime() - now) / 86_400_000)
  return Math.min(7, Math.max(1, Number.isFinite(days) ? days : 1))
}

const esc = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')

/** 올린 결과(uploaded: 지금 주소 → 서버 주소 · 번호)로 등록 값을 만든다 */
export function buildArticlePayload(input: ArticleInput, uploaded: Map<string, Uploaded>): BbmArticlePayload {
  const box = parse(input.html)
  const media: BbmArticlePayload['media'] = []
  let order = 0
  const server = (src: string) => uploaded.get(src)

  box.querySelectorAll<HTMLElement>('figure.write-media').forEach((figure) => {
    const isVideo = figure.getAttribute('data-kind') === 'video'
    const caption = figure.querySelector('figcaption')?.textContent?.trim() || ''
    if (isVideo) {
      const video = figure.querySelector('video')
      const file = server(video?.getAttribute('src') || '')
      if (!file) { figure.remove(); return }
      const poster = server(video?.getAttribute('poster') || '')
      const attrs = [`src="${esc(file.url)}"`, 'data-type="community-video"', 'controls="true"', 'playsinline="true"', 'preload="metadata"']
      if (poster) attrs.push(`poster="${esc(poster.url)}"`)
      const holder = document.createElement('div')
      holder.innerHTML = `<video ${attrs.join(' ')}></video>`
      figure.replaceWith(holder.firstElementChild!)
      media.push({ upload_id: file.upload_id, sort_order: order++, ...(poster ? { thumbnail_upload_id: poster.upload_id } : {}) })
      return
    }
    const img = figure.querySelector('img')
    const file = server(img?.getAttribute('src') || '')
    if (!img || !file) { figure.remove(); return }
    img.setAttribute('src', file.url)
    if (caption) img.setAttribute('alt', caption)
    figure.removeAttribute('data-media-id')
    media.push({ upload_id: file.upload_id, sort_order: order++, alt: caption })
  })

  const poll = pollOf(box)
  box.querySelectorAll('section.editor-poll').forEach(el => el.remove())

  if (input.summary?.length) {
    const lines = document.createElement('p')
    lines.textContent = input.summary.join(' · ')
    box.prepend(lines)
  }
  // 편집기 전용 표시(자리표시 · 설명 속성 등)와 끝의 빈 줄은 빼고, 비어 있으면 null
  box.querySelectorAll('*').forEach((el) => {
    for (const name of el.getAttributeNames()) if (name.startsWith('data-') && !(el.tagName === 'VIDEO' && name === 'data-type')) el.removeAttribute(name)
  })
  while (box.lastElementChild?.tagName === 'P' && !box.lastElementChild.textContent?.trim() && !box.lastElementChild.querySelector('img,video')) box.lastElementChild.remove()
  const content = box.textContent?.trim() || box.querySelector('img,video,hr') ? box.innerHTML : null

  const payload: BbmArticlePayload = {
    board_code: input.boardCode,
    category_id: input.categoryId ?? null,
    title: input.title.trim(),
    content,
    type: poll ? 'poll' : 'normal',
    link_url: null,
    draft_id: input.draftId ?? null,
    media,
  }
  if (poll) {
    payload.poll = {
      selection_type: poll.multiple ? 'multiple' : 'single',
      duration_days: pollDays(poll.endsAt),
      result_visibility: 'voters_only',
      options: poll.options.map((label, index) => ({ label: label.trim(), upload_id: server(poll.images?.[index] || '')?.upload_id ?? null, sort_order: index })).filter(option => option.label),
    }
  }
  return payload
}
