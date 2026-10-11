const STORAGE_KEY = "bobaedream-dealer-video-studio-v2";

const vehicles = [
  {
    id: "BBM-24003182",
    name: "제네시스 GV80 2.5T AWD",
    number: "240모 3182",
    year: "2024년 3월",
    mileage: "18,240km",
    fuel: "가솔린",
    price: "6,780만원",
    status: "판매중",
    image: "/assets/detail/raw-20.jpeg",
  },
  {
    id: "BBM-36908487",
    name: "맥라렌 570S 쿠페",
    number: "369우 8487",
    year: "2019년",
    mileage: "31,500km",
    fuel: "가솔린",
    price: "15,900만원",
    status: "판매중",
    image: "/assets/detail/raw-19.jpeg",
  },
  {
    id: "BBM-27048757",
    name: "포르쉐 718 박스터 GTS",
    number: "270나 8757",
    year: "2021년",
    mileage: "22,100km",
    fuel: "가솔린",
    price: "11,800만원",
    status: "판매중",
    image: "/assets/detail/raw-18.jpeg",
  },
];

const defaultImages = [
  ["img-1", "/assets/detail/raw-20.jpeg", "대표 외관"],
  ["img-2", "/assets/detail/raw-18.jpeg", "전면"],
  ["img-3", "/assets/detail/raw-10.jpeg", "측면"],
  ["img-4", "/assets/detail/raw-09.jpeg", "실내"],
  ["img-5", "/assets/detail/raw-07.jpeg", "주요 옵션"],
  ["img-6", "/assets/detail/raw-05.jpeg", "디테일"],
  ["img-7", "/assets/detail/raw-04.png", "인포테인먼트"],
  ["img-8", "/assets/detail/raw-19.jpeg", "후면 디테일"],
].map(([id, src, label]) => ({ id, src, label, local: false }));

const state = {
  step: 1,
  vehicleId: vehicles[0].id,
  images: defaultImages.map((item) => ({ ...item })),
  template: "clean",
  ratio: "vertical",
  music: "drive",
  duration: 30,
  rawVideoName: "",
  generated: false,
  previewIndex: 0,
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
let previewTimer;
let saveTimer;

document.addEventListener("DOMContentLoaded", init);

function init() {
  restoreDraft();
  bindEvents();
  renderAll();
  startPreview();
}

function restoreDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) return;
    state.step = Math.min(4, Math.max(1, Number(saved.step) || 1));
    state.vehicleId = vehicles.some((vehicle) => vehicle.id === saved.vehicleId) ? saved.vehicleId : state.vehicleId;
    state.template = ["clean", "dynamic", "premium"].includes(saved.template) ? saved.template : state.template;
    state.ratio = ["vertical", "square", "wide"].includes(saved.ratio) ? saved.ratio : state.ratio;
    state.music = ["drive", "premium", "none"].includes(saved.music) ? saved.music : state.music;
    state.duration = [15, 30, 45].includes(Number(saved.duration)) ? Number(saved.duration) : state.duration;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function persistDraft() {
  $("#saveState").classList.add("saving");
  $("#saveState").lastChild.textContent = "저장 중";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const draft = {
      step: state.step,
      vehicleId: state.vehicleId,
      template: state.template,
      ratio: state.ratio,
      music: state.music,
      duration: state.duration,
      title: $("#projectTitle").value,
      contact: $("#contactNumber").value,
      caption: $("#caption").value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    $("#saveState").classList.remove("saving");
    $("#saveState").lastChild.textContent = "임시저장 완료";
  }, 350);
}

