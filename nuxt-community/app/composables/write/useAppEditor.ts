// 치지직 앱식 글쓰기 편집기(Tiptap 3.27.3). 서식 줄 · 인용구 줄이 지금 커서 자리의 상태를 보여 줄 수 있게 state 를 계산한다.
// 임베드 · 투표 카드 블록은 기존 이식본(editorExtensions.ts)의 노드를 그대로 쓴다.
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import type { Node as PMNode } from '@tiptap/pm/model'
import { computed, ref, shallowRef, type Ref } from 'vue'
import { NodeSelection } from '@tiptap/pm/state'
import { AppQuote, BLOCK_NODES, BlockAttrs, MediaRep, QuoteSource, QuoteText, TextAlign, TextBg, TextColor, WriteCard, WriteMedia, WriteSticker, type CardAttrs, compactPollElement, type Align } from './appExtensions'
import { EditorPoll, LegacyTextStyle, WriteEmbed, embedItemFromAttrs, type EmbedAttrs } from './editorExtensions'
import type { EmbedItem, PollData } from './legacyLibs'
import { embedLib, fixLegacyPaths } from './legacyLibs'
import { safeDraftHtml } from './writeUtils'

export const FONT_FAMILIES = [
  { value: '', label: '프리텐다드' },
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
  /** 치지직형: 투표 · 링크 · 사진을 누르면 「선택됨」 블록이 되고, 블록 안 수정 · 삭제 단추 대신 블록 도구 줄을 쓴다 */
  compactBlocks?: boolean
  /** 인용구 본문 안내 글자(네이버 카페 앱: 「내용을 입력하세요.」) */
  quotePlaceholder?: string
  pollIcon?: string
}

let embedSeq = 0

