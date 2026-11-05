// 본문 좌우 넘기기로 이전·다음 게시판 이동(hupu-board-navigation.js setupBoardSwipe 이식).
// 바이두 · 후푸 규칙: 처음 8px 방향 판정, 손가락 1:1, 옆 게시판이 8px 틈을 두고 붙어 따라옴,
// 빠른 휙(초당 400px · 25px 이상) 또는 절반 넘김이면 이동, 끝 게시판은 끌리지 않음, 감속 곡선 최대 0.6초.
// 화면을 바꾸는 일은 Vue 상태로 하고, 움직임(transform)과 지금 화면 복사본(ghost)만 DOM에 직접 그린다.
import type { Ref } from 'vue'
import type { ListNav } from './useListNav'
import { recordRecentBoard } from './listBoards'

export function useBoardSwipe(mainRef: Ref<HTMLElement | null>, nav: ListNav, isBlockedByUi: () => boolean) {
  const EASE = 'cubic-bezier(.22,1,.36,1)'
  const GAP = 8
  let start: { x: number; y: number } | null = null
  let locked: 'x' | 'y' | null = null
  let moving = false
  let busy = false
  let stage: HTMLElement[] = []
  let samples: Array<{ x: number; t: number }> = []
  let preview: string | null = null
  let moveFrame = 0
  let pendingPoint: { x: number; y: number; t: number } | null = null
  let touchTarget: EventTarget | null = null
  let origId: string | null = null
  let target: string | null = null
  let ghost: HTMLElement | null = null
  let savedY = 0
  let lastDx = 0
  const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const w = () => mainRef.value?.clientWidth || innerWidth

  function navEl() { return mainRef.value?.querySelector('#boardChannelNav') as HTMLElement | null }
  function stageEls() {
    const out: HTMLElement[] = []
    let el = navEl()?.nextElementSibling as HTMLElement | null
    while (el) {
      if (!el.classList.contains('fab') && !el.classList.contains('boardSwipeGhost') && el.offsetParent !== null) out.push(el)
      el = el.nextElementSibling as HTMLElement | null
    }
    return out
  }
  function setX(els: HTMLElement[], x: number, ms: number) {
    els.forEach((el) => {
      el.style.transition = ms ? 'transform ' + ms + 'ms ' + EASE : 'none'
      el.style.transform = x ? 'translate3d(' + x + 'px,0,0)' : ''
    })
  }
  function clear(els: HTMLElement[]) {
    els.forEach((el) => { el.style.transition = ''; el.style.transform = ''; el.style.willChange = '' })
  }
  function setPreview(id: string | null) {
    if (preview === id) return
    preview = id
    nav.navOn.value = id || nav.selectedId.value
  }
  function blocked(t: Element) {
    if (busy || isBlockedByUi()) return true
    if (!t.closest || t.closest('#boardChannelNav,.sheet.open,.boardOrderBackdrop,input,textarea,[contenteditable="true"]')) return true
    const main = mainRef.value
    for (let el: Element | null = t; el && el !== main; el = el.parentElement) {
      if (el.scrollWidth > el.clientWidth + 2) {
        const ox = getComputedStyle(el).overflowX
        if (ox === 'auto' || ox === 'scroll') return true
      }
    }
    return false
  }
  function velocity() {
    const now = performance.now()
    samples = samples.filter(p => now - p.t <= 100)
    if (samples.length < 2) return 0
    const a = samples[0]!, b = samples[samples.length - 1]!
    return ((b.x - a.x) / Math.max(1, b.t - a.t)) * 1000
  }
  function detach() {
    if (touchTarget) {
      touchTarget.removeEventListener('touchmove', onMove as EventListener)
      touchTarget.removeEventListener('touchend', end as EventListener)
      touchTarget.removeEventListener('touchcancel', onCancel as EventListener)
      touchTarget = null
    }
  }
  function snapshot() {
    const main = mainRef.value
    if (!main) return null
    if (getComputedStyle(main).position === 'static') main.style.position = 'relative'
    const cur = stageEls()
    if (!cur.length) return null
    const top = cur[0]!.getBoundingClientRect().top - (parseFloat(getComputedStyle(cur[0]!).marginTop) || 0) - main.getBoundingClientRect().top
    const g = document.createElement('div')
    g.className = 'boardSwipeGhost'
    g.setAttribute('aria-hidden', 'true')
    g.style.cssText = 'position:absolute;left:0;right:0;top:' + top + 'px;z-index:1;pointer-events:none;background:inherit;will-change:transform'
    cur.forEach((el) => {
      const c = el.cloneNode(true) as HTMLElement
      c.removeAttribute('id')
      c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'))
      c.style.transform = ''
      c.style.transition = ''
      g.appendChild(c)
    })
    main.appendChild(g)
    return g
  }
  // 게시판 본문을 Vue 로 바꾼 뒤(다음 틱) 움직일 요소를 다시 모은다
  function render(id: string) {
    nav.renderPreview(id)
    window.scrollTo(0, savedY)
    return nextTick(() => {
      window.scrollTo(0, savedY)
      stage = stageEls()
      stage.forEach((el) => { el.style.willChange = 'transform' })
    })
  }
  function showTarget(id: string | null) {
    if (id === target) return Promise.resolve()
    target = id
    if (id) {
      if (!ghost) ghost = snapshot()
      return render(id)
    }
    const job = render(origId!)
    if (ghost) { ghost.remove(); ghost = null }
    return job
  }
  function place(dx: number, ms: number) {
    const dir = dx < 0 ? 1 : -1
    if (!target) { setX(stage, 0, ms); return }
    setX(stage, dir * (w() + GAP) + dx, ms)
    if (ghost) {
      ghost.style.transition = ms ? 'transform ' + ms + 'ms ' + EASE : 'none'
      ghost.style.transform = 'translate3d(' + dx + 'px,0,0)'
    }
  }
  function applyMove() {
    moveFrame = 0
    if (!start || locked !== 'x' || !pendingPoint) return
    const dx = pendingPoint.x - start.x
    if (!moving) {
      moving = true
      origId = nav.selectedId.value
      target = null
      ghost = null
      savedY = window.scrollY
      stage = stageEls()
    }
    const dir = dx < 0 ? 1 : -1
    const ids = nav.channelIds()
    const i = ids.indexOf(origId!)
    const id = dx === 0 || i < 0 ? null : ids[i + dir] || null
    lastDx = id ? dx : 0
    const changed = id !== target
    const job = showTarget(id)
    place(lastDx, 0)
    if (changed) job.then(() => place(lastDx, 0))
    setPreview(id && Math.abs(dx) > w() / 2 ? id : origId)
  }
  function onMove(e: TouchEvent & { __bbmSwipe?: boolean }) {
    if (!start || e.__bbmSwipe) return
    e.__bbmSwipe = true
    const t = e.touches[0]!
    const dx = t.clientX - start.x, dy = t.clientY - start.y, now = performance.now()
    samples.push({ x: t.clientX, t: now })
    if (samples.length > 8) samples.shift()
    if (locked === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (locked === 'x') {
        start.x = t.clientX - (dx > 0 ? 8 : -8)
        ;(window as unknown as { __bbmBoardSwipeActive?: boolean }).__bbmBoardSwipeActive = true
      }
    }
    if (locked !== 'x') return
    e.preventDefault()
    pendingPoint = { x: t.clientX, y: t.clientY, t: now }
    if (!moveFrame) moveFrame = requestAnimationFrame(applyMove)
  }
  function finish(ms: number, done?: () => void) {
    setTimeout(() => {
      if (ghost) { ghost.remove(); ghost = null }
      clear(stage)
      busy = false
      ;(window as unknown as { __bbmBoardSwipeActive?: boolean }).__bbmBoardSwipeActive = false
      done && done()
    }, ms + 40)
  }
  function end(e: TouchEvent & { __bbmSwipe?: boolean }) {
    if (!start || e.__bbmSwipe) return
    e.__bbmSwipe = true
    detach()
    if (moveFrame) { cancelAnimationFrame(moveFrame); moveFrame = 0; applyMove() }
    const s = start
    start = null
    pendingPoint = null
    if (!moving) { (window as unknown as { __bbmBoardSwipeActive?: boolean }).__bbmBoardSwipeActive = false; return }
    moving = false
    const t = (e.changedTouches && e.changedTouches[0]) || { clientX: s.x }
    const dx = t.clientX - s.x, v = velocity(), width = w()
    const id = target
    const fling = Math.abs(v) >= 400 && Math.abs(dx) >= 25 && v < 0 === dx < 0
    const go = !!id && (fling || Math.abs(dx) > width / 2)
    const remain = go ? width + GAP - Math.abs(dx) : Math.abs(dx)
    const ms = reduceMotion ? 0 : Math.min(600, Math.abs(v) >= 400 ? 4 * Math.round((1000 * remain) / Math.abs(v)) : Math.round((remain / width + 1) * 100))
    busy = true
    if (!id) { setX(stage, 0, ms); finish(ms); return }
    const dir = dx < 0 ? 1 : -1
    if (go) {
      setPreview(id)
      setX(stage, 0, ms)
      if (ghost) { ghost.style.transition = ms ? 'transform ' + ms + 'ms ' + EASE : 'none'; ghost.style.transform = 'translate3d(' + -dir * (width + GAP) + 'px,0,0)' }
      finish(ms, () => {
        nav.updateQuery(id)
        recordRecentBoard(id)
        nav.scrollSignal.value++
      })
    } else {
      setPreview(origId)
      setX(stage, dir * (width + GAP), ms)
      if (ghost) { ghost.style.transition = ms ? 'transform ' + ms + 'ms ' + EASE : 'none'; ghost.style.transform = 'translate3d(0,0,0)' }
      const keep = origId!
      finish(ms, () => { render(keep).then(() => { clear(stage); target = null }) })
    }
  }
  function onCancel(e: TouchEvent & { __bbmSwipe?: boolean }) {
    if (e.__bbmSwipe) return
    e.__bbmSwipe = true
    detach()
    if (moveFrame) { cancelAnimationFrame(moveFrame); moveFrame = 0 }
    pendingPoint = null
    if (start && moving) {
      const keep = origId!
      render(keep).then(() => { clear(stage); target = null })
      if (ghost) { ghost.remove(); ghost = null }
    }
    start = null
    moving = false
    ;(window as unknown as { __bbmBoardSwipeActive?: boolean }).__bbmBoardSwipeActive = false
  }
  function onStart(e: TouchEvent) {
    if (e.touches.length !== 1) { start = null; return }
    const t = e.touches[0]!
    if (t.clientX < 20 || t.clientX > innerWidth - 20 || blocked(e.target as Element)) { start = null; return }
    start = { x: t.clientX, y: t.clientY }
    locked = null
    moving = false
    stage = []
    samples = [{ x: t.clientX, t: performance.now() }]
    preview = null
    pendingPoint = null
    detach()
    touchTarget = e.target
    touchTarget!.addEventListener('touchmove', onMove as EventListener, { passive: false })
    touchTarget!.addEventListener('touchend', end as EventListener, { passive: true })
    touchTarget!.addEventListener('touchcancel', onCancel as EventListener, { passive: true })
  }
  onMounted(() => {
    const main = mainRef.value
    if (!main || !('ontouchstart' in window || navigator.maxTouchPoints > 0)) return
    main.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove as EventListener, { passive: false })
    window.addEventListener('touchend', end as EventListener, { passive: true })
    window.addEventListener('touchcancel', onCancel as EventListener, { passive: true })
  })
  onBeforeUnmount(() => {
    mainRef.value?.removeEventListener('touchstart', onStart)
    window.removeEventListener('touchmove', onMove as EventListener)
    window.removeEventListener('touchend', end as EventListener)
    window.removeEventListener('touchcancel', onCancel as EventListener)
    detach()
  })
}
