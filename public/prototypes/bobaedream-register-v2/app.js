const slots = [
  "좌전방 45°",
  "차량 정면",
  "우전방 45°",
  "우측면",
  "차량 후면",
  "좌측면",
  "계기판",
  "실내",
  "엔진룸",
  "트렁크",
  ...Array.from({ length: 20 }, (_, index) => `기타 ${index + 1}`),
];

const samplePhotos = [
  "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=420&q=80",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=420&q=80",
  "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=420&q=80",
  "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=420&q=80",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=420&q=80",
  "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=420&q=80",
];

const videoTemplateImages = [
  samplePhotos[1],
  samplePhotos[5],
  samplePhotos[4],
  samplePhotos[2],
];

const state = {
  view: "main",
  progress: 32,
  city: "서울",
  verification: "차량명판",
  photos: [],
  activeSlot: 0,
  cameraMode: "camera",
  albumSelected: [],
  maskPlate: false,
  previewIndex: 0,
  previewTool: null,
  pendingDelete: null,
  videoPhase: "record",
  videoSegment: 0,
  videoRecording: false,
  videoPaused: false,
  videoDurations: [0, 0, 0, 0],
  videoAlbumSelected: false,
  videoCoverFrame: 0,
  videoDone: false,
  modal: null,
  toast: "",
  dragIndex: null,
  suppressPreviewUntil: 0,
};

const screen = document.querySelector("#screenRoot");

const captureInputs = createCaptureInputs();
const liveCamera = {
  stream: null,
  mode: null,
  renderId: 0,
  recorder: null,
  chunks: [],
};

const videoSegments = ["차량 외관", "차량 실내", "엔진룸", "트렁크"];
let videoTimer = null;

const demoParams = new URLSearchParams(window.location.search);
if (demoParams.get("empty") === "1") {
  state.photos = [];
  state.activeSlot = 0;
}
if (["main", "camera", "preview", "video"].includes(demoParams.get("view"))) {
  state.view = demoParams.get("view");
  if (state.view === "preview" && !state.photos.length) state.view = "camera";
}
if (["camera", "album"].includes(demoParams.get("cameraMode"))) {
  state.cameraMode = demoParams.get("cameraMode");
}
if (demoParams.has("videoSegment")) {
  const segment = Number(demoParams.get("videoSegment"));
  if (Number.isFinite(segment)) state.videoSegment = Math.max(0, Math.min(3, segment));
}
if (["record", "album", "preview", "cover"].includes(demoParams.get("videoPhase"))) {
  state.view = "video";
  state.videoPhase = demoParams.get("videoPhase");
}
if (demoParams.get("videoDone") === "1") {
  state.videoDone = true;
  state.videoDurations = [22, 22, 10, 0];
}
if (demoParams.get("modal") === "rules") state.modal = "rules";
if (demoParams.get("modal") === "video-exit") {
  state.view = "video";
  state.videoRecording = true;
  state.modal = "video-exit";
}
if (demoParams.get("shot") === "1") {
  state.photos = [
    {
      id: "shot-left-front",
      slot: 0,
      label: "좌전 45°",
      src: samplePhotos[0],
      edits: defaultPhotoEdits(),
    },
  ];
  state.activeSlot = 1;
}
if (demoParams.has("photos")) {
  const count = Math.max(0, Math.min(30, Number(demoParams.get("photos")) || 0));
  state.photos = Array.from({ length: count }, (_, index) => ({
    id: `demo-photo-${index}`,
    slot: index,
    label: slots[index] || `기타 ${index + 1}`,
    src: samplePhotos[index % samplePhotos.length],
    edits: defaultPhotoEdits(),
  }));
  state.activeSlot = firstMissingSlot();
}

const chototIconBase = "./assets/chotot-icons/";
const chototIcons = {
  x: "chotot-listing-register-close-window.svg",
  "trash-2": "chotot-listing-register-image-upload-delete.svg",
  "circle-help": "chotot-listing-register-info.svg",
  "message-circle": "chotot-listing-register-info.svg",
  "chevron-left": "chotot-listing-register-caret-down.svg",
  "chevron-right": "chotot-listing-register-caret-down.svg",
  photo: "chotot-listing-register-image-upload-color-change.svg",
  camera: "chotot-listing-register-image-upload-color-change.svg",
  video: "chotot-listing-register-image-upload-color-change.svg",
  "image-upload": "chotot-listing-register-image-upload-color-change.svg",
  image: "chotot-common-image.svg",
  album: "chotot-common-image-attach-gray.svg",
  "badge-check": "chotot-listing-register-check-mark.svg",
  "check-mark": "chotot-listing-register-check-mark.svg",
  "caret-down": "chotot-listing-register-caret-down.svg",
  dropdown: "chotot-listing-register-dropdown.svg",
  badge: "chotot-listing-register-detail-info.svg",
};

const iconRotations = {
  "chevron-left": 90,
  "chevron-right": -90,
};

function icon(name, size = 21) {
  const filename = chototIcons[name];
  if (filename) {
    const rotate = iconRotations[name] ? `--icon-rotate:${iconRotations[name]}deg;` : "";
    return `<img class="ui-icon chotot-icon ui-icon-${name}" src="${chototIconBase}${filename}" alt="" aria-hidden="true" style="width:${size}px;height:${size}px;${rotate}" />`;
  }
  const label = { archive: "임", plus: "+", "scan-face": "가", grip: "모", "rotate-cw": "회", crop: "자", zap: "번", play: "▶" }[name] || "?";
  return `<span class="ui-icon icon-placeholder ui-icon-${name}" aria-hidden="true" style="width:${size}px;height:${size}px">${label}</span>`;
}

function uploadAssetIcon(type, size = 42) {
  return icon(type === "video" ? "video" : "photo", size);
}

function defaultPhotoEdits() {
  return {
    plate: false,
    mosaic: false,
    rotate: 0,
    crop: 0,
  };
}

function photoEdits(photo) {
  if (!photo.edits) photo.edits = defaultPhotoEdits();
  return photo.edits;
}

function photoLayerStyle(photo) {
  const edits = photoEdits(photo);
  const cropScales = [1, 1.14, 1.28];
  const scale = cropScales[edits.crop] || 1;
  return `background-image:url('${photo.src}');transform:rotate(${edits.rotate}deg) scale(${scale})`;
}

