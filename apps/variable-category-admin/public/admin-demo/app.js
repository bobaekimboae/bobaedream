const vehicleTypes = [
  { code: "CAR", name: "중고차", namespace: "VEHICLE_TYPE", icon: "directions_car", phase: "P1_LAUNCH", category: "done", placement: "done", filter: "done", registration: "done", list: "done", detail: "done", option: "hold", seller: "done", product: "done", makers: "done", qa: "done", platform: "done", release: "current" },
  { code: "BIKE", name: "바이크", namespace: "VEHICLE_TYPE", icon: "two_wheeler", phase: "P1_LAUNCH", category: "done", placement: "done", filter: "done", registration: "done", list: "done", detail: "done", option: "done", seller: "done", product: "done", makers: "done", qa: "done", platform: "done", release: "current" },
  { code: "TRUCK_SPECIAL", name: "트럭·특장", namespace: "VEHICLE_TYPE", icon: "local_shipping", phase: "P1_LAUNCH", category: "done", placement: "done", filter: "done", registration: "done", list: "done", detail: "done", option: "done", seller: "done", product: "done", makers: "done", qa: "review", platform: "done", release: "candidate" },
  { code: "BUS", name: "버스", namespace: "VEHICLE_TYPE", icon: "directions_bus", phase: "P1_LAUNCH", category: "done", placement: "done", filter: "done", registration: "done", list: "done", detail: "done", option: "done", seller: "done", product: "done", makers: "done", qa: "done", platform: "done", release: "current" },
  { code: "CAMPING_CARAVAN", name: "캠핑카·카라반", namespace: "VEHICLE_TYPE", icon: "airport_shuttle", phase: "P1_LAUNCH", category: "done", placement: "done", filter: "done", registration: "done", list: "done", detail: "done", option: "done", seller: "done", product: "done", makers: "done", qa: "review", platform: "done", release: "candidate" },
  { code: "CONSTRUCTION", name: "건설기계", namespace: "VEHICLE_TYPE", icon: "construction", phase: "P1_LAUNCH", category: "done", placement: "done", filter: "done", registration: "done", list: "done", detail: "done", option: "done", seller: "done", product: "done", makers: "done", qa: "done", platform: "review", release: "current" },
  { code: "MATERIAL_HANDLING", name: "자재운반장비", namespace: "VEHICLE_TYPE", icon: "forklift", phase: "P1_LAUNCH", category: "done", placement: "done", filter: "done", registration: "done", list: "done", detail: "done", option: "hold", seller: "done", product: "done", makers: "done", qa: "review", platform: "done", release: "candidate" },
  { code: "ATTACHMENT", name: "어태치먼트", namespace: "ASSET_TYPE", icon: "construction", phase: "P1_LAUNCH", category: "done", placement: "done", filter: "done", registration: "done", list: "done", detail: "done", option: "hold", seller: "done", product: "done", makers: "done", qa: "done", platform: "done", release: "current" },
  { code: "PARTS_GOODS", name: "부품·용품", namespace: "ASSET_TYPE", icon: "settings", phase: "P1_LAUNCH", category: "done", placement: "done", filter: "done", registration: "done", list: "done", detail: "done", option: "hold", seller: "done", product: "done", makers: "done", qa: "done", platform: "done", release: "current" }
];

const policyKeys = ["filter", "registration", "list", "detail", "option", "seller", "product", "makers", "qa", "platform"];
const requiredPolicyKeys = ["filter", "registration", "list", "detail", "seller"];
const stateMeta = {
  done: { icon: "check_circle", label: "완료" },
  review: { icon: "warning", label: "검수" },
  missing: { icon: "cancel", label: "누락" },
  hold: { icon: "pause_circle", label: "보류" }
};

