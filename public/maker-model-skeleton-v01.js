const PAGE_PARAMS = new URLSearchParams(window.location.search);
const IS_BIKE = PAGE_PARAMS.get("catalog") === "bike" || PAGE_PARAMS.get("type") === "bike";
const CATALOG_URL = IS_BIKE ? "./data/bike-catalog-1005/catalog.json" : "./data/encar-car-depth-1005/catalog.json";
const GENERATION_IMAGES_URL = "./data/encar-car-depth-1005/generation-images.json";
const GENERATION_IMAGE_BASE = "/assets/maker-model/generations/";
const MAKER_LOGO_BASE = "/assets/maker-model/logos/encar-1005-trim/";
const MAKER_LOGO_METRICS_URL = `${MAKER_LOGO_BASE}logo-display-v4.json`;
const BIKE_LOGO_BASE = "/assets/bike/logos/autohome-trim/";
const BIKE_LOGO_METRICS_URL = `${BIKE_LOGO_BASE}logo-display-bike.json`;
const BIKE_MODEL_IMAGE_BASE = "/assets/bike/models/";
const EXPECTED_COUNTS = { manufacturers: 63, modelGroups: 663, generations: 1256, fuelDrives: 2158, grades: 5976, subgrades: 3297 };
const EXPECTED_BIKE_COUNTS = { makers: 86, visibleMakers: 65, hiddenMakers: 21, modelGroups: 920, models: 2910 };
const IMPORT_POPULAR_ORDER = ["BMW", "벤츠", "아우디", "포르쉐", "미니", "랜드로버"];

const BIKE_GENRES = ["스쿠터", "네이키드", "스포츠", "크루저", "투어러", "멀티퍼퍼스", "클래식", "오프로드", "언더본·비즈니스", "삼륜", "ATV", "기타"];
const BIKE_GROUP_IMAGES = {
  "BKM001-G001": "honda/BKM001-G001-autoscout-v04.png",
  "BKM001-G002": "honda/BKM001-G002-autoscout-v04.png",
  "BKM001-G003": "honda/BKM001-G003-autoscout-v04.png",
  "BKM001-G004": "honda/BKM001-G004-autoscout-v04.png",
  "BKM001-G005": "honda/BKM001-G005-autoscout-v04.png",
  "BKM005-G001": "harley-davidson/BKM005-G001-autoscout-v04.png",
};

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

const state = {
  screen: 1, catalog: null, makers: [], maker: null, model: null, generation: null,
  bikeGroup: null, bikeModel: null, bikeGenre: null,
  logoMetrics: {},
  generationImages: {}, selectedFuelDrives: new Map(), selectedGrades: new Map(), selectedLeaves: new Map(),
  modelTab: "all", query: "", status: "loading", error: "",
};

document.documentElement.classList.toggle("is-bike-catalog", IS_BIKE);
document.title = IS_BIKE ? "보배드림 바이크 제조사·모델 선택" : document.title;
if (IS_BIKE) {
  document.querySelector(".eyebrow").textContent = "보배드림 바이크 검색";
  document.querySelector("#brief-title").textContent = "바이크 제조사·모델 선택";
  document.querySelector(".brief-copy").textContent = "제조사부터 모델그룹·모델까지 같은 바텀시트 안에서 빠르게 선택합니다.";
  const screenButtons = document.querySelectorAll("#screen-controls button");
  if (screenButtons[2]) screenButtons[2].textContent = "2 모델그룹";
  if (screenButtons[3]) screenButtons[3].textContent = "3 모델";
  const tokenValues = document.querySelectorAll(".token-table dd");
  if (tokenValues[1]) tokenValues[1].textContent = "84×56 이미지 · 간격 16 · 행 72";
  if (tokenValues[2]) tokenValues[2].textContent = "84×56 실루엣 · 간격 16 · 행 72";
  if (tokenValues[3]) tokenValues[3].textContent = "장르 칩 · 제조사별 가변 노출";
}

