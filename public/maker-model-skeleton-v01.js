const CATALOG_URL = "./data/encar-car-depth-1005/catalog.json";
const GENERATION_IMAGES_URL = "./data/encar-car-depth-1005/generation-images.json";
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
const ALWAYS_VISIBLE_BODY_TYPES = new Set(["픽업트럭"]);

const VAN_MODEL_PATTERN = /(ST1|스타렉스|스타리아|쏠라티|봉고|포터|승합|\bvan\b|밴)/i;

function modelBodyType(model) {
  const raw = String(model?.bodyType || "").trim();
  if (raw === "웨건") return "왜건";
  if (["RV/승합", "RV/MPV", "MPV"].includes(raw)) return VAN_MODEL_PATTERN.test(model.displayName || "") ? "밴(승합)" : "RV";
  if (["밴", "승합", "밴(승합)"].includes(raw)) return "밴(승합)";
  if (raw === "리무진") return "세단";
  return BODY_TYPES.some((type) => type.value === raw) ? raw : "기타";
}

const ENCAR_LOGO_FILES = {
  Hyundai: "001_Hyundai.png", Genesis: "007_Genesis.png", Kia: "002_Kia.png", ChevroletGMDaewoo: "003_ChevroletGMDaewoo.png",
  "Renault-KoreaSamsung": "005_Renault_KoreaSamsung.png", KG_Mobility_Ssangyong: "004_KG_Mobility_Ssangyong.png",
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

const ROUND_LOGO_FILES = new Set([
  "012_BMW.png", "013_Mercedes_Benz.png", "014_Volkswagen.png", "016_Saab.png", "017_Volvo.png",
  "029_Mazda.png", "030_Mitsubishi.png", "033_Nissan.png", "037_Suzuki.png", "040_Alfa_Romeo.png",
  "049_Lamborghini.png", "051_Daihatsu.png", "057_Acura.png", "059_Mitsuoka.png", "069_Lotus.png",
  "082_Scion.png", "087_Tesla.png", "088_DFSK.png", "089_Polestar.png", "etc_maker_icon.png",
]);

const VERTICAL_LOGO_FILES = new Set([
  "005_Renault_KoreaSamsung.png", "015_Porsche.png", "021_Peugeot.png", "041_Ferrari.png",
  "044_Lincoln.png", "047_Rolls_Royce.png", "053_Maserati.png", "078_Renault.png",
]);

const requestedLogo = new URLSearchParams(location.search).get("logo");
const initialLogo = ["s", "m", "l", "xl"].includes(requestedLogo) ? requestedLogo : "m";

const state = {
  screen: 1, logo: initialLogo, catalog: null, makers: [], maker: null, model: null, generation: null,
  generationImages: {}, selectedFuelDrives: new Map(), selectedGrades: new Map(), selectedLeaves: new Map(), expandedFuelKey: null, expandedGradeKey: null,
  modelTab: "all", query: "", status: "loading", error: "",
};

const body = document.querySelector("#sheet-body");
const title = document.querySelector("#sheet-title");
const phone = document.querySelector(".phone");
phone.dataset.logoSize = initialLogo;

const formatCount = (value = 0) => Number(value || 0).toLocaleString("ko-KR");
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
const visible = (items = []) => items.filter((item) => item?.isVisible !== false).sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
const icon = (path, className = "") => `<img class="${className}" src="${path}" alt="" aria-hidden="true" />`;
const testBadge = () => "";

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
  const fileName = ["Others", "etc"].includes(maker.englishName) ? "etc_maker_icon.png" : ENCAR_LOGO_FILES[maker.englishName] || "etc_maker_icon.png";
  const shapeClass = ROUND_LOGO_FILES.has(fileName) ? " is-round" : VERTICAL_LOGO_FILES.has(fileName) ? " is-vertical" : " is-wide";
  return `<span class="maker-logo"><img class="maker-logo-image${shapeClass}" src="/assets/maker-model/logos/encar-1005-normalized/${escapeHtml(fileName)}" alt="" /></span>`;
}

const vehiclePlaceholder = () => `<span class="vehicle-placeholder-icon" aria-hidden="true"></span>`;