function photoEditBadges(photo, variant = "") {
  const edits = photoEdits(photo);
  const variantClass = variant ? ` ${variant}` : "";
  return `
    ${edits.plate ? `<span class="plate-mask${variantClass}" aria-hidden="true"></span>` : ""}
    ${edits.mosaic ? `<span class="mosaic-mask${variantClass}" aria-hidden="true"></span>` : ""}
  `;
}

function updateIcons() {
  return true;
}

function setView(view) {
  state.view = view;
  state.modal = null;
  render();
}

function setCameraMode(mode) {
  state.cameraMode = mode;
  if (mode === "camera") state.albumSelected = [];
  render();
}

function showToast(message) {
  state.toast = message;
  render();
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    state.toast = "";
    render();
  }, 1600);
}

function audioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext.instance) audioContext.instance = new AudioContextClass();
  if (audioContext.instance.state === "suspended") audioContext.instance.resume().catch(() => {});
  return audioContext.instance;
}

function playBeep({ frequency = 880, duration = 0.08, gain = 0.12, type = "square", delay = 0 }) {
  const context = audioContext();
  if (!context) return;
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const volume = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.006);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(volume);
  volume.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playShutterSound() {
  const context = audioContext();
  if (!context) return;
  const duration = 0.055;
  const length = Math.floor(context.sampleRate * duration);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    const envelope = 1 - index / length;
    data[index] = (Math.random() * 2 - 1) * envelope * envelope;
  }
  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  noise.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = 2800;
  filter.Q.value = 0.9;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.42, context.currentTime + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  noise.start();
  noise.stop(context.currentTime + duration);
}

function playRecordStartSound() {
  playBeep({ frequency: 880, duration: 0.07, gain: 0.13, type: "sine" });
}

function playRecordStopSound() {
  playBeep({ frequency: 660, duration: 0.06, gain: 0.12, type: "sine" });
  playBeep({ frequency: 440, duration: 0.07, gain: 0.1, type: "sine", delay: 0.075 });
}

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const secs = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
}

function totalVideoDuration() {
  return state.videoDurations.reduce((sum, seconds) => sum + seconds, 0);
}

function hasVideoDraft() {
  return state.videoDurations.some((seconds) => seconds > 0) || state.videoRecording;
}

function recordedVideoSegments() {
  return state.videoDurations
    .map((seconds, index) => ({ seconds, index, name: videoSegments[index] }))
    .filter((segment) => segment.seconds > 0);
}

function stopVideoTimer() {
  window.clearInterval(videoTimer);
  videoTimer = null;
}

function startVideoTimer() {
  stopVideoTimer();
  videoTimer = window.setInterval(() => {
    if (!state.videoRecording) {
      stopVideoTimer();
      return;
    }
    state.videoDurations[state.videoSegment] += 1;
    if (state.videoDurations[state.videoSegment] >= 22) {
      pauseCurrentVideoSegment(true);
      return;
    }
    render();
  }, 1000);
}

function pauseCurrentVideoSegment(autoPaused = false) {
  if (!state.videoRecording) return;
  playRecordStopSound();
  state.videoRecording = false;
  state.videoPaused = true;
  stopVideoTimer();
  if (liveCamera.recorder && liveCamera.recorder.state === "recording") {
    liveCamera.recorder.stop();
  }
  if (autoPaused) showToast("22초 도달: 다음 촬영은 계속을 눌러 진행합니다");
  render();
}

function startCurrentVideoSegment() {
  playRecordStartSound();
  state.videoRecording = true;
  state.videoPaused = false;
  state.videoPhase = "record";
  startVideoTimer();

  if (liveCamera.stream && typeof MediaRecorder !== "undefined") {
    try {
      liveCamera.chunks = [];
      const recorderOptions = MediaRecorder.isTypeSupported("video/webm") ? { mimeType: "video/webm" } : undefined;
      const recorder = new MediaRecorder(liveCamera.stream, recorderOptions);
      liveCamera.recorder = recorder;
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data?.size) liveCamera.chunks.push(event.data);
      });
      recorder.start();
    } catch {
      liveCamera.recorder = null;
    }
  }
  render();
}

function resetVideoDraft() {
  stopVideoTimer();
  state.videoPhase = "record";
  state.videoSegment = 0;
  state.videoRecording = false;
  state.videoPaused = false;
  state.videoDurations = [0, 0, 0, 0];
  state.videoAlbumSelected = false;
  state.videoCoverFrame = 0;
  state.videoDone = false;
  if (liveCamera.recorder && liveCamera.recorder.state === "recording") {
    liveCamera.recorder.stop();
  }
}

function stopLiveCamera() {
  liveCamera.renderId += 1;
  if (liveCamera.recorder && liveCamera.recorder.state !== "inactive") {
    liveCamera.recorder.stop();
  }
  if (liveCamera.stream) {
    liveCamera.stream.getTracks().forEach((track) => track.stop());
  }
  liveCamera.stream = null;
  liveCamera.mode = null;
  liveCamera.recorder = null;
  liveCamera.chunks = [];
}

function attachLiveStream(video) {
  if (!video || !liveCamera.stream) return;
  if (video.srcObject !== liveCamera.stream) video.srcObject = liveCamera.stream;
  video.play().catch(() => {});
}

async function startLiveCamera(mode) {
  const video = screen.querySelector("[data-camera-preview]");
  const stage = screen.querySelector("[data-camera-stage]");
  const error = screen.querySelector("[data-camera-error]");
  if (!video) return;

  if (liveCamera.stream && liveCamera.mode === mode) {
    attachLiveStream(video);
    stage?.classList.add("is-live");
    return;
  }

  stopLiveCamera();
  const renderId = ++liveCamera.renderId;

  if (!navigator.mediaDevices?.getUserMedia) {
    if (error) error.textContent = "이 브라우저는 실시간 카메라를 지원하지 않습니다. 셔터를 누르면 기본 카메라를 엽니다.";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
    if (renderId !== liveCamera.renderId) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    liveCamera.stream = stream;
    liveCamera.mode = mode;
    attachLiveStream(video);
    stage?.classList.add("is-live");
    if (error) error.textContent = "";
  } catch (errorObject) {
    if (error) error.textContent = "카메라 권한이 필요합니다. 권한 허용 후 다시 누르세요.";
    showToast("카메라 권한을 허용해 주세요");
  }
}

