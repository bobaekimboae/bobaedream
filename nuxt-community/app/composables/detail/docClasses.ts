// <html>·<body> 클래스를 화면별로 등록했다가 지운다.
// 같은 화면이 다시 만들어질 때(다른 글로 이동) 새 화면이 붙인 클래스를 옛 화면이 지우지 않게 등록부로 관리한다.
const registry = new Map<symbol, { html: string[]; body: string[] }>()
const managed = { html: new Set<string>(), body: new Set<string>() }
const preexisting = { html: new Set<string>(), body: new Set<string>() }

function sync() {
  for (const target of ['html', 'body'] as const) {
    const el = target === 'html' ? document.documentElement : document.body
    const wanted = new Set<string>()
    registry.forEach(entry => entry[target].forEach(name => wanted.add(name)))
    managed[target].forEach((name) => {
      if (!wanted.has(name) && !preexisting[target].has(name)) el.classList.remove(name)
    })
    wanted.forEach((name) => {
      if (!managed[target].has(name) && el.classList.contains(name)) preexisting[target].add(name)
      managed[target].add(name)
      el.classList.add(name)
    })
  }
}

export function setDocClasses(key: symbol, html: string[], body: string[]) {
  registry.set(key, { html, body })
  sync()
}

export function clearDocClasses(key: symbol) {
  registry.delete(key)
  sync()
}