function generationImage(generation, label) {
  const fileName = generation ? state.generationImages[generation.key] : "";
  if (!fileName) return "";
  return `<img class="generated-vehicle-image" src="${GENERATION_IMAGE_BASE}${escapeHtml(fileName)}" alt="${escapeHtml(label)} 세대 이미지" />`;
}

function modelSilhouette(model, className = "vehicle-image") {
  const newestGeneration = visible(model.generations)[0];
  const fileName = newestGeneration ? state.generationImages[newestGeneration.key] : "";
  const image = generationImage(newestGeneration, model.displayName);
  return `<span class="vehicle-silhouette ${className}${image ? " has-generated-image" : " is-placeholder"}" data-image-key="${escapeHtml(fileName || "gen_pending.png")}" aria-hidden="true">${image || vehiclePlaceholder()}</span>`;
}

function generationSilhouette(generation, model) {
  const fileName = state.generationImages[generation.key] || `gen_${generation.key}.png`;
  const image = generationImage(generation, generation.displayName);
  return `<span class="vehicle-silhouette vehicle-image generation-placeholder${image ? " has-generated-image" : " is-placeholder"}" data-image-key="${escapeHtml(fileName)}" aria-hidden="true">${image || vehiclePlaceholder()}</span>`;
}

function searchField(placeholder) {
  return `<div class="search-wrap"><label class="search-field">${icon("/assets/maker-model/icons/chotot-search-gray.svg")}<input id="screen-search" type="search" value="${escapeHtml(state.query)}" placeholder="${placeholder}" aria-label="${placeholder}" autocomplete="off" /></label></div>`;
}

function selectedPathItems() {
  const items = [];
  if (state.screen >= 2 && state.maker) items.push({ key: "maker", label: state.maker.displayName, screen: 1 });
  if (state.screen >= 3 && state.model) items.push({ key: "model", label: state.model.displayName, screen: 2 });
  if (state.screen >= 4 && state.generation) items.push({ key: "generation", label: state.generation.displayName, detail: generationPeriod(state.generation), screen: 3 });
  return items;
}

function renderSelectionSummary() {
  const items = selectedPathItems();
  if (!items.length) return "";
  const rows = items.map((item) => `<div class="selection-summary-row${item.detail ? " has-detail" : ""}"><button class="selection-summary-label" type="button" data-summary-screen="${item.screen}"><span>${escapeHtml(item.label)}</span>${item.detail ? `<small>${escapeHtml(item.detail)}</small>` : ""}</button><button class="selection-summary-clear" type="button" data-clear-depth="${item.key}" aria-label="${escapeHtml(item.label)} 선택 해제">${icon("/assets/maker-model/icons/chotot-close.svg")}</button></div>`).join("");
  return `<div class="selection-summary" aria-label="현재 선택 경로">${rows}</div>`;
}

function makerRow(maker) {
  return `<li><button class="option-row maker-row" type="button" data-select-maker="${escapeHtml(maker.key)}">${makerLogo(maker)}<span class="maker-name">${escapeHtml(maker.displayName)}</span><span class="option-count">${formatCount(maker.listingCount)}</span>${icon("/assets/maker-model/icons/chotot-chevron-right.svg", "chevron")}</button></li>`;
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
  const reviewMark = model.reviewStatus === "REVIEW_REQUIRED" ? '<span class="review-mark" title="바디타입 검토 필요">🟡</span>' : "";
  return `<li><button class="option-row model-row" type="button" data-select-model="${escapeHtml(model.key)}">${modelSilhouette(model)}<span class="model-copy"><strong>${escapeHtml(model.displayName)}${reviewMark}</strong></span><span class="option-count">${formatCount(model.listingCount)}</span>${icon("/assets/maker-model/icons/chotot-chevron-right.svg", "chevron")}</button></li>`;
}