function bindEvents() {
  $("#nextButton").addEventListener("click", handleNext);
  $("#backButton").addEventListener("click", () => setStep(state.step - 1));
  $("#openInventory").addEventListener("click", openInventory);
  $$('[data-close-modal]').forEach((button) => button.addEventListener("click", closeInventory));
  $("#vehicleSearch").addEventListener("input", renderInventory);
  $("#imageInput").addEventListener("change", handleImageUpload);
  $("#videoInput").addEventListener("change", handleVideoUpload);
  $("#resetImages").addEventListener("click", resetImages);
  $("#templateGrid").addEventListener("click", handleChoice);
  $("#ratioGrid").addEventListener("click", handleChoice);
  $("#musicList").addEventListener("click", handleChoice);
  $("#durationGrid").addEventListener("click", handleChoice);
  $("#channelGrid").addEventListener("change", () => { renderSummary(); persistDraft(); });
  $("#caption").addEventListener("input", () => { renderCaptionCount(); persistDraft(); });
  $("#projectTitle").addEventListener("input", () => { renderPreview(); persistDraft(); });
  $("#contactNumber").addEventListener("input", persistDraft);
  $("#refreshPreview").addEventListener("click", startPreview);
  $("#downloadResult").addEventListener("click", downloadProjectSummary);
  $("#helpButton").addEventListener("click", openGuide);
  $("#closeGuide").addEventListener("click", closeGuide);
  $("#menuButton").addEventListener("click", () => $(".sidebar").classList.toggle("open"));
  $("#vehicleSourceTabs").addEventListener("click", switchVehicleSource);
  $("#lookupPlate").addEventListener("click", lookupPlate);
  $("#useManualVehicle").addEventListener("click", useManualVehicle);
  $("#closeProject").addEventListener("click", () => showToast("현재 작업은 임시저장되어 있습니다."));
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeInventory();
    closeGuide();
    $(".sidebar").classList.remove("open");
  });
}

function renderAll() {
  const saved = safeSavedDraft();
  if (saved.title) $("#projectTitle").value = saved.title;
  if (saved.contact) $("#contactNumber").value = saved.contact;
  if (saved.caption) $("#caption").value = saved.caption;
  renderVehicle();
  renderImages();
  renderSourceVideo();
  renderChoices();
  renderSummary();
  renderCaptionCount();
  renderPreview();
  renderStep();
}

function safeSavedDraft() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {}; }
  catch { return {}; }
}

function getVehicle() {
  return vehicles.find((vehicle) => vehicle.id === state.vehicleId) || vehicles[0];
}

function renderVehicle() {
  const vehicle = getVehicle();
  $("#selectedVehicle").innerHTML = `
    <img src="${vehicle.image}" alt="${vehicle.name}" />
    <div class="vehicle-info">
      <span>${vehicle.status} · 매물번호 ${vehicle.id.replace("BBM-", "")}</span>
      <h3>${vehicle.name}</h3>
      <p>${vehicle.number} · 성능점검 완료 · 보험이력 공개</p>
      <div class="vehicle-stats">
        <div><span>연식</span><b>${vehicle.year}</b></div>
        <div><span>주행거리</span><b>${vehicle.mileage}</b></div>
        <div><span>연료</span><b>${vehicle.fuel}</b></div>
        <div><span>판매가</span><b>${vehicle.price}</b></div>
      </div>
    </div>`;
}

function openInventory() {
  renderInventory();
  $("#inventoryModal").classList.add("open");
  $("#inventoryModal").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(() => $("#vehicleSearch").focus(), 0);
}

