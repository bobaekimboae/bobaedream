const $ = (id) => document.getElementById(id);
const state = {
  file: { sample: true, name: "BMW X5 샘플 영상" },
  duration: 0,
  selected: 0,
  voiceEnabled: true,
  voiceIndex: -1,
  lastSpoken: -1,
  scenes: [
    { caption: "아빠들의 로망", sourceStart: 0, duration: 1.5, kind: "hook" },
    { caption: "BMW X5 입고", sourceStart: 1.5, duration: 1.3 },
    { caption: "주행거리 9,700km", sourceStart: 2.8, duration: 1.3 },
    { caption: "1인 소유", sourceStart: 4.1, duration: 1.2 },
    { caption: "무사고", sourceStart: 5.3, duration: 1.2 },
    { caption: "하만카돈 오디오", sourceStart: 6.5, duration: 1.3 }
  ]
};

function availableVoices() {
  if (!("speechSynthesis" in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  const korean = voices.filter((voice) => /^ko([-_]|$)/i.test(voice.lang));
  return korean.length ? korean : voices;
}

function preferredVoiceIndex(voices) {
  const maleHint = /(male|man|남성|in[ -]?joon|hyun|seojun|minho|paul|david)/i;
  const index = voices.findIndex((voice) => maleHint.test(voice.name));
  return index >= 0 ? index : 0;
}

function refreshVoices() {
  const select = $("voiceSelect");
  if (!("speechSynthesis" in window)) {
    select.innerHTML = "<option>이 브라우저는 음성 미지원</option>";
    select.disabled = true;
    $("voiceStatus").textContent = "Chrome 또는 Edge에서 이용해 주세요.";
    return;
  }
  const voices = availableVoices();
  if (!voices.length) return;
  select.innerHTML = voices.map((voice, index) => `<option value="${index}">${voice.name} · ${voice.lang}</option>`).join("");
  state.voiceIndex = preferredVoiceIndex(voices);
  select.value = String(state.voiceIndex);
  const selected = voices[state.voiceIndex];
  $("voiceStatus").textContent = `${selected.name} 음성을 사용합니다. 기기에 따라 음색은 달라질 수 있습니다.`;
}

function stopVoice() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  state.lastSpoken = -1;
}

function speakScene(index, force = false) {
  if (!state.voiceEnabled || !("speechSynthesis" in window) || index < 0) return;
  if (!force && state.lastSpoken === index) return;
  const scene = state.scenes[index];
  if (!scene?.caption) return;
  const voices = availableVoices();
  const selectedIndex = Number($("voiceSelect").value);
  const narration = scene.caption
    .replace(/([\d,]+)\s*km\b/gi, "$1 킬로미터")
    .replace(/\bHUD\b/gi, "헤드업 디스플레이")
    .replace(/([가-힣])([A-Za-z0-9])/g, "$1 $2")
    .replace(/([A-Za-z0-9])([가-힣])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  const utterance = new SpeechSynthesisUtterance(narration);
  utterance.lang = "ko-KR";
  utterance.rate = Number($("voiceRate").value) || 1.05;
  utterance.pitch = .92;
  if (voices[selectedIndex]) utterance.voice = voices[selectedIndex];
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  state.lastSpoken = index;
}

function toast(message) {
  const node = $("toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 2200);
}

function cleanLine(line) {
  return line.replace(/^[\s\-•·*\d.)]+/, "").replace(/\s+/g, " ").trim();
}

function fitCaption(line, max = 22) {
  const value = cleanLine(line).replace(/[.!?]+$/, "");
  if (value.length <= max) return value;
  const words = value.split(" ");
  let output = "";
  for (const word of words) {
    const next = output ? `${output} ${word}` : word;
    if (next.length > max) break;
    output = next;
  }
  return output || value.slice(0, max);
}

function makePlan() {
  const title = cleanLine($("vehicleTitle").value);
  const subtitle = cleanLine($("vehicleSubtitle").value);
  const price = cleanLine($("vehiclePrice").value);
  const facts = $("listingFacts").value.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const captions = [];
  captions.push("이 차, 그냥 못 지나칩니다");
  if (title || subtitle) captions.push(fitCaption(`${title} ${subtitle}`));
  for (const fact of facts) {
    const caption = fitCaption(fact);
    if (caption && !captions.includes(caption)) captions.push(caption);
  }
  if (price) captions.push(fitCaption(`판매가 ${price}`));
  captions.push("실매물 확인 후 문의하세요");
  const unique = [...new Set(captions)].slice(0, 12);
  let sourceCursor = 0;
  state.scenes = unique.map((caption, index) => {
    const duration = Math.max(1.35, Math.min(3.1, .55 + caption.length * .105));
    const scene = {
      caption,
      sourceStart: Number(sourceCursor.toFixed(2)),
      duration: Number(duration.toFixed(2)),
      kind: index === 0 ? "hook" : index === unique.length - 1 ? "cta" : "fact"
    };
    sourceCursor += duration;
    return scene;
  });
  state.selected = 0;
  renderScenes();
  $("plannerStatus").textContent = `안전 규칙으로 ${state.scenes.length}개 문구를 구성했습니다. 원문 밖의 차량 옵션은 추가하지 않았습니다.`;
}

function totalDuration() {
  return state.scenes.reduce((sum, scene) => sum + (Number(scene.duration) || 0), 0) + 2.2;
}

function renderScenes() {
  const holder = $("scenes");
  holder.innerHTML = "";
  state.scenes.forEach((scene, index) => {
    const row = $("sceneTemplate").content.firstElementChild.cloneNode(true);
    row.querySelector(".scene-index").textContent = index + 1;
    row.querySelectorAll("input").forEach((input) => {
      const key = input.dataset.key;
      input.value = scene[key] ?? "";
      input.addEventListener("input", () => {
        scene[key] = input.type === "number" ? Number(input.value) : input.value;
        selectScene(index);
      });
    });
    row.querySelector(".remove").addEventListener("click", () => {
      if (state.scenes.length <= 1) return;
      state.scenes.splice(index, 1);
      state.selected = Math.max(0, Math.min(state.selected, state.scenes.length - 1));
      renderScenes();
    });
    row.addEventListener("click", (event) => {
      if (!event.target.closest("button")) selectScene(index);
    });
    holder.append(row);
  });
  renderTimeline();
  selectScene(Math.min(state.selected, state.scenes.length - 1));
}

function renderTimeline() {
  $("summary").textContent = `${state.scenes.length}개 장면 · ${totalDuration().toFixed(1)}초`;
  $("duration").textContent = `${totalDuration().toFixed(1)}초`;
  const segments = $("segments");
  segments.innerHTML = "";
  state.scenes.forEach((scene, index) => {
    const button = document.createElement("button");
    button.textContent = scene.caption;
    button.style.flex = Math.max(.8, Number(scene.duration) || 1);
    button.className = index === state.selected ? "active" : "";
    button.addEventListener("click", () => selectScene(index));
    segments.append(button);
  });
}

function selectScene(index, seek = true) {
  if (!state.scenes.length) return;
  state.selected = Math.max(0, Math.min(index, state.scenes.length - 1));
  const scene = state.scenes[state.selected];
  $("captionText").textContent = scene.caption || "자막";
  if (seek && state.file && Number.isFinite(scene.sourceStart)) $("video").currentTime = scene.sourceStart;
  renderTimeline();
}

function activeSceneAt(time) {
  if (!state.scenes.length) return 0;
  let elapsed = 0;
  for (let index = 0; index < state.scenes.length; index += 1) {
    elapsed += Number(state.scenes[index].duration) || 1.25;
    if (time < elapsed) return index;
  }
  return -1;
}

function autoTime() {
  const available = state.duration || state.scenes.length * 1.45;
  const slice = Math.max(.85, Math.min(1.8, available / Math.max(1, state.scenes.length)));
  state.scenes.forEach((scene, index) => {
    scene.sourceStart = Number((index * slice).toFixed(2));
    scene.duration = Number(slice.toFixed(2));
  });
  renderScenes();
  toast("영상 길이에 맞춰 시간을 배치했습니다.");
}

$("videoInput").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (state.file?.url) URL.revokeObjectURL(state.file.url);
  const url = URL.createObjectURL(file);
  state.file = { file, url };
  const video = $("video");
  video.src = url;
  video.muted = true;
  video.load();
  $("mediaStatus").textContent = "내 영상 불러오는 중";
  $("fileInfo").hidden = false;
  $("fileInfo").textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)}MB · 외부 전송 없음`;
  video.addEventListener("loadedmetadata", () => {
    state.duration = Number(video.duration) || 0;
    autoTime();
    $("mediaStatus").textContent = "내 영상 재생 준비 완료";
    video.play().catch(() => {});
  }, { once: true });
});

$("video").addEventListener("loadedmetadata", () => {
  const video = $("video");
  state.duration = Number(video.duration) || state.duration;
  if (state.file?.sample) $("mediaStatus").textContent = "BMW X5 샘플 영상 재생 준비 완료";
});

$("video").addEventListener("canplay", () => {
  $("playPreview").disabled = false;
});

$("video").addEventListener("error", () => {
  const error = $("video").error;
  const message = error?.code === 4
    ? "이 영상 형식은 휴대폰 브라우저에서 지원되지 않습니다. H.264 MP4 영상을 선택해 주세요."
    : "영상을 불러오지 못했습니다. 다시 선택해 주세요.";
  $("mediaStatus").textContent = message;
  toast(message);
});

$("video").addEventListener("timeupdate", () => {
  const video = $("video");
  const planTime = video.currentTime % Math.max(.1, totalDuration());
  const index = activeSceneAt(planTime);
  if (index >= 0) {
    $("outro").classList.remove("show");
    if (index !== state.selected) selectScene(index, false);
    if (!video.paused) speakScene(index);
  } else {
    $("outro").classList.add("show");
    stopVoice();
  }
});

$("video").addEventListener("pause", () => { $("outro").classList.remove("show"); stopVoice(); });
$("playPreview").addEventListener("click", async () => {
  const video = $("video");
  if (!video.currentSrc) return toast("영상을 불러오는 중입니다. 잠시 후 다시 눌러 주세요.");
  if (video.ended || video.currentTime >= video.duration - .2) video.currentTime = 0;
  try {
    if (video.paused) {
      speakScene(activeSceneAt(video.currentTime % Math.max(.1, totalDuration())), true);
      await video.play();
      $("playPreview").textContent = "일시정지";
    } else {
      video.pause();
      $("playPreview").textContent = "재생";
    }
  } catch (error) {
    $("mediaStatus").textContent = `재생 실패: ${error.message || "브라우저 재생 제한"}`;
    toast("아래 영상 화면의 재생 아이콘을 한 번 눌러 주세요.");
  }
});
$("video").addEventListener("play", () => { $("playPreview").textContent = "일시정지"; });
$("video").addEventListener("pause", () => { $("playPreview").textContent = "재생"; });
$("voiceToggle").addEventListener("click", () => {
  state.voiceEnabled = !state.voiceEnabled;
  $("voiceToggle").classList.toggle("active", state.voiceEnabled);
  $("voiceToggle").textContent = state.voiceEnabled ? "음성 켜짐" : "음성 꺼짐";
  if (!state.voiceEnabled) stopVoice();
  else if (!$("video").paused) speakScene(activeSceneAt($("video").currentTime % Math.max(.1, totalDuration())), true);
});
$("voiceSelect").addEventListener("change", () => {
  state.voiceIndex = Number($("voiceSelect").value);
  const voice = availableVoices()[state.voiceIndex];
  if (voice) $("voiceStatus").textContent = `${voice.name} 음성을 사용합니다.`;
  if (!$("video").paused) speakScene(activeSceneAt($("video").currentTime % Math.max(.1, totalDuration())), true);
});
$("voiceRate").addEventListener("change", () => {
  if (!$("video").paused) speakScene(activeSceneAt($("video").currentTime % Math.max(.1, totalDuration())), true);
});
$("generateCopy").addEventListener("click", makePlan);
$("autoTime").addEventListener("click", autoTime);
$("addScene").addEventListener("click", () => {
  state.scenes.push({ caption: "새 자막", sourceStart: 0, duration: 1.25, kind: "fact" });
  state.selected = state.scenes.length - 1;
  renderScenes();
});

$("savePlan").addEventListener("click", () => {
  const plan = {
    version: 1,
    preset: "dealer-kinetic",
    vehicle: {
      title: $("vehicleTitle").value.trim(),
      subtitle: $("vehicleSubtitle").value.trim(),
      price: $("vehiclePrice").value.trim()
    },
    sourceFacts: $("listingFacts").value.split(/\r?\n/).map(cleanLine).filter(Boolean),
    video: state.file?.file ? { name: state.file.file.name, size: state.file.file.size, duration: state.duration } : { sample: true, name: state.file?.name, duration: state.duration },
    scenes: state.scenes,
    outro: { label: "By.보배드림", duration: 2.2 },
    voice: { enabled: state.voiceEnabled, name: availableVoices()[Number($("voiceSelect").value)]?.name || "device-default", rate: Number($("voiceRate").value) || 1.05, language: "ko-KR", previewOnly: true },
    safety: { factualSourceOnly: true, generatedAt: new Date().toISOString() }
  };
  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bobaedream-reel-${Date.now()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("편집 구성을 저장했습니다.");
});

makePlan();
refreshVoices();
if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = refreshVoices;
