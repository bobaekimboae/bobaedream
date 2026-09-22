import { createDemoApi } from "./demo-api.js";
import { createAdminApi, resolveRuntimeConfig } from "./runtime.js";

const configuredMode = document.querySelector('meta[name="boba-admin-runtime"]')?.content || "AUTO";
const configuredApiBase = document.querySelector('meta[name="boba-admin-api-base"]')?.content || "";
const runtime = resolveRuntimeConfig({
  hostname: location.hostname,
  origin: location.origin,
  configuredMode,
  apiBase: configuredApiBase,
});
const demoApi = createDemoApi();
const state = {
  page: "dashboard",
  role: runtime.isDemo || runtime.isLocalDevelopment
    ? localStorage.getItem("boba-admin-role") || "SUPER_ADMIN"
    : "SERVER_SESSION",
  registry: [], categories: [], variables: [], schemas: [], makes: [], models: [], dashboard: null,
  matrix: null, matrixScope: null, matrixSchemaType: "FILTER",
};
const api = createAdminApi({ runtime, demoApi, fetchImpl: fetch, roleProvider: () => state.role });
const schemaLabels = {
  FILTER: "필터",
  REGISTRATION_FORM: "등록폼",
  LIST_META: "리스트",
  DETAIL: "상세",
  OPTION: "옵션",
  SELLER: "판매자",
  PAID_PRODUCT: "유료상품",
  MAKE_MODEL: "제조사·모델",
  QA_CHECKLIST: "QA",
  PLATFORM_DIFF: "플랫폼차이",
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
})[character]);
const badge = (value) => `<span class="badge ${escapeHtml(value)}">${escapeHtml(value)}</span>`;
const operationLabel = (label) => runtime.isDemo ? `데모 ${label}` : label;

function toast(message, error = false) {
  const element = $("#toast");
  element.textContent = message;
  element.className = `toast show${error ? " error" : ""}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { element.className = "toast"; }, 2800);
}

function applyRuntimePresentation() {
  document.body.dataset.runtimeMode = runtime.mode;
  $("#runtimeModeLabel").textContent = runtime.mode;
  $("#apiHostLabel").textContent = runtime.isDemo ? "브라우저 localStorage" : runtime.apiBase;
  $("#runtimeBanner").hidden = false;
  $("#runtimeBanner").className = `runtime-banner ${runtime.mode.toLowerCase()}`;
  $("#runtimeBannerText").textContent = runtime.isDemo
    ? "공개 데모입니다. 변경값은 이 브라우저에만 저장되고 실제 운영 데이터에는 반영되지 않습니다."
    : `${runtime.mode}에 연결합니다. API 오류가 발생해도 데모 데이터로 전환하지 않습니다.`;

  const canChooseRole = runtime.isDemo || runtime.isLocalDevelopment;
  $("#roleSelector").hidden = !canChooseRole;
  $("#roleReadOnly").hidden = canChooseRole;
  $("#roleReadOnlyValue").textContent = canChooseRole ? state.role : "서버 인증 역할";
  $$("[data-demo-label]").forEach((element) => {
    element.textContent = runtime.isDemo ? element.dataset.demoLabel : element.dataset.liveLabel;
  });
}

function setPage(page) {
  state.page = page;
  $$("#navigation button").forEach((button) => button.classList.toggle("active", button.dataset.page === page));
  $$(".page").forEach((section) => section.classList.toggle("active", section.id === page));
  loadPage(page).catch((error) => toast(error.message, true));
}

async function checkHealth() {
  try {
    const result = await api("/api/admin/health");
    $("#health").textContent = runtime.isDemo ? "데모 정상" : "API 정상";
    $("#health").className = runtime.isDemo ? "health demo" : "health";
    if (!runtime.isDemo && result.actor_role) $("#roleReadOnlyValue").textContent = result.actor_role;
  } catch (error) {
    $("#health").textContent = "API 연결 실패";
    $("#health").className = "health error";
    $("#runtimeBannerText").textContent = `${error.message} 새로고침 전에 API 주소와 서버 상태를 확인하십시오.`;
    throw error;
  }
}

async function loadDashboard() {
  state.dashboard = await api("/api/admin/dashboard");
  const counts = state.dashboard.counts;
  const metrics = [
    ["운영 카테고리", counts.category_nodes, "category_nodes"],
    ["필드·필터 항목", counts.variable_items, "variable_items"],
    ["화면별 노출 규칙", counts.schemas, "독립 배포 단위"],
    ["제조사·모델", counts.manufacturers + counts.models, `${counts.manufacturers}개 제조사 / ${counts.models}개 모델`],
    ["유형·분류 코드", counts.registry_items, "namespace 분리"],
    ["메뉴 노출", counts.category_placements, "placement 기준 API"],
    ["검색 Projection", counts.listing_read_models, "기존 매물 연동"],
    ["출처 누락", state.dashboard.missing_reference_count, "배포 차단 대상"],
  ];
  $("#metricGrid").innerHTML = metrics.map(([label, value, note]) => `<article class="metric-card"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
  $("#workflowChart").innerHTML = state.dashboard.workflow.map((row) => `<div class="status-row"><span>${badge(row.status)}</span><b>${row.count}</b></div>`).join("") || "<span>스키마 없음</span>";
  $("#recentPublishes").innerHTML = state.dashboard.recent_publishes.map((row) => `<div class="compact-row"><div><b>${escapeHtml(row.target_key)} · ${escapeHtml(row.schema_type)}</b><small>${escapeHtml(row.platform)} / v${escapeHtml(row.schema_version)}</small></div>${badge(row.is_active ? "ACTIVE" : "SUPERSEDED")}</div>`).join("");
}

