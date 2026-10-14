(() => {
  const boards = [
    { name:'자유게시판', heads:['자유','질문','정보','후기'] },
    { name:'국산차 오너톡', heads:['현대','기아','제네시스','KG모빌리티','르노코리아','쉐보레'] },
    { name:'수입차 라운지', heads:['BMW','벤츠','아우디','폭스바겐','포르쉐','기타 수입차'] },
    { name:'전기차', heads:['구매','충전','보조금','정비'] },
    { name:'정비 · DIY', heads:['정비','DIY','용품','질문'] },
    { name:'튜닝', heads:['외장','내장','성능','휠 · 타이어'] },
    { name:'중고차', heads:['구매 상담','판매 상담','시세','거래 후기'] },
    { name:'보험 · 사고', heads:['보험','사고 상담','과실','보상'] },
    { name:'블랙박스 제보', heads:['제보','사고 영상','위반 차량','교통 안전'] },
    { name:'바이크', heads:['입문','기종','정비','투어','용품'] },
  ];
  const entryParams = new URLSearchParams(location.search);
  const requestedBoard = entryParams.get('board') || '';
  const requestedReturn = entryParams.get('returnTo') || '';
  const entrySource = entryParams.get('source') || '';
  const returnTo = (() => {
    if (!requestedReturn) return '';
    try {
      const url = new URL(requestedReturn, location.href);
      if (url.origin !== location.origin || !url.pathname.endsWith('/community/naver-cafe-list.html')) return '';
      return `${url.pathname}${url.search}${url.hash}`;
    } catch { return ''; }
  })();
  const topics = ['내차소개','시승기','정비후기','교통정보','자동차뉴스','바이크','질문','자유'];
  const draftKey = 'bbm.community.writeDraft.v2';
  const postKey = 'bbm.community.latestPost.v2';
  const emojiRecentKey = 'bbm.community.recentEmojis.v1';
  const emojiDataUrl = './data/emoji-v17.json';
  const emojiCategories = [
    { key:'recent', label:'최근', icon:'🕘', search:'최근 사용' },
    { key:'face-emotion', label:'표정', icon:'😀', search:'표정 얼굴 웃음 감정 하트 미소' },
    { key:'person-people', label:'사람', icon:'👋', search:'사람 인물 손 몸 직업 가족' },
    { key:'animals-nature', label:'동물·자연', icon:'🐻', search:'동물 자연 식물 날씨 꽃' },
    { key:'food-drink', label:'음식·음료', icon:'🍔', search:'음식 음료 과일 요리 식사' },
    { key:'travel-places', label:'여행·장소', icon:'🚗', search:'여행 장소 자동차 차 바이크 교통 건물 지도' },
    { key:'activities-events', label:'활동', icon:'⚽', search:'활동 운동 스포츠 행사 축하 게임' },
    { key:'objects', label:'사물', icon:'💡', search:'사물 물건 도구 전자기기' },
    { key:'symbols', label:'기호', icon:'❤️', search:'기호 하트 화살표 숫자 표시' },
    { key:'flags', label:'국기', icon:'🏁', search:'국기 깃발 나라 국가' },
  ];
  const MAX_PHOTOS = 100;
  const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
  const MAX_VIDEOS = 10;
  const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
  const MAX_FILES = 10;
  const MAX_FILE_BYTES = 50 * 1024 * 1024;
  const PHOTO_EXTENSIONS = new Set(['jpg','jpeg','gif','png','bmp','heic','heif','webp']);
  const VIDEO_EXTENSIONS = new Set(['mp4','webm','mov','m4v','ogv']);
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const title = qs('#postTitle');
  const body = qs('#postBody');
  const tags = qs('#postTags');
  const boardOverlay = qs('#boardOverlay');
  const boardList = qs('#boardList');
  const boardSearch = qs('#boardSearch');
  const selectedBoard = qs('#selectedBoard');
  const headSelect = qs('.head-select');
  const selectedHead = qs('#selectedHead');
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
  const videoInput = qs('#videoInput');
  const replaceVideoInput = qs('#replaceVideoInput');
  const fileInput = qs('#fileInput');
  const uploadStatus = qs('#uploadStatus');
  const photoEditorOverlay = qs('#photoEditorOverlay');
  const photoEditorPreview = qs('#photoEditorPreview');
  const visibilityButton = qs('#visibilityButton');
  const toast = qs('#toast');
  const state = {
    board: '', head: '', selectionMode: 'board', draft: null, attachments: [], visibility: '멤버 공개',
    entrySource, returnTo, postSubmitted:false,
    tool: '', selectedChoice: '', savedRange: null, formatRange: null, toastTimer: 0,
    photos: new Map(), videos: new Map(), activePhotoId: '', activeMediaId: '', replacePhotoId: '', replaceVideoId: '', dragMediaId: '',
    editPhotoId: '', editDraft: null, editPollId: '',
    emojiCatalog: null, emojiLoading: null, emojiCategory: 'face-emotion', emojiQuery: '', emojiTone: 0,
    recentEmojis: [],
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
  const isVideoFile = (file) => VIDEO_EXTENSIONS.has(fileExtension(file.name)) || /^video\/(mp4|webm|quicktime|ogg)$/i.test(file.type);
  const photoCount = () => body.querySelectorAll('.editor-media[data-media-kind="photo"]').length;
  const videoCount = () => body.querySelectorAll('.editor-media[data-media-kind="video"]').length;
  const photoFilter = (value) => ({ none:'none', auto:'contrast(1.05) saturate(1.08)', mono:'grayscale(1)', warm:'sepia(.18) saturate(1.12)' }[value] || 'none');

  function photoMarkup(photo) {
    return `<figure class="editor-media is-${photo.widthMode}" data-media-id="${photo.id}" data-media-kind="photo" data-align="${photo.align}" draggable="true" contenteditable="false">
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
      <figcaption><span class="photo-caption media-caption" contenteditable="true" role="textbox" data-placeholder="사진 설명을 입력하세요" aria-label="사진 설명">${escapeHtml(photo.caption)}</span><small>${escapeHtml(photo.name)} · ${formatBytes(photo.size)}</small></figcaption>
    </figure><p class="after-media"><br></p>`;
  }

  function videoMarkup(video) {
    return `<figure class="editor-media editor-video is-${video.widthMode}" data-media-id="${video.id}" data-media-kind="video" data-align="${video.align}" draggable="true" contenteditable="false">
      <div class="media-quick-toolbar" role="toolbar" aria-label="${escapeHtml(video.name)} 동영상 편집">
        <button type="button" data-action="photo-width" data-width="small">작게</button>
        <button type="button" data-action="photo-width" data-width="document">문서 너비</button>
        <button type="button" data-action="photo-width" data-width="full">옆트임</button>
        <button type="button" data-action="photo-align" data-align="left" aria-label="왼쪽 정렬">왼쪽</button>
        <button type="button" data-action="photo-align" data-align="center" aria-label="가운데 정렬">가운데</button>
        <button type="button" data-action="photo-align" data-align="right" aria-label="오른쪽 정렬">오른쪽</button>
        <button type="button" data-action="video-link">링크</button>
        <button type="button" data-action="replace-video">교체</button>
        <button type="button" data-action="remove-media">삭제</button>
      </div>
      <div class="editor-media-frame">
        <video src="${video.url}" controls playsinline preload="metadata" aria-label="${escapeHtml(video.name)}"></video>
        <button class="media-type-badge" type="button" aria-label="동영상 편집 도구 열기">VIDEO</button>
        <span class="media-drag-handle" aria-hidden="true">⋮⋮</span>
      </div>
      <figcaption><span class="video-caption media-caption" contenteditable="true" role="textbox" data-placeholder="동영상 설명을 입력하세요" aria-label="동영상 설명">${escapeHtml(video.caption)}</span><small>${escapeHtml(video.name)} · ${formatBytes(video.size)}</small></figcaption>
    </figure><p class="after-media"><br></p>`;
  }

  function getMediaFigure(target) { return target?.closest?.('.editor-media[data-media-id]'); }
  function getPhotoFigure(target) { return getMediaFigure(target); }

  function getPhoto(id) { return state.photos.get(id); }
  function getVideo(id) { return state.videos.get(id); }
  function getMedia(id) { return getPhoto(id) || getVideo(id); }

  function syncPhotoElement(id) {
    const photo = getPhoto(id);
    const figure = body.querySelector(`.editor-media[data-media-id="${CSS.escape(id)}"]`);
    if (!photo || !figure) return;
    figure.className = `editor-media is-${photo.widthMode}${state.activePhotoId === id ? ' is-selected' : ''}`;
    figure.dataset.align = photo.align;
    figure.dataset.mediaKind = 'photo';
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
    state.activeMediaId = id;
    state.activePhotoId = state.photos.has(id) ? id : '';
    qsa('.editor-media[data-media-id]', body).forEach((figure) => figure.classList.toggle('is-selected', figure.dataset.mediaId === id));
  }

  function syncVideoElement(id) {
    const video = getVideo(id);
    const figure = body.querySelector(`.editor-media[data-media-id="${CSS.escape(id)}"]`);
    if (!video || !figure) return;
    figure.className = `editor-media editor-video is-${video.widthMode}${state.activeMediaId === id ? ' is-selected' : ''}`;
    figure.dataset.align = video.align;
    figure.dataset.mediaKind = 'video';
    const player = qs('video', figure);
    player.src = video.url;
    player.setAttribute('aria-label', video.name);
    const caption = qs('.video-caption', figure);
    if (caption && caption.textContent !== video.caption) caption.textContent = video.caption;
    const meta = qs('figcaption small', figure);
    if (meta) meta.textContent = `${video.name} · ${formatBytes(video.size)}`;
  }

  function openMediaDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('bbm-community-write-media', 2);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('photos')) request.result.createObjectStore('photos', { keyPath:'id' });
        if (!request.result.objectStoreNames.contains('videos')) request.result.createObjectStore('videos', { keyPath:'id' });
      };
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

  async function storeVideoBlob(id, blob) {
    const db = await openMediaDb();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('videos', 'readwrite');
      transaction.objectStore('videos').put({ id, blob });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  }

  async function readVideoBlob(id) {
    const db = await openMediaDb();
    const result = await new Promise((resolve, reject) => {
      const request = db.transaction('videos').objectStore('videos').get(id);
      request.onsuccess = () => resolve(request.result?.blob || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return result;
  }

  async function deleteVideoBlob(id) {
    const db = await openMediaDb();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('videos', 'readwrite');
      transaction.objectStore('videos').delete(id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  }

  function renderBoards(query = '') {
    const keyword = query.trim().toLowerCase();
    const options = state.selectionMode === 'head'
      ? ['말머리 없음', ...(boards.find((board) => board.name === state.board)?.heads || [])]
      : boards.map((board) => board.name);
    const selected = state.selectionMode === 'head' ? (state.head || '말머리 없음') : state.board;
    const filtered = options.filter((name) => name.toLowerCase().includes(keyword));
    boardList.innerHTML = filtered.map((name) => `<li><label><span>${escapeHtml(name)}</span><input type="radio" name="taxonomy" data-selection="${state.selectionMode}" value="${escapeHtml(name)}" ${selected === name ? 'checked' : ''}><i aria-hidden="true"></i></label></li>`).join('') || '<li class="empty-board">검색 결과가 없습니다.</li>';
  }

  function hasBodyContent() {
    return Boolean(body.textContent.trim() || body.querySelector('img,video,.embed-card,.place-card,.topic-card,.sticker-chip,.poll-card') || state.attachments.length);
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
    qsa('[data-action="board"],[data-action="head"]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
  }

  function captureRange() {
    const selection = window.getSelection();
    if (selection?.rangeCount && body.contains(selection.anchorNode)) state.savedRange = selection.getRangeAt(0).cloneRange();
  }

  function rememberFormatRange() {
    const selection = window.getSelection();
    if (selection?.rangeCount && body.contains(selection.anchorNode)) state.formatRange = selection.getRangeAt(0).cloneRange();
  }

  function restoreFormatRange() {
    const range = state.formatRange;
    if (!range || !body.contains(range.commonAncestorContainer)) return false;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }

  function runFormatCommand(command, value = null) {
    restoreFormatRange();
    body.focus({ preventScroll:true });
    restoreFormatRange();
    document.execCommand(command, false, value);
    rememberFormatRange();
    body.dispatchEvent(new Event('input', { bubbles:true }));
  }

  function applyInlineStyle(property, value) {
    restoreFormatRange();
    body.focus({ preventScroll:true });
    if (!restoreFormatRange()) return;
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style[property] = value;
    if (range.collapsed) {
      span.append(document.createTextNode('\u200b'));
      range.insertNode(span);
      range.setStart(span.firstChild, 1);
      range.collapse(true);
    } else {
      span.append(range.extractContents());
      range.insertNode(span);
      range.selectNodeContents(span);
    }
    selection.removeAllRanges();
    selection.addRange(range);
    state.formatRange = range.cloneRange();
    body.dispatchEvent(new Event('input', { bubbles:true }));
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
    qsa('.editor-media[data-media-id] img,.editor-media[data-media-id] video', bodyClone).forEach((media) => media.removeAttribute('src'));
    qsa('.editor-media', bodyClone).forEach((figure) => figure.classList.remove('is-selected'));
    return {
      title: title.value.trim() || '제목 없음', body: bodyClone.innerHTML, tags: tags.value,
      board: state.board, head: state.head, visibility: state.visibility,
      permissions: { search: qs('#allowSearch').checked, share: qs('#allowShare').checked, copy: qs('#allowCopy').checked },
      attachments: state.attachments.map(({ name, size, type }) => ({ name, size, type })),
      photos: [...state.photos.values()].map(({ url, ...photo }) => photo),
      videos: [...state.videos.values()].map(({ url, ...video }) => video),
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
    state.head = state.draft.head || '';
    state.visibility = state.draft.visibility || '멤버 공개';
    visibilityButton.textContent = state.visibility;
    selectedBoard.textContent = state.board || '게시판 선택';
    selectedHead.textContent = state.head || '말머리 선택';
    headSelect.disabled = !state.board;
    const permissions = state.draft.permissions || {};
    qs('#allowSearch').checked = permissions.search !== false;
    qs('#allowShare').checked = permissions.share !== false;
    qs('#allowCopy').checked = permissions.copy !== false;
    state.attachments = (state.draft.attachments || []).map((file) => ({ ...file, url: '' }));
    state.photos.forEach((photo) => { if (photo.url) URL.revokeObjectURL(photo.url); });
    state.photos.clear();
    state.videos.forEach((video) => { if (video.url) URL.revokeObjectURL(video.url); });
    state.videos.clear();
    let missingPhotos = 0;
    let missingVideos = 0;
    for (const saved of state.draft.photos || []) {
      const blob = await readPhotoBlob(saved.id).catch(() => null);
      if (!blob) { body.querySelector(`.editor-media[data-media-id="${CSS.escape(saved.id)}"]`)?.remove(); missingPhotos += 1; continue; }
      state.photos.set(saved.id, { ...saved, url:URL.createObjectURL(blob) });
      syncPhotoElement(saved.id);
      const restoredCaption = body.querySelector(`.editor-media[data-media-id="${CSS.escape(saved.id)}"] .photo-caption`);
      if (restoredCaption) restoredCaption.textContent = saved.caption || '';
    }
    for (const saved of state.draft.videos || []) {
      const blob = await readVideoBlob(saved.id).catch(() => null);
      if (!blob) { body.querySelector(`.editor-media[data-media-id="${CSS.escape(saved.id)}"]`)?.remove(); missingVideos += 1; continue; }
      state.videos.set(saved.id, { ...saved, url:URL.createObjectURL(blob) });
      syncVideoElement(saved.id);
    }
    (state.draft.photos || []).forEach((saved) => {
      const restoredCaption = body.querySelector(`.editor-media[data-media-id="${CSS.escape(saved.id)}"] .photo-caption`);
      if (restoredCaption) restoredCaption.textContent = saved.caption || '';
    });
    renderAttachments();
    draftLayer.hidden = true;
    syncSubmit();
    const missing = [missingPhotos ? `사진 ${missingPhotos}장` : '', missingVideos ? `동영상 ${missingVideos}개` : ''].filter(Boolean).join(', ');
    showToast(missing ? `임시글을 불러왔습니다. ${missing}는 다시 첨부해주세요.` : '임시글을 불러왔습니다.');
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
    state.editPollId = '';
  }

  function choiceButtons(items, className = '') {
    return `<div class="choice-grid ${className}">${items.map((item) => `<button class="choice-button" type="button" data-choice="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join('')}</div>`;
  }

  function emojiPickerMarkup() {
    return `<section class="emoji-picker" aria-label="전체 이모지 선택기">
      <label class="emoji-search"><span class="sr-only">이모지 검색</span><input id="emojiSearch" type="search" autocomplete="off" placeholder="이모지 검색 (이름·키워드)"></label>
      <nav class="emoji-category-tabs" aria-label="이모지 카테고리">${emojiCategories.map((category) => `<button type="button" class="emoji-category-tab" data-emoji-category="${category.key}" aria-label="${category.label}" title="${category.label}"><span aria-hidden="true">${category.icon}</span><small>${category.label}</small></button>`).join('')}</nav>
      <div class="emoji-picker-tools"><div class="emoji-tone-list" role="group" aria-label="피부색"><button type="button" data-emoji-tone="0" aria-label="기본 피부색">✋</button><button type="button" data-emoji-tone="1" aria-label="밝은 피부색">✋🏻</button><button type="button" data-emoji-tone="2" aria-label="중간 밝은 피부색">✋🏼</button><button type="button" data-emoji-tone="3" aria-label="중간 피부색">✋🏽</button><button type="button" data-emoji-tone="4" aria-label="중간 어두운 피부색">✋🏾</button><button type="button" data-emoji-tone="5" aria-label="어두운 피부색">✋🏿</button></div><span id="emojiResultCount" aria-live="polite"></span></div>
      <div class="emoji-grid" id="emojiGrid" aria-busy="true"><p class="emoji-loading">전체 이모지를 불러오는 중입니다.</p></div>
      <p class="emoji-picker-meta">Unicode Emoji 17 · unicode-emoji (MIT)</p>
    </section>`;
  }

  function loadRecentEmojis() {
    try {
      const saved = JSON.parse(localStorage.getItem(emojiRecentKey) || '[]');
      state.recentEmojis = Array.isArray(saved) ? saved.filter((item) => typeof item === 'string').slice(0, 24) : [];
    } catch { state.recentEmojis = []; }
  }

  function rememberEmoji(emoji) {
    state.recentEmojis = [emoji, ...state.recentEmojis.filter((item) => item !== emoji)].slice(0, 24);
    try { localStorage.setItem(emojiRecentKey, JSON.stringify(state.recentEmojis)); } catch { /* private browsing */ }
  }

  async function loadEmojiCatalog() {
    if (state.emojiCatalog) return state.emojiCatalog;
    if (!state.emojiLoading) {
      state.emojiLoading = fetch(emojiDataUrl)
        .then((response) => {
          if (!response.ok) throw new Error(`emoji catalog ${response.status}`);
          return response.json();
        })
        .then((catalog) => { state.emojiCatalog = catalog; return catalog; })
        .finally(() => { state.emojiLoading = null; });
    }
    return state.emojiLoading;
  }

  function emojiForTone(item) {
    if (!state.emojiTone || !item.v?.length) return item.e;
    return item.v[state.emojiTone - 1] || item.e;
  }

  function renderEmojiPicker() {
    const grid = qs('#emojiGrid', toolDialogBody);
    if (!grid || !state.emojiCatalog) return;
    const query = state.emojiQuery.trim().toLocaleLowerCase();
    const categorySearch = emojiCategories.find((category) => query && category.search.includes(query));
    let items;
    if (!query && state.emojiCategory === 'recent') {
      const index = new Map(state.emojiCatalog.emojis.flatMap((item) => [[item.e, item], ...item.v.map((variation) => [variation, { ...item, e:variation, v:[] }])]));
      items = state.recentEmojis.map((emoji) => index.get(emoji)).filter(Boolean);
    } else {
      items = state.emojiCatalog.emojis.filter((item) => {
        if (!query) return item.c === state.emojiCategory;
        const haystack = `${item.d} ${item.k.join(' ')} ${item.c}`.toLocaleLowerCase();
        return haystack.includes(query) || (categorySearch && item.c === categorySearch.key);
      });
    }
    qsa('[data-emoji-category]', toolDialogBody).forEach((button) => {
      const selected = !query && button.dataset.emojiCategory === state.emojiCategory;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-current', selected ? 'true' : 'false');
    });
    qsa('[data-emoji-tone]', toolDialogBody).forEach((button) => {
      const selected = Number(button.dataset.emojiTone) === state.emojiTone;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    const count = qs('#emojiResultCount', toolDialogBody);
    if (count) count.textContent = `${items.length.toLocaleString('ko-KR')}개`;
    grid.setAttribute('aria-busy', 'false');
    grid.innerHTML = items.length
      ? items.map((item) => { const emoji = emojiForTone(item); return `<button class="emoji-choice" type="button" data-emoji="${escapeHtml(emoji)}" aria-label="${escapeHtml(item.d)}" title="${escapeHtml(item.d)}">${escapeHtml(emoji)}</button>`; }).join('')
      : `<p class="emoji-empty">${state.emojiCategory === 'recent' && !query ? '최근 사용한 이모지가 없습니다.' : '검색 결과가 없습니다.'}</p>`;
  }

  async function initializeEmojiPicker() {
    loadRecentEmojis();
    state.emojiQuery = '';
    const search = qs('#emojiSearch', toolDialogBody);
    search?.addEventListener('input', () => { state.emojiQuery = search.value; renderEmojiPicker(); });
    try {
      await loadEmojiCatalog();
      if (state.tool === 'sticker') renderEmojiPicker();
    } catch {
      const grid = qs('#emojiGrid', toolDialogBody);
      if (grid) { grid.setAttribute('aria-busy', 'false'); grid.innerHTML = '<p class="emoji-empty">이모지를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>'; }
    }
  }

  function pollOptionFields(options = ['',''], startIndex = 0) {
    return options.map((option, index) => `<label class="poll-option-field"><span class="sr-only">선택지 ${startIndex + index + 1}</span><input class="poll-option-input" maxlength="60" value="${escapeHtml(option)}" placeholder="선택지 ${startIndex + index + 1}"><button type="button" data-action="remove-poll-option" aria-label="선택지 ${startIndex + index + 1} 삭제">×</button></label>`).join('');
  }

  function pollDataFromCard(card) {
    if (!card) return null;
    return {
      question:card.dataset.question || '',
      options:[...card.querySelectorAll('.poll-option-preview')].map((option) => option.textContent),
      multiple:card.dataset.multiple === 'true',
      duration:card.dataset.duration || '7일',
      anonymous:card.dataset.anonymous === 'true',
    };
  }

  function pollMarkup({ id, question, options, multiple, duration, anonymous }) {
    const meta = [multiple ? '복수 선택' : '단일 선택', anonymous ? '익명 투표' : '닉네임 공개', duration === '제한 없음' ? duration : `${duration} 후 마감`].join(' · ');
    return `<section class="poll-card" data-poll-id="${escapeHtml(id)}" data-question="${escapeHtml(question)}" data-multiple="${multiple}" data-duration="${escapeHtml(duration)}" data-anonymous="${anonymous}" contenteditable="false"><header><span>투표</span><strong>${escapeHtml(question)}</strong></header><div class="poll-option-list">${options.map((option) => `<span class="poll-option-preview">${escapeHtml(option)}</span>`).join('')}</div><footer><small>${escapeHtml(meta)}</small><span class="poll-card-actions"><button type="button" data-action="edit-poll">수정</button><button type="button" data-action="remove-poll">삭제</button></span></footer></section>`;
  }

  function openTool(type) {
    if (!['photo-link','video-link','visibility'].includes(type)) captureRange();
    else state.savedRange = null;
    state.tool = type;
    state.selectedChoice = '';
    const currentPoll = type === 'poll' ? pollDataFromCard(body.querySelector(`.poll-card[data-poll-id="${CSS.escape(state.editPollId)}"]`)) : null;
    const config = {
      video: ['동영상 추가', '<section class="video-upload-panel"><strong>내 기기에서 업로드</strong><p>MP4, WebM, MOV · 파일당 최대 200MB · 최대 10개</p><button type="button" data-action="choose-video">동영상 선택</button></section><div class="dialog-divider"><span>또는 링크로 추가</span></div><label class="dialog-field"><span>동영상 주소</span><input id="toolUrl" type="url" inputmode="url" placeholder="https://youtu.be/..." /></label><label class="dialog-field"><span>표시 제목</span><input id="toolText" maxlength="80" placeholder="동영상 제목" /></label><p class="upload-note">링크는 안전한 주소 카드로 삽입하며 자동 재생하지 않습니다.</p>'],
      link: ['링크 추가', '<label class="dialog-field"><span>주소</span><input id="toolUrl" type="url" inputmode="url" placeholder="https://example.com" /></label><label class="dialog-field"><span>링크 문구</span><input id="toolText" maxlength="80" placeholder="링크 이름" /></label>'],
      place: ['장소 추가', '<label class="dialog-field"><span>장소명</span><input id="toolText" maxlength="60" placeholder="예: 보배드림 본사" /></label><label class="dialog-field"><span>주소</span><input id="toolAddress" maxlength="120" placeholder="도로명 또는 지번 주소" /></label>'],
      poll: [state.editPollId ? '투표 수정' : '투표 만들기', `<label class="dialog-field"><span>질문</span><input id="pollQuestion" maxlength="100" value="${escapeHtml(currentPoll?.question || '')}" placeholder="투표 질문을 입력하세요"></label><div class="poll-options" id="pollOptions">${pollOptionFields(currentPoll?.options || ['',''])}</div><button class="poll-add-option" type="button" data-action="add-poll-option">+ 선택지 추가</button><div class="poll-settings"><label><span>복수 선택 허용</span><input id="pollMultiple" type="checkbox" ${currentPoll?.multiple ? 'checked' : ''}></label><label><span>익명 투표</span><input id="pollAnonymous" type="checkbox" ${currentPoll?.anonymous ? 'checked' : ''}></label><label><span>마감</span><select id="pollDuration">${['1일','3일','7일','제한 없음'].map((value) => `<option ${value === (currentPoll?.duration || '7일') ? 'selected' : ''}>${value}</option>`).join('')}</select></label></div><p class="upload-note">선택지는 2개 이상 10개까지 추가할 수 있습니다.</p>`],
      sticker: ['이모지', emojiPickerMarkup()],
      topic: ['글감 선택', choiceButtons(topics, 'topic-grid')],
      visibility: ['공개 범위', `<div class="visibility-list">${['전체 공개','멤버 공개'].map((item) => `<label class="visibility-option"><span>${item}</span><input type="radio" name="visibility" value="${item}" ${state.visibility === item ? 'checked' : ''}></label>`).join('')}</div>`],
      'photo-link': ['사진 링크', `<label class="dialog-field"><span>연결 주소</span><input id="toolUrl" type="url" inputmode="url" value="${escapeHtml(getPhoto(state.activePhotoId)?.link || '')}" placeholder="https://example.com" /></label><p class="upload-note">주소를 비우고 적용하면 링크가 해제됩니다.</p>`],
      'video-link': ['동영상 링크', `<label class="dialog-field"><span>연결 주소</span><input id="toolUrl" type="url" inputmode="url" value="${escapeHtml(getVideo(state.activeMediaId)?.link || '')}" placeholder="https://example.com" /></label><p class="upload-note">주소를 비우고 적용하면 링크가 해제됩니다.</p>`],
    }[type];
    if (!config) return;
    toolDialogTitle.textContent = config[0];
    toolDialogBody.innerHTML = config[1];
    toolApply.textContent = type === 'visibility' ? '선택' : state.editPollId ? '수정' : '추가';
    toolOverlay.hidden = false;
    if (type === 'sticker') initializeEmojiPicker();
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
    } else if (type === 'video-link') {
      const raw = qs('#toolUrl', toolDialogBody)?.value.trim() || '';
      const url = raw ? safeUrl(raw) : '';
      if (raw && !url) { showToast('http 또는 https 주소를 입력해주세요.'); return; }
      const video = getVideo(state.activeMediaId);
      if (video) { video.link = url; showToast(url ? '동영상 링크를 연결했습니다.' : '동영상 링크를 해제했습니다.'); }
    } else if (type === 'place') {
      const name = qs('#toolText', toolDialogBody)?.value.trim();
      const address = qs('#toolAddress', toolDialogBody)?.value.trim();
      if (!name || !address) { showToast('장소명과 주소를 입력해주세요.'); return; }
      insertHtml(`<div class="place-card" contenteditable="false"><strong>📍 ${escapeHtml(name)}</strong><span>${escapeHtml(address)}</span></div><p><br></p>`);
    } else if (type === 'poll') {
      const question = qs('#pollQuestion', toolDialogBody)?.value.trim();
      const options = qsa('.poll-option-input', toolDialogBody).map((input) => input.value.trim()).filter(Boolean);
      if (!question) { showToast('투표 질문을 입력해주세요.'); return; }
      if (options.length < 2) { showToast('선택지를 2개 이상 입력해주세요.'); return; }
      if (new Set(options).size !== options.length) { showToast('같은 선택지는 한 번만 입력해주세요.'); return; }
      const poll = { id:state.editPollId || `poll_${Date.now().toString(36)}`, question, options, multiple:qs('#pollMultiple', toolDialogBody).checked, duration:qs('#pollDuration', toolDialogBody).value, anonymous:qs('#pollAnonymous', toolDialogBody).checked };
      if (state.editPollId) {
        body.querySelector(`.poll-card[data-poll-id="${CSS.escape(state.editPollId)}"]`)?.replaceWith(document.createRange().createContextualFragment(pollMarkup(poll)));
        body.dispatchEvent(new Event('input', { bubbles:true }));
      } else insertHtml(`${pollMarkup(poll)}<p><br></p>`);
      state.editPollId = '';
    } else if (type === 'sticker') {
      if (!state.selectedChoice) { showToast('이모지를 선택해주세요.'); return; }
      rememberEmoji(state.selectedChoice);
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
    if (state.activeMediaId === id) state.activeMediaId = '';
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

  async function replaceVideo(file) {
    const id = state.replaceVideoId;
    state.replaceVideoId = '';
    if (!id || !file) return;
    if (!isVideoFile(file)) { showDialog('교체 실패', '지원하지 않는 동영상 형식입니다.'); return; }
    if (file.size > MAX_VIDEO_BYTES) { showDialog('교체 실패', '동영상 1개는 200MB까지 첨부할 수 있습니다.'); return; }
    await addVideoFile(file, id);
    replaceVideoInput.value = '';
    showToast('동영상을 교체했습니다.');
  }

  function removeVideo(id) {
    const video = getVideo(id);
    const figure = body.querySelector(`.editor-media[data-media-id="${CSS.escape(id)}"]`);
    const after = figure?.nextElementSibling;
    if (video?.url) URL.revokeObjectURL(video.url);
    state.videos.delete(id);
    deleteVideoBlob(id).catch(() => {});
    figure?.remove();
    if (after?.classList.contains('after-media')) after.remove();
    state.activeMediaId = '';
    syncSubmit();
  }

  function removeMedia(id) {
    if (state.photos.has(id)) removePhoto(id);
    else if (state.videos.has(id)) removeVideo(id);
  }

  async function addVideoFile(file, replaceId = '') {
    const id = replaceId || `video_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const previous = replaceId ? getVideo(replaceId) : null;
    const url = URL.createObjectURL(file);
    const video = {
      id, name:file.name, size:file.size, type:file.type, url,
      caption:previous?.caption || '', widthMode:previous?.widthMode || 'document',
      align:previous?.align || 'center', link:previous?.link || '',
    };
    if (previous?.url) URL.revokeObjectURL(previous.url);
    state.videos.set(id, video);
    await storeVideoBlob(id, file);
    if (replaceId) syncVideoElement(id);
    else insertHtml(videoMarkup(video));
    return video;
  }

  async function addVideos(files, source = 'picker') {
    const incoming = [...files];
    const room = Math.max(0, MAX_VIDEOS - videoCount());
    const selected = incoming.slice(0, room);
    const errors = [];
    let added = 0;
    if (!room && incoming.length) errors.push(`동영상은 게시글당 최대 ${MAX_VIDEOS}개입니다.`);
    if (incoming.length > room) errors.push(`한도를 넘은 ${incoming.length - room}개는 제외했습니다.`);
    uploadStatus.hidden = false;
    uploadStatus.textContent = `동영상 ${selected.length}개를 확인하고 있습니다.`;
    for (const file of selected) {
      if (!isVideoFile(file)) { errors.push(`${file.name}: 지원하지 않는 형식`); continue; }
      if (file.size > MAX_VIDEO_BYTES) { errors.push(`${file.name}: 200MB 초과`); continue; }
      try { await addVideoFile(file); added += 1; }
      catch { errors.push(`${file.name}: 읽기 실패`); }
    }
    videoInput.value = '';
    uploadStatus.hidden = true;
    if (added) showToast(`${source === 'drop' ? '끌어온' : source === 'paste' ? '붙여넣은' : '선택한'} 동영상 ${added}개를 첨부했습니다.`);
    if (errors.length) showDialog('첨부하지 못한 동영상', errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n외 ${errors.length - 5}건` : ''));
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
    state.postSubmitted = true;
    showDialog('게시물 등록 완료', '테스트 게시물이 이 브라우저에 저장되었습니다. 실제 운영 서버에는 전송되지 않았습니다.');
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    const action = button?.dataset.action;
    const figure = getMediaFigure(event.target);
    if (figure) selectPhoto(figure.dataset.mediaId);
    else if (!event.target.closest('.tool-dialog,.photo-editor')) selectPhoto('');
    if (button?.dataset.tool) openTool(button.dataset.tool);
    if (button?.dataset.choice) {
      state.selectedChoice = button.dataset.choice;
      qsa('[data-choice]', toolDialogBody).forEach((item) => item.classList.toggle('is-selected', item === button));
    }
    if (button?.dataset.emojiCategory) {
      state.emojiCategory = button.dataset.emojiCategory;
      state.emojiQuery = '';
      const search = qs('#emojiSearch', toolDialogBody);
      if (search) search.value = '';
      renderEmojiPicker();
    }
    if (button?.dataset.emojiTone !== undefined) {
      state.emojiTone = Number(button.dataset.emojiTone);
      renderEmojiPicker();
    }
    if (button?.dataset.emoji) {
      state.selectedChoice = button.dataset.emoji;
      qsa('[data-emoji]', toolDialogBody).forEach((item) => {
        const selected = item === button;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
    }
    if (action === 'board' || action === 'head') {
      if (action === 'head' && !state.board) { showToast('게시판을 먼저 선택해주세요.'); return; }
      state.selectionMode = action;
      qs('#boardTitle').textContent = action === 'head' ? '말머리 선택' : '게시판 선택';
      boardSearch.value = '';
      boardSearch.placeholder = action === 'head' ? '말머리 검색' : '게시판 검색';
      renderBoards(); boardOverlay.hidden = false; button.setAttribute('aria-expanded', 'true'); window.setTimeout(() => boardSearch.focus(), 0);
    }
    if (action === 'close-board') closeBoard();
    if (action === 'close-tool') closeTool();
    if (action === 'text-tools') { const bar = qs('.text-toolbar'); bar.hidden = !bar.hidden; button.setAttribute('aria-expanded', String(!bar.hidden)); }
    if (action === 'toggle-settings') {
      const details = qs('#advancedPermissions');
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      button.textContent = expanded ? '상세설정 펼치기' : '상세설정 접기';
      details.hidden = expanded;
    }
    if (action === 'add-photo') photoInput.click();
    if (action === 'choose-video') videoInput.click();
    if (action === 'add-file') fileInput.click();
    if (action === 'quote') runFormatCommand('formatBlock', 'blockquote');
    if (action === 'divider') runFormatCommand('insertHorizontalRule');
    if (action === 'add-body') body.focus();
    if (action === 'set-cover' && figure?.dataset.mediaKind === 'photo') {
      state.photos.forEach((photo) => { photo.cover = photo.id === figure.dataset.mediaId; syncPhotoElement(photo.id); });
      showToast('대표 사진으로 설정했습니다.');
    }
    if (action === 'photo-width' && figure) { const media = getMedia(figure.dataset.mediaId); if (media) { media.widthMode = button.dataset.width; state.photos.has(media.id) ? syncPhotoElement(media.id) : syncVideoElement(media.id); } }
    if (action === 'photo-align' && figure) { const media = getMedia(figure.dataset.mediaId); if (media) { media.align = button.dataset.align; state.photos.has(media.id) ? syncPhotoElement(media.id) : syncVideoElement(media.id); } }
    if (action === 'photo-link' && figure?.dataset.mediaKind === 'photo') openTool('photo-link');
    if (action === 'video-link' && figure?.dataset.mediaKind === 'video') openTool('video-link');
    if (action === 'edit-photo' && figure?.dataset.mediaKind === 'photo') openPhotoEditor(figure.dataset.mediaId);
    if (action === 'replace-photo' && figure?.dataset.mediaKind === 'photo') { state.replacePhotoId = figure.dataset.mediaId; replacePhotoInput.click(); }
    if (action === 'replace-video' && figure?.dataset.mediaKind === 'video') { state.replaceVideoId = figure.dataset.mediaId; replaceVideoInput.click(); }
    if (action === 'remove-media' && figure) removeMedia(figure.dataset.mediaId);
    if (action === 'remove-attachment') { const index = Number(button.dataset.index); const [removed] = state.attachments.splice(index, 1); if (removed?.url) URL.revokeObjectURL(removed.url); renderAttachments(); }
    if (action === 'add-poll-option') {
      const pollOptions = qs('#pollOptions', toolDialogBody);
      const count = qsa('.poll-option-field', pollOptions).length;
      if (count >= 10) { showToast('선택지는 최대 10개입니다.'); return; }
      pollOptions.insertAdjacentHTML('beforeend', pollOptionFields([''], count));
      qsa('.poll-option-input', pollOptions).at(-1)?.focus();
    }
    if (action === 'remove-poll-option') {
      const fields = qsa('.poll-option-field', toolDialogBody);
      if (fields.length <= 2) { showToast('선택지는 2개 이상 필요합니다.'); return; }
      button.closest('.poll-option-field')?.remove();
    }
    if (action === 'edit-poll') {
      const card = button.closest('.poll-card');
      state.editPollId = card?.dataset.pollId || '';
      if (state.editPollId) openTool('poll');
    }
    if (action === 'remove-poll') {
      const card = button.closest('.poll-card');
      const spacer = card?.nextElementSibling;
      card?.remove();
      if (spacer?.tagName === 'P' && !spacer.textContent.trim()) spacer.remove();
      body.dispatchEvent(new Event('input', { bubbles:true }));
      showToast('투표를 삭제했습니다.');
    }
    if (action === 'save-draft') saveDraft();
    if (action === 'drafts') openDrafts();
    if (action === 'close-drafts') draftLayer.hidden = true;
    if (action === 'restore-draft') restoreDraft();
    if (action === 'delete-draft') {
      (state.draft?.photos || []).forEach((photo) => deletePhotoBlob(photo.id).catch(() => {}));
      (state.draft?.videos || []).forEach((video) => deleteVideoBlob(video.id).catch(() => {}));
      state.draft = null; localStorage.removeItem(draftKey); qs('#draftCount').textContent = '0'; draftContent.innerHTML = '<p>임시글이 없습니다.</p>';
      showToast('임시글을 삭제했습니다.');
    }
    if (action === 'close-dialog') {
      dialogOverlay.hidden = true;
      if (state.postSubmitted && state.returnTo) location.href = state.returnTo;
    }
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
    if (command && ['bold','italic','underline','strikeThrough'].includes(command)) { runFormatCommand(command); button.classList.toggle('is-active'); }
  });

  toolApply.addEventListener('click', applyTool);
  photoInput.addEventListener('change', () => addPhotos(photoInput.files).catch(() => showToast('이미지를 읽지 못했습니다.')));
  replacePhotoInput.addEventListener('change', () => replacePhoto(replacePhotoInput.files[0]).catch(() => showDialog('교체 실패', '이미지를 읽지 못했습니다.')));
  videoInput.addEventListener('change', () => {
    closeTool();
    addVideos(videoInput.files).catch(() => showToast('동영상을 읽지 못했습니다.'));
  });
  replaceVideoInput.addEventListener('change', () => replaceVideo(replaceVideoInput.files[0]).catch(() => showDialog('교체 실패', '동영상을 읽지 못했습니다.')));
  fileInput.addEventListener('change', () => addFiles(fileInput.files));
  body.addEventListener('input', (event) => {
    if (event.target.classList?.contains('media-caption')) {
      const figure = getMediaFigure(event.target);
      const media = figure && getMedia(figure.dataset.mediaId);
      if (media) media.caption = event.target.textContent.slice(0, 200);
    }
    syncSubmit();
  });
  document.addEventListener('selectionchange', rememberFormatRange);
  qs('.text-toolbar').addEventListener('pointerdown', rememberFormatRange);
  body.addEventListener('dragstart', (event) => {
    const figure = getMediaFigure(event.target);
    if (!figure) return;
    state.dragMediaId = figure.dataset.mediaId;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', state.dragMediaId);
    figure.classList.add('is-dragging');
  });
  body.addEventListener('dragend', () => { qsa('.is-dragging', body).forEach((item) => item.classList.remove('is-dragging')); state.dragMediaId = ''; });
  body.addEventListener('dragover', (event) => {
    if (state.dragMediaId || [...(event.dataTransfer?.items || [])].some((item) => item.kind === 'file')) {
      event.preventDefault(); event.dataTransfer.dropEffect = state.dragMediaId ? 'move' : 'copy'; body.classList.add('is-drop-target');
    }
  });
  body.addEventListener('dragleave', (event) => { if (!body.contains(event.relatedTarget)) body.classList.remove('is-drop-target'); });
  body.addEventListener('drop', (event) => {
    event.preventDefault(); body.classList.remove('is-drop-target');
    if (state.dragMediaId) {
      const moving = body.querySelector(`.editor-media[data-media-id="${CSS.escape(state.dragMediaId)}"]`);
      const target = getMediaFigure(event.target);
      if (moving && target && moving !== target) {
        const movingSpacer = moving.nextElementSibling?.classList.contains('after-media') ? moving.nextElementSibling : null;
        const movingBlock = document.createDocumentFragment();
        movingBlock.append(moving);
        if (movingSpacer) movingBlock.append(movingSpacer);
        const afterTarget = target.nextElementSibling?.classList.contains('after-media') ? target.nextElementSibling : target;
        const targetRect = target.getBoundingClientRect();
        if (event.clientY < targetRect.top + targetRect.height / 2) target.before(movingBlock);
        else afterTarget.after(movingBlock);
        showToast('미디어 순서를 변경했습니다.');
      }
      state.dragMediaId = '';
      return;
    }
    const droppedFiles = [...(event.dataTransfer?.files || [])];
    const imageFiles = droppedFiles.filter(isPhotoFile);
    const videoFiles = droppedFiles.filter(isVideoFile);
    if (imageFiles.length) addPhotos(imageFiles, 'drop');
    if (videoFiles.length) addVideos(videoFiles, 'drop');
    if (!imageFiles.length && !videoFiles.length) showToast('지원하는 이미지 또는 동영상 파일을 끌어다 놓아주세요.');
  });
  body.addEventListener('paste', (event) => {
    const imageFiles = [...(event.clipboardData?.items || [])].filter((item) => item.kind === 'file' && item.type.startsWith('image/')).map((item) => item.getAsFile()).filter(Boolean);
    const videoFiles = [...(event.clipboardData?.items || [])].filter((item) => item.kind === 'file' && item.type.startsWith('video/')).map((item) => item.getAsFile()).filter(Boolean);
    if (!imageFiles.length && !videoFiles.length) return;
    event.preventDefault();
    if (imageFiles.length) addPhotos(imageFiles, 'paste');
    if (videoFiles.length) addVideos(videoFiles, 'paste');
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
    if (event.target.dataset.selection === 'head') {
      state.head = event.target.value === '말머리 없음' ? '' : event.target.value;
      selectedHead.textContent = state.head || '말머리 없음';
    } else {
      state.board = event.target.value;
      state.head = '';
      selectedBoard.textContent = state.board;
      selectedHead.textContent = '말머리 선택';
      headSelect.disabled = false;
    }
    closeBoard();
    syncSubmit();
  });
  boardSearch.addEventListener('input', () => renderBoards(boardSearch.value));
  [title, body].forEach((element) => element.addEventListener('input', syncSubmit));
  tags.addEventListener('input', () => {
    const tokens = tags.value.split('#').map((item) => item.trim()).filter(Boolean);
    if (tokens.length > 10) { tags.value = `#${tokens.slice(0, 10).join('#')}`; showToast('태그는 최대 10개까지 입력할 수 있습니다.'); }
  });
  qs('#blockStyle').addEventListener('change', (event) => runFormatCommand('formatBlock', event.target.value));
  qs('#fontFamily').addEventListener('change', (event) => {
    const family = event.target.value === 'system' ? '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif' : `"${event.target.value}"`;
    applyInlineStyle('fontFamily', family);
  });
  qs('#fontSize').addEventListener('change', (event) => applyInlineStyle('fontSize', `${event.target.value}px`));
  qs('#textAlign').addEventListener('change', (event) => runFormatCommand(event.target.value));
  qs('#foreColor').addEventListener('input', (event) => { applyInlineStyle('color', event.target.value); event.target.parentElement.style.setProperty('--selected-color', event.target.value); });
  qs('#backColor').addEventListener('input', (event) => { applyInlineStyle('backgroundColor', event.target.value); event.target.parentElement.style.setProperty('--selected-color', event.target.value); });
  [boardOverlay, dialogOverlay, toolOverlay].forEach((overlay) => overlay.addEventListener('click', (event) => {
    if (event.target !== overlay) return;
    if (overlay === boardOverlay) closeBoard();
    else if (overlay === toolOverlay) closeTool();
    else dialogOverlay.hidden = true;
  }));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { closeBoard(); closeTool(); closePhotoEditor(); dialogOverlay.hidden = true; draftLayer.hidden = true; }
    if ((event.key === 'Backspace' || event.key === 'Delete') && state.activeMediaId && !event.target.matches('input,textarea,[contenteditable="true"]')) {
      event.preventDefault(); removeMedia(state.activeMediaId); showToast('미디어를 삭제했습니다.');
    }
  });
  photoEditorOverlay.addEventListener('click', (event) => { if (event.target === photoEditorOverlay) closePhotoEditor(); });

  try {
    const savedDraft = JSON.parse(localStorage.getItem(draftKey));
    if (savedDraft) { state.draft = savedDraft; qs('#draftCount').textContent = '1'; }
  } catch { localStorage.removeItem(draftKey); }
  if (boards.some((board) => board.name === requestedBoard)) {
    state.board = requestedBoard;
    selectedBoard.textContent = requestedBoard;
    selectedHead.textContent = '말머리 선택';
    headSelect.disabled = false;
  }
  renderBoards();
  renderAttachments();
})();
