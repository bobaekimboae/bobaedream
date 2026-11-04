// 상세 화면(정적 public/community/chzzk-detail.html) 이식용 자원 도구 (2026-11-04)
// - 정적 판 CSS(chzzk-detail.css · community-poll.css · news-card.css)와 글꼴 CSS는 복사하지 않고
//   사이트 공용 주소(/bobaedream/community/…)를 <link>로 붙였다가 화면을 떠날 때 뗀다.
//   (SPA에서 import 하면 :root · * · body · .brand · .post 같은 전역 규칙이 목록·글쓰기 화면에 남아 새어 나간다)
// - 데이터 속 상대 주소('assets/…', 'media/…', '/assets/…')는 정적 페이지와 똑같이
//   커뮤니티 폴더 기준으로 브라우저가 푸는 방식(new URL)으로 푼다.

/** 정적 커뮤니티 페이지(…/community/xxx.html)에서 브라우저가 상대 주소를 푸는 것과 같은 결과 */
export function communityUrl(path: string | null | undefined): string {
  const value = String(path ?? '')
  if (!value) return ''
  if (/^(https?:|data:|blob:)/i.test(value)) return value
  if (typeof location === 'undefined') return communityAsset(value)
  try {
    return new URL(value, `${location.origin}${siteRoot()}community/`).href
  }
  catch {
    return communityAsset(value)
  }
}

type StyleHandle = { ready: Promise<void>; remove: () => void }

/** <link rel=stylesheet>를 head 끝에 붙이고, 다 읽히면 풀리는 약속과 떼는 함수를 돌려준다 */
export function attachStyles(hrefs: string[], marker: string): StyleHandle {
  const nodes: HTMLElement[] = []
  const loads = hrefs.map(href => new Promise<void>((resolve) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.dataset.legacyStyle = marker
    link.onload = () => resolve()
    link.onerror = () => resolve()
    document.head.appendChild(link)
    nodes.push(link)
  }))
  return {
    ready: Promise.all(loads).then(() => undefined),
    remove: () => nodes.forEach(node => node.remove()),
  }
}

/** 이 화면 전용 CSS 문자열(main.css 누수 되돌리기)을 <style>로 붙인다 */
export function attachInlineStyle(css: string, marker: string): () => void {
  const style = document.createElement('style')
  style.dataset.legacyStyle = marker
  style.textContent = css
  document.head.appendChild(style)
  return () => style.remove()
}
