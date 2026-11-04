// 글쓰기 본문 편집기(Tiptap 3.27.3) 전용 확장. 원본: public/community/chzzk-write.js
// 정적 판(contenteditable + execCommand)이 본문에 넣던 블록을 같은 HTML 모양으로 다룬다.
//  - figure.write-embed : 임베드 블록(고칠 수 없음, data-embed-* · data-meta-* 속성, 안쪽 HTML 그대로)
//  - section.editor-poll[data-poll] : 투표 카드(고칠 수 없음, 수정 · 삭제 버튼)
//  - 글꼴 · 글자 크기 : 정적 판 <font face/size> 와 같은 크기로 보이는 span style
import { Mark, Node, mergeAttributes } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import type { EmbedItem, PollData } from './legacyLibs'
import { pollLib } from './legacyLibs'

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[char]!))

/* ---------- 임베드 ---------- */
export const EMBED_FIELDS = ['url', 'render', 'src', 'provider', 'title', 'tall'] as const
export const META_FIELDS = ['metaTitle', 'metaDescription', 'metaImage', 'metaSite', 'metaLogo', 'metaLang'] as const
const dataName = (key: string) => key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)
export const REMOVE_EMBED_HTML = '<button type="button" class="write-embed-remove" data-remove-embed aria-label="임베드 삭제">×</button>'

export interface EmbedAttrs {
  uid: string
  loading: string
  /** 정적 판 figure.innerHTML 에서 삭제 버튼을 뺀 부분(임베드 라이브러리가 만든 그대로) */
  html: string
  url: string
  render: string
  src: string
  provider: string
  title: string
  tall: string
  metaTitle: string | null
  metaDescription: string | null
  metaImage: string | null
  metaSite: string | null
  metaLogo: string | null
  metaLang: string | null
}

/** 정적 판 collectEmbeds() 와 같은 모양 */
export function embedItemFromAttrs(attrs: EmbedAttrs): EmbedItem {
  return {
    url: attrs.url, render: attrs.render, src: attrs.src, provider: attrs.provider, tall: attrs.tall === '1',
    title: attrs.metaTitle || attrs.title || '', description: attrs.metaDescription || '', image: attrs.metaImage || '',
    site: attrs.metaSite || '', logo: attrs.metaLogo || '', lang: attrs.metaLang || '',
  }
}

function embedElement(attrs: EmbedAttrs): HTMLElement {
  const figure = document.createElement('figure')
  figure.className = 'write-embed'
  figure.contentEditable = 'false'
  EMBED_FIELDS.forEach((key) => { figure.setAttribute(`data-embed-${key}`, attrs[key] || '') })
  META_FIELDS.forEach((key) => { if (attrs[key] !== null && attrs[key] !== undefined) figure.setAttribute(`data-${dataName(key)}`, attrs[key] || '') })
  figure.innerHTML = (attrs.html || '') + REMOVE_EMBED_HTML
  if (attrs.tall === '1') figure.classList.add('is-tall')
  if (attrs.loading === '1') figure.classList.add('is-loading')
  return figure
}

export interface WriteBlockOptions {
  onRemoveEmbed: () => void
  onEditPoll: () => void
  onRemovePoll: () => void
}

/** 노드와, 그 바로 뒤의 빈 문단(정적 판에서 블록과 함께 넣은 <p><br></p>)까지의 범위 */
function rangeWithEmptyAfter(doc: PMNode, pos: number, node: PMNode) {
  const to = pos + node.nodeSize
  const after = doc.nodeAt(to)
  return { from: pos, to: after && after.type.name === 'paragraph' && !after.textContent.trim() ? to + after.nodeSize : to }
}