function findMatrixScope() {
  return state.matrix?.scopes.find((scope) => scope.scope_key === state.matrixScope) || state.matrix?.scopes[0];
}

function findMatrixSchema(scope) {
  return scope?.schemas.find((schema) => schema.schema_type === state.matrixSchemaType) || scope?.schemas.find((schema) => (schema.item_count || 0) > 0) || scope?.schemas[0];
}

async function loadMatrix() {
  state.matrix = await api("/api/admin/variable-matrix");
  if (!state.matrixScope || !state.matrix.scopes.some((scope) => scope.scope_key === state.matrixScope)) state.matrixScope = state.matrix.scopes[0]?.scope_key || null;
  const scopes = state.matrix.scopes;
  const complete = scopes.filter((scope) => scope.completeness_percent === 100).length;
  const fields = scopes.reduce((sum, scope) => sum + scope.field_count, 0);
  const published = scopes.reduce((sum, scope) => sum + scope.published_count, 0);
  const requiredCount = scopes[0]?.required_schema_types?.length || 5;
  $("#matrixMetrics").innerHTML = [
    ["관리 유형", scopes.length, "차량유형 + 자산유형"],
    ["전체 필드", fields, "실제 화면 항목"],
    ["배포 스키마", published, "Published 단위"],
    ["완료 유형", complete, `필수 ${requiredCount}개 스키마 기준`],
  ].map(([label, value, note]) => `<article class="metric-card"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
  $("#matrixScopeTabs").innerHTML = scopes.map((scope) => `<button class="${scope.scope_key === state.matrixScope ? "active" : ""}" data-matrix-scope="${scope.scope_key}"><b>${escapeHtml(scope.name_ko)}</b><small>${escapeHtml(scope.scope_key)}</small></button>`).join("");
  const columns = state.matrix.schema_types || Object.keys(schemaLabels);
  $("#matrixRows").innerHTML = scopes.map((scope) => {
    const missingRequired = scope.missing_required_schema_types || [];
    const status = missingRequired.length === 0 ? "READY" : "CHECK";
    return `<tr class="${scope.scope_key === state.matrixScope ? "selected" : ""}" data-matrix-row="${scope.scope_key}"><td><b>${escapeHtml(scope.name_ko)}</b><small>${escapeHtml(scope.scope_key)} · ${escapeHtml(scope.namespace)}</small></td>${columns.map((type) => `<td><button class="count-button" title="${escapeHtml(schemaLabels[type] || type)}" data-matrix-cell="${scope.scope_key}" data-schema-type="${type}">${scope.schema_counts[type] || 0}</button></td>`).join("")}<td>${badge(status)}<small>${missingRequired.length ? escapeHtml(missingRequired.join(", ")) : "필수 충족"}</small></td></tr>`;
  }).join("");
  renderMatrixDetail();
}

function renderMatrixDetail() {
  const scope = findMatrixScope();
  const schema = findMatrixSchema(scope);
  if (!scope || !schema) {
    $("#matrixDetailTitle").textContent = "선택 유형 없음";
    $("#matrixFieldRows").innerHTML = '<tr><td colspan="5">표시할 데이터가 없습니다.</td></tr>';
    return;
  }
  $("#matrixDetailTitle").textContent = `${scope.name_ko} · ${scope.scope_key}`;
  const isRequired = (scope.required_schema_types || []).includes(schema.schema_type);
  $("#matrixDetailStatus").textContent = `${schemaLabels[schema.schema_type] || schema.schema_type} / ${schema.platform || "-"} / ${schema.item_count || 0}개 항목 / ${isRequired ? "필수" : "선택"}`;
  $("#matrixSchemaTabs").innerHTML = scope.schemas.map((item) => `<button class="${item.schema_type === state.matrixSchemaType ? "active" : ""}" data-matrix-schema-type="${item.schema_type}">${escapeHtml(schemaLabels[item.schema_type] || item.schema_type)}<b>${item.item_count || 0}</b></button>`).join("");
  $("#matrixFieldRows").innerHTML = (schema.items || []).map((item, index) => `<tr><td>${index + 1}</td><td><b>${escapeHtml(item.screen_label || item.item_name_ko)}</b><small>${escapeHtml(item.variable_group || item.section_key || "")}</small></td><td><code>${escapeHtml(item.item_key)}</code></td><td>${escapeHtml(item.ui_component)}<small>${escapeHtml(item.data_type)}${item.unit ? ` · ${escapeHtml(item.unit)}` : ""}</small></td><td>${escapeHtml(item.required_level || "OPTIONAL")}</td></tr>`).join("") || '<tr><td colspan="5">이 화면 스키마에 연결된 항목이 없습니다.</td></tr>';
  $$("#matrixRows tr").forEach((row) => row.classList.toggle("selected", row.dataset.matrixRow === scope.scope_key));
  $$("#matrixScopeTabs button").forEach((button) => button.classList.toggle("active", button.dataset.matrixScope === scope.scope_key));
}

const namespaces = ["VEHICLE_TYPE", "ASSET_TYPE", "MENU_ALIAS", "OVERLAY", "THEME_OVERLAY", "TRANSACTION_TYPE", "SELLER_CHANNEL", "SERVICE_BM"];

async function loadRegistry() {
  state.registry = await api("/api/admin/registry");
  const selected = $("#registryNamespace").value;
  const search = $("#registrySearch").value.toLowerCase();
  const rows = state.registry.filter((row) => (!selected || row.namespace === selected) && (!search || `${row.system_key} ${row.name_ko}`.toLowerCase().includes(search)));
  $("#registryRows").innerHTML = rows.map((row) => `<tr><td><code>${escapeHtml(row.namespace)}</code></td><td><b>${escapeHtml(row.system_key)}</b></td><td>${escapeHtml(row.name_ko)}</td><td>${badge(row.launch_status)}</td><td>${badge(row.status)}</td><td><button class="text-button" data-archive-registry="${row.id}">${operationLabel("보관")}</button></td></tr>`).join("");
}

async function loadCategories() {
  state.categories = await api("/api/admin/categories");
  $("#categoryCards").innerHTML = state.categories.map((category) => `<article class="category-card ${category.depth > 1 ? "child" : ""}"><div class="category-top"><div><h3>${escapeHtml(category.category_name_ko)}</h3><code>${escapeHtml(category.category_node_key)}</code></div>${badge(category.status)}</div><p>${escapeHtml(category.listing_domain)} · ${escapeHtml(category.placement_key || "노출 위치 없음")} · ${category.registration_enabled ? "등록 가능" : "검색 전용"}</p><div class="bindings">${category.bindings.map((binding) => `<span class="binding">${escapeHtml(binding)}</span>`).join("") || '<span class="binding">바인딩 없음</span>'}</div></article>`).join("");
}

async function loadVariables() {
  state.variables = await api("/api/admin/variables");
  const scope = $("#variableScope").value;
  const search = $("#variableSearch").value.toLowerCase();
  const rows = state.variables.filter((variable) => (!scope || variable.item_key.startsWith(`${scope}.`)) && (!search || `${variable.item_key} ${variable.screen_label}`.toLowerCase().includes(search)));
  $("#variableRows").innerHTML = rows.map((variable) => `<tr><td><code>${escapeHtml(variable.item_key)}</code></td><td><b>${escapeHtml(variable.screen_label)}</b></td><td>${escapeHtml(variable.variable_group)}</td><td>${escapeHtml(variable.ui_component)}<small>${escapeHtml(variable.data_type)}${variable.unit ? ` · ${escapeHtml(variable.unit)}` : ""}</small></td><td><a href="${escapeHtml(variable.source_url)}" target="_blank" rel="noreferrer">${escapeHtml(variable.source_site)}</a></td><td>${badge(variable.status)}</td><td><button class="text-button" data-archive-variable="${variable.id}">${operationLabel("삭제·보관")}</button></td></tr>`).join("");
}

function nextActions(schema) {
  const actions = {
    DRAFT: [["검수 요청", "request-review"]],
    REVIEW_REQUESTED: [["QA 승인", "approve"]],
    QA_APPROVED: [["배포", "publish"]],
    PUBLISHED: [["롤백", "rollback"]],
  };
  return actions[schema.workflow_status] || [];
}

async function loadSchemas() {
  state.schemas = await api("/api/admin/schemas");
  $("#schemaCards").innerHTML = state.schemas.map((schema) => `<article class="schema-card"><div class="schema-head"><div><h3>${escapeHtml(schema.title)}</h3><small>${escapeHtml(schema.id)}</small></div>${badge(schema.workflow_status)}</div><div class="schema-meta"><div><span>종류</span><b>${escapeHtml(schema.schema_type)}</b></div><div><span>플랫폼</span><b>${escapeHtml(schema.platform)}</b></div><div><span>버전 / 항목</span><b>${escapeHtml(schema.schema_version)} · ${schema.item_count}</b></div></div><div class="schema-actions"><button data-schema-detail="${schema.id}">화면·JSON 보기</button>${nextActions(schema).map(([label, action]) => `<button data-schema-action="${action}" data-id="${schema.id}">${operationLabel(label)}</button>`).join("")}</div></article>`).join("");
  $("#cloneSchemaSelect").innerHTML = state.schemas.map((schema) => `<option value="${schema.id}">${escapeHtml(schema.title)} / ${escapeHtml(schema.schema_version)}</option>`).join("");
}

function renderSchemaPreview(data) {
  $("#schemaPreviewTitle").textContent = data.title || data.schema_type;
  $("#schemaPreviewMeta").innerHTML = [data.schema_type, data.platform, `v${data.schema_version}`, data.workflow_status || data.status].map(badge).join("");
  const groups = new Map();
  for (const item of data.items || []) {
    const key = item.section_key || item.variable_group || "ADDITIONAL";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  $("#schemaScreenPreview").innerHTML = [...groups.entries()].map(([section, items]) => `<section class="preview-section"><h3>${escapeHtml(section)}</h3>${items.map((item) => `<div class="preview-field"><div><b>${escapeHtml(item.screen_label || item.item_name_ko)}</b><code>${escapeHtml(item.item_key)}</code></div><span>${escapeHtml(item.ui_component)} · ${escapeHtml(item.data_type)} · ${escapeHtml(item.required_level || "OPTIONAL")}</span></div>`).join("")}</section>`).join("") || '<div class="empty-state">노출 항목이 없습니다.</div>';
  $("#schemaJsonPreview").textContent = JSON.stringify(data, null, 2);
  $("#schemaPreviewDialog").showModal();
  setPreviewTab("screen");
}

function setPreviewTab(tab) {
  $$("[data-preview-tab]").forEach((button) => button.classList.toggle("active", button.dataset.previewTab === tab));
  $("#schemaScreenPreview").hidden = tab !== "screen";
  $("#schemaJsonPreview").hidden = tab !== "json";
}

async function loadMakeModel() {
  state.makes = await api("/api/admin/manufacturers");
  state.models = await api("/api/admin/models");
  const scope = $("#makeScope").value;
  const rows = state.makes.filter((make) => !scope || make.scope_key === scope);
  $("#makeRows").innerHTML = rows.map((make, index) => `<button class="make-item ${index === 0 ? "active" : ""}" data-make-id="${make.id}"><span><b>${escapeHtml(make.name_ko)}</b><small>${escapeHtml(make.scope_key)} · ${escapeHtml(make.manufacturer_key)}</small></span>${badge(make.status)}</button>`).join("");
  $("#modelMakeSelect").innerHTML = state.makes.map((make) => `<option value="${make.id}">${escapeHtml(make.scope_key)} · ${escapeHtml(make.name_ko)}</option>`).join("");
  renderModels(rows[0]?.id);
}

function renderModels(makeId) {
  const make = state.makes.find((item) => item.id === makeId);
  $("#modelRows").innerHTML = state.models.filter((model) => model.manufacturer_id === makeId).map((model) => `<tr><td>${escapeHtml(make?.name_ko)}</td><td><code>${escapeHtml(model.model_key)}</code></td><td>${escapeHtml(model.name_ko)}</td><td>${badge(model.status)}</td></tr>`).join("") || '<tr><td colspan="4">등록된 모델이 없습니다.</td></tr>';
  $$(".make-item").forEach((button) => button.classList.toggle("active", button.dataset.makeId === makeId));
}

async function loadIntegration() {
  const mappings = await api("/api/admin/legacy-field-mappings");
  $("#legacyMappings").innerHTML = mappings.map((mapping) => `<div class="mapping-row"><code>${escapeHtml(mapping.legacy_table)}.${escapeHtml(mapping.legacy_column)}</code><span>→</span><code>${escapeHtml(mapping.variable_item_key)}</code><small>${escapeHtml(mapping.transformer_class)}</small></div>`).join("");
}

function renderClassifierSummary(result) {
  const projection = result.projection || {};
  const categories = projection.category_node_keys || [];
  const overlays = projection.overlay_keys || [];
  $("#classifierSummary").innerHTML = `<div class="result-status"><strong>Dry Run 완료</strong><span>기존 매물 원본 변경 없음</span></div><div class="result-grid"><div><span>매물 ID</span><b>${escapeHtml(projection.listing_id)}</b></div><div><span>매물 영역</span><b>${escapeHtml(projection.listing_domain)}</b></div><div><span>기본 유형</span><b>${escapeHtml(projection.vehicle_type_key || projection.asset_type_key || "-")}</b></div><div><span>판정 카테고리</span><b>${categories.length}개</b></div></div><div class="result-section"><span>적용 카테고리</span><div class="result-chips">${categories.map((category) => `<b>${escapeHtml(category)}</b>`).join("") || "없음"}</div></div><div class="result-section"><span>적용 오버레이</span><div class="result-chips muted">${overlays.map((overlay) => `<b>${escapeHtml(overlay)}</b>`).join("") || "없음"}</div></div>`;
  $("#classifierResult").textContent = JSON.stringify(result, null, 2);
}

async function loadAudit() {
  const rows = await api("/api/admin/audit-logs");
  $("#auditRows").innerHTML = rows.map((row) => `<div class="timeline-row"><time>${escapeHtml(new Date(row.created_at).toLocaleString("ko-KR"))}</time><b>${escapeHtml(row.action)}</b><span>${escapeHtml(row.entity_type)} · ${escapeHtml(row.entity_id)}</span><small>${escapeHtml(row.actor_id)} (${escapeHtml(row.actor_role)})</small></div>`).join("");
}

const loaders = { dashboard: loadDashboard, matrix: loadMatrix, registry: loadRegistry, categories: loadCategories, variables: loadVariables, schemas: loadSchemas, makeModel: loadMakeModel, integration: loadIntegration, audit: loadAudit };
async function loadPage(page) { await loaders[page]?.(); }

async function submitForm(form) {
  const payload = Object.fromEntries(new FormData(form));
  const kind = form.dataset.form;
  const routes = { registry: "/api/admin/registry", category: "/api/admin/categories", variable: "/api/admin/variables", schema: "/api/admin/schemas", make: "/api/admin/manufacturers", model: "/api/admin/models" };
  if (kind === "variable") {
    payload.screen_label = payload.item_name_ko;
    payload.item_name_en = payload.item_key.split(".").pop();
    payload.status = "DRAFT";
  }
  await api(routes[kind], { method: "POST", body: JSON.stringify(payload) });
  form.closest("dialog").close();
  form.reset();
  toast(`${operationLabel("저장")}했습니다.`);
  await loadPage(({ category: "categories", variable: "variables", schema: "schemas", make: "makeModel", model: "makeModel" })[kind] || kind);
}

function classifierPayload(preset, id) {
  const base = { listing_id: id, listing_domain: "VEHICLE_LISTING", attributes: { sale_price: 52000000 } };
  if (preset === "import_ev") return { ...base, vehicle_type_key: "CAR", origin_type: "IMPORT", fuel_type: "ELECTRIC", theme_keys: ["LUXURY"] };
  if (preset === "bus") return { ...base, vehicle_type_key: "BUS" };
  if (preset === "forklift") return { ...base, vehicle_type_key: "MATERIAL_HANDLING", asset_subtype: "FORKLIFT" };
  return { listing_id: id, listing_domain: "PARTS_LISTING", asset_type_key: "PARTS_GOODS", compatible_vehicle_type: "CAR", attributes: { oem_number: "TEST-OEM-001" } };
}

document.addEventListener("click", async (event) => {
  const navigation = event.target.closest("[data-page]");
  if (navigation) return setPage(navigation.dataset.page);
  const open = event.target.closest("[data-open]");
  if (open) return $(`#${open.dataset.open}`).showModal();
  const previewTab = event.target.closest("[data-preview-tab]");
  if (previewTab) return setPreviewTab(previewTab.dataset.previewTab);
  const archiveRegistry = event.target.closest("[data-archive-registry]");
  if (archiveRegistry && confirm(`${operationLabel("보관")} 처리합니다. 계속합니까?`)) {
    try { await api(`/api/admin/registry/${archiveRegistry.dataset.archiveRegistry}`, { method: "DELETE" }); toast(`${operationLabel("보관")}했습니다.`); await loadRegistry(); } catch (error) { toast(error.message, true); }
    return;
  }
  const archiveVariable = event.target.closest("[data-archive-variable]");
  if (archiveVariable && confirm(`스키마에서 사용 중이면 ${operationLabel("보관")} 처리됩니다. 계속합니까?`)) {
    try { await api(`/api/admin/variables/${archiveVariable.dataset.archiveVariable}`, { method: "DELETE" }); toast(`${operationLabel("처리")}했습니다.`); await loadVariables(); } catch (error) { toast(error.message, true); }
    return;
  }
  const action = event.target.closest("[data-schema-action]");
  if (action) {
    try { await api(`/api/admin/schemas/${action.dataset.id}/actions/${action.dataset.schemaAction}`, { method: "POST", body: "{}" }); toast(`${operationLabel("워크플로우")}를 진행했습니다.`); await loadSchemas(); } catch (error) { toast(error.message, true); }
    return;
  }
  const detail = event.target.closest("[data-schema-detail]");
  if (detail) {
    try { renderSchemaPreview(await api(`/api/admin/schemas/${detail.dataset.schemaDetail}`)); } catch (error) { toast(error.message, true); }
    return;
  }
  const matrixCell = event.target.closest("[data-matrix-cell]");
  if (matrixCell) {
    state.matrixScope = matrixCell.dataset.matrixCell;
    state.matrixSchemaType = matrixCell.dataset.schemaType;
    renderMatrixDetail();
    return;
  }
  const matrixScope = event.target.closest("[data-matrix-scope],[data-matrix-row]");
  if (matrixScope) {
    state.matrixScope = matrixScope.dataset.matrixScope || matrixScope.dataset.matrixRow;
    renderMatrixDetail();
    return;
  }
  const matrixSchemaType = event.target.closest("[data-matrix-schema-type]");
  if (matrixSchemaType) {
    state.matrixSchemaType = matrixSchemaType.dataset.matrixSchemaType;
    renderMatrixDetail();
    return;
  }
  const make = event.target.closest("[data-make-id]");
  if (make) return renderModels(make.dataset.makeId);
  const refresh = event.target.closest("[data-refresh]");
  if (refresh) return loadPage(refresh.dataset.refresh);
});

