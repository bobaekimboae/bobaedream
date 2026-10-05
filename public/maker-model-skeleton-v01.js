const CATALOG_URL = "./data/encar-car-depth-1005/catalog.json";
const GENERATION_IMAGES_URL = "./data/encar-car-depth-1005/generation-images.json";
const BODYTYPE_PATCH_URL = "./data/encar-car-depth-1005/bodytype-patch-1005.json";
const GENERATION_IMAGE_BASE = "/assets/maker-model/generations/";
const EXPECTED_COUNTS = { manufacturers: 63, modelGroups: 663, generations: 1256, fuelDrives: 2158, grades: 5976, subgrades: 3297 };
const IMPORT_POPULAR_ORDER = ["BMW", "벤츠", "아우디", "포르쉐", "미니", "랜드로버"];

const BODY_TYPES = [
  { value: "세단", label: "세단" },
  { value: "해치백", label: "해치백" },
  { value: "왜건", label: "왜건" },
  { value: "쿠페", label: "쿠페" },
  { value: "컨버터블", label: "컨버터블" },
  { value: "SUV", label: "SUV" },
  { value: "RV", label: "RV" },
  { value: "밴(승합)", label: "밴(승합)" },
  { value: "픽업트럭", label: "픽업트럭" },
  { value: "기타", label: "기타" },
];
const VAN_MODEL_PATTERN = /(ST1|스타렉스|스타리아|쏠라티|봉고|포터|승합|\bvan\b|밴)/i;

function normalizeBodyType(rawValue, modelName = "") {
  const raw = String(rawValue || "").trim();
  if (raw === "웨건") return "왜건";
  if (["RV/승합", "RV/MPV", "MPV"].includes(raw)) return VAN_MODEL_PATTERN.test(modelName) ? "밴(승합)" : "RV";
  if (["밴", "승합", "밴(승합)"].includes(raw)) return "밴(승합)";
  if (raw === "리무진") return "세단";
  return BODY_TYPES.some((type) => type.value === raw) ? raw : "";
}

function modelBodyTypes(model) {
  const patch = state.bodyTypePatch?.modelGroups?.[model.key] || {};
  const primary = normalizeBodyType(model?.bodyType || patch.bodyType, model?.displayName || "");
  const also = Array.isArray(patch.also) ? patch.also.map((type) => normalizeBodyType(type, model?.displayName || "")).filter(Boolean) : [];
  return [...new Set([primary, ...also].filter(Boolean))];
}

function modelBodyType(model) { return modelBodyTypes(model)[0] || ""; }
function modelMatchesBodyType(model, bodyType) { return modelBodyTypes(model).includes(bodyType); }

const ENCAR_LOGO_FILES = {
  Hyundai: "001_Hyundai.png", Genesis: "007_Genesis.png", Kia: "002_Kia.png", ChevroletGMDaewoo: "003_ChevroletGMDaewoo.png",
  "Renault-KoreaSamsung": "078_Renault.png", KG_Mobility_Ssangyong: "004_KG_Mobility_Ssangyong.png",
  BMW: "012_BMW.png", BYD: "090_BYD.png", GMC: "056_GMC.png", Nissan: "033_Nissan.png", Daihatsu: "051_Daihatsu.png",
  Dodge: "034_Dodge.png", Toyota: "031_Toyota.png", DFSK: "088_DFSK.png", Lamborghini: "049_Lamborghini.png",
  "Land Rover": "020_Land_Rover.png", Lexus: "035_Lexus.png", Lotus: "069_Lotus.png", "Rolls-Royce": "047_Rolls_Royce.png",
  Renault: "078_Renault.png", Lincoln: "044_Lincoln.png", Maserati: "053_Maserati.png", Maybach: "080_Maybach.png",
  Mazda: "029_Mazda.png", Mclaren: "084_Mclaren.png", Mini: "054_Mini.png", Mitsubishi: "030_Mitsubishi.png",
  Mitsuoka: "059_Mitsuoka.png", "Mercedes-Benz": "013_Mercedes_Benz.png", Bentley: "050_Bentley.png", Volvo: "017_Volvo.png",
  "Baic Yinxiang": "086_Baic_Yinxiang.png", Saab: "016_Saab.png", Scion: "082_Scion.png", "Xin yuan": "092_Xin_yuan.png",
  Chevrolet: "038_Chevrolet.png", Smart: "081_Smart.png", Subaru: "052_Subaru.png", Suzuki: "037_Suzuki.png",
  "Citroen-DS": "022_Citroen_DS.png", Audi: "011_Audi.png", "Alfa Romeo": "040_Alfa_Romeo.png",
  Astonmartin: "070_Astonmartin.png", Acura: "057_Acura.png", Ineos: "093_Ineos.png", Infiniti: "058_Infiniti.png",
  Jaguar: "019_Jaguar.png", Geely: "094_Geely.png", Jeep: "083_Jeep.png", Cadillac: "043_Cadillac.png",
  Chrysler: "023_Chrysler.png", Tesla: "087_Tesla.png", Ferrari: "041_Ferrari.png", Ford: "024_Ford.png",
  Porsche: "015_Porsche.png", Volkswagen: "014_Volkswagen.png", Polestar: "089_Polestar.png", Peugeot: "021_Peugeot.png",
  Fiat: "018_Fiat.png", Hummer: "048_Hummer.png", Honda: "027_Honda.png",
};

