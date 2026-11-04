// 글쓰기 본문 편집기(Tiptap 3.27.3) 전용 확장.
// 정적 판(contenteditable + execCommand)이 본문에 넣던 블록을 같은 HTML 모양으로 다룬다.
//  - figure.write-embed : 임베드 블록(고칠 수 없음, data-embed-* · data-meta-* 속성)
//  - section.editor-poll[data-poll] : 투표 카드(고칠 수 없음, 수정 · 삭제 버튼)
//  - 글꼴 · 글자 크기 : 정적 판 <font face/size> 와 같은 크기로 보이는 span style
import { Mark, Node, mergeAttributes } from '@tiptap/core'
import type { EmbedItem, PollData } from './legacyLibs'
import { embedLib, fixLegacyPaths, pollLib } from './legacyLibs'

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[char]!))

/* ---------- 임베드 ---------- */
export const EMBED_FIELDS = ['url', 'render', 'src', 'provider', 'title', 'tall'] as const
export const META_FIELDS = ['metaTitle', 'metaDescription', 'metaImage', 'metaSite', 'metaLogo', 'metaLang'] as const
const dataName = (key: string) => key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)

export type EmbedAttrs = Record<(typeof EMBED_FIELDS)[number] | (typeof META_FIELDS)[number] | 'uid' | 'loading', string>

export function embedItemFromAttrs(attrs: EmbedAttrs): EmbedItem {
  return {
    url: attrs.url, render: attrs.render, src: attrs.src, provider: attrs.provider, tall: attrs.tall === '1',
    title: attrs.metaTitle || attrs.title || '', description: attrs.metaDescription || '', image: attrs.metaImage || '',
    site: attrs.metaSite || '', logo: attrs.metaLogo || '', lang: attrs.metaLang || '',
  }
}

function embedInnerHtml(attrs: EmbedAttrs): string {
  const lib = embedLib()
  const item = embedItemFromAttrs(attrs)
  // 처음 넣을 때(뉴스 카드 불러오는 중)는 정적 판처럼 item.title 이 「미리보기를 불러오는 중…」
  if (!attrs.metaTitle && attrs.title) item.title = attrs.title
  const inner = lib ? (attrs.render === 'iframe' ? lib.frameHtml(item) : lib.cardHtml(item)) : ''
  return fixLegacyPaths(inner) + '<button type="button" class="write-embed-remove" data-remove-embed aria-label="임베드 삭제">×</button>'
}

function embedElement(attrs: EmbedAttrs): HTMLElement {
  const figure = document.createElement('figure')
  figure.className = 'write-embed'
  figure.contentEditable = 'false'
  EMBED_FIELDS.forEach((key) => { figure.setAttribute(`data-embed-${key}`, attrs[key] || '') })
  META_FIELDS.forEach((key) => { if (attrs[key] !== undefined && attrs[key] !== null) figure.setAttribute(`data-${dataName(key)}`, attrs[key] || '') })
  figure.innerHTML = embedInnerHtml(attrs)
  if (attrs.tall === '1') figure.classList.add('is-tall')
  if (attrs.loading === '1') figure.classList.add('is-loading')
  return figure
}

export interface WriteBlockCallbacks {
  onRemoveEmbed?: () => void
  onEditPoll?: () => void
  onRemovePoll?: () => void
}

export const WriteEmbed = Node.create<WriteBlockCallbacks>({
  name: 'writeEmbed',
  group: 'block',
  atom: true,
  selectable: false,
  draggable: false,
  addOptions() { return {} },
  addAttributes() {
    const plain = (key: string, attr: string) => ({ default: '', parseHTML: (el: HTMLElement) => el.getAttribute(attr) || '', renderHTML: () => ({}) })
    return {
      uid: { default: '', rendered: false },
      loading: { default: '', rendered: false },
      ...Object.fromEntries(EMBED_FIELDS.map(key => [key, plain(key, `data-embed-${key}`)])),
      ...Object.fromEntries(META_FIELDS.map(key => [key, { default: null, parseHTML: (el: HTMLElement) => el.getAttribute(`data-${dataName(key)}`), renderHTML: () => ({}) }])),
    }
  },
  parseHTML() { return [{ tag: 'figure.write-embed' }] },
  renderHTML({ node }) {
    // 저장 HTML 은 정적 판 figure 와 같은 속성 · 안쪽 HTML (메타는 받아 둔 것만)
    return embedElement(node.attrs as EmbedAttrs)
  },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      let current = node
      const dom = embedElement(node.attrs as EmbedAttrs)
      dom.addEventListener('click', (event) => {
        const target = event.target as HTMLElement
        if (!target.closest('[data-remove-embed]')) return
        event.preventDefault()
        const pos = typeof getPos === 'function' ? getPos() : undefined
        if (typeof pos !== 'number') return
        editor.chain().deleteRange({ from: pos, to: pos + current.nodeSize }).run()
        this.options.onRemoveEmbed?.()
      })
      return {
        dom,
        ignoreMutation: () => true,
        stopEvent: event => event.type !== 'dragstart' && (event.target as HTMLElement).closest?.('[data-remove-embed]') !== null,
        update: (updated) => {
          if (updated.type !== current.type) return false
          current = updated
          const next = embedElement(updated.attrs as EmbedAttrs)
          dom.className = next.className
          ;[...next.attributes].forEach(attr => dom.setAttribute(attr.name, attr.value))
          dom.innerHTML = next.innerHTML
          return true
        },
      }
    }
  },
})

