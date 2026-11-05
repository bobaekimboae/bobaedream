// 글쓰기에서 올린 글(?local=1) 본문: 정적 renderLocalHtml() · safeInline() · localPollHtml() 을 옮긴 것
// 글쓰기 HTML 은 DOMParser 로 읽어(스크립트 실행 없음) 덩어리 목록으로 바꾸고,
// 문장 안 서식은 굵게·기울임·밑줄·링크·글자 크기만 남긴 안전한 HTML 문자열로 만든다.
import type { BodyPart, EmbedItem, PollData, SourcePost } from './types'
import { escapeHtml } from './detailData'

function safeInline(root: Node): string {
  return Array.from(root.childNodes).map((node) => {
    if (node.nodeType === 3) return escapeHtml(node.textContent)
    if (node.nodeType !== 1) return ''
    const el = node as HTMLElement
    const inner = safeInline(el)
    const tag = el.tagName
    if (tag === 'BR') return '<br>'
    if (tag === 'B' || tag === 'STRONG') return `<strong>${inner}</strong>`
    if (tag === 'I' || tag === 'EM') return `<em>${inner}</em>`
    if (tag === 'U') return `<u>${inner}</u>`
    if (tag === 'A' && /^https?:\/\//.test(el.getAttribute('href') || '')) return `<a href="${escapeHtml(el.getAttribute('href'))}" target="_blank" rel="noopener noreferrer">${inner}</a>`
    if (tag === 'FONT' && el.getAttribute('size')) {
      const size = ({ 1: 12, 2: 13, 3: 16, 4: 18, 5: 22, 6: 26, 7: 30 } as Record<string, number>)[el.getAttribute('size') as string] || 16
      return `<span style="font-size:${size}px">${inner}</span>`
    }
    if (tag === 'FIGURE' || tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME') return ''
    return inner
  }).join('')
}

function localPoll(node: Element): PollData {
  let poll: PollData | null = null
  try { poll = JSON.parse(node.getAttribute('data-poll') || 'null') }
  catch { poll = null }
  if (!poll) {
    poll = {
      title: node.querySelector('strong')?.textContent || '투표',
      options: Array.from(node.querySelectorAll('span')).map(span => span.textContent || ''),
      note: node.querySelector('small')?.textContent || '',
    }
  }
  return poll
}

type CopyLine = Extract<BodyPart, { kind: 'copy' }>['lines'][number]

function renderLocalHtml(source: SourcePost): BodyPart[] {
  const box = new DOMParser().parseFromString(`<div>${source.html}</div>`, 'text/html').body.firstChild as HTMLElement
  const byUrl = new Map<string | undefined, EmbedItem>((source.embeds || []).map(item => [item.url, item]))
  const parts: BodyPart[] = []
  let paragraphs: CopyLine[] = []
  const flush = () => { if (paragraphs.length) { parts.push({ kind: 'copy', lines: paragraphs }); paragraphs = [] } }
  const embedPart = (el: HTMLElement): BodyPart => ({ kind: 'embed', mode: 'local', item: byUrl.get(el.dataset.embedUrl) || { url: el.dataset.embedUrl } })
  Array.from(box.childNodes).forEach((node) => {
    const el = node as HTMLElement
    if (node.nodeType === 1 && el.matches('figure.media-block, figure.write-embed')) {
      if (el.dataset.kind === 'embed' || el.classList.contains('write-embed')) { flush(); parts.push(embedPart(el)) }
      return
    }
    if (node.nodeType === 1 && el.querySelector('figure.write-embed')) {
      Array.from(el.childNodes).forEach((child) => {
        const c = child as HTMLElement
        if (child.nodeType === 1 && c.matches('figure.write-embed')) { flush(); parts.push(embedPart(c)) }
        else {
          const t = (child.textContent || '').trim()
          if (t) paragraphs.push({ tag: 'p', html: escapeHtml(t) })
        }
      })
      return
    }
    if (node.nodeType === 1 && el.tagName === 'HR') { flush(); parts.push({ kind: 'rule' }); return }
    if (node.nodeType === 1 && el.matches('section.editor-poll')) {
      flush()
      parts.push({ kind: 'poll', poll: localPoll(el), pollId: `local-${source.id || source.submittedAt || 'post'}-${parts.length}` })
      return
    }
    const text = (node.textContent || '').trim()
    if (!text) return
    const tag = node.nodeType === 1 ? el.tagName : ''
    const inner = node.nodeType === 1 ? safeInline(el) : escapeHtml(text)
    if (/^H[1-3]$/.test(tag)) paragraphs.push({ tag: 'h3', html: inner })
    else if (tag === 'BLOCKQUOTE') paragraphs.push({ tag: 'blockquote', html: inner })
    else if (tag === 'UL' || tag === 'OL') paragraphs.push({ tag: tag.toLowerCase() as 'ul' | 'ol', html: '', items: Array.from(el.children).map(li => safeInline(li)) })
    else paragraphs.push({ tag: 'p', html: inner })
  })
  flush()
  const visible = parts.some(part => part.kind !== 'poll' || ((part.poll.options || []).filter(Boolean).length >= 2))
  return visible ? parts : [{ kind: 'copy', lines: [{ tag: 'p', html: escapeHtml(source.body?.[0] || '내용이 없습니다.') }] }]
}

/** 정적 setRegularContent() 의 localSourcePost 부분 */
export function localBodyParts(post: SourcePost): BodyPart[] {
  if (post.hideBody) return [{ kind: 'copy', lines: [{ tag: 'p', html: '작성자가 본문을 숨긴 글입니다.' }] }]
  const parts = post.html ? renderLocalHtml(post) : [{ kind: 'copy', lines: (post.body || []).map(paragraph => ({ tag: 'p', html: escapeHtml(paragraph) })) } as BodyPart]
  if (Array.isArray(post.media) && post.media.length && typeof indexedDB !== 'undefined') parts.unshift({ kind: 'localMedia', media: post.media })
  return parts
}