const body = document.querySelector("#sheet-body");
const title = document.querySelector("#sheet-title");
const header = document.querySelector(".sheet-header");
const backButton = document.querySelector("#back-button");

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

function validateBikeCatalog(catalog) {
  const makers = catalog.makers || [];
  const visibleMakers = makers.filter((maker) => maker.visible);
  const modelGroups = makers.filter((maker) => maker.uses_groups).reduce((sum, maker) => sum + maker.groups.length, 0);
  const models = makers.reduce((sum, maker) => sum + maker.groups.reduce((groupSum, group) => groupSum + group.models.length, 0), 0);
  const actual = { makers: makers.length, visibleMakers: visibleMakers.length, hiddenMakers: makers.length - visibleMakers.length, modelGroups, models };
  const mismatch = Object.keys(EXPECTED_BIKE_COUNTS).filter((key) => actual[key] !== EXPECTED_BIKE_COUNTS[key]);
  if (mismatch.length) throw new Error(`DB 건수 불일치: ${mismatch.map((key) => `${key} ${actual[key]}/${EXPECTED_BIKE_COUNTS[key]}`).join(", ")}`);
}

function bikeLogoFile(maker) {
  const english = maker.name_en || "Others";
  const slug = english.replace(/[^a-z0-9]+/gi, " ").trim().replace(/\s+/g, "_");
  return `${maker.code}_${slug}.png`;
}

function adaptBikeCatalog(catalog) {
  validateBikeCatalog(catalog);
  return catalog.makers.filter((maker) => maker.visible).sort((a, b) => a.sort - b.sort).map((maker) => {
    const groups = maker.groups.filter((group) => maker.uses_groups && !group.implicit).sort((a, b) => a.sort - b.sort).map((group) => ({
      key: group.code,
      displayName: group.name,
      sortOrder: group.sort,
      isVisible: true,
      listingCount: null,
      genres: [...new Set(group.models.map((model) => model.genre || "기타"))],
      bikeModels: group.models.filter((model) => model.status !== "hidden").sort((a, b) => a.sort - b.sort).map((model) => ({
        key: model.code,
        displayName: model.name,
        sortOrder: model.sort,
        isVisible: true,
        genre: model.genre || "기타",
        ccBand: model.cc_band,
        fuel: model.fuel,
        yearMin: model.year_min,
        yearMax: model.year_max,
      })),
    }));
    const directModels = maker.groups.flatMap((group) => group.models).filter((model) => model.status !== "hidden").sort((a, b) => a.sort - b.sort).map((model) => ({
      key: model.code,
      displayName: model.name,
      sortOrder: model.sort,
      isVisible: true,
      genre: model.genre || "기타",
      ccBand: model.cc_band,
      fuel: model.fuel,
      yearMin: model.year_min,
      yearMax: model.year_max,
    }));
    return {
      key: maker.code,
      code: maker.code,
      displayName: maker.name,
      englishName: maker.name_en,
      isVisible: true,
      sortOrder: maker.sort,
      listingCount: maker.listing_count_test,
      popular: maker.popular,
      usesGroups: maker.uses_groups,
      modelGroups: groups,
      bikeModels: directModels,
      logoFile: bikeLogoFile(maker),
    };
  });
}