function photoDataUrlFromPreview() {
  const video = screen.querySelector("[data-camera-preview]");
  if (!video || !video.videoWidth || !video.videoHeight) return "";
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

function addPhotoFromDataUrl(slot = state.activeSlot, src) {
  if (!src) {
    openPhotoCapture();
    return;
  }
  if (state.photos.length >= 30) {
    showToast("사진은 최대 30장까지 등록할 수 있습니다");
    return;
  }
  if (photoForSlot(slot)) {
    slot = firstMissingSlot();
  }
  const usedSlot = slot;
  state.photos.push({
    id: `camera-${Date.now()}-${slot}`,
    slot,
    label: slots[slot] || `기타 ${state.photos.length + 1}`,
    src,
    edits: defaultPhotoEdits(),
  });
  state.activeSlot = nextMissingSlotAfter(usedSlot);
  state.progress = Math.max(state.progress, 38);
  showToast("사진이 등록되었습니다");
  render();
}

function addPhotoFromSource(slot = state.activeSlot, src, label, shouldRender = true) {
  if (!src) return;
  if (state.photos.length >= 30) {
    showToast("사진은 최대 30장까지 등록할 수 있습니다");
    return;
  }
  if (photoForSlot(slot)) {
    slot = firstMissingSlot();
  }
  const usedSlot = slot;
  state.photos.push({
    id: `album-${Date.now()}-${slot}-${Math.random().toString(16).slice(2)}`,
    slot,
    label: label || slots[slot] || `기타 ${state.photos.length + 1}`,
    src,
    edits: defaultPhotoEdits(),
  });
  state.activeSlot = nextMissingSlotAfter(usedSlot);
  state.progress = Math.max(state.progress, 38);
  if (shouldRender) render();
}

function capturePhotoFromLiveCamera() {
  if (!liveCamera.stream) {
    openPhotoCapture();
    return;
  }
  playShutterSound();
  addPhotoFromDataUrl(state.activeSlot, photoDataUrlFromPreview());
}

function toggleVideoRecording() {
  if (state.videoRecording) {
    pauseCurrentVideoSegment(false);
    return;
  }
  startCurrentVideoSegment();
}

function firstMissingSlot() {
  const taken = new Set(state.photos.map((photo) => photo.slot));
  const priority = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  return priority.find((slot) => !taken.has(slot)) ?? state.photos.length;
}

function nextMissingSlotAfter(fromSlot) {
  const taken = new Set(state.photos.map((photo) => photo.slot));
  for (let slot = fromSlot + 1; slot < slots.length; slot += 1) {
    if (!taken.has(slot)) return slot;
  }
  return firstMissingSlot();
}

function photoForSlot(slot) {
  return state.photos.find((photo) => photo.slot === slot);
}

function createCaptureInputs() {
  const makeInput = ({ accept, capture, multiple = false }) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    if (capture) input.setAttribute("capture", capture);
    if (multiple) input.multiple = true;
    input.hidden = true;
    input.tabIndex = -1;
    document.body.appendChild(input);
    return input;
  };

  const inputs = {
    photoCamera: makeInput({ accept: "image/*", capture: "environment" }),
    photoAlbum: makeInput({ accept: "image/*", multiple: true }),
    videoCamera: makeInput({ accept: "video/*", capture: "environment" }),
  };

  inputs.photoCamera.addEventListener("change", () => {
    const file = inputs.photoCamera.files?.[0];
    if (file) addPhotoFromFile(state.activeSlot, file);
    inputs.photoCamera.value = "";
  });

  inputs.photoAlbum.addEventListener("change", () => {
    Array.from(inputs.photoAlbum.files || []).forEach((file) => addPhotoFromFile(firstMissingSlot(), file, false));
    inputs.photoAlbum.value = "";
    if (state.photos.length) {
      state.cameraMode = "camera";
      showToast("앨범 사진이 추가되었습니다");
    }
  });

  inputs.videoCamera.addEventListener("change", () => {
    const file = inputs.videoCamera.files?.[0];
    if (!file) return;
    state.videoRecording = false;
    state.videoDone = true;
    state.progress = Math.max(state.progress, 42);
    showToast("영상이 등록되었습니다");
    inputs.videoCamera.value = "";
  });

  return inputs;
}

function addPhoto(slot = state.activeSlot) {
  if (state.photos.length >= 30) {
    showToast("사진은 최대 30장까지 등록할 수 있습니다");
    return;
  }
  if (photoForSlot(slot)) {
    showToast("이미 등록된 각도입니다");
    return;
  }
  const usedSlot = slot;
  const photo = {
    id: `p-${Date.now()}-${slot}`,
    slot,
    label: slots[slot],
    src: samplePhotos[state.photos.length % samplePhotos.length],
    edits: defaultPhotoEdits(),
  };
  state.photos.push(photo);
  state.activeSlot = nextMissingSlotAfter(usedSlot);
  state.progress = Math.max(state.progress, 38);
  render();
}

function addPhotoFromFile(slot = state.activeSlot, file, shouldRender = true) {
  if (state.photos.length >= 30) {
    showToast("사진은 최대 30장까지 등록할 수 있습니다");
    return;
  }
  if (photoForSlot(slot)) {
    slot = firstMissingSlot();
  }
  const usedSlot = slot;
  const photo = {
    id: `file-${Date.now()}-${slot}-${Math.random().toString(16).slice(2)}`,
    slot,
    label: slots[slot] || `기타 ${state.photos.length + 1}`,
    src: URL.createObjectURL(file),
    fileName: file.name,
    edits: defaultPhotoEdits(),
  };
  state.photos.push(photo);
  state.activeSlot = nextMissingSlotAfter(usedSlot);
  state.progress = Math.max(state.progress, 38);
  if (shouldRender) render();
}

function openPhotoCapture() {
  captureInputs.photoCamera.click();
}

function openAlbumPicker() {
  captureInputs.photoAlbum.click();
}

function openVideoCapture() {
  captureInputs.videoCamera.click();
}

