const STORAGE_KEY = "bobaedream-category-admin-public-demo-v1";
const now = () => new Date().toISOString();
const makeId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const memory = new Map();
const storage = typeof localStorage !== "undefined"
  ? localStorage
  : { getItem: (key) => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) };

const registrySeed = [
  ["VEHICLE_TYPE", "CAR", "중고차"],
  ["VEHICLE_TYPE", "BIKE", "바이크"],
  ["VEHICLE_TYPE", "TRUCK_SPECIAL", "트럭·특장"],
  ["VEHICLE_TYPE", "BUS", "버스"],
  ["VEHICLE_TYPE", "CONSTRUCTION", "건설기계"],
  ["VEHICLE_TYPE", "FORKLIFT_LOGISTICS", "지게차·물류장비"],
  ["VEHICLE_TYPE", "CAMPING_CARAVAN", "캠핑카·카라반"],
  ["ASSET_TYPE", "ATTACHMENT", "어태치먼트"],
  ["ASSET_TYPE", "PARTS_GOODS", "부품·용품"],
  ["OVERLAY", "EV_OVERLAY", "전기차"],
  ["OVERLAY", "IMPORT_OVERLAY", "수입차"],
  ["OVERLAY", "BRAND_CERTIFIED_OVERLAY", "브랜드 인증"],
  ["THEME_OVERLAY", "CLASSIC_OLD", "클래식카"],
  ["THEME_OVERLAY", "LUXURY", "럭셔리카"],
  ["THEME_OVERLAY", "SUPERCAR", "슈퍼카"],
  ["TRANSACTION_TYPE", "LEASE_TAKEOVER", "리스승계"],
  ["SELLER_CHANNEL", "PRIVATE", "개인"],
  ["SELLER_CHANNEL", "DEALER", "딜러"],
  ["SELLER_CHANNEL", "DEALER_COMPLEX", "매매단지"],
  ["SERVICE_BM", "TOP_PLACEMENT", "상단노출"],
  ["SERVICE_BM", "PREMIUM_BADGE", "프리미엄 배지"],
].map(([namespace, system_key, name_ko], index) => ({
  id: `demo_reg_${index + 1}`,
  namespace,
  system_key,
  name_ko,
  name_en: system_key,
  launch_status: "P1_LAUNCH",
  status: "ACTIVE",
  sort_order: index + 1,
}));

