const DB_NAME = "bobaedream-shortform-uploader";
const DB_VERSION = 1;
const DRAFT_KEY = "main-draft";

const photoSlots = [
  ["left_front_45", "좌측 전방 45도", true, "대표 이미지 1순위. 차량 전체와 전면부가 함께 보이게 촬영"],
  ["front", "차량 전면", true, "그릴, 헤드램프, 번호판 영역 포함"],
  ["right_front_45", "우측 전방 45도", true, "전면부와 우측 측면이 함께 보이게 촬영"],
  ["right_side", "우측면", true, "옆 라인 전체가 잘리지 않게 촬영"],
  ["rear", "차량 후면", true, "테일램프, 트렁크, 범퍼 상태 확인"],
  ["left_side", "좌측면", true, "옆 라인 전체가 잘리지 않게 촬영"],
  ["interior", "실내 전경", true, "운전석 중심, 대시보드와 센터페시아 포함"],
  ["cluster", "계기판", true, "주행거리와 경고등이 판독되게 촬영"],
  ["front_seats", "앞좌석", true, "운전석과 조수석 시트 상태 확인"],
  ["rear_seats", "뒷좌석", true, "오염, 찢김, 공간감 확인"],
  ["boot_photo", "트렁크", true, "트렁크 개방 상태와 내부 공간 확인"],
  ["engine_photo", "엔진룸", true, "후드 개방 상태, 누유와 오염 확인"],
  ["tyres_wheels", "타이어/휠", true, "타이어 트레드와 휠 스크래치 확인"],
  ["defects", "흠집/하자", false, "흠집, 찍힘, 스크래치, 교환 의심 부위 노출"],
  ["vin_doc", "등록증/차대번호", false, "개인정보와 민감정보 마스킹 필요"],
].map(([key, label, required, guide]) => ({ key, label, required, guide }));

const videoChapters = [
  ["walkaround", "외관 한바퀴", "Walkaround", true, "15~25초", "좌측 전방에서 시작해 차량을 한 바퀴 돌며 촬영"],
  ["features", "주요 옵션", "Features", true, "8~15초", "선루프, 전동시트, 통풍시트, 전동트렁크 등 실작동 중심"],
  ["dashboard", "대시보드", "Dashboard", true, "8~12초", "계기판, 내비게이션, 센터페시아를 천천히 팬"],
  ["seats", "시트", "Seats", true, "8~12초", "1열, 2열 순서로 시트 상태 촬영"],
  ["driver_pov", "운전자 시점", "Driver POV", true, "5~10초", "운전석 착좌 기준 전방 시야와 핸들 주변 촬영"],
  ["boot", "트렁크", "Boot", true, "5~10초", "개방 장면, 내부 공간, 적재 상태 촬영"],
  ["tyres", "타이어/휠", "Tyres", true, "5~10초", "타이어 트레드, 휠 스크래치, 네 바퀴 상태 확인"],
  ["engine", "엔진룸", "Engine", true, "8~12초", "후드 개방, 엔진룸 전체, 가능하면 시동음 포함"],
  ["freeform", "자유형 숏폼", "Freeform", false, "15~60초", "딜러 멘트, 매장 분위기, 이벤트 매물 자유 촬영"],
].map(([key, labelKo, labelEn, required, recommendedSeconds, guide]) => ({
  key,
  labelKo,
  labelEn,
  required,
  recommendedSeconds,
  guide,
}));

const researchItems = [
  ["eBizAutos", "모바일 사진/워크어라운드 영상 업로드, 인벤토리 배포", "부분 적용"],
  ["Phyron", "매물 사진과 데이터 기반 자동 영상 생성, 광고 배포", "장기 검토"],
  ["Dealer Video Inventory", "딜러가 재고 차량 영상을 촬영해 마켓/YouTube 배포", "부분 적용"],
  ["DealerVision", "VIN 단위 워크어라운드 촬영과 자동 게시", "부분 적용"],
  ["Autos On Video", "딜러용 스마트폰 사진/영상 머천다이징", "즉시 적용"],
  ["WalkTheLot", "사진, 영상, 360도 촬영과 게시 워크플로우", "장기 검토"],
  ["myKaarma", "입고 차량 손상 기록용 영상 워크어라운드", "부분 적용"],
];