function bodyTypeRail(models) {
  const counts = new Map(BODY_TYPES.map((type) => [type.value, models.filter((model) => modelBodyType(model) === type.value).length]));
  const availableTypes = BODY_TYPES.filter((type) => counts.get(type.value) || ALWAYS_VISIBLE_BODY_TYPES.has(type.value));
  if (state.modelTab !== "all" && !availableTypes.some((type) => type.value === state.modelTab)) state.modelTab = "all";
  const allChip = `<button type="button" data-model-filter="all" aria-pressed="${state.modelTab === "all"}"><span>전체</span></button>`;
  const typeChips = availableTypes.map((type) => `<button type="button" data-model-filter="${escapeHtml(type.value)}" aria-pressed="${state.modelTab === type.value}" title="${counts.get(type.value)}개 모델"><span>${escapeHtml(type.label)}</span></button>`).join("");
  return `<div class="body-type-rail" aria-label="모델 바디타입 선택">${allChip}${typeChips}</div>`;
}

function bodyTypeGroupTitle(label) {
  return `<div class="body-type-group-title"><span>${escapeHtml(label)}</span></div>`;
}

function renderModel() {
  if (!state.maker) return '<p class="empty-copy">제조사를 먼저 선택해 주세요.</p>';
  const allModels = visible(state.maker.modelGroups);
  const query = state.query.trim().toLocaleLowerCase("ko-KR");
  const filtered = allModels
    .filter((model) => `${model.displayName} ${model.englishName || ""} ${model.generations.map((generation) => `${generation.displayName} ${generation.generationCode || ""}`).join(" ")}`.toLocaleLowerCase("ko-KR").includes(query))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "ko-KR", { numeric: true, sensitivity: "base" }));
  const popularModels = [...allModels].sort((a, b) => b.listingCount - a.listingCount).slice(0, 5);
  const popular = popularModels.map(modelRow).join("");
  let content;
  if (state.modelTab === "all") {
    const popularSection = query ? "" : `<h3 class="section-title model-section-title">인기 모델</h3><ul class="model-list popular-model-list">${popular}</ul>`;
    content = `${popularSection}<div class="section-heading-row with-rule"><h3>전체 모델</h3><span>이름순</span></div><ul class="model-list">${filtered.map(modelRow).join("")}</ul>`;
  } else {
    const bodyRows = filtered.filter((model) => modelBodyType(model) === state.modelTab);
    const label = BODY_TYPES.find((type) => type.value === state.modelTab)?.label || state.modelTab;
    content = bodyRows.length ? `${bodyTypeGroupTitle(label)}<ul class="model-list">${bodyRows.map(modelRow).join("")}</ul>` : `<p class="empty-copy">${escapeHtml(label)} 모델이 없습니다.</p>`;
  }
  return `${renderSelectionSummary()}${searchField("모델명·세대코드 검색")}${bodyTypeRail(allModels)}${content || '<p class="empty-copy">검색 결과가 없습니다.</p>'}`;
}

function formatYm(value) {
  if (!value) return "미확인";
  const digits = String(value).replace(/\D/g, "");
  return digits.length >= 6 ? `${digits.slice(2, 4)}년${digits.slice(4, 6)}월` : String(value);
}

function generationPeriod(generation) {
  const end = generation.salesStatus === "판매중" ? "현재" : generation.endYm ? formatYm(generation.endYm) : "미확인";
  return `${formatYm(generation.releaseYm)}~${end}`;
}

function generationRow(generation) {
  return `<li><button class="option-row generation-row" type="button" data-select-generation="${escapeHtml(generation.key)}">${generationSilhouette(generation, state.model)}<span class="generation-copy"><strong>${escapeHtml(generation.displayName)}</strong><span>${escapeHtml(generationPeriod(generation))}</span></span><span class="option-count">${formatCount(generation.listingCount)}</span>${icon("/assets/maker-model/icons/chotot-chevron-right.svg", "chevron")}</button></li>`;
}

function renderGeneration() {
  if (!state.model) return '<p class="empty-copy">모델을 먼저 선택해 주세요.</p>';
  const generations = visible(state.model.generations);
  return `${renderSelectionSummary()}<h3 class="section-title">세대 · 최신순</h3><ul class="generation-list">${generations.map(generationRow).join("")}</ul>`;
}

