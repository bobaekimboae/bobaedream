// 치지직 앱 글쓰기(2026-11-05 폰 직접 확인)를 따라 만든 편집기 확장(Tiptap 3.27.3, 새 패키지 없음)
//  - TextAlign   : 문단 · 소제목 정렬(왼쪽 → 가운데 → 오른쪽 → 왼쪽, 서식 줄 정렬 버튼을 누를 때마다 바뀜)
//  - TextColor   : 글자색(서식 줄 T■ → 색 14가지)
//  - AppQuote    : 인용구 블록. 6가지 모양(따옴표 · 세로줄 · 말풍선 · 밑줄 따옴표 · 메모지 · 꺾쇠) + 출처 줄
//  - WriteImage  : 본문 안 사진 · 동영상(치지직처럼 커서 자리에 들어감, 오른쪽 위 × 로 빼기)
import { Extension, Mark, Node, mergeAttributes } from '@tiptap/core'
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state'
import type { Node as PMNode } from '@tiptap/pm/model'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

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

/** 글자 배경색(네이버 카페 앱 서식 줄 「글자 배경색」). 글자색과 같은 14가지 */
export const TextBg = Mark.create({
  name: 'appTextBg',
  addAttributes() {
    return { color: { default: null, parseHTML: (el: HTMLElement) => el.style.backgroundColor || null, renderHTML: () => ({}) } }
  },
  parseHTML() { return [{ tag: 'span[data-text-bg]' }] },
  renderHTML({ mark }) {
    return ['span', mergeAttributes({ 'data-text-bg': '', style: mark.attrs.color ? `background-color: ${String(mark.attrs.color)}` : '' }), 0]
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

/* ---------- 본문 안 사진 · 동영상 ----------
   치지직형(chzzk: true, 2026-11-05 폰 3차 확인):
   - 첫 사진 · 동영상에 보라 「대표」, 다른 것은 고르면 반투명 「대표」 단추가 나와 누르면 대표가 바뀐다
   - 아래에 「사진 설명을 입력하세요.」 · 「동영상 설명을 입력하세요.」 칸(고르거나 설명이 있을 때만 보임)
   - 동영상은 편집기 안에서 재생하지 않고 대표 이미지 + 가운데 ▶ + 길이만 보여 준다 */
export interface WriteMediaOptions {
  onRemove: (id: string) => void
  chzzk: boolean
  onCaptionFocus: (pos: number | null) => void
}
const mediaAttr = (name: string, def: unknown) => ({
  default: def,
  parseHTML: (el: HTMLElement) => {
    const raw = el.getAttribute(`data-${name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}`)
    if (raw === null) return def
    return typeof def === 'boolean' ? raw === '1' : raw
  },
  renderHTML: (a: Record<string, unknown>) => {
    const v = a[name]
    if (v === def || v === '' || v === null || v === undefined) return {}
    return { [`data-${name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}`]: typeof v === 'boolean' ? (v ? '1' : '0') : String(v) }
  },
})
export function formatDuration(sec: number) {
  const s = Math.max(0, Math.round(sec || 0))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
export const WriteMedia = Node.create<WriteMediaOptions>({
  name: 'writeMedia',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,
  addOptions() { return { onRemove: () => {}, chzzk: false, onCaptionFocus: () => {} } },
  addAttributes() {
    return {
      mediaId: { default: '', parseHTML: (el: HTMLElement) => el.getAttribute('data-media-id') || '', renderHTML: (a: Record<string, unknown>) => ({ 'data-media-id': String(a.mediaId || '') }) },
      kind: { default: 'photo', parseHTML: (el: HTMLElement) => el.getAttribute('data-kind') || 'photo', renderHTML: (a: Record<string, unknown>) => ({ 'data-kind': String(a.kind || 'photo') }) },
      src: { default: '', rendered: false, parseHTML: (el: HTMLElement) => el.querySelector('img,video')?.getAttribute('src') || '' },
      name: { default: '', rendered: false, parseHTML: (el: HTMLElement) => el.querySelector('img')?.getAttribute('alt') || '' },
      caption: mediaAttr('caption', ''),
      captionAlign: mediaAttr('captionAlign', 'center'),
      captionBold: mediaAttr('captionBold', false),
      captionHref: mediaAttr('captionHref', ''),
      href: mediaAttr('href', ''),
      rep: mediaAttr('rep', false),
      poster: mediaAttr('poster', ''),
      duration: mediaAttr('duration', ''),
      title: mediaAttr('title', ''),
      info: mediaAttr('info', ''),
      tags: mediaAttr('tags', ''),
    }
  },
  parseHTML() { return [{ tag: 'figure.write-media' }] },
  renderHTML({ node, HTMLAttributes }) {
    const a = node.attrs
    const media = a.kind === 'video'
      ? ['video', { src: a.src, controls: 'true', playsinline: 'true', ...(a.poster ? { poster: a.poster } : {}) }]
      : ['img', { src: a.src, alt: a.name }]
    const body = a.href && a.kind !== 'video' ? ['a', { href: a.href, rel: 'noopener', target: '_blank' }, media] : media
    const parts: unknown[] = ['figure', mergeAttributes(HTMLAttributes, { class: 'write-media' }), body]
    if (a.caption) parts.push(['figcaption', { style: `text-align:${a.captionAlign}${a.captionBold ? ';font-weight:700' : ''}` }, a.captionHref ? ['a', { href: a.captionHref }, a.caption] : a.caption])
    return parts as never
  },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      let current = node
      const dom = document.createElement('figure')
      dom.className = 'write-media'
      dom.contentEditable = 'false'
      dom.setAttribute('data-media-id', String(node.attrs.mediaId))
      dom.setAttribute('data-kind', String(node.attrs.kind))
      const frame = document.createElement('div')
      frame.className = 'write-media-frame'
      const isVideo = node.attrs.kind === 'video'
      const chzzk = this.options.chzzk
      let el: HTMLImageElement | HTMLVideoElement
      if (isVideo && !chzzk) {
        el = document.createElement('video'); el.controls = true; el.playsInline = true
      } else if (isVideo) {
        el = document.createElement('img') // 대표 이미지(포스터)
      } else {
        el = document.createElement('img'); el.alt = String(node.attrs.name || '')
      }
      frame.append(el)
      const pos = () => (typeof getPos === 'function' ? getPos() : undefined)
      const setAttrs = (attrs: Record<string, unknown>, keepSelect = true) => {
        const at = pos()
        if (typeof at !== 'number') return
        const tr = editor.state.tr.setNodeMarkup(at, undefined, { ...current.attrs, ...attrs })
        if (keepSelect) tr.setSelection(NodeSelection.create(tr.doc, at))
        editor.view.dispatch(tr)
      }
      let play: HTMLElement | null = null
      let rep: HTMLButtonElement | null = null
      let cap: HTMLInputElement | null = null
      if (chzzk) {
        if (isVideo) {
          play = document.createElement('span')
          play.className = 'write-media-play'
          play.innerHTML = '<i aria-hidden="true"></i><b></b>'
          frame.append(play)
        }
        rep = document.createElement('button')
        rep.type = 'button'
        rep.className = 'write-media-rep'
        rep.textContent = '대표'
        rep.addEventListener('mousedown', event => event.preventDefault())
        rep.addEventListener('click', (event) => {
          event.preventDefault()
          const at = pos()
          if (typeof at !== 'number') return
          // 문서 안 모든 사진 · 동영상의 rep 를 끄고 이것만 켠다
          const tr = editor.state.tr
          editor.state.doc.descendants((n, p) => {
            if (n.type.name === 'writeMedia') tr.setNodeMarkup(p, undefined, { ...n.attrs, rep: p === at })
            return false
          })
          tr.setSelection(NodeSelection.create(tr.doc, at))
          editor.view.dispatch(tr)
        })
        frame.append(rep)
        cap = document.createElement('input')
        cap.className = 'write-media-cap'
        cap.type = 'text'
        cap.maxLength = 100
        cap.placeholder = isVideo ? '동영상 설명을 입력하세요.' : '사진 설명을 입력하세요.'
        cap.setAttribute('aria-label', isVideo ? '동영상 설명' : '사진 설명')
        cap.addEventListener('input', () => setAttrs({ caption: cap!.value }, false))
        cap.addEventListener('focus', () => { const at = pos(); this.options.onCaptionFocus(typeof at === 'number' ? at : null); dom.classList.add('is-cap-focus') })
        cap.addEventListener('blur', () => { this.options.onCaptionFocus(null); dom.classList.remove('is-cap-focus') })
        cap.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter') return
          event.preventDefault()
          // Enter: 설명을 닫고 아래 문단으로
          const at = pos()
          if (typeof at !== 'number') return
          const after = at + current.nodeSize
          const next = editor.state.doc.nodeAt(after)
          if (next && next.type.name === 'paragraph') editor.chain().setTextSelection(after + 1).focus().run()
          else editor.chain().insertContentAt(after, { type: 'paragraph' }).setTextSelection(after + 1).focus().run()
        })
      }
      const remove = document.createElement('button')
      remove.type = 'button'
      remove.className = 'write-media-remove'
      remove.setAttribute('aria-label', isVideo ? '동영상 빼기' : '사진 빼기')
      remove.addEventListener('click', (event) => {
        event.preventDefault()
        const at = pos()
        if (typeof at !== 'number') return
        editor.view.dispatch(editor.state.tr.delete(at, at + current.nodeSize))
        this.options.onRemove(String(current.attrs.mediaId))
      })
      dom.append(frame)
      if (cap) dom.append(cap)
      dom.append(remove)
      const paint = (n: PMNode) => {
        const a = n.attrs
        if (el instanceof HTMLVideoElement) { if (el.getAttribute('src') !== a.src) el.src = String(a.src) }
        else {
          const want = isVideo && chzzk ? String(a.poster || '') : String(a.src)
          if (el.getAttribute('src') !== want) { if (want) el.src = want; else el.removeAttribute('src') }
        }
        if (play) play.querySelector('b')!.textContent = String(a.duration || '')
        if (cap) {
          if (cap.value !== a.caption && document.activeElement !== cap) cap.value = String(a.caption || '')
          cap.style.textAlign = String(a.captionAlign || 'center')
          cap.style.fontWeight = a.captionBold ? '700' : ''
          cap.classList.toggle('is-link', Boolean(a.captionHref))
        }
        dom.classList.toggle('has-cap', Boolean(a.caption))
        dom.classList.toggle('has-link', Boolean(a.href))
      }
      paint(node)
      return {
        dom,
        ignoreMutation: () => true,
        stopEvent: (event) => {
          const t = event.target as HTMLElement
          return Boolean(t.closest?.('.write-media-remove,.write-media-rep,.write-media-cap'))
        },
        update: (updated) => {
          if (updated.type !== current.type || updated.attrs.kind !== current.attrs.kind) return false
          current = updated
          paint(updated)
          return true
        },
      }
    }
  },
})