const queueRows = [
  ["mid", "주의", "트럭·특장 QA 체크리스트 승인 대기", "TRUCK_SPECIAL", "1,248건", "박서윤", "오늘", "QA 승인"],
  ["mid", "주의", "캠핑카 플랫폼별 상세 노출 검수", "CAMPING_CARAVAN", "386건", "이현우", "오늘", "플랫폼 확인"],
  ["low", "정보", "자재운반장비 지게차 양쪽 노출 검수", "MATERIAL_HANDLING", "729건", "정하늘", "내일", "배치 확인"],
  ["mid", "주의", "Legacy 카테고리 매핑 3건 불일치", "CAR 외 2", "12,842건", "오민재", "오늘", "매핑 확인"],
  ["low", "정보", "릴리스 v1.1.0 사전 스모크 준비", "9개 유형·자산", "14,205건", "김태민", "내일", "체크리스트"]
];

const issueRows = [
  ["warning", "P1", "QA_REVIEW", "트럭·특장 개발 완료 판정 체크리스트가 QA 승인을 기다립니다.", "TRUCK_SPECIAL", "박서윤", "오늘", "검수 대기"],
  ["warning", "P1", "PLATFORM_DIFF", "캠핑카 모바일 상세 노출 순서 검수가 필요합니다.", "CAMPING_CARAVAN", "이현우", "오늘", "검수 대기"],
  ["info", "P2", "DUAL_PLACEMENT", "지게차가 건설기계와 자재운반장비 양쪽에 노출되는지 확인합니다.", "MATERIAL_HANDLING", "정하늘", "내일", "예정"],
  ["warning", "P1", "MAPPING_MISMATCH", "기존 category_id 매핑 결과가 계약과 다릅니다.", "Legacy Adapter · 3건", "오민재", "오늘", "원인 분석"],
  ["info", "P2", "RELEASE_READY", "v1.1.0 후보 번들의 사전 스모크를 준비합니다.", "9개 유형·자산", "김태민", "내일", "예정"]
];

const categoryTrees = {
  CAR: [
    [0, "중고차", "CAR_ROOT", false], [1, "국산차", "CAR_DOMESTIC", false], [2, "승용차", "CAR_DOMESTIC_SEDAN", true], [2, "SUV·RV", "CAR_DOMESTIC_SUV", true], [1, "수입차", "CAR_IMPORTED", false], [2, "유럽", "CAR_IMPORTED_EU", true], [2, "미국·일본", "CAR_IMPORTED_ETC", true]
  ],
  BIKE: [
    [0, "바이크", "BIKE_ROOT", false], [1, "온로드", "BIKE_ONROAD", false], [2, "스쿠터", "BIKE_SCOOTER", true], [2, "네이키드", "BIKE_NAKED", true], [1, "오프로드", "BIKE_OFFROAD", false], [2, "엔듀로", "BIKE_ENDURO", true], [1, "ATV", "BIKE_ATV", true]
  ],
  TRUCK_SPECIAL: [
    [0, "트럭·특장", "TRUCK_ROOT", false], [1, "화물", "TRUCK_CARGO", false], [2, "카고", "TRUCK_CARGO_FLAT", true], [2, "윙바디", "TRUCK_CARGO_WING", true], [1, "특장", "TRUCK_SPECIAL", false], [2, "냉동탑", "TRUCK_COLD", true], [2, "크레인", "TRUCK_CRANE", true]
  ],
  BUS: [
    [0, "버스", "BUS_ROOT", false], [1, "시내·마을버스", "BUS_CITY", true], [1, "전세·관광버스", "BUS_COACH", true], [1, "미니버스", "BUS_MINI", true]
  ],
  CAMPING_CARAVAN: [
    [0, "캠핑카·카라반", "CAMPING_ROOT", false], [1, "캠핑카", "MOTORHOME", true], [1, "카라반", "CARAVAN", true], [1, "트레일러형", "CAMPING_TRAILER", true]
  ],
  CONSTRUCTION: [
    [0, "건설기계", "CONSTRUCTION_ROOT", false], [1, "굴착기", "EXCAVATOR", true], [1, "로더", "LOADER", true], [1, "지게차 함께 노출", "FORKLIFT_CROSS_PLACEMENT", true], [1, "어태치먼트", "ATTACHMENT_CROSS_PLACEMENT", true]
  ],
  MATERIAL_HANDLING: [
    [0, "자재운반장비", "MATERIAL_HANDLING_ROOT", false], [1, "지게차", "FORKLIFT", true], [1, "고소작업대", "AERIAL_PLATFORM", true], [1, "팔레트 장비", "PALLET_EQUIPMENT", true]
  ],
  ATTACHMENT: [
    [0, "어태치먼트", "ATTACHMENT_ROOT", false], [1, "굴착기 어태치먼트", "EXCAVATOR_ATTACHMENT", true], [1, "버킷", "BUCKET", true], [1, "브레이커", "BREAKER", true]
  ],
  PARTS_GOODS: [
    [0, "부품·용품", "PARTS_ROOT", false], [1, "자동차 부품", "CAR_PARTS", true], [1, "바이크 부품", "BIKE_PARTS", true], [1, "트럭·버스 부품", "TRUCK_BUS_PARTS", true], [1, "건설기계 부품", "CONSTRUCTION_PARTS", true], [1, "캠핑카 용품", "CAMPING_GOODS", true]
  ]
};