function leafNodesForGrade(grade, fuelDrive) {
  const subgrades = visible(grade.subgrades);
  if (subgrades.length) return subgrades.map((subgrade) => ({ key: subgrade.key, label: subgrade.displayName, count: subgrade.listingCount, gradeKey: grade.key, fuelDriveKey: fuelDrive.key }));
  return [{ key: grade.key, label: grade.displayName, count: grade.listingCount, gradeKey: grade.key, fuelDriveKey: fuelDrive.key }];
}

function leafNodesForFuelDrive(fuelDrive) { return visible(fuelDrive.grades).flatMap((grade) => leafNodesForGrade(grade, fuelDrive)); }

function checkedState(kind, key) {
  if (kind === "fuel") return state.selectedFuelDrives.has(key) ? "true" : "false";
  if (kind === "grade") return state.selectedGrades.has(key) ? "true" : "false";
  return state.selectedLeaves.has(key) ? "true" : "false";
}

function checkRow({ key, label, count, level, kind, fuelDriveKey = "", gradeKey = "" }) {
  return `<li><button class="option-row grade-row level-${level}" role="checkbox" aria-checked="${checkedState(kind, key)}" type="button" data-check-kind="${kind}" data-check-key="${escapeHtml(key)}" data-fuel-drive-key="${escapeHtml(fuelDriveKey)}" data-grade-key="${escapeHtml(gradeKey)}"><span class="fake-checkbox">${icon("/assets/maker-model/icons/chotot-check.svg")}</span><span class="grade-name">${escapeHtml(label)}</span><span class="option-count">${formatCount(count)}</span></button></li>`;
}

function renderGrade() {
  if (!state.generation || state.generation.key === "all") return '<div class="empty-copy"><strong>모델 전체가 선택되었습니다.</strong><br />연료·구동과 등급을 고르려면 세부모델 한 개를 선택해 주세요.</div>';
  const fuelDrives = visible(state.generation.fuelDrives);
  const groups = fuelDrives.map((fuelDrive) => {
    const isFuelExpanded = state.expandedFuelKey === fuelDrive.key;
    const fdRow = checkRow({
      key: fuelDrive.key,
      label: fuelDrive.displayName,
      count: fuelDrive.listingCount,
      level: 0,
      kind: "fuel",
      fuelDriveKey: fuelDrive.key,
    });
    if (!isFuelExpanded) return fdRow;

    const grades = visible(fuelDrive.grades).map((grade) => {
      const subgrades = visible(grade.subgrades);
      const gradeRow = checkRow({
        key: grade.key,
        label: grade.displayName,
        count: grade.listingCount,
        level: 1,
        kind: "grade",
        fuelDriveKey: fuelDrive.key,
        gradeKey: grade.key,
      });
      if (state.expandedGradeKey !== grade.key || !subgrades.length) return gradeRow;
      const subgradeRows = subgrades.map((subgrade) => checkRow({
        key: subgrade.key,
        label: subgrade.displayName,
        count: subgrade.listingCount,
        level: 2,
        kind: "leaf",
        fuelDriveKey: fuelDrive.key,
        gradeKey: grade.key,
      })).join("");
      return `${gradeRow}<li class="grade-group-title level-2">세부등급</li>${subgradeRows}`;
    }).join("");
    return `${fdRow}<li class="grade-group-title level-1">등급</li>${grades}`;
  }).join("");
  return `${renderSelectionSummary()}<ul class="grade-list">${groups ? `<li class="grade-group-title level-0">연료 · 배기량</li>${groups}` : '<li class="empty-copy">연료·구동 데이터가 없습니다.</li>'}</ul>`;
}

function renderOverview() {
  const nestedSelectionCount = state.selectedFuelDrives.size + state.selectedGrades.size + state.selectedLeaves.size;
  const rows = [["제조사", state.maker?.displayName || "선택"], ["모델", state.model?.displayName || "선택"], ["세부모델", state.generation?.displayName || "선택"], ["연료·구동", nestedSelectionCount ? `${nestedSelectionCount}개 선택` : "선택"]];
  return `<div class="filter-overview">${rows.map(([label, value], index) => `<button class="filter-row" type="button" data-screen-target="${index + 1}"><strong>${label}</strong><span class="filter-value">${escapeHtml(value)}</span>${icon("/assets/maker-model/icons/chotot-chevron-right.svg", "chevron")}</button>`).join("")}</div>`;
}