const requestedLogo = new URLSearchParams(location.search).get("logo");
const initialLogo = ["s", "m", "l", "xl"].includes(requestedLogo) ? requestedLogo : "m";
const requestedSpec = new URLSearchParams(location.search).get("spec");
const initialSpec = requestedSpec === "old" ? "old" : "new";
const SPEC_TOKENS = {
  new: [["로고", "40×40 슬롯 · 글리프 최대 36×32 · 간격 12 · 행 56"], ["모델", "56×28 (2:1) · 간격 12 · 행 72 · 전체 40 원형 배지"], ["세부모델", "72×32 · 간격 12 · 행 80 · 출시연식 13px 부제"], ["등급", "체크박스 20 · 행 48 · 들여쓰기 16"], ["공통", "이름 16 굵게 · 매물수 14 회색 · 좌우 16 · 구분선은 텍스트 시작점부터"]],
  old: [["로고", "40×40 슬롯 · 간격 12 · 행 56"], ["모델", "74×46 · 간격 18 · 행 56"], ["세부모델", "74×46 · 간격 18 · 행 68"], ["등급", "체크박스 20 · 행 48 · 들여쓰기 16"]],
};

const state = {
  screen: 1, logo: initialLogo, spec: initialSpec, slots: false, catalog: null, makers: [], maker: null, model: null, generation: null,
  generationImages: {}, bodyTypePatch: {}, selectedLeaves: new Map(), modelTab: "all", modelOrder: "body", query: "", status: "loading", error: "",
};

const body = document.querySelector("#sheet-body");
const title = document.querySelector("#sheet-title");
const selectionStrip = document.querySelector("#selection-strip");
const phone = document.querySelector(".phone");
phone.dataset.logoSize = initialLogo;
phone.dataset.specMode = initialSpec;

const formatCount = (value = 0) => Number(value || 0).toLocaleString("ko-KR");
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
const visible = (items = []) => items.filter((item) => item?.isVisible !== false).sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
const icon = (path, className = "") => `<img class="${className}" src="${path}" alt="" aria-hidden="true" />`;
const testBadge = () => "";
const CHEVRON = "/assets/maker-model/icons/chotot-chevron-right.svg";
const CHECK = "/assets/maker-model/icons/chotot-check.svg";
const trailing = (selected) => selected ? `<span class="row-check" aria-hidden="true">${icon(CHECK)}</span>` : icon(CHEVRON, "chevron");

function catalogCounts(catalog) {
  const counts = { manufacturers: catalog.manufacturers.length, modelGroups: 0, generations: 0, fuelDrives: 0, grades: 0, subgrades: 0 };
  catalog.manufacturers.forEach((maker) => maker.modelGroups.forEach((model) => {
    counts.modelGroups += 1;
    model.generations.forEach((generation) => {
      counts.generations += 1;
      generation.fuelDrives.forEach((fuelDrive) => {
        counts.fuelDrives += 1;
        fuelDrive.grades.forEach((grade) => { counts.grades += 1; counts.subgrades += grade.subgrades.length; });
      });
    });
  }));
  return counts;
}

