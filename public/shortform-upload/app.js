const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const screens = {
  form: $("#formScreen"),
  camera: $("#cameraScreen"),
  album: $("#albumScreen"),
};

const shotTypes = [
  { id: "exterior", label: "차량 외관", guide: "차량 외관 촬영" },
  { id: "interior", label: "실내", guide: "차량 실내 촬영" },
  { id: "engine", label: "엔진룸", guide: "엔진룸 촬영" },
  { id: "trunk", label: "트렁크", guide: "트렁크 촬영" },
];

const categoryTypes = [
  { id: "suv", label: "SUV", summary: "SUV 분류로 촬영 템플릿과 리스트 노출 기준을 잡습니다." },
  { id: "sedan", label: "세단", summary: "세단은 전후면 비율과 2열 공간 컷을 우선 노출합니다." },
  { id: "hatch", label: "해치백", summary: "해치백은 트렁크 개폐와 적재공간 컷을 강조합니다." },
  { id: "van", label: "밴/승합", summary: "밴/승합은 좌석 배열, 슬라이딩 도어, 실내 높이를 확인합니다." },
  { id: "ute", label: "픽업/화물", summary: "픽업/화물은 적재함, 하부, 용도변경 여부를 함께 봅니다." },
  { id: "sports", label: "스포츠", summary: "스포츠카는 외관 컨디션, 휠, 배기음 짧은 영상을 우선합니다." },
  { id: "camping", label: "캠핑카", summary: "캠핑카는 주방, 침대, 전기/수도 설비 컷을 추가합니다." },
];

const capturePlan = [
  { title: "대표 외관", media: "사진 6장 + 8초 영상", points: "앞 45도, 뒤 45도, 좌/우 측면, 휠, 흠집" },
  { title: "실내/옵션", media: "사진 6장 + 10초 영상", points: "운전석, 계기판, 내비, 1열/2열, 시트 상태" },
  { title: "엔진룸/하부", media: "사진 3장 + 6초 영상", points: "엔진룸, 누유 의심, 하부 부식, 타이어 마모" },
  { title: "트렁크/적재", media: "사진 3장 + 6초 영상", points: "트렁크 열림, 적재공간, 스페어/공구, 전동 트렁크" },
  { title: "자유 숏폼", media: "15~60초 영상", points: "딜러 설명, 시동음, 주행감, 핵심 장점 자유 촬영" },
];

let activeScreen = "form";
let activeShot = "exterior";
let activeCategory = "suv";
let mediaItems = [];
let selectedAlbumIds = new Set();
let draftCount = 0;
let stream = null;
let recorder = null;
let recordedChunks = [];
let recordingStart = 0;

const sampleAssets = (window.BOBAE_SAMPLE_ASSETS || []).map((item, index) => ({
  id: `sample-${index}`,
  source: "sample",
  type: item.type || "image",
  title: item.title || `샘플 ${index + 1}`,
  duration: item.duration || "",
  url: item.url,
}));

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => el.classList.toggle("is-active", key === name));
  activeScreen = name;
  if (name !== "camera") stopCamera();
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("is-visible");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => el.classList.remove("is-visible"), 1800);
}

function updateDraftCount() {
  $("#draftCount").textContent = String(draftCount);
}

function renderShotTabs() {
  const holder = $("#shotTabs");
  holder.innerHTML = "";
  const sampleMap = Object.fromEntries(sampleAssets.slice(0, 4).map((asset, index) => [shotTypes[index].id, asset.url]));

  shotTypes.forEach((shot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "shot-tab";
    button.textContent = shot.label;
    button.dataset.shot = shot.id;
    if (shot.id === activeShot) {
      button.classList.add("is-active");
      if (sampleMap[shot.id]) button.style.backgroundImage = `linear-gradient(rgba(0,0,0,.15), rgba(0,0,0,.35)), url("${sampleMap[shot.id]}")`;
    }
    if (mediaItems.some((item) => item.shot === shot.id)) button.classList.add("is-done");
    button.addEventListener("click", () => {
      activeShot = shot.id;
      $("#guidePill").textContent = shot.guide;
      renderShotTabs();
      updateCameraFallback();
    });
    holder.appendChild(button);
  });
}

function updateCameraFallback() {
  const fallback = $("#cameraFallback");
  const index = Math.max(0, shotTypes.findIndex((shot) => shot.id === activeShot));
  const asset = sampleAssets[index] || sampleAssets[0];
  if (asset) fallback.style.backgroundImage = `linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.25)), url("${asset.url}")`;
}