let db;
let state = {
  captureMode: "template",
  plateMaskEnabled: true,
  heroAssetId: null,
  selectedPhotoSlot: "left_front_45",
  selectedVideoChapter: "walkaround",
  currentViewerChapter: "walkaround",
  assets: {},
  photoSlotAssets: {},
  videoChapterAssets: {},
  uploadQueue: [],
  updatedAt: null,
};

const objectUrls = new Map();
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

document.addEventListener("DOMContentLoaded", init);

async function init() {
  db = await openDb();
  await loadDraft();
  bindEvents();
  renderAll();
  showToast("데모가 준비됐습니다. 사진/영상 추가를 눌러 테스트하세요.");
}

function openDb() {
  return new Promise((resolve) => {
    if (!("indexedDB" in window)) {
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("drafts")) database.createObjectStore("drafts");
      if (!database.objectStoreNames.contains("assets")) database.createObjectStore("assets", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

function tx(storeName, mode = "readonly") {
  if (!db) return null;
  return db.transaction(storeName, mode).objectStore(storeName);
}

function idbGet(storeName, key) {
  return new Promise((resolve) => {
    const store = tx(storeName);
    if (!store) {
      resolve(null);
      return;
    }
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
}

function idbPut(storeName, value, key) {
  return new Promise((resolve) => {
    const store = tx(storeName, "readwrite");
    if (!store) {
      resolve(false);
      return;
    }
    const request = key ? store.put(value, key) : store.put(value);
    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
  });
}

function idbDelete(storeName, key) {
  return new Promise((resolve) => {
    const store = tx(storeName, "readwrite");
    if (!store) {
      resolve(false);
      return;
    }
    const request = store.delete(key);
    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
  });
}

async function loadDraft() {
  const savedState = await idbGet("drafts", DRAFT_KEY);
  const savedAssetIds = savedState?.assetIds || [];
  const assets = {};

  for (const id of savedAssetIds) {
    const asset = await idbGet("assets", id);
    if (asset?.blob) assets[id] = asset;
  }

  if (savedState) {
    state = {
      ...state,
      ...savedState,
      assets,
      selectedPhotoSlot: savedState.selectedPhotoSlot || "left_front_45",
      selectedVideoChapter: savedState.selectedVideoChapter || "walkaround",
    currentViewerChapter: savedState.currentViewerChapter || "walkaround",
    uploadQueue: [],
    };
  }
}

async function persistDraft() {
  const assetIds = Object.keys(state.assets);
  const draft = {
    captureMode: state.captureMode,
    plateMaskEnabled: state.plateMaskEnabled,
    heroAssetId: state.heroAssetId,
    selectedPhotoSlot: state.selectedPhotoSlot,
    selectedVideoChapter: state.selectedVideoChapter,
    currentViewerChapter: state.currentViewerChapter,
    photoSlotAssets: state.photoSlotAssets,
    videoChapterAssets: state.videoChapterAssets,
    assetIds,
    updatedAt: new Date().toISOString(),
  };

  for (const asset of Object.values(state.assets)) {
    await idbPut("assets", asset);
  }

  const ok = await idbPut("drafts", draft, DRAFT_KEY);
  try {
    localStorage.setItem(`${DB_NAME}:lastDraft`, JSON.stringify({ ...draft, assetIds }));
  } catch {
    // LocalStorage is only a metadata fallback.
  }
  state.updatedAt = draft.updatedAt;
  return ok;
}

function bindEvents() {
  $$("[data-open-panel]").forEach((button) => {
    button.addEventListener("click", () => openPanel(button.dataset.openPanel));
  });

  $$("[data-close-panel]").forEach((button) => {
    button.addEventListener("click", closePanels);
  });

  $$(".mode-tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.captureMode = button.dataset.mode;
      renderAll();
      persistDraft();
    });
  });

  $("#plateMaskToggle").addEventListener("click", togglePlateMask);
  $("#panelMaskToggle").addEventListener("click", togglePlateMask);
  $("#saveDraftBtn").addEventListener("click", async () => {
    await persistDraft();
    renderDraftState();
    showToast("임시저장 완료");
  });
  $("#resetBtn").addEventListener("click", resetDemo);
  $("[data-action='rules']").addEventListener("click", () => {
    showToast("촬영 규칙: 대표 45도, 번호판 보호, 흠집/하자 숨김 없이 촬영");
  });

  $$("[data-photo-source]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.dataset.photoSource === "camera" ? $("#photoCameraInput") : $("#photoAlbumInput");
      input.value = "";
      input.click();
    });
  });

  $$("[data-video-source]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.dataset.videoSource === "camera" ? $("#videoCameraInput") : $("#videoAlbumInput");
      input.value = "";
      input.click();
    });
  });

  $("#photoCameraInput").addEventListener("change", (event) => handlePhotoFiles(event.target.files));
  $("#photoAlbumInput").addEventListener("change", (event) => handlePhotoFiles(event.target.files));
  $("#videoCameraInput").addEventListener("change", (event) => handleVideoFile(event.target.files?.[0]));
  $("#videoAlbumInput").addEventListener("change", (event) => handleVideoFile(event.target.files?.[0]));

  $("#favoriteBtn").addEventListener("click", (event) => {
    const next = event.currentTarget.getAttribute("aria-pressed") !== "true";
    event.currentTarget.setAttribute("aria-pressed", String(next));
    event.currentTarget.textContent = next ? "♥" : "♡";
  });

  $("#muteBtn").addEventListener("click", (event) => {
    const video = $("#mainVideo");
    video.muted = !video.muted;
    event.currentTarget.setAttribute("aria-pressed", String(video.muted));
    event.currentTarget.textContent = video.muted ? "해제" : "음소거";
  });
}