export function useAppEditor(target: Ref<HTMLElement | null>, options: AppEditorOptions) {
  /** 사진 · 동영상 설명 칸에 커서가 있으면 그 블록 위치(설명 전용 도구 줄을 띄운다) */
  const captionPos = ref<number | null>(null)
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
            if (node.type.name === 'quoteText') return options.quotePlaceholder || '내용을 입력해 주세요'
            if (node.type.name === 'quoteSource') return '출처 입력'
            return ed.isEmpty ? options.placeholder() : ''
          },
        }),
        TextAlign,
        TextColor,
        TextBg,
        LegacyTextStyle,
        QuoteText,
        QuoteSource,
        AppQuote,
        WriteMedia.configure({ onRemove: options.onRemoveMedia, chzzk: Boolean(options.compactBlocks), onCaptionFocus: (pos) => { captionPos.value = pos } }),
        MediaRep,
        WriteEmbed.extend({ selectable: Boolean(options.compactBlocks) }).configure({ onRemoveEmbed: () => {}, onEditPoll: options.onEditPoll, onRemovePoll: options.onRemovePoll }),
        options.compactBlocks
          ? EditorPoll.extend({
              selectable: true,
              addNodeView() {
                return ({ node }) => {
                  const dom = compactPollElement(String(node.attrs.data || ''), options.pollIcon || '')
                  return {
                    dom,
                    ignoreMutation: () => true,
                    update: (updated) => {
                      if (updated.type !== node.type) return false
                      dom.replaceChildren(...compactPollElement(String(updated.attrs.data || ''), options.pollIcon || '').childNodes)
                      dom.setAttribute('data-poll', String(updated.attrs.data || ''))
                      return true
                    },
                  }
                }
              },
            }).configure({ onRemoveEmbed: () => {}, onEditPoll: options.onEditPoll, onRemovePoll: options.onRemovePoll })
          : EditorPoll.configure({ onRemoveEmbed: () => {}, onEditPoll: options.onEditPoll, onRemovePoll: options.onRemovePoll }),
        WriteSticker,
        WriteCard,
        BlockAttrs,
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
    const empty = { bold: false, italic: false, underline: false, strike: false, bullet: false, link: false, block: 'p', fontFamily: '', fontSize: 15, align: 'left' as Align, color: '', bg: '', quote: 0 }
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
      bg: String(ed.getAttributes('appTextBg').color || ''),
      quote,
    }
  })

  /* ---------- 선택된 블록(치지직: 구분선 · 사진 · 동영상 · 링크 · 투표 · 스티커) ---------- */
  const block = computed(() => {
    void version.value
    const ed = editor.value
    const sel = ed?.state.selection
    if (!ed || !(sel instanceof NodeSelection)) return null
    const node = sel.node
    if (!(BLOCK_NODES as readonly string[]).includes(node.type.name)) return null
    const $pos = ed.state.doc.resolve(sel.from)
    const index = $pos.index(0)
    return {
      name: node.type.name,
      pos: sel.from,
      align: String(node.attrs.blockAlign || 'left') as Align,
      divider: Number(node.attrs.dividerStyle || 1),
      kind: String(node.attrs.kind || ''),
      href: String(node.attrs.href || ''),
      first: index === 0,
      // 치지직: 블록 뒤에 남는 빈 문단 하나(「본문 추가」 자리)는 순서에 세지 않는다 → 맨 끝 블록은 「아래로」가 흐려진다
      last: index >= ed.state.doc.childCount - 1 || (index === ed.state.doc.childCount - 2 && ed.state.doc.lastChild?.type.name === 'paragraph' && !ed.state.doc.lastChild.textContent),
    }
  })
  function setBlockAttr(attrs: Record<string, unknown>) {
    const ed = editor.value
    const cur = block.value
    if (!ed || !cur) return
    const node = ed.state.doc.nodeAt(cur.pos)
    if (!node) return
    const tr = ed.state.tr.setNodeMarkup(cur.pos, undefined, { ...node.attrs, ...attrs })
    tr.setSelection(NodeSelection.create(tr.doc, cur.pos))
    ed.view.dispatch(tr)
    ed.view.focus()
  }
  function setBlockAlign(align: Align) { setBlockAttr({ blockAlign: align }) }
  /** 구분선 · 스티커 · 사진: 정렬 단추 하나를 누를 때마다 왼쪽 → 가운데 → 오른쪽 */
  function cycleBlockAlign() {
    const order: Align[] = ['left', 'center', 'right']
    const cur = block.value
    if (cur) setBlockAlign(order[(order.indexOf(cur.align) + 1) % 3]!)
  }
  function setDividerStyle(style: number) { setBlockAttr({ dividerStyle: style }) }
  function deleteBlock() {
    const ed = editor.value
    const cur = block.value
    if (!ed || !cur) return
    const node = ed.state.doc.nodeAt(cur.pos)
    if (!node) return
    if (node.type.name === 'writeMedia') options.onRemoveMedia(String(node.attrs.mediaId))
    if (node.type.name === 'editorPoll') options.onRemovePoll()
    ed.chain().focus().deleteRange({ from: cur.pos, to: cur.pos + node.nodeSize }).run()
  }
  /** 위로 · 아래로: 바로 앞 · 뒤 블록과 자리를 바꾸고 계속 선택해 둔다 */
  function moveBlock(dir: -1 | 1) {
    const ed = editor.value
    const cur = block.value
    if (!ed || !cur) return
    const doc = ed.state.doc
    const index = doc.resolve(cur.pos).index(0)
    const other = index + dir
    if (other < 0 || other >= doc.childCount) return
    const node = doc.child(index)
    const sibling = doc.child(other)
    let start = 0
    for (let i = 0; i < Math.min(index, other); i += 1) start += doc.child(i).nodeSize
    const first = dir < 0 ? node : sibling
    const second = dir < 0 ? sibling : node
    const tr = ed.state.tr.replaceWith(start, start + node.nodeSize + sibling.nodeSize, [first, second])
    const at = dir < 0 ? start : start + sibling.nodeSize
    tr.setSelection(NodeSelection.create(tr.doc, at))
    ed.view.dispatch(tr.scrollIntoView())
    ed.view.focus()
  }
  function selectBlockAt(pos: number) {
    const ed = editor.value
    if (!ed) return
    ed.view.dispatch(ed.state.tr.setSelection(NodeSelection.create(ed.state.doc, pos)))
  }
  /** 선택된 블록의 화면 위치(위로 · 아래로 단추를 그 아래에 붙인다) */
  function blockDom(): HTMLElement | null {
    const ed = editor.value
    const cur = block.value
    if (!ed || !cur) return null
    return (ed.view.nodeDOM(cur.pos) as HTMLElement | null) || null
  }

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
  function setBg(color: string) {
    const c = chain()
    if (!c) return
    if (color) c.setMark('appTextBg', { color }).run()
    else c.unsetMark('appTextBg').run()
  }
  /** 네이버 카페 앱: 일정 · 장소 · 파일 · 글감 카드를 커서 자리(블록이 골라져 있으면 그 뒤)에 넣는다 */
  function insertCard(card: Partial<CardAttrs> & { kind: string, title: string }) {
    const ed = editor.value
    if (!ed) return
    const content = [{ type: 'writeCard', attrs: { sub: '', meta: '', link: '', image: '', ...card } }, { type: 'paragraph' }]
    const sel = ed.state.selection
    if (sel instanceof NodeSelection) { ed.chain().focus().insertContentAt(sel.to, content).run(); return }
    chain()?.insertContent(content).run()
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
  /** 치지직: 스티커는 커서 자리에 그림 블록으로 들어간다 */
  function insertSticker(emoji: string) { chain()?.insertContent([{ type: 'writeSticker', attrs: { emoji } }, { type: 'paragraph' }]).run() }
  function insertMedia(item: { id: string, kind: 'photo' | 'video', url: string, name: string }, extra: Record<string, unknown> = {}) {
    const content = [{ type: 'writeMedia', attrs: { mediaId: item.id, kind: item.kind, src: item.url, name: item.name, ...extra } }, { type: 'paragraph' }]
    const sel = editor.value?.state.selection
    // 사진 · 동영상 블록을 고른 채(설명 입력 중 포함) 넣으면 고른 블록을 덮지 말고 그 뒤에 넣는다
    if (sel instanceof NodeSelection) { chain()?.insertContentAt(sel.to, content).run(); return }
    const parent = sel?.$from.parent
    if (sel && parent && parent.type.name !== 'paragraph' && sel.$from.depth === 0) { chain()?.insertContentAt(sel.to, content).run(); return }
    chain()?.insertContent(content).run()
  }
  /** 선택한 사진 · 동영상 블록의 속성을 바꾼다(교체 · 링크 · 동영상 정보) */
  function setMediaAttrs(attrs: Record<string, unknown>, at?: number) {
    const ed = editor.value
    const where = at ?? block.value?.pos
    if (!ed || typeof where !== 'number') return null
    const node = ed.state.doc.nodeAt(where)
    if (!node || node.type.name !== 'writeMedia') return null
    const before = { ...node.attrs }
    const tr = ed.state.tr.setNodeMarkup(where, undefined, { ...node.attrs, ...attrs })
    if (at === undefined) tr.setSelection(NodeSelection.create(tr.doc, where))
    ed.view.dispatch(tr)
    return before
  }
  function mediaAt(at?: number) {
    void version.value
    const ed = editor.value
    const where = at ?? block.value?.pos
    if (!ed || typeof where !== 'number') return null
    const node = ed.state.doc.nodeAt(where)
    return node && node.type.name === 'writeMedia' ? { ...node.attrs } as Record<string, unknown> : null
  }
  /** 설명 칸 도구 줄(정렬 · 굵게 · 링크) */
  const caption = computed(() => {
    const at = captionPos.value
    if (at === null) return null
    const attrs = mediaAt(at)
    return attrs ? { pos: at, align: String(attrs.captionAlign || 'center') as Align, bold: Boolean(attrs.captionBold), href: String(attrs.captionHref || '') } : null
  })
  function setCaptionAttrs(attrs: Record<string, unknown>) {
    const ed = editor.value
    const at = captionPos.value
    if (!ed || at === null) return
    setMediaAttrs(attrs, at)
    const input = (ed.view.nodeDOM(at) as HTMLElement | null)?.querySelector<HTMLInputElement>('.write-media-cap')
    input?.focus()
  }
  function cycleCaptionAlign() {
    const order: Align[] = ['center', 'right', 'left']
    const cur = caption.value
    if (cur) setCaptionAttrs({ captionAlign: order[(order.indexOf(cur.align) + 1) % 3] })
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
    editor, version, focused, state, block, create, destroy, text, html, setHtml, countNodes,
    toggle, setBlock, setFontFamily, setFontSize, setColor, setBg, insertCard, cycleAlign, setLink, unsetLink,
    insertQuote, setQuoteStyle, removeQuote, insertDivider, insertText, insertSticker,
    setBlockAlign, cycleBlockAlign, setDividerStyle, deleteBlock, moveBlock, selectBlockAt, blockDom, insertMedia, setMediaAttrs, mediaAt, caption, captionPos, setCaptionAttrs, cycleCaptionAlign, insertEmbed, collectEmbeds, currentPoll, applyPoll,
  }
}

export type AppEditor = ReturnType<typeof useAppEditor>