function makerLogo(maker) {
  if (IS_BIKE) {
    const fileName = maker.logoFile;
    const metric = state.logoMetrics[fileName];
    if (!metric) return `<span class="maker-logo maker-logo-fallback" aria-hidden="true">${escapeHtml((maker.displayName || "?").slice(0, 1))}</span>`;
    const sizeStyle = `width:${Number(metric.displayWidth)}px;height:${Number(metric.displayHeight)}px`;
    return `<span class="maker-logo"><img class="maker-logo-image" data-logo-file="${escapeHtml(fileName)}" style="${sizeStyle}" src="${BIKE_LOGO_BASE}${escapeHtml(fileName)}" alt="" /></span>`;
  }
  const fileName = ["Others", "etc"].includes(maker.englishName) ? "etc_maker_icon.png" : ENCAR_LOGO_FILES[maker.englishName] || "etc_maker_icon.png";
  const metric = state.logoMetrics[fileName] || { displayWidth: 26, displayHeight: 26 };
  const sizeStyle = `width:${Number(metric.displayWidth)}px;height:${Number(metric.displayHeight)}px`;
  return `<span class="maker-logo"><img class="maker-logo-image" data-logo-file="${escapeHtml(fileName)}" style="${sizeStyle}" src="${MAKER_LOGO_BASE}${escapeHtml(fileName)}" alt="" /></span>`;
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
  if (IS_BIKE) {
    if (state.screen >= 2 && state.maker) items.push({ key: "maker", label: state.maker.displayName, screen: 1 });
    if (state.screen >= 3 && state.bikeGroup) items.push({ key: "bikeGroup", label: state.bikeGroup.displayName, screen: 2 });
    return items;
  }
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
  if (IS_BIKE) {
    const popular = filtered.filter((maker) => maker.popular).slice(0, 10);
    const otherMaker = filtered.filter((maker) => maker.key === "BKM086");
    const remainder = filtered.filter((maker) => !maker.popular && maker.key !== "BKM086");
    const groups = [["인기 제조사 10곳", popular], ["전체 제조사", remainder], ["기타", otherMaker]];
    const content = groups.map(([group, rows], index) => rows.length ? `<h3 class="section-title maker-section-title ${index ? "with-rule" : ""}">${group}</h3><ul class="maker-list">${rows.map(makerRow).join("")}</ul>` : "").join("");
    return `${searchField("바이크 제조사 검색")}${content || '<p class="empty-copy">검색 결과가 없습니다.</p>'}`;
  }
  const domestic = filtered.filter((maker) => maker.origin === "국산");
  const imported = filtered.filter((maker) => maker.origin === "수입");
  const popularImported = IMPORT_POPULAR_ORDER.map((name) => imported.find((maker) => maker.displayName === name)).filter(Boolean);
  const groups = [["국산차", domestic], ["수입차 인기제조사", popularImported], ["수입차 이름순", imported]];
  const content = groups.map(([group, rows], index) => rows.length ? `<h3 class="section-title maker-section-title ${index ? "with-rule" : ""}">${group}${testBadge()}</h3><ul class="maker-list">${rows.map(makerRow).join("")}</ul>` : "").join("");
  return `${searchField("제조사 검색")}${content || '<p class="empty-copy">검색 결과가 없습니다.</p>'}`;
}

function bikePlaceholder() {
  return `<span class="bike-placeholder-icon" aria-hidden="true"></span>`;
}

function bikeGroupImage(item) {
  const fileName = BIKE_GROUP_IMAGES[item.key];
  return `<span class="vehicle-silhouette bike-image${fileName ? " has-generated-image" : " is-placeholder"}" aria-hidden="true">${fileName ? `<img class="generated-bike-image" src="${BIKE_MODEL_IMAGE_BASE}${escapeHtml(fileName)}" alt="" />` : bikePlaceholder()}</span>`;
}

function bikeRow(item, isGroup) {
  const dataName = isGroup ? "data-select-bike-group" : "data-select-bike-model";
  const meta = !isGroup && [item.ccBand, item.fuel].filter(Boolean).join(" · ");
  return `<li><button class="option-row model-row bike-model-row" type="button" ${dataName}="${escapeHtml(item.key)}">${bikeGroupImage(item)}<span class="model-copy"><strong>${escapeHtml(item.displayName)}</strong>${meta ? `<small>${escapeHtml(meta)}</small>` : ""}</span>${icon("/assets/maker-model/icons/chotot-chevron-right.svg", "chevron")}</button></li>`;
}