function validateCatalog(catalog) {
  const actual = catalogCounts(catalog);
  const meta = catalog.meta?.counts || {};
  const mismatch = Object.keys(EXPECTED_COUNTS).filter((key) => actual[key] !== EXPECTED_COUNTS[key] || meta[key] !== EXPECTED_COUNTS[key]);
  if (mismatch.length) throw new Error(`DB 건수 불일치: ${mismatch.map((key) => `${key} ${actual[key]}/${meta[key]}/${EXPECTED_COUNTS[key]}`).join(", ")}`);
}

function makerLogo(maker) {
  const isEtc = ["Others", "etc"].includes(maker.englishName);
  const fileName = isEtc ? "etc_maker_icon.png" : ENCAR_LOGO_FILES[maker.englishName];
  if (!fileName) {
    const initial = String(maker.englishName || maker.displayName || "?").trim().charAt(0).toUpperCase();
    return `<span class="maker-logo"><span class="logo-initial" aria-hidden="true">${escapeHtml(initial)}</span></span>`;
  }
  return `<span class="maker-logo"><img src="/assets/maker-model/logos/encar-1005-normalized/${escapeHtml(fileName)}" alt="" /></span>`;
}

function generationImage(generation, label) {
  const fileName = generation ? state.generationImages[generation.key] : "";
  if (!fileName) return "";
  return `<img class="generated-vehicle-image" src="${GENERATION_IMAGE_BASE}${escapeHtml(fileName)}" alt="${escapeHtml(label)} 세대 이미지" />`;
}

function modelSilhouette(model, className = "vehicle-image") {
  const newestGeneration = visible(model.generations)[0];
  const fileName = newestGeneration ? state.generationImages[newestGeneration.key] : "";
  const image = generationImage(newestGeneration, model.displayName);
  return `<span class="vehicle-silhouette ${className}${image ? " has-generated-image" : " is-empty"}" data-image-key="${escapeHtml(fileName || "gen_pending.png")}" aria-hidden="true">${image}</span>`;
}

function generationSilhouette(generation, model) {
  const fileName = state.generationImages[generation.key] || `gen_${generation.key}.png`;
  const image = generationImage(generation, generation.displayName);
  return `<span class="vehicle-silhouette vehicle-image generation-placeholder${image ? " has-generated-image" : " is-empty"}" data-image-key="${escapeHtml(fileName)}" aria-hidden="true">${image}</span>`;
}

function searchField(placeholder) {
  return `<div class="search-wrap"><label class="search-field">${icon("/assets/maker-model/icons/chotot-search-gray.svg")}<input id="screen-search" type="search" value="${escapeHtml(state.query)}" placeholder="${placeholder}" aria-label="${placeholder}" autocomplete="off" /></label></div>`;
}

function makerRow(maker) {
  const selected = state.maker?.key === maker.key;
  return `<li><button class="option-row maker-row" type="button" aria-pressed="${selected}" data-select-maker="${escapeHtml(maker.key)}">${makerLogo(maker)}<span class="maker-name">${escapeHtml(maker.displayName)}</span><span class="option-count">${formatCount(maker.listingCount)}</span>${trailing(selected)}</button></li>`;
}

function renderMaker() {
  const query = state.query.trim().toLocaleLowerCase("ko-KR");
  const filtered = state.makers.filter((maker) => `${maker.displayName} ${maker.englishName || ""}`.toLocaleLowerCase("ko-KR").includes(query));
  const domestic = filtered.filter((maker) => maker.origin === "국산");
  const imported = filtered.filter((maker) => maker.origin === "수입");
  const popularImported = IMPORT_POPULAR_ORDER.map((name) => imported.find((maker) => maker.displayName === name)).filter(Boolean);
  const groups = [["국산차", domestic], ["수입차 인기제조사", popularImported], ["수입차 이름순", imported]];
  const content = groups.map(([group, rows], index) => rows.length ? `<h3 class="section-title ${index ? "with-rule" : ""}">${group}${testBadge()}</h3><ul class="maker-list">${rows.map(makerRow).join("")}</ul>` : "").join("");
  return `${searchField("제조사 검색")}${content || '<p class="empty-copy">검색 결과가 없습니다.</p>'}`;
}