function deletePhoto(id, withConfirm) {
  const photo = state.photos.find((item) => item.id === id);
  if (!photo) return;
  if (withConfirm) {
    state.pendingDelete = id;
    state.modal = "delete-photo";
    render();
    return;
  }
  state.photos = state.photos.filter((item) => item.id !== id);
  state.activeSlot = firstMissingSlot();
  if (state.previewIndex >= state.photos.length) {
    state.previewIndex = Math.max(0, state.photos.length - 1);
  }
  if (!state.photos.length) {
    state.progress = 32;
  }
  render();
}

function confirmDelete() {
  if (state.pendingDelete) {
    state.photos = state.photos.filter((item) => item.id !== state.pendingDelete);
    state.pendingDelete = null;
    state.activeSlot = firstMissingSlot();
    if (!state.photos.length) state.progress = 32;
  }
  state.modal = null;
  render();
}

function openPreview(index) {
  if (!state.photos.length) return;
  state.previewIndex = Math.max(0, Math.min(index, state.photos.length - 1));
  setView("preview");
}

function movePhoto(from, to) {
  if (from === null || from === to || to < 0 || to >= state.photos.length) return;
  const copy = [...state.photos];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  state.photos = copy;
  render();
}

function mainView() {
  const completed = state.photos.length > 0 || state.videoDone;
  return `
    <div class="app-view">
      <header class="topbar">
        <div class="topbar-row">
          <button class="icon-button" aria-label="뒤로">${icon("chevron-left", 28)}</button>
          <div class="top-title">
            <h2>매물등록 V2</h2>
            <small>완성도 ${state.progress}%</small>
          </div>
          <button class="draft-link" type="button">임시저장<span class="badge">4</span></button>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${state.progress}%"></div></div>
      </header>

      <div class="scroll-body">
        <section class="section">
          <div class="section-title"><div class="title-with-required"><h3>차량 소재지</h3><span class="required">(필수)</span></div></div>
          <div class="field-line"><span>${state.city}</span>${icon("chevron-right", 20)}</div>
        </section>

        <section class="section">
          <div class="section-title">
            <div class="title-with-required"><h3>${completed ? "차량 사진 인식 완료" : "사진/영상 등록"}</h3><span class="required">(필수)</span></div>
            <button class="help-link" type="button" data-action="rules">${icon("circle-help", 16)} 촬영규칙</button>
          </div>
          <p class="alert-copy">첫 사진은 좌전 45° 차량 사진을 사용하면 <span>목록 노출 효과가 좋습니다.</span></p>
          ${
            completed
              ? `<div class="tip-card source-tip">
                  <div class="tip-head">
                    <span class="tip-icon">${icon("message-circle", 24)}</span>
                    <span>게시 팁</span>
                    <span class="tip-toggle">${icon("chevron-right", 18)}</span>
                  </div>
                  <p>노출을 높이려면 차량 각도 사진을 모두 올려주세요. 시스템 기준으로 아직 <b>${Math.max(0, 10 - state.photos.length)}</b>개 각도가 부족합니다.</p>
                </div>`
              : ""
          }
          <div class="media-grid ${completed ? "is-completed" : "is-empty"}" id="mainMediaGrid">
            ${state.photos
              .map(
                (photo, index) => {
                  const edits = photoEdits(photo);
                  return `
                  <div class="media-card" draggable="true" data-drag-index="${index}">
                    <button class="thumb" data-action="preview" data-index="${index}" aria-label="${photo.label} 미리보기">
                      <span class="thumb-layer ${edits.mosaic ? "is-mosaic" : ""}" style="${photoLayerStyle(photo)}"></span>
                      ${photoEditBadges(photo, "is-thumb")}
                    </button>
                    <button class="delete-chip" data-action="main-delete" data-id="${photo.id}" aria-label="사진 삭제">${icon("trash-2", 16)}</button>
                    <label>${photo.label}</label>
                  </div>`;
                },
              )
              .join("")}
            ${
              state.videoDone
                ? `<div class="media-card video-result-card">
                    <button class="thumb video-thumb" data-action="video" aria-label="영상 미리보기">
                      <span class="video-thumb-logo">58</span>
                      <span class="video-thumb-play">${icon("play", 22)}</span>
                      <span class="video-thumb-time">${formatDuration(totalVideoDuration() || 56)}</span>
                    </button>
                    <button class="delete-chip" data-action="video-delete" aria-label="영상 삭제">${icon("trash-2", 16)}</button>
                    <label>차량 영상</label>
                  </div>`
                : ""
            }
            <button class="add-card count-card" type="button" data-action="photo-camera">
              ${uploadAssetIcon("photo", 42)}
              <span>${completed ? `${state.photos.length}/30` : "사진 추가"}</span>
            </button>
            ${
              state.videoDone
                ? ""
                : `<button class="add-card" type="button" data-action="video">
                    ${uploadAssetIcon("video", 42)}
                    <span>영상 추가</span>
                  </button>`
            }
          </div>
        </section>

        <section class="section">
          <div class="section-title"><div class="title-with-required"><h3>차량 인증</h3><span class="required">(하나 선택)</span></div></div>
          <div class="radio-row">
            ${["등록증", "성능기록", "차량명판"]
              .map(
                (item) => `<button class="radio-button ${state.verification === item ? "is-active" : ""}" data-action="verify" data-value="${item}" type="button">${item}</button>`,
              )
              .join("")}
          </div>
          <button class="doc-upload" type="button" data-action="doc-upload">
            ${icon("badge", 34)}
            <span>${state.verification} 실사 촬영</span>
          </button>
        </section>

        <section class="section">
          <div class="section-title"><div class="title-with-required"><h3>VIN번호</h3><span class="required">(필수)</span>${icon("circle-help", 17)}</div></div>
          <div class="field-card">
            ${[
              ["제조사/모델", "현대 쏘나타"],
              ["연식", "2021년"],
              ["주행거리", "42,000 km"],
              ["연료", "가솔린"],
              ["판매가격", "1,860만원"],
            ]
              .map((row) => `<div class="form-row"><span>${row[0]}</span><span>${row[1]} ${icon("chevron-right", 16)}</span></div>`)
              .join("")}
          </div>
        </section>
      </div>

      <footer class="bottom-bar">
        <button class="save-draft" type="button">${icon("archive", 24)} 임시저장</button>
        <button class="primary-cta" type="button">매물 등록하기</button>
      </footer>
      ${modalLayer()}
      ${toastLayer()}
    </div>`;
}