function bikeGenreRail(items, isGroup) {
  const available = BIKE_GENRES.filter((genre) => items.some((item) => isGroup ? item.genres.includes(genre) : item.genre === genre));
  if (!available.length) return "";
  if (state.bikeGenre && !available.includes(state.bikeGenre)) state.bikeGenre = null;
  return `<div class="body-type-rail bike-genre-rail" aria-label="바이크 장르 선택">${available.map((genre) => `<button type="button" data-bike-genre="${escapeHtml(genre)}" aria-pressed="${state.bikeGenre === genre}"><span>${escapeHtml(genre)}</span></button>`).join("")}</div>`;
}

function renderBikeModel() {
  if (!state.maker) return '<p class="empty-copy">제조사를 먼저 선택해 주세요.</p>';
  const isGroup = state.maker.usesGroups;
  const source = isGroup ? state.maker.modelGroups : state.maker.bikeModels;
  const query = state.query.trim().toLocaleLowerCase("ko-KR");
  const filtered = source.filter((item) => item.displayName.toLocaleLowerCase("ko-KR").includes(query));
  const genreFiltered = state.bikeGenre ? filtered.filter((item) => isGroup ? item.genres.includes(state.bikeGenre) : item.genre === state.bikeGenre) : filtered;
  const rows = genreFiltered.map((item) => bikeRow(item, isGroup)).join("");
  return `${renderSelectionSummary()}${searchField(isGroup ? "모델그룹 검색" : "모델 검색")}${bikeGenreRail(source, isGroup)}<ul class="model-list bike-model-list">${rows}</ul>${rows ? "" : '<p class="empty-copy">검색 결과가 없습니다.</p>'}`;
}

function renderBikeChildren() {
  if (!state.bikeGroup) return '<p class="empty-copy">모델그룹을 먼저 선택해 주세요.</p>';
  const query = state.query.trim().toLocaleLowerCase("ko-KR");
  const models = state.bikeGroup.bikeModels.filter((item) => item.displayName.toLocaleLowerCase("ko-KR").includes(query));
  return `${renderSelectionSummary()}${searchField("모델 검색")}<ul class="model-list bike-model-list">${models.map((model) => bikeRow(model, false)).join("")}</ul>`;
}

function modelRow(model) {
  return `<li><button class="option-row model-row" type="button" data-select-model="${escapeHtml(model.key)}">${modelSilhouette(model)}<span class="model-copy"><strong>${escapeHtml(model.displayName)}</strong></span><span class="option-count">${formatCount(model.listingCount)}</span>${icon("/assets/maker-model/icons/chotot-chevron-right.svg", "chevron")}</button></li>`;
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
  if (IS_BIKE) return renderBikeModel();
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
  if (IS_BIKE) return renderBikeChildren();
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

function checkRow({ key, label, count, level, kind, fuelDriveKey = "", gradeKey = "", expanded = null }) {
  const depthName = ["연료·배기량", "등급", "세부등급"][level] || "선택 항목";
  const expandedAttribute = expanded === null ? "" : ` aria-expanded="${expanded}"`;
  return `<li><button class="option-row grade-row level-${level}" role="checkbox" aria-checked="${checkedState(kind, key)}"${expandedAttribute} aria-label="${depthName} ${escapeHtml(label)}, ${formatCount(count)}대" type="button" data-check-kind="${kind}" data-check-key="${escapeHtml(key)}" data-fuel-drive-key="${escapeHtml(fuelDriveKey)}" data-grade-key="${escapeHtml(gradeKey)}"><span class="fake-checkbox">${icon("/assets/maker-model/icons/chotot-check.svg")}</span><span class="grade-name">${escapeHtml(label)}</span><span class="option-count">${formatCount(count)}</span></button></li>`;
}

function renderGrade() {
  if (!state.generation || state.generation.key === "all") return '<div class="empty-copy"><strong>모델 전체가 선택되었습니다.</strong><br />연료·구동과 등급을 고르려면 세부모델 한 개를 선택해 주세요.</div>';
  const fuelDrives = visible(state.generation.fuelDrives);
  const groups = fuelDrives.map((fuelDrive) => {
    // 엔카 공식 동작: 상위 체크 상태가 곧 하위 목록의 열림 상태다.
    // 복수 연료·배기량을 선택하면 각 하위 등급 목록을 동시에 연다.
    const isFuelExpanded = state.selectedFuelDrives.has(fuelDrive.key);
    const fdRow = checkRow({
      key: fuelDrive.key,
      label: fuelDrive.displayName,
      count: fuelDrive.listingCount,
      level: 0,
      kind: "fuel",
      fuelDriveKey: fuelDrive.key,
      expanded: isFuelExpanded,
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
        expanded: subgrades.length ? state.selectedGrades.has(grade.key) : null,
      });
      if (!state.selectedGrades.has(grade.key) || !subgrades.length) return gradeRow;
      const subgradeRows = subgrades.map((subgrade) => checkRow({
        key: subgrade.key,
        label: subgrade.displayName,
        count: subgrade.listingCount,
        level: 2,
        kind: "leaf",
        fuelDriveKey: fuelDrive.key,
        gradeKey: grade.key,
      })).join("");
      return `${gradeRow}${subgradeRows}`;
    }).join("");
    return `${fdRow}${grades}`;
  }).join("");
  return `${renderSelectionSummary()}<ul class="grade-list" aria-label="${escapeHtml(state.generation.displayName)} 등급 선택">${groups || '<li class="empty-copy">등급 데이터가 없습니다.</li>'}</ul>`;
}