function modelRow(model) {
  const selected = state.model?.key === model.key;
  return `<li><button class="option-row model-row" type="button" aria-pressed="${selected}" data-select-model="${escapeHtml(model.key)}">${modelSilhouette(model)}<span class="model-copy"><strong>${escapeHtml(model.displayName)}</strong></span><span class="option-count">${formatCount(model.listingCount)}</span>${trailing(selected)}</button></li>`;
}

function allBadgeRow({ label, count, selected, attr, kind }) {
  return `<li class="all-item"><button class="option-row ${kind}-row all-badge-row" type="button" aria-pressed="${selected}" ${attr}><span class="vehicle-silhouette vehicle-image all-slot"><span class="all-badge">전체</span></span><span class="${kind}-copy"><strong>${escapeHtml(label)}</strong></span><span class="option-count">${formatCount(count)}</span>${trailing(selected)}</button></li>`;
}

function bodyTypeRail(allModels, filteredModels) {
  const availableTypes = BODY_TYPES.filter((type) => allModels.some((model) => modelMatchesBodyType(model, type.value)));
  if (!availableTypes.length) return "";
  const counts = new Map(availableTypes.map((type) => [type.value, filteredModels.filter((model) => modelMatchesBodyType(model, type.value)).length]));
  if (state.modelTab !== "all" && (!availableTypes.some((type) => type.value === state.modelTab) || !counts.get(state.modelTab))) state.modelTab = "all";
  const allChip = `<button type="button" data-model-filter="all" aria-pressed="${state.modelTab === "all"}"><span>전체</span></button>`;
  const typeChips = availableTypes.map((type) => {
    const count = counts.get(type.value) || 0;
    return `<button type="button" data-model-filter="${escapeHtml(type.value)}" aria-pressed="${state.modelTab === type.value}" title="${count}개 모델"${count ? "" : " disabled"}><span>${escapeHtml(type.label)}${count ? "" : " 0"}</span></button>`;
  }).join("");
  return `<div class="body-type-rail" aria-label="모델 바디타입 선택">${allChip}${typeChips}</div>`;
}

function bodyTypeGroupTitle(label) {
  return `<div class="body-type-group-title"><span>${escapeHtml(label)}</span></div>`;
}

function sortByName(models) {
  return [...models].sort((a, b) => a.displayName.localeCompare(b.displayName, "ko-KR", { numeric: true, sensitivity: "base" }));
}

function sortByListings(models) {
  return [...models].sort((a, b) => Number(b.listingCount || 0) - Number(a.listingCount || 0) || a.displayName.localeCompare(b.displayName, "ko-KR", { numeric: true, sensitivity: "base" }));
}

function modelOrderToggle() {
  return `<div class="model-order-toggle" role="group" aria-label="전체 모델 정렬"><button type="button" data-model-order="name" aria-pressed="${state.modelOrder === "name"}">가나다순</button><span aria-hidden="true">|</span><button type="button" data-model-order="body" aria-pressed="${state.modelOrder === "body"}">바디타입별</button></div>`;
}