const fields = [
  ["car.make_id", "제조사", "REFERENCE", "CASCADE_SELECT", "REQUIRED", "중고차", "success", "PUBLISHED"],
  ["car.fuel_type", "연료·동력", "ENUM", "SELECT", "REQUIRED", "중고차", "success", "PUBLISHED"],
  ["bike.engine_cc", "배기량", "INTEGER", "UNIT_INPUT", "REQUIRED", "바이크", "success", "PUBLISHED"],
  ["truck.payload_kg", "적재중량", "INTEGER", "UNIT_INPUT", "REQUIRED", "트럭·특장", "success", "PUBLISHED"],
  ["construction.operating_hours", "사용시간", "INTEGER", "UNIT_INPUT", "CONDITIONAL", "건설기계", "warning", "QA REVIEW"],
  ["parts_goods.oem_number", "OEM 번호", "STRING", "TEXT_INPUT", "OPTIONAL", "부품·용품", "success", "PUBLISHED"]
];

const schemas = [
  ["중고차", "FILTER", "WEB", "v18", "24", "success", "PUBLISHED", "09-21 18:20"],
  ["중고차", "REGISTRATION_FORM", "ADMIN", "v12", "41", "success", "PUBLISHED", "09-21 17:12"],
  ["바이크", "OPTION", "ALL", "v4", "2", "success", "PUBLISHED", "09-22 09:10"],
  ["트럭·특장", "QA_CHECKLIST", "ADMIN", "v1", "8", "warning", "QA_REVIEW", "09-22 09:40"],
  ["캠핑카·카라반", "PLATFORM_DIFF", "ALL", "v1", "3", "warning", "QA_REVIEW", "09-22 08:21"],
  ["부품·용품", "MAKE_MODEL", "ADMIN", "v5", "3", "success", "PUBLISHED", "09-21 13:02"]
];

const releaseDiff = [
  ["FIELD", "car.fuel_type", "ENUM에 수소 코드값 추가", "12,842", "통과", "김태민", "warning", "중간"],
  ["SCHEMA", "truck.filter.web", "축간거리 필터 추가", "914", "통과", "박서윤", "success", "낮음"],
  ["POLICY", "bike.private_seller", "개인 판매자 일일 등록 3건", "2,301", "검수", "이현우", "warning", "중간"],
  ["RULE", "legacy.category.422", "수입 승용 매핑 우선순위 변경", "147", "통과", "오민재", "danger", "높음"],
  ["SCHEMA", "camping.detail.app", "침상 수·인승 정보 노출", "386", "통과", "정하늘", "success", "낮음"]
];

const mappings = [
  ["legacy.category_id", "listing.category_id", "success", "정상"],
  ["legacy.car_type", "listing.vehicle_type", "success", "정상"],
  ["legacy.seller_no", "listing.seller_id", "success", "정상"],
  ["legacy.fuel_cd", "attributes.car.fuel_type", "warning", "3건 불일치"],
  ["legacy.ad_status", "listing.status", "success", "정상"]
];