function cameraView() {
  const albumMode = state.cameraMode === "album";
  return `
    <div class="camera-view ${albumMode ? "is-album" : "is-camera"}">
      <header class="dark-topbar">
        <button class="icon-button dark-button" data-action="close-camera" aria-label="닫기">${icon("x", 30)}</button>
        <h2>${albumMode ? "내 사진첩" : "사진 촬영"}</h2>
        <span></span>
      </header>

      ${
        albumMode
          ? `<div class="album-guide-pill">우선 등록 각도: 좌전방 45° · 차량 정면 · 우전방 45° · 측면</div>
             <div class="album-grid">
              ${samplePhotos
                .map(
                  (src, index) => {
                    const selected = state.albumSelected.includes(index);
                    return `<button class="album-item ${selected ? "is-selected" : ""}" data-action="album-photo" data-index="${index}" style="background-image:url('${src}')" aria-label="앨범 사진 ${index + 1}">
                      <span class="album-photo-check">${selected ? icon("check-mark", 16) : ""}</span>
                      <b>${slots[index]}</b>
                    </button>`;
                  },
                )
                .join("")}
             </div>
             <div class="album-bottom">
               <span>${state.albumSelected.length}/30</span>
               <button class="finish-small" data-action="album-confirm" type="button">완료</button>
             </div>`
          : `<div class="camera-stage" data-camera-stage>
              <video class="live-camera-feed" data-camera-preview playsinline autoplay muted></video>
              <div class="guide-pill">${slots[state.activeSlot]} 촬영</div>
              <p class="camera-permission-copy" data-camera-error>카메라 권한을 허용하면 실제 화면이 표시됩니다.</p>
            </div>
            <div class="slot-rail">
              ${slots
                .map((slot, index) => {
                  const photo = photoForSlot(index);
                  return `<div class="slot-card ${state.activeSlot === index ? "is-active" : ""} ${photo ? "has-photo" : ""}" style="${photo ? `background-image:url('${photo.src}')` : ""}">
                    <button type="button" data-action="slot-select" data-slot="${index}">${slot}</button>
                    ${photo ? `<button class="slot-delete" data-action="slot-delete" data-id="${photo.id}" aria-label="${slot} 삭제">${icon("x", 14)}</button>` : ""}
                  </div>`;
                })
                .join("")}
            </div>
            <div class="camera-controls">
        <button class="mask-toggle ${state.maskPlate ? "is-active" : ""}" data-action="mask" type="button">${icon("scan-face", 22)}번호판가림</button>
              <button class="shutter" data-action="capture-photo" type="button" aria-label="촬영"></button>
              <div class="counter-finish">
                <strong>${state.photos.length}/30</strong>
                <button class="finish-small" data-action="finish-camera" type="button">완료</button>
              </div>
            </div>`
      }

      <div class="mode-tabs">
        <button class="${!albumMode ? "is-active" : ""}" data-action="mode-camera" type="button">촬영</button>
        <button class="${albumMode ? "is-active" : ""}" data-action="mode-album" type="button">앨범</button>
      </div>
      ${androidNav()}
      ${toastLayer()}
    </div>`;
}

function previewView() {
  const photo = state.photos[state.previewIndex];
  if (!photo) {
    return mainView();
  }
  const edits = photoEdits(photo);
  return `
    <div class="preview-view">
      <header class="dark-topbar">
        <button class="icon-button dark-button" data-action="preview-close" aria-label="닫기">${icon("x", 30)}</button>
        <h2>사진 미리보기(${state.previewIndex + 1})</h2>
        <span></span>
      </header>
      <div class="preview-photo">
        <div class="preview-photo-layer ${edits.mosaic ? "is-mosaic" : ""}" style="${photoLayerStyle(photo)}"></div>
        ${photoEditBadges(photo)}
      </div>
      <div class="preview-rail">
        <button class="preview-add" data-action="preview-add" type="button" aria-label="사진 추가">${icon("plus", 30)}</button>
        ${state.photos
          .map(
            (item, index) => {
              const itemEdits = photoEdits(item);
              return `
              <div class="preview-item ${index === state.previewIndex ? "is-active" : ""}">
                <button class="preview-thumb" data-action="preview-pick" data-index="${index}" aria-label="${item.label} 선택">
                  <span class="thumb-layer ${itemEdits.mosaic ? "is-mosaic" : ""}" style="${photoLayerStyle(item)}"></span>
                  ${photoEditBadges(item, "is-thumb")}
                </button>
                <button class="preview-delete" data-action="preview-delete" data-id="${item.id}" aria-label="사진 삭제">×</button>
                <span class="preview-label">${item.label}</span>
              </div>`;
            },
          )
          .join("")}
      </div>
      <div class="tool-row">
        ${[
          ["plate", "scan-face", "번호판", edits.plate],
          ["mosaic", "grip", "모자이크", edits.mosaic],
          ["rotate", "rotate-cw", "회전", edits.rotate !== 0],
          ["crop", "crop", "자르기", edits.crop > 0],
        ]
          .map(
            ([key, iconName, label, active]) => `<button class="edit-tool ${state.previewTool === key || active ? "is-active" : ""}" data-action="tool" data-tool="${key}" type="button">${icon(iconName, 27)}${label}</button>`,
          )
          .join("")}
        <button class="preview-finish" data-action="preview-finish" type="button">완료</button>
      </div>
      ${androidNav()}
      ${toastLayer()}
    </div>`;
}