async function startCamera() {
  updateCameraFallback();
  renderShotTabs();
  if (!navigator.mediaDevices?.getUserMedia) {
    toast("브라우저 카메라 권한이 없어서 샘플 화면으로 표시합니다.");
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true,
    });
    $("#cameraFeed").srcObject = stream;
    $("#cameraFallback").classList.add("has-camera");
  } catch (error) {
    toast("카메라 권한이 없어서 샘플 화면으로 테스트합니다.");
  }
}

function stopCamera() {
  if (recorder?.state === "recording") recorder.stop();
  recorder = null;
  recordedChunks = [];
  $("#recordButton").classList.remove("is-recording");
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  $("#cameraFeed").srcObject = null;
  $("#cameraFallback").classList.remove("has-camera");
}

function addMedia(item) {
  if (mediaItems.length >= 20) {
    toast("최대 20개까지 등록할 수 있습니다.");
    return;
  }
  mediaItems = [item, ...mediaItems].slice(0, 20);
  renderPreview();
  renderShotTabs();
}

function renderPreview() {
  const holder = $("#mediaPreview");
  holder.innerHTML = "";
  holder.classList.toggle("has-items", mediaItems.length > 0);

  mediaItems.forEach((item) => {
    const tile = document.createElement("div");
    tile.className = "preview-tile";
    const media = document.createElement(item.type === "video" ? "video" : "img");
    media.src = item.url;
    if (item.type === "video") {
      media.muted = true;
      media.playsInline = true;
    }
    tile.appendChild(media);
    const label = document.createElement("span");
    label.textContent = item.duration || (item.type === "video" ? "영상" : "사진");
    tile.appendChild(label);
    holder.appendChild(tile);
  });
}

function renderCategoryRail() {
  const holder = $("#categoryRail");
  holder.innerHTML = "";
  categoryTypes.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category.label;
    button.className = category.id === activeCategory ? "is-active" : "";
    button.addEventListener("click", () => {
      activeCategory = category.id;
      $("#categorySummary").textContent = category.summary;
      renderCategoryRail();
    });
    holder.appendChild(button);
  });
}

function renderCapturePlan() {
  const holder = $("#capturePlan");
  holder.innerHTML = "";
  capturePlan.forEach((item, index) => {
    const row = document.createElement("article");
    row.className = "plan-row";
    row.innerHTML = `
      <strong>${index + 1}. ${item.title}</strong>
      <span>${item.media}</span>
      <small>${item.points}</small>
    `;
    holder.appendChild(row);
  });
}

function renderAlbum() {
  const holder = $("#albumGrid");
  holder.innerHTML = "";

  const uploaded = mediaItems.filter((item) => item.source === "upload" || item.source === "recording");
  const list = [...uploaded, ...sampleAssets];

  list.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "album-tile";
    button.classList.toggle("is-selected", selectedAlbumIds.has(item.id) || mediaItems.some((media) => media.id === item.id));
    button.dataset.id = item.id;

    const media = document.createElement(item.type === "video" ? "video" : "img");
    media.src = item.url;
    if (item.type === "video") {
      media.muted = true;
      media.playsInline = true;
      media.preload = "metadata";
    }
    button.appendChild(media);

    const check = document.createElement("span");
    check.className = "check";
    button.appendChild(check);

    const duration = document.createElement("span");
    duration.className = "duration";
    duration.textContent = item.duration || (item.type === "video" ? "영상" : "");
    button.appendChild(duration);

    button.addEventListener("click", () => toggleAlbumItem(item));
    holder.appendChild(button);
  });

  updateSelectedCounter();
}

function toggleAlbumItem(item) {
  if (selectedAlbumIds.has(item.id) || mediaItems.some((media) => media.id === item.id)) {
    selectedAlbumIds.delete(item.id);
    mediaItems = mediaItems.filter((media) => media.id !== item.id);
  } else {
    selectedAlbumIds.add(item.id);
    addMedia({ ...item, shot: activeShot });
  }
  renderAlbum();
  renderPreview();
}

function updateSelectedCounter() {
  $("#selectedCounter").textContent = `${mediaItems.length}/20`;
}

function openAlbum() {
  renderAlbum();
  showScreen("album");
}

function openCamera() {
  showScreen("camera");
  startCamera();
}

