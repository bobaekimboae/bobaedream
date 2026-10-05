const makers = [
  { group: "국산", name: "현대", logo: "./assets/brand/kr/hyundai.png", count: 48489 },
  { group: "국산", name: "제네시스", logo: "./assets/brand/kr/genesis.png", count: 12277 },
  { group: "국산", name: "기아", logo: "./assets/brand/kr/kia.png", count: 48652 },
  { group: "국산", name: "쉐보레(GM대우)", logo: "./assets/brand/kr/chevrolet.png", count: 7976 },
  { group: "국산", name: "르노코리아(삼성)", logo: "./assets/brand/kr/renault.png", count: 6612 },
  { group: "국산", name: "KGM(쌍용)", logo: "./assets/brand/kr/kgm.png", count: 8924 },
  { group: "국산", name: "어울림모터스", logo: "./assets/brand/kr/eoullim.png", count: 43 },
  { group: "수입 인기", name: "BMW", logo: "./assets/brand/kr/bmw.png", count: 17426 },
  { group: "수입 인기", name: "벤츠", logo: "./assets/brand/kr/mercedes-benz.png", count: 16508 },
  { group: "수입 인기", name: "아우디", logo: "./assets/brand/kr/audi.png", count: 7821 },
  { group: "수입 인기", name: "포르쉐", logo: "./assets/brand/kr/porsche.png", count: 4711 },
  { group: "수입 인기", name: "미니", logo: "./assets/brand/kr/mini.png", count: 3568 },
  { group: "수입 인기", name: "랜드로버", logo: "./assets/brand/kr/land-rover.png", count: 2762 },
  { group: "수입 인기", name: "폭스바겐", logo: "./assets/brand/kr/volkswagen.png", count: 5613 },
  { group: "수입 이름순", name: "람보르기니", logo: "./assets/brand/kr/lamborghini.png", count: 626 },
  { group: "수입 이름순", name: "렉서스", logo: "./assets/brand/kr/lexus.png", count: 3282 },
  { group: "수입 이름순", name: "볼보", logo: "./assets/brand/kr/volvo.png", count: 2944 },
  { group: "수입 이름순", name: "페라리", logo: "./assets/brand/kr/ferrari.png", count: 483 },
];

const images = {
  current: "./assets/bbm/generated/quickfilter-v01/car_mercedes_gclass_w465_v01.png",
  previous: "./assets/bbm/generated/quickfilter-v01/car_mercedes_gclass_w463_v01.png",
  classic: "./assets/bbm/generated/quickfilter-v01/car_mercedes_gclass_w460_v01.png",
  sedan: "./assets/bbm/generated/quickfilter-v01/car_body_sedan_v01.png",
  suv: "./assets/bbm/generated/quickfilter-v01/car_body_suv_v01.png",
  hatchback: "./assets/bbm/generated/quickfilter-v01/car_body_hatchback_v01.png",
};

const models = [
  { name: "A클래스", count: 1208, image: images.hatchback, body: "해치백" },
  { name: "C클래스", count: 5408, image: images.sedan, body: "세단" },
  { name: "E클래스", count: 8904, image: images.sedan, body: "세단" },
  { name: "G클래스", count: 1096, image: images.current, body: "SUV" },
  { name: "S클래스", count: 6243, image: images.sedan, body: "세단" },
  { name: "GLA클래스", count: 901, image: images.suv, body: "SUV" },
  { name: "GLC클래스", count: 2334, image: images.suv, body: "SUV" },
  { name: "GLE클래스", count: 1855, image: images.suv, body: "SUV" },
  { name: "마이바흐", count: 688, image: images.sedan, body: "세단" },
];

const generations = [
  { name: "G클래스 W465", year: "24년~현재", count: 118, image: images.current },
  { name: "G클래스 W463", year: "18~24년", count: 721, image: images.previous },
  { name: "G클래스 W463", year: "90~18년", count: 239, image: images.previous },
  { name: "G클래스 W460", year: "79~92년", count: 18, image: images.classic },
];