function renderModel() {
  if (!state.maker) return '<p class="empty-copy">제조사를 먼저 선택해 주세요.</p>';
  const allModels = visible(state.maker.modelGroups);
  const query = state.query.trim().toLocaleLowerCase("ko-KR");
  const filtered = allModels.filter((model) => `${model.displayName} ${model.englishName || ""} ${model.generations.map((generation) => `${generation.displayName} ${generation.generationCode || ""}`).join(" ")}`.toLocaleLowerCase("ko-KR").includes(query));
  const popularModels = [...allModels].sort((a, b) => b.listingCount - a.listingCount).slice(0, 5);
  const popular = popularModels.map(modelRow).join("");
  let content;
  if (state.modelTab === "all") {
    const popularSection = query ? "" : `<h3 class="section-title model-section-title">인기 모델</h3><ul class="model-list popular-model-list">${popular}</ul>`;
    let modelList;
    if (state.modelOrder === "name") {
      modelList = `<ul class="model-list">${sortByName(filtered).map(modelRow).join("")}</ul>`;
    } else {
      const groups = BODY_TYPES.map((type) => ({ type, models: sortByListings(filtered.filter((model) => modelMatchesBodyType(model, type.value))) })).filter((group) => group.models.length);
      modelList = groups.map(({ type, models }) => `${bodyTypeGroupTitle(type.label)}<ul class="model-list">${models.map(modelRow).join("")}</ul>`).join("");
    }
    content = `${popularSection}<div class="section-heading-row with-rule"><h3>전체 모델</h3>${modelOrderToggle()}</div>${modelList}`;
  } else {
    const bodyRows = sortByListings(filtered.filter((model) => modelMatchesBodyType(model, state.modelTab)));
    const label = BODY_TYPES.find((type) => type.value === state.modelTab)?.label || state.modelTab;
    content = bodyRows.length ? `${bodyTypeGroupTitle(label)}<ul class="model-list">${bodyRows.map(modelRow).join("")}</ul>` : `<p class="empty-copy">${escapeHtml(label)} 모델이 없습니다.</p>`;
  }
  const allRow = query ? "" : `<ul class="model-list all-list">${allBadgeRow({ label: `${state.maker.displayName} 전체`, count: state.maker.listingCount, selected: !state.model, attr: 'data-select-model="all"', kind: "model" })}</ul>`;
  return `${searchField("모델명·세대코드 검색")}${bodyTypeRail(allModels, filtered)}${allRow}${content || '<p class="empty-copy">검색 결과가 없습니다.</p>'}`;
}

function formatYm(value) {
  if (!value) return "미확인";
  const digits = String(value).replace(/\D/g, "");
  if (digits.length < 6) return String(value);
  return state.spec === "old" ? `${digits.slice(2, 4)}년${digits.slice(4, 6)}월` : `${digits.slice(0, 4)}.${digits.slice(4, 6)}`;
}

function generationPeriod(generation) {
  const end = generation.salesStatus === "판매중" ? "현재" : generation.endYm ? formatYm(generation.endYm) : "미확인";
  return state.spec === "old" ? `${formatYm(generation.releaseYm)}~${end}` : `${formatYm(generation.releaseYm)} ~ ${end}`;
}

function generationRow(generation) {
  const selected = state.generation?.key === generation.key;
  const hybridBadge = /하이브리드/i.test(generation.displayName || "") ? '<small class="hev-badge">HEV</small>' : "";
  return `<li><button class="option-row generation-row" type="button" aria-pressed="${selected}" data-select-generation="${escapeHtml(generation.key)}">${generationSilhouette(generation, state.model)}<span class="generation-copy"><strong><span>${escapeHtml(generation.displayName)}</span>${hybridBadge}</strong><span>${escapeHtml(generationPeriod(generation))}</span></span><span class="option-count">${formatCount(generation.listingCount)}</span>${trailing(selected)}</button></li>`;
}

function renderGeneration() {
  if (!state.model) return '<p class="empty-copy">모델을 먼저 선택해 주세요.</p>';
  const generations = visible(state.model.generations);
  return `<div class="path-copy"><span>${escapeHtml(state.maker.displayName)}</span><span>›</span><span>${escapeHtml(state.model.displayName)}</span><span>›</span><strong>세부모델</strong>${testBadge()}</div><ul class="generation-list all-list">${allBadgeRow({ label: `${state.model.displayName} 전체`, count: state.model.listingCount, selected: !state.generation || state.generation.key === "all", attr: 'data-select-generation="all"', kind: "generation" })}</ul><h3 class="section-title">최신순</h3><ul class="generation-list">${generations.map(generationRow).join("")}</ul>`;
}

function leafNodesForGrade(grade, fuelDrive) {
  const subgrades = visible(grade.subgrades);
  if (subgrades.length) return subgrades.map((subgrade) => ({ key: subgrade.key, label: subgrade.displayName, count: subgrade.listingCount, gradeKey: grade.key, fuelDriveKey: fuelDrive.key }));
  return [{ key: grade.key, label: grade.displayName, count: grade.listingCount, gradeKey: grade.key, fuelDriveKey: fuelDrive.key }];
}