function renderOverview() {
  if (IS_BIKE) {
    const rows = [
      { label: "제조사", value: state.maker?.displayName || "선택", screen: 1, clearDepth: state.maker ? "maker" : "" },
      { label: "모델그룹", value: state.bikeGroup?.displayName || (state.maker?.usesGroups === false ? "해당 없음" : "선택"), screen: 2, clearDepth: state.bikeGroup ? "bikeGroup" : "" },
      { label: "모델", value: state.bikeModel?.displayName || "선택", screen: state.maker?.usesGroups ? 3 : 2, clearDepth: state.bikeModel ? "bikeModel" : "" },
    ];
    return `<div class="filter-overview">${rows.map((row) => `<div class="filter-row"><strong>${escapeHtml(row.label)}</strong><div class="filter-value-group"><button class="filter-value-button" type="button" data-screen-target="${row.screen}"><span class="filter-value">${escapeHtml(row.value)}</span></button>${row.clearDepth ? `<button class="filter-clear" type="button" data-clear-depth="${row.clearDepth}" aria-label="${escapeHtml(row.value)} 선택 해제">${icon("/assets/maker-model/icons/chotot-close.svg")}</button>` : ""}</div><button class="filter-nav" type="button" data-screen-target="${row.screen}" aria-label="${escapeHtml(row.label)} 다시 선택">${icon("/assets/maker-model/icons/chotot-chevron-right.svg", "chevron")}</button></div>`).join("")}</div>`;
  }
  const selectedGrades = selectedResultItems();
  const rows = [
    { label: "제조사", value: state.maker?.displayName || "선택", screen: 1, clearDepth: state.maker ? "maker" : "" },
    { label: "모델", value: state.model?.displayName || "선택", screen: 2, clearDepth: state.model ? "model" : "" },
    {
      label: "세부모델",
      value: state.generation?.displayName || "선택",
      detail: state.generation ? generationPeriod(state.generation) : "",
      screen: 3,
      clearDepth: state.generation ? "generation" : "",
    },
  ];
  if (selectedGrades.length) {
    selectedGrades.forEach((item, index) => rows.push({
      label: index === 0 ? "등급" : "",
      value: item.label,
      screen: 4,
      selection: item,
    }));
  } else rows.push({ label: "등급", value: "선택", screen: 4 });

  return `<div class="filter-overview">${rows.map((row) => {
    const detail = row.detail ? `<small>${escapeHtml(row.detail)}</small>` : "";
    const clear = row.clearDepth
      ? `<button class="filter-clear" type="button" data-clear-depth="${row.clearDepth}" aria-label="${escapeHtml(row.value)} 선택 해제">${icon("/assets/maker-model/icons/chotot-close.svg")}</button>`
      : row.selection
        ? `<button class="filter-clear" type="button" data-clear-selection-kind="${escapeHtml(row.selection.kind)}" data-clear-selection-key="${escapeHtml(row.selection.key)}" data-fuel-drive-key="${escapeHtml(row.selection.fuelDriveKey || "")}" data-grade-key="${escapeHtml(row.selection.gradeKey || "")}" aria-label="${escapeHtml(row.value)} 선택 해제">${icon("/assets/maker-model/icons/chotot-close.svg")}</button>`
        : "";
    return `<div class="filter-row"><strong${row.label ? "" : ' aria-hidden="true"'}>${escapeHtml(row.label)}</strong><div class="filter-value-group"><button class="filter-value-button" type="button" data-screen-target="${row.screen}"><span class="filter-value">${escapeHtml(row.value)}</span>${detail}</button>${clear}</div><button class="filter-nav" type="button" data-screen-target="${row.screen}" aria-label="${escapeHtml(row.label || "등급")} 다시 선택">${icon("/assets/maker-model/icons/chotot-chevron-right.svg", "chevron")}</button></div>`;
  }).join("")}</div>`;
}