const auditEvents = [
  ["2026-09-22 10:12:44", "QA_APPROVE", "정하늘이 truck.filter.web v7을 승인했습니다.", "hash 7f42…9a1c"],
  ["2026-09-22 09:41:08", "SCHEMA_UPDATE", "박서윤이 축간거리 필터 조건을 변경했습니다.", "hash d42b…771e"],
  ["2026-09-21 18:20:17", "PUBLISH", "김태민이 Release Bundle v1.0.0을 배포했습니다.", "hash b117…a85d"],
  ["2026-09-21 17:56:33", "SMOKE_PASS", "시스템이 사전 스모크 42개 시나리오를 통과했습니다.", "hash 3c70…581f"],
  ["2026-09-21 16:42:19", "FIELD_UPDATE", "김태민이 car.fuel_type 선택지를 변경했습니다.", "hash f81e…42d0"]
];

let selectedType = vehicleTypes[0];
let inspectorTab = "inheritance";
let summaryFilter = "all";

function stateCell(state) {
  const meta = stateMeta[state];
  return `<span class="matrix-state ${state}" title="${meta.label}"><span class="material-symbols-rounded">${meta.icon}</span>${meta.label}</span>`;
}

function badge(tone, label) {
  return `<span class="state-badge ${tone}">${label}</span>`;
}

function showView(viewId) {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === viewId));
  document.body.classList.remove("sidebar-open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderMatrix() {
  const query = document.querySelector("#matrix-search").value.trim().toLowerCase();
  const status = document.querySelector("#matrix-status").value;
  const phase = document.querySelector("#matrix-phase").value;
  const rows = vehicleTypes.filter((item) => {
    const states = policyKeys.map((key) => item[key]);
    const queryMatch = `${item.name} ${item.code}`.toLowerCase().includes(query);
    const requiredStates = requiredPolicyKeys.map((key) => item[key]);
    const statusMatch = status === "all" || (status === "missing" && states.includes("missing")) || (status === "review" && states.includes("review")) || (status === "ready" && requiredStates.every((value) => value === "done"));
    const blockedCodes = vehicleTypes.filter((item) => item.qa === "review" || item.platform === "review").map((item) => item.code);
    const summaryMatch = summaryFilter === "all" || (summaryFilter === "missing" && states.includes("missing")) || (summaryFilter === "review" && states.includes("review")) || (summaryFilter === "blocked" && blockedCodes.includes(item.code));
    return queryMatch && statusMatch && summaryMatch && (phase === "all" || item.phase === phase);
  });

  document.querySelector("#matrix-body").innerHTML = rows.map((item) => `
    <tr data-type="${item.code}" class="${item.code === selectedType.code ? "selected" : ""}" tabindex="0">
      <td class="sticky-col"><div class="type-cell"><span class="type-icon"><span class="material-symbols-rounded">${item.icon}</span></span><span><strong>${item.name}</strong><small>${item.code}</small></span></div></td>
      ${policyKeys.map((key) => `<td>${stateCell(item[key])}</td>`).join("")}
      <td><span class="release-tag ${item.release === "current" ? "current" : ""}">${item.release}</span></td>
    </tr>`).join("") || `<tr><td colspan="12"><div class="empty-state"><span class="material-symbols-rounded">search_off</span>조건에 맞는 차량유형이 없습니다.</div></td></tr>`;

  document.querySelector("#matrix-count").textContent = `(${rows.length})`;
  document.querySelector("#matrix-result-count").textContent = `총 ${rows.length}개 유형·자산`;
  document.querySelectorAll("#matrix-body tr[data-type]").forEach((row) => {
    const select = () => {
      selectedType = vehicleTypes.find((item) => item.code === row.dataset.type);
      inspectorTab = "inheritance";
      renderMatrix();
      renderInspector();
    };
    row.addEventListener("click", select);
    row.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") select(); });
  });
}

function selectedGaps() {
  const label = { filter: "필터", registration: "등록폼", list: "목록", detail: "상세", option: "옵션", seller: "판매자", product: "유료상품", makers: "제조사·모델", qa: "QA", platform: "플랫폼차이" };
  return policyKeys.filter((key) => ["missing", "review"].includes(selectedType[key])).map((key) => ({ key, label: label[key], state: selectedType[key] }));
}