function leafNodesForFuelDrive(fuelDrive) { return visible(fuelDrive.grades).flatMap((grade) => leafNodesForGrade(grade, fuelDrive)); }

function checkedState(leaves) {
  const checked = leaves.filter((leaf) => state.selectedLeaves.has(leaf.key)).length;
  return checked === 0 ? "false" : checked === leaves.length ? "true" : "mixed";
}

function checkRow({ key, label, count, level, leaves, kind }) {
  return `<li><button class="option-row grade-row level-${level}" role="checkbox" aria-checked="${checkedState(leaves)}" type="button" data-check-kind="${kind}" data-check-key="${escapeHtml(key)}"><span class="fake-checkbox">${icon("/assets/maker-model/icons/chotot-check.svg")}</span><span class="grade-name">${escapeHtml(label)}</span><span class="option-count">${formatCount(count)}</span></button></li>`;
}

function renderGrade() {
  if (!state.generation || state.generation.key === "all") return '<div class="empty-copy"><strong>모델 전체가 선택되었습니다.</strong><br />연료·구동과 등급을 고르려면 세부모델 한 개를 선택해 주세요.</div>';
  const groups = visible(state.generation.fuelDrives).map((fuelDrive) => {
    const fdRow = checkRow({ key: fuelDrive.key, label: fuelDrive.displayName, count: fuelDrive.listingCount, level: 0, leaves: leafNodesForFuelDrive(fuelDrive), kind: "fuel" });
    const grades = visible(fuelDrive.grades).map((grade) => {
      const gradeRow = checkRow({ key: grade.key, label: grade.displayName, count: grade.listingCount, level: 1, leaves: leafNodesForGrade(grade, fuelDrive), kind: "grade" });
      const subgradeRows = visible(grade.subgrades).map((subgrade) => checkRow({ key: subgrade.key, label: subgrade.displayName, count: subgrade.listingCount, level: 2, leaves: [{ key: subgrade.key }], kind: "leaf" })).join("");
      return `${gradeRow}${subgradeRows}`;
    }).join("");
    return `<li class="grade-group-title">연료·구동</li>${fdRow}${grades}`;
  }).join("");
  return `<div class="path-copy"><span>${escapeHtml(state.maker.displayName)}</span><span>›</span><span>${escapeHtml(state.model.displayName)}</span><span>›</span><span>${escapeHtml(state.generation.displayName)}</span><span>›</span><strong>등급</strong>${testBadge()}</div><ul class="grade-list">${groups || '<li class="empty-copy">연료·구동 데이터가 없습니다.</li>'}</ul>`;
}

function renderOverview() {
  const rows = [["제조사", state.maker?.displayName || "선택"], ["모델", state.model?.displayName || "선택"], ["세부모델", state.generation?.displayName || "선택"], ["등급", state.selectedLeaves.size ? `${state.selectedLeaves.size}개 선택` : "선택"]];
  return `<div class="filter-overview">${rows.map(([label, value], index) => `<button class="filter-row" type="button" data-screen-target="${index + 1}"><strong>${label}</strong><span class="filter-value">${escapeHtml(value)}</span>${icon("/assets/maker-model/icons/chotot-chevron-right.svg", "chevron")}</button>`).join("")}</div>`;
}

function selectionValues() {
  const values = [];
  if (state.maker) values.push({ key: "maker", label: state.maker.displayName });
  if (state.model) values.push({ key: "model", label: state.model.displayName });
  if (state.generation && state.generation.key !== "all") values.push({ key: "generation", label: state.generation.displayName });
  for (const leaf of state.selectedLeaves.values()) values.push({ key: `leaf:${leaf.key}`, label: leaf.label });
  return values;
}

function currentListingCount() {
  if (state.selectedLeaves.size) return [...state.selectedLeaves.values()].reduce((sum, leaf) => sum + Number(leaf.count || 0), 0);
  return state.generation?.listingCount ?? state.model?.listingCount ?? state.maker?.listingCount ?? state.makers.reduce((sum, maker) => sum + maker.listingCount, 0);
}