function videoView() {
  if (state.videoPhase === "album") return videoAlbumView();
  if (state.videoPhase === "preview") return videoPreviewView();
  if (state.videoPhase === "cover") return videoCoverView();
  const activeDuration = state.videoDurations[state.videoSegment];
  const nextVisible = state.videoPaused || activeDuration > 0;
  return `
    <div class="video-view is-record">
      <header class="dark-topbar">
        <button class="icon-button dark-button" data-action="video-close" aria-label="닫기">${icon("x", 30)}</button>
        <h2>차량 영상</h2>
        <button class="icon-button dark-button flash-button" type="button" aria-label="플래시">${icon("zap", 31)}</button>
      </header>
      <span class="video-header-timer">${state.videoRecording ? formatDuration(activeDuration) : ""}</span>
      <div class="video-stage" data-camera-stage>
        <video class="live-camera-feed" data-camera-preview playsinline autoplay muted></video>
        <div class="guide-pill">${videoSegments[state.videoSegment]} 촬영</div>
        <div class="video-frame-line"></div>
        <p class="video-guide-copy">촬영 항목을 확인해 주세요</p>
        <p class="camera-permission-copy video-permission-copy" data-camera-error>카메라 권한을 허용하면 실제 화면이 표시됩니다.</p>
      </div>
      <div class="video-segments">
        ${videoSegments
          .map(
            (name, index) => {
              const duration = state.videoDurations[index];
              const active = state.videoSegment === index;
              return `<button class="segment-step ${active ? "is-active" : ""} ${duration ? "has-duration" : ""} ${state.videoRecording && active ? "is-recording" : ""}" data-action="video-segment" data-index="${index}" type="button" style="--segment-image:url('${videoTemplateImages[index]}')">
                <span>${active && !duration ? "예시" : duration ? formatDuration(duration) : ""}</span>
                <b>${name}</b>
                <i class="segment-progress" style="width:${Math.min(100, (duration / 22) * 100)}%"></i>
              </button>`;
            },
          )
          .join("")}
      </div>
      <div class="video-controls">
        <span class="record-timer">${state.videoRecording ? "일시정지" : state.videoPaused ? "계속" : ""}</span>
        <button class="record-button ${state.videoRecording ? "is-recording" : ""}" data-action="record" type="button" aria-label="녹화"></button>
        ${nextVisible ? `<button class="next-video" data-action="video-next" type="button">다음</button>` : `<span></span>`}
      </div>
      <div class="mode-tabs video-mode-tabs">
        <button class="is-active" data-action="video-mode-record" type="button">촬영</button>
        <button data-action="video-mode-album" type="button">앨범</button>
      </div>
      ${androidNav()}
      ${modalLayer()}
      ${toastLayer()}
    </div>`;
}

function videoAlbumView() {
  const albumVideos = [
    { label: "차량 영상 01", duration: 56, src: samplePhotos[1] },
    { label: "차량 영상 02", duration: 43, src: samplePhotos[3] },
  ];
  return `
    <div class="video-view video-album-view">
      <header class="dark-topbar">
        <button class="icon-button dark-button" data-action="video-close" aria-label="닫기">${icon("x", 30)}</button>
        <h2>내 앨범</h2>
        <span></span>
      </header>
      <div class="video-album-banner">차량 영상 1개를 선택해 주세요</div>
      <div class="video-album-grid">
        ${albumVideos
          .map(
            (video, index) => `<button class="video-album-item ${state.videoAlbumSelected === index ? "is-selected" : ""}" data-action="video-album-pick" data-index="${index}" type="button" style="--album-video:url('${video.src}')">
              <span class="album-duration">${formatDuration(video.duration)}</span>
              <span class="album-check">${state.videoAlbumSelected === index ? icon("check-mark", 18) : ""}</span>
              <b>${video.label}</b>
            </button>`,
          )
          .join("")}
      </div>
      <div class="video-album-bottom">
        <span>${state.videoAlbumSelected === false ? 0 : 1}/1</span>
        <button class="next-video" data-action="video-album-confirm" type="button">완료</button>
      </div>
      <div class="mode-tabs video-mode-tabs">
        <button data-action="video-mode-record" type="button">촬영</button>
        <button class="is-active" data-action="video-mode-album" type="button">앨범</button>
      </div>
      ${androidNav()}
      ${toastLayer()}
    </div>`;
}

function videoPreviewView() {
  const segments = recordedVideoSegments();
  const total = totalVideoDuration() || 56;
  return `
    <div class="video-view video-preview-view">
      <header class="dark-topbar">
        <button class="icon-button dark-button" data-action="video-close" aria-label="닫기">${icon("x", 30)}</button>
        <h2>영상 미리보기</h2>
        <span></span>
      </header>
      <div class="merged-video-stage">
        <button class="merged-play" type="button">${icon("play", 38)}</button>
        <div class="video-preview-timeline"><span>00:00</span><span>${formatDuration(total)}</span></div>
      </div>
      <div class="preview-segment-strip">
        ${segments.map((segment) => `<span>${segment.name} ${formatDuration(segment.seconds)}</span>`).join("")}
      </div>
      <div class="video-preview-actions">
        <button class="next-video" data-action="video-preview-next" type="button">다음</button>
      </div>
      ${androidNav()}
      ${toastLayer()}
    </div>`;
}

function videoCoverView() {
  const frames = [samplePhotos[0], samplePhotos[1], samplePhotos[2], samplePhotos[3], samplePhotos[4], samplePhotos[5]];
  return `
    <div class="video-view video-cover-view">
      <header class="dark-topbar">
        <button class="icon-button dark-button" data-action="video-cover-back" aria-label="뒤로">${icon("chevron-left", 28)}</button>
        <h2>영상 표지 선택</h2>
        <span></span>
      </header>
      <p class="cover-guide-copy">현재 영상에서 표지로 사용할 장면을 선택해 주세요</p>
      <div class="cover-frame-strip">
        ${frames
          .map(
            (src, index) => `<button class="cover-frame ${state.videoCoverFrame === index ? "is-selected" : ""}" data-action="video-cover-pick" data-index="${index}" type="button" style="background-image:url('${src}')">
              ${state.videoCoverFrame === index ? icon("check-mark", 18) : ""}
            </button>`,
          )
          .join("")}
      </div>
      <button class="cover-complete" data-action="video-cover-complete" type="button">완료</button>
      ${androidNav()}
      ${toastLayer()}
    </div>`;
}

function androidNav() {
  return `<div class="android-nav" aria-hidden="true"><span class="nav-square"></span><span class="nav-circle"></span><span class="nav-triangle"></span></div>`;
}