$$("[data-form]").forEach((form) => form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(form).catch((error) => toast(error.message, true));
}));

$("#classifierForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  try {
    const result = await api(`/api/internal/v1/listings/${encodeURIComponent(data.listing_id)}/classify?dry_run=true`, { method: "POST", body: JSON.stringify(classifierPayload(data.preset, data.listing_id)) });
    renderClassifierSummary(result);
  } catch (error) {
    $("#classifierSummary").innerHTML = `<div class="result-error">${escapeHtml(error.message)}</div>`;
    $("#classifierResult").textContent = error.message;
  }
});

$("#registryNamespace").innerHTML += namespaces.map((namespace) => `<option>${namespace}</option>`).join("");
$("#registryDialog select[name=\"namespace\"]").innerHTML = namespaces.map((namespace) => `<option>${namespace}</option>`).join("");
$("#registryNamespace").addEventListener("change", loadRegistry);
$("#registrySearch").addEventListener("input", loadRegistry);
$("#variableScope").addEventListener("change", loadVariables);
$("#variableSearch").addEventListener("input", loadVariables);
$("#makeScope").addEventListener("change", loadMakeModel);
$("#roleSelect").value = state.role;
$("#roleSelect").addEventListener("change", (event) => {
  state.role = event.target.value;
  localStorage.setItem("boba-admin-role", state.role);
  toast(`데모 권한을 ${state.role}로 변경했습니다.`);
});

applyRuntimePresentation();
try {
  await checkHealth();
  await loadDashboard();
} catch (error) {
  toast(error.message, true);
}
