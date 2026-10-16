(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const params = new URLSearchParams(location.search);
  const requestedReturn = params.get('returnTo') || '';
  const returnTo = (() => {
    try {
      if (!requestedReturn) return './naver-cafe-list.html';
      const value = new URL(requestedReturn, location.href);
      return value.origin === location.origin && value.pathname.endsWith('/community/naver-cafe-list.html')
        ? `${value.pathname}${value.search}${value.hash}` : './naver-cafe-list.html';
    } catch { return './naver-cafe-list.html'; }
  })();
  const boards = [
    { section:'보배드림 커뮤니티', items:['자유게시판','국산차 오너톡','수입차 라운지','전기차','정비 · DIY','튜닝'] },
    { section:'거래 · 제보', items:['중고차','보험 · 사고','블랙박스 제보','바이크'] },
  ];
  const postKey = 'bbm.community.latestPost.v2';
  const draftKey = 'bbm.community.chzzkDraft.v1';
  const state = {
    board: params.get('board') || '',
    photos: [], videos: [], tags: [], sheet:'', emojis:[], emojiCategory:'face-emotion',
  };
  const title = $('#postTitle');
  const body = $('#postBody');
  const photoInput = $('#photoInput');
  const videoInput = $('#videoInput');
  const sheetOverlay = $('#sheetOverlay');
  const sheetTitle = $('#sheetTitle');
  const sheetBody = $('#sheetBody');
  const sheetPrimary = $('#sheetPrimary');
  const selectedBoard = $('#selectedBoard');
  const toast = $('#toast');
  let toastTimer = 0;

  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
  const showToast = (message) => {
    toast.textContent = message; toast.hidden = false; clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 1500);
  };
  const bodyText = () => body.innerText.trim();
  const syncSubmit = () => {
    const ready = Boolean(state.board && title.value.trim() && (bodyText() || state.photos.length || state.videos.length || body.querySelector('.write-embed')));
    $$('.submit-button,.footer-submit').forEach((button) => { button.disabled = !ready; });
  };
  const setBoard = (name) => {
    state.board = name; selectedBoard.textContent = name; $('#boardButton').classList.add('has-value'); syncSubmit();
  };

  function openSheet(kind, heading, primary = '') {
    state.sheet = kind; sheetTitle.textContent = heading; sheetPrimary.textContent = primary; sheetPrimary.hidden = !primary;
    sheetOverlay.hidden = false; document.body.style.overflow = 'hidden'; renderSheet();
  }
  function closeSheet() { sheetOverlay.hidden = true; document.body.style.overflow = ''; state.sheet = ''; sheetPrimary.onclick = null; }
  function renderBoardSheet() {
    sheetBody.innerHTML = boards.map((group) => `<h3 class="sheet-section-title">${group.section}</h3>${group.items.map((name) => `<button class="board-option${state.board === name ? ' is-selected' : ''}" type="button" data-board="${escapeHtml(name)}"><img src="assets/write-parity/community.svg" alt=""><span>${escapeHtml(name)}</span></button>`).join('')}`).join('');
  }
  function renderTagsSheet() {
    sheetBody.innerHTML = `<div class="sheet-form"><input id="tagInput" maxlength="120" placeholder="#으로 구분, 최대 10개" value="${state.tags.map((tag) => `#${escapeHtml(tag)}`).join(' ')}"><p class="sheet-note">예: #자동차 #드라이브 #정비</p></div>`;
    sheetPrimary.onclick = () => {
      state.tags = $('#tagInput').value.split('#').map((value) => value.trim()).filter(Boolean).slice(0,10);
      $('#tagSummary').textContent = state.tags.length ? state.tags.map((tag) => `#${tag}`).join(' ') : '#태그 입력 (#으로 구분, 최대 10개)';
      closeSheet();
    };
  }
  async function loadEmojis() {
    if (state.emojis.length) return;
    try { state.emojis = (await (await fetch('./data/emoji-v17.json')).json()).emojis || []; }
    catch { state.emojis = ['😀','😂','😍','👍','🔥','🎉','🚗','🏍️'].map((e) => ({e,c:'face-emotion'})); }
  }
  async function renderEmojiSheet() {
    await loadEmojis();
    const categories = [['face-emotion','표정'],['person-people','사람'],['animals-nature','동물'],['food-drink','음식'],['travel-places','여행'],['activities-events','활동'],['objects','사물'],['symbols','기호'],['flags','국기']];
    const values = state.emojis.filter((item) => item.c === state.emojiCategory).slice(0,140);
    sheetBody.innerHTML = `<nav class="emoji-tabs">${categories.map(([key,label]) => `<button type="button" data-emoji-category="${key}" class="${key === state.emojiCategory ? 'is-active' : ''}">${label}</button>`).join('')}</nav><div class="emoji-grid">${values.map((item) => `<button type="button" data-emoji="${item.e}" aria-label="${escapeHtml(item.d || item.e)}">${item.e}</button>`).join('')}</div>`;
  }
  function renderLinkSheet() {
    sheetBody.innerHTML = '<div class="sheet-form"><input id="linkUrl" type="text" inputmode="url" placeholder="URL 또는 임베드 코드를 붙여 넣으세요."><label class="embed-toggle"><span><strong>임베드로 보여주기</strong><small>유튜브·인스타그램·레딧은 본문에 바로, 기사는 뉴스 카드로 보여줍니다</small></span><input id="linkEmbed" type="checkbox" checked></label><input id="linkLabel" placeholder="표시할 문구 (선택)" hidden><p class="sheet-note">http:// 또는 https:// 주소만 첨부할 수 있습니다.</p></div>';
    $('#linkEmbed').addEventListener('change', (event) => { $('#linkLabel').hidden = event.target.checked; });
    sheetPrimary.onclick = () => {
      const raw = (window.BBM_EMBED && window.BBM_EMBED.fromCode ? window.BBM_EMBED.fromCode($('#linkUrl').value) : $('#linkUrl').value).trim(); let url;
      try { url = new URL(raw); } catch { showToast('올바른 URL을 입력해주세요.'); return; }
      if (!['http:','https:'].includes(url.protocol)) { showToast('웹 주소만 첨부할 수 있습니다.'); return; }
      const mode = $('#linkEmbed').checked ? 'embed' : 'link';
      if (mode === 'embed' && window.BBM_EMBED) { insertEmbed(url.href); closeSheet(); syncSubmit(); return; }
      body.focus(); document.execCommand('insertHTML', false, `<a href="${escapeHtml(url.href)}" target="_blank" rel="noopener">${escapeHtml($('#linkLabel').value.trim() || url.hostname)}</a>`); closeSheet(); syncSubmit();
    };
  }
  /* 임베드 블록: 본문 안에 고칠 수 없는 블록으로 넣고, 뉴스 카드는 제목·요약·이미지를 받아 채운다 */
  function embedFigure(item) {
    const figure = document.createElement('figure');
    figure.className = 'write-embed';
    figure.contentEditable = 'false';
    Object.entries({ url:item.url, render:item.render, src:item.src || '', provider:item.provider || '', title:item.title || '', tall:item.tall ? '1' : '' }).forEach(([key, value]) => { figure.dataset[`embed${key[0].toUpperCase()}${key.slice(1)}`] = value; });
    figure.innerHTML = (item.render === 'iframe' ? window.BBM_EMBED.frameHtml(item) : window.BBM_EMBED.cardHtml(item)) + '<button type="button" class="write-embed-remove" data-remove-embed aria-label="임베드 삭제">×</button>';
    if (item.tall) figure.classList.add('is-tall');
    return figure;
  }
  function insertEmbed(href) {
    const item = window.BBM_EMBED.info(href);
    if (!item) { showToast('올바른 URL을 입력해주세요.'); return; }
    if (item.render === 'preview') item.title = '미리보기를 불러오는 중…';
    const figure = embedFigure(item);
    const after = document.createElement('p'); after.append(document.createElement('br'));
    body.focus();
    const sel = window.getSelection();
    const range = sel && sel.rangeCount && body.contains(sel.anchorNode) ? sel.getRangeAt(0) : null;
    if (range) {
      let block = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentNode;
      while (block && block.parentNode !== body) block = block.parentNode;
      if (block && block !== body) block.after(figure, after); else body.append(figure, after);
    } else body.append(figure, after);
    showToast(item.render === 'iframe' ? `${item.provider} 임베드를 넣었습니다.` : '뉴스 카드를 넣었습니다.');
    if (item.render === 'preview') {
      figure.classList.add('is-loading');
      window.BBM_EMBED.fetchMeta(item.url).then((meta) => {
        const full = { ...item, ...meta, title: meta.title || '' };
        Object.entries({ metaTitle:full.title, metaDescription:full.description || '', metaImage:full.image || '', metaSite:full.site || '', metaLogo:full.logo || '', metaLang:full.lang || '' }).forEach(([key, value]) => { figure.dataset[key] = value; });
        figure.querySelector('.news-card')?.replaceWith(document.createRange().createContextualFragment(window.BBM_EMBED.cardHtml(full)));
        figure.classList.remove('is-loading');
      });
    }
  }
  function collectEmbeds() {
    return $$('.write-embed', body).map((figure) => ({
      url: figure.dataset.embedUrl, render: figure.dataset.embedRender, src: figure.dataset.embedSrc, provider: figure.dataset.embedProvider,
      tall: figure.dataset.embedTall === '1', title: figure.dataset.metaTitle || figure.dataset.embedTitle || '', description: figure.dataset.metaDescription || '',
      image: figure.dataset.metaImage || '', site: figure.dataset.metaSite || '', logo: figure.dataset.metaLogo || '', lang: figure.dataset.metaLang || '',
    })).filter((item) => item.url);
  }
  function pollRows(values = ['','','']) { return values.map((value,index) => `<div class="poll-row"><b>${index + 1}</b><input class="poll-option" maxlength="40" placeholder="항목을 입력하세요" value="${escapeHtml(value)}"><button type="button" data-remove-option aria-label="항목 삭제">×</button></div>`).join(''); }
  function renderPollSheet() {
    sheetBody.innerHTML = `<div class="sheet-form"><input id="pollTitle" maxlength="60" placeholder="제목을 입력해주세요"><div class="poll-options" id="pollOptions">${pollRows()}</div><button class="add-option" type="button" data-add-option>＋ 항목 추가</button><label><span>복수 선택</span><input id="pollMultiple" type="checkbox"></label><label><span>무기명 투표</span><input id="pollAnonymous" type="checkbox" checked></label><label>투표 현황 보기<select id="pollVisibility"><option>투표 참여 후 보기</option><option>항상 보기</option><option>투표 종료 후 보기</option></select></label><label><span>자동 종료일</span><input id="pollDeadlineOn" type="checkbox"></label></div>`;
    sheetPrimary.onclick = () => {
      const pollTitle = $('#pollTitle').value.trim();
      const options = $$('.poll-option').map((input) => input.value.trim()).filter(Boolean);
      if (!pollTitle || options.length < 2) { showToast('제목과 선택지 2개 이상을 입력해주세요.'); return; }
      const poll = document.createElement('section'); poll.className = 'editor-poll'; poll.contentEditable = 'false';
      poll.innerHTML = `<strong>📊 ${escapeHtml(pollTitle)}</strong>${options.map((option) => `<span>○ ${escapeHtml(option)}</span>`).join('')}<small>${$('#pollMultiple').checked ? '복수 선택 · ' : ''}${$('#pollAnonymous').checked ? '무기명 투표' : '기명 투표'}</small>`;
      body.append(poll, document.createElement('p')); closeSheet(); syncSubmit();
    };
  }
  function renderSheet() {
    if (state.sheet === 'board') renderBoardSheet();
    if (state.sheet === 'tags') renderTagsSheet();
    if (state.sheet === 'sticker') renderEmojiSheet();
    if (state.sheet === 'link') renderLinkSheet();
    if (state.sheet === 'poll') renderPollSheet();
  }

  function insertBlock(tag, text = '') {
    body.focus();
    if (tag === 'hr') document.execCommand('insertHorizontalRule');
    else document.execCommand('formatBlock', false, tag);
    if (text) document.execCommand('insertText', false, text);
    syncSubmit();
  }
  function renderMedia() {
    const media = [...state.photos, ...state.videos];
    $('#mediaList').hidden = media.length === 0;
    $('#mediaList').innerHTML = media.map((item) => `<article class="media-card" data-media-id="${item.id}">${item.kind === 'photo' ? `<img src="${item.url}" alt="${escapeHtml(item.name)}">` : `<video src="${item.url}" controls playsinline></video>`}<footer><span>${escapeHtml(item.name)}</span><button type="button" data-remove-media>삭제</button></footer></article>`).join('');
    syncSubmit();
  }
  function addFiles(files, kind) {
    const target = kind === 'photo' ? state.photos : state.videos;
    [...files].slice(0, kind === 'photo' ? 20 : 5).forEach((file) => target.push({ id:uid(kind), kind, name:file.name, url:URL.createObjectURL(file) }));
    renderMedia();
  }
  function saveDraft() {
    localStorage.setItem(draftKey, JSON.stringify({ board:state.board, title:title.value, body:body.innerHTML, tags:state.tags, hideBody:$('#hideBody').checked, savedAt:new Date().toISOString() }));
    showToast('임시 저장했습니다.');
  }
  function exitWriter() { if (title.value.trim() || bodyText()) saveDraft(); location.href = returnTo; }
  function submitPost() {
    if ($('.submit-button').disabled) return;
    localStorage.setItem(postKey, JSON.stringify({ status:'LOCAL_PREVIEW', source:'chzzk-compact', board:state.board, head:'', title:title.value.trim(), body:body.innerHTML, html:body.innerHTML, embeds:collectEmbeds(), tags:state.tags.map((tag) => `#${tag}`).join(' '), photos:state.photos.map(({name}) => ({name})), videos:state.videos.map(({name}) => ({name})), hideBody:$('#hideBody').checked, submittedAt:new Date().toISOString() }));
    localStorage.removeItem(draftKey);
    $('#dialogTitle').textContent = '게시물 등록 완료'; $('#dialogMessage').textContent = '간결형 게시판에서 등록한 글을 확인할 수 있습니다.'; $('#dialogOverlay').hidden = false;
    $('.dialog-confirm').onclick = () => { location.href = returnTo; };
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('button'); if (!button) return;
    const action = button.dataset.action;
    if (action === 'board') openSheet('board','게시판 선택');
    if (action === 'close-sheet') closeSheet();
    if (action === 'tags') openSheet('tags','태그','완료');
    if (action === 'photo') photoInput.click();
    if (action === 'video') videoInput.click();
    if (action === 'text-tools') { const tools = $('#textTools'); tools.hidden = !tools.hidden; button.setAttribute('aria-expanded', String(!tools.hidden)); }
    if (action === 'sticker') openSheet('sticker','스티커');
    if (action === 'quote') insertBlock('blockquote','인용할 내용을 입력하세요');
    if (action === 'divider') insertBlock('hr');
    if (action === 'link') openSheet('link','링크','첨부');
    if (action === 'poll') openSheet('poll','투표','등록');
    if (action === 'save-draft') saveDraft();
    if (action === 'exit') exitWriter();
    if (action === 'submit') submitPost();
    if (action === 'close-dialog') $('#dialogOverlay').hidden = true;
    if (button.dataset.board) { setBoard(button.dataset.board); closeSheet(); }
    if (button.dataset.emoji) { body.focus(); document.execCommand('insertText', false, button.dataset.emoji); closeSheet(); syncSubmit(); }
    if (button.dataset.emojiCategory) { state.emojiCategory = button.dataset.emojiCategory; renderEmojiSheet(); }
    if (button.hasAttribute('data-add-option')) {
      const values = $$('.poll-option').map((input) => input.value); if (values.length >= 10) return showToast('선택지는 최대 10개입니다.');
      $('#pollOptions').innerHTML = pollRows([...values,'']);
    }
    if (button.hasAttribute('data-remove-option')) {
      const rows = $$('.poll-row'); if (rows.length <= 2) return showToast('선택지는 2개 이상 필요합니다.');
      button.closest('.poll-row').remove(); $$('.poll-row b').forEach((item,index) => { item.textContent = index + 1; });
    }
    if (button.hasAttribute('data-remove-embed')) { button.closest('.write-embed')?.remove(); syncSubmit(); return; }
    if (button.hasAttribute('data-remove-media')) {
      const id = button.closest('[data-media-id]').dataset.mediaId;
      for (const list of [state.photos,state.videos]) { const index = list.findIndex((item) => item.id === id); if (index >= 0) { URL.revokeObjectURL(list[index].url); list.splice(index,1); } }
      renderMedia();
    }
    if (button.dataset.command) { body.focus(); document.execCommand(button.dataset.command); }
  });
  sheetOverlay.addEventListener('click', (event) => { if (event.target === sheetOverlay) closeSheet(); });
  photoInput.addEventListener('change', () => addFiles(photoInput.files,'photo'));
  videoInput.addEventListener('change', () => addFiles(videoInput.files,'video'));
  title.addEventListener('input', syncSubmit); body.addEventListener('input', syncSubmit);
  $('#blockStyle').addEventListener('change', (event) => insertBlock(event.target.value));
  $('#fontFamily').addEventListener('change', (event) => { body.focus(); document.execCommand('fontName',false,event.target.value === 'system' ? 'sans-serif' : event.target.value); });
  $('#fontSize').addEventListener('change', (event) => { body.focus(); document.execCommand('fontSize',false,Math.max(1,Math.min(7,Math.round(Number(event.target.value)/5)))); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeSheet(); });

  try {
    const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
    if (draft && !state.board) state.board = draft.board || '';
  } catch { /* ignore invalid local draft */ }
  if (state.board) setBoard(state.board);
  syncSubmit();
})();