function selectedResultItems() {
  if (!state.generation) return [];
  const result = [];
  for (const fuelDrive of visible(state.generation.fuelDrives)) {
    const fuelLeaves = [];
    const fuelGrades = [];
    for (const grade of visible(fuelDrive.grades)) {
      const gradeLeaves = leafNodesForGrade(grade, fuelDrive).filter((leaf) => state.selectedLeaves.has(leaf.key));
      if (gradeLeaves.length) fuelLeaves.push(...gradeLeaves);
      else if (state.selectedGrades.has(grade.key)) fuelGrades.push({ key: grade.key, label: grade.displayName, count: grade.listingCount });
    }
    if (fuelLeaves.length) result.push(...fuelLeaves);
    else if (fuelGrades.length) result.push(...fuelGrades);
    else if (state.selectedFuelDrives.has(fuelDrive.key)) result.push({ key: fuelDrive.key, label: fuelDrive.displayName, count: fuelDrive.listingCount });
  }
  return result;
}

function currentListingCount() {
  const selectedItems = selectedResultItems();
  if (selectedItems.length) return selectedItems.reduce((sum, item) => sum + Number(item.count || 0), 0);
  return state.generation?.listingCount ?? state.model?.listingCount ?? state.maker?.listingCount ?? state.makers.reduce((sum, maker) => sum + maker.listingCount, 0);
}

function updateSelections() {
  document.querySelector("#apply-button").textContent = `${formatCount(currentListingCount())}대 보기`;
}

