// 글쓰기 본문 편집기(Tiptap 3.27.3). 원본: public/community/chzzk-write.js 의 contenteditable + execCommand.
// 편집기는 정적 판과 같은 <article id="postBody" class="editor-body"> 요소 자체에 붙인다(element.mount),
// 그래서 .editor > .editor-body 구조 · 클래스가 정적 판과 똑같다.
import { Editor, Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import type { Node as PMNode } from '@tiptap/pm/model'
import type { EditorState } from '@tiptap/pm/state'
import { shallowRef, ref, type Ref } from 'vue'
import type { EmbedAttrs, WriteBlockOptions } from './editorExtensions'
import { EditorPoll, LegacyTextStyle, WriteEmbed, embedItemFromAttrs } from './editorExtensions'
import type { EmbedItem, PollData } from './legacyLibs'
import { embedLib, fixLegacyPaths } from './legacyLibs'
import { legacyFontFamily, legacyFontPx, safeDraftHtml } from './writeUtils'

export const BODY_PLACEHOLDER = '함께 나누고 싶은 얘기를 남겨주세요.'

let embedSeq = 0

export function useWriteEditor(target: Ref<HTMLElement | null>, callbacks: WriteBlockOptions) {
  const editor = shallowRef<Editor | null>(null)
  /** 문서가 바뀔 때마다 올라간다(등록 버튼 상태 계산용) */
  const version = ref(0)
  let touched = false
  function isTouched(state: EditorState): boolean {
    if (touched) return true
    // 글자를 한 번이라도 쓰면(정적 판은 지워도 <br> 이 남는다). 투표는 뒤 빈 줄까지 같이 지워 본문이 다시 비므로 세지 않는다
    touched = state.doc.textContent.length > 0
    return touched
  }
  /** 정적 판에서 빈 본문에 서식만 바꿔도 <p><br></p> 가 생기는 경우 */
  function markTouched() {
    if (touched || !editor.value) return
    touched = true
    editor.value.view.dispatch(editor.value.state.tr.setMeta('addToHistory', false))
  }

  function create(initialHtml = '') {
    if (!target.value) return
    editor.value = new Editor({
      element: { mount: target.value },
      injectCSS: false,
      enableInputRules: false,
      enablePasteRules: false,
      content: initialHtml || '',
      editorProps: {
        attributes: { id: 'postBody', class: 'editor-body', role: 'textbox', 'aria-multiline': 'true', 'data-placeholder': BODY_PLACEHOLDER },
      },
      extensions: [
        // 정적 판 안내 문구는 본문이 완전히 빈 동안(:empty)만 보인다. 한 번이라도 글자 · 블록이 들어가면
        // contenteditable 에 <br> 이 남아 다시 지워도 안내 문구가 돌아오지 않는다 → is-touched 로 같게 한다
        // (Tiptap 은 editorProps.attributes 함수를 펼쳐 버리므로 ProseMirror 플러그인 속성으로 둔다)
        Extension.create({
          name: 'writeTouched',
          addProseMirrorPlugins: () => [new Plugin({ props: { attributes: (state: EditorState): Record<string, string> => (isTouched(state) ? { class: 'is-touched' } : {}) } })],
        }),
        StarterKit.configure({
          trailingNode: false,
          codeBlock: false,
          code: false,
          link: { openOnClick: false, autolink: false, linkOnPaste: false, HTMLAttributes: { target: '_blank', rel: 'noopener', class: null } },
        }),
        Placeholder.configure({ placeholder: BODY_PLACEHOLDER }),
        LegacyTextStyle,
        WriteEmbed.configure(callbacks),
        EditorPoll.configure(callbacks),
      ],
      onUpdate: () => { version.value += 1 },
      onCreate: () => { version.value += 1 },
    })
  }

  function destroy() { editor.value?.destroy(); editor.value = null }

  // 정적 판 body.focus() 처럼 바로(같은 순간) 포커스를 돌려준다. Tiptap focus() 는 다음 화면 그리기 때 포커스해서
  // 버튼을 누르고 곧바로 치는 글자를 놓친다
  const focused = () => {
    const ed = editor.value
    if (!ed) return undefined
    if (!ed.view.hasFocus()) ed.view.focus()
    return ed.chain().focus()
  }

  /* ---------- 상태 ---------- */
  function countNodes(name: string): number {
    let count = 0
    editor.value?.state.doc.descendants((node) => { if (node.type.name === name) count += 1 })
    return count
  }
  const text = () => editor.value?.getText().trim() || ''
  const html = () => editor.value?.getHTML() || ''

  function setHtml(value: string) {
    editor.value?.commands.setContent(safeDraftHtml(value), { emitUpdate: true })
  }

  /* ---------- 서식(정적 판 execCommand 대응) ---------- */
  function formatBlock(tag: string) {
    const ed = editor.value
    const chain = focused()
    if (!chain || !ed) return
    // execCommand('formatBlock') 는 지금 쓰던 글자 모양(<font> · 굵게)을 그대로 이어 쓴다
    const marks = ed.state.storedMarks || ed.state.selection.$from.marks()
    if (tag === 'p') chain.clearNodes().run()
    else if (tag === 'h3') chain.clearNodes().setHeading({ level: 3 }).run()
    else if (tag === 'blockquote') { if (ed.isActive('blockquote')) chain.run(); else chain.setBlockquote().run() }
    if (ed.state.selection.empty && marks.length) ed.view.dispatch(ed.state.tr.setStoredMarks(marks))
    markTouched()
  }
  function insertQuote(placeholderText: string) {
    formatBlock('blockquote')
    focused()?.insertContent({ type: 'text', text: placeholderText }).run()
  }
  function insertDivider() {
    const ed = editor.value
    if (!ed) return
    // 정적 판(execCommand insertHorizontalRule)은 인용구 안에서 누르면 인용구 바깥 바로 뒤에 선을 긋는다
    if (ed.isActive('blockquote')) {
      ed.view.focus(); ed.commands.focus()
      const pos = ed.state.selection.$from.after(1)
      ed.chain().insertContentAt(pos, [{ type: 'horizontalRule' }, { type: 'paragraph' }]).setTextSelection(pos + 2).run()
      return
    }
    focused()?.setHorizontalRule().run()
    markTouched()
  }
  function command(name: string) {
    const chain = focused()
    if (!chain) return
    if (name === 'bold') chain.toggleBold().run()
    else if (name === 'italic') chain.toggleItalic().run()
    else if (name === 'underline') chain.toggleUnderline().run()
    else chain.run() // justifyLeft: 정적 판도 이미 왼쪽 정렬된 글에서는 바뀌는 것이 없다
  }
  function setFontFamily(value: string) { focused()?.setMark('legacyTextStyle', { fontFamily: legacyFontFamily(value) }).run() }
  function setFontSize(value: number) { focused()?.setMark('legacyTextStyle', { fontSize: legacyFontPx(value) }).run() }
  function insertText(value: string) { focused()?.insertContent({ type: 'text', text: value }).run() }
  /* 링크 시트는 주소 입력칸에 포커스가 가므로, 정적 판 body.focus() 는 커서를 본문 맨 앞에 둔다.
     (그래서 링크 · 임베드는 본문 맨 앞 · 첫 블록 뒤에 들어간다 — 정적 판과 같게 둔다) */
  function insertLink(href: string, label: string) {
    focused()?.focus('start').insertContent({ type: 'text', text: label, marks: [{ type: 'link', attrs: { href, target: '_blank', rel: 'noopener' } }] }).run()
  }

  /* ---------- 블록 넣기 ---------- */
  /** 정적 판: 본문 맨 끝에 블록 + 빈 줄(본문이 비었으면 그 둘만) */
  function appendToEnd(content: object[]) {
    const ed = editor.value
    if (!ed) return
    if (ed.isEmpty) { ed.commands.setContent({ type: 'doc', content }, { emitUpdate: true }); return }
    ed.commands.insertContentAt(ed.state.doc.content.size, content)
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

  /** 임베드 블록 넣기. 뉴스 카드(preview)는 메타데이터를 받은 뒤 같은 블록을 채운다 */
  function insertEmbed(item: EmbedItem): void {
    const lib = embedLib()
    if (!lib) return
    const uid = `embed-${Date.now()}-${(embedSeq += 1)}`
    const attrs: Partial<EmbedAttrs> = {
      uid,
      loading: item.render === 'preview' ? '1' : '',
      html: fixLegacyPaths(item.render === 'iframe' ? lib.frameHtml(item) : lib.cardHtml(item)),
      url: item.url, render: item.render, src: item.src || '', provider: item.provider || '', title: item.title || '', tall: item.tall ? '1' : '',
    }
    // 정적 판: 주소 입력칸에 포커스가 갔다가 body.focus() 하면 커서가 (본문, 0) 에 놓이고,
    // 그때는 맨 위 블록을 찾지 못해 body.append() 로 맨 끝에 붙는다 → 넉스트 판도 맨 끝
    focused()?.focus('end').run()
    appendToEnd([{ type: 'writeEmbed', attrs }, { type: 'paragraph' }])
    markTouched() // 임베드를 지워도 뒤 빈 줄(<p><br></p>)은 남는다
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
        ...hit.node.attrs,
        loading: '',
        html: box.innerHTML,
        metaTitle: full.title || '', metaDescription: full.description || '', metaImage: full.image || '',
        metaSite: full.site || '', metaLogo: full.logo || '', metaLang: full.lang || '',
      }))
    })
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
    else appendToEnd([{ type: 'editorPoll', attrs: { data } }, { type: 'paragraph' }])
  }

  return {
    editor, version, create, destroy, text, html, setHtml, countNodes,
    formatBlock, insertQuote, insertDivider, command, setFontFamily, setFontSize, insertText, insertLink,
    insertEmbed, collectEmbeds, currentPoll, applyPoll,
  }
}
