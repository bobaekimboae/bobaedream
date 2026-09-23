const STORAGE_KEY = "bobaedream-category-admin-public-demo-v5";
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
  ["VEHICLE_TYPE", "MATERIAL_HANDLING", "자재운반장비"],
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

const categoryDefinitions = [
  ["ALL_VEHICLES", "전체 차량", 1, "VEHICLE_LISTING", []],
  ["USED_CAR", "중고차", 1, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAR:PRIMARY_TYPE"]],
  ["DOMESTIC_CAR", "국산차", 2, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAR:PRIMARY_TYPE"]],
  ["IMPORTED_CAR", "수입차", 2, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAR:PRIMARY_TYPE", "OVERLAY:IMPORT_OVERLAY:OVERLAY"]],
  ["ELECTRIC_CAR", "전기차", 2, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAR:PRIMARY_TYPE", "OVERLAY:EV_OVERLAY:OVERLAY"]],
  ["LEASE_USED_CAR", "리스중고차", 2, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAR:PRIMARY_TYPE", "TRANSACTION_TYPE:LEASE_TAKEOVER:TRANSACTION"]],
  ["LUXURY_CAR", "럭셔리카", 2, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAR:PRIMARY_TYPE", "THEME_OVERLAY:LUXURY:THEME"]],
  ["SUPERCAR", "슈퍼카", 2, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAR:PRIMARY_TYPE", "THEME_OVERLAY:SUPERCAR:THEME"]],
  ["CLASSIC_CAR", "클래식카", 2, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAR:PRIMARY_TYPE", "THEME_OVERLAY:CLASSIC_OLD:THEME"]],
  ["BIKE", "바이크", 1, "VEHICLE_LISTING", ["VEHICLE_TYPE:BIKE:PRIMARY_TYPE"]],
  ["TRUCK_SPECIAL", "트럭·특장", 1, "VEHICLE_LISTING", ["VEHICLE_TYPE:TRUCK_SPECIAL:PRIMARY_TYPE"]],
  ["CAMPING_CARAVAN", "캠핑카", 1, "VEHICLE_LISTING", ["VEHICLE_TYPE:CAMPING_CARAVAN:PRIMARY_TYPE"]],
  ["BUS", "버스", 1, "VEHICLE_LISTING", ["VEHICLE_TYPE:BUS:PRIMARY_TYPE"]],
  ["CONSTRUCTION", "건설기계", 1, "VEHICLE_LISTING", ["VEHICLE_TYPE:CONSTRUCTION:PRIMARY_TYPE"]],
  ["ATTACHMENT", "어태치먼트", 1, "PARTS_LISTING", ["ASSET_TYPE:ATTACHMENT:PRIMARY_TYPE"]],
  ["MATERIAL_HANDLING", "자재 운송 장비", 1, "VEHICLE_LISTING", ["VEHICLE_TYPE:MATERIAL_HANDLING:PRIMARY_TYPE"]],
  ["FORKLIFT", "지게차", 2, "VEHICLE_LISTING", ["VEHICLE_TYPE:MATERIAL_HANDLING:PRIMARY_TYPE"]],
  ["PARTS_GOODS", "부품·용품", 1, "PARTS_LISTING", ["ASSET_TYPE:PARTS_GOODS:PRIMARY_TYPE"]],
];
const demoAliasPlacements = {
  IMPORTED_CAR: ["IMPORT_CAR_HOME"],
  BUS: ["TRUCK_SPECIAL_BUS_BUS"],
  CAMPING_CARAVAN: ["TRUCK_SPECIAL_BUS_CAMPING"],
  FORKLIFT: ["CONSTRUCTION_FORKLIFT"],
  ATTACHMENT: ["CONSTRUCTION_ATTACHMENT", "PARTS_GOODS_ATTACHMENT"],
};
const categorySeed = categoryDefinitions.map(([key, name, depth, domain, bindings], index) => ({
  id: `demo_cat_${index + 1}`,
  category_node_key: key,
  category_name_ko: name,
  category_name_en: key,
  depth,
  listing_domain: domain,
  placement_key: key,
  placement_keys: [key, ...(demoAliasPlacements[key] || [])],
  registration_enabled: key !== "ALL_VEHICLES",
  bindings,
  status: "ACTIVE",
  sort_order: index + 1,
}));

const variableDefinitions = {
  car: [
    ["make_id", "제조사", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["model_id", "모델", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["generation_id", "세대", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["trim_id", "세부모델·트림", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["model_year", "연식", "FILTER", "year_range", "integer"],
    ["first_registration_date", "최초등록", "REGISTRATION_FIELD", "month_picker", "date"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer"],
    ["mileage_km", "주행거리", "FILTER", "range_input", "integer"],
    ["fuel_type", "연료·동력", "FILTER", "multi_select", "enum"],
    ["transmission_type", "변속기", "FILTER", "single_select", "enum"],
    ["body_type", "차체형식", "FILTER", "multi_select", "enum"],
    ["exterior_color", "색상", "FILTER", "multi_select", "enum"],
    ["region_code", "지역", "LOCATION_STORAGE", "region_selector", "string"],
    ["seller_type", "판매자 유형", "SELLER_TYPE", "single_select", "enum"],
    ["accident_disclosure", "사고 여부", "TRUST_VERIFICATION", "single_select", "enum"],
    ["insurance_history_available", "보험이력 제공", "TRUST_VERIFICATION", "toggle", "boolean"],
    ["performance_inspection_id", "성능점검기록부", "LEGAL_DOCUMENT", "document_reference", "string"],
    ["certification_type", "인증 여부", "TRUST_VERIFICATION", "single_select", "enum"],
  ],
  bike: [
    ["make_id", "제조사", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["model_id", "모델", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["displacement_cc", "배기량", "FILTER", "range_input", "integer"],
    ["model_year", "연식", "FILTER", "year_range", "integer"],
    ["first_registration_date", "최초등록", "REGISTRATION_FIELD", "month_picker", "date"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer"],
    ["mileage_km", "주행거리", "FILTER", "range_input", "integer"],
    ["transmission_type", "기어방식", "FILTER", "single_select", "enum"],
    ["abs_available", "ABS", "OPTION", "toggle", "boolean"],
    ["bike_style", "차체유형", "FILTER", "multi_select", "enum"],
    ["usage_type", "용도", "FILTER", "multi_select", "enum"],
    ["engine_type", "엔진형식", "DETAIL_BASIC", "single_select", "enum"],
    ["electric_drive", "전기오토바이", "FILTER", "toggle", "boolean"],
    ["customized", "튜닝·커스텀", "OPTION", "toggle", "boolean"],
    ["region_code", "지역", "LOCATION_STORAGE", "region_selector", "string"],
    ["seller_type", "판매자 유형", "SELLER_TYPE", "single_select", "enum"],
  ],
  truck_special: [
    ["truck_body_type", "트럭·특장 유형", "FILTER", "category_selector", "enum"],
    ["make_id", "제조사", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["model_id", "모델", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["model_year", "연식", "FILTER", "year_range", "integer"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer"],
    ["mileage_km", "주행거리", "FILTER", "range_input", "integer"],
    ["payload_kg", "적재중량", "FILTER", "range_input", "integer"],
    ["gross_vehicle_weight_kg", "총중량", "DETAIL_BASIC", "number_input", "integer"],
    ["axle_configuration", "축 구성", "FILTER", "multi_select", "enum"],
    ["drive_configuration", "구동 방식", "FILTER", "multi_select", "enum"],
    ["superstructure_type", "특장 구조", "OPTION", "conditional_select", "enum"],
    ["inspection_expiry_date", "검사 유효기간", "LEGAL_DOCUMENT", "date_picker", "date"],
    ["storage_region_code", "차고지·보관지", "LOCATION_STORAGE", "region_selector", "string"],
    ["seller_type", "판매자 유형", "SELLER_TYPE", "single_select", "enum"],
  ],
  bus: [
    ["bus_type", "버스 유형", "FILTER", "category_selector", "enum"],
    ["make_id", "제조사", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["model_id", "모델", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["seat_capacity", "승차정원", "FILTER", "range_input", "integer"],
    ["seat_layout", "좌석배치", "OPTION", "single_select", "enum"],
    ["usage_type", "용도", "FILTER", "multi_select", "enum"],
    ["model_year", "연식", "FILTER", "year_range", "integer"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer"],
    ["mileage_km", "주행거리", "FILTER", "range_input", "integer"],
    ["fuel_type", "연료", "FILTER", "multi_select", "enum"],
    ["transmission_type", "변속기", "FILTER", "single_select", "enum"],
    ["region_code", "지역", "LOCATION_STORAGE", "region_selector", "string"],
    ["seller_type", "판매자 유형", "SELLER_TYPE", "single_select", "enum"],
  ],
  camping_caravan: [
    ["camping_type", "캠핑 차량 형태", "FILTER", "category_selector", "enum"],
    ["base_vehicle", "베이스차량", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["seat_capacity", "승차인원", "FILTER", "range_input", "integer"],
    ["sleep_capacity", "취침인원", "FILTER", "range_input", "integer"],
    ["bed_count", "침상 수", "DETAIL_BASIC", "number_input", "integer"],
    ["toilet_available", "화장실", "OPTION", "toggle", "boolean"],
    ["shower_available", "샤워실", "OPTION", "toggle", "boolean"],
    ["kitchen_available", "주방", "OPTION", "toggle", "boolean"],
    ["electrical_system", "전기설비", "OPTION", "multi_select", "enum"],
    ["solar_available", "태양광", "OPTION", "toggle", "boolean"],
    ["expansion_type", "확장 여부", "OPTION", "single_select", "enum"],
    ["model_year", "연식", "FILTER", "year_range", "integer"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer"],
    ["mileage_km", "주행거리", "FILTER", "range_input", "integer"],
    ["region_code", "지역", "LOCATION_STORAGE", "region_selector", "string"],
    ["seller_type", "판매자 유형", "SELLER_TYPE", "single_select", "enum"],
  ],
  construction: [
    ["equipment_type", "장비유형", "FILTER", "category_selector", "enum"],
    ["make_id", "제조사", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["model_id", "모델", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["model_year", "연식", "FILTER", "year_range", "integer"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer"],
    ["working_hours", "사용시간", "FILTER", "range_input", "integer"],
    ["operating_weight_kg", "작업중량", "DETAIL_BASIC", "number_input", "integer"],
    ["bucket_capacity_m3", "버킷용량", "DETAIL_BASIC", "number_input", "decimal"],
    ["undercarriage_type", "궤도·휠", "FILTER", "single_select", "enum"],
    ["condition_grade", "장비상태", "CONDITION_GRADE", "single_select", "enum"],
    ["attachment_included", "어태치먼트 포함", "OPTION", "toggle", "boolean"],
    ["storage_region_code", "보관지", "LOCATION_STORAGE", "region_selector", "string"],
    ["seller_type", "판매자 유형", "SELLER_TYPE", "single_select", "enum"],
  ],
  material_handling: [
    ["equipment_type", "장비유형", "FILTER", "category_selector", "enum"],
    ["power_source", "동력원", "FILTER", "multi_select", "enum"],
    ["lift_capacity_kg", "인양능력", "FILTER", "range_input", "integer"],
    ["lift_height_mm", "인양높이", "FILTER", "range_input", "integer"],
    ["mast_type", "마스트", "FILTER", "single_select", "enum"],
    ["make_id", "제조사", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["model_id", "모델", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["model_year", "연식", "FILTER", "year_range", "integer"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer"],
    ["working_hours", "사용시간", "FILTER", "range_input", "integer"],
    ["battery_condition", "배터리상태", "CONDITION_GRADE", "single_select", "enum"],
    ["storage_region_code", "보관지", "LOCATION_STORAGE", "region_selector", "string"],
    ["seller_type", "판매자 유형", "SELLER_TYPE", "single_select", "enum"],
  ],
  attachment: [
    ["attachment_type", "어태치먼트 유형", "FILTER", "category_selector", "enum"],
    ["compatible_equipment_type", "호환 장비", "FILTER", "multi_select", "enum"],
    ["compatible_make_id", "호환 제조사", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["compatible_model_id", "호환 모델", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["specification", "규격", "DETAIL_BASIC", "text_input", "string"],
    ["weight_kg", "중량", "DETAIL_BASIC", "number_input", "integer"],
    ["coupler_type", "연결방식", "FILTER", "single_select", "enum"],
    ["condition_grade", "상태", "CONDITION_GRADE", "single_select", "enum"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer"],
    ["region_code", "지역", "LOCATION_STORAGE", "region_selector", "string"],
    ["seller_type", "판매자 유형", "SELLER_TYPE", "single_select", "enum"],
  ],
  parts_goods: [
    ["parts_category_id", "부품 카테고리", "FILTER", "category_selector", "string"],
    ["compatible_vehicle_type", "호환 차량유형", "FILTER", "multi_select", "enum"],
    ["compatible_make_id", "호환 제조사", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["compatible_model_id", "호환 모델", "MAKE_MODEL_MASTER", "cascading_select", "string"],
    ["compatible_year_range", "호환 연식", "REGISTRATION_FIELD", "year_range", "range"],
    ["oem_number", "OEM 번호", "FILTER", "text_input", "string"],
    ["part_origin_type", "부품 구분", "FILTER", "single_select", "enum"],
    ["condition_grade", "상태", "CONDITION_GRADE", "single_select", "enum"],
    ["installation_position", "장착 위치", "FILTER", "single_select", "enum"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer"],
    ["delivery_method", "배송·직거래", "DELIVERY_TRANSPORT", "multi_select", "enum"],
    ["seller_type", "개인·업체 구분", "SELLER_TYPE", "single_select", "enum"],
  ],
};

const defaultSource = ["보배드림 가변설계 정본", "https://docs.google.com/spreadsheets/d/1ei78gzOyLeKXcVrrsKmNx5U3zWXmvpGyY6E9dcVOeFo/edit"];
const paidProductDefinitions = [
  ["premium_listing_available", "프리미엄 노출 가능", "PAID_PRODUCT", "toggle", "boolean"],
  ["top_placement_available", "상단노출 가능", "PAID_PRODUCT", "toggle", "boolean"],
  ["lead_fee_available", "문의 리드 과금 가능", "PAID_PRODUCT", "toggle", "boolean"],
  ["monthly_plan_available", "월정액 상품 가능", "PAID_PRODUCT", "toggle", "boolean"],
];
const enrichedVariableDefinitions = Object.fromEntries(Object.entries(variableDefinitions).map(([scope, rows]) => [
  scope,
  [...rows, ...paidProductDefinitions],
]));
const sourceByScope = Object.fromEntries(Object.keys(enrichedVariableDefinitions).map((scope) => [scope, defaultSource]));
const optionSetKey = (scope, key, type) => type === "enum" ? `${scope}.${key}.options` : null;

const variableSeed = Object.entries(enrichedVariableDefinitions).flatMap(([scope, rows]) => rows.map(([key, label, group, component, type], index) => ({
  id: `demo_var_${scope}_${index}`,
  item_key: `${scope}.${key}`,
  variable_group: group,
  item_name_ko: label,
  item_name_en: key,
  screen_label: label,
  ui_component: component,
  data_type: type,
  option_set_key: optionSetKey(scope, key, type),
  source_site: sourceByScope[scope][0],
  source_url: sourceByScope[scope][1],
  korea_applicability: "APPLY",
  status: "ACTIVE",
})));

const assetScopes = new Set(["ATTACHMENT", "PARTS_GOODS"]);
const schemaTypes = ["FILTER", "REGISTRATION_FORM", "LIST_META", "DETAIL", "OPTION", "SELLER", "PAID_PRODUCT", "MAKE_MODEL", "QA_CHECKLIST", "PLATFORM_DIFF"];
const requiredSchemaTypes = ["FILTER", "REGISTRATION_FORM", "LIST_META", "DETAIL", "SELLER"];
const schemaPlatform = { FILTER: "MOBILE_APP", REGISTRATION_FORM: "ADMIN", LIST_META: "ALL", DETAIL: "ALL", OPTION: "ALL", SELLER: "ADMIN", PAID_PRODUCT: "ADMIN", MAKE_MODEL: "ADMIN", QA_CHECKLIST: "ADMIN", PLATFORM_DIFF: "ALL" };
function schemaItemKeys(scope, type) {
  const rows = enrichedVariableDefinitions[scope.toLowerCase()] || [];
  const keysByGroup = (...groups) => rows.filter((row) => groups.includes(row[2])).map((row) => row[0]);
  const allKeys = rows.map((row) => row[0]);
  if (type === "REGISTRATION_FORM" || type === "DETAIL") return allKeys;
  if (type === "FILTER") return keysByGroup("FILTER", "MAKE_MODEL_MASTER", "PRICE_DISPLAY", "LOCATION_STORAGE", "CONDITION_GRADE", "SELLER_TYPE");
  if (type === "OPTION") return keysByGroup("OPTION").slice(0, 8);
  if (type === "SELLER") return keysByGroup("SELLER_TYPE");
  if (type === "PAID_PRODUCT") return keysByGroup("PAID_PRODUCT");
  if (type === "MAKE_MODEL") return keysByGroup("MAKE_MODEL_MASTER");
  if (type === "QA_CHECKLIST" || type === "PLATFORM_DIFF") return [];
  return allKeys.filter((key) => [
    "make_id", "model_id", "model_year", "sale_price", "mileage_km", "region_code", "storage_region_code",
    "truck_body_type", "bus_type", "bike_style", "camping_type", "equipment_type", "attachment_type",
    "parts_category_id", "payload_kg", "seat_capacity", "sleep_capacity", "working_hours", "condition_grade",
  ].includes(key)).slice(0, 8);
}

const schemaSeed = Object.keys(enrichedVariableDefinitions).flatMap((scope, scopeIndex) => schemaTypes.map((type, typeIndex) => {
  const target = scope.toUpperCase();
  const itemCount = schemaItemKeys(target, type).length;
  if (!itemCount) return null;
  return {
    id: `demo_schema_${scope}_${type.toLowerCase()}`,
    title: `${target} ${type} ${schemaPlatform[type]}`,
    schema_type: type,
    vehicle_type_key: assetScopes.has(target) ? null : target,
    asset_type_key: assetScopes.has(target) ? target : null,
    category_node_key: null,
    platform: schemaPlatform[type],
    schema_version: "1.0.0",
    workflow_status: "PUBLISHED",
    publication_status: "PUBLISHED",
    schema_hash: `demo-sha256-${scopeIndex + 1}-${typeIndex + 1}`,
    item_count: itemCount,
    updated_at: now(),
  };
}).filter(Boolean));

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
function schemaTarget(schema) { return schema.vehicle_type_key || schema.asset_type_key || schema.category_node_key || ""; }
function schemaItemsFor(schema, state) {
  const prefix = `${schemaTarget(schema).toLowerCase()}.`;
  const itemKeys = schemaItemKeys(schemaTarget(schema), schema.schema_type);
  const selected = itemKeys.length
    ? itemKeys.map((key) => state.variables.find((item) => item.item_key === `${schemaTarget(schema).toLowerCase()}.${key}`)).filter(Boolean)
    : [];
  return selected.map((item, index) => ({
    ...item,
    item_order: index + 1,
    section_key: sectionKeyFor(schema.schema_type, item, index),
    exposure_type: schema.schema_type === "FILTER" ? (index < 5 ? "DEFAULT" : "MORE") : "SECTION",
    required_level: index < 4 ? "REQUIRED" : "RECOMMENDED",
  }));
}
function sectionKeyFor(type, item, index) {
  if (type === "LIST_META") return index < 3 ? "CARD_PRIMARY" : "CARD_META";
  if (type === "PAID_PRODUCT") return "MONETIZATION";
  if (type === "MAKE_MODEL") return "MAKE_MODEL";
  if (type === "OPTION") return "OPTION";
  if (type === "SELLER") return "SELLER";
  if (type !== "DETAIL") return index < 4 ? "BASIC" : "ADDITIONAL";
  const group = item?.variable_group;
  if (["MAKE_MODEL_MASTER", "PRICE_DISPLAY"].includes(group)) return "BASIC_INFO";
  if (["FILTER", "DETAIL_BASIC", "CONDITION_GRADE"].includes(group)) return "SPEC";
  if (["TRUST_VERIFICATION", "LEGAL_DOCUMENT"].includes(group)) return "CONDITION";
  if (group === "SELLER_TYPE") return "SELLER";
  if (group === "LOCATION_STORAGE") return "LOCATION";
  if (["DELIVERY_TRANSPORT", "REGISTRATION_FIELD"].includes(group)) return "TRANSACTION";
  if (group === "PAID_PRODUCT") return "MONETIZATION";
  return "ADDITIONAL";
}
function variableMatrix(state, scopeKey = null) {
  const scopes = state.registry
    .filter((row) => ["VEHICLE_TYPE", "ASSET_TYPE"].includes(row.namespace) && row.status !== "ARCHIVED")
    .filter((row) => !scopeKey || row.system_key === scopeKey)
    .map((row) => {
      const schemas = schemaTypes.map((type) => {
        const schema = state.schemas.find((item) => schemaTarget(item) === row.system_key && item.schema_type === type);
        if (!schema) return { schema_type: type, status: "MISSING", item_count: 0, items: [] };
        const items = schemaItemsFor(schema, state);
        return { ...schema, item_count: items.length, items };
      });
      const readyCount = schemas.filter((schema) => requiredSchemaTypes.includes(schema.schema_type) && schema.status !== "MISSING" && schema.item_count > 0).length;
      const missingRequired = schemas.filter((schema) => requiredSchemaTypes.includes(schema.schema_type) && (schema.status === "MISSING" || schema.item_count <= 0)).map((schema) => schema.schema_type);
      return {
        scope_key: row.system_key,
        namespace: row.namespace,
        name_ko: row.name_ko,
        name_en: row.name_en,
        launch_status: row.launch_status,
        status: row.status,
        field_count: state.variables.filter((item) => item.item_key.startsWith(`${row.system_key.toLowerCase()}.`) && item.status !== "ARCHIVED").length,
        schema_counts: Object.fromEntries(schemas.map((schema) => [schema.schema_type, schema.item_count])),
        required_schema_types: requiredSchemaTypes,
        missing_required_schema_types: missingRequired,
        schema_ready_count: readyCount,
        published_count: schemas.filter((schema) => schema.workflow_status === "PUBLISHED").length,
        completeness_percent: Math.round((readyCount / requiredSchemaTypes.length) * 100),
        schemas,
      };
    });
  return { generated_at: now(), schema_types: schemaTypes, scopes };
}
function classify(payload) {
  const categories = payload.listing_domain === "VEHICLE_LISTING"
    ? ["ALL_VEHICLES"]
    : (payload.asset_type_key === "PARTS_GOODS" ? ["PARTS_GOODS"] : []);
  if (payload.vehicle_type_key === "CAR") {
    categories.push("USED_CAR", payload.origin_type === "IMPORT" ? "IMPORTED_CAR" : "DOMESTIC_CAR");
    if (payload.fuel_type === "ELECTRIC") categories.push("ELECTRIC_CAR");
    if (payload.theme_keys?.includes("LUXURY")) categories.push("LUXURY_CAR", "THEME_CAR");
  }
  if (payload.vehicle_type_key === "BUS") categories.push("BUS");
  if (payload.vehicle_type_key === "MATERIAL_HANDLING") categories.push("MATERIAL_HANDLING", "FORKLIFT");
  if (payload.asset_type_key === "ATTACHMENT") categories.push("ATTACHMENT");
  const categoryNodeKeys = [...new Set(categories)];
  const placementAliases = {
    IMPORTED_CAR: ["IMPORT_CAR_HOME"],
    BUS: ["TRUCK_SPECIAL_BUS_BUS"],
    CAMPING_CARAVAN: ["TRUCK_SPECIAL_BUS_CAMPING"],
    FORKLIFT: ["CONSTRUCTION_FORKLIFT"],
    ATTACHMENT: ["CONSTRUCTION_ATTACHMENT", "PARTS_GOODS_ATTACHMENT"],
  };
  const placementKeys = [...new Set(categoryNodeKeys.flatMap((key) => [key, ...(placementAliases[key] || [])]))];
  const overlayKeys = [...new Set([
    ...(payload.overlay_keys || []),
    ...(payload.origin_type === "IMPORT" ? ["IMPORT_OVERLAY"] : []),
    ...(payload.fuel_type === "ELECTRIC" ? ["EV_OVERLAY"] : []),
    ...(payload.theme_keys || []),
  ])];
  return { dry_run: true, projection: { listing_id: payload.listing_id, listing_domain: payload.listing_domain, vehicle_type_key: payload.vehicle_type_key || null, asset_type_key: payload.asset_type_key || null, category_node_keys: categoryNodeKeys, placement_keys: placementKeys, overlay_keys: overlayKeys, attributes: payload.attributes || {}, resolution_version: "public-demo-v1", projected_at: now() } };
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
      const payload = bodyOf(options);
      const row = {
        id: makeId("variable"),
        ...payload,
        option_set_key: payload.option_set_key || (payload.data_type === "enum" ? `${String(payload.item_key || "").toLowerCase()}.options` : null),
      };
      state.variables.push(row); addAudit(state, "CREATE", "variable_item", row.id, role); save(state); return row;
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
    if (url.pathname === "/api/admin/variable-matrix") return variableMatrix(state, url.searchParams.get("scope_key"));
    if (match && method === "GET") { const row = state.schemas.find((schema) => schema.id === match[1]); return { ...row, items: schemaItemsFor(row, state), validation_rules: [], conditional_rules: [], option_sets: [] }; }
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