const gradeGroups = [
  { name: "가솔린 4WD", rows: [["G 500", 24], ["AMG G 63", 189]] },
  { name: "디젤 4WD", rows: [["G 350d", 204], ["G 400d", 278], ["G 450d", 61]] },
  { name: "전기 4WD", rows: [["G 580 위드 EQ 테크놀로지", 12]] },
];

const state = {
  screen: 1,
  logo: "l",
  maker: null,
  model: null,
  generation: null,
  grades: new Set(),
  modelTab: "name",
  query: "",
};

const body = document.querySelector("#sheet-body");
const title = document.querySelector("#sheet-title");
const selectionStrip = document.querySelector("#selection-strip");
const phone = document.querySelector(".phone");

const formatCount = (value) => value.toLocaleString("ko-KR");
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[character]));

function icon(path, className = "") {
  return `<img class="${className}" src="${path}" alt="" aria-hidden="true" />`;
}

function searchField(placeholder) {
  return `<div class="search-wrap"><label class="search-field">
    ${icon("./assets/maker-model/icons/chotot-search-gray.svg")}
    <input id="screen-search" type="search" value="${escapeHtml(state.query)}" placeholder="${placeholder}" aria-label="${placeholder}" autocomplete="off" />
  </label></div>`;
}

function makerRow(maker) {
  return `<li><button class="option-row maker-row" type="button" data-select-maker="${escapeHtml(maker.name)}">
    <span class="maker-logo"><img src="${maker.logo}" alt="" /></span>
    <span class="maker-name">${escapeHtml(maker.name)}</span>
    <span class="option-count">${formatCount(maker.count)}</span>
    ${icon("./assets/maker-model/icons/chotot-chevron-right.svg", "chevron")}
  </button></li>`;
}

function renderMaker() {
  const query = state.query.trim().toLocaleLowerCase("ko-KR");
  const filtered = makers.filter((maker) => maker.name.toLocaleLowerCase("ko-KR").includes(query));
  const groups = ["국산", "수입 인기", "수입 이름순"];
  const content = groups.map((group, index) => {
    const rows = filtered.filter((maker) => maker.group === group);
    if (!rows.length) return "";
    return `<h3 class="section-title ${index ? "with-rule" : ""}">${group}</h3><ul class="maker-list">${rows.map(makerRow).join("")}</ul>`;
  }).join("");
  return `${searchField("제조사 검색")}${content || '<p class="empty-copy">검색 결과가 없습니다.</p>'}`;
}

function modelRow(model) {
  return `<li><button class="option-row model-row" type="button" data-select-model="${escapeHtml(model.name)}">
    ${icon(model.image, "vehicle-image")}
    <span class="model-copy"><strong>${escapeHtml(model.name)}</strong></span>
    <span class="option-count">${formatCount(model.count)}</span>
    ${icon("./assets/maker-model/icons/chotot-chevron-right.svg", "chevron")}
  </button></li>`;
}

function renderModel() {
  const query = state.query.trim().toLocaleLowerCase("ko-KR");
  const filtered = models.filter((model) => model.name.toLocaleLowerCase("ko-KR").includes(query));
  const popular = models.slice(0, 5).map((model) => `<button class="popular-card" type="button" data-select-model="${escapeHtml(model.name)}">
    ${icon(model.image)}<span>${escapeHtml(model.name)}</span>
  </button>`).join("");
  const rows = state.modelTab === "body"
    ? ["세단", "SUV", "해치백"].map((bodyType) => {
        const bodyRows = filtered.filter((model) => model.body === bodyType);
        return bodyRows.length ? `<h3 class="section-title">${bodyType}</h3><ul class="model-list">${bodyRows.map(modelRow).join("")}</ul>` : "";
      }).join("")
    : `<div class="index-rail" aria-label="초성 이동">${["A","C","E","G","M","S"].map((letter) => `<button type="button" data-index="${letter}">${letter}</button>`).join("")}</div><ul class="model-list">${filtered.map(modelRow).join("")}</ul>`;
  return `<div class="path-copy"><span>${escapeHtml(state.maker?.name || "벤츠")}</span><span>›</span><strong>모델</strong></div>
    ${searchField("모델명·세대코드 검색")}
    <h3 class="section-title">인기 모델</h3><div class="popular-rail">${popular}</div>
    <div class="tab-bar"><button type="button" data-model-tab="name" class="${state.modelTab === "name" ? "is-active" : ""}">이름순</button><button type="button" data-model-tab="body" class="${state.modelTab === "body" ? "is-active" : ""}">바디타입</button></div>
    ${rows || '<p class="empty-copy">검색 결과가 없습니다.</p>'}`;
}