function modalLayer() {
  if (state.modal === "rules") {
    return `<div class="modal-layer">
      <div class="bottom-sheet">
        <div class="sheet-body">
          <h3>차량 사진 촬영 규칙</h3>
          <p>최소 1장 이상 등록해야 하며, 추천 각도를 채우면 매물 신뢰도가 높아집니다.</p>
          <div class="rules-grid">
            <div class="rules-group"><h4>외관 6장</h4><div class="rules-chips"><span>좌전 45°</span><span>정면</span><span>우전 45°</span><span>우측면</span><span>후면</span><span>좌측면</span></div></div>
            <div class="rules-group"><h4>실내 2장</h4><div class="rules-chips"><span>계기판</span><span>실내</span></div></div>
            <div class="rules-group"><h4>기타 2장</h4><div class="rules-chips"><span>엔진룸</span><span>트렁크</span></div></div>
          </div>
        </div>
        <div class="modal-actions"><button data-action="modal-close">닫기</button><button data-action="photo-camera">사진 추가</button></div>
      </div>
    </div>`;
  }
  if (state.modal === "delete-photo") {
    return `<div class="modal-layer">
      <div class="modal">
        <div class="modal-body"><h3>사진 삭제</h3><p>선택한 차량 사진을 삭제할까요?</p></div>
        <div class="modal-actions"><button data-action="modal-close">취소</button><button data-action="delete-confirm">삭제</button></div>
      </div>
    </div>`;
  }
  if (state.modal === "video-exit") {
    return `<div class="modal-layer">
      <div class="modal">
        <div class="modal-body"><h3>촬영을 취소할까요?</h3><p>취소하면 현재 촬영 중인 영상은 저장되지 않습니다.</p></div>
        <div class="modal-actions"><button data-action="modal-close">계속 촬영</button><button data-action="video-exit-confirm">취소하기</button></div>
      </div>
    </div>`;
  }
  return "";
}

function toastLayer() {
  return state.toast ? `<div class="toast">${state.toast}</div>` : "";
}

function render() {
  screen.closest(".phone-frame").dataset.view = state.view;
  if (state.view === "camera") screen.innerHTML = cameraView();
  if (state.view === "preview") screen.innerHTML = previewView();
  if (state.view === "video") screen.innerHTML = videoView();
  if (state.view === "main") screen.innerHTML = mainView();
  bindEvents();
  updateIcons();
  if (state.view === "camera" && state.cameraMode === "camera") {
    startLiveCamera("photo");
  } else if (state.view === "video" && state.videoPhase === "record") {
    startLiveCamera("video");
  } else {
    stopLiveCamera();
  }
}