/* ---------- 투표 ---------- */
export function editorPollHtml(pollData: PollData): string {
  const lib = pollLib()
  const card = lib ? lib.html(pollData) : `<strong>${escapeHtml(pollData.title)}</strong>`
  return `<div class="editor-poll-actions"><button type="button" data-edit-poll>수정</button><button type="button" data-remove-poll>삭제</button></div>${card}`
}

function pollElement(data: string): HTMLElement {
  const section = document.createElement('section')
  section.className = 'editor-poll'
  section.contentEditable = 'false'
  section.setAttribute('data-poll', data)
  let parsed: PollData | null = null
  try { parsed = JSON.parse(data) as PollData } catch { parsed = null }
  section.innerHTML = parsed ? editorPollHtml(parsed) : ''
  return section
}

export const EditorPoll = Node.create<WriteBlockCallbacks>({
  name: 'editorPoll',
  group: 'block',
  atom: true,
  selectable: false,
  draggable: false,
  addOptions() { return {} },
  addAttributes() {
    return { data: { default: '', parseHTML: (el: HTMLElement) => el.getAttribute('data-poll') || '', renderHTML: () => ({}) } }
  },
  parseHTML() { return [{ tag: 'section.editor-poll[data-poll]' }] },
  renderHTML({ node }) { return pollElement(String(node.attrs.data || '')) },
  addNodeView() {
    return ({ node }) => {
      const dom = pollElement(String(node.attrs.data || ''))
      dom.addEventListener('click', (event) => {
        const target = event.target as HTMLElement
        if (target.closest('[data-edit-poll]')) { event.preventDefault(); this.options.onEditPoll?.() }
        if (target.closest('[data-remove-poll]')) { event.preventDefault(); this.options.onRemovePoll?.() }
      })
      return {
        dom,
        ignoreMutation: () => true,
        stopEvent: event => Boolean((event.target as HTMLElement).closest?.('[data-edit-poll],[data-remove-poll]')),
        update: (updated) => {
          if (updated.type.name !== 'editorPoll') return false
          const next = pollElement(String(updated.attrs.data || ''))
          dom.setAttribute('data-poll', next.getAttribute('data-poll') || '')
          dom.innerHTML = next.innerHTML
          return true
        },
      }
    }
  },
})

/* ---------- 글꼴 · 글자 크기 ---------- */
export const LegacyTextStyle = Mark.create({
  name: 'legacyTextStyle',
  addAttributes() {
    return {
      fontFamily: { default: null, parseHTML: (el: HTMLElement) => el.style.fontFamily?.replace(/["']/g, '') || el.getAttribute('face') || null },
      fontSize: { default: null, parseHTML: (el: HTMLElement) => el.style.fontSize || null },
    }
  },
  parseHTML() {
    return [
      { tag: 'span', getAttrs: el => ((el as HTMLElement).style.fontFamily || (el as HTMLElement).style.fontSize) ? null : false },
      // 정적 판 임시저장(<font face size>)도 되살린다
      { tag: 'font', getAttrs: (el) => {
        const node = el as HTMLElement
        const size = Number(node.getAttribute('size') || 0)
        return { fontFamily: node.getAttribute('face') || null, fontSize: size ? `${[10, 13, 16, 18, 24, 32, 48][Math.max(1, Math.min(7, size)) - 1]}px` : null }
      } },
    ]
  },
  renderHTML({ HTMLAttributes }) {
    const style = [HTMLAttributes.fontFamily ? `font-family: ${HTMLAttributes.fontFamily}` : '', HTMLAttributes.fontSize ? `font-size: ${HTMLAttributes.fontSize}` : ''].filter(Boolean).join('; ')
    return ['span', mergeAttributes(style ? { style } : {}), 0]
  },
})