function generationRow(generation) {
  return `<li><button class="option-row generation-row" type="button" data-select-generation="${escapeHtml(generation.name)}">
    ${icon(generation.image, "vehicle-image")}
    <span class="generation-copy"><strong>${escapeHtml(generation.name)}</strong><span>${escapeHtml(generation.year)}</span></span>
    <span class="option-count">${formatCount(generation.count)}</span>
    ${icon("./assets/maker-model/icons/chotot-chevron-right.svg", "chevron")}
  </button></li>`;
}

function renderGeneration() {
  return `<div class="path-copy"><span>${escapeHtml(state.maker?.name || "벤츠")}</span><span>›</span><span>${escapeHtml(state.model?.name || "G클래스")}</span><span>›</span><strong>세부모델</strong></div>
    <div class="all-row"><button type="button" data-select-generation="all"><span>${escapeHtml(state.model?.name || "G클래스")} 전체</span><span class="option-count">${formatCount(generations.reduce((sum, item) => sum + item.count, 0))}</span></button></div>
    <h3 class="section-title">최신순</h3><ul class="generation-list">${generations.map(generationRow).join("")}</ul>`;
}

function renderGrade() {
  const groups = gradeGroups.map((group) => `<li class="grade-group-title">${escapeHtml(group.name)}</li>${group.rows.map(([name, count]) => {
    const checked = state.grades.has(name);
    return `<li><button class="option-row grade-row is-child" role="checkbox" aria-checked="${checked}" type="button" data-grade="${escapeHtml(name)}">
      <span class="fake-checkbox">${icon("./assets/maker-model/icons/chotot-check.svg")}</span>
      <span class="grade-name">${escapeHtml(name)}</span><span class="option-count">${formatCount(count)}</span>
    </button></li>`;
  }).join("")}`).join("");
  return `<div class="path-copy"><span>${escapeHtml(state.maker?.name || "벤츠")}</span><span>›</span><span>${escapeHtml(state.model?.name || "G클래스")}</span><span>›</span><span>${escapeHtml(state.generation?.name || "G클래스 W465")}</span><span>›</span><strong>등급</strong></div>
    <ul class="grade-list">${groups}</ul>`;
}

function renderOverview() {
  const rows = [
    ["제조사", state.maker?.name || "선택"],
    ["모델", state.model?.name || "선택"],
    ["세부모델", state.generation?.name || "선택"],
    ["등급", state.grades.size ? `${state.grades.size}개 선택` : "선택"],
  ];
  return `<div class="filter-overview">${rows.map(([label, value], index) => `<button class="filter-row" type="button" data-screen-target="${index + 1}"><strong>${label}</strong><span class="filter-value">${escapeHtml(value)}</span>${icon("./assets/maker-model/icons/chotot-chevron-right.svg", "chevron")}</button>`).join("")}</div>`;
}

function selectionValues() {
  const values = [];
  if (state.maker) values.push(state.maker.name);
  if (state.model) values.push(state.model.name);
  if (state.generation && state.generation.name !== "전체") values.push(state.generation.name);
  for (const grade of state.grades) values.push(grade);
  return values;
}