function renderInspector() {
  document.querySelector("#inspector-name").textContent = selectedType.name;
  document.querySelector("#inspector-code").textContent = `${selectedType.namespace} · ${selectedType.code}`;
  document.querySelector("#inspector-phase").textContent = selectedType.phase;
  document.querySelector("#inspector-icon").textContent = selectedType.icon;
  const gaps = selectedGaps();
  document.querySelector("#gap-count").textContent = gaps.length;
  document.querySelectorAll("[data-inspector-tab]").forEach((button) => button.classList.toggle("active", button.dataset.inspectorTab === inspectorTab));
  const target = document.querySelector("#inspector-content");

  if (inspectorTab === "inheritance") {
    const layers = [
      ["G", "GLOBAL", "전역 기본 정책", "v1.0"],
      ["V", "VEHICLE_TYPE", selectedType.name, "v8"],
      ["C", "CATEGORY_NODE", "대표 카테고리", "v5"],
      ["P", "PLACEMENT", "WEB / 기본 배치", "v3"],
      ["S", "SELLER", "DEALER 우선 정책", "v4"],
      ["L", "PLATFORM", "WEB", "v6"]
    ];
    target.innerHTML = `<div class="inherit-title">위에서 아래 순서로 덮어쓰기</div><ol class="inheritance-ladder">${layers.map((layer) => `<li><span class="step">${layer[0]}</span><span><strong>${layer[1]}</strong><small>${layer[2]}</small></span><em>${layer[3]}</em></li>`).join("")}</ol>`;
  } else if (inspectorTab === "gaps") {
    target.innerHTML = gaps.length ? `<div class="gap-list">${gaps.map((gap) => `<article class="gap-card ${gap.state}"><strong>${gap.label} · ${stateMeta[gap.state].label}</strong><small>${gap.state === "missing" ? "발행 전에 새 정의 또는 상속 규칙이 필요합니다." : "후보 버전이 QA 승인을 기다리고 있습니다."}</small></article>`).join("")}</div>` : `<div class="empty-state"><span class="material-symbols-rounded">verified</span>검수 또는 누락 항목이 없습니다.</div>`;
  } else {
    target.innerHTML = `<div class="history-list"><article class="history-card"><strong>상품 정책 검수 요청</strong><small>김태민 · 오늘 10:12 · candidate v1.1.0</small></article><article class="history-card"><strong>상세 스키마 필드 순서 변경</strong><small>박서윤 · 어제 16:42 · draft v9</small></article><article class="history-card"><strong>카테고리 배치 발행</strong><small>시스템 · 09-20 11:04 · current v1.0.0</small></article></div>`;
  }
}

function renderTypes() {
  const query = document.querySelector("#type-search").value.trim().toLowerCase();
  const rows = vehicleTypes.filter((item) => `${item.name} ${item.code}`.toLowerCase().includes(query));
  document.querySelector("#types-body").innerHTML = rows.map((item, index) => `<tr><td>${String(index + 1).padStart(2, "0")}</td><td><code>${item.code}</code></td><td><strong>${item.name}</strong></td><td>${item.namespace}</td><td>${6 + (index % 7)}개</td><td>${badge("success", item.phase)}</td><td>${badge("success", "ACTIVE")}</td></tr>`).join("");
}

function renderCategoryTree(code = "CAR") {
  const tree = categoryTrees[code] || categoryTrees.CAR;
  document.querySelector("#category-tree").innerHTML = tree.map((node, index) => `<button class="tree-row depth-${node[0]} ${index === 0 ? "active" : ""}" data-node="${node[2]}" data-name="${node[1]}" data-depth="${node[0]}" data-leaf="${node[3]}"><span class="material-symbols-rounded">${node[3] ? "sell" : "folder"}</span><strong>${node[1]}</strong><code>${node[2]}</code></button>`).join("");
  document.querySelectorAll(".tree-row").forEach((row) => row.addEventListener("click", () => {
    document.querySelectorAll(".tree-row").forEach((item) => item.classList.remove("active"));
    row.classList.add("active");
    document.querySelector("#node-title").textContent = row.dataset.name;
    document.querySelector("#node-key").value = row.dataset.node;
    document.querySelector("#node-name").value = row.dataset.name;
    document.querySelector("#node-depth").value = row.dataset.depth;
    document.querySelector("#node-leaf").value = row.dataset.leaf === "true" ? "YES" : "NO";
  }));
  document.querySelector(".tree-row")?.click();
}