function bindEvents() {
  screen.querySelectorAll("[data-file-action]").forEach((input) => {
    input.addEventListener("change", (event) => {
      const target = event.currentTarget;
      const action = target.dataset.fileAction;
      if (action === "photo-camera") {
        const file = target.files?.[0];
        if (file) addPhotoFromFile(state.activeSlot, file);
      }
      if (action === "photo-album") {
        Array.from(target.files || []).forEach((file) => addPhotoFromFile(firstMissingSlot(), file, false));
        if (state.photos.length) {
          state.cameraMode = "camera";
          showToast("앨범 사진이 추가되었습니다");
        }
      }
      if (action === "video-camera") {
        const file = target.files?.[0];
        if (file) {
          state.videoRecording = false;
          state.videoDurations = [56, 0, 0, 0];
          state.videoPhase = "cover";
          state.videoDone = true;
          state.progress = Math.max(state.progress, 42);
          showToast("영상이 등록되었습니다");
        }
      }
      target.value = "";
    });
  });

  screen.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      const target = event.currentTarget;
      const action = target.dataset.action;
      if (action === "rules") {
        state.modal = "rules";
        render();
      }
      if (action === "modal-close") {
        state.modal = null;
        render();
      }
      if (action === "photo-camera") {
        state.activeSlot = firstMissingSlot();
        state.cameraMode = "camera";
        setView("camera");
      }
      if (action === "video") {
        state.videoPhase = state.videoDone ? "preview" : "record";
        setView("video");
      }
      if (action === "video-delete") {
        resetVideoDraft();
        showToast("영상이 삭제되었습니다");
        render();
      }
      if (action === "verify") {
        state.verification = target.dataset.value;
        render();
      }
      if (action === "doc-upload") showToast("인증 이미지는 실시간 촬영만 지원합니다");
      if (action === "preview") {
        if (Date.now() < state.suppressPreviewUntil) return;
        openPreview(Number(target.dataset.index));
      }
      if (action === "main-delete") deletePhoto(target.dataset.id, true);
      if (action === "delete-confirm") confirmDelete();
      if (action === "close-camera") setView("main");
      if (action === "slot-select") {
        state.activeSlot = Number(target.dataset.slot);
        render();
      }
      if (action === "slot-delete") deletePhoto(target.dataset.id, false);
      if (action === "mask") {
        state.maskPlate = !state.maskPlate;
        render();
      }
      if (action === "capture-photo") capturePhotoFromLiveCamera();
      if (action === "finish-camera") {
        if (!state.photos.length) {
          showToast("사진을 최소 1장 등록해 주세요");
        } else {
          setView("main");
        }
      }
      if (action === "mode-camera") {
        setCameraMode("camera");
      }
      if (action === "mode-album") {
        setCameraMode("album");
      }
      if (action === "album-photo") {
        const index = Number(target.dataset.index);
        state.albumSelected = state.albumSelected.includes(index)
          ? state.albumSelected.filter((item) => item !== index)
          : [...state.albumSelected, index];
        render();
      }
      if (action === "album-confirm") {
        if (!state.albumSelected.length) {
          showToast("앨범 사진을 선택해 주세요");
        } else {
          state.albumSelected.forEach((index) => addPhotoFromSource(firstMissingSlot(), samplePhotos[index], slots[firstMissingSlot()], false));
          state.albumSelected = [];
          state.cameraMode = "camera";
          showToast("앨범 사진이 추가되었습니다");
          render();
        }
      }
      if (action === "preview-close" || action === "preview-finish") setView("main");
      if (action === "preview-add") {
        state.activeSlot = firstMissingSlot();
        state.cameraMode = "camera";
        setView("camera");
      }
      if (action === "preview-pick") {
        state.previewIndex = Number(target.dataset.index);
        render();
      }
      if (action === "preview-delete") {
        deletePhoto(target.dataset.id, false);
        showToast("사진이 삭제되었습니다");
      }
      if (action === "tool") {
        const tool = target.dataset.tool;
        const photo = state.photos[state.previewIndex];
        const edits = photoEdits(photo);
        state.previewTool = tool;
        if (tool === "plate") {
          edits.plate = !edits.plate;
          showToast(edits.plate ? "번호판 가림 적용" : "번호판 가림 해제");
        }
        if (tool === "mosaic") {
          edits.mosaic = !edits.mosaic;
          showToast(edits.mosaic ? "모자이크 적용" : "모자이크 해제");
        }
        if (tool === "rotate") {
          edits.rotate = (edits.rotate + 90) % 360;
          showToast("사진을 회전했습니다");
        }
        if (tool === "crop") {
          edits.crop = (edits.crop + 1) % 3;
          showToast(edits.crop ? "자르기 영역 조정" : "자르기 원본 비율");
        }
        render();
      }
      if (action === "video-close") {
        if (state.videoRecording || (hasVideoDraft() && !state.videoDone && state.videoPhase === "record")) {
          state.modal = "video-exit";
          render();
        } else {
          setView("main");
        }
      }
      if (action === "video-exit-confirm") {
        resetVideoDraft();
        setView("main");
      }
      if (action === "video-segment") {
        state.videoSegment = Number(target.dataset.index);
        render();
      }
      if (action === "record") toggleVideoRecording();
      if (action === "video-next") {
        if (state.videoRecording) pauseCurrentVideoSegment(false);
        state.videoPaused = false;
        if (state.videoSegment < 2) {
          state.videoSegment += 1;
          render();
        } else {
          state.videoPhase = "preview";
          render();
        }
      }
      if (action === "video-mode-record") {
        state.videoPhase = "record";
        render();
      }
      if (action === "video-mode-album") {
        state.videoRecording = false;
        state.videoPhase = "album";
        stopVideoTimer();
        render();
      }
      if (action === "video-album-pick") {
        state.videoAlbumSelected = Number(target.dataset.index);
        render();
      }
      if (action === "video-album-confirm") {
        if (state.videoAlbumSelected === false) {
          showToast("영상을 1개 선택해 주세요");
        } else {
          state.videoDurations = [56, 0, 0, 0];
          state.videoPhase = "cover";
          render();
        }
      }
      if (action === "video-preview-next") {
        state.videoPhase = "cover";
        render();
      }
      if (action === "video-cover-back") {
        state.videoPhase = "preview";
        render();
      }
      if (action === "video-cover-pick") {
        state.videoCoverFrame = Number(target.dataset.index);
        render();
      }
      if (action === "video-cover-complete") {
        state.videoDone = true;
        state.videoRecording = false;
        state.videoPaused = false;
        state.progress = Math.max(state.progress, 42);
        setView("main");
      }
    });
  });

  screen.querySelectorAll("[draggable='true']").forEach((card) => {
    let startX = 0;
    let startY = 0;
    let pointerDragging = false;
    let dragStarted = false;
    let targetIndex = null;
    let cardRects = [];

    card.addEventListener("dragstart", (event) => {
      event.preventDefault();
    });
    card.addEventListener("dragend", () => {
      state.dragIndex = Number(card.dataset.dragIndex);
      state.dragIndex = null;
      card.classList.remove("dragging");
    });
    card.addEventListener("dragover", (event) => event.preventDefault());
    card.addEventListener("drop", (event) => {
      event.preventDefault();
      movePhoto(state.dragIndex, Number(card.dataset.dragIndex));
    });
    card.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".delete-chip")) return;
      startX = event.clientX;
      startY = event.clientY;
      pointerDragging = true;
      dragStarted = false;
      targetIndex = Number(card.dataset.dragIndex);
      state.dragIndex = Number(card.dataset.dragIndex);
      cardRects = Array.from(screen.querySelectorAll("#mainMediaGrid .media-card")).map((item) => ({
        index: Number(item.dataset.dragIndex),
        rect: item.getBoundingClientRect(),
      }));
      card.setPointerCapture?.(event.pointerId);
    });
    card.addEventListener("pointermove", (event) => {
      if (!pointerDragging) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!dragStarted && Math.hypot(dx, dy) > 10) {
        dragStarted = true;
        card.classList.add("touch-dragging");
        state.suppressPreviewUntil = Date.now() + 500;
      }
      if (!dragStarted) return;

      card.style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`;
      const hover = cardRects.find(({ rect }) => event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom);
      if (hover && hover.index !== targetIndex) {
        targetIndex = hover.index;
        screen.querySelectorAll("#mainMediaGrid .media-card").forEach((item) => item.classList.toggle("is-drop-target", Number(item.dataset.dragIndex) === targetIndex));
      }
    });
    card.addEventListener("pointerup", (event) => {
      if (!pointerDragging) return;
      pointerDragging = false;
      card.style.transform = "";
      card.classList.remove("touch-dragging");
      screen.querySelectorAll("#mainMediaGrid .media-card").forEach((item) => item.classList.remove("is-drop-target"));
      if (!dragStarted) return;
      state.suppressPreviewUntil = Date.now() + 500;
      const from = Number(card.dataset.dragIndex);
      const to = targetIndex ?? from;
      if (from !== to) movePhoto(from, to);
    });
  });

  const cameraViewElement = screen.querySelector(".camera-view");
  if (cameraViewElement) {
    let swipeStartX = 0;
    let swipeStartY = 0;
    let swipeStartedOnRail = false;

    cameraViewElement.addEventListener("pointerdown", (event) => {
      swipeStartX = event.clientX;
      swipeStartY = event.clientY;
      swipeStartedOnRail = Boolean(event.target.closest(".slot-rail") || event.target.closest(".album-grid") || event.target.closest(".native-file-input"));
    });

    cameraViewElement.addEventListener("pointerup", (event) => {
      if (swipeStartedOnRail) return;
      const dx = event.clientX - swipeStartX;
      const dy = event.clientY - swipeStartY;
      if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
      if (state.cameraMode === "camera") {
        setCameraMode("album");
        showToast("앨범으로 이동했습니다");
      } else {
        setCameraMode("camera");
      }
    });
  }
}

render();
