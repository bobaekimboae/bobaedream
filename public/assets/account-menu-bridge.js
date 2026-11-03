/* Legacy-shell adapter only. All account UI is Nuxt 4 / Vue in nuxt-community/account. */
(() => {
  const script = document.currentScript;
  if (!script || window.__bbmAccountBridge) return;
  window.__bbmAccountBridge = true;
  const base = new URL('../', script.src);
  const bookmarksUrl = new URL('nuxt-community/', base);
  bookmarksUrl.searchParams.set('v', new URL(script.src).searchParams.get('v') || 'saved-v1');
  bookmarksUrl.hash = '/saved';
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
    if (panel.classList.contains('is-expanded')) {
      const width = Math.min(900, innerWidth - 32); panel.style.width = width + 'px'; panel.style.left = (innerWidth - width) / 2 + 'px'; panel.style.top = '24px'; panel.style.height = Math.min(760, innerHeight - 48) + 'px'; return;
    }
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
    const root = document.getElementById('root') || document.getElementById('__nuxt');
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
    // Hash routes do not invalidate the cached HTML document after a Pages release.
    url.searchParams.set('v', new URL(script.src).searchParams.get('v') || 'account-v2');
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
    const root = document.getElementById('root') || document.getElementById('__nuxt'); wasRootInert = root?.inert || false; if (root) root.inert = true;
    previousOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
    history.pushState({ ...history.state, bbmAccount: true }, '', location.href);
    position(); dismiss.focus({ preventScroll: true });
    setTimeout(() => { if (loading.isConnected) label.textContent = '메뉴 연결이 지연되고 있습니다. 잠시 후 다시 열어 주세요.'; }, 12000);
  }
  document.addEventListener('click', event => {
    const saved = event.target.closest?.('.bbm-header-auth button[aria-label="관심 매물"],button[aria-label="저장한 매물 열기"]');
    if (saved && !panel) { event.preventDefault(); event.stopImmediatePropagation(); location.assign(bookmarksUrl.href); return; }
    const button = event.target.closest?.('.bbm-account-button,.bbm-auth-pill.is-login,.bbm-bottom-gnb__item');
    const isMy = button?.classList.contains('bbm-bottom-gnb__item') && button.textContent.trim() === '마이';
    if (button && (isMy || !button.classList.contains('bbm-bottom-gnb__item'))) {
      event.preventDefault(); event.stopImmediatePropagation(); open(button, button.classList.contains('is-login') ? (readDemoSession() ? 'dealer' : 'login') : ''); return;
    }
    if (panel && !panel.contains(event.target) && !trigger?.contains(event.target)) { event.preventDefault(); event.stopImmediatePropagation(); close(); }
  }, true);
  document.addEventListener('keydown', event => { if (panel && event.key === 'Escape') { event.preventDefault(); close(); } });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame?.contentWindow || event.data?.channel !== 'bbm-account-v1') return;
    if (event.data.type === 'ready') {
      panel?.querySelector('.bbm-account-loading')?.remove(); frame?.focus();
      const u = new URL(location.href); u.searchParams.delete('v');
      const title = ['category','maker','model','generation','priceMin','priceMax'].map(k=>u.searchParams.get(k)).filter(Boolean).join(' · ') || '전체 차량';
      frame?.contentWindow?.postMessage({channel:'bbm-account-v1',type:'context',title,url:u.href},location.origin);
    }
    if (event.data.type === 'expand' || event.data.type === 'compact') { panel?.classList.toggle('is-expanded', event.data.type === 'expand'); position(); }
    if (event.data.type === 'session') updateSessionUi();
    if (event.data.type === 'activity') restoreLikes(true);
    if (event.data.type === 'search' && typeof event.data.url === 'string') { const u = safeUrl(event.data.url); if(u) close({after:()=>location.assign(u.href)}); }
    if (event.data.type === 'vehicle' && event.data.vehicle && typeof event.data.vehicle.title === 'string') {
      const v=event.data.vehicle; const cards=[...document.querySelectorAll('.bbm-result-card[role=link]')];
      const card=cards.find(el=>snapshot(el)?.id===v.id) || (!v.id?.startsWith('observed-') ? cards.find(el=>el.querySelector('.bbm-card-title')?.textContent.trim()===v.title) : null);
      if(card) close({after:()=>card.click()}); else {const u=safeUrl(v.url);if(u)close({after:()=>location.assign(u.href)});}
    }
    if (event.data.type === 'close') close();
    if (event.data.type !== 'navigate') return;
    const action = event.data.action;
    if (!['favorites', 'bookmarks', 'register', 'feedback', 'logout-preview', 'listing'].includes(action)) return;
    if (action === 'bookmarks') { close({after:()=>location.assign(bookmarksUrl.href)}); return; }
    if (action === 'favorites') {
      const favorite = document.querySelector('.bbm-header-auth [aria-label="관심 매물"],button[aria-label="저장한 매물 열기"]');
      close({ after: () => favorite?.click() });
    } else if (action === 'register') close({ after: () => location.assign(new URL('?register=1', base).href) });
    else if (action === 'feedback') close({ after: () => location.assign(new URL('community/naver-cafe-list.html?board=suggestion', base).href) });
    else if (action === 'listing') close();
    else { const target = new URL(location.href); target.searchParams.delete('pcauth'); close({ after: () => location.replace(target.href) }); }
  });
  window.addEventListener('popstate', () => { if (pending) { pending = false; const after = afterHistoryClose; afterHistoryClose = null; after?.(); return; } close({ fromPop: true }); });
  window.addEventListener('resize', position);
  window.addEventListener('scroll', position, true);

  // Serialize only public listing UI snapshots; no app stores, cookies or auth credentials.
  const activityKey = 'bbm.account.listing-activity.v1';
  const demoKey = 'bbm.account.demo.v2';
  let restoring = false; const restored = new WeakSet();
  function readActivity() { try { const a=JSON.parse(localStorage.getItem(activityKey)||'null');return a&&Array.isArray(a.favorites)&&Array.isArray(a.recent)?a:{favorites:[],recent:[]}; }catch{return {favorites:[],recent:[]};} }
  function activityError(message) {
    document.getElementById('bbm-activity-error')?.remove();
    const el=document.createElement('div');el.id='bbm-activity-error';el.setAttribute('role','alert');el.textContent=message;
    Object.assign(el.style,{position:'fixed',bottom:'80px',left:'50%',transform:'translateX(-50%)',maxWidth:'calc(100% - 32px)',padding:'12px 16px',background:'#222',color:'#fff',borderRadius:'8px',zIndex:'99999',fontSize:'14px',lineHeight:'20px'});
    document.body.appendChild(el);setTimeout(()=>el.remove(),5000);
  }
  function writeActivity(a) {try{localStorage.setItem(activityKey,JSON.stringify(a));frame?.contentWindow?.postMessage({channel:'bbm-account-v1',type:'activity'},location.origin);return true;}catch{activityError('브라우저 저장 공간을 확인해 주세요. 목록을 변경하지 못했습니다.');return false;}}
  function safeUrl(value) {try{const u=new URL(value,base);return u.origin===location.origin&&/^https?:$/.test(u.protocol)?u:null;}catch{return null;}}
  function snapshot(card) {
    const title=card.querySelector('.bbm-card-title')?.textContent.trim();if(!title)return null;
    const photo=card.querySelector('.bbm-card-photo img');const image=photo?.currentSrc||photo?.src||new URL('assets/bbm/favicon.svg',base).href;
    const specs=card.querySelector('.bbm-card-spec')?.textContent.trim()||'';const price=card.querySelector('.bbm-card-price')?.textContent.trim()||'';
    // The PC-only power/seller suffix must not create a different identity on mobile.
    const commonSpecs=specs.split('·').slice(0,3).map(x=>x.trim()).join('|');
    const text=title+'|'+image+'|'+commonSpecs;let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);
    const url=new URL(location.href);url.searchParams.delete('accountListing');
    return {id:'observed-'+(hash>>>0).toString(16),title,image,price,specs,url:url.href,
      location:card.querySelector('.bbm-card-location-text > span')?.textContent.trim()||'',
      seller:card.querySelector('.bbm-card-seller-text')?.textContent.trim()||'',
      sellerAvatar:card.querySelector('.bbm-card-seller-logo')?.src||'',
      avatarReady:!!card.querySelector('.bbm-card-seller-logo')?.naturalWidth,
      posted:card.querySelector('.bbm-card-time')?.textContent.trim()||''};
  }
  document.addEventListener('click', e=>{
    if(restoring)return;
    const card=e.target.closest?.('.bbm-result-card[role=link]');if(!card)return;
    const v=snapshot(card);if(!v)return;
    const like=e.target.closest('button[aria-pressed][aria-label*="찜"]');const a=readActivity();
    if(like){
      const enabled=like.getAttribute('aria-pressed')!=='true';
      if(enabled&&a.favorites.length>=100&&!a.favorites.some(x=>x.id===v.id)){e.preventDefault();e.stopImmediatePropagation();activityError('관심 매물은 최대 100개까지 저장할 수 있습니다.');return;}
      a.favorites=enabled?[v,...a.favorites.filter(x=>x.id!==v.id)]:a.favorites.filter(x=>x.id!==v.id);
    }
    else if(!e.target.closest('button'))a.recent=[v,...a.recent.filter(x=>x.id!==v.id)].slice(0,100);
    if(!writeActivity(a)&&like){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  function restoreLikes(force=false) {
    if(restoring)return;const a=readActivity();restoring=true;
    try{document.querySelectorAll('.bbm-result-card .bbm-card-wish[aria-pressed]').forEach(button=>{
      if(!force&&restored.has(button))return;restored.add(button);const v=snapshot(button.closest('.bbm-result-card'));if(!v)return;
      const wanted=a.favorites.some(x=>x.id===v.id);if(wanted!==(button.getAttribute('aria-pressed')==='true'))button.click();
    });}finally{restoring=false;}
  }
  function readDemoSession(){try{return JSON.parse(localStorage.getItem(demoKey)||'null')?.signedIn===true;}catch{return false;}}
  function updateSessionUi(){const button=document.querySelector('.bbm-auth-pill.is-login');if(button){const label=readDemoSession()?'내 매물 관리':'로그인/회원가입';if(button.textContent!==label)button.textContent=label;}}
  let queued=false;
  let pendingListing=new URL(location.href).searchParams.get('accountListing');
  function openPendingListing(){
    if(!pendingListing)return;
    const saved=readActivity().favorites.find(v=>v.id===pendingListing)||readActivity().recent.find(v=>v.id===pendingListing);
    if(!saved)return;
    const card=[...document.querySelectorAll('.bbm-result-card[role=link]')].find(el=>snapshot(el)?.id===pendingListing || (!pendingListing.startsWith('observed-')&&el.querySelector('.bbm-card-title')?.textContent.trim().startsWith(saved.title)));
    if(!card)return;
    pendingListing=null;const u=new URL(location.href);u.searchParams.delete('accountListing');history.replaceState(history.state,'',u.href);card.click();
  }
  new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;restoreLikes();updateSessionUi();openPendingListing();});}).observe(document.getElementById('root')||document.body,{childList:true,subtree:true});
  window.addEventListener('storage',e=>{if(e.key===activityKey)restoreLikes(true);if(e.key===demoKey)updateSessionUi();});
  restoreLikes();updateSessionUi();openPendingListing();
})();