function renderStaticTables() {
  document.querySelector("#operations-queue").innerHTML = queueRows.map((row) => `<tr><td><span class="priority ${row[0]}"><span class="material-symbols-rounded">${row[0] === "high" ? "error" : row[0] === "mid" ? "warning" : "info"}</span>${row[1]}</span></td><td><strong>${row[2]}</strong></td><td><code>${row[3]}</code></td><td>${row[4]}</td><td>${row[5]}</td><td>${row[6]}</td><td><button class="row-action demo-action">${row[7]}</button></td></tr>`).join("");
  document.querySelector("#issues-body").innerHTML = issueRows.map((row) => `<tr><td>${badge(row[0], row[1])}</td><td><code>${row[2]}</code></td><td><strong>${row[3]}</strong></td><td>${row[4]}</td><td>${row[5]}</td><td>${row[6]}</td><td>${row[7]}</td></tr>`).join("");
  document.querySelector("#fields-body").innerHTML = fields.map((row) => `<tr><td><code>${row[0]}</code></td><td><strong>${row[1]}</strong></td><td>${row[2]}</td><td>${row[3]}</td><td>${row[4]}</td><td>${row[5]}</td><td>${badge(row[6], row[7])}</td></tr>`).join("");
  document.querySelector("#schemas-body").innerHTML = schemas.map((row) => `<tr><td><strong>${row[0]}</strong></td><td><code>${row[1]}</code></td><td>${row[2]}</td><td>${row[3]}</td><td>${row[4]}개</td><td>${badge(row[5], row[6])}</td><td>${row[7]}</td><td><button class="row-action demo-action">상세</button></td></tr>`).join("");
  document.querySelector("#release-diff").innerHTML = releaseDiff.map((row) => `<tr><td><code>${row[0]}</code></td><td><strong>${row[1]}</strong></td><td>${row[2]}</td><td>${row[3]}건</td><td>${row[4]}</td><td>${row[5]}</td><td>${badge(row[6], row[7])}</td></tr>`).join("");
  document.querySelector("#mapping-list").innerHTML = mappings.map((row) => `<div class="mapping-row"><code>${row[0]}</code><span class="material-symbols-rounded">arrow_forward</span><code>${row[1]}</code>${badge(row[2], row[3])}</div>`).join("");
  document.querySelector("#audit-list").innerHTML = auditEvents.map((row) => `<article class="timeline-item"><span class="material-symbols-rounded">verified</span><time>${row[0]}</time><div><strong>${row[1]}</strong><small>${row[2]}</small></div><code>${row[3]}</code></article>`).join("");
}

function renderResolver() {
  const legacy = document.querySelector("#legacy-category").value;
  const map = {
    CAR_IMPORTED: ["CAR", "CAR_IMPORTED_EU", "R-CAR-014", "98.7%"],
    TRUCK_CARGO: ["TRUCK_SPECIAL", "TRUCK_CARGO_FLAT", "R-TRUCK-007", "97.4%"],
    BIKE_SCOOTER: ["BIKE", "BIKE_SCOOTER", "R-BIKE-003", "99.2%"]
  }[legacy];
  document.querySelector("#resolver-result").innerHTML = `<div class="result-stack"><div class="result-main"><small>resolved_vehicle_type</small><strong>${map[0]}</strong><code>category_node · ${map[1]}</code></div><div class="evidence-list"><div><span>적용 규칙</span><strong>${map[2]}</strong></div><div><span>정책 버전</span><strong>current v1.0.0</strong></div><div><span>신뢰도</span><strong>${map[3]}</strong></div><div><span>상속 경로</span><strong>GLOBAL → TYPE → CATEGORY</strong></div><div><span>처리 모드</span><strong>READ_ONLY SHADOW</strong></div></div></div>`;
}

function openDemo(title = "공개 데모 안내", text = "실제 변경은 로그인된 운영 관리자에서만 수행됩니다.") {
  document.querySelector("#dialog-title").textContent = title;
  document.querySelector("#dialog-text").textContent = text;
  document.querySelector("#demo-dialog").showModal();
}

