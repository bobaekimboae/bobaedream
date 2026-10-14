(() => {
  const boards = ['스티커 신청/인증','베르크 후원/기부','공식 행사','이벤트 & 체험단','블랙리스트','가입했어요','칭찬합니다','잡/못생긴사람게시판','자유게시판','자동차 이야기','바이크 이야기','질문과 답변'];
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
  const toast = qs('#toast');
  const state = { board: '', draft: null, toastTimer: 0 };

  function renderBoards(query = '') {
    const keyword = query.trim().toLowerCase();
    const filtered = boards.filter((name) => name.toLowerCase().includes(keyword));
    boardList.innerHTML = filtered.map((name) => `<li><label><span>${name}</span><input type="radio" name="board" value="${name}" ${state.board === name ? 'checked' : ''}><i aria-hidden="true"></i></label></li>`).join('') || '<li class="empty-board">검색 결과가 없습니다.</li>';
  }

  function syncSubmit() {
    const enabled = Boolean(state.board && title.value.trim() && body.textContent.trim());
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

  function saveDraft() {
    if (!title.value.trim() && !body.textContent.trim()) {
      showToast('저장할 내용이 없습니다.');
      return;
    }
    state.draft = { title: title.value.trim() || '제목 없음', body: body.innerHTML, tags: tags.value, board: state.board, savedAt: new Date() };
    qs('#draftCount').textContent = '1';
    showToast('임시글로 저장했습니다.');
  }

  function openDrafts() {
    if (!state.draft) {
      draftContent.innerHTML = '<p>임시글이 없습니다.</p>';
    } else {
      const time = state.draft.savedAt.toLocaleString('ko-KR', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' });
      draftContent.innerHTML = `<article class="draft-card"><strong>${state.draft.title}</strong><small>${time}</small><div class="draft-tools"><button type="button" data-action="restore-draft" aria-label="수정"><img src="./assets/write-parity/draft-edit.svg" alt=""></button><button type="button" data-action="delete-draft" aria-label="삭제"><img src="./assets/write-parity/draft-delete.svg" alt=""></button></div></article>`;
    }
    draftLayer.hidden = false;
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    const action = button?.dataset.action;
    if (button?.dataset.dialog) showDialog(button.dataset.dialog, `${button.dataset.dialog} 기능을 확인하는 내부 UI 테스트입니다. 외부 서비스에는 전송하지 않습니다.`);
    if (action === 'board') { renderBoards(); boardOverlay.hidden = false; button.setAttribute('aria-expanded', 'true'); window.setTimeout(() => boardSearch.focus(), 0); }
    if (action === 'close-board') closeBoard();
    if (action === 'text-tools') { const bar = qs('.text-toolbar'); bar.hidden = !bar.hidden; button.setAttribute('aria-expanded', String(!bar.hidden)); }
    if (action === 'quote') document.execCommand('formatBlock', false, 'blockquote');
    if (action === 'divider') { body.focus(); document.execCommand('insertHorizontalRule'); }
    if (action === 'add-body') body.focus();
    if (action === 'save-draft') saveDraft();
    if (action === 'drafts') openDrafts();
    if (action === 'close-drafts') draftLayer.hidden = true;
    if (action === 'restore-draft' && state.draft) { title.value = state.draft.title === '제목 없음' ? '' : state.draft.title; body.innerHTML = state.draft.body; tags.value = state.draft.tags; state.board = state.draft.board; selectedBoard.textContent = state.board || '게시판을 선택해주세요.'; draftLayer.hidden = true; syncSubmit(); }
    if (action === 'delete-draft') { state.draft = null; qs('#draftCount').textContent = '0'; draftContent.innerHTML = '<p>임시글이 없습니다.</p>'; }
    if (action === 'close-dialog') dialogOverlay.hidden = true;
    if (action === 'top') window.scrollTo({ top:0, behavior:'smooth' });
    if (action === 'exit') showDialog('글쓰기 종료', '작성 중인 내용이 사라질 수 있습니다. 내부 시안에서는 화면을 닫지 않습니다.');
    if (action === 'submit') {
      if (!state.board) showToast('게시판을 선택해주세요.');
      else if (!title.value.trim()) showToast('제목을 입력해주세요.');
      else if (!body.textContent.trim()) showToast('내용을 입력해주세요.');
      else showDialog('등록 확인', '내부 테스트 시안이므로 실제 게시물은 등록되지 않습니다.');
    }
    const command = button?.dataset.command;
    if (command && ['bold','italic','underline','strikeThrough'].includes(command)) { body.focus(); document.execCommand(command); button.classList.toggle('is-active'); }
  });

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
    const tokens = tags.value.split('#').filter(Boolean);
    if (tokens.length > 10) { tags.value = `#${tokens.slice(0, 10).join('#')}`; showToast('태그는 최대 10개까지 입력할 수 있습니다.'); }
  });
  [boardOverlay, dialogOverlay].forEach((overlay) => overlay.addEventListener('click', (event) => { if (event.target === overlay) overlay === boardOverlay ? closeBoard() : (dialogOverlay.hidden = true); }));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeBoard(); dialogOverlay.hidden = true; draftLayer.hidden = true; } });
  renderBoards();
})();
