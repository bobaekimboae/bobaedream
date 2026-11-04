// 치지직 앱식 글쓰기 편집기(Tiptap 3.27.3). 서식 줄 · 인용구 줄이 지금 커서 자리의 상태를 보여 줄 수 있게 state 를 계산한다.
// 임베드 · 투표 카드 블록은 기존 이식본(editorExtensions.ts)의 노드를 그대로 쓴다.
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import type { Node as PMNode } from '@tiptap/pm/model'
import { computed, ref, shallowRef, type Ref } from 'vue'
import { AppQuote, QuoteSource, QuoteText, TextAlign, TextColor, WriteMedia, type Align } from './appExtensions'
import { EditorPoll, LegacyTextStyle, WriteEmbed, embedItemFromAttrs, type EmbedAttrs } from './editorExtensions'
import type { EmbedItem, PollData } from './legacyLibs'
import { embedLib, fixLegacyPaths } from './legacyLibs'
import { safeDraftHtml } from './writeUtils'

export const FONT_FAMILIES = [
  { value: '', label: '기본서체' },
  { value: 'Nanum Gothic', label: '나눔고딕' },
  { value: 'Nanum Myeongjo', label: '나눔명조' },
  { value: 'Nanum Barun Gothic', label: '나눔바른고딕' },
  { value: 'NanumSquare', label: '나눔스퀘어' },
  { value: 'Maru Buri', label: '마루부리' },
] as const
/** 치지직 앱 글자 크기(본문 15, 인용구 19가 기본) */
export const FONT_SIZES = [11, 13, 15, 16, 19, 24, 28, 30, 34, 38] as const

export interface AppEditorOptions {
  placeholder: () => string
  onRemoveMedia: (id: string) => void
  onEditPoll: () => void
  onRemovePoll: () => void
}

let embedSeq = 0

