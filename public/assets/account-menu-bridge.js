/* Legacy-shell adapter only. All account UI is Nuxt 4 / Vue in nuxt-community/account. */
(() => {
  const script = document.currentScript;
  if (!script || window.__bbmAccountBridge) return;
  window.__bbmAccountBridge = true;
  const base = new URL('../', script.src);
  let panel, frame, trigger, previousOverflow, wasRootInert, pending = false, afterHistoryClose;
  const css = document.createElement('style');
  css.textContent = `
    .bbm-account-host{position:fixed;z-index:2147483000;width:400px;height:min(616px,calc(100dvh - 104px));background:#f7f7f7;border:4px solid #fff;border-radius:12px;box-shadow:0 5px 24px #0002;overflow:hidden}
    .bbm-account-host iframe{display:block;border:0;width:100%;height:100%;background:#f7f7f7}
    .bbm-account-host.is-mobile{inset:0!important;width:100%!important;height:100dvh!important;border:0;border-radius:0;box-shadow:none}
    .bbm-account-loading{position:absolute;inset:0;display:grid;place-content:center;gap:16px;text-align:center;background:#f7f7f7;color:#666;font:14px/22px sans-serif;padding:24px}
    .bbm-account-loading button{padding:10px 16px;border:1px solid #ddd;border-radius:8px;background:#fff;color:#222;cursor:pointer}
  `;
  document.head.append(css);
  function position() {
    if (!panel || panel.classList.contains('is-mobile')) return;
    const r = trigger?.getBoundingClientRect();
    const width = Math.min(400, window.innerWidth - 24);
    const top = Math.min((r?.bottom || 80) + 12, window.innerHeight - 160);
    panel.style.width = width + 'px';
    panel.style.top = Math.max(12, top) + 'px';
    panel.style.left = Math.max(12, Math.min((r?.right || window.innerWidth - 24) - width, window.innerWidth - width - 12)) + 'px';
    panel.style.height = Math.min(616, window.innerHeight - top - 12) + 'px';
  }
  function close({ fromPop = false, after } = {}) {
    if (!panel) return;
    panel.remove(); panel = frame = null;
    trigger?.setAttribute('aria-expanded', 'false');
    trigger?.removeAttribute('aria-controls');
    const root = document.getElementById('root');
    if (root) root.inert = wasRootInert;
    document.documentElement.style.overflow = previousOverflow;
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    if (!fromPop && history.state?.bbmAccount) { pending = true; afterHistoryClose = after; history.back(); }
    else after?.();
  }
  function open(button, initial = '') {
    if (pending) return;
    if (panel) { close(); return; }
    trigger = button;
    const mobile = !!button.closest('.bbm-bottom-gnb') || (innerWidth < 768 && !new URLSearchParams(location.search).has('pc'));
    const url = new URL('nuxt-community/', base);
    const params = new URLSearchParams({ embed: '1', surface: mobile ? 'page' : 'popover' });
    if (new URLSearchParams(location.search).get('pcauth') === 'member') params.set('member', 'preview');
    if (initial) params.set('initial', initial);
    url.hash = '/account?' + params.toString();
    panel = document.createElement('div'); panel.className = 'bbm-account-host' + (mobile ? ' is-mobile' : '');
    panel.id = 'bbm-account-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', '마이 메뉴'); panel.setAttribute('aria-modal', 'true');
    frame = document.createElement('iframe'); frame.title = '보배드림 마이 메뉴'; frame.src = url.href;
    const loading = document.createElement('div'); loading.className = 'bbm-account-loading';
    const label = document.createElement('span'); label.textContent = '마이 메뉴를 불러오고 있습니다.';
    const dismiss = document.createElement('button'); dismiss.type = 'button'; dismiss.textContent = '닫기'; dismiss.onclick = () => close();
    loading.append(label, dismiss); panel.append(frame, loading); document.body.append(panel);
    button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-expanded', 'true'); button.setAttribute('aria-controls', panel.id);
    const root = document.getElementById('root'); wasRootInert = root?.inert || false; if (root) root.inert = true;
    previousOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
    history.pushState({ ...history.state, bbmAccount: true }, '', location.href);
    position(); dismiss.focus({ preventScroll: true });
    setTimeout(() => { if (loading.isConnected) label.textContent = '메뉴 연결이 지연되고 있습니다. 잠시 후 다시 열어 주세요.'; }, 12000);
  }
  document.addEventListener('click', event => {
    const button = event.target.closest?.('.bbm-account-button,.bbm-auth-pill.is-login,.bbm-bottom-gnb__item');
    const isMy = button?.classList.contains('bbm-bottom-gnb__item') && button.textContent.trim() === '마이';
    if (button && (isMy || !button.classList.contains('bbm-bottom-gnb__item'))) {
      event.preventDefault(); event.stopImmediatePropagation(); open(button, button.classList.contains('is-login') ? 'login' : ''); return;
    }
    if (panel && !panel.contains(event.target) && !trigger?.contains(event.target)) { event.preventDefault(); event.stopImmediatePropagation(); close(); }
  }, true);
  document.addEventListener('keydown', event => { if (panel && event.key === 'Escape') { event.preventDefault(); close(); } });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame?.contentWindow || event.data?.channel !== 'bbm-account-v1') return;
    if (event.data.type === 'ready') { panel?.querySelector('.bbm-account-loading')?.remove(); frame?.focus(); }
    if (event.data.type === 'close') close();
    if (event.data.type !== 'navigate') return;
    const action = event.data.action;
    if (!['favorites', 'register', 'feedback', 'logout-preview'].includes(action)) return;
    if (action === 'favorites') {
      const favorite = document.querySelector('.bbm-header-auth [aria-label="관심 매물"],button[aria-label="저장한 매물 열기"]');
      close({ after: () => favorite?.click() });
    } else if (action === 'register') close({ after: () => location.assign(new URL('?register=1', base).href) });
    else if (action === 'feedback') close({ after: () => location.assign(new URL('community/naver-cafe-list.html?board=suggestion', base).href) });
    else { const target = new URL(location.href); target.searchParams.delete('pcauth'); close({ after: () => location.replace(target.href) }); }
  });
  window.addEventListener('popstate', () => { if (pending) { pending = false; const after = afterHistoryClose; afterHistoryClose = null; after?.(); return; } close({ fromPop: true }); });
  window.addEventListener('resize', position);
  window.addEventListener('scroll', position, true);
})();