function handleFiles(files) {
  Array.from(files).slice(0, 20 - mediaItems.length).forEach((file) => {
    const type = file.type.startsWith("video") ? "video" : "image";
    addMedia({
      id: `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      source: "upload",
      type,
      shot: activeShot,
      title: file.name,
      duration: type === "video" ? "영상" : "사진",
      url: URL.createObjectURL(file),
    });
  });
  renderAlbum();
  toast("선택한 파일을 등록폼에 반영했습니다.");
}

function toggleRecording() {
  if (recorder?.state === "recording") {
    recorder.stop();
    return;
  }

  if (!stream || !window.MediaRecorder) {
    const sample = sampleAssets.find((asset) => asset.type === "video") || sampleAssets[0];
    if (sample) {
      addMedia({ ...sample, id: `shot-${Date.now()}`, source: "recording", type: "image", shot: activeShot, duration: "샘플" });
      toast("카메라 권한이 없어 샘플 컷을 추가했습니다.");
    }
    return;
  }

  recordedChunks = [];
  recorder = new MediaRecorder(stream);
  recordingStart = Date.now();
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) recordedChunks.push(event.data);
  };
  recorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const seconds = Math.max(1, Math.round((Date.now() - recordingStart) / 1000));
    addMedia({
      id: `recording-${Date.now()}`,
      source: "recording",
      type: "video",
      shot: activeShot,
      title: `${shotTypes.find((shot) => shot.id === activeShot)?.label || "차량"} 촬영 영상`,
      duration: `${seconds}s`,
      url: URL.createObjectURL(blob),
    });
    $("#recordButton").classList.remove("is-recording");
    toast("촬영 영상을 등록폼에 추가했습니다.");
  };
  recorder.start();
  $("#recordButton").classList.add("is-recording");
}

function bindEvents() {
  $("#addPhoto").addEventListener("click", openAlbum);
  $("#addVideo").addEventListener("click", openCamera);
  $("#closeCamera").addEventListener("click", () => showScreen("form"));
  $("#closeAlbum").addEventListener("click", () => showScreen("form"));
  $("#openAlbumFromCamera").addEventListener("click", openAlbum);
  $("#albumShoot").addEventListener("click", openCamera);
  $("#albumDone").addEventListener("click", () => {
    showScreen("form");
    toast(mediaItems.length ? "사진 및 영상 선택이 완료됐습니다." : "선택된 미디어가 없습니다.");
  });
  $("#pickFiles").addEventListener("click", () => $("#fileInput").click());
  $("#fileInput").addEventListener("change", (event) => handleFiles(event.target.files));
  $("#selectAllSamples").addEventListener("click", () => {
    sampleAssets.forEach((item) => {
      if (!mediaItems.some((media) => media.id === item.id)) {
        selectedAlbumIds.add(item.id);
        addMedia({ ...item, shot: activeShot });
      }
    });
    renderAlbum();
    toast("샘플 미디어를 모두 선택했습니다.");
  });
  $("#recordButton").addEventListener("click", toggleRecording);
  $("#flashButton").addEventListener("click", () => toast("실서비스에서는 기기 플래시 제어와 연결됩니다."));
  $("#cityButton").addEventListener("click", () => {
    const cities = ["서울", "경기 수원시", "인천", "부산", "대구", "광주"];
    const current = $("#cityValue").textContent;
    const next = cities[(cities.indexOf(current) + 1) % cities.length];
    $("#cityValue").textContent = next;
  });
  $("#saveDraft").addEventListener("click", () => {
    draftCount += 1;
    updateDraftCount();
    toast("임시저장되었습니다.");
  });
  $("#publishButton").addEventListener("click", () => {
    const hasRequired = mediaItems.length > 0;
    toast(hasRequired ? "등록 정보 저장 완료. 다음 단계로 이동 가능합니다." : "사진 또는 영상을 먼저 등록해 주세요.");
  });
  $$("[data-capture-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      $$("[data-capture-mode]").forEach((item) => item.classList.toggle("is-active", item === button));
      const mode = button.dataset.captureMode;
      $("#modeSummary").textContent =
        mode === "free"
          ? "틱톡처럼 정해진 섹션 없이 딜러가 자유롭게 촬영한 영상을 그대로 올립니다."
          : "외관, 실내, 엔진룸, 트렁크 순서로 누락 없이 촬영하도록 단계별 가이드를 띄웁니다.";
    });
  });
  $$("input[name='proof']").forEach((input) => {
    input.addEventListener("change", () => {
      const labels = {
        license: "자동차 등록증 촬영",
        inspection: "성능점검표 촬영",
        plate: "차량번호판 촬영",
      };
      $("#proofLabel").textContent = labels[input.value];
    });
  });
  $("#proofCapture").addEventListener("click", () => toast("인증 사진 촬영 화면으로 연결됩니다."));
}

bindEvents();
renderShotTabs();
renderPreview();
renderCategoryRail();
renderCapturePlan();
updateDraftCount();