const categorySeed = [
  ["ALL_VEHICLES", "전체 차량", 1, "VEHICLE_LISTING", []],
  ["USED_CAR", "중고차", 1, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAR:PRIMARY_TYPE"]],
  ["DOMESTIC_CAR", "국산차", 2, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAR:PRIMARY_TYPE"]],
  ["IMPORTED_CAR", "수입차", 2, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAR:PRIMARY_TYPE", "OVERLAY:IMPORT_OVERLAY:OVERLAY"]],
  ["ELECTRIC_CAR", "전기차", 2, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAR:PRIMARY_TYPE", "OVERLAY:EV_OVERLAY:OVERLAY"]],
  ["LEASE_USED_CAR", "리스중고차", 2, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAR:PRIMARY_TYPE", "TRANSACTION_TYPE:LEASE_TAKEOVER:TRANSACTION"]],
  ["LUXURY_CAR", "럭셔리카", 2, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAR:PRIMARY_TYPE", "THEME_OVERLAY:LUXURY:THEME"]],
  ["SUPERCAR", "슈퍼카", 2, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAR:PRIMARY_TYPE", "THEME_OVERLAY:SUPERCAR:THEME"]],
  ["CLASSIC_CAR", "클래식카", 2, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAR:PRIMARY_TYPE", "THEME_OVERLAY:CLASSIC_OLD:THEME"]],
  ["IMPORT_CAR", "수입차 전문관", 1, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAR:PRIMARY_TYPE", "OVERLAY:IMPORT_OVERLAY:OVERLAY"]],
  ["BIKE", "바이크", 1, "VEHICLE_LISTING", ["VEHICLE_TYPE:BIKE:PRIMARY_TYPE"]],
  ["TRUCK_SPECIAL_BUS", "트럭·특장·버스", 1, "VEHICLE_LISTING", ["VEHICLE_TYPE:TRUCK_SPECIAL:PRIMARY_TYPE"]],
  ["CAMPING_CARAVAN", "캠핑카", 1, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAMPING_CARAVAN:PRIMARY_TYPE"]],
  ["BUS", "버스", 1, "VEHICLE_LISTING", ["VEHICLE_TYPE:BUS:PRIMARY_TYPE"]],
  ["CONSTRUCTION", "건설기계", 1, "VEHICLE_LISTING", ["VEHICLE_TYPE:CONSTRUCTION:PRIMARY_TYPE"]],
  ["MATERIAL_HANDLING", "자재 운송 장비", 1, "VEHICLE_LISTING", []],
  ["PARTS_GOODS", "부품·용품", 1, "PARTS_LISTING", ["ASSET_TYPE:PARTS_GOODS:PRIMARY_TYPE"]],
].map(([key, name, depth, domain, bindings], index) => ({
  id: `demo_cat_${index + 1}`,
  category_node_key: key,
  category_name_ko: name,
  category_name_en: key,
  depth,
  listing_domain: domain,
  placement_key: key,
  registration_enabled: key !== "ALL_VEHICLES",
  bindings,
  status: "ACTIVE",
  sort_order: index + 1,
}));

const variableDefinitions = {
  car: [
    ["make_id", "제조사", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["model_id", "모델", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["model_year", "연식", "FILTER", "year_range", "integer"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer"],
    ["mileage_km", "주행거리", "FILTER", "range_input", "integer"],
    ["fuel_type", "연료·동력", "FILTER", "multi_select", "enum"],
    ["transmission_type", "변속기", "FILTER", "single_select", "enum"],
    ["region_code", "지역", "LOCATION_STORAGE", "region_selector", "string"],
    ["accident_disclosure", "사고 여부", "TRUST_VERIFICATION", "single_select", "enum"],
  ],
  truck_special: [
    ["truck_body_type", "트럭·특장 유형", "FILTER", "category_selector", "enum"],
    ["make_id", "제조사", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["model_id", "모델", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["payload_kg", "적재중량", "FILTER", "range_input", "integer"],
    ["axle_configuration", "축 구성", "FILTER", "multi_select", "enum"],
    ["storage_region_code", "차고지·보관지", "LOCATION_STORAGE", "region_selector", "string"],
  ],
  parts_goods: [
    ["parts_category_id", "부품 카테고리", "FILTER", "category_selector", "string"],
    ["compatible_vehicle_type", "호환 차량유형", "FILTER", "multi_select", "enum"],
    ["compatible_make_id", "호환 제조사", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["oem_number", "OEM 번호", "FILTER", "text_input", "string"],
    ["part_origin_type", "부품 구분", "FILTER", "single_select", "enum"],
    ["condition_grade", "상태", "CONDITION_GRADE", "single_select", "enum"],
    ["delivery_method", "배송·직거래", "DELIVERY_TRANSPORT", "multi_select", "enum"],
  ],
};

const sourceByScope = {
  car: ["Auto Trader UK", "https://www.autotrader.co.uk/car-search"],
  truck_special: ["TruckScout24", "https://www.truckscout24.com/"],
  parts_goods: ["eBay Motors Parts", "https://www.ebay.com/b/Auto-Parts-and-Vehicles/6000/bn_1865334"],
};

const variableSeed = Object.entries(variableDefinitions).flatMap(([scope, rows]) => rows.map(([key, label, group, component, type], index) => ({
  id: `demo_var_${scope}_${index}`,
  item_key: `${scope}.${key}`,
  variable_group: group,
  item_name_ko: label,
  item_name_en: key,
  screen_label: label,
  ui_component: component,
  data_type: type,
  source_site: sourceByScope[scope][0],
  source_url: sourceByScope[scope][1],
  korea_applicability: "APPLY",
  status: "ACTIVE",
})));

const schemaSeed = [
  ["CAR", "FILTER", "MOBILE_APP", 11],
  ["CAR", "REGISTRATION_FORM", "ADMIN", 16],
  ["CAR", "LIST_META", "ALL", 7],
  ["CAR", "DETAIL", "ALL", 16],
  ["TRUCK_SPECIAL", "FILTER", "MOBILE_APP", 9],
  ["TRUCK_SPECIAL", "REGISTRATION_FORM", "ADMIN", 13],
  ["PARTS_GOODS", "FILTER", "MOBILE_APP", 10],
  ["PARTS_GOODS", "REGISTRATION_FORM", "ADMIN", 12],
].map(([target, type, platform, count], index) => ({
  id: `demo_schema_${index + 1}`,
  title: `${target} ${type} ${platform}`,
  schema_type: type,
  vehicle_type_key: target === "PARTS_GOODS" ? null : target,
  asset_type_key: target === "PARTS_GOODS" ? target : null,
  category_node_key: null,
  platform,
  schema_version: "1.0.0",
  workflow_status: "PUBLISHED",
  publication_status: "PUBLISHED",
  schema_hash: `demo-sha256-${index + 1}`,
  item_count: count,
  updated_at: now(),
}));

const makeSeed = [
  ["CAR", "HYUNDAI", "현대"], ["CAR", "KIA", "기아"], ["CAR", "GENESIS", "제네시스"],
  ["CAR", "BMW", "BMW"], ["CAR", "MERCEDES_BENZ", "벤츠"],
  ["TRUCK_SPECIAL", "HYUNDAI_COMMERCIAL", "현대 상용"], ["TRUCK_SPECIAL", "TATA_DAEWOO", "타타대우"],
  ["TRUCK_SPECIAL", "VOLVO_TRUCKS", "볼보트럭"], ["BIKE", "HONDA", "혼다"], ["BIKE", "YAMAHA", "야마하"],
].map(([scope_key, manufacturer_key, name_ko], index) => ({
  id: `demo_make_${index + 1}`, scope_key, manufacturer_key, name_ko, name_en: manufacturer_key, status: "ACTIVE", sort_order: index + 1,
}));

const modelSeed = [
  [0, "AVANTE", "아반떼"], [0, "SONATA", "쏘나타"], [1, "K5", "K5"], [2, "G80", "G80"],
  [3, "5_SERIES", "5시리즈"], [4, "E_CLASS", "E클래스"], [5, "PORTER2", "포터2"],
  [5, "MIGHTY", "마이티"], [6, "DEXEN", "더쎈"], [8, "PCX", "PCX"],
].map(([makeIndex, model_key, name_ko], index) => ({
  id: `demo_model_${index + 1}`, manufacturer_id: makeSeed[makeIndex].id, model_key, name_ko, name_en: model_key, status: "ACTIVE", sort_order: index + 1,
}));

const mappingSeed = [
  ["maker_no", "car.make_id", "LEGACY_TO_MASTER_KEY"], ["model_no", "car.model_id", "LEGACY_TO_MASTER_KEY"],
  ["car_year", "car.model_year", "INTEGER"], ["mileage", "car.mileage_km", "INTEGER_KM"],
  ["fuel_code", "car.fuel_type", "CODE_MAP"], ["gear_code", "car.transmission_type", "CODE_MAP"],
  ["price", "car.sale_price", "KRW_INTEGER"],
].map(([legacy_column, variable_item_key, transformer_class], index) => ({
  id: `demo_mapping_${index}`, legacy_table: "car", legacy_column, variable_item_key, transformer_class, status: "ACTIVE",
}));

function initialState() {
  return {
    registry: registrySeed,
    categories: categorySeed,
    variables: variableSeed,
    schemas: schemaSeed,
    makes: makeSeed,
    models: modelSeed,
    mappings: mappingSeed,
    audit: [{ id: "demo_audit_1", actor_id: "public-demo", actor_role: "SUPER_ADMIN", action: "PUBLISH", entity_type: "schema", entity_id: "CAR/FILTER/1.0.0", created_at: now() }],
    publishes: schemaSeed.map((schema, index) => ({ id: `demo_publish_${index}`, target_key: schema.vehicle_type_key || schema.asset_type_key, schema_type: schema.schema_type, platform: schema.platform, schema_version: schema.schema_version, is_active: true, published_at: now() })),
  };
}

function load() {
  const saved = storage.getItem(STORAGE_KEY);
  if (!saved) { const fresh = initialState(); save(fresh); return fresh; }
  try { return JSON.parse(saved); } catch { const fresh = initialState(); save(fresh); return fresh; }
}
function save(state) { storage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function bodyOf(options) { return options?.body ? (typeof options.body === "string" ? JSON.parse(options.body) : options.body) : {}; }
function addAudit(state, action, entityType, entityId, role) {
  state.audit.unshift({ id: makeId("audit"), actor_id: "public-demo", actor_role: role, action, entity_type: entityType, entity_id: entityId, created_at: now() });
}
function classify(payload) {
  const categories = payload.listing_domain === "PARTS_LISTING" ? ["PARTS_GOODS"] : ["ALL_VEHICLES"];
  if (payload.vehicle_type_key === "CAR") {
    categories.push("USED_CAR", payload.origin_type === "IMPORT" ? "IMPORTED_CAR" : "DOMESTIC_CAR");
    if (payload.fuel_type === "ELECTRIC") categories.push("ELECTRIC_CAR");
    if (payload.theme_keys?.includes("LUXURY")) categories.push("LUXURY_CAR", "THEME_CAR");
  }
  if (payload.vehicle_type_key === "BUS") categories.push("TRUCK_SPECIAL_BUS", "BUS");
  if (payload.vehicle_type_key === "FORKLIFT_LOGISTICS") categories.push("CONSTRUCTION", "MATERIAL_HANDLING");
  return { dry_run: true, projection: { listing_id: payload.listing_id, listing_domain: payload.listing_domain, vehicle_type_key: payload.vehicle_type_key || null, asset_type_key: payload.asset_type_key || null, category_node_keys: [...new Set(categories)], attributes: payload.attributes || {}, resolution_version: "public-demo-v1", projected_at: now() } };
}

export function createDemoApi() {
  return async function demoApi(path, options = {}, role = "SUPER_ADMIN") {
    const state = load();
    const method = options.method || "GET";
    const url = new URL(path, "https://demo.local");
    if (url.pathname === "/api/admin/health") return { ok: true, service: "bobaedream-category-admin", mode: "PUBLIC_DEMO", time: now() };
    if (method !== "GET" && role === "READ_ONLY") throw new Error("READ_ONLY 권한은 공개 데모 데이터를 수정할 수 없습니다.");

    if (url.pathname === "/api/admin/dashboard") {
      const workflow = Object.entries(state.schemas.reduce((acc, schema) => { acc[schema.workflow_status] = (acc[schema.workflow_status] || 0) + 1; return acc; }, {})).map(([status, count]) => ({ status, count }));
      return { counts: { registry_items: state.registry.length, category_nodes: state.categories.length, category_placements: state.categories.length, variable_items: state.variables.length, schemas: state.schemas.length, manufacturers: state.makes.length, models: state.models.length, listing_read_models: 0 }, workflow, domains: [], missing_reference_count: 0, recent_publishes: state.publishes.slice(0, 10), recent_audit: state.audit.slice(0, 12) };
    }
    if (url.pathname === "/api/admin/registry") {
      if (method === "GET") return state.registry;
      const payload = bodyOf(options);
      if (payload.namespace === "VEHICLE_TYPE" && ["IMPORT_CAR", "EV_OVERLAY", "PARTS_GOODS", "ATTACHMENT", "DEALER", "DEALER_COMPLEX"].includes(payload.system_key)) throw new Error("해당 개념은 VEHICLE_TYPE으로 저장할 수 없습니다.");
      const row = { id: makeId("registry"), ...payload, name_en: payload.system_key, status: "DRAFT", sort_order: 999 };
      state.registry.push(row); addAudit(state, "CREATE", "registry_item", row.id, role); save(state); return row;
    }
    let match = url.pathname.match(/^\/api\/admin\/registry\/([^/]+)$/);
    if (match && method === "DELETE") { const row = state.registry.find((item) => item.id === match[1]); if (row) row.status = "ARCHIVED"; addAudit(state, "ARCHIVE", "registry_item", match[1], role); save(state); return row; }

    if (url.pathname === "/api/admin/categories") {
      if (method === "GET") return state.categories;
      const payload = bodyOf(options); const row = { id: makeId("category"), ...payload, category_name_en: payload.category_node_key, depth: 1, placement_key: null, registration_enabled: true, bindings: [], status: "DRAFT", sort_order: 999 };
      state.categories.push(row); addAudit(state, "CREATE", "category_node", row.id, role); save(state); return row;
    }
    if (url.pathname === "/api/admin/variables") {
      if (method === "GET") return state.variables;
      const row = { id: makeId("variable"), ...bodyOf(options) }; state.variables.push(row); addAudit(state, "CREATE", "variable_item", row.id, role); save(state); return row;
    }
    match = url.pathname.match(/^\/api\/admin\/variables\/([^/]+)$/);
    if (match && method === "DELETE") { const row = state.variables.find((item) => item.id === match[1]); if (row) row.status = "ARCHIVED"; addAudit(state, "ARCHIVE", "variable_item", match[1], role); save(state); return row; }

    if (url.pathname === "/api/admin/schemas") {
      if (method === "GET") return state.schemas;
      const payload = bodyOf(options); const source = state.schemas.find((schema) => schema.id === payload.clone_schema_id);
      const row = { ...source, id: makeId("schema"), title: payload.title, schema_version: payload.schema_version, workflow_status: "DRAFT", publication_status: "UNPUBLISHED", updated_at: now() };
      state.schemas.unshift(row); addAudit(state, "CREATE_DRAFT", "schema", row.id, role); save(state); return row;
    }
    match = url.pathname.match(/^\/api\/admin\/schemas\/([^/]+)$/);
    if (match && method === "GET") { const row = state.schemas.find((schema) => schema.id === match[1]); return { ...row, items: state.variables.slice(0, row.item_count || 8), validation_rules: [], conditional_rules: [], option_sets: [] }; }
    match = url.pathname.match(/^\/api\/admin\/schemas\/([^/]+)\/actions\/(request-review|approve|publish|rollback)$/);
    if (match) {
      const row = state.schemas.find((schema) => schema.id === match[1]); const action = match[2];
      row.workflow_status = { "request-review": "REVIEW_REQUESTED", approve: "QA_APPROVED", publish: "PUBLISHED", rollback: "ROLLED_BACK" }[action];
      if (action === "publish") { row.publication_status = "PUBLISHED"; state.publishes.unshift({ id: makeId("publish"), target_key: row.vehicle_type_key || row.asset_type_key, schema_type: row.schema_type, platform: row.platform, schema_version: row.schema_version, is_active: true, published_at: now() }); }
      if (action === "rollback") row.publication_status = "ROLLED_BACK";
      addAudit(state, action.toUpperCase(), "schema", row.id, role); save(state); return row;
    }

    if (url.pathname === "/api/admin/manufacturers") {
      if (method === "GET") return state.makes;
      const row = { id: makeId("make"), ...bodyOf(options), status: "DRAFT", sort_order: 999 }; state.makes.push(row); addAudit(state, "CREATE", "manufacturer", row.id, role); save(state); return row;
    }
    if (url.pathname === "/api/admin/models") {
      if (method === "GET") return state.models;
      const row = { id: makeId("model"), ...bodyOf(options), status: "DRAFT", sort_order: 999 }; state.models.push(row); addAudit(state, "CREATE", "model", row.id, role); save(state); return row;
    }
    if (url.pathname === "/api/admin/legacy-field-mappings") return state.mappings;
    if (url.pathname === "/api/admin/audit-logs") return state.audit;
    match = url.pathname.match(/^\/api\/internal\/v1\/listings\/([^/]+)\/classify$/);
    if (match) return classify({ ...bodyOf(options), listing_id: match[1] });
    throw new Error(`공개 데모에서 지원하지 않는 경로입니다: ${method} ${url.pathname}`);
  };
}
