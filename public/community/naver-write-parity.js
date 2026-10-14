(() => {
  const boards = ['스티커 신청/인증','베르크 후원/기부','공식 행사','이벤트 & 체험단','블랙리스트','가입했어요','칭찬합니다','잡/못생긴사람게시판','자유게시판','자동차 이야기','바이크 이야기','질문과 답변'];
  const stickers = ['😀','😍','👏','🔥','🚗','🏍️','👍','🎉','❤️','😂','😎','🙏'];
  const topics = ['내차소개','시승기','정비후기','교통정보','자동차뉴스','바이크','질문','자유'];
  const draftKey = 'bbm.community.writeDraft.v2';
  const postKey = 'bbm.community.latestPost.v2';
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const title = qs('#postTitle');
  const body = qs('#postBody');
  const tags = qs('#postTags');
  const boardOverlay = qs('#boardOverlay');
  const boardList = qs('#boardList');
  const boardSearch = qs('#boardSearch');
  const selectedBoard = qs('#selectedBoard');
  const draftLayer = qs('#draftLayer');
  const draftContent = qs('#draftContent');
  const dialogOverlay = qs('#dialogOverlay');
  const dialogTitle = qs('#dialogTitle');
  const dialogMessage = qs('#dialogMessage');
  const toolOverlay = qs('#toolOverlay');
  const toolDialogTitle = qs('#toolDialogTitle');
  const toolDialogBody = qs('#toolDialogBody');
  const toolApply = qs('#toolApply');
  const attachmentList = qs('#attachmentList');
  const photoInput = qs('#photoInput');
  const fileInput = qs('#fileInput');
  const visibilityButton = qs('#visibilityButton');
  const toast = qs('#toast');
  const state = {
    board: '', draft: null, attachments: [], visibility: '멤버 공개',
    tool: '', selectedChoice: '', savedRange: null, toastTimer: 0,
  };

  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  const safeUrl = (value) => {
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
  };
  const formatBytes = (size) => size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))}KB` : `${(size / 1024 / 1024).toFixed(1)}MB`;

  function renderBoards(query = '') {
    const keyword = query.trim().toLowerCase();
    const filtered = boards.filter((name) => name.toLowerCase().includes(keyword));
    boardList.innerHTML = filtered.map((name) => `<li><label><span>${escapeHtml(name)}</span><input type="radio" name="board" value="${escapeHtml(name)}" ${state.board === name ? 'checked' : ''}><i aria-hidden="true"></i></label></li>`).join('') || '<li class="empty-board">검색 결과가 없습니다.</li>';
  }

  function hasBodyContent() {
    return Boolean(body.textContent.trim() || body.querySelector('img,.embed-card,.place-card,.topic-card,.sticker-chip') || state.attachments.length);
  }

  function syncSubmit() {
    const enabled = Boolean(state.board && title.value.trim() && hasBodyContent());
    qsa('[data-action="submit"]').forEach((button) => { button.disabled = !enabled; });
  }

  function showToast(message) {
    clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    state.toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2200);
  }

  function showDialog(titleText, message) {
    dialogTitle.textContent = titleText;
    dialogMessage.textContent = message;
    dialogOverlay.hidden = false;
  }

  function closeBoard() {
    boardOverlay.hidden = true;
    qs('[data-action="board"]').setAttribute('aria-expanded', 'false');
  }

  function captureRange() {
    const selection = window.getSelection();
    if (selection?.rangeCount && body.contains(selection.anchorNode)) state.savedRange = selection.getRangeAt(0).cloneRange();
  }

  function insertHtml(html) {
    body.focus();
    const selection = window.getSelection();
    let range = state.savedRange;
    if (!range || !body.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(body);
      range.collapse(false);
    }
    const fragment = range.createContextualFragment(html);
    const lastNode = fragment.lastChild;
    range.deleteContents();
    range.insertNode(fragment);
    if (lastNode && selection) {
      range.setStartAfter(lastNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    state.savedRange = null;
    body.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function snapshot() {
    return {
      title: title.value.trim() || '제목 없음', body: body.innerHTML, tags: tags.value,
      board: state.board, visibility: state.visibility,
      permissions: { search: qs('#allowSearch').checked, share: qs('#allowShare').checked, copy: qs('#allowCopy').checked },
      attachments: state.attachments.map(({ name, size, type }) => ({ name, size, type })),
      savedAt: new Date().toISOString(),
    };
  }

  function saveDraft() {
    if (!title.value.trim() && !hasBodyContent()) { showToast('저장할 내용이 없습니다.'); return; }
    state.draft = snapshot();
    try { localStorage.setItem(draftKey, JSON.stringify(state.draft)); }
    catch { showToast('이미지가 커서 임시저장하지 못했습니다.'); return; }
    qs('#draftCount').textContent = '1';
    showToast('이 브라우저에 임시 저장했습니다.');
  }

  function renderAttachments() {
    attachmentList.hidden = state.attachments.length === 0;
    attachmentList.innerHTML = state.attachments.map((file, index) => `<article class="attachment-item"><span class="attachment-icon">FILE</span><span class="attachment-meta"><strong>${escapeHtml(file.name)}</strong><small>${formatBytes(file.size)} · ${escapeHtml(file.type || '파일')}</small></span>${file.url ? `<a class="attachment-download" href="${file.url}" download="${escapeHtml(file.name)}">받기</a>` : ''}<button class="attachment-remove" type="button" data-action="remove-attachment" data-index="${index}" aria-label="${escapeHtml(file.name)} 삭제">×</button></article>`).join('');
    syncSubmit();
  }

  function restoreDraft() {
    if (!state.draft) return;
    title.value = state.draft.title === '제목 없음' ? '' : state.draft.title;
    body.innerHTML = state.draft.body || '';
    tags.value = state.draft.tags || '';
    state.board = state.draft.board || '';
    state.visibility = state.draft.visibility || '멤버 공개';
    visibilityButton.textContent = state.visibility;
    selectedBoard.textContent = state.board || '게시판을 선택해주세요.';
    const permissions = state.draft.permissions || {};
    qs('#allowSearch').checked = permissions.search !== false;
    qs('#allowShare').checked = permissions.share !== false;
    qs('#allowCopy').checked = permissions.copy !== false;
    state.attachments = (state.draft.attachments || []).map((file) => ({ ...file, url: '' }));
    renderAttachments();
    draftLayer.hidden = true;
    syncSubmit();
    showToast('임시글을 불러왔습니다.');
  }

  function openDrafts() {
    if (!state.draft) draftContent.innerHTML = '<p>임시글이 없습니다.</p>';
    else {
      const time = new Date(state.draft.savedAt).toLocaleString('ko-KR', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' });
      draftContent.innerHTML = `<article class="draft-card"><strong>${escapeHtml(state.draft.title)}</strong><small>${time}</small><div class="draft-tools"><button type="button" data-action="restore-draft" aria-label="수정"><img src="assets/write-parity/draft-edit.svg" alt=""></button><button type="button" data-action="delete-draft" aria-label="삭제"><img src="assets/write-parity/draft-delete.svg" alt=""></button></div></article>`;
    }
    draftLayer.hidden = false;
  }

  function closeTool() {
    toolOverlay.hidden = true;
    state.tool = '';
    state.selectedChoice = '';
  }

  function choiceButtons(items, className = '') {
    return `<div class="choice-grid ${className}">${items.map((item) => `<button class="choice-button" type="button" data-choice="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join('')}</div>`;
  }

  function openTool(type) {
    captureRange();
    state.tool = type;
    state.selectedChoice = '';
    const config = {
      video: ['동영상 추가', '<label class="dialog-field"><span>동영상 주소</span><input id="toolUrl" type="url" inputmode="url" placeholder="https://youtu.be/..." /></label><label class="dialog-field"><span>표시 제목</span><input id="toolText" maxlength="80" placeholder="동영상 제목" /></label><p class="upload-note">주소 카드로 본문에 삽입됩니다. 외부 영상은 자동 재생하지 않습니다.</p>'],
      link: ['링크 추가', '<label class="dialog-field"><span>주소</span><input id="toolUrl" type="url" inputmode="url" placeholder="https://example.com" /></label><label class="dialog-field"><span>링크 문구</span><input id="toolText" maxlength="80" placeholder="링크 이름" /></label>'],
      place: ['장소 추가', '<label class="dialog-field"><span>장소명</span><input id="toolText" maxlength="60" placeholder="예: 보배드림 본사" /></label><label class="dialog-field"><span>주소</span><input id="toolAddress" maxlength="120" placeholder="도로명 또는 지번 주소" /></label>'],
      sticker: ['스티커', choiceButtons(stickers, 'sticker-grid')],
      topic: ['글감 선택', choiceButtons(topics, 'topic-grid')],
      visibility: ['공개 범위', `<div class="visibility-list">${['전체 공개','멤버 공개','나만 보기'].map((item) => `<label class="visibility-option"><span>${item}</span><input type="radio" name="visibility" value="${item}" ${state.visibility === item ? 'checked' : ''}></label>`).join('')}</div>`],
    }[type];
    if (!config) return;
    toolDialogTitle.textContent = config[0];
    toolDialogBody.innerHTML = config[1];
    toolApply.textContent = type === 'visibility' ? '선택' : '추가';
    toolOverlay.hidden = false;
    window.setTimeout(() => qs('input:not([type="radio"])', toolDialogBody)?.focus(), 0);
  }

  function applyTool() {
    const type = state.tool;
    if (type === 'video' || type === 'link') {
      const url = safeUrl(qs('#toolUrl', toolDialogBody)?.value.trim());
      const text = qs('#toolText', toolDialogBody)?.value.trim() || (type === 'video' ? '동영상 보기' : url);
      if (!url) { showToast('http 또는 https 주소를 입력해주세요.'); return; }
      if (type === 'video') insertHtml(`<a class="embed-card" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><strong>▶ ${escapeHtml(text)}</strong><span>${escapeHtml(url)}</span></a><p><br></p>`);
      else insertHtml(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`);
    } else if (type === 'place') {
      const name = qs('#toolText', toolDialogBody)?.value.trim();
      const address = qs('#toolAddress', toolDialogBody)?.value.trim();
      if (!name || !address) { showToast('장소명과 주소를 입력해주세요.'); return; }
      insertHtml(`<div class="place-card" contenteditable="false"><strong>📍 ${escapeHtml(name)}</strong><span>${escapeHtml(address)}</span></div><p><br></p>`);
    } else if (type === 'sticker') {
      if (!state.selectedChoice) { showToast('스티커를 선택해주세요.'); return; }
      insertHtml(`<span class="sticker-chip" contenteditable="false">${escapeHtml(state.selectedChoice)}</span>&nbsp;`);
    } else if (type === 'topic') {
      if (!state.selectedChoice) { showToast('글감을 선택해주세요.'); return; }
      insertHtml(`<div class="topic-card" contenteditable="false"><strong>#${escapeHtml(state.selectedChoice)}</strong><span>선택한 글감</span></div><p><br></p>`);
      const current = tags.value.split('#').map((item) => item.trim()).filter(Boolean);
      if (!current.includes(state.selectedChoice) && current.length < 10) tags.value = `#${[...current, state.selectedChoice].join('#')}`;
    } else if (type === 'visibility') {
      const checked = qs('input[name="visibility"]:checked', toolDialogBody);
      state.visibility = checked?.value || state.visibility;
      visibilityButton.textContent = state.visibility;
      showToast(`${state.visibility}로 설정했습니다.`);
    }
    closeTool();
  }

  async function addPhotos(files) {
    const selected = [...files].slice(0, 10);
    for (const file of selected) {
      if (!file.type.startsWith('image/')) { showToast(`${file.name}: 이미지 파일이 아닙니다.`); continue; }
      if (file.size > 10 * 1024 * 1024) { showToast(`${file.name}: 10MB를 초과했습니다.`); continue; }
      const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      insertHtml(`<figure class="editor-media" contenteditable="false"><img src="${dataUrl}" alt="${escapeHtml(file.name)}"><figcaption><span>${escapeHtml(file.name)}</span><button class="editor-remove" type="button" data-action="remove-media">삭제</button></figcaption></figure><p><br></p>`);
    }
    photoInput.value = '';
    if (selected.length) showToast(`${selected.length}개 이미지를 첨부했습니다.`);
  }

  function addFiles(files) {
    const room = Math.max(0, 10 - state.attachments.length);
    const selected = [...files].slice(0, room);
    selected.forEach((file) => {
      if (file.size > 20 * 1024 * 1024) { showToast(`${file.name}: 20MB를 초과했습니다.`); return; }
      state.attachments.push({ name:file.name, size:file.size, type:file.type, url:URL.createObjectURL(file) });
    });
    fileInput.value = '';
    renderAttachments();
    if (selected.length) showToast(`${selected.length}개 파일을 첨부했습니다.`);
  }

  function submitPost() {
    if (!state.board) { showToast('게시판을 선택해주세요.'); return; }
    if (!title.value.trim()) { showToast('제목을 입력해주세요.'); return; }
    if (!hasBodyContent()) { showToast('내용이나 첨부 파일을 추가해주세요.'); return; }
    const post = { ...snapshot(), status:'LOCAL_PREVIEW', submittedAt:new Date().toISOString() };
    try { localStorage.setItem(postKey, JSON.stringify(post)); }
    catch { showToast('게시물이 커서 브라우저에 저장하지 못했습니다.'); return; }
    showDialog('게시물 등록 완료', '테스트 게시물이 이 브라우저에 저장되었습니다. 실제 운영 서버에는 전송되지 않았습니다.');
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    const action = button?.dataset.action;
    if (button?.dataset.tool) openTool(button.dataset.tool);
    if (button?.dataset.choice) {
      state.selectedChoice = button.dataset.choice;
      qsa('[data-choice]', toolDialogBody).forEach((item) => item.classList.toggle('is-selected', item === button));
    }
    if (action === 'board') { renderBoards(); boardOverlay.hidden = false; button.setAttribute('aria-expanded', 'true'); window.setTimeout(() => boardSearch.focus(), 0); }
    if (action === 'close-board') closeBoard();
    if (action === 'close-tool') closeTool();
    if (action === 'text-tools') { const bar = qs('.text-toolbar'); bar.hidden = !bar.hidden; button.setAttribute('aria-expanded', String(!bar.hidden)); }
    if (action === 'add-photo') photoInput.click();
    if (action === 'add-file') fileInput.click();
    if (action === 'quote') { body.focus(); document.execCommand('formatBlock', false, 'blockquote'); }
    if (action === 'divider') { body.focus(); document.execCommand('insertHorizontalRule'); body.dispatchEvent(new Event('input', { bubbles:true })); }
    if (action === 'add-body') body.focus();
    if (action === 'remove-media') { button.closest('.editor-media')?.remove(); syncSubmit(); }
    if (action === 'remove-attachment') { const index = Number(button.dataset.index); const [removed] = state.attachments.splice(index, 1); if (removed?.url) URL.revokeObjectURL(removed.url); renderAttachments(); }
    if (action === 'save-draft') saveDraft();
    if (action === 'drafts') openDrafts();
    if (action === 'close-drafts') draftLayer.hidden = true;
    if (action === 'restore-draft') restoreDraft();
    if (action === 'delete-draft') { state.draft = null; localStorage.removeItem(draftKey); qs('#draftCount').textContent = '0'; draftContent.innerHTML = '<p>임시글이 없습니다.</p>'; }
    if (action === 'close-dialog') dialogOverlay.hidden = true;
    if (action === 'top') window.scrollTo({ top:0, behavior:'smooth' });
    if (action === 'exit') showDialog('글쓰기 종료', '작성 중인 내용을 임시 저장하거나 페이지를 닫을 수 있습니다. 테스트 화면은 현재 내용을 유지합니다.');
    if (action === 'submit') submitPost();
    const command = button?.dataset.command;
    if (command && ['bold','italic','underline','strikeThrough'].includes(command)) { body.focus(); document.execCommand(command); button.classList.toggle('is-active'); }
  });

  toolApply.addEventListener('click', applyTool);
  photoInput.addEventListener('change', () => addPhotos(photoInput.files).catch(() => showToast('이미지를 읽지 못했습니다.')));
  fileInput.addEventListener('change', () => addFiles(fileInput.files));
  boardList.addEventListener('change', (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    state.board = event.target.value;
    selectedBoard.textContent = state.board;
    closeBoard();
    syncSubmit();
  });
  boardSearch.addEventListener('input', () => renderBoards(boardSearch.value));
  [title, body].forEach((element) => element.addEventListener('input', syncSubmit));
  tags.addEventListener('input', () => {
    const tokens = tags.value.split('#').map((item) => item.trim()).filter(Boolean);
    if (tokens.length > 10) { tags.value = `#${tokens.slice(0, 10).join('#')}`; showToast('태그는 최대 10개까지 입력할 수 있습니다.'); }
  });
  qs('#blockStyle').addEventListener('change', (event) => { body.focus(); document.execCommand('formatBlock', false, event.target.value); });
  qs('#fontFamily').addEventListener('change', (event) => { body.focus(); document.execCommand('fontName', false, event.target.value); });
  qs('#fontSize').addEventListener('change', (event) => { body.focus(); document.execCommand('fontSize', false, event.target.value); });
  qs('#foreColor').addEventListener('input', (event) => { body.focus(); document.execCommand('foreColor', false, event.target.value); event.target.parentElement.style.setProperty('--selected-color', event.target.value); });
  qs('#backColor').addEventListener('input', (event) => { body.focus(); document.execCommand('hiliteColor', false, event.target.value); event.target.parentElement.style.setProperty('--selected-color', event.target.value); });
  [boardOverlay, dialogOverlay, toolOverlay].forEach((overlay) => overlay.addEventListener('click', (event) => {
    if (event.target !== overlay) return;
    if (overlay === boardOverlay) closeBoard();
    else if (overlay === toolOverlay) closeTool();
    else dialogOverlay.hidden = true;
  }));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeBoard(); closeTool(); dialogOverlay.hidden = true; draftLayer.hidden = true; } });

  try {
    const savedDraft = JSON.parse(localStorage.getItem(draftKey));
    if (savedDraft) { state.draft = savedDraft; qs('#draftCount').textContent = '1'; }
  } catch { localStorage.removeItem(draftKey); }
  renderBoards();
  renderAttachments();
})();
