(() => {
  "use strict";

  const STORAGE_KEY = "bbm.notion-write.v1";
  const FEED_POST_KEY = "bbm.community.latestPost.v2";
  const FEED_URL = "./naver-cafe-list.html?view=naver-discussion&board=car-news";
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
  const cameraImageInput = document.querySelector("#cameraImageInput");
  const fileImageInput = document.querySelector("#fileImageInput");
  const videoInput = document.querySelector("#videoInput");
  const replaceImageInput = document.querySelector("#replaceImageInput");
  const replaceVideoInput = document.querySelector("#replaceVideoInput");
  const mediaDialog = document.querySelector("#mediaDialog");
  const mediaManagerDialog = document.querySelector("#mediaManagerDialog");
  const mediaManagerGrid = document.querySelector("#mediaManagerGrid");
  const mediaManagerVideos = document.querySelector("#mediaManagerVideos");
  const mediaManagerSummary = document.querySelector("#mediaManagerSummary");
  const completeMediaManager = document.querySelector("#completeMediaManager");
  const insertManagedMedia = document.querySelector("#insertManagedMedia");
  const mediaDialogDesktopTitle = document.querySelector("#mediaDialogDesktopTitle");
  const mediaDialogMobileTitle = document.querySelector("#mediaDialogMobileTitle");
  const uploadHelp = document.querySelector("#uploadHelp");
  const mediaUrl = document.querySelector("#mediaUrl");
  const embedDialog = document.querySelector("#embedDialog");
  const embedUrl = document.querySelector("#embedUrl");
  const textToolbar = document.querySelector("#textToolbar");
  const selectionBlockType = document.querySelector("#selectionBlockType");
  const linkDialog = document.querySelector("#linkDialog");
  const textLinkUrl = document.querySelector("#textLinkUrl");
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
  let menuTargetBlock = null;
  let mediaQueue = [];
  let mediaCoverId = "";
  let draggedMediaId = "";
  let pointerMediaDrag = null;

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
    try {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRange);
      return true;
    } catch (_) {
      savedRange = null;
      return false;
    }
  }

  function selectionBlock(range = savedRange) {
    if (!range) return null;
    let node = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;
    if (node === editor) {
      const offset = Math.min(Math.max(range.startOffset - 1, 0), editor.childNodes.length - 1);
      const candidate = editor.childNodes[offset];
      node = candidate?.nodeType === Node.ELEMENT_NODE ? candidate : candidate?.parentElement;
    }
    const block = node?.closest?.("p, h1, h2, h3, blockquote, li, pre, .todo-block");
    return block && editor.contains(block) ? block : null;
  }

  function hideTextToolbar() {
    textToolbar.hidden = true;
  }

  function updateTextToolbar() {
    const selection = window.getSelection();
    if (!selection?.rangeCount || selection.isCollapsed || !editor.contains(selection.anchorNode) || !editor.contains(selection.focusNode)) {
      hideTextToolbar();
      return;
    }
    const range = selection.getRangeAt(0);
    if (range.commonAncestorContainer.parentElement?.closest(".media-tools")) return hideTextToolbar();
    savedRange = range.cloneRange();
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) return hideTextToolbar();
    const block = selectionBlock(range);
    const tag = block?.tagName?.toLowerCase();
    selectionBlockType.value = ["h1", "h2", "h3", "blockquote"].includes(tag) ? tag : "p";
    ["bold", "italic", "strikeThrough"].forEach((command) => {
      const button = textToolbar.querySelector(`[data-format="${command}"]`);
      button?.setAttribute("aria-pressed", String(document.queryCommandState(command)));
    });
    textToolbar.hidden = false;
    const width = textToolbar.offsetWidth;
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 12);
    const top = rect.top > 56 ? rect.top - textToolbar.offsetHeight - 8 : rect.bottom + 8;
    textToolbar.style.left = `${left}px`;
    textToolbar.style.top = `${top}px`;
  }

  function placeCaretAtEnd(node) {
    const range = document.createRange();
    if (node.lastChild?.nodeName === "BR") {
      range.setStart(node, Math.max(0, node.childNodes.length - 1));
      range.collapse(true);
    } else {
      range.selectNodeContents(node);
      range.collapse(false);
    }
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
    menuTargetBlock = selectionBlock();
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

  function removeTrailingSlash(block) {
    if (!block) return;
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    let textNode = null;
    while (walker.nextNode()) textNode = walker.currentNode;
    const slashIndex = textNode?.data.lastIndexOf("/") ?? -1;
    if (slashIndex >= 0) textNode.deleteData(slashIndex, 1);
    if (!block.textContent.trim()) block.innerHTML = "<br>";
  }

  function insertNodeAtSelection(node) {
    editor.focus();
    if (!restoreSelection()) placeCaretAtEnd(editor);
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    let block = range.startContainer.nodeType === Node.ELEMENT_NODE
      ? range.startContainer.closest?.("p, div, h1, h2, h3, blockquote, li, pre")
      : range.startContainer.parentElement?.closest("p, div, h1, h2, h3, blockquote, li, pre");
    if (block?.matches("li")) block = block.closest("ul, ol");
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

  function createTodoBlock(text = "") {
    const todo = document.createElement("div");
    todo.className = "todo-block";
    todo.setAttribute("contenteditable", "false");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.setAttribute("aria-label", "할 일 완료");
    const content = document.createElement("span");
    content.contentEditable = "true";
    content.innerHTML = text ? escapeHtml(text) : "<br>";
    content.setAttribute("aria-label", "할 일 내용");
    todo.append(checkbox, content);
    return todo;
  }

  function createCodeBlock(text = "") {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.innerHTML = text ? escapeHtml(text) : "<br>";
    pre.append(code);
    return pre;
  }

  function replaceOrInsertTextBlock(node, focusTarget = node, targetBlock = null) {
    const current = targetBlock?.isConnected ? targetBlock : selectionBlock();
    if (current && !current.closest(".media-block") && !current.textContent.trim()) current.replaceWith(node);
    else if (current && !current.closest(".media-block")) current.insertAdjacentElement("afterend", node);
    else {
      editor.focus();
      restoreSelection();
      editor.append(node);
    }
    placeCaretAtEnd(focusTarget);
    scheduleSave();
  }

  function applyBlockCommand(command, targetBlock = null) {
    const currentBlock = targetBlock?.isConnected ? targetBlock : selectionBlock();
    if (command === "bulleted-list" || command === "numbered-list") {
      if (currentBlock?.matches("p, h1, h2, h3, blockquote")) {
        const list = document.createElement(command === "bulleted-list" ? "ul" : "ol");
        const item = document.createElement("li");
        while (currentBlock.firstChild) item.append(currentBlock.firstChild);
        if (!item.textContent.trim()) item.innerHTML = "<br>";
        list.append(item);
        currentBlock.replaceWith(list);
        placeCaretAtEnd(item);
      } else {
        editor.focus();
        restoreSelection();
        document.execCommand(command === "bulleted-list" ? "insertUnorderedList" : "insertOrderedList", false);
      }
    }
    else if (command === "todo") {
      const todo = createTodoBlock();
      replaceOrInsertTextBlock(todo, todo.querySelector("span"), currentBlock);
      return;
    } else if (command === "code") {
      const codeBlock = createCodeBlock();
      replaceOrInsertTextBlock(codeBlock, codeBlock.querySelector("code"), currentBlock);
      return;
    } else {
      const formats = { text: "p", heading1: "h1", heading2: "h2", heading3: "h3", quote: "blockquote" };
      const tag = formats[command] || "p";
      const current = currentBlock;
      if (current?.matches("p, h1, h2, h3, blockquote")) {
        if (current.tagName.toLowerCase() !== tag) {
          const replacement = document.createElement(tag);
          while (current.firstChild) replacement.append(current.firstChild);
          current.replaceWith(replacement);
          placeCaretAtEnd(replacement);
        }
      } else {
        editor.focus();
        restoreSelection();
        document.execCommand("formatBlock", false, tag);
      }
    }
    scheduleSave();
  }

  function applyInlineFormat(command) {
    editor.focus();
    if (!restoreSelection()) return;
    if (command === "link") {
      textLinkUrl.value = "";
      linkDialog.showModal();
      setTimeout(() => textLinkUrl.focus(), 0);
      return;
    }
    if (command === "inline-code") {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      if (range.collapsed) return;
      const code = document.createElement("code");
      try {
        range.surroundContents(code);
      } catch (_) {
        code.append(range.extractContents());
        range.insertNode(code);
      }
      selection.removeAllRanges();
      const nextRange = document.createRange();
      nextRange.selectNodeContents(code);
      selection.addRange(nextRange);
      savedRange = nextRange.cloneRange();
    } else {
      document.execCommand(command, false);
    }
    scheduleSave();
    setTimeout(updateTextToolbar, 0);
  }

  function saveTextLink() {
    let parsed;
    try { parsed = new URL(textLinkUrl.value.trim()); } catch (_) { return showToast("올바른 웹주소를 입력해 주세요."); }
    if (!["http:", "https:"].includes(parsed.protocol)) return showToast("http:// 또는 https:// 주소만 연결할 수 있습니다.");
    linkDialog.close();
    editor.focus();
    if (!restoreSelection()) return;
    document.execCommand("createLink", false, parsed.href);
    editor.querySelectorAll(`a[href="${CSS.escape(parsed.href)}"]`).forEach((anchor) => {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    });
    scheduleSave();
    hideTextToolbar();
    showToast("선택한 텍스트에 링크를 연결했습니다.");
  }

  function applyMarkdownShortcut(event) {
    if (event.key !== " " || event.ctrlKey || event.metaKey || event.altKey) return false;
    const selection = window.getSelection();
    if (!selection?.rangeCount || !selection.isCollapsed || !editor.contains(selection.anchorNode)) return false;
    const range = selection.getRangeAt(0);
    const block = selectionBlock(range);
    if (!block || block.closest(".media-block") || block.matches("li, pre, .todo-block")) return false;
    const before = document.createRange();
    before.selectNodeContents(block);
    before.setEnd(range.startContainer, range.startOffset);
    const marker = before.toString();
    const command = ({ "#": "heading1", "##": "heading2", "###": "heading3", "-": "bulleted-list", "*": "bulleted-list", "+": "bulleted-list", "1.": "numbered-list", "[]": "todo", ">": "quote", '"': "quote", "```": "code" })[marker];
    if (!command) return false;
    event.preventDefault();
    block.innerHTML = "<br>";
    placeCaretAtEnd(block);
    applyBlockCommand(command);
    return true;
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
      ${kind === "embed" ? `<select data-media-action="height" aria-label="임베드 높이">
        <option value="compact">낮게</option><option value="standard" selected>기본 높이</option><option value="tall">높게</option>
      </select>` : ""}
      ${kind === "image" ? '<button type="button" data-media-action="alt">ALT</button>' : ""}
      ${kind === "embed" ? '<button type="button" data-media-action="original">원본</button>' : ""}
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

  function getEmbedInfo(value, mode = "auto") {
    let parsed;
    try { parsed = new URL(value); } catch (_) { return null; }
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const fallback = { url: parsed.href, src: "", provider: host, title: host, mode: "bookmark", requestedMode: mode };
    if (mode === "bookmark") return fallback;

    const videoSrc = toVideoEmbed(parsed.href);
    if (videoSrc) {
      return { ...fallback, src: videoSrc, provider: host.includes("vimeo") ? "Vimeo" : "YouTube", title: "동영상 임베드", mode: "embed" };
    }

    if (host === "open.spotify.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) return { ...fallback, src: `https://open.spotify.com/embed/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}`, provider: "Spotify", title: "Spotify 임베드", mode: "embed", compact: true };
    }
    if (host === "soundcloud.com" || host.endsWith(".soundcloud.com")) {
      return { ...fallback, src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(parsed.href)}&auto_play=false&show_comments=false`, provider: "SoundCloud", title: "SoundCloud 임베드", mode: "embed", compact: true };
    }
    if (host === "codepen.io") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const typeIndex = parts.findIndex((part) => part === "pen" || part === "details");
      if (typeIndex > 0 && parts[typeIndex + 1]) {
        const ownerPath = parts.slice(0, typeIndex).map(encodeURIComponent).join("/");
        return { ...fallback, src: `https://codepen.io/${ownerPath}/embed/${encodeURIComponent(parts[typeIndex + 1])}`, provider: "CodePen", title: "CodePen 임베드", mode: "embed" };
      }
    }
    if (host === "figma.com" || host.endsWith(".figma.com")) {
      return { ...fallback, src: `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(parsed.href)}`, provider: "Figma", title: "Figma 임베드", mode: "embed", tall: true };
    }
    if ((host === "google.com" || host.endsWith(".google.com")) && parsed.pathname.includes("/maps/embed")) {
      return { ...fallback, src: parsed.href, provider: "Google Maps", title: "Google 지도 임베드", mode: "embed", tall: true };
    }
    if (host === "docs.google.com" && /\/(presentation|spreadsheets|forms)\//.test(parsed.pathname)) {
      const source = parsed.href.replace(/\/(edit|view)(?:\?.*)?$/, "/preview");
      return { ...fallback, src: source, provider: "Google", title: "Google 문서 임베드", mode: "embed", tall: true };
    }
    if (/(^|\.)reddit\.com$/.test(host)) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const at = parts.indexOf("comments");
      if (parts[0] === "r" && parts[1] && at > 1 && parts[at + 1]) {
        const slug = parts[at + 2] ? `${encodeURIComponent(parts[at + 2])}/` : "";
        return { ...fallback, src: `https://embed.reddit.com/r/${encodeURIComponent(parts[1])}/comments/${encodeURIComponent(parts[at + 1])}/${slug}?embed=true&theme=light&showmedia=true&showmore=false`, provider: "Reddit", title: "Reddit 게시물", mode: "embed", tall: true };
      }
    }
    if (/(^|\.)(player|embed)\./.test(host) || /\/(embed|player)(\/|$)/.test(parsed.pathname)) {
      return { ...fallback, src: parsed.href, provider: host, title: "웹 콘텐츠 임베드", mode: "embed" };
    }
    // 뉴스·블로그 등 임베드를 막은 사이트: 노션 북마크처럼 제목·요약·대표 이미지 카드로 보여 준다
    return { ...fallback, mode: "preview" };
  }

  /* 링크 미리보기 카드(노션 북마크형). 메타데이터는 microlink 공개 API에서 받아 figure 에 저장한다. */
  const previewCache = new Map();
  function fetchPreviewMeta(url) {
    if (previewCache.has(url)) return previewCache.get(url);
    const task = fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((json) => {
        const data = json && json.status === "success" ? json.data || {} : {};
        return {
          title: data.title || "",
          description: data.description || "",
          image: data.image?.url || "",
          site: data.publisher || "",
          logo: data.logo?.url || "",
          lang: data.lang || "",
        };
      })
      .catch(() => ({}));
    previewCache.set(url, task);
    return task;
  }
  function renderPreviewCard(card, url, meta) {
    let host = url;
    try { host = new URL(url).hostname.replace(/^www\./, ""); } catch (_) {}
    const overseas = meta.lang && !/^ko/i.test(meta.lang);
    card.replaceChildren();
    if (meta.image) {
      const media = document.createElement("span");
      media.className = "news-card-image";
      const img = document.createElement("img");
      img.src = meta.image;
      img.alt = "";
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.addEventListener("error", () => media.remove());
      media.append(img);
      card.append(media);
    }
    const copy = document.createElement("span");
    copy.className = "news-card-copy";
    const site = document.createElement("span");
    site.className = "news-card-site";
    if (meta.logo) {
      const logo = document.createElement("img");
      logo.src = meta.logo;
      logo.alt = "";
      logo.referrerPolicy = "no-referrer";
      logo.addEventListener("error", () => logo.remove());
      site.append(logo);
    }
    const siteName = document.createElement("span");
    siteName.textContent = meta.site || host;
    site.append(siteName);
    if (overseas) {
      const badge = document.createElement("em");
      badge.textContent = "해외";
      site.append(badge);
    }
    const heading = document.createElement("strong");
    heading.className = "news-card-title";
    heading.textContent = meta.title || host;
    copy.append(site, heading);
    if (meta.description) {
      const description = document.createElement("span");
      description.className = "news-card-desc";
      description.textContent = meta.description;
      copy.append(description);
    }
    const address = document.createElement("small");
    address.className = "news-card-url";
    address.textContent = host;
    copy.append(address);
    card.append(copy);
  }
  function applyPreviewMeta(figure, meta) {
    figure.dataset.metaTitle = meta.title || "";
    figure.dataset.metaDescription = meta.description || "";
    figure.dataset.metaImage = meta.image || "";
    figure.dataset.metaSite = meta.site || "";
    figure.dataset.metaLogo = meta.logo || "";
    figure.dataset.metaLang = meta.lang || "";
    figure.classList.remove("is-loading");
    const card = figure.querySelector(".news-card");
    if (card) renderPreviewCard(card, figure.dataset.embedUrl, meta);
  }
  function metaFromFigure(figure) {
    return {
      title: figure.dataset.metaTitle || "",
      description: figure.dataset.metaDescription || "",
      image: figure.dataset.metaImage || "",
      site: figure.dataset.metaSite || "",
      logo: figure.dataset.metaLogo || "",
      lang: figure.dataset.metaLang || "",
    };
  }

  function createEmbedBlock(info) {
    const figure = document.createElement("figure");
    figure.className = "media-block embed-block";
    figure.setAttribute("contenteditable", "false");
    figure.dataset.kind = "embed";
    figure.dataset.width = "wide";
    figure.dataset.align = "center";
    figure.dataset.height = info.tall ? "tall" : info.compact ? "compact" : "standard";
    figure.dataset.embedUrl = info.url;
    figure.dataset.embedMode = info.requestedMode || info.mode;
    figure.dataset.embedRender = info.mode;
    figure.dataset.provider = info.provider;
    const tools = createMediaTools("embed");
    tools.querySelector('[data-media-action="height"]').value = figure.dataset.height;
    figure.append(tools);

    const surface = document.createElement("div");
    surface.className = "media-surface";
    if (info.mode === "preview") {
      figure.classList.add("is-loading");
      const card = document.createElement("a");
      card.className = "news-card";
      card.href = info.url;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      renderPreviewCard(card, info.url, { title: "미리보기를 불러오는 중…" });
      surface.append(card);
      fetchPreviewMeta(info.url).then((meta) => {
        applyPreviewMeta(figure, meta || {});
        scheduleSave();
      });
    } else if (info.src) {
      const frame = document.createElement("iframe");
      frame.src = info.src;
      frame.title = info.title;
      frame.loading = "lazy";
      frame.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share";
      frame.allowFullscreen = true;
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      frame.setAttribute("sandbox", "allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts");
      surface.append(frame);
    } else {
      const card = document.createElement("a");
      card.className = "embed-card";
      card.href = info.url;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      const mark = document.createElement("span");
      mark.className = "embed-card-mark";
      mark.textContent = (info.provider || "W").slice(0, 1);
      const copy = document.createElement("span");
      copy.className = "embed-card-copy";
      const label = document.createElement("strong");
      label.textContent = info.title || info.provider;
      const address = document.createElement("small");
      address.textContent = info.url;
      copy.append(label, address);
      const open = document.createElement("span");
      open.className = "embed-card-open";
      open.textContent = "원본 열기";
      card.append(mark, copy, open);
      surface.append(card);
    }
    figure.append(surface);
    const caption = document.createElement("figcaption");
    caption.className = "media-caption";
    caption.contentEditable = "true";
    caption.dataset.placeholder = "임베드 설명을 입력하세요";
    caption.setAttribute("aria-label", "임베드 설명");
    figure.append(caption);
    return figure;
  }

  function isMobileMediaFlow() {
    return window.matchMedia("(max-width: 720px)").matches;
  }

  function renderMediaManager() {
    const images = mediaQueue.filter((item) => item.kind === "image");
    const videos = mediaQueue.filter((item) => item.kind === "video");
    mediaManagerGrid.innerHTML = images.map((item, index) => {
      const uploading = item.status === "uploading";
      const failed = item.status === "error";
      const cover = item.id === mediaCoverId;
      const status = uploading ? `업로드 ${item.progress}%` : "";
      return `<article class="media-manager-tile${cover ? " is-cover" : ""}${failed ? " is-error" : ""}" draggable="${!uploading && !failed}" data-media-queue-id="${escapeHtml(item.id)}">
        <button class="media-manager-cover-button" type="button" data-manager-action="cover" aria-label="대표 사진으로 설정: ${escapeHtml(item.name)}">
          <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.name)}" />
        </button>
        <span class="media-manager-order" aria-hidden="true">${index + 1}</span>
        ${cover ? '<span class="media-manager-cover-badge">대표</span>' : ""}
        ${!uploading && !failed ? '<button class="media-manager-drag" type="button" data-manager-action="drag" aria-label="순서 변경. 방향키로 이동">⠿</button>' : ""}
        <button class="media-manager-remove" type="button" data-manager-action="remove" aria-label="${escapeHtml(item.name)} 삭제">×</button>
        ${uploading ? `<div class="media-manager-status"><span>${status}</span><div class="media-manager-progress"><span style="width:${item.progress}%"></span></div></div>` : ""}
        ${failed ? '<button class="media-manager-retry" type="button" data-manager-action="retry"><span aria-hidden="true">↻</span><span>다시 올리기</span></button>' : ""}
      </article>`;
    }).join("") + `<button class="media-manager-add" type="button" data-manager-action="add-image"><strong aria-hidden="true">＋</strong><span>사진 추가</span></button>`;

    mediaManagerVideos.innerHTML = videos.length ? videos.map((item) => {
      const state = item.status === "uploading" ? `업로드 중 ${item.progress}%` : item.status === "error" ? "업로드 실패 · 다시 시도 필요" : "업로드 완료";
      return `<article class="media-manager-video" data-media-queue-id="${escapeHtml(item.id)}">
        <div class="media-manager-video-preview" aria-hidden="true">▶</div>
        <div class="media-manager-video-copy"><strong>${escapeHtml(item.name)}</strong><small>${state}</small></div>
        <div class="media-manager-video-actions">
          ${item.status === "error" ? '<button class="media-manager-video-remove" type="button" data-manager-action="retry" aria-label="동영상 다시 올리기">↻</button>' : ""}
          <button class="media-manager-video-remove" type="button" data-manager-action="remove" aria-label="동영상 삭제">×</button>
        </div>
      </article>`;
    }).join("") : '<p class="media-manager-empty-video">추가한 동영상이 없습니다.</p>';

    const hasPending = mediaQueue.some((item) => item.status === "uploading");
    const hasError = mediaQueue.some((item) => item.status === "error");
    const disabled = !mediaQueue.length || hasPending || hasError;
    completeMediaManager.disabled = disabled;
    insertManagedMedia.disabled = disabled;
    mediaManagerSummary.textContent = !mediaQueue.length
      ? "첨부한 미디어가 없습니다."
      : `사진 ${images.length}장 · 동영상 ${videos.length}개${hasPending ? " · 업로드 중" : hasError ? " · 실패 항목을 확인해 주세요" : " · 업로드 완료"}`;
  }

  function openMediaManager() {
    if (mediaDialog.open) mediaDialog.close();
    renderMediaManager();
    if (!mediaManagerDialog.open) {
      mediaManagerDialog.showModal();
      mediaManagerDialog.focus();
    }
  }

  async function uploadQueuedMedia(item) {
    item.status = "uploading";
    item.progress = 8;
    renderMediaManager();
    const progressTimer = setInterval(() => {
      if (item.status !== "uploading") return;
      item.progress = Math.min(88, item.progress + Math.ceil(Math.random() * 13));
      renderMediaManager();
    }, 90);
    try {
      await Promise.all([
        putBlob(item.id, item.file),
        new Promise((resolve) => setTimeout(resolve, 320)),
      ]);
      item.persisted = true;
      if (!mediaQueue.includes(item)) {
        await deleteBlob(item.id).catch(() => {});
        if (item.src.startsWith("blob:")) URL.revokeObjectURL(item.src);
        return;
      }
      item.progress = 100;
      item.status = "done";
    } catch (_) {
      item.status = "error";
      item.progress = 0;
    } finally {
      clearInterval(progressTimer);
      renderMediaManager();
    }
  }

  function enqueueManagedFiles(files, kind) {
    const max = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    const allowed = Array.from(files).filter((file) => file.type.startsWith(`${kind}/`));
    if (!allowed.length) {
      showToast(kind === "image" ? "이미지 파일을 선택해 주세요." : "동영상 파일을 선택해 주세요.");
      return;
    }
    allowed.forEach((file) => {
      if (file.size > max) {
        showToast(`${file.name} 파일이 허용 크기를 초과했습니다.`);
        return;
      }
      const item = { id: uid(), kind, file, name: file.name, src: URL.createObjectURL(file), status: "uploading", progress: 0, persisted: false };
      mediaQueue.push(item);
      if (kind === "image" && !mediaCoverId) mediaCoverId = item.id;
      uploadQueuedMedia(item);
    });
    openMediaManager();
  }

  async function removeQueuedMedia(id) {
    const item = mediaQueue.find((candidate) => candidate.id === id);
    if (!item) return;
    mediaQueue = mediaQueue.filter((candidate) => candidate.id !== id);
    if (item.persisted) await deleteBlob(item.id).catch(() => {});
    if (item.src.startsWith("blob:")) URL.revokeObjectURL(item.src);
    if (mediaCoverId === id) mediaCoverId = mediaQueue.find((candidate) => candidate.kind === "image")?.id || "";
    renderMediaManager();
  }

  function selectMediaCover(id) {
    const index = mediaQueue.findIndex((item) => item.id === id && item.kind === "image");
    if (index < 0) return;
    const [item] = mediaQueue.splice(index, 1);
    const firstImageIndex = mediaQueue.findIndex((candidate) => candidate.kind === "image");
    mediaQueue.splice(firstImageIndex < 0 ? 0 : firstImageIndex, 0, item);
    mediaCoverId = id;
    renderMediaManager();
  }

  function reorderMedia(sourceId, targetId) {
    const sourceIndex = mediaQueue.findIndex((item) => item.id === sourceId);
    const targetIndex = mediaQueue.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;
    if (mediaQueue[sourceIndex].kind !== mediaQueue[targetIndex].kind) return;
    const [item] = mediaQueue.splice(sourceIndex, 1);
    mediaQueue.splice(targetIndex, 0, item);
    renderMediaManager();
  }

  function moveQueuedMedia(id, direction) {
    const sameKind = mediaQueue.filter((item) => item.kind === "image");
    const position = sameKind.findIndex((item) => item.id === id);
    const target = sameKind[position + direction];
    if (target) reorderMedia(id, target.id);
  }

  function pointerTargetMediaId(clientX, clientY) {
    const tile = document.elementFromPoint(clientX, clientY)?.closest?.("[data-media-queue-id]");
    const id = tile?.dataset.mediaQueueId || "";
    const source = mediaQueue.find((item) => item.id === pointerMediaDrag?.sourceId);
    const target = mediaQueue.find((item) => item.id === id);
    return source?.kind === "image" && target?.kind === "image" ? id : "";
  }

  function updatePointerMediaDrag(event) {
    if (!pointerMediaDrag || event.pointerId !== pointerMediaDrag.pointerId) return;
    event.preventDefault();
    const targetId = pointerTargetMediaId(event.clientX, event.clientY);
    if (!targetId || targetId === pointerMediaDrag.sourceId) return;
    pointerMediaDrag.targetId = targetId;
    mediaManagerGrid.querySelectorAll(".is-drop-target").forEach((tile) => tile.classList.remove("is-drop-target"));
    mediaManagerGrid.querySelector(`[data-media-queue-id="${targetId}"]`)?.classList.add("is-drop-target");
  }

  function finishPointerMediaDrag(event, cancelled = false) {
    if (!pointerMediaDrag || event.pointerId !== pointerMediaDrag.pointerId) return;
    event.preventDefault();
    const { sourceId, targetId, handle } = pointerMediaDrag;
    try { handle.releasePointerCapture?.(event.pointerId); } catch (_) { /* capture may already be released */ }
    pointerMediaDrag = null;
    draggedMediaId = "";
    mediaManagerGrid.classList.remove("is-reordering");
    mediaManagerGrid.querySelectorAll(".is-dragging, .is-drop-target").forEach((tile) => tile.classList.remove("is-dragging", "is-drop-target"));
    if (!cancelled && targetId && targetId !== sourceId) {
      reorderMedia(sourceId, targetId);
      showToast("사진 순서를 변경했습니다.");
    }
  }

  async function clearMediaQueue() {
    const discarded = [...mediaQueue];
    mediaQueue = [];
    mediaCoverId = "";
    renderMediaManager();
    await Promise.all(discarded.map(async (item) => {
      if (item.persisted) await deleteBlob(item.id).catch(() => {});
      if (item.src.startsWith("blob:")) URL.revokeObjectURL(item.src);
    }));
  }

  function completeManagedMediaFlow() {
    if (!mediaQueue.length || mediaQueue.some((item) => item.status !== "done")) return;
    mediaQueue.forEach((item) => {
      const block = createMediaBlock({
        kind: item.kind,
        id: item.persisted ? item.id : "",
        src: item.persisted ? item.src : "",
        url: item.persisted ? "" : item.src,
        name: item.name,
      });
      const media = block.querySelector("img, video");
      if (item.persisted && media) media.dataset.objectUrl = item.src;
      insertNodeAtSelection(block);
    });
    const count = mediaQueue.length;
    mediaQueue = [];
    mediaCoverId = "";
    mediaManagerDialog.close();
    showToast(`${count}개의 미디어를 글에 추가했습니다.`);
  }

  function seedMediaManagerDemo() {
    const demoImages = [1, 2, 3, 4, 5].map((number) => ({
      id: `demo-image-${number}`,
      kind: "image",
      name: `레인지로버 차량 사진 ${number}`,
      src: `../assets/dealer-profile/twoj-motorworks/official-luxury/range-rover-0${number}.jpg`,
      status: "done",
      progress: 100,
      persisted: false,
    }));
    mediaQueue = [...demoImages, {
      id: "demo-video-1",
      kind: "video",
      name: "차량 외관 주행 영상.mp4",
      src: "./media/car-sunset-drive-v01.mp4",
      status: "done",
      progress: 100,
      persisted: false,
    }];
    mediaCoverId = demoImages[0].id;
    openMediaManager();
  }

  async function addFiles(files, kind, replace = false) {
    const allowed = Array.from(files).filter((file) => file.type.startsWith(`${kind}/`));
    if (!allowed.length) return showToast(kind === "image" ? "이미지 파일을 선택해 주세요." : "동영상 파일을 선택해 주세요.");
    const max = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (!replace && isMobileMediaFlow()) {
      enqueueManagedFiles(allowed, kind);
      imageInput.value = "";
      cameraImageInput.value = "";
      fileImageInput.value = "";
      videoInput.value = "";
      return;
    }
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
    cameraImageInput.value = "";
    fileImageInput.value = "";
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
    mediaDialog.dataset.kind = kind;
    mediaDialogDesktopTitle.textContent = kind === "image" ? "이미지 추가" : "동영상 추가";
    mediaDialogMobileTitle.textContent = kind === "image" ? "이미지" : "동영상";
    uploadHelp.textContent = kind === "image" ? "JPG, PNG, GIF, WEBP · 파일당 20MB" : "MP4, WEBM, MOV · 파일당 200MB";
    document.querySelector("#uploadTab").click();
    mediaDialog.showModal();
  }

  function openEmbedDialog(block = null) {
    if (!block) rememberSelection();
    replaceTarget = block;
    document.querySelector("#embedDialogTitle").textContent = block ? "임베드 교체" : "임베드 추가";
    embedUrl.value = block?.dataset.embedUrl || "";
    const mode = block?.dataset.embedMode === "bookmark" ? "bookmark" : "auto";
    const option = document.querySelector(`input[name="embedMode"][value="${mode}"]`);
    if (option) option.checked = true;
    embedDialog.showModal();
    setTimeout(() => embedUrl.focus(), 0);
  }

  function insertEmbed() {
    const mode = document.querySelector('input[name="embedMode"]:checked')?.value || "auto";
    const info = getEmbedInfo(embedUrl.value.trim(), mode);
    if (!info) return showToast("올바른 http:// 또는 https:// 주소를 입력해 주세요.");
    const block = createEmbedBlock(info);
    if (replaceTarget?.dataset.kind === "embed") {
      block.dataset.width = replaceTarget.dataset.width || "wide";
      block.dataset.align = replaceTarget.dataset.align || "center";
      block.dataset.height = replaceTarget.dataset.height || block.dataset.height;
      block.querySelector('[data-media-action="height"]').value = block.dataset.height;
      block.querySelector(".media-caption").textContent = replaceTarget.querySelector(".media-caption")?.textContent || "";
      replaceTarget.replaceWith(block);
      selectBlock(block);
      scheduleSave();
      showToast(info.src ? `${info.provider} 임베드로 교체했습니다.` : info.mode === "preview" ? "뉴스 카드로 교체했습니다." : "링크 카드로 교체했습니다.");
    } else {
      insertNodeAtSelection(block);
      showToast(info.src ? `${info.provider} 콘텐츠를 임베드했습니다.` : info.mode === "preview" ? "뉴스 카드로 넣었습니다." : "해당 사이트는 링크 카드로 삽입했습니다.");
    }
    replaceTarget = null;
    embedUrl.value = "";
    embedDialog.close();
  }

  function chooseCommand(command) {
    const slashBlocks = Array.from(editor.querySelectorAll("p, h1, h2, h3, blockquote"));
    const targetBlock = slashBlocks.findLast((block) => block.textContent.trim() === "/")
      || (menuTargetBlock?.isConnected ? menuTargetBlock : selectionBlock());
    const targetIndex = Array.from(editor.children).indexOf(targetBlock);
    closeBlockMenu();
    removeTrailingSlash(targetBlock);
    const liveTarget = targetBlock?.isConnected ? targetBlock : editor.children[targetIndex];
    if (command === "image" || command === "video") {
      if (liveTarget) placeCaretAtEnd(liveTarget);
      menuTargetBlock = null;
      return openMediaDialog(command);
    }
    if (command === "embed") {
      if (liveTarget) placeCaretAtEnd(liveTarget);
      menuTargetBlock = null;
      return openEmbedDialog();
    }
    if (command === "divider") {
      const line = document.createElement("hr");
      if (liveTarget && !liveTarget.textContent.trim()) {
        const paragraph = document.createElement("p");
        paragraph.innerHTML = "<br>";
        liveTarget.replaceWith(line, paragraph);
        placeCaretAtEnd(paragraph);
        scheduleSave();
      } else {
        if (liveTarget) placeCaretAtEnd(liveTarget);
        insertNodeAtSelection(line);
      }
      menuTargetBlock = null;
      return;
    }
    applyBlockCommand(command, liveTarget);
    menuTargetBlock = null;
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

  function publishToDiscussionFeed() {
    const postTitle = title.value.trim();
    if (!postTitle) {
      title.focus();
      showToast("제목을 입력해 주세요.");
      return;
    }

    const media = Array.from(editor.querySelectorAll('.media-block[data-kind="image"], .media-block[data-kind="video"]')).map((figure) => ({
      kind: figure.dataset.kind,
      id: figure.dataset.mediaId || "",
      url: figure.dataset.embedUrl || "",
      name: figure.dataset.fileName || figure.querySelector("figcaption")?.textContent.trim() || "",
    }));
    const embeds = Array.from(editor.querySelectorAll('.media-block[data-kind="embed"]')).map((figure) => {
      const info = getEmbedInfo(figure.dataset.embedUrl || "", figure.dataset.embedMode || "auto") || {};
      return {
        url: figure.dataset.embedUrl || "",
        provider: figure.dataset.provider || info.provider || "",
        render: info.mode === "embed" ? "iframe" : info.mode === "preview" ? "preview" : "bookmark",
        src: info.mode === "embed" ? info.src : "",
        tall: Boolean(info.tall),
        caption: figure.querySelector(".media-caption")?.textContent.trim() || "",
        ...metaFromFigure(figure),
      };
    }).filter((item) => item.url);
    const cleanedHtml = cleanEditorHtml();
    const bodyReader = document.createElement("div");
    bodyReader.innerHTML = cleanedHtml;
    bodyReader.querySelectorAll(".media-block").forEach((figure) => figure.remove());
    const bodyText = bodyReader.textContent.replace(/\s+/g, " ").trim();
    const photos = media.filter((item) => item.kind === "image");
    const videos = media.filter((item) => item.kind === "video");

    saveDocument();
    localStorage.setItem(FEED_POST_KEY, JSON.stringify({
      status: "LOCAL_PREVIEW",
      source: "notion-write",
      board: "자동차뉴스",
      head: "자동차뉴스",
      title: postTitle,
      body: bodyText ? [bodyText] : [],
      html: cleanedHtml,
      photos,
      videos,
      media,
      embeds,
      hideBody: false,
      submittedAt: new Date().toISOString(),
    }));
    showToast("자동차뉴스 피드에 게시했습니다.");
    window.setTimeout(() => { location.href = FEED_URL; }, 220);
  }

  async function hydrateMedia() {
    const blocks = editor.querySelectorAll(".media-block");
    for (const figure of blocks) {
      const tools = createMediaTools(figure.dataset.kind);
      tools.querySelector('[data-media-action="align"]').value = figure.dataset.align || "center";
      tools.querySelector('[data-media-action="width"]').value = figure.dataset.width || "wide";
      const heightControl = tools.querySelector('[data-media-action="height"]');
      if (heightControl) heightControl.value = figure.dataset.height || "standard";
      figure.prepend(tools);
      const id = figure.dataset.mediaId;
      const url = figure.dataset.embedUrl;
      const previewCard = figure.querySelector(".news-card");
      if (figure.dataset.kind === "embed" && previewCard) {
        if (figure.dataset.metaTitle) renderPreviewCard(previewCard, url, metaFromFigure(figure));
        else fetchPreviewMeta(url).then((meta) => { applyPreviewMeta(figure, meta || {}); scheduleSave(); });
        continue;
      }
      const media = figure.querySelector("img, video, iframe");
      if (id && media) {
        const blob = await getBlob(id).catch(() => null);
        if (blob) {
          const objectUrl = URL.createObjectURL(blob);
          media.src = objectUrl;
          media.dataset.objectUrl = objectUrl;
        }
      } else if (url && media) {
        if (figure.dataset.kind === "embed" && media.tagName === "IFRAME") {
          media.src = getEmbedInfo(url, figure.dataset.embedMode)?.src || "";
        } else {
          media.src = media.tagName === "IFRAME" ? toVideoEmbed(url) : url;
        }
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
  editor.addEventListener("keyup", () => { rememberSelection(); setTimeout(updateTextToolbar, 0); });
  editor.addEventListener("mouseup", () => { rememberSelection(); setTimeout(updateTextToolbar, 0); });
  editor.addEventListener("click", (event) => {
    const block = event.target.closest(".media-block");
    selectBlock(block);
  });
  editor.addEventListener("focusout", (event) => {
    if (event.target.classList.contains("media-caption")) scheduleSave();
  });
  editor.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeBlockMenu();
    const todoContent = event.target.closest?.(".todo-block > span");
    if (event.key === "Enter" && todoContent) {
      event.preventDefault();
      const currentTodo = todoContent.closest(".todo-block");
      if (!todoContent.textContent.trim()) {
        const paragraph = document.createElement("p");
        paragraph.innerHTML = "<br>";
        currentTodo.replaceWith(paragraph);
        placeCaretAtEnd(paragraph);
      } else {
        const nextTodo = createTodoBlock();
        currentTodo.insertAdjacentElement("afterend", nextTodo);
        placeCaretAtEnd(nextTodo.querySelector("span"));
      }
      scheduleSave();
      return;
    }
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && selectionBlock()?.matches("pre")) {
      event.preventDefault();
      const paragraph = document.createElement("p");
      paragraph.innerHTML = "<br>";
      selectionBlock().insertAdjacentElement("afterend", paragraph);
      placeCaretAtEnd(paragraph);
      scheduleSave();
      return;
    }
    if (applyMarkdownShortcut(event)) return;
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      applyInlineFormat("strikeThrough");
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      rememberSelection();
      applyInlineFormat("link");
    }
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

  textToolbar.addEventListener("mousedown", (event) => {
    if (event.target.closest("button")) event.preventDefault();
  });
  textToolbar.addEventListener("click", (event) => {
    const command = event.target.closest("[data-format]")?.dataset.format;
    if (command) applyInlineFormat(command);
  });
  selectionBlockType.addEventListener("change", () => {
    const mapping = { p: "text", h1: "heading1", h2: "heading2", h3: "heading3", blockquote: "quote" };
    applyBlockCommand(mapping[selectionBlockType.value] || "text");
    hideTextToolbar();
  });

  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "add-image") openMediaDialog("image");
    if (action === "add-video") openMediaDialog("video");
    if (action === "add-embed") openEmbedDialog();
    if (action === "preview") buildPreview();
    if (action === "close-preview") previewDialog.close();
    if (action === "publish") publishToDiscussionFeed();
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
  document.querySelectorAll("[data-mobile-media-source]").forEach((button) => button.addEventListener("click", () => {
    const source = button.dataset.mobileMediaSource;
    if (source === "camera") cameraImageInput.click();
    else if (source === "file") fileImageInput.click();
    else imageInput.click();
  }));
  document.querySelector("#embedButton").addEventListener("click", () => addMediaUrl(pendingKind, mediaUrl.value.trim()));
  mediaUrl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); addMediaUrl(pendingKind, mediaUrl.value.trim()); }
  });
  document.querySelector("#insertEmbedButton").addEventListener("click", insertEmbed);
  embedUrl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); insertEmbed(); }
  });
  document.querySelector("#saveTextLinkButton").addEventListener("click", saveTextLink);
  textLinkUrl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); saveTextLink(); }
  });

  imageInput.addEventListener("change", () => addFiles(imageInput.files, "image"));
  cameraImageInput.addEventListener("change", () => {
    const files = Array.from(cameraImageInput.files || []);
    const kind = files[0]?.type.startsWith("video/") ? "video" : "image";
    addFiles(files, kind);
  });
  fileImageInput.addEventListener("change", () => addFiles(fileImageInput.files, "image"));
  videoInput.addEventListener("change", () => addFiles(videoInput.files, "video"));
  replaceImageInput.addEventListener("change", () => addFiles(replaceImageInput.files, "image", true));
  replaceVideoInput.addEventListener("change", () => addFiles(replaceVideoInput.files, "video", true));

  mediaManagerGrid.addEventListener("click", async (event) => {
    const action = event.target.closest("[data-manager-action]")?.dataset.managerAction;
    const tile = event.target.closest("[data-media-queue-id]");
    const id = tile?.dataset.mediaQueueId;
    if (action === "add-image") imageInput.click();
    if (action === "cover" && id) selectMediaCover(id);
    if (action === "remove" && id) await removeQueuedMedia(id);
    if (action === "retry" && id) {
      const item = mediaQueue.find((candidate) => candidate.id === id);
      if (item?.file) uploadQueuedMedia(item);
    }
  });
  mediaManagerGrid.addEventListener("keydown", (event) => {
    const handle = event.target.closest('[data-manager-action="drag"]');
    const id = handle?.closest("[data-media-queue-id]")?.dataset.mediaQueueId;
    if (!id || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    moveQueuedMedia(id, event.key === "ArrowLeft" ? -1 : 1);
    mediaManagerGrid.querySelector(`[data-media-queue-id="${id}"] [data-manager-action="drag"]`)?.focus();
  });
  mediaManagerGrid.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest('[data-manager-action="drag"]');
    const tile = handle?.closest("[data-media-queue-id]");
    if (!handle || !tile || (event.button !== undefined && event.button !== 0)) return;
    event.preventDefault();
    draggedMediaId = tile.dataset.mediaQueueId;
    pointerMediaDrag = { pointerId: event.pointerId, sourceId: draggedMediaId, targetId: draggedMediaId, handle };
    tile.classList.add("is-dragging");
    mediaManagerGrid.classList.add("is-reordering");
    try { handle.setPointerCapture?.(event.pointerId); } catch (_) { /* synthetic and older touch events may not support capture */ }
  });
  mediaManagerGrid.addEventListener("pointermove", updatePointerMediaDrag, { passive: false });
  mediaManagerGrid.addEventListener("pointerup", (event) => finishPointerMediaDrag(event));
  mediaManagerGrid.addEventListener("pointercancel", (event) => finishPointerMediaDrag(event, true));
  mediaManagerGrid.addEventListener("dragstart", (event) => {
    const tile = event.target.closest("[data-media-queue-id]");
    if (!tile) return;
    draggedMediaId = tile.dataset.mediaQueueId;
    tile.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
  });
  mediaManagerGrid.addEventListener("dragover", (event) => {
    if (event.target.closest("[data-media-queue-id]")) event.preventDefault();
  });
  mediaManagerGrid.addEventListener("drop", (event) => {
    const targetId = event.target.closest("[data-media-queue-id]")?.dataset.mediaQueueId;
    if (draggedMediaId && targetId) reorderMedia(draggedMediaId, targetId);
  });
  mediaManagerGrid.addEventListener("dragend", () => {
    draggedMediaId = "";
    mediaManagerGrid.querySelectorAll(".is-dragging").forEach((tile) => tile.classList.remove("is-dragging"));
  });
  mediaManagerVideos.addEventListener("click", async (event) => {
    const action = event.target.closest("[data-manager-action]")?.dataset.managerAction;
    const id = event.target.closest("[data-media-queue-id]")?.dataset.mediaQueueId;
    if (action === "remove" && id) await removeQueuedMedia(id);
    if (action === "retry" && id) {
      const item = mediaQueue.find((candidate) => candidate.id === id);
      if (item?.file) uploadQueuedMedia(item);
    }
  });
  document.querySelector("#addManagerVideo").addEventListener("click", () => videoInput.click());
  document.querySelector("#cancelMediaManager").addEventListener("click", async () => {
    mediaManagerDialog.close();
    await clearMediaQueue();
  });
  completeMediaManager.addEventListener("click", completeManagedMediaFlow);
  insertManagedMedia.addEventListener("click", completeManagedMediaFlow);
  mediaManagerDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    mediaManagerDialog.close();
    clearMediaQueue();
  });

  editor.addEventListener("change", (event) => {
    const todoCheckbox = event.target.closest('.todo-block input[type="checkbox"]');
    if (todoCheckbox) {
      const todo = todoCheckbox.closest(".todo-block");
      todo.classList.toggle("is-done", todoCheckbox.checked);
      if (todoCheckbox.checked) todoCheckbox.setAttribute("checked", "");
      else todoCheckbox.removeAttribute("checked");
      scheduleSave();
      return;
    }
    const control = event.target.closest("[data-media-action]");
    const figure = control?.closest(".media-block");
    if (!figure) return;
    if (control.dataset.mediaAction === "align") figure.dataset.align = control.value;
    if (control.dataset.mediaAction === "width") figure.dataset.width = control.value;
    if (control.dataset.mediaAction === "height") figure.dataset.height = control.value;
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
      if (figure.dataset.kind === "embed") openEmbedDialog(figure);
      else (figure.dataset.kind === "image" ? replaceImageInput : replaceVideoInput).click();
    }
    if (action === "original") {
      window.open(figure.dataset.embedUrl, "_blank", "noopener,noreferrer");
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
  document.addEventListener("selectionchange", () => {
    if (document.activeElement === editor || editor.contains(document.activeElement)) setTimeout(updateTextToolbar, 0);
  });
  window.addEventListener("beforeunload", saveDocument);

  document.execCommand("defaultParagraphSeparator", false, "p");
  restoreDocument();
  autosizeTitle();
  if (new URLSearchParams(window.location.search).get("mediaDemo") === "manager") {
    setTimeout(seedMediaManagerDemo, 80);
  }
})();