export const WriteEmbed = Node.create<WriteBlockOptions>({
  name: 'writeEmbed',
  group: 'block',
  atom: true,
  selectable: false,
  draggable: false,
  addOptions() { return { onRemoveEmbed: () => {}, onEditPoll: () => {}, onRemovePoll: () => {} } },
  addAttributes() {
    const keep = (def: string | null) => ({ default: def, rendered: false })
    return {
      uid: keep(''),
      loading: keep(''),
      html: {
        default: '',
        rendered: false,
        parseHTML: (el: HTMLElement) => {
          const copy = el.cloneNode(true) as HTMLElement
          copy.querySelectorAll('.write-embed-remove').forEach(node => node.remove())
          return copy.innerHTML
        },
      },
      ...Object.fromEntries(EMBED_FIELDS.map(key => [key, { default: '', rendered: false, parseHTML: (el: HTMLElement) => el.getAttribute(`data-embed-${key}`) || '' }])),
      ...Object.fromEntries(META_FIELDS.map(key => [key, { default: null, rendered: false, parseHTML: (el: HTMLElement) => el.getAttribute(`data-${dataName(key)}`) }])),
    }
  },
  parseHTML() { return [{ tag: 'figure.write-embed' }] },
  renderHTML({ node }) { return embedElement(node.attrs as EmbedAttrs) },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      let current = node
      const dom = embedElement(node.attrs as EmbedAttrs)
      dom.addEventListener('click', (event) => {
        if (!(event.target as HTMLElement).closest('[data-remove-embed]')) return
        event.preventDefault()
        const pos = typeof getPos === 'function' ? getPos() : undefined
        if (typeof pos !== 'number') return
        // 정적 판: button.closest('.write-embed').remove() — 그림만 지우고 뒤 빈 줄은 남긴다
        editor.view.dispatch(editor.state.tr.delete(pos, pos + current.nodeSize))
        this.options.onRemoveEmbed()
      })
      return {
        dom,
        ignoreMutation: () => true,
        stopEvent: event => Boolean((event.target as HTMLElement).closest?.('[data-remove-embed]')),
        update: (updated) => {
          if (updated.type !== current.type) return false
          const prev = current.attrs as EmbedAttrs
          current = updated
          const next = updated.attrs as EmbedAttrs
          const fresh = embedElement(next)
          dom.className = fresh.className
          ;[...dom.attributes].forEach((attr) => { if (attr.name.startsWith('data-') && !fresh.hasAttribute(attr.name)) dom.removeAttribute(attr.name) })
          ;[...fresh.attributes].forEach(attr => dom.setAttribute(attr.name, attr.value))
          // 안쪽(iframe)은 바뀔 때만 다시 그린다(같은 영상이 다시 불러와지지 않게)
          if (prev.html !== next.html) dom.innerHTML = fresh.innerHTML
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

export const EditorPoll = Node.create<WriteBlockOptions>({
  name: 'editorPoll',
  group: 'block',
  atom: true,
  selectable: false,
  draggable: false,
  addOptions() { return { onRemoveEmbed: () => {}, onEditPoll: () => {}, onRemovePoll: () => {} } },
  addAttributes() {
    return { data: { default: '', rendered: false, parseHTML: (el: HTMLElement) => el.getAttribute('data-poll') || '' } }
  },
  parseHTML() { return [{ tag: 'section.editor-poll[data-poll]' }] },
  renderHTML({ node }) { return pollElement(String(node.attrs.data || '')) },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      let current = node
      const dom = pollElement(String(node.attrs.data || ''))
      dom.addEventListener('click', (event) => {
        const target = event.target as HTMLElement
        if (target.closest('[data-edit-poll]')) { event.preventDefault(); this.options.onEditPoll(); return }
        if (target.closest('[data-remove-poll]')) {
          event.preventDefault()
          const pos = typeof getPos === 'function' ? getPos() : undefined
          if (typeof pos !== 'number') return
          // 정적 판: 바로 뒤 빈 <p> 를 함께 지운다
          const range = rangeWithEmptyAfter(editor.state.doc, pos, current)
          editor.view.dispatch(editor.state.tr.delete(range.from, range.to))
          this.options.onRemovePoll()
        }
      })
      return {
        dom,
        ignoreMutation: () => true,
        stopEvent: event => Boolean((event.target as HTMLElement).closest?.('[data-edit-poll],[data-remove-poll]')),
        update: (updated) => {
          if (updated.type !== current.type) return false
          current = updated
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
      fontFamily: { default: null, parseHTML: (el: HTMLElement) => el.style.fontFamily?.replace(/["']/g, '') || el.getAttribute('face') || null, renderHTML: () => ({}) },
      fontSize: { default: null, parseHTML: (el: HTMLElement) => el.style.fontSize || null, renderHTML: () => ({}) },
    }
  },
  parseHTML() {
    return [
      { tag: 'span', getAttrs: el => ((el as HTMLElement).style.fontFamily || (el as HTMLElement).style.fontSize) ? null : false },
      // 정적 판 임시저장(<font face size>)도 되살린다
      {
        tag: 'font',
        getAttrs: (el) => {
          const node = el as HTMLElement
          const size = Number(node.getAttribute('size') || 0)
          return { fontFamily: node.getAttribute('face') || null, fontSize: size ? `${[10, 13, 16, 18, 24, 32, 48][Math.max(1, Math.min(7, size)) - 1]}px` : null }
        },
      },
    ]
  },
  renderHTML({ mark }) {
    const style = [mark.attrs.fontFamily ? `font-family: ${mark.attrs.fontFamily}` : '', mark.attrs.fontSize ? `font-size: ${mark.attrs.fontSize}` : ''].filter(Boolean).join('; ')
    return ['span', mergeAttributes(style ? { style } : {}), 0]
  },
})