function updateSelections() {
  selectionStrip.innerHTML = selectionValues().map((value) => `<button type="button" class="selection-chip" data-remove-selection="${escapeHtml(value.key)}" aria-label="${escapeHtml(value.label)} 선택 해제"><span>${escapeHtml(value.label)}</span><b aria-hidden="true">×</b></button>`).join("");
  document.querySelector("#apply-button").textContent = `${formatCount(currentListingCount())}대 보기`;
  const selectionCount = selectionValues().length;
  const resetButton = document.querySelector("#reset-button");
  resetButton.innerHTML = selectionCount ? `초기화 <span class="reset-count">${selectionCount}</span>` : "초기화";
  resetButton.disabled = selectionCount === 0;
}

function bindSearch() {
  document.querySelector("#screen-search")?.addEventListener("input", (event) => {
    state.query = event.currentTarget.value;
    const selectionStart = event.currentTarget.selectionStart;
    render();
    const field = document.querySelector("#screen-search");
    field?.focus();
    field?.setSelectionRange(selectionStart, selectionStart);
  });
}

function render() {
  const titles = ["필터", "제조사", "모델", "세부모델", "등급"];
  title.textContent = titles[state.screen];
  if (state.status === "loading") body.innerHTML = '<div class="loading-copy">검수 완료된 제조사·모델 DB를 불러오는 중입니다.</div>';
  else if (state.status === "error") body.innerHTML = `<div class="data-error" role="alert"><strong>DB 연결을 중단했습니다.</strong><span>${escapeHtml(state.error)}</span></div>`;
  else body.innerHTML = [renderOverview, renderMaker, renderModel, renderGeneration, renderGrade][state.screen]();
  phone.dataset.activeScreen = String(state.screen);
  document.querySelector("#back-button").style.visibility = state.screen === 0 ? "hidden" : "visible";
  document.querySelectorAll("#screen-controls button").forEach((button) => button.classList.toggle("is-active", Number(button.dataset.screen) === state.screen));
  document.querySelectorAll("#logo-controls button").forEach((button) => button.classList.toggle("is-active", button.dataset.logo === state.logo));
  document.querySelectorAll("#spec-controls button").forEach((button) => button.classList.toggle("is-active", button.dataset.spec === state.spec));
  const slotToggle = document.querySelector("#slot-toggle");
  if (slotToggle) { slotToggle.classList.toggle("is-active", state.slots); slotToggle.setAttribute("aria-pressed", String(state.slots)); }
  const tokenTable = document.querySelector("#token-table");
  if (tokenTable) tokenTable.innerHTML = SPEC_TOKENS[state.spec].map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`).join("");
  updateSelections();
  bindSearch();
}

function setScreen(screen) { state.screen = Math.min(4, Math.max(0, Number(screen))); state.query = ""; render(); body.scrollTop = 0; }

function findCheckLeaves(kind, key) {
  if (!state.generation || state.generation.key === "all") return [];
  for (const fuelDrive of visible(state.generation.fuelDrives)) {
    if (kind === "fuel" && fuelDrive.key === key) return leafNodesForFuelDrive(fuelDrive);
    for (const grade of visible(fuelDrive.grades)) {
      if (kind === "grade" && grade.key === key) return leafNodesForGrade(grade, fuelDrive);
      for (const leaf of leafNodesForGrade(grade, fuelDrive)) if (kind === "leaf" && leaf.key === key) return [leaf];
    }
  }
  return [];
}

document.addEventListener("click", (event) => {
  const screenButton = event.target.closest("[data-screen], [data-screen-target]");
  if (screenButton) return setScreen(screenButton.dataset.screen ?? screenButton.dataset.screenTarget);
  const logoButton = event.target.closest("[data-logo]");
  if (logoButton) { state.logo = logoButton.dataset.logo; phone.dataset.logoSize = state.logo; document.querySelectorAll("#logo-controls button").forEach((button) => button.classList.toggle("is-active", button === logoButton)); return; }
  const specButton = event.target.closest("#spec-controls [data-spec]");
  if (specButton) { state.spec = specButton.dataset.spec; phone.dataset.specMode = state.spec; return render(); }
  if (event.target.closest("#slot-toggle")) { state.slots = !state.slots; phone.dataset.slots = state.slots ? "on" : "off"; return render(); }
  const removeButton = event.target.closest("[data-remove-selection]");
  if (removeButton) {
    const key = removeButton.dataset.removeSelection;
    if (key === "maker") { state.maker = null; state.model = null; state.generation = null; state.selectedLeaves.clear(); }
    else if (key === "model") { state.model = null; state.generation = null; state.selectedLeaves.clear(); }
    else if (key === "generation") { state.generation = null; state.selectedLeaves.clear(); }
    else if (key.startsWith("leaf:")) state.selectedLeaves.delete(key.slice(5));
    return render();
  }
  const makerButton = event.target.closest("[data-select-maker]");
  if (makerButton) { state.maker = state.makers.find((maker) => maker.key === makerButton.dataset.selectMaker); state.model = null; state.generation = null; state.selectedLeaves.clear(); state.modelTab = "all"; return setScreen(2); }
  const modelButton = event.target.closest("[data-select-model]");
  if (modelButton && modelButton.dataset.selectModel === "all") { state.model = null; state.generation = null; state.selectedLeaves.clear(); return render(); }
  if (modelButton) { state.model = visible(state.maker?.modelGroups).find((model) => model.key === modelButton.dataset.selectModel); state.generation = null; state.selectedLeaves.clear(); return setScreen(3); }
  const generationButton = event.target.closest("[data-select-generation]");
  if (generationButton) { state.generation = generationButton.dataset.selectGeneration === "all" ? { key: "all", displayName: `${state.model.displayName} 전체`, listingCount: state.model.listingCount } : visible(state.model?.generations).find((generation) => generation.key === generationButton.dataset.selectGeneration); state.selectedLeaves.clear(); return setScreen(4); }
  const checkButton = event.target.closest("[data-check-kind]");
  if (checkButton) { const leaves = findCheckLeaves(checkButton.dataset.checkKind, checkButton.dataset.checkKey); const allChecked = leaves.every((leaf) => state.selectedLeaves.has(leaf.key)); leaves.forEach((leaf) => allChecked ? state.selectedLeaves.delete(leaf.key) : state.selectedLeaves.set(leaf.key, leaf)); return render(); }
  const modelFilterButton = event.target.closest("[data-model-filter]");
  if (modelFilterButton) { state.modelTab = modelFilterButton.dataset.modelFilter; render(); body.scrollTop = 0; return; }
  const modelOrderButton = event.target.closest("[data-model-order]");
  if (modelOrderButton) { state.modelOrder = modelOrderButton.dataset.modelOrder; render(); return; }
});

document.querySelector("#back-button").addEventListener("click", () => setScreen(state.screen - 1));
document.querySelector("#close-button").addEventListener("click", () => setScreen(0));
document.querySelector("#reset-button").addEventListener("click", () => { state.maker = null; state.model = null; state.generation = null; state.selectedLeaves.clear(); state.query = ""; state.modelTab = "all"; state.modelOrder = "body"; setScreen(1); });

async function loadCatalog() {
  try {
    const [catalogResponse, imageResponse, bodyTypeResponse] = await Promise.all([
      fetch(CATALOG_URL, { cache: "no-store" }),
      fetch(GENERATION_IMAGES_URL, { cache: "no-store" }),
      fetch(BODYTYPE_PATCH_URL, { cache: "no-store" }),
    ]);
    if (!catalogResponse.ok) throw new Error(`catalog.json HTTP ${catalogResponse.status}`);
    if (!imageResponse.ok) throw new Error(`generation-images.json HTTP ${imageResponse.status}`);
    if (!bodyTypeResponse.ok) throw new Error(`bodytype-patch-1005.json HTTP ${bodyTypeResponse.status}`);
    const [catalog, generationImages, bodyTypePatch] = await Promise.all([catalogResponse.json(), imageResponse.json(), bodyTypeResponse.json()]);
    validateCatalog(catalog);
    state.catalog = catalog;
    state.generationImages = generationImages;
    state.bodyTypePatch = bodyTypePatch;
    state.makers = visible(catalog.manufacturers);
    state.status = "ready";
  } catch (error) {
    state.status = "error";
    state.error = error instanceof Error ? error.message : String(error);
    console.error(error);
  }
  render();
}

render();
loadCatalog();