document.querySelectorAll(".nav-item").forEach((item) => item.addEventListener("click", () => showView(item.dataset.view)));
document.querySelectorAll("[data-view-jump]").forEach((item) => item.addEventListener("click", () => showView(item.dataset.viewJump)));
document.querySelector("#mobile-menu").addEventListener("click", () => document.body.classList.add("sidebar-open"));
document.querySelector("#mobile-close").addEventListener("click", () => document.body.classList.remove("sidebar-open"));
document.querySelector("#mobile-overlay").addEventListener("click", () => document.body.classList.remove("sidebar-open"));

document.querySelectorAll("[data-summary]").forEach((button) => button.addEventListener("click", () => {
  summaryFilter = button.dataset.summary;
  document.querySelectorAll("[data-summary]").forEach((item) => item.classList.toggle("active", item === button));
  renderMatrix();
}));
["matrix-search", "matrix-status", "matrix-phase"].forEach((id) => document.querySelector(`#${id}`).addEventListener(id === "matrix-search" ? "input" : "change", renderMatrix));
document.querySelector("#type-search").addEventListener("input", renderTypes);
document.querySelectorAll("[data-inspector-tab]").forEach((button) => button.addEventListener("click", () => { inspectorTab = button.dataset.inspectorTab; renderInspector(); }));
document.querySelector("#inspector-close").addEventListener("click", () => document.querySelector(".inspector").scrollIntoView({ behavior: "smooth", block: "end" }));

const categorySelect = document.querySelector("#category-type");
categorySelect.innerHTML = Object.keys(categoryTrees).map((code) => `<option value="${code}">${vehicleTypes.find((item) => item.code === code).name}</option>`).join("");
categorySelect.addEventListener("change", () => renderCategoryTree(categorySelect.value));
document.querySelector("#run-resolver").addEventListener("click", renderResolver);
document.querySelector("#legacy-category").addEventListener("change", renderResolver);
document.querySelector("#role-select").addEventListener("change", (event) => openDemo("권한 미리보기", `${event.target.value} 권한으로 화면을 미리 봅니다. 공개 데모에서는 데이터 변경이 저장되지 않습니다.`));

document.querySelectorAll(".help-button").forEach((button) => button.addEventListener("click", () => openDemo("매트릭스 가이드", "행은 차량유형, 열은 운영 정책입니다. 완료·검수·누락 상태를 선택하면 오른쪽에서 상속 근거와 작업 대상을 확인할 수 있습니다.")));
document.querySelector("#add-type").addEventListener("click", () => openDemo("차량유형 추가", "실서버에서는 안정된 시스템 키, 네임스페이스, 출시 단계 입력 후 승인 워크플로가 시작됩니다."));
document.querySelector("#edit-schema").addEventListener("click", () => openDemo("스키마 편집", `${selectedType.name}의 현재 Published 정의는 직접 수정하지 않습니다. 새 Draft 버전을 생성해 검수합니다.`));
document.querySelector("#new-schema").addEventListener("click", () => openDemo("Draft 생성", "새 스키마 버전을 만든 뒤 자동 검증 → QA 승인 → Release Bundle 순서로 배포합니다."));
document.querySelector("#qa-approve").addEventListener("click", () => openDemo("QA 승인", "실제 승인에는 QA_REVIEWER 권한과 사유 기록이 필요하며 감사 로그에 영구 저장됩니다."));
document.querySelectorAll(".view button.primary:not(#run-resolver), .demo-action").forEach((button) => {
  if (!["add-type", "edit-schema", "new-schema", "qa-approve"].includes(button.id) && !button.dataset.viewJump) button.addEventListener("click", () => openDemo());
});

document.querySelectorAll(".queue-filters").forEach((group) => group.querySelectorAll(".chip").forEach((chip) => chip.addEventListener("click", () => {
  group.querySelectorAll(".chip").forEach((item) => item.classList.toggle("active", item === chip));
})));

renderStaticTables();
renderTypes();
renderCategoryTree();
renderMatrix();
renderInspector();
renderResolver();