function clearNestedSelections() {
  state.selectedFuelDrives.clear();
  state.selectedGrades.clear();
  state.selectedLeaves.clear();
  state.expandedFuelKey = null;
  state.expandedGradeKey = null;
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
  const titles = ["필터", "제조사", "모델", "세부모델", "연료·구동"];
  title.textContent = titles[state.screen];
  if (state.status === "loading") body.innerHTML = '<div class="loading-copy">검수 완료된 제조사·모델 DB를 불러오는 중입니다.</div>';
  else if (state.status === "error") body.innerHTML = `<div class="data-error" role="alert"><strong>DB 연결을 중단했습니다.</strong><span>${escapeHtml(state.error)}</span></div>`;
  else body.innerHTML = [renderOverview, renderMaker, renderModel, renderGeneration, renderGrade][state.screen]();
  document.querySelector("#back-button").style.visibility = state.screen === 0 ? "hidden" : "visible";
  document.querySelectorAll("#screen-controls button").forEach((button) => button.classList.toggle("is-active", Number(button.dataset.screen) === state.screen));
  document.querySelectorAll("#logo-controls button").forEach((button) => button.classList.toggle("is-active", button.dataset.logo === state.logo));
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

function findFuelDrive(key) {
  return visible(state.generation?.fuelDrives).find((fuelDrive) => fuelDrive.key === key);
}

function findGrade(fuelDrive, key) {
  return visible(fuelDrive?.grades).find((grade) => grade.key === key);
}

document.addEventListener("click", (event) => {
  const clearDepthButton = event.target.closest("[data-clear-depth]");
  if (clearDepthButton) {
    const depth = clearDepthButton.dataset.clearDepth;
    if (depth === "maker") { state.maker = null; state.model = null; state.generation = null; state.modelTab = "all"; clearNestedSelections(); return setScreen(1); }
    if (depth === "model") { state.model = null; state.generation = null; clearNestedSelections(); return setScreen(2); }
    if (depth === "generation") { state.generation = null; clearNestedSelections(); return setScreen(3); }
  }
  const summaryStepButton = event.target.closest("[data-summary-screen]");
  if (summaryStepButton) return setScreen(summaryStepButton.dataset.summaryScreen);
  const screenButton = event.target.closest("[data-screen], [data-screen-target]");
  if (screenButton) return setScreen(screenButton.dataset.screen ?? screenButton.dataset.screenTarget);
  const logoButton = event.target.closest("[data-logo]");
  if (logoButton) { state.logo = logoButton.dataset.logo; phone.dataset.logoSize = state.logo; document.querySelectorAll("#logo-controls button").forEach((button) => button.classList.toggle("is-active", button === logoButton)); return; }
  const makerButton = event.target.closest("[data-select-maker]");
  if (makerButton) { state.maker = state.makers.find((maker) => maker.key === makerButton.dataset.selectMaker); state.model = null; state.generation = null; clearNestedSelections(); state.modelTab = "all"; return setScreen(2); }
  const modelButton = event.target.closest("[data-select-model]");
  if (modelButton) { state.model = visible(state.maker?.modelGroups).find((model) => model.key === modelButton.dataset.selectModel); state.generation = null; clearNestedSelections(); return setScreen(3); }
  const generationButton = event.target.closest("[data-select-generation]");
  if (generationButton) { state.generation = visible(state.model?.generations).find((generation) => generation.key === generationButton.dataset.selectGeneration); clearNestedSelections(); return setScreen(4); }
  const checkButton = event.target.closest("[data-check-kind]");
  if (checkButton) {
    const kind = checkButton.dataset.checkKind;
    const key = checkButton.dataset.checkKey;
    const fuelDrive = findFuelDrive(checkButton.dataset.fuelDriveKey);
    const grade = findGrade(fuelDrive, checkButton.dataset.gradeKey);
    if (kind === "fuel") {
      const wasExpanded = state.expandedFuelKey === key;
      const wasSelected = state.selectedFuelDrives.has(key);
      if (wasSelected) {
        state.selectedFuelDrives.delete(key);
        visible(fuelDrive?.grades).forEach((item) => {
          state.selectedGrades.delete(item.key);
          leafNodesForGrade(item, fuelDrive).forEach((leaf) => state.selectedLeaves.delete(leaf.key));
        });
      } else state.selectedFuelDrives.set(key, { key, label: fuelDrive.displayName, count: fuelDrive.listingCount });
      state.expandedFuelKey = key;
      if (!wasExpanded) state.expandedGradeKey = null;
    } else if (kind === "grade") {
      state.expandedFuelKey = checkButton.dataset.fuelDriveKey;
      const wasSelected = state.selectedGrades.has(key);
      if (wasSelected) {
        state.selectedGrades.delete(key);
        leafNodesForGrade(grade, fuelDrive).forEach((leaf) => state.selectedLeaves.delete(leaf.key));
      } else state.selectedGrades.set(key, { key, label: grade.displayName, count: grade.listingCount });
      state.expandedGradeKey = key;
    } else {
      const leaf = leafNodesForGrade(grade, fuelDrive).find((item) => item.key === key);
      if (state.selectedLeaves.has(key)) state.selectedLeaves.delete(key);
      else if (leaf) state.selectedLeaves.set(key, leaf);
    }
    return render();
  }
  const modelFilterButton = event.target.closest("[data-model-filter]");
  if (modelFilterButton) { state.modelTab = modelFilterButton.dataset.modelFilter; render(); body.scrollTop = 0; return; }
});

document.querySelector("#back-button").addEventListener("click", () => setScreen(state.screen - 1));
document.querySelector("#close-button").addEventListener("click", () => setScreen(0));
document.querySelector("#reset-button").addEventListener("click", () => { state.maker = null; state.model = null; state.generation = null; clearNestedSelections(); state.query = ""; state.modelTab = "all"; setScreen(1); });

async function loadCatalog() {
  try {
    const [catalogResponse, imageResponse] = await Promise.all([
      fetch(CATALOG_URL, { cache: "no-store" }),
      fetch(GENERATION_IMAGES_URL, { cache: "no-store" }),
    ]);
    if (!catalogResponse.ok) throw new Error(`catalog.json HTTP ${catalogResponse.status}`);
    if (!imageResponse.ok) throw new Error(`generation-images.json HTTP ${imageResponse.status}`);
    const [catalog, generationImages] = await Promise.all([catalogResponse.json(), imageResponse.json()]);
    validateCatalog(catalog);
    state.catalog = catalog;
    state.generationImages = generationImages;
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