/** 대표 사진 · 동영상: rep 가 켜진 것, 없으면 첫 번째 */
export const MediaRep = Extension.create({
  name: 'mediaRep',
  addProseMirrorPlugins() {
    return [new Plugin({
      key: new PluginKey('mediaRep'),
      props: {
        decorations(state) {
          let first = -1
          let flagged = -1
          state.doc.descendants((n, p) => {
            if (n.type.name !== 'writeMedia') return false
            if (first < 0) first = p
            if (flagged < 0 && n.attrs.rep) flagged = p
            return false
          })
          const at = flagged >= 0 ? flagged : first
          if (at < 0) return DecorationSet.empty
          const node = state.doc.nodeAt(at)!
          return DecorationSet.create(state.doc, [Decoration.node(at, at + node.nodeSize, { class: 'is-rep' })])
        },
      },
    })]
  },
})

/* ---------- 본문 블록(구성 요소) — 치지직 앱(2026-11-05 2차 폰 확인) ----------
   구분선 · 사진 · 동영상 · 링크 · 투표 · 스티커는 누르면 「선택됨」(보라 2px 상자 + 오른쪽 아래 위로 · 아래로)이 되고
   도구 줄이 그 블록 전용 줄로 바뀐다. 정렬(blockAlign)과 구분선 모양(dividerStyle 1~8)은 블록 속성으로 둔다. */