function openPanel(kind) {
  if (kind === "photo") $("#photoPanel").classList.add("open");
  if (kind === "video") $("#videoPanel").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closePanels() {
  $$(".capture-panel").forEach((panel) => panel.classList.remove("open"));
  document.body.style.overflow = "";
}

function togglePlateMask() {
  state.plateMaskEnabled = !state.plateMaskEnabled;
  renderPlateMask();
  persistDraft();
}

async function handlePhotoFiles(fileList) {
  const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
  if (!files.length) return;

  const maxAvailable = Math.max(0, 30 - getPhotoAssetIds().length);
  const usableFiles = files.slice(0, maxAvailable || 1);
  let currentIndex = photoSlots.findIndex((slot) => slot.key === state.selectedPhotoSlot);

  for (const file of usableFiles) {
    const slot = photoSlots[currentIndex] || photoSlots[0];
    const asset = makeAsset(file, "photo", slot.key);
    state.assets[asset.id] = asset;
    state.photoSlotAssets[slot.key] = asset.id;
    enqueueUpload(asset);
    if (!state.heroAssetId || slot.key === "left_front_45") state.heroAssetId = asset.id;
    currentIndex += 1;
  }

  await persistDraft();
  renderAll();
  showToast(`${usableFiles.length}장 등록 완료`);
}

async function handleVideoFile(file) {
  if (!file || !file.type.startsWith("video/")) return;
  const chapterKey = state.captureMode === "freeform" ? "freeform" : state.selectedVideoChapter;
  const asset = makeAsset(file, "video", chapterKey);
  state.assets[asset.id] = asset;
  state.videoChapterAssets[chapterKey] = asset.id;
  state.currentViewerChapter = chapterKey;
  enqueueUpload(asset);

  await persistDraft();
  renderAll();
  showToast("영상 등록 완료");
}

function makeAsset(file, kind, slotKey) {
  return {
    id: `${kind}-${slotKey}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    kind,
    slotKey,
    fileName: file.name || `${kind}-${slotKey}`,
    mimeType: file.type,
    sizeBytes: file.size,
    blob: file,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function deleteAsset(assetId) {
  if (!assetId) return;
  const asset = state.assets[assetId];
  if (!asset) return;

  if (asset.kind === "photo") {
    for (const [key, value] of Object.entries(state.photoSlotAssets)) {
      if (value === assetId) delete state.photoSlotAssets[key];
    }
    if (state.heroAssetId === assetId) {
      state.heroAssetId = state.photoSlotAssets.left_front_45 || Object.values(state.photoSlotAssets)[0] || null;
    }
  }

  if (asset.kind === "video") {
    for (const [key, value] of Object.entries(state.videoChapterAssets)) {
      if (value === assetId) delete state.videoChapterAssets[key];
    }
  }

  revokeUrl(assetId);
  delete state.assets[assetId];
  await idbDelete("assets", assetId);
  await persistDraft();
  renderAll();
  showToast("삭제 완료");
}

function setHero(assetId) {
  state.heroAssetId = assetId;
  persistDraft();
  renderAll();
  showToast("대표 이미지 변경 완료");
}

function getAssetUrl(assetId) {
  if (!assetId || !state.assets[assetId]?.blob) return "";
  if (!objectUrls.has(assetId)) objectUrls.set(assetId, URL.createObjectURL(state.assets[assetId].blob));
  return objectUrls.get(assetId);
}

function revokeUrl(assetId) {
  const url = objectUrls.get(assetId);
  if (url) URL.revokeObjectURL(url);
  objectUrls.delete(assetId);
}

function renderAll() {
  renderMode();
  renderPlateMask();
  renderSlots();
  renderChapters();
  renderCaptureCarousels();
  renderViewer();
  renderProgress();
  renderUploadQueue();
  renderResearch();
  renderDraftState();
}

function renderMode() {
  $$(".mode-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.captureMode);
  });
}

function renderPlateMask() {
  $("#plateMaskToggle").setAttribute("aria-pressed", String(state.plateMaskEnabled));
  $("#panelMaskToggle").textContent = state.plateMaskEnabled ? "번호판 가림 ON" : "번호판 가림 OFF";
}

function renderSlots() {
  const container = $("#photoSlots");
  container.innerHTML = photoSlots
    .map((slot) => {
      const assetId = state.photoSlotAssets[slot.key];
      const asset = state.assets[assetId];
      const url = asset ? getAssetUrl(assetId) : "";
      const status = asset ? `<span class="complete">완료</span>` : slot.required ? `<span class="required">필수</span>` : `<span class="optional">선택</span>`;
      const thumb = asset
        ? `<img src="${url}" alt="${slot.label} 등록 이미지" />`
        : `<span>예시</span>`;
      const heroButton =
        asset && state.heroAssetId !== assetId
          ? `<button type="button" data-hero="${assetId}">대표</button>`
          : asset
            ? `<button type="button" disabled>대표중</button>`
            : "";
      const deleteButton = asset ? `<button class="danger" type="button" data-delete="${assetId}">삭제</button>` : "";

      return `
        <article class="slot-card">
          <button class="thumb" type="button" data-select-photo="${slot.key}" aria-label="${slot.label} 사진 선택">
            ${thumb}
          </button>
          <div class="slot-main">
            <div class="slot-title"><span>${slot.label}</span>${status}</div>
            <div class="slot-guide">${slot.guide}</div>
          </div>
          <div class="slot-actions">
            <button type="button" data-select-photo="${slot.key}" data-open-panel="photo">${asset ? "교체" : "촬영"}</button>
            ${heroButton}
            ${deleteButton}
          </div>
        </article>`;
    })
    .join("");

  bindDynamicActions(container);
}

function renderChapters() {
  const container = $("#videoChapters");
  container.innerHTML = videoChapters
    .map((chapter) => {
      const assetId = state.videoChapterAssets[chapter.key];
      const asset = state.assets[assetId];
      const url = asset ? getAssetUrl(assetId) : "";
      const status = asset ? `<span class="complete">완료</span>` : chapter.required ? `<span class="required">필수</span>` : `<span class="optional">선택</span>`;
      const thumb = asset
        ? `<video src="${url}" muted playsinline></video>`
        : `<span>${chapter.labelEn}</span>`;
      const deleteButton = asset ? `<button class="danger" type="button" data-delete="${assetId}">삭제</button>` : "";

      return `
        <article class="chapter-card">
          <button class="thumb" type="button" data-view-video="${chapter.key}" aria-label="${chapter.labelKo} 보기">
            ${thumb}
          </button>
          <div class="chapter-main">
            <div class="chapter-title"><span>${chapter.labelKo}</span>${status}</div>
            <div class="chapter-guide">${chapter.labelEn} · ${chapter.recommendedSeconds}</div>
          </div>
          <div class="chapter-actions">
            <button type="button" data-select-video="${chapter.key}" data-open-panel="video">${asset ? "교체" : "촬영"}</button>
            <button type="button" data-view-video="${chapter.key}">보기</button>
            ${deleteButton}
          </div>
        </article>`;
    })
    .join("");

  bindDynamicActions(container);
}

function renderCaptureCarousels() {
  $("#photoCarousel").innerHTML = photoSlots
    .map(
      (slot) => `
        <button class="capture-sample ${slot.key === state.selectedPhotoSlot ? "active" : ""}" type="button" data-select-photo="${slot.key}">
          <span class="sample-art"></span>
          <span>${slot.label}</span>
          <small>${slot.guide}</small>
        </button>`
    )
    .join("");

  $("#videoCarousel").innerHTML = videoChapters
    .map(
      (chapter) => `
        <button class="capture-sample ${chapter.key === state.selectedVideoChapter ? "active" : ""}" type="button" data-select-video="${chapter.key}">
          <span class="sample-art"></span>
          <span>${chapter.labelKo}</span>
          <small>${chapter.labelEn} · ${chapter.recommendedSeconds}</small>
        </button>`
    )
    .join("");

  const quick = [
    ["walkaround", "차량 외관"],
    ["dashboard", "차 내장"],
    ["engine", "엔진룸"],
    ["boot", "트렁크"],
  ];
  $("#quickVideoChips").innerHTML = quick
    .map(
      ([key, label]) => `
        <button class="quick-chip ${key === state.selectedVideoChapter ? "active" : ""}" type="button" data-select-video="${key}">
          ${label}
        </button>`
    )
    .join("");

  bindDynamicActions($("#photoCarousel"));
  bindDynamicActions($("#videoCarousel"));
  bindDynamicActions($("#quickVideoChips"));
  $("#selectedPhotoPill").textContent = photoSlots.find((slot) => slot.key === state.selectedPhotoSlot)?.label || "사진 촬영";
  const chapter = videoChapters.find((item) => item.key === state.selectedVideoChapter);
  $("#selectedVideoPill").textContent = chapter?.labelKo || "차량 영상";
  $("#photoCounterPanel").textContent = `${getPhotoAssetIds().length}/30`;
  $("#videoCounterPanel").textContent = `${getVideoAssetIds().length}/9`;
}

function renderViewer() {
  const tabs = $("#viewerTabs");
  tabs.innerHTML = videoChapters
    .filter((chapter) => chapter.key !== "freeform")
    .map(
      (chapter) => `
        <button class="viewer-tab ${chapter.key === state.currentViewerChapter ? "active" : ""}" type="button" data-view-video="${chapter.key}">
          <span><img src="./public/icons/video.svg" alt="" /></span>
          ${chapter.labelEn}
        </button>`
    )
    .join("");
  bindDynamicActions(tabs);

  const chapter = videoChapters.find((item) => item.key === state.currentViewerChapter) || videoChapters[0];
  const assetId = state.videoChapterAssets[state.currentViewerChapter] || state.videoChapterAssets.freeform;
  const frame = $("#viewerFrame");
  const video = $("#mainVideo");
  $("#currentChapterBadge").textContent = chapter.labelEn;

  if (assetId) {
    video.src = getAssetUrl(assetId);
    frame.classList.add("has-video");
  } else {
    video.removeAttribute("src");
    frame.classList.remove("has-video");
  }

  const hero = state.assets[state.heroAssetId];
  const heroPreview = $("#heroPreview");
  if (hero) {
    heroPreview.innerHTML = `<img src="${getAssetUrl(state.heroAssetId)}" alt="대표 이미지" /><span>대표 이미지</span>`;
  } else {
    heroPreview.innerHTML = `<div class="car-outline" aria-hidden="true"></div><span>대표 이미지</span>`;
  }
}

function renderProgress() {
  const requiredPhotos = photoSlots.filter((slot) => slot.required);
  const requiredVideos = videoChapters.filter((chapter) => chapter.required);
  const completePhotos = requiredPhotos.filter((slot) => state.photoSlotAssets[slot.key]).length;
  const completeVideos = requiredVideos.filter((chapter) => state.videoChapterAssets[chapter.key]).length;
  const total = requiredPhotos.length + requiredVideos.length;
  const complete = completePhotos + completeVideos;
  const percent = Math.round((complete / total) * 100);
  const missingPhotos = requiredPhotos.length - completePhotos;
  const missingVideos = requiredVideos.length - completeVideos;

  $("#progressLabel").textContent = `완료도 ${percent}%`;
  $("#progressBar").style.width = `${percent}%`;
  $("#missingLabel").textContent =
    percent === 100 ? "필수 촬영 항목 완료" : `사진 ${missingPhotos}개, 영상 ${missingVideos}개 남음`;
  $("#photoCount").textContent = getPhotoAssetIds().length;
  $("#videoCount").textContent = getVideoAssetIds().length;
  $("#photoMissingText").textContent = `필수 사진 ${completePhotos}/${requiredPhotos.length} 완료`;
}

function renderUploadQueue() {
  const container = $("#uploadQueue");
  if (!state.uploadQueue.length) {
    container.classList.remove("visible");
    container.innerHTML = "";
    return;
  }

  container.classList.add("visible");
  container.innerHTML = state.uploadQueue
    .map(
      (item) => `
        <div class="queue-item">
          <strong>${item.fileName}</strong>
          <span>${item.progress}%</span>
          <div class="queue-bar"><i style="width: ${item.progress}%"></i></div>
        </div>`
    )
    .join("");
}

function renderResearch() {
  $("#researchRows").innerHTML = researchItems
    .map(([service, feature, decision]) => `<tr><td>${service}</td><td>${feature}</td><td>${decision}</td></tr>`)
    .join("");
}

function renderDraftState() {
  $("#draftState").textContent = state.updatedAt
    ? `임시저장 ${formatTime(state.updatedAt)}`
    : "임시저장 대기";
}

function bindDynamicActions(root) {
  root.querySelectorAll("[data-open-panel]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const slotKey = button.dataset.selectPhoto;
      const chapterKey = button.dataset.selectVideo;
      if (slotKey) state.selectedPhotoSlot = slotKey;
      if (chapterKey) state.selectedVideoChapter = chapterKey;
      renderCaptureCarousels();
      openPanel(button.dataset.openPanel);
      event.stopPropagation();
    });
  });

  root.querySelectorAll("[data-select-photo]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedPhotoSlot = button.dataset.selectPhoto;
      renderCaptureCarousels();
      if (!button.dataset.openPanel) openPanel("photo");
    });
  });

  root.querySelectorAll("[data-select-video]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedVideoChapter = button.dataset.selectVideo;
      state.captureMode = state.selectedVideoChapter === "freeform" ? "freeform" : state.captureMode;
      renderAll();
    });
  });

  root.querySelectorAll("[data-view-video]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentViewerChapter = button.dataset.viewVideo;
      renderViewer();
    });
  });

  root.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteAsset(button.dataset.delete));
  });

  root.querySelectorAll("[data-hero]").forEach((button) => {
    button.addEventListener("click", () => setHero(button.dataset.hero));
  });
}

function getPhotoAssetIds() {
  return Object.values(state.photoSlotAssets).filter(Boolean);
}

function getVideoAssetIds() {
  return Object.values(state.videoChapterAssets).filter(Boolean);
}

function formatTime(iso) {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "완료";
  }
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function enqueueUpload(asset) {
  const item = {
    id: asset.id,
    fileName: asset.fileName,
    progress: 0,
  };
  state.uploadQueue = [item, ...state.uploadQueue].slice(0, 3);
  renderUploadQueue();

  const tick = () => {
    const target = state.uploadQueue.find((upload) => upload.id === item.id);
    if (!target) return;
    target.progress = Math.min(100, target.progress + 25);
    renderUploadQueue();
    if (target.progress < 100) {
      setTimeout(tick, 140);
    } else {
      setTimeout(() => {
        state.uploadQueue = state.uploadQueue.filter((upload) => upload.id !== item.id);
        renderUploadQueue();
      }, 900);
    }
  };

  setTimeout(tick, 80);
}

async function resetDemo() {
  if (!confirm("등록한 사진/영상 데모 데이터를 모두 삭제할까요?")) return;
  for (const id of Object.keys(state.assets)) {
    revokeUrl(id);
    await idbDelete("assets", id);
  }
  await idbDelete("drafts", DRAFT_KEY);
  try {
    localStorage.removeItem(`${DB_NAME}:lastDraft`);
  } catch {
    // no-op
  }
  state = {
    captureMode: "template",
    plateMaskEnabled: true,
    heroAssetId: null,
    selectedPhotoSlot: "left_front_45",
    selectedVideoChapter: "walkaround",
    currentViewerChapter: "walkaround",
    assets: {},
    photoSlotAssets: {},
    videoChapterAssets: {},
    uploadQueue: [],
    updatedAt: null,
  };
  renderAll();
  showToast("초기화 완료");
}