function selectedResultItems() {
  if (!state.generation) return [];
  const result = [];
  for (const fuelDrive of visible(state.generation.fuelDrives)) {
    const fuelLeaves = [];
    const fuelGrades = [];
    for (const grade of visible(fuelDrive.grades)) {
      const gradeLeaves = leafNodesForGrade(grade, fuelDrive).filter((leaf) => state.selectedLeaves.has(leaf.key));
      if (gradeLeaves.length) fuelLeaves.push(...gradeLeaves.map((leaf) => ({ ...leaf, kind: "leaf" })));
      else if (state.selectedGrades.has(grade.key)) fuelGrades.push({ key: grade.key, label: grade.displayName, count: grade.listingCount, kind: "grade", fuelDriveKey: fuelDrive.key, gradeKey: grade.key });
    }
    if (fuelLeaves.length) result.push(...fuelLeaves);
    else if (fuelGrades.length) result.push(...fuelGrades);
    else if (state.selectedFuelDrives.has(fuelDrive.key)) result.push({ key: fuelDrive.key, label: fuelDrive.displayName, count: fuelDrive.listingCount, kind: "fuel", fuelDriveKey: fuelDrive.key });
  }
  return result;
}

function currentListingCount() {
  if (IS_BIKE) return state.maker?.listingCount ?? state.makers.reduce((sum, maker) => sum + Number(maker.listingCount || 0), 0);
  const selectedItems = selectedResultItems();
  if (selectedItems.length) return selectedItems.reduce((sum, item) => sum + Number(item.count || 0), 0);
  return state.generation?.listingCount ?? state.model?.listingCount ?? state.maker?.listingCount ?? state.makers.reduce((sum, maker) => sum + maker.listingCount, 0);
}

function updateSelections() {
  document.querySelector("#apply-button").textContent = `${formatCount(currentListingCount())}대 보기`;
  const hasSelection = Boolean(state.maker || state.model || state.generation || selectedResultItems().length);
  document.querySelector("#reset-button").disabled = !hasSelection;
}

function clearNestedSelections() {
  state.selectedFuelDrives.clear();
  state.selectedGrades.clear();
  state.selectedLeaves.clear();
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
  const titles = IS_BIKE ? ["필터", "제조사", "모델", "모델", ""] : ["필터", "제조사", "모델", "세부모델", "연료·구동"];
  title.textContent = IS_BIKE && state.screen === 3 && state.bikeGroup ? state.bikeGroup.displayName : state.screen === 4 && state.generation ? state.generation.displayName : titles[state.screen];
  if (state.status === "loading") body.innerHTML = '<div class="loading-copy">제조사·모델 정보를 불러오는 중입니다.</div>';
  else if (state.status === "error") body.innerHTML = `<div class="data-error" role="alert"><strong>DB 연결을 중단했습니다.</strong><span>${escapeHtml(state.error)}</span></div>`;
  else body.innerHTML = [renderOverview, renderMaker, renderModel, renderGeneration, renderGrade][state.screen]();
  const isRootScreen = state.screen <= 1;
  header.classList.toggle("is-root", isRootScreen);
  backButton.hidden = isRootScreen;
  document.querySelectorAll("#screen-controls button").forEach((button) => button.classList.toggle("is-active", Number(button.dataset.screen) === state.screen));
  updateSelections();
  bindSearch();
}