export const BLOCK_NODES = ['horizontalRule', 'writeMedia', 'writeEmbed', 'editorPoll', 'writeSticker', 'writeCard'] as const
export const DIVIDER_STYLES = [1, 2, 3, 4, 5, 6, 7, 8] as const

export const BlockAttrs = Extension.create({
  name: 'appBlockAttrs',
  addGlobalAttributes() {
    return [
      {
        types: [...BLOCK_NODES],
        attributes: {
          blockAlign: {
            default: 'left',
            parseHTML: (el: HTMLElement) => el.getAttribute('data-align') || 'left',
            renderHTML: (attrs: Record<string, unknown>) => (attrs.blockAlign && attrs.blockAlign !== 'left' ? { 'data-align': String(attrs.blockAlign) } : {}),
          },
        },
      },
      {
        types: ['horizontalRule'],
        attributes: {
          dividerStyle: {
            default: 1,
            parseHTML: (el: HTMLElement) => Number(el.getAttribute('data-divider') || 1),
            renderHTML: (attrs: Record<string, unknown>) => ({ 'data-divider': String(attrs.dividerStyle || 1) }),
          },
        },
      },
    ]
  },
  addProseMirrorPlugins() {
    // 직접 그리는 블록(사진 · 링크 · 투표 · 스티커)에도 정렬 · 모양이 보이게 장식(class)을 붙인다
    return [new Plugin({
      key: new PluginKey('appBlockDeco'),
      props: {
        decorations(state) {
          const list: Decoration[] = []
          state.doc.forEach((node, pos) => {
            if (!(BLOCK_NODES as readonly string[]).includes(node.type.name)) return
            const cls = [`blk-align-${String(node.attrs.blockAlign || 'left')}`]
            if (node.type.name === 'horizontalRule') cls.push(`div-style-${String(node.attrs.dividerStyle || 1)}`)
            list.push(Decoration.node(pos, pos + node.nodeSize, { class: cls.join(' ') }))
          })
          return DecorationSet.create(state.doc, list)
        },
      },
    })]
  },
})

