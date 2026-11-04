// 치지직 앱 글쓰기(2026-11-05 폰 직접 확인)를 따라 만든 편집기 확장(Tiptap 3.27.3, 새 패키지 없음)
//  - TextAlign   : 문단 · 소제목 정렬(왼쪽 → 가운데 → 오른쪽 → 왼쪽, 서식 줄 정렬 버튼을 누를 때마다 바뀜)
//  - TextColor   : 글자색(서식 줄 T■ → 색 14가지)
//  - AppQuote    : 인용구 블록. 6가지 모양(따옴표 · 세로줄 · 말풍선 · 밑줄 따옴표 · 메모지 · 꺾쇠) + 출처 줄
//  - WriteImage  : 본문 안 사진 · 동영상(치지직처럼 커서 자리에 들어감, 오른쪽 위 × 로 빼기)
import { Extension, Mark, Node, mergeAttributes } from '@tiptap/core'

export const ALIGNS = ['left', 'center', 'right'] as const
export type Align = typeof ALIGNS[number]

export const TextAlign = Extension.create({
  name: 'appTextAlign',
  addGlobalAttributes() {
    return [{
      types: ['paragraph', 'heading'],
      attributes: {
        textAlign: {
          default: null,
          parseHTML: (el: HTMLElement) => el.style.textAlign || null,
          renderHTML: (attrs: Record<string, unknown>) => (attrs.textAlign && attrs.textAlign !== 'left' ? { style: `text-align: ${String(attrs.textAlign)}` } : {}),
        },
      },
    }]
  },
})

/** 치지직 앱 글자색 14가지(왼쪽부터, 첫 칸은 「색 없음」) — 화면 픽셀에서 읽은 값 */
export const TEXT_COLORS = ['', '#000000', '#b7b7b7', '#ffffff', '#f12f22', '#ff9c23', '#f4d400', '#7bb423', '#00a350', '#009991', '#00afef', '#0076c8', '#93338f', '#f02c8c'] as const

export const TextColor = Mark.create({
  name: 'appTextColor',
  addAttributes() {
    return { color: { default: null, parseHTML: (el: HTMLElement) => el.style.color || null, renderHTML: () => ({}) } }
  },
  parseHTML() { return [{ tag: 'span[data-text-color]' }] },
  renderHTML({ mark }) {
    return ['span', mergeAttributes({ 'data-text-color': '', style: mark.attrs.color ? `color: ${String(mark.attrs.color)}` : '' }), 0]
  },
})

/* ---------- 인용구 ---------- */
export const QUOTE_STYLES = [
  { id: 1, label: '따옴표' },
  { id: 2, label: '세로줄' },
  { id: 3, label: '말풍선' },
  { id: 4, label: '밑줄 따옴표' },
  { id: 5, label: '메모지' },
  { id: 6, label: '꺾쇠' },
] as const

export const QuoteText = Node.create({
  name: 'quoteText',
  content: 'inline*',
  defining: true,
  parseHTML() { return [{ tag: 'p.app-quote-text' }] },
  renderHTML({ HTMLAttributes }) { return ['p', mergeAttributes(HTMLAttributes, { class: 'app-quote-text' }), 0] },
})

export const QuoteSource = Node.create({
  name: 'quoteSource',
  content: 'text*',
  marks: '',
  defining: true,
  parseHTML() { return [{ tag: 'p.app-quote-source' }] },
  renderHTML({ HTMLAttributes }) { return ['p', mergeAttributes(HTMLAttributes, { class: 'app-quote-source' }), 0] },
})