function closeInventory() {
  $("#inventoryModal").classList.remove("open");
  $("#inventoryModal").setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function renderInventory() {
  const query = $("#vehicleSearch").value.trim().toLowerCase();
  const results = vehicles.filter((vehicle) => `${vehicle.name} ${vehicle.number} ${vehicle.id}`.toLowerCase().includes(query));
  $("#inventoryList").innerHTML = results.length ? results.map((vehicle) => `
    <article class="inventory-item">
      <img src="${vehicle.image}" alt="${vehicle.name}" />
      <div><b>${vehicle.name}</b><span>${vehicle.year} · ${vehicle.mileage} · ${vehicle.price}</span><span>${vehicle.number} · ${vehicle.id}</span></div>
      <button type="button" data-vehicle-id="${vehicle.id}">${vehicle.id === state.vehicleId ? "선택됨" : "선택"}</button>
    </article>`).join("") : `<div class="import-note"><span class="note-icon">i</span><div><strong>검색 결과가 없습니다</strong><p>차량명이나 차량번호를 다시 확인해 주세요.</p></div></div>`;
  $$('[data-vehicle-id]', $("#inventoryList")).forEach((button) => button.addEventListener("click", () => selectVehicle(button.dataset.vehicleId)));
}

function selectVehicle(vehicleId) {
  state.vehicleId = vehicleId;
  state.generated = false;
  const vehicle = getVehicle();
  $("#projectTitle").value = `${vehicle.name.split(" ").slice(0, 2).join(" ")}, 오늘의 추천 매물`;
  renderVehicle();
  renderPreview();
  persistDraft();
  closeInventory();
  showToast(`${vehicle.name} 매물을 불러왔습니다.`);
}

function renderImages() {
  $("#imageCount").textContent = state.images.length;
  $("#imageList").innerHTML = state.images.map((image, index) => `
    <article class="image-item ${index === 0 ? "cover" : ""}" data-image-id="${image.id}">
      <img src="${image.src}" alt="${image.label}" />
      <span class="image-order">${index + 1}</span>
      ${index === 0 ? '<span class="cover-tag">표지</span>' : ""}
      <div class="image-actions"><button type="button" data-cover="${image.id}">표지</button><div><button type="button" data-move="-1" aria-label="앞으로 이동">←</button><button type="button" data-move="1" aria-label="뒤로 이동">→</button><button type="button" data-remove="${image.id}" aria-label="삭제">삭제</button></div></div>
    </article>`).join("");
  $$('[data-cover]').forEach((button) => button.addEventListener("click", () => makeCover(button.dataset.cover)));
  $$('[data-remove]').forEach((button) => button.addEventListener("click", () => removeImage(button.dataset.remove)));
  $$('[data-move]').forEach((button) => button.addEventListener("click", () => {
    const id = button.closest("[data-image-id]").dataset.imageId;
    moveImage(id, Number(button.dataset.move));
  }));
}

function renderSourceVideo() {
  const container = $("#sourceVideo");
  if (!state.rawVideoName) {
    container.className = "source-video empty";
    container.innerHTML = `<span class="source-video-icon">MOV</span><div><b>원본 영상은 선택 사항입니다</b><span>워크어라운드 영상을 추가하면 AI가 하이라이트를 함께 구성합니다.</span></div>`;
    return;
  }
  container.className = "source-video";
  container.innerHTML = `<span class="source-video-icon">MOV</span><div><b>${escapeHtml(state.rawVideoName)}</b><span>세로 리프레임 · 흔들림 검사 · 자동 자막 적용 예정</span></div><button type="button" id="removeSourceVideo">제외</button>`;
  $("#removeSourceVideo").addEventListener("click", () => {
    state.rawVideoName = "";
    state.generated = false;
    renderSourceVideo();
    showToast("원본 영상을 제외했습니다.");
  });
}

function handleImageUpload(event) {
  const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/")).slice(0, Math.max(0, 20 - state.images.length));
  if (!files.length) return;
  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = () => {
      state.images.push({ id: `upload-${Date.now()}-${index}`, src: reader.result, label: file.name, local: true });
      renderImages();
      renderPreview();
    };
    reader.readAsDataURL(file);
  });
  event.target.value = "";
  state.generated = false;
  showToast(`${files.length}장의 사진을 추가했습니다.`);
}

function handleVideoUpload(event) {
  const file = event.target.files?.[0];
  if (!file || !file.type.startsWith("video/")) return;
  state.rawVideoName = file.name;
  state.generated = false;
  renderSourceVideo();
  event.target.value = "";
  showToast("원본 영상 품질 검사를 완료했습니다.");
}

function resetImages() {
  state.images = defaultImages.map((item) => ({ ...item }));
  state.generated = false;
  renderImages();
  startPreview();
  showToast("기본 매물 사진 순서로 복원했습니다.");
}

function makeCover(id) {
  const index = state.images.findIndex((image) => image.id === id);
  if (index <= 0) return;
  const [image] = state.images.splice(index, 1);
  state.images.unshift(image);
  state.generated = false;
  state.previewIndex = 0;
  renderImages();
  renderPreview();
  showToast("표지 사진을 변경했습니다.");
}

function moveImage(id, direction) {
  const index = state.images.findIndex((image) => image.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= state.images.length) return;
  [state.images[index], state.images[target]] = [state.images[target], state.images[index]];
  state.generated = false;
  renderImages();
  renderPreview();
}

function removeImage(id) {
  if (state.images.length <= 7) {
    showToast("영상 제작에는 사진이 최소 7장 필요합니다.");
    return;
  }
  state.images = state.images.filter((image) => image.id !== id);
  state.previewIndex = 0;
  state.generated = false;
  renderImages();
  renderPreview();
  showToast("사진을 제외했습니다.");
}