/** 스티커 — 치지직은 본문 안 그림 블록(140×121, 왼쪽). 우리는 공용 이모지를 큰 그림처럼 넣는다 */
export const WriteSticker = Node.create({
  name: 'writeSticker',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return { emoji: { default: '', parseHTML: (el: HTMLElement) => el.getAttribute('data-emoji') || el.textContent || '', renderHTML: (a: Record<string, unknown>) => ({ 'data-emoji': String(a.emoji || '') }) } }
  },
  parseHTML() { return [{ tag: 'figure.write-sticker' }] },
  renderHTML({ node, HTMLAttributes }) {
    return ['figure', mergeAttributes(HTMLAttributes, { class: 'write-sticker', contenteditable: 'false' }), ['span', { class: 'write-sticker-art', 'aria-label': '스티커' }, String(node.attrs.emoji || '')]]
  },
})

/** 치지직 앱 본문 안 투표 블록: 회색 카드(왼쪽 어두운 동그라미 아이콘 · 「투표」 · 제목). 고치기 · 지우기는 블록 도구 줄에서 */
export function compactPollElement(data: string, iconUrl: string): HTMLElement {
  const section = document.createElement('section')
  section.className = 'editor-poll is-compact'
  section.contentEditable = 'false'
  section.setAttribute('data-poll', data)
  let title = ''
  try { title = String((JSON.parse(data) as { title?: string }).title || '') } catch { title = '' }
  const mark = document.createElement('span')
  mark.className = 'editor-poll-mark'
  mark.style.setProperty('--icon', `url("${iconUrl}")`)
  const label = document.createElement('span')
  label.className = 'editor-poll-text'
  const kind = document.createElement('b')
  kind.textContent = '투표'
  const name = document.createElement('span')
  name.textContent = title
  label.append(kind, name)
  section.append(mark, label)
  return section
}

/** 본문 안 첨부 카드(네이버 카페 앱: 일정 · 장소 · 파일 · 글감). 글자만 있는 카드라 서버 본문(HTML)에도 그대로 남는다.
 *  kind: schedule | place | file | material,  title · sub · meta 는 화면에 보일 글자,  link 는 누르면 열 주소(있을 때만) */
export interface CardAttrs { kind: string, title: string, sub: string, meta: string, link: string, image: string }
export const WriteCard = Node.create({
  name: 'writeCard',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    const keep = (name: string) => ({ default: '', parseHTML: (el: HTMLElement) => el.getAttribute(`data-${name}`) || '', renderHTML: (a: Record<string, unknown>) => ({ [`data-${name}`]: String(a[name] || '') }) })
    return { kind: keep('kind'), title: keep('title'), sub: keep('sub'), meta: keep('meta'), link: keep('link'), image: keep('image') }
  },
  parseHTML() { return [{ tag: 'figure.write-card' }] },
  renderHTML({ node, HTMLAttributes }) {
    const a = node.attrs as CardAttrs
    const text: unknown[] = ['div', { class: 'write-card-text' }, ['strong', {}, a.title || ''], ...(a.sub ? [['span', {}, a.sub]] : []), ...(a.meta ? [['small', {}, a.meta]] : [])]
    const art: unknown[] = a.image ? ['img', { class: 'write-card-image', src: a.image, alt: '' }] : ['span', { class: 'write-card-icon', 'aria-hidden': 'true' }]
    const inner: unknown[] = a.link ? ['a', { href: a.link, target: '_blank', rel: 'noopener', class: 'write-card-link' }, art, text] : ['div', { class: 'write-card-link' }, art, text]
    return ['figure', mergeAttributes(HTMLAttributes, { class: `write-card is-${a.kind || 'file'}`, contenteditable: 'false' }), inner] as never
  },
})