export const AppQuote = Node.create({
  name: 'appQuote',
  group: 'block',
  content: 'quoteText quoteSource',
  defining: true,
  isolating: true,
  addAttributes() {
    return { quoteStyle: { default: 1, parseHTML: (el: HTMLElement) => Number(el.getAttribute('data-quote-style') || 1), renderHTML: (attrs: Record<string, unknown>) => ({ 'data-quote-style': String(attrs.quoteStyle || 1) }) } }
  },
  parseHTML() { return [{ tag: 'blockquote.app-quote' }] },
  renderHTML({ HTMLAttributes }) { return ['blockquote', mergeAttributes(HTMLAttributes, { class: 'app-quote' }), 0] },
  addKeyboardShortcuts() {
    /** 인용구 본문에서 Enter → 출처 칸, 출처에서 Enter → 인용구 아래 문단(없으면 만든다) */
    const enter = () => {
      const { state } = this.editor
      const { $from } = state.selection
      const name = $from.parent.type.name
      if (name !== 'quoteText' && name !== 'quoteSource') return false
      const quoteDepth = $from.depth - 1
      if (name === 'quoteText') return this.editor.commands.setTextSelection($from.after() + 1)
      const after = $from.after(quoteDepth)
      const next = state.doc.nodeAt(after)
      if (next && next.type.name === 'paragraph') return this.editor.commands.setTextSelection(after + 1)
      return this.editor.chain().insertContentAt(after, { type: 'paragraph' }).setTextSelection(after + 1).run()
    }
    /** 빈 인용구 맨 앞에서 지우기 → 인용구를 없앤다 */
    const backspace = () => {
      const { state } = this.editor
      const { $from, empty } = state.selection
      if (!empty || $from.parentOffset !== 0) return false
      const name = $from.parent.type.name
      if (name === 'quoteSource') return this.editor.commands.setTextSelection($from.before() - 1)
      if (name !== 'quoteText') return false
      const quote = $from.node($from.depth - 1)
      if (quote.textContent) return true
      const start = $from.before($from.depth - 1)
      return this.editor.chain().deleteRange({ from: start, to: start + quote.nodeSize }).insertContentAt(start, { type: 'paragraph' }).setTextSelection(start + 1).run()
    }
    return { 'Enter': enter, 'Backspace': backspace, 'Shift-Enter': () => this.editor.commands.setHardBreak() }
  },
})

/* ---------- 본문 안 사진 · 동영상 ---------- */
export const WriteMedia = Node.create<{ onRemove: (id: string) => void }>({
  name: 'writeMedia',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,
  addOptions() { return { onRemove: () => {} } },
  addAttributes() {
    return {
      mediaId: { default: '', parseHTML: (el: HTMLElement) => el.getAttribute('data-media-id') || '', renderHTML: (a: Record<string, unknown>) => ({ 'data-media-id': String(a.mediaId || '') }) },
      kind: { default: 'photo', parseHTML: (el: HTMLElement) => el.getAttribute('data-kind') || 'photo', renderHTML: (a: Record<string, unknown>) => ({ 'data-kind': String(a.kind || 'photo') }) },
      src: { default: '', rendered: false, parseHTML: (el: HTMLElement) => el.querySelector('img,video')?.getAttribute('src') || '' },
      name: { default: '', rendered: false, parseHTML: (el: HTMLElement) => el.querySelector('img')?.getAttribute('alt') || '' },
    }
  },
  parseHTML() { return [{ tag: 'figure.write-media' }] },
  renderHTML({ node, HTMLAttributes }) {
    const media = node.attrs.kind === 'video'
      ? ['video', { src: node.attrs.src, controls: 'true', playsinline: 'true' }]
      : ['img', { src: node.attrs.src, alt: node.attrs.name }]
    return ['figure', mergeAttributes(HTMLAttributes, { class: 'write-media' }), media]
  },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('figure')
      dom.className = 'write-media'
      dom.contentEditable = 'false'
      dom.setAttribute('data-media-id', String(node.attrs.mediaId))
      dom.setAttribute('data-kind', String(node.attrs.kind))
      const el = document.createElement(node.attrs.kind === 'video' ? 'video' : 'img') as HTMLImageElement | HTMLVideoElement
      el.src = String(node.attrs.src)
      if (el instanceof HTMLVideoElement) { el.controls = true; el.playsInline = true }
      else el.alt = String(node.attrs.name || '')
      const remove = document.createElement('button')
      remove.type = 'button'
      remove.className = 'write-media-remove'
      remove.setAttribute('aria-label', node.attrs.kind === 'video' ? '동영상 빼기' : '사진 빼기')
      remove.addEventListener('click', (event) => {
        event.preventDefault()
        const pos = typeof getPos === 'function' ? getPos() : undefined
        if (typeof pos !== 'number') return
        editor.view.dispatch(editor.state.tr.delete(pos, pos + node.nodeSize))
        this.options.onRemove(String(node.attrs.mediaId))
      })
      dom.append(el, remove)
      return { dom, ignoreMutation: () => true, stopEvent: event => (event.target as HTMLElement).closest('.write-media-remove') !== null }
    }
  },
})