function updateSelections() {
  selectionStrip.innerHTML = selectionValues().map((value) => `<span class="selection-chip">${escapeHtml(value)}</span>`).join("");
  document.querySelector("#apply-button").textContent = state.grades.size ? `${formatCount(Math.max(12, 1096 - state.grades.size * 137))}대 보기` : "198,208대 보기";
}

function render() {
  const titles = ["필터", "제조사", "모델", "세부모델", "등급"];
  title.textContent = titles[state.screen];
  body.innerHTML = [renderOverview, renderMaker, renderModel, renderGeneration, renderGrade][state.screen]();
  document.querySelector("#back-button").style.visibility = state.screen === 0 ? "hidden" : "visible";
  document.querySelectorAll("#screen-controls button").forEach((button) => button.classList.toggle("is-active", Number(button.dataset.screen) === state.screen));
  updateSelections();

  document.querySelector("#screen-search")?.addEventListener("input", (event) => {
    state.query = event.currentTarget.value;
    const selectionStart = event.currentTarget.selectionStart;
    render();
    const field = document.querySelector("#screen-search");
    field?.focus();
    field?.setSelectionRange(selectionStart, selectionStart);
  });
}

function setScreen(screen) {
  state.screen = Math.min(4, Math.max(0, Number(screen)));
  state.query = "";
  render();
  body.scrollTop = 0;
}

document.addEventListener("click", (event) => {
  const screenButton = event.target.closest("[data-screen], [data-screen-target]");
  if (screenButton) return setScreen(screenButton.dataset.screen ?? screenButton.dataset.screenTarget);

  const logoButton = event.target.closest("[data-logo]");
  if (logoButton) {
    state.logo = logoButton.dataset.logo;
    phone.dataset.logoSize = state.logo;
    document.querySelectorAll("#logo-controls button").forEach((button) => button.classList.toggle("is-active", button === logoButton));
    return;
  }

  const makerButton = event.target.closest("[data-select-maker]");
  if (makerButton) {
    state.maker = makers.find((maker) => maker.name === makerButton.dataset.selectMaker);
    state.model = null; state.generation = null; state.grades.clear();
    return setScreen(2);
  }

  const modelButton = event.target.closest("[data-select-model]");
  if (modelButton) {
    state.maker ||= makers.find((maker) => maker.name === "벤츠");
    state.model = models.find((model) => model.name === modelButton.dataset.selectModel);
    state.generation = null; state.grades.clear();
    return setScreen(3);
  }

  const generationButton = event.target.closest("[data-select-generation]");
  if (generationButton) {
    state.maker ||= makers.find((maker) => maker.name === "벤츠");
    state.model ||= models.find((model) => model.name === "G클래스");
    state.generation = generationButton.dataset.selectGeneration === "all"
      ? { name: "전체" }
      : generations.find((generation) => generation.name === generationButton.dataset.selectGeneration);
    state.grades.clear();
    return setScreen(4);
  }

  const gradeButton = event.target.closest("[data-grade]");
  if (gradeButton) {
    const grade = gradeButton.dataset.grade;
    state.grades.has(grade) ? state.grades.delete(grade) : state.grades.add(grade);
    return render();
  }

  const tabButton = event.target.closest("[data-model-tab]");
  if (tabButton) { state.modelTab = tabButton.dataset.modelTab; return render(); }

  const indexButton = event.target.closest("[data-index]");
  if (indexButton) {
    const target = [...document.querySelectorAll(".model-copy strong")].find((node) => node.textContent.startsWith(indexButton.dataset.index));
    target?.closest("li")?.scrollIntoView({ block: "start" });
  }
});

document.querySelector("#back-button").addEventListener("click", () => setScreen(state.screen - 1));
document.querySelector("#close-button").addEventListener("click", () => setScreen(0));
document.querySelector("#reset-button").addEventListener("click", () => {
  state.maker = null; state.model = null; state.generation = null; state.grades.clear(); state.query = "";
  setScreen(1);
});

render();