export function useAppEditor(target: Ref<HTMLElement | null>, options: AppEditorOptions) {
  const editor = shallowRef<Editor | null>(null)
  const version = ref(0)
  const focused = ref(false)

  function create(initialHtml = '') {
    if (!target.value) return
    editor.value = new Editor({
      element: { mount: target.value },
      injectCSS: false,
      enableInputRules: false,
      enablePasteRules: false,
      content: initialHtml ? safeDraftHtml(initialHtml) : '',
      editorProps: { attributes: { class: 'app-editor-body', role: 'textbox', 'aria-multiline': 'true', 'aria-label': '본문' } },
      extensions: [
        StarterKit.configure({
          trailingNode: false,
          codeBlock: false,
          code: false,
          heading: { levels: [3] },
          link: { openOnClick: false, autolink: false, linkOnPaste: false, HTMLAttributes: { target: '_blank', rel: 'noopener', class: null } },
        }),
        Placeholder.configure({
          includeChildren: true,
          showOnlyCurrent: false,
          placeholder: ({ node, editor: ed }) => {
            if (node.type.name === 'quoteText') return '내용을 입력해 주세요'
            if (node.type.name === 'quoteSource') return '출처 입력'
            return ed.isEmpty ? options.placeholder() : ''
          },
        }),
        TextAlign,
        TextColor,
        LegacyTextStyle,
        QuoteText,
        QuoteSource,
        AppQuote,
        WriteMedia.configure({ onRemove: options.onRemoveMedia }),
        WriteEmbed.configure({ onRemoveEmbed: () => {}, onEditPoll: options.onEditPoll, onRemovePoll: options.onRemovePoll }),
        EditorPoll.configure({ onRemoveEmbed: () => {}, onEditPoll: options.onEditPoll, onRemovePoll: options.onRemovePoll }),
      ],
      onUpdate: () => { version.value += 1 },
      onSelectionUpdate: () => { version.value += 1 },
      onCreate: () => { version.value += 1 },
      onFocus: () => { focused.value = true; version.value += 1 },
      onBlur: () => { focused.value = false },
    })
  }
  function destroy() { editor.value?.destroy(); editor.value = null }

  const chain = () => editor.value?.chain().focus()

  /* ---------- 지금 커서 자리 상태 ---------- */
  const state = computed(() => {
    void version.value
    const ed = editor.value
    const empty = { bold: false, italic: false, underline: false, strike: false, bullet: false, link: false, block: 'p', fontFamily: '', fontSize: 15, align: 'left' as Align, color: '', quote: 0 }
    if (!ed) return empty
    const quote = ed.isActive('appQuote') ? Number(ed.getAttributes('appQuote').quoteStyle || 1) : 0
    const textStyle = ed.getAttributes('legacyTextStyle')
    const sizePx = Number(String(textStyle.fontSize || '').replace('px', '')) || (quote ? 19 : 15)
    const align = (ed.getAttributes('paragraph').textAlign || ed.getAttributes('heading').textAlign || 'left') as Align
    return {
      bold: ed.isActive('bold'),
      italic: ed.isActive('italic'),
      underline: ed.isActive('underline'),
      strike: ed.isActive('strike'),
      bullet: ed.isActive('bulletList'),
      link: ed.isActive('link'),
      block: quote ? 'quote' : ed.isActive('heading') ? 'h3' : 'p',
      fontFamily: String(textStyle.fontFamily || ''),
      fontSize: sizePx,
      align,
      color: String(ed.getAttributes('appTextColor').color || ''),
      quote,
    }
  })

  const text = () => editor.value?.getText().trim() || ''
  const html = () => editor.value?.getHTML() || ''
  function setHtml(value: string) { editor.value?.commands.setContent(safeDraftHtml(value), { emitUpdate: true }) }
  function countNodes(name: string): number {
    let count = 0
    editor.value?.state.doc.descendants((node) => { if (node.type.name === name) count += 1 })
    return count
  }
  function findNode(match: (node: PMNode) => boolean): { node: PMNode, pos: number } | null {
    let found: { node: PMNode, pos: number } | null = null
    editor.value?.state.doc.descendants((node, pos) => {
      if (found) return false
      if (match(node)) { found = { node, pos }; return false }
      return true
    })
    return found
  }

  /* ---------- 서식 ---------- */
  function toggle(name: 'bold' | 'italic' | 'underline' | 'strike' | 'bullet') {
    const c = chain()
    if (!c) return
    if (name === 'bold') c.toggleBold().run()
    else if (name === 'italic') c.toggleItalic().run()
    else if (name === 'underline') c.toggleUnderline().run()
    else if (name === 'strike') c.toggleStrike().run()
    else c.toggleBulletList().run()
  }
  /** 본문 · 소제목 · 인용구 */
  function setBlock(kind: 'p' | 'h3' | 'quote') {
    const ed = editor.value
    if (!ed) return
    if (kind === 'quote') { if (!ed.isActive('appQuote')) insertQuote(1); return }
    if (ed.isActive('appQuote')) unwrapQuote()
    if (kind === 'h3') chain()?.setHeading({ level: 3 }).run()
    else chain()?.setParagraph().run()
  }
  function setFontFamily(value: string) { chain()?.setMark('legacyTextStyle', { fontFamily: value || null }).run() }
  function setFontSize(px: number) { chain()?.setMark('legacyTextStyle', { fontSize: `${px}px` }).run() }
  function setColor(color: string) {
    const c = chain()
    if (!c) return
    if (color) c.setMark('appTextColor', { color }).run()
    else c.unsetMark('appTextColor').run()
  }
  /** 치지직: 정렬 버튼을 누를 때마다 왼쪽 → 가운데 → 오른쪽 */
  function cycleAlign(): Align {
    const order: Align[] = ['left', 'center', 'right']
    const next = order[(order.indexOf(state.value.align) + 1) % order.length]!
    chain()?.updateAttributes('paragraph', { textAlign: next }).updateAttributes('heading', { textAlign: next }).run()
    return next
  }
  function setLink(href: string) {
    const ed = editor.value
    if (!ed) return
    if (ed.state.selection.empty) chain()?.insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run()
    else chain()?.setLink({ href }).run()
  }
  function unsetLink() { chain()?.unsetLink().run() }

  /* ---------- 인용구 ---------- */
  function insertQuote(style: number) {
    const ed = editor.value
    if (!ed) return
    const start = ed.state.selection.from
    chain()?.insertContent([{ type: 'appQuote', attrs: { quoteStyle: style }, content: [{ type: 'quoteText' }, { type: 'quoteSource' }] }, { type: 'paragraph' }]).run()
    // 커서를 방금 넣은 인용구의 본문 칸에 둔다
    let target = -1
    ed.state.doc.descendants((node, pos) => {
      if (target < 0 && node.type.name === 'appQuote' && pos + node.nodeSize >= start) target = pos
      return target < 0
    })
    if (target >= 0) ed.chain().focus().setTextSelection(target + 2).run()
  }
  function quotePos(): number | null {
    const ed = editor.value
    if (!ed) return null
    const { $from } = ed.state.selection
    for (let depth = $from.depth; depth > 0; depth -= 1) {
      if ($from.node(depth).type.name === 'appQuote') return $from.before(depth)
    }
    return null
  }
  function setQuoteStyle(style: number) {
    const ed = editor.value
    const pos = quotePos()
    if (!ed || pos === null) return
    const node = ed.state.doc.nodeAt(pos)
    if (!node) return
    ed.view.dispatch(ed.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, quoteStyle: style }))
    ed.view.focus()
  }
  function removeQuote() {
    const ed = editor.value
    const pos = quotePos()
    if (!ed || pos === null) return
    const node = ed.state.doc.nodeAt(pos)
    if (!node) return
    ed.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run()
  }
  /** 「본문」으로 바꾸면 인용구 글자만 문단으로 남긴다 */
  function unwrapQuote() {
    const ed = editor.value
    const pos = quotePos()
    if (!ed || pos === null) return
    const node = ed.state.doc.nodeAt(pos)
    if (!node) return
    const textNode = node.firstChild
    const paragraph = ed.schema.nodes.paragraph!.create(null, textNode ? textNode.content : undefined)
    ed.view.dispatch(ed.state.tr.replaceWith(pos, pos + node.nodeSize, paragraph))
  }

  /* ---------- 블록 넣기 ---------- */
  function insertDivider() { chain()?.setHorizontalRule().run() }
  function insertText(value: string) { chain()?.insertContent({ type: 'text', text: value }).run() }
  function insertMedia(item: { id: string, kind: 'photo' | 'video', url: string, name: string }) {
    chain()?.insertContent([{ type: 'writeMedia', attrs: { mediaId: item.id, kind: item.kind, src: item.url, name: item.name } }, { type: 'paragraph' }]).run()
  }
  function insertEmbed(item: EmbedItem) {
    const lib = embedLib()
    if (!lib) return
    const uid = `embed-${Date.now()}-${(embedSeq += 1)}`
    const attrs: Partial<EmbedAttrs> = {
      uid,
      loading: item.render === 'preview' ? '1' : '',
      html: fixLegacyPaths(item.render === 'iframe' ? lib.frameHtml(item) : lib.cardHtml(item)),
      url: item.url, render: item.render, src: item.src || '', provider: item.provider || '', title: item.title || '', tall: item.tall ? '1' : '',
    }
    chain()?.insertContent([{ type: 'writeEmbed', attrs }, { type: 'paragraph' }]).run()
    if (item.render !== 'preview') return
    lib.fetchMeta(item.url).then((meta) => {
      const ed = editor.value
      const hit = findNode(node => node.type.name === 'writeEmbed' && node.attrs.uid === uid)
      if (!ed || !hit) return
      const full: EmbedItem = { ...item, ...meta, title: meta.title || '' }
      const box = document.createElement('div')
      box.innerHTML = String(hit.node.attrs.html || '')
      const card = box.querySelector('.news-card')
      if (card) card.replaceWith(document.createRange().createContextualFragment(fixLegacyPaths(lib.cardHtml(full))))
      ed.view.dispatch(ed.state.tr.setNodeMarkup(hit.pos, undefined, {
        ...hit.node.attrs, loading: '', html: box.innerHTML,
        metaTitle: full.title || '', metaDescription: full.description || '', metaImage: full.image || '',
        metaSite: full.site || '', metaLogo: full.logo || '', metaLang: full.lang || '',
      }))
    }).catch(() => {})
  }
  function collectEmbeds(): EmbedItem[] {
    const list: EmbedItem[] = []
    editor.value?.state.doc.descendants((node) => { if (node.type.name === 'writeEmbed') list.push(embedItemFromAttrs(node.attrs as EmbedAttrs)) })
    return list.filter(item => item.url)
  }
  function currentPoll(): PollData | null {
    const hit = findNode(node => node.type.name === 'editorPoll')
    if (!hit) return null
    try { return JSON.parse(String(hit.node.attrs.data || 'null')) as PollData } catch { return null }
  }
  function applyPoll(pollData: PollData) {
    const ed = editor.value
    if (!ed) return
    const data = JSON.stringify(pollData)
    const hit = findNode(node => node.type.name === 'editorPoll')
    if (hit) ed.view.dispatch(ed.state.tr.setNodeMarkup(hit.pos, undefined, { data }))
    else ed.chain().focus('end').insertContent([{ type: 'editorPoll', attrs: { data } }, { type: 'paragraph' }]).run()
  }

  return {
    editor, version, focused, state, create, destroy, text, html, setHtml, countNodes,
    toggle, setBlock, setFontFamily, setFontSize, setColor, cycleAlign, setLink, unsetLink,
    insertQuote, setQuoteStyle, removeQuote, insertDivider, insertText, insertMedia, insertEmbed, collectEmbeds, currentPoll, applyPoll,
  }
}

export type AppEditor = ReturnType<typeof useAppEditor>
