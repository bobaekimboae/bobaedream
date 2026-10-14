(() => {
  const boards = ['스티커 신청/인증','베르크 후원/기부','공식 행사','이벤트 & 체험단','블랙리스트','가입했어요','칭찬합니다','잡/못생긴사람게시판','자유게시판','자동차 이야기','바이크 이야기','질문과 답변'];
  const stickers = ['😀','😍','👏','🔥','🚗','🏍️','👍','🎉','❤️','😂','😎','🙏'];
  const topics = ['내차소개','시승기','정비후기','교통정보','자동차뉴스','바이크','질문','자유'];
  const draftKey = 'bbm.community.writeDraft.v2';
  const postKey = 'bbm.community.latestPost.v2';
  const MAX_PHOTOS = 100;
  const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
  const MAX_FILES = 10;
  const MAX_FILE_BYTES = 50 * 1024 * 1024;
  const PHOTO_EXTENSIONS = new Set(['jpg','jpeg','gif','png','bmp','heic','heif','webp']);
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
  const replacePhotoInput = qs('#replacePhotoInput');
  const fileInput = qs('#fileInput');
  const uploadStatus = qs('#uploadStatus');
  const photoEditorOverlay = qs('#photoEditorOverlay');
  const photoEditorPreview = qs('#photoEditorPreview');
  const visibilityButton = qs('#visibilityButton');
  const toast = qs('#toast');
  const state = {
    board: '', draft: null, attachments: [], visibility: '멤버 공개',
    tool: '', selectedChoice: '', savedRange: null, toastTimer: 0,
    photos: new Map(), activePhotoId: '', replacePhotoId: '', dragPhotoId: '',
    editPhotoId: '', editDraft: null,
  };

  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  const safeUrl = (value) => {
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
  };
  const formatBytes = (size) => size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))}KB` : `${(size / 1024 / 1024).toFixed(1)}MB`;
  const uid = () => `photo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const fileExtension = (name = '') => name.split('.').pop().toLowerCase();
  const isPhotoFile = (file) => PHOTO_EXTENSIONS.has(fileExtension(file.name)) || /^image\/(jpeg|png|gif|bmp|webp|heic|heif)$/i.test(file.type);
  const photoCount = () => body.querySelectorAll('.editor-media[data-media-id]').length;
  const photoFilter = (value) => ({ none:'none', auto:'contrast(1.05) saturate(1.08)', mono:'grayscale(1)', warm:'sepia(.18) saturate(1.12)' }[value] || 'none');

  function photoMarkup(photo) {
    return `<figure class="editor-media is-${photo.widthMode}" data-media-id="${photo.id}" data-align="${photo.align}" draggable="true" contenteditable="false">
      <div class="media-quick-toolbar" role="toolbar" aria-label="${escapeHtml(photo.name)} 사진 편집">
        <button type="button" data-action="set-cover" aria-pressed="${photo.cover}">${photo.cover ? '대표 사진' : '대표'}</button>
        <button type="button" data-action="photo-width" data-width="small">작게</button>
        <button type="button" data-action="photo-width" data-width="document">문서 너비</button>
        <button type="button" data-action="photo-width" data-width="full">옆트임</button>
        <button type="button" data-action="photo-align" data-align="left" aria-label="왼쪽 정렬">왼쪽</button>
        <button type="button" data-action="photo-align" data-align="center" aria-label="가운데 정렬">가운데</button>
        <button type="button" data-action="photo-align" data-align="right" aria-label="오른쪽 정렬">오른쪽</button>
        <button type="button" data-action="photo-link">링크</button>
        <button type="button" data-action="edit-photo">편집</button>
        <button type="button" data-action="replace-photo">교체</button>
        <button type="button" data-action="remove-media">삭제</button>
      </div>
      <div class="editor-media-frame" style="aspect-ratio:${photo.ratio === 'auto' ? 'auto' : photo.ratio}">
        <span class="cover-badge" ${photo.cover ? '' : 'hidden'}>대표</span>
        <img src="${photo.url}" alt="${escapeHtml(photo.name)}" style="transform:rotate(${photo.rotation}deg) scaleX(${photo.flip ? -1 : 1});filter:${photoFilter(photo.filter)}">
        <span class="media-drag-handle" aria-hidden="true">⋮⋮</span>
      </div>
      <figcaption><span class="photo-caption" contenteditable="true" role="textbox" data-placeholder="사진 설명을 입력하세요" aria-label="사진 설명">${escapeHtml(photo.caption)}</span><small>${escapeHtml(photo.name)} · ${formatBytes(photo.size)}</small></figcaption>
    </figure><p class="after-media"><br></p>`;
  }

  function getPhotoFigure(target) { return target?.closest?.('.editor-media[data-media-id]'); }

  function getPhoto(id) { return state.photos.get(id); }

  function syncPhotoElement(id) {
    const photo = getPhoto(id);
    const figure = body.querySelector(`.editor-media[data-media-id="${CSS.escape(id)}"]`);
    if (!photo || !figure) return;
    figure.className = `editor-media is-${photo.widthMode}${state.activePhotoId === id ? ' is-selected' : ''}`;
    figure.dataset.align = photo.align;
    const image = qs('img', figure);
    delete image.dataset.fallback;
    image.src = photo.url;
    image.alt = photo.name;
    image.style.transform = `rotate(${photo.rotation}deg) scaleX(${photo.flip ? -1 : 1})`;
    image.style.filter = photoFilter(photo.filter);
    qs('.editor-media-frame', figure).style.aspectRatio = photo.ratio === 'auto' ? 'auto' : photo.ratio;
    const cover = qs('.cover-badge', figure);
    cover.hidden = !photo.cover;
    const coverButton = qs('[data-action="set-cover"]', figure);
    coverButton.setAttribute('aria-pressed', String(photo.cover));
    coverButton.textContent = photo.cover ? '대표 사진' : '대표';
    const caption = qs('.photo-caption', figure);
    if (caption && caption.textContent !== photo.caption) caption.textContent = photo.caption;
  }

  function selectPhoto(id) {
    state.activePhotoId = id;
    qsa('.editor-media[data-media-id]', body).forEach((figure) => figure.classList.toggle('is-selected', figure.dataset.mediaId === id));
  }

  function openMediaDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('bbm-community-write-media', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('photos', { keyPath:'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function storePhotoBlob(id, blob) {
    const db = await openMediaDb();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('photos', 'readwrite');
      transaction.objectStore('photos').put({ id, blob });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  }

  async function readPhotoBlob(id) {
    const db = await openMediaDb();
    const result = await new Promise((resolve, reject) => {
      const request = db.transaction('photos').objectStore('photos').get(id);
      request.onsuccess = () => resolve(request.result?.blob || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return result;
  }

  async function deletePhotoBlob(id) {
    const db = await openMediaDb();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('photos', 'readwrite');
      transaction.objectStore('photos').delete(id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  }

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
    const rangeElement = range?.commonAncestorContainer?.nodeType === Node.ELEMENT_NODE ? range.commonAncestorContainer : range?.commonAncestorContainer?.parentElement;
    if (!range || !body.contains(range.commonAncestorContainer) || rangeElement?.closest('[contenteditable="false"]')) {
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
    const bodyClone = body.cloneNode(true);
    qsa('.editor-media[data-media-id] img', bodyClone).forEach((image) => image.removeAttribute('src'));
    qsa('.editor-media', bodyClone).forEach((figure) => figure.classList.remove('is-selected'));
    return {
      title: title.value.trim() || '제목 없음', body: bodyClone.innerHTML, tags: tags.value,
      board: state.board, visibility: state.visibility,
      permissions: { search: qs('#allowSearch').checked, share: qs('#allowShare').checked, copy: qs('#allowCopy').checked },
      attachments: state.attachments.map(({ name, size, type }) => ({ name, size, type })),
      photos: [...state.photos.values()].map(({ url, ...photo }) => photo),
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

  async function restoreDraft() {
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
    state.photos.forEach((photo) => { if (photo.url) URL.revokeObjectURL(photo.url); });
    state.photos.clear();
    let missingPhotos = 0;
    for (const saved of state.draft.photos || []) {
      const blob = await readPhotoBlob(saved.id).catch(() => null);
      if (!blob) { body.querySelector(`.editor-media[data-media-id="${CSS.escape(saved.id)}"]`)?.remove(); missingPhotos += 1; continue; }
      state.photos.set(saved.id, { ...saved, url:URL.createObjectURL(blob) });
      syncPhotoElement(saved.id);
      const restoredCaption = body.querySelector(`.editor-media[data-media-id="${CSS.escape(saved.id)}"] .photo-caption`);
      if (restoredCaption) restoredCaption.textContent = saved.caption || '';
    }
    (state.draft.photos || []).forEach((saved) => {
      const restoredCaption = body.querySelector(`.editor-media[data-media-id="${CSS.escape(saved.id)}"] .photo-caption`);
      if (restoredCaption) restoredCaption.textContent = saved.caption || '';
    });
    renderAttachments();
    draftLayer.hidden = true;
    syncSubmit();
    showToast(missingPhotos ? `임시글을 불러왔습니다. 사진 ${missingPhotos}장은 다시 첨부해주세요.` : '임시글을 불러왔습니다.');
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
    if (!['photo-link','visibility'].includes(type)) captureRange();
    else state.savedRange = null;
    state.tool = type;
    state.selectedChoice = '';
    const config = {
      video: ['동영상 추가', '<label class="dialog-field"><span>동영상 주소</span><input id="toolUrl" type="url" inputmode="url" placeholder="https://youtu.be/..." /></label><label class="dialog-field"><span>표시 제목</span><input id="toolText" maxlength="80" placeholder="동영상 제목" /></label><p class="upload-note">주소 카드로 본문에 삽입됩니다. 외부 영상은 자동 재생하지 않습니다.</p>'],
      link: ['링크 추가', '<label class="dialog-field"><span>주소</span><input id="toolUrl" type="url" inputmode="url" placeholder="https://example.com" /></label><label class="dialog-field"><span>링크 문구</span><input id="toolText" maxlength="80" placeholder="링크 이름" /></label>'],
      place: ['장소 추가', '<label class="dialog-field"><span>장소명</span><input id="toolText" maxlength="60" placeholder="예: 보배드림 본사" /></label><label class="dialog-field"><span>주소</span><input id="toolAddress" maxlength="120" placeholder="도로명 또는 지번 주소" /></label>'],
      sticker: ['스티커', choiceButtons(stickers, 'sticker-grid')],
      topic: ['글감 선택', choiceButtons(topics, 'topic-grid')],
      visibility: ['공개 범위', `<div class="visibility-list">${['전체 공개','멤버 공개','나만 보기'].map((item) => `<label class="visibility-option"><span>${item}</span><input type="radio" name="visibility" value="${item}" ${state.visibility === item ? 'checked' : ''}></label>`).join('')}</div>`],
      'photo-link': ['사진 링크', `<label class="dialog-field"><span>연결 주소</span><input id="toolUrl" type="url" inputmode="url" value="${escapeHtml(getPhoto(state.activePhotoId)?.link || '')}" placeholder="https://example.com" /></label><p class="upload-note">주소를 비우고 적용하면 링크가 해제됩니다.</p>`],
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
    } else if (type === 'photo-link') {
      const raw = qs('#toolUrl', toolDialogBody)?.value.trim() || '';
      const url = raw ? safeUrl(raw) : '';
      if (raw && !url) { showToast('http 또는 https 주소를 입력해주세요.'); return; }
      const photo = getPhoto(state.activePhotoId);
      if (photo) { photo.link = url; syncPhotoElement(photo.id); showToast(url ? '사진 링크를 연결했습니다.' : '사진 링크를 해제했습니다.'); }
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

  function previewPhotoEdit() {
    if (!state.editDraft) return;
    photoEditorPreview.style.transform = `rotate(${state.editDraft.rotation}deg) scaleX(${state.editDraft.flip ? -1 : 1})`;
    photoEditorPreview.style.filter = photoFilter(state.editDraft.filter);
    photoEditorPreview.parentElement.style.aspectRatio = state.editDraft.ratio === 'auto' ? 'auto' : state.editDraft.ratio;
    qsa('[data-edit-ratio]', photoEditorOverlay).forEach((button) => button.classList.toggle('is-selected', button.dataset.editRatio === state.editDraft.ratio));
    qsa('[data-edit-filter]', photoEditorOverlay).forEach((button) => button.classList.toggle('is-selected', button.dataset.editFilter === state.editDraft.filter));
  }

  function openPhotoEditor(id) {
    const photo = getPhoto(id);
    if (!photo) return;
    state.editPhotoId = id;
    state.editDraft = { rotation:photo.rotation, flip:photo.flip, ratio:photo.ratio, filter:photo.filter };
    photoEditorPreview.src = photo.url;
    photoEditorPreview.alt = photo.name;
    photoEditorOverlay.hidden = false;
    previewPhotoEdit();
  }

  function closePhotoEditor() {
    photoEditorOverlay.hidden = true;
    state.editPhotoId = '';
    state.editDraft = null;
  }

  function applyPhotoEditor() {
    const photo = getPhoto(state.editPhotoId);
    if (photo && state.editDraft) Object.assign(photo, state.editDraft);
    if (photo) syncPhotoElement(photo.id);
    closePhotoEditor();
    showToast('사진 편집을 적용했습니다.');
  }

  async function replacePhoto(file) {
    const id = state.replacePhotoId;
    state.replacePhotoId = '';
    if (!id || !file) return;
    if (!isPhotoFile(file)) { showDialog('교체 실패', '지원하지 않는 이미지 형식입니다.'); return; }
    if (file.size > MAX_PHOTO_BYTES) { showDialog('교체 실패', '사진 1장은 20MB까지 첨부할 수 있습니다.'); return; }
    await addPhotoFile(file, id);
    replacePhotoInput.value = '';
    showToast('사진을 교체했습니다.');
  }

  function removePhoto(id) {
    const photo = getPhoto(id);
    const figure = body.querySelector(`.editor-media[data-media-id="${CSS.escape(id)}"]`);
    const after = figure?.nextElementSibling;
    if (photo?.url) URL.revokeObjectURL(photo.url);
    state.photos.delete(id);
    deletePhotoBlob(id).catch(() => {});
    figure?.remove();
    if (after?.classList.contains('after-media')) after.remove();
    if (photo?.cover) {
      const next = state.photos.values().next().value;
      if (next) { next.cover = true; syncPhotoElement(next.id); }
    }
    state.activePhotoId = '';
    syncSubmit();
  }

  async function addPhotoFile(file, replaceId = '') {
    const id = replaceId || uid();
    const previous = replaceId ? getPhoto(replaceId) : null;
    const url = URL.createObjectURL(file);
    const photo = {
      id, name:file.name, size:file.size, type:file.type, url,
      caption:previous?.caption || '', cover:previous?.cover || photoCount() === 0,
      widthMode:previous?.widthMode || 'document', align:previous?.align || 'center',
      link:previous?.link || '', rotation:previous?.rotation || 0, flip:previous?.flip || false,
      ratio:previous?.ratio || 'auto', filter:previous?.filter || 'none',
    };
    if (previous?.url) URL.revokeObjectURL(previous.url);
    state.photos.set(id, photo);
    await storePhotoBlob(id, file);
    if (replaceId) syncPhotoElement(id);
    else insertHtml(photoMarkup(photo));
    return photo;
  }

  async function addPhotos(files, source = 'picker') {
    const incoming = [...files];
    const room = Math.max(0, MAX_PHOTOS - photoCount());
    const selected = incoming.slice(0, room);
    const errors = [];
    let added = 0;
    if (!room && incoming.length) errors.push(`사진은 게시글당 최대 ${MAX_PHOTOS}장입니다.`);
    if (incoming.length > room) errors.push(`한도를 넘은 ${incoming.length - room}장은 제외했습니다.`);
    uploadStatus.hidden = false;
    uploadStatus.textContent = `사진 ${selected.length}장을 확인하고 있습니다.`;
    for (const file of selected) {
      if (!isPhotoFile(file)) { errors.push(`${file.name}: 지원하지 않는 형식`); continue; }
      if (file.size > MAX_PHOTO_BYTES) { errors.push(`${file.name}: 20MB 초과`); continue; }
      try { await addPhotoFile(file); added += 1; }
      catch { errors.push(`${file.name}: 읽기 실패`); }
    }
    photoInput.value = '';
    uploadStatus.hidden = true;
    if (added) showToast(`${source === 'drop' ? '끌어온' : source === 'paste' ? '붙여넣은' : '선택한'} 사진 ${added}장을 첨부했습니다.`);
    if (errors.length) showDialog('첨부하지 못한 사진', errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n외 ${errors.length - 5}건` : ''));
    syncSubmit();
  }

  function addFiles(files) {
    const room = Math.max(0, MAX_FILES - state.attachments.length);
    const selected = [...files].slice(0, room);
    selected.forEach((file) => {
      if (file.size > MAX_FILE_BYTES) { showToast(`${file.name}: 50MB를 초과했습니다.`); return; }
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
    const figure = getPhotoFigure(event.target);
    if (figure) selectPhoto(figure.dataset.mediaId);
    else if (!event.target.closest('.tool-dialog,.photo-editor')) selectPhoto('');
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
    if (action === 'set-cover' && figure) {
      state.photos.forEach((photo) => { photo.cover = photo.id === figure.dataset.mediaId; syncPhotoElement(photo.id); });
      showToast('대표 사진으로 설정했습니다.');
    }
    if (action === 'photo-width' && figure) { const photo = getPhoto(figure.dataset.mediaId); if (photo) { photo.widthMode = button.dataset.width; syncPhotoElement(photo.id); } }
    if (action === 'photo-align' && figure) { const photo = getPhoto(figure.dataset.mediaId); if (photo) { photo.align = button.dataset.align; syncPhotoElement(photo.id); } }
    if (action === 'photo-link' && figure) openTool('photo-link');
    if (action === 'edit-photo' && figure) openPhotoEditor(figure.dataset.mediaId);
    if (action === 'replace-photo' && figure) { state.replacePhotoId = figure.dataset.mediaId; replacePhotoInput.click(); }
    if (action === 'remove-media' && figure) removePhoto(figure.dataset.mediaId);
    if (action === 'remove-attachment') { const index = Number(button.dataset.index); const [removed] = state.attachments.splice(index, 1); if (removed?.url) URL.revokeObjectURL(removed.url); renderAttachments(); }
    if (action === 'save-draft') saveDraft();
    if (action === 'drafts') openDrafts();
    if (action === 'close-drafts') draftLayer.hidden = true;
    if (action === 'restore-draft') restoreDraft();
    if (action === 'delete-draft') {
      (state.draft?.photos || []).forEach((photo) => deletePhotoBlob(photo.id).catch(() => {}));
      state.draft = null; localStorage.removeItem(draftKey); qs('#draftCount').textContent = '0'; draftContent.innerHTML = '<p>임시글이 없습니다.</p>';
      showToast('임시글을 삭제했습니다.');
    }
    if (action === 'close-dialog') dialogOverlay.hidden = true;
    if (action === 'close-photo-editor') closePhotoEditor();
    if (action === 'apply-photo-editor') applyPhotoEditor();
    if (action === 'top') window.scrollTo({ top:0, behavior:'smooth' });
    if (action === 'exit') showDialog('글쓰기 종료', '작성 중인 내용을 임시 저장하거나 페이지를 닫을 수 있습니다. 테스트 화면은 현재 내용을 유지합니다.');
    if (action === 'submit') submitPost();
    if (button?.dataset.editCommand && state.editDraft) {
      if (button.dataset.editCommand === 'rotate-left') state.editDraft.rotation = (state.editDraft.rotation - 90 + 360) % 360;
      if (button.dataset.editCommand === 'rotate-right') state.editDraft.rotation = (state.editDraft.rotation + 90) % 360;
      if (button.dataset.editCommand === 'flip') state.editDraft.flip = !state.editDraft.flip;
      previewPhotoEdit();
    }
    if (button?.dataset.editRatio && state.editDraft) { state.editDraft.ratio = button.dataset.editRatio; previewPhotoEdit(); }
    if (button?.dataset.editFilter && state.editDraft) { state.editDraft.filter = button.dataset.editFilter; previewPhotoEdit(); }
    const command = button?.dataset.command;
    if (command && ['bold','italic','underline','strikeThrough'].includes(command)) { body.focus(); document.execCommand(command); button.classList.toggle('is-active'); }
  });

  toolApply.addEventListener('click', applyTool);
  photoInput.addEventListener('change', () => addPhotos(photoInput.files).catch(() => showToast('이미지를 읽지 못했습니다.')));
  replacePhotoInput.addEventListener('change', () => replacePhoto(replacePhotoInput.files[0]).catch(() => showDialog('교체 실패', '이미지를 읽지 못했습니다.')));
  fileInput.addEventListener('change', () => addFiles(fileInput.files));
  body.addEventListener('input', (event) => {
    if (event.target.classList?.contains('photo-caption')) {
      const figure = getPhotoFigure(event.target);
      const photo = figure && getPhoto(figure.dataset.mediaId);
      if (photo) photo.caption = event.target.textContent.slice(0, 200);
    }
    syncSubmit();
  });
  body.addEventListener('dragstart', (event) => {
    const figure = getPhotoFigure(event.target);
    if (!figure) return;
    state.dragPhotoId = figure.dataset.mediaId;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', state.dragPhotoId);
    figure.classList.add('is-dragging');
  });
  body.addEventListener('dragend', () => { qsa('.is-dragging', body).forEach((item) => item.classList.remove('is-dragging')); state.dragPhotoId = ''; });
  body.addEventListener('dragover', (event) => {
    if (state.dragPhotoId || [...(event.dataTransfer?.items || [])].some((item) => item.kind === 'file')) {
      event.preventDefault(); event.dataTransfer.dropEffect = state.dragPhotoId ? 'move' : 'copy'; body.classList.add('is-drop-target');
    }
  });
  body.addEventListener('dragleave', (event) => { if (!body.contains(event.relatedTarget)) body.classList.remove('is-drop-target'); });
  body.addEventListener('drop', (event) => {
    event.preventDefault(); body.classList.remove('is-drop-target');
    if (state.dragPhotoId) {
      const moving = body.querySelector(`.editor-media[data-media-id="${CSS.escape(state.dragPhotoId)}"]`);
      const target = getPhotoFigure(event.target);
      if (moving && target && moving !== target) {
        const movingSpacer = moving.nextElementSibling?.classList.contains('after-media') ? moving.nextElementSibling : null;
        const movingBlock = document.createDocumentFragment();
        movingBlock.append(moving);
        if (movingSpacer) movingBlock.append(movingSpacer);
        const afterTarget = target.nextElementSibling?.classList.contains('after-media') ? target.nextElementSibling : target;
        const targetRect = target.getBoundingClientRect();
        if (event.clientY < targetRect.top + targetRect.height / 2) target.before(movingBlock);
        else afterTarget.after(movingBlock);
        showToast('사진 순서를 변경했습니다.');
      }
      state.dragPhotoId = '';
      return;
    }
    const imageFiles = [...(event.dataTransfer?.files || [])].filter(isPhotoFile);
    if (imageFiles.length) addPhotos(imageFiles, 'drop');
    else showToast('지원하는 이미지 파일을 끌어다 놓아주세요.');
  });
  body.addEventListener('paste', (event) => {
    const imageFiles = [...(event.clipboardData?.items || [])].filter((item) => item.kind === 'file' && item.type.startsWith('image/')).map((item) => item.getAsFile()).filter(Boolean);
    if (!imageFiles.length) return;
    event.preventDefault();
    addPhotos(imageFiles, 'paste');
  });
  body.addEventListener('error', (event) => {
    const image = event.target;
    const figure = image instanceof HTMLImageElement ? getPhotoFigure(image) : null;
    if (!figure || image.dataset.fallback === 'true') return;
    image.dataset.fallback = 'true';
    image.src = 'assets/write-parity/photo.svg';
    image.alt = `${getPhoto(figure.dataset.mediaId)?.name || '사진'} 미리보기를 이 브라우저에서 표시할 수 없습니다.`;
    figure.classList.add('has-preview-fallback');
    showToast('원본은 유지되지만 이 브라우저에서 미리보기를 표시할 수 없는 형식입니다.');
  }, true);
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
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { closeBoard(); closeTool(); closePhotoEditor(); dialogOverlay.hidden = true; draftLayer.hidden = true; }
    if ((event.key === 'Backspace' || event.key === 'Delete') && state.activePhotoId && !event.target.matches('input,textarea,[contenteditable="true"]')) {
      event.preventDefault(); removePhoto(state.activePhotoId); showToast('사진을 삭제했습니다.');
    }
  });
  photoEditorOverlay.addEventListener('click', (event) => { if (event.target === photoEditorOverlay) closePhotoEditor(); });

  try {
    const savedDraft = JSON.parse(localStorage.getItem(draftKey));
    if (savedDraft) { state.draft = savedDraft; qs('#draftCount').textContent = '1'; }
  } catch { localStorage.removeItem(draftKey); }
  renderBoards();
  renderAttachments();
})();