function setScreen(screen) { state.screen = Math.min(IS_BIKE ? 3 : 4, Math.max(0, Number(screen))); state.query = ""; render(); body.scrollTop = 0; }

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
  const clearSelectionButton = event.target.closest("[data-clear-selection-kind]");
  if (clearSelectionButton) {
    const kind = clearSelectionButton.dataset.clearSelectionKind;
    const key = clearSelectionButton.dataset.clearSelectionKey;
    const fuelDrive = findFuelDrive(clearSelectionButton.dataset.fuelDriveKey);
    const grade = findGrade(fuelDrive, clearSelectionButton.dataset.gradeKey);
    if (kind === "fuel") {
      state.selectedFuelDrives.delete(key);
      visible(fuelDrive?.grades).forEach((item) => {
        state.selectedGrades.delete(item.key);
        leafNodesForGrade(item, fuelDrive).forEach((leaf) => state.selectedLeaves.delete(leaf.key));
      });
    } else if (kind === "grade") {
      state.selectedGrades.delete(key);
      leafNodesForGrade(grade, fuelDrive).forEach((leaf) => state.selectedLeaves.delete(leaf.key));
    } else state.selectedLeaves.delete(key);
    return render();
  }
  const clearDepthButton = event.target.closest("[data-clear-depth]");
  if (clearDepthButton) {
    const depth = clearDepthButton.dataset.clearDepth;
    if (depth === "maker") { state.maker = null; state.model = null; state.generation = null; state.bikeGroup = null; state.bikeModel = null; state.bikeGenre = null; state.modelTab = "all"; clearNestedSelections(); return setScreen(1); }
    if (depth === "bikeGroup") { state.bikeGroup = null; state.bikeModel = null; return setScreen(2); }
    if (depth === "bikeModel") { state.bikeModel = null; return setScreen(state.maker?.usesGroups ? 3 : 2); }
    if (depth === "model") { state.model = null; state.generation = null; clearNestedSelections(); return setScreen(2); }
    if (depth === "generation") { state.generation = null; clearNestedSelections(); return setScreen(3); }
  }
  const summaryStepButton = event.target.closest("[data-summary-screen]");
  if (summaryStepButton) return setScreen(summaryStepButton.dataset.summaryScreen);
  const screenButton = event.target.closest("[data-screen], [data-screen-target]");
  if (screenButton) return setScreen(screenButton.dataset.screen ?? screenButton.dataset.screenTarget);
  const makerButton = event.target.closest("[data-select-maker]");
  if (makerButton) { state.maker = state.makers.find((maker) => maker.key === makerButton.dataset.selectMaker); state.model = null; state.generation = null; state.bikeGroup = null; state.bikeModel = null; state.bikeGenre = null; clearNestedSelections(); state.modelTab = "all"; return setScreen(2); }
  const bikeGroupButton = event.target.closest("[data-select-bike-group]");
  if (bikeGroupButton) { state.bikeGroup = state.maker?.modelGroups.find((group) => group.key === bikeGroupButton.dataset.selectBikeGroup); state.bikeModel = null; return setScreen(3); }
  const bikeModelButton = event.target.closest("[data-select-bike-model]");
  if (bikeModelButton) {
    const source = state.bikeGroup?.bikeModels || state.maker?.bikeModels || [];
    state.bikeModel = source.find((model) => model.key === bikeModelButton.dataset.selectBikeModel);
    return render();
  }
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
      const wasSelected = state.selectedFuelDrives.has(key);
      if (wasSelected) {
        state.selectedFuelDrives.delete(key);
        visible(fuelDrive?.grades).forEach((item) => {
          state.selectedGrades.delete(item.key);
          leafNodesForGrade(item, fuelDrive).forEach((leaf) => state.selectedLeaves.delete(leaf.key));
        });
      } else state.selectedFuelDrives.set(key, { key, label: fuelDrive.displayName, count: fuelDrive.listingCount });
    } else if (kind === "grade") {
      const wasSelected = state.selectedGrades.has(key);
      if (wasSelected) {
        state.selectedGrades.delete(key);
        leafNodesForGrade(grade, fuelDrive).forEach((leaf) => state.selectedLeaves.delete(leaf.key));
      } else state.selectedGrades.set(key, { key, label: grade.displayName, count: grade.listingCount });
    } else {
      const leaf = leafNodesForGrade(grade, fuelDrive).find((item) => item.key === key);
      if (state.selectedLeaves.has(key)) state.selectedLeaves.delete(key);
      else if (leaf) state.selectedLeaves.set(key, leaf);
    }
    return render();
  }
  const modelFilterButton = event.target.closest("[data-model-filter]");
  if (modelFilterButton) { state.modelTab = modelFilterButton.dataset.modelFilter; render(); body.scrollTop = 0; return; }
  const bikeGenreButton = event.target.closest("[data-bike-genre]");
  if (bikeGenreButton) { state.bikeGenre = state.bikeGenre === bikeGenreButton.dataset.bikeGenre ? null : bikeGenreButton.dataset.bikeGenre; render(); body.scrollTop = 0; }
});

