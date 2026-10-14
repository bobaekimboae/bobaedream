(() => {
  "use strict";

  const STORAGE_KEY = "bbm.notion-write.v1";
  const DB_NAME = "bbm-notion-write-media";
  const DB_STORE = "media";
  const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
  const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

  const title = document.querySelector("#postTitle");
  const editor = document.querySelector("#blockEditor");
  const board = document.querySelector("#boardSelect");
  const breadcrumbTitle = document.querySelector("#breadcrumbTitle");
  const saveStatus = document.querySelector("#saveStatus");
  const blockMenu = document.querySelector("#blockMenu");
  const blockAddButton = document.querySelector("#blockAddButton");
  const imageInput = document.querySelector("#imageInput");
  const videoInput = document.querySelector("#videoInput");
  const replaceImageInput = document.querySelector("#replaceImageInput");
  const replaceVideoInput = document.querySelector("#replaceVideoInput");
  const mediaDialog = document.querySelector("#mediaDialog");
  const mediaDialogTitle = document.querySelector("#mediaDialogTitle");
  const uploadHelp = document.querySelector("#uploadHelp");
  const mediaUrl = document.querySelector("#mediaUrl");
  const altDialog = document.querySelector("#altDialog");
  const altText = document.querySelector("#altText");
  const previewDialog = document.querySelector("#previewDialog");
  const toast = document.querySelector("#toast");

  let dbPromise;
  let saveTimer;
  let toastTimer;
  let savedRange = null;
  let selectedBlock = null;
  let pendingKind = "image";
  let replaceTarget = null;

  function openDatabase() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(DB_STORE);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return dbPromise;
  }

  async function mediaStore(mode, action) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, mode);
      const store = tx.objectStore(DB_STORE);
      const request = action(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  const putBlob = (id, blob) => mediaStore("readwrite", (store) => store.put(blob, id));
  const getBlob = (id) => mediaStore("readonly", (store) => store.get(id));
  const deleteBlob = (id) => mediaStore("readwrite", (store) => store.delete(id));

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2600);
  }

  function uid() {
    return `media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  }

  function autosizeTitle() {
    title.style.height = "auto";
    title.style.height = `${Math.max(title.scrollHeight, 64)}px`;
    breadcrumbTitle.textContent = title.value.trim() || "제목 없음";
  }

  function rememberSelection() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount && editor.contains(selection.anchorNode)) {
      savedRange = selection.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    if (!savedRange) return false;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);
    return true;
  }

  function placeCaretAtEnd(node) {
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    savedRange = range.cloneRange();
  }

  function closeBlockMenu() {
    blockMenu.hidden = true;
    blockAddButton.setAttribute("aria-expanded", "false");
  }

  function openBlockMenu(anchor = blockAddButton) {
    rememberSelection();
    const rect = anchor.getBoundingClientRect();
    blockMenu.hidden = false;
    blockAddButton.setAttribute("aria-expanded", "true");
    const width = 310;
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
    const proposedTop = rect.bottom + 6;
    const top = Math.min(proposedTop, window.innerHeight - Math.min(500, blockMenu.scrollHeight) - 12);
    blockMenu.style.left = `${left}px`;
    blockMenu.style.top = `${Math.max(12, top)}px`;
    blockMenu.querySelector("button")?.focus();
  }

  function removeSlashTrigger() {
    restoreSelection();
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE && range.startOffset > 0 && node.textContent[range.startOffset - 1] === "/") {
      node.deleteData(range.startOffset - 1, 1);
      range.setStart(node, range.startOffset - 1);
      range.collapse(true);
    }
  }

  function insertNodeAtSelection(node) {
    editor.focus();
    if (!restoreSelection()) placeCaretAtEnd(editor);
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const block = range.startContainer.nodeType === Node.ELEMENT_NODE
      ? range.startContainer.closest?.("p, div, h2, blockquote")
      : range.startContainer.parentElement?.closest("p, div, h2, blockquote");
    if (block && editor.contains(block) && block !== editor && !block.classList.contains("media-block")) {
      block.insertAdjacentElement("afterend", node);
    } else {
      editor.append(node);
    }
    const paragraph = document.createElement("p");
    paragraph.innerHTML = "<br>";
    node.insertAdjacentElement("afterend", paragraph);
    placeCaretAtEnd(paragraph);
    scheduleSave();
  }

  function createMediaTools(kind) {
    const tools = document.createElement("div");
    tools.className = "media-tools";
    tools.setAttribute("contenteditable", "false");
    tools.innerHTML = `
      <select data-media-action="align" aria-label="미디어 정렬">
        <option value="left">왼쪽</option><option value="center" selected>가운데</option><option value="right">오른쪽</option>
      </select>
      <select data-media-action="width" aria-label="미디어 크기">
        <option value="small">작게</option><option value="wide" selected>넓게</option><option value="full">전체</option>
      </select>
      ${kind === "image" ? '<button type="button" data-media-action="alt">ALT</button>' : ""}
      <button type="button" data-media-action="replace">교체</button>
      <button type="button" data-media-action="delete">삭제</button>`;
    return tools;
  }

  function createMediaBlock({ kind, id = "", src = "", url = "", name = "", alt = "" }) {
    const figure = document.createElement("figure");
    figure.className = "media-block";
    figure.setAttribute("contenteditable", "false");
    figure.dataset.kind = kind;
    figure.dataset.width = "wide";
    figure.dataset.align = "center";
    if (id) figure.dataset.mediaId = id;
    if (url) figure.dataset.embedUrl = url;
    if (name) figure.dataset.fileName = name;

    figure.append(createMediaTools(kind));
    const surface = document.createElement("div");
    surface.className = "media-surface";

    if (kind === "image") {
      const image = document.createElement("img");
      image.src = src || url;
      image.alt = alt;
      image.loading = "lazy";
      surface.append(image);
    } else {
      const embed = toVideoEmbed(url);
      if (embed) {
        const frame = document.createElement("iframe");
        frame.src = embed;
        frame.title = name || "삽입된 동영상";
        frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        frame.allowFullscreen = true;
        surface.append(frame);
      } else if (src || looksLikeVideoFile(url)) {
        const video = document.createElement("video");
        video.src = src || url;
        video.controls = true;
        video.preload = "metadata";
        surface.append(video);
      } else {
        const link = document.createElement("a");
        link.className = "embed-fallback";
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = url || "동영상 링크";
        surface.append(link);
      }
    }

    figure.append(surface);
    if (alt) addAltChip(figure);
    const caption = document.createElement("figcaption");
    caption.className = "media-caption";
    caption.contentEditable = "true";
    caption.dataset.placeholder = "캡션을 입력하세요";
    caption.setAttribute("aria-label", "미디어 캡션");
    figure.append(caption);
    return figure;
  }

  function addAltChip(figure) {
    figure.querySelector(".alt-chip")?.remove();
    const chip = document.createElement("span");
    chip.className = "alt-chip";
    chip.textContent = "ALT";
    chip.title = figure.querySelector("img")?.alt || "";
    figure.querySelector(".media-surface")?.append(chip);
  }

  function toVideoEmbed(value) {
    if (!value) return "";
    try {
      const parsed = new URL(value);
      const host = parsed.hostname.replace(/^www\./, "");
      if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(parsed.pathname.slice(1))}`;
      if (host.endsWith("youtube.com")) {
        const id = parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).pop();
        return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : "";
      }
      if (host.endsWith("vimeo.com")) {
        const id = parsed.pathname.split("/").filter(Boolean).pop();
        return /^\d+$/.test(id || "") ? `https://player.vimeo.com/video/${id}` : "";
      }
    } catch (_) { return ""; }
    return "";
  }

  function looksLikeVideoFile(value) {
    return /\.(mp4|webm|mov|m4v|ogv)(?:[?#].*)?$/i.test(value || "");
  }

  async function addFiles(files, kind, replace = false) {
    const allowed = Array.from(files).filter((file) => file.type.startsWith(`${kind}/`));
    if (!allowed.length) return showToast(kind === "image" ? "이미지 파일을 선택해 주세요." : "동영상 파일을 선택해 주세요.");
    const max = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    for (const file of allowed) {
      if (file.size > max) {
        showToast(`${file.name} 파일이 허용 크기를 초과했습니다.`);
        continue;
      }
      if (replace && replaceTarget) {
        const currentId = replaceTarget.dataset.mediaId || uid();
        await putBlob(currentId, file);
        replaceTarget.dataset.mediaId = currentId;
        replaceTarget.dataset.fileName = file.name;
        replaceTarget.dataset.embedUrl = "";
        const media = replaceTarget.querySelector("img, video");
        if (media) {
          if (media.dataset.objectUrl) URL.revokeObjectURL(media.dataset.objectUrl);
          const objectUrl = URL.createObjectURL(file);
          media.src = objectUrl;
          media.dataset.objectUrl = objectUrl;
        }
        showToast("미디어를 교체했습니다.");
        scheduleSave();
        replaceTarget = null;
        break;
      }
      const id = uid();
      await putBlob(id, file);
      const objectUrl = URL.createObjectURL(file);
      const block = createMediaBlock({ kind, id, src: objectUrl, name: file.name });
      block.querySelector("img, video").dataset.objectUrl = objectUrl;
      insertNodeAtSelection(block);
    }
    mediaDialog.close();
    imageInput.value = "";
    videoInput.value = "";
    replaceImageInput.value = "";
    replaceVideoInput.value = "";
  }

  function addMediaUrl(kind, value) {
    let parsed;
    try { parsed = new URL(value); } catch (_) { showToast("올바른 https:// 링크를 입력해 주세요."); return; }
    if (!["http:", "https:"].includes(parsed.protocol)) return showToast("웹 링크만 삽입할 수 있습니다.");
    const block = createMediaBlock({ kind, url: parsed.href, name: kind === "image" ? "링크 이미지" : "삽입된 동영상" });
    insertNodeAtSelection(block);
    mediaDialog.close();
    mediaUrl.value = "";
    showToast(kind === "image" ? "이미지 링크를 삽입했습니다." : "동영상 링크를 삽입했습니다.");
  }

  function selectBlock(block) {
    document.querySelectorAll(".media-block.is-selected").forEach((node) => node.classList.remove("is-selected"));
    selectedBlock = block || null;
    selectedBlock?.classList.add("is-selected");
  }

  function openMediaDialog(kind) {
    rememberSelection();
    pendingKind = kind;
    mediaDialogTitle.textContent = kind === "image" ? "이미지 추가" : "동영상 추가";
    uploadHelp.textContent = kind === "image" ? "JPG, PNG, GIF, WEBP · 파일당 20MB" : "MP4, WEBM, MOV · 파일당 200MB";
    document.querySelector("#uploadTab").click();
    mediaDialog.showModal();
  }

  function chooseCommand(command) {
    removeSlashTrigger();
    closeBlockMenu();
    if (command === "image" || command === "video") return openMediaDialog(command);
    editor.focus();
    restoreSelection();
    if (command === "divider") {
      const line = document.createElement("hr");
      return insertNodeAtSelection(line);
    }
    const tag = command === "heading" ? "h2" : command === "quote" ? "blockquote" : "p";
    document.execCommand("formatBlock", false, tag);
    scheduleSave();
  }

  function cleanEditorHtml() {
    const clone = editor.cloneNode(true);
    clone.querySelectorAll(".media-block").forEach((figure) => {
      figure.classList.remove("is-selected");
      figure.querySelector(".media-tools")?.remove();
      figure.querySelector(".alt-chip")?.remove();
      const media = figure.querySelector("img, video");
      if (figure.dataset.mediaId && media) {
        media.removeAttribute("src");
        media.removeAttribute("data-object-url");
      }
      figure.querySelectorAll("iframe").forEach((frame) => frame.removeAttribute("src"));
    });
    return clone.innerHTML;
  }

  function scheduleSave() {
    saveStatus.textContent = "저장 중…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDocument, 650);
  }

  function saveDocument() {
    const data = { title: title.value, board: board.value, html: cleanEditorHtml(), updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    saveStatus.textContent = "저장됨";
  }

  async function hydrateMedia() {
    const blocks = editor.querySelectorAll(".media-block");
    for (const figure of blocks) {
      const tools = createMediaTools(figure.dataset.kind);
      tools.querySelector('[data-media-action="align"]').value = figure.dataset.align || "center";
      tools.querySelector('[data-media-action="width"]').value = figure.dataset.width || "wide";
      figure.prepend(tools);
      const id = figure.dataset.mediaId;
      const url = figure.dataset.embedUrl;
      const media = figure.querySelector("img, video, iframe");
      if (id && media) {
        const blob = await getBlob(id).catch(() => null);
        if (blob) {
          const objectUrl = URL.createObjectURL(blob);
          media.src = objectUrl;
          media.dataset.objectUrl = objectUrl;
        }
      } else if (url && media) {
        media.src = media.tagName === "IFRAME" ? toVideoEmbed(url) : url;
      }
      if (figure.querySelector("img")?.alt) addAltChip(figure);
    }
  }

  async function restoreDocument() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!data) return;
      title.value = data.title || "";
      if (Array.from(board.options).some((option) => option.value === data.board)) board.value = data.board;
      if (data.html) editor.innerHTML = data.html;
      autosizeTitle();
      await hydrateMedia();
    } catch (_) {
      showToast("저장된 초안을 불러오지 못했습니다.");
    }
  }

  function buildPreview() {
    document.querySelector("#previewBoard").textContent = board.value;
    document.querySelector("#previewTitle").textContent = title.value.trim() || "제목 없음";
    const body = document.querySelector("#previewBody");
    body.innerHTML = editor.innerHTML;
    body.querySelectorAll(".media-tools").forEach((node) => node.remove());
    body.querySelectorAll(".media-caption").forEach((node) => node.contentEditable = "false");
    previewDialog.showModal();
  }

  title.addEventListener("input", () => { autosizeTitle(); scheduleSave(); });
  board.addEventListener("change", scheduleSave);
  editor.addEventListener("input", (event) => {
    editor.querySelectorAll(".starter-block").forEach((block) => {
      if (block.textContent.trim()) block.classList.remove("starter-block");
    });
    rememberSelection();
    scheduleSave();
    if (event.inputType === "insertText" && event.data === "/") {
      const selection = window.getSelection();
      if (selection?.rangeCount) {
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        openBlockMenu({ getBoundingClientRect: () => ({ left: rect.left || 24, bottom: rect.bottom || 120 }) });
      }
    }
  });
  editor.addEventListener("keyup", rememberSelection);
  editor.addEventListener("mouseup", rememberSelection);
  editor.addEventListener("click", (event) => {
    const block = event.target.closest(".media-block");
    selectBlock(block);
  });
  editor.addEventListener("focusout", (event) => {
    if (event.target.classList.contains("media-caption")) scheduleSave();
  });
  editor.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeBlockMenu();
  });
  editor.addEventListener("dragover", (event) => {
    if (Array.from(event.dataTransfer?.items || []).some((item) => item.kind === "file")) event.preventDefault();
  });
  editor.addEventListener("drop", async (event) => {
    const files = Array.from(event.dataTransfer?.files || []);
    if (!files.length) return;
    event.preventDefault();
    const point = document.caretRangeFromPoint?.(event.clientX, event.clientY);
    if (point) savedRange = point;
    await addFiles(files.filter((file) => file.type.startsWith("image/")), "image");
    await addFiles(files.filter((file) => file.type.startsWith("video/")), "video");
  });
  editor.addEventListener("paste", async (event) => {
    const files = Array.from(event.clipboardData?.files || []);
    if (!files.length) return;
    event.preventDefault();
    rememberSelection();
    await addFiles(files.filter((file) => file.type.startsWith("image/")), "image");
    await addFiles(files.filter((file) => file.type.startsWith("video/")), "video");
  });

  blockAddButton.addEventListener("click", () => blockMenu.hidden ? openBlockMenu(blockAddButton) : closeBlockMenu());
  blockMenu.addEventListener("click", (event) => {
    const item = event.target.closest("[data-command]");
    if (item) chooseCommand(item.dataset.command);
  });
  blockMenu.addEventListener("keydown", (event) => {
    const items = Array.from(blockMenu.querySelectorAll("button"));
    const index = items.indexOf(document.activeElement);
    if (event.key === "ArrowDown") { event.preventDefault(); items[(index + 1) % items.length].focus(); }
    if (event.key === "ArrowUp") { event.preventDefault(); items[(index - 1 + items.length) % items.length].focus(); }
    if (event.key === "Escape") { closeBlockMenu(); editor.focus(); }
  });

  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "add-image") openMediaDialog("image");
    if (action === "add-video") openMediaDialog("video");
    if (action === "preview") buildPreview();
    if (action === "close-preview") previewDialog.close();
    if (action === "publish") {
      saveDocument();
      showToast("이 브라우저에 임시 저장했습니다. 실제 게시 연동은 다음 단계입니다.");
    }
    if (!event.target.closest("#blockMenu, #blockAddButton") && !blockMenu.hidden) closeBlockMenu();
  });

  document.querySelectorAll("[data-tab]").forEach((tab) => tab.addEventListener("click", () => {
    const isUpload = tab.dataset.tab === "upload";
    document.querySelector("#uploadTab").setAttribute("aria-selected", String(isUpload));
    document.querySelector("#linkTab").setAttribute("aria-selected", String(!isUpload));
    document.querySelector("#uploadPanel").hidden = !isUpload;
    document.querySelector("#linkPanel").hidden = isUpload;
    if (!isUpload) setTimeout(() => mediaUrl.focus(), 0);
  }));
  document.querySelector("#dialogUploadButton").addEventListener("click", () => (pendingKind === "image" ? imageInput : videoInput).click());
  document.querySelector("#embedButton").addEventListener("click", () => addMediaUrl(pendingKind, mediaUrl.value.trim()));
  mediaUrl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); addMediaUrl(pendingKind, mediaUrl.value.trim()); }
  });

  imageInput.addEventListener("change", () => addFiles(imageInput.files, "image"));
  videoInput.addEventListener("change", () => addFiles(videoInput.files, "video"));
  replaceImageInput.addEventListener("change", () => addFiles(replaceImageInput.files, "image", true));
  replaceVideoInput.addEventListener("change", () => addFiles(replaceVideoInput.files, "video", true));

  editor.addEventListener("change", (event) => {
    const control = event.target.closest("[data-media-action]");
    const figure = control?.closest(".media-block");
    if (!figure) return;
    if (control.dataset.mediaAction === "align") figure.dataset.align = control.value;
    if (control.dataset.mediaAction === "width") figure.dataset.width = control.value;
    scheduleSave();
  });
  editor.addEventListener("click", async (event) => {
    const control = event.target.closest("button[data-media-action]");
    const figure = control?.closest(".media-block");
    if (!figure) return;
    const action = control.dataset.mediaAction;
    if (action === "delete") {
      const id = figure.dataset.mediaId;
      if (id) await deleteBlob(id).catch(() => {});
      figure.querySelectorAll("[data-object-url]").forEach((media) => URL.revokeObjectURL(media.dataset.objectUrl));
      figure.remove();
      selectedBlock = null;
      scheduleSave();
      showToast("미디어 블록을 삭제했습니다.");
    }
    if (action === "replace") {
      replaceTarget = figure;
      (figure.dataset.kind === "image" ? replaceImageInput : replaceVideoInput).click();
    }
    if (action === "alt") {
      selectedBlock = figure;
      altText.value = figure.querySelector("img")?.alt || "";
      altDialog.showModal();
      setTimeout(() => altText.focus(), 0);
    }
  });
  document.querySelector("#saveAltButton").addEventListener("click", () => {
    const image = selectedBlock?.querySelector("img");
    if (!image) return altDialog.close();
    image.alt = altText.value.trim();
    if (image.alt) addAltChip(selectedBlock); else selectedBlock.querySelector(".alt-chip")?.remove();
    altDialog.close();
    scheduleSave();
    showToast("대체 텍스트를 저장했습니다.");
  });

  window.addEventListener("scroll", () => document.querySelector(".topbar").classList.toggle("scrolled", window.scrollY > 2), { passive: true });
  window.addEventListener("beforeunload", saveDocument);

  restoreDocument();
  autosizeTitle();
})();