function handleChoice(event) {
  const template = event.target.closest("[data-template]");
  const ratio = event.target.closest("[data-ratio]");
  const music = event.target.closest("[data-music]");
  const duration = event.target.closest("[data-duration]");
  if (template) state.template = template.dataset.template;
  if (ratio) state.ratio = ratio.dataset.ratio;
  if (music) state.music = music.dataset.music;
  if (duration) state.duration = Number(duration.dataset.duration);
  if (!template && !ratio && !music && !duration) return;
  state.generated = false;
  renderChoices();
  renderPreview();
  renderSummary();
  persistDraft();
}

function renderChoices() {
  $$('[data-template]').forEach((button) => button.classList.toggle("selected", button.dataset.template === state.template));
  $$('[data-ratio]').forEach((button) => button.classList.toggle("selected", button.dataset.ratio === state.ratio));
  $$('[data-music]').forEach((button) => {
    const selected = button.dataset.music === state.music;
    button.classList.toggle("selected", selected);
    $("em", button).textContent = selected ? "선택됨" : "선택";
  });
  $$('[data-duration]').forEach((button) => button.classList.toggle("selected", Number(button.dataset.duration) === state.duration));
}

function setStep(nextStep) {
  state.step = Math.min(4, Math.max(1, nextStep));
  renderStep();
  persistDraft();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderStep() {
  $$('[data-step-panel]').forEach((panel) => panel.classList.toggle("active", Number(panel.dataset.stepPanel) === state.step));
  $$('[data-step-nav]').forEach((item) => {
    const step = Number(item.dataset.stepNav);
    item.classList.toggle("active", step === state.step);
    item.classList.toggle("done", step < state.step);
  });
  $("#backButton").disabled = state.step === 1;
  $("#stepStatus").textContent = `${state.step} / 4 단계`;
  $("#nextButton").textContent = ["", "사진 구성하기", "스타일 선택하기", "게시 설정하기", "영상 생성하기"][state.step];
}

function handleNext() {
  if (state.step === 2 && state.images.length < 7) {
    showToast("영상 제작에 사용할 사진을 7장 이상 선택해 주세요.");
    return;
  }
  if (state.step < 4) {
    setStep(state.step + 1);
    return;
  }
  const channels = getChannels();
  if (!channels.length) {
    showToast("사용할 채널을 하나 이상 선택해 주세요.");
    return;
  }
  if (!$("#rightsCheck").checked) {
    showToast("사진과 음악 사용 권한을 확인해 주세요.");
    return;
  }
  renderVideo();
}

function renderPreview() {
  const vehicle = getVehicle();
  const preview = $("#videoPreview");
  preview.className = `video-preview ${state.ratio} ${state.template}`;
  const image = state.images[state.previewIndex % state.images.length] || state.images[0];
  if (image) $("#previewImage").src = image.src;
  $("#previewVehicle").textContent = vehicle.name;
  $("#previewPrice").textContent = vehicle.price;
  $("#previewMeta").textContent = `${vehicle.year} · ${vehicle.mileage} · ${vehicle.fuel}`;
  const title = $("#projectTitle").value.trim();
  $("#previewEyebrow").textContent = title || "오늘의 추천 매물";
  $("#durationNote").textContent = `${state.duration}초 예상`;
  $("#resultOverlay").classList.toggle("show", state.generated);
}

function startPreview() {
  clearInterval(previewTimer);
  state.previewIndex = 0;
  $("#videoPreview").classList.remove("playing");
  void $("#videoPreview").offsetWidth;
  $("#videoPreview").classList.add("playing");
  renderPreview();
  previewTimer = setInterval(() => {
    if (state.generated || $("#renderOverlay").classList.contains("show")) return;
    state.previewIndex = (state.previewIndex + 1) % state.images.length;
    $("#previewImage").style.opacity = "0";
    setTimeout(() => {
      renderPreview();
      $("#previewImage").style.opacity = "1";
    }, 180);
  }, 2700);
}

function getChannels() {
  return $$('#channelGrid input:checked').map((input) => input.value);
}

function renderSummary() {
  const templateLabel = { clean: "클린", dynamic: "다이내믹", premium: "프리미엄" }[state.template];
  const ratioLabel = { vertical: "9:16", square: "1:1", wide: "16:9" }[state.ratio];
  const musicLabel = { drive: "City Drive", premium: "Premium Motion", none: "없음" }[state.music];
  $("#renderSummary").innerHTML = `
    <div><span>템플릿</span><b>${templateLabel}</b></div>
    <div><span>화면 비율</span><b>${ratioLabel}</b></div>
    <div><span>배경 음악</span><b>${musicLabel}</b></div>
    <div><span>영상 길이</span><b>${state.duration}초</b></div>`;
  $("#resultFilesText").textContent = `채널별 파일 ${Math.max(1, getChannels().length)}개가 준비되었습니다.`;
}

function renderCaptionCount() {
  const caption = $("#caption");
  if (caption.value.length > 300) caption.value = caption.value.slice(0, 300);
  $("#captionCount").textContent = caption.value.length;
}

function renderVideo() {
  if (state.generated) {
    $("#resultOverlay").classList.add("show");
    return;
  }
  const overlay = $("#renderOverlay");
  const button = $("#nextButton");
  overlay.classList.add("show");
  button.disabled = true;
  button.textContent = "영상 생성 중";
  let progress = 0;
  const timer = setInterval(() => {
    progress = Math.min(100, progress + Math.ceil(Math.random() * 13));
    $("#renderPercent").textContent = `${progress}%`;
    if (progress < 100) return;
    clearInterval(timer);
    setTimeout(() => {
      overlay.classList.remove("show");
      state.generated = true;
      $("#resultOverlay").classList.add("show");
      button.disabled = false;
      button.textContent = "결과 다시 보기";
      persistDraft();
      showToast("영상 시안이 준비되었습니다.");
    }, 350);
  }, 160);
}

function downloadProjectSummary() {
  const vehicle = getVehicle();
  const summary = {
    project: $("#projectTitle").value,
    vehicle: vehicle.name,
    listingId: vehicle.id,
    template: state.template,
    ratio: state.ratio,
    music: state.music,
    durationSeconds: state.duration,
    sourceVideo: state.rawVideoName || null,
    images: state.images.length,
    channels: getChannels(),
    caption: $("#caption").value,
    prototypeNotice: "실제 MP4 렌더링은 영상 생성 API 연결이 필요합니다.",
  };
  const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bobaedream-video-project-${vehicle.id}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  showToast("영상 제작 설정 파일을 내려받았습니다.");
}

function openGuide() {
  $("#guideDrawer").classList.add("open");
  $("#guideDrawer").setAttribute("aria-hidden", "false");
}

function switchVehicleSource(event) {
  const button = event.target.closest("[data-source]");
  if (!button) return;
  $$('[data-source]').forEach((item) => item.classList.toggle("selected", item === button));
  $$('[data-source-panel]').forEach((panel) => panel.classList.toggle("active", panel.dataset.sourcePanel === button.dataset.source));
}

function lookupPlate() {
  const query = $("#plateNumber").value.replace(/\s/g, "").toLowerCase();
  if (!query) {
    showToast("차량번호를 입력해 주세요.");
    return;
  }
  const vehicle = vehicles.find((item) => item.number.replace(/\s/g, "").toLowerCase() === query) || vehicles[0];
  $("#plateResult").innerHTML = `<article class="inventory-item"><img src="${vehicle.image}" alt="${vehicle.name}" /><div><b>${vehicle.name}</b><span>${vehicle.year} · ${vehicle.mileage} · ${vehicle.price}</span><span>조회 후보 · 최종 정보는 딜러 확인 필요</span></div><button type="button" id="usePlateVehicle">이 차량 사용</button></article>`;
  $("#usePlateVehicle").addEventListener("click", () => selectVehicle(vehicle.id));
}

function useManualVehicle() {
  const maker = $("#manualMaker").value;
  const model = $("#manualModel").value;
  const trim = $("#manualTrim").value;
  const manualId = "BBM-MANUAL";
  const existing = vehicles.find((vehicle) => vehicle.id === manualId);
  const manualVehicle = {
    id: manualId,
    name: `${maker} ${model} ${trim}`,
    number: "차량번호 미입력",
    year: "연식 확인 필요",
    mileage: "주행거리 확인 필요",
    fuel: trim.includes("디젤") ? "디젤" : "가솔린",
    price: "가격 입력 필요",
    status: "작성중",
    image: defaultImages[0].src,
  };
  if (existing) Object.assign(existing, manualVehicle);
  else vehicles.push(manualVehicle);
  selectVehicle(manualId);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function closeGuide() {
  $("#guideDrawer").classList.remove("open");
  $("#guideDrawer").setAttribute("aria-hidden", "true");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2300);
}