backButton.addEventListener("click", () => setScreen(state.screen - 1));
document.querySelector("#close-button").addEventListener("click", () => setScreen(0));
document.querySelector("#apply-button").addEventListener("click", () => setScreen(0));
document.querySelector("#reset-button").addEventListener("click", () => { state.maker = null; state.model = null; state.generation = null; state.bikeGroup = null; state.bikeModel = null; state.bikeGenre = null; clearNestedSelections(); state.query = ""; state.modelTab = "all"; setScreen(1); });

async function loadCatalog() {
  try {
    if (IS_BIKE) {
      const [catalogResponse, logoMetricsResponse] = await Promise.all([
        fetch(CATALOG_URL, { cache: "no-store" }),
        fetch(BIKE_LOGO_METRICS_URL, { cache: "no-store" }),
      ]);
      if (!catalogResponse.ok) throw new Error(`catalog.json HTTP ${catalogResponse.status}`);
      if (!logoMetricsResponse.ok) throw new Error(`logo-display-bike.json HTTP ${logoMetricsResponse.status}`);
      const [catalog, logoMetrics] = await Promise.all([catalogResponse.json(), logoMetricsResponse.json()]);
      state.catalog = catalog;
      state.logoMetrics = logoMetrics;
      state.makers = adaptBikeCatalog(catalog);
      state.status = "ready";
      render();
      return;
    }
    const [catalogResponse, imageResponse, logoMetricsResponse] = await Promise.all([
      fetch(CATALOG_URL, { cache: "no-store" }),
      fetch(GENERATION_IMAGES_URL, { cache: "no-store" }),
      fetch(MAKER_LOGO_METRICS_URL, { cache: "no-store" }),
    ]);
    if (!catalogResponse.ok) throw new Error(`catalog.json HTTP ${catalogResponse.status}`);
    if (!imageResponse.ok) throw new Error(`generation-images.json HTTP ${imageResponse.status}`);
    if (!logoMetricsResponse.ok) throw new Error(`logo-display-v4.json HTTP ${logoMetricsResponse.status}`);
    const [catalog, generationImages, logoMetrics] = await Promise.all([catalogResponse.json(), imageResponse.json(), logoMetricsResponse.json()]);
    validateCatalog(catalog);
    state.catalog = catalog;
    state.generationImages = generationImages;
    state.logoMetrics = logoMetrics;
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
