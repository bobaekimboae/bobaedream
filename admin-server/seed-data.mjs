const now = () => new Date().toISOString();

const registryRows = [
  ["VEHICLE_TYPE", "CAR", "중고차", "P1_LAUNCH"],
  ["VEHICLE_TYPE", "BIKE", "바이크", "P1_LAUNCH"],
  ["VEHICLE_TYPE", "TRUCK_SPECIAL", "트럭·특장", "P1_LAUNCH"],
  ["VEHICLE_TYPE", "BUS", "버스", "P1_LAUNCH"],
  ["VEHICLE_TYPE", "CONSTRUCTION", "건설기계", "P1_LAUNCH"],
  ["VEHICLE_TYPE", "MATERIAL_HANDLING", "자재운반장비", "P1_LAUNCH"],
  ["VEHICLE_TYPE", "CAMPING_CARAVAN", "캠핑카·카라반", "P1_LAUNCH"],
  ["ASSET_TYPE", "ATTACHMENT", "어태치먼트", "P1_LAUNCH"],
  ["ASSET_TYPE", "PARTS_GOODS", "부품·용품", "P1_LAUNCH"],
  ["OVERLAY", "EV_OVERLAY", "전기차", "P1_LAUNCH"],
  ["OVERLAY", "IMPORT_OVERLAY", "수입차", "P1_LAUNCH"],
  ["OVERLAY", "BRAND_CERTIFIED_OVERLAY", "브랜드 인증", "P1_LAUNCH"],
  ["OVERLAY", "DEALER_COMPLEX_OVERLAY", "매매단지", "P1_LAUNCH"],
  ["THEME_OVERLAY", "CLASSIC_OLD", "클래식카", "P1_LAUNCH"],
  ["THEME_OVERLAY", "LUXURY", "럭셔리카", "P1_LAUNCH"],
  ["THEME_OVERLAY", "SUPERCAR", "슈퍼카", "P1_LAUNCH"],
  ["THEME_OVERLAY", "TUNING_CUSTOM", "튜닝·커스텀", "P2_NEXT"],
  ["TRANSACTION_TYPE", "LEASE_TAKEOVER", "리스승계", "P1_LAUNCH"],
  ["SELLER_CHANNEL", "PRIVATE", "개인", "P1_LAUNCH"],
  ["SELLER_CHANNEL", "DEALER", "딜러", "P1_LAUNCH"],
  ["SELLER_CHANNEL", "DEALER_COMPANY", "상사", "P1_LAUNCH"],
  ["SELLER_CHANNEL", "DEALER_COMPLEX", "매매단지", "P1_LAUNCH"],
  ["SELLER_CHANNEL", "BRAND_CERTIFIED_DEALER", "브랜드 인증 딜러", "P1_LAUNCH"],
  ["SELLER_CHANNEL", "PARTS_VENDOR", "부품업체", "P1_LAUNCH"],
  ["SELLER_CHANNEL", "EQUIPMENT_DEALER", "장비업체", "P1_LAUNCH"],
  ["SERVICE_BM", "TOP_PLACEMENT", "상단노출", "P1_LAUNCH"],
  ["SERVICE_BM", "PREMIUM_BADGE", "프리미엄 배지", "P1_LAUNCH"],
  ["SERVICE_BM", "DEALER_PAGE", "딜러 페이지", "P2_NEXT"],
  ["SERVICE_BM", "FINANCE_LEAD", "금융 리드", "P2_NEXT"],
  ["SERVICE_BM", "TRANSPORT_LEAD", "운송 리드", "P2_NEXT"],
].map(([namespace, system_key, name_ko, launch_status], index) => ({
  id: `reg_${namespace.toLowerCase()}_${system_key.toLowerCase()}`,
  namespace,
  system_key,
  name_ko,
  name_en: system_key.toLowerCase().replaceAll("_", " "),
  parent_id: null,
  launch_status,
  status: launch_status === "HOLD" ? "HOLD" : "ACTIVE",
  display_scope_json: JSON.stringify(["PC_WEB", "MOBILE_WEB", "MOBILE_APP", "ADMIN"]),
  sort_order: index + 1,
  metadata_json: JSON.stringify({ seed: true }),
  created_at: now(),
  updated_at: now(),
}));

const categoryDefinitions = [
  ["ALL_VEHICLES", null, "전체 차량", "VEHICLE_LISTING", 1],
  ["USED_CAR", null, "중고차", "VEHICLE_LISTING", 2],
  ["DOMESTIC_CAR", "USED_CAR", "국산차", "VEHICLE_LISTING", 1],
  ["IMPORTED_CAR", "USED_CAR", "수입차", "VEHICLE_LISTING", 2],
  ["ELECTRIC_CAR", "USED_CAR", "전기차", "VEHICLE_LISTING", 3],
  ["LEASE_USED_CAR", "USED_CAR", "리스중고차", "VEHICLE_LISTING", 4],
  ["LUXURY_CAR", "USED_CAR", "럭셔리카", "VEHICLE_LISTING", 5],
  ["SUPERCAR", "USED_CAR", "슈퍼카", "VEHICLE_LISTING", 6],
  ["CLASSIC_CAR", "USED_CAR", "클래식카", "VEHICLE_LISTING", 7],
  ["THEME_CAR", "USED_CAR", "테마별 차량", "VEHICLE_LISTING", 8],
  ["BRAND_CERTIFIED_CAR", "USED_CAR", "브랜드인증 중고차", "VEHICLE_LISTING", 9],
  ["DEALER_COMPLEX_CAR", "USED_CAR", "매매단지별 중고차", "VEHICLE_LISTING", 10],
  ["IMPORT_CAR", null, "수입차 전문관", "VEHICLE_LISTING", 3],
  ["BIKE", null, "바이크", "VEHICLE_LISTING", 4],
  ["ATV", "BIKE", "ATV", "VEHICLE_LISTING", 1],
  ["TRUCK_SPECIAL_BUS", null, "트럭·특장·버스", "VEHICLE_LISTING", 5],
  ["CAMPING_CARAVAN", null, "캠핑카", "VEHICLE_LISTING", 6],
  ["BUS", null, "버스", "VEHICLE_LISTING", 7],
  ["CONSTRUCTION", null, "건설기계", "VEHICLE_LISTING", 8],
  ["ATTACHMENT", "CONSTRUCTION", "어태치먼트", "PARTS_LISTING", 2],
  ["MATERIAL_HANDLING", null, "자재 운송 장비", "VEHICLE_LISTING", 9],
  ["FORKLIFT", "MATERIAL_HANDLING", "지게차", "VEHICLE_LISTING", 1],
  ["PARTS_GOODS", null, "부품·용품", "PARTS_LISTING", 10],
  ["CAR_PARTS", "PARTS_GOODS", "자동차 부품·용품", "PARTS_LISTING", 1],
  ["TRUCK_PARTS", "PARTS_GOODS", "트럭 부품·용품", "PARTS_LISTING", 2],
  ["BUS_PARTS", "PARTS_GOODS", "버스 부품·용품", "PARTS_LISTING", 3],
  ["CONSTRUCTION_PARTS", "PARTS_GOODS", "건설기계 부품·용품", "PARTS_LISTING", 4],
  ["CAMPING_PARTS", "PARTS_GOODS", "캠핑카 부품·용품", "PARTS_LISTING", 5],
  ["BIKE_PARTS", "PARTS_GOODS", "바이크 부품·용품", "PARTS_LISTING", 6],
];

const categories = categoryDefinitions.map(([key, parentKey, name, domain, order]) => ({
  id: `cat_${key.toLowerCase()}`,
  category_node_key: key,
  parent_category_node_id: parentKey ? `cat_${parentKey.toLowerCase()}` : null,
  category_name_ko: name,
  category_name_en: key.toLowerCase().replaceAll("_", " "),
  slug: key.toLowerCase().replaceAll("_", "-"),
  depth: parentKey ? 2 : 1,
  sort_order: order,
  listing_domain: domain,
  pc_visible: 1,
  mobile_visible: 1,
  app_visible: 1,
  registration_enabled: key !== "ALL_VEHICLES" ? 1 : 0,
  search_enabled: 1,
  list_enabled: 1,
  detail_enabled: 1,
  status: "ACTIVE",
  launch_phase: "P1_LAUNCH",
  description: `${name} 운영 카테고리`,
  created_at: now(),
  updated_at: now(),
}));

const bindingMap = {
  USED_CAR: [["VEHICLE_TYPE", "CAR", "PRIMARY_TYPE"]],
  DOMESTIC_CAR: [["VEHICLE_TYPE", "CAR", "PRIMARY_TYPE"]],
  IMPORTED_CAR: [["VEHICLE_TYPE", "CAR", "PRIMARY_TYPE"], ["OVERLAY", "IMPORT_OVERLAY", "OVERLAY"]],
  ELECTRIC_CAR: [["VEHICLE_TYPE", "CAR", "PRIMARY_TYPE"], ["OVERLAY", "EV_OVERLAY", "OVERLAY"]],
  LEASE_USED_CAR: [["VEHICLE_TYPE", "CAR", "PRIMARY_TYPE"], ["TRANSACTION_TYPE", "LEASE_TAKEOVER", "TRANSACTION"]],
  LUXURY_CAR: [["VEHICLE_TYPE", "CAR", "PRIMARY_TYPE"], ["THEME_OVERLAY", "LUXURY", "THEME"]],
  SUPERCAR: [["VEHICLE_TYPE", "CAR", "PRIMARY_TYPE"], ["THEME_OVERLAY", "SUPERCAR", "THEME"]],
  CLASSIC_CAR: [["VEHICLE_TYPE", "CAR", "PRIMARY_TYPE"], ["THEME_OVERLAY", "CLASSIC_OLD", "THEME"]],
  BRAND_CERTIFIED_CAR: [["VEHICLE_TYPE", "CAR", "PRIMARY_TYPE"], ["OVERLAY", "BRAND_CERTIFIED_OVERLAY", "OVERLAY"]],
  DEALER_COMPLEX_CAR: [["VEHICLE_TYPE", "CAR", "PRIMARY_TYPE"], ["SELLER_CHANNEL", "DEALER_COMPLEX", "SELLER_CHANNEL"]],
  IMPORT_CAR: [["VEHICLE_TYPE", "CAR", "PRIMARY_TYPE"], ["OVERLAY", "IMPORT_OVERLAY", "OVERLAY"]],
  BIKE: [["VEHICLE_TYPE", "BIKE", "PRIMARY_TYPE"]],
  TRUCK_SPECIAL_BUS: [["VEHICLE_TYPE", "TRUCK_SPECIAL", "PRIMARY_TYPE"]],
  CAMPING_CARAVAN: [["VEHICLE_TYPE", "CAMPING_CARAVAN", "PRIMARY_TYPE"]],
  BUS: [["VEHICLE_TYPE", "BUS", "PRIMARY_TYPE"]],
  CONSTRUCTION: [["VEHICLE_TYPE", "CONSTRUCTION", "PRIMARY_TYPE"]],
  MATERIAL_HANDLING: [["VEHICLE_TYPE", "MATERIAL_HANDLING", "PRIMARY_TYPE"]],
  FORKLIFT: [["VEHICLE_TYPE", "MATERIAL_HANDLING", "PRIMARY_TYPE"]],
  ATTACHMENT: [["ASSET_TYPE", "ATTACHMENT", "PRIMARY_TYPE"]],
  PARTS_GOODS: [["ASSET_TYPE", "PARTS_GOODS", "PRIMARY_TYPE"]],
};

const registryByRef = new Map(registryRows.map((row) => [`${row.namespace}:${row.system_key}`, row]));
const categoryBindings = Object.entries(bindingMap).flatMap(([categoryKey, bindings]) => bindings.map(([namespace, key, role], index) => ({
  id: `bind_${categoryKey.toLowerCase()}_${index + 1}`,
  category_node_id: `cat_${categoryKey.toLowerCase()}`,
  registry_item_id: registryByRef.get(`${namespace}:${key}`)?.id,
  binding_role: role,
  created_at: now(),
})));

const placements = categories.map((category, index) => ({
  id: `placement_${category.category_node_key.toLowerCase()}`,
  placement_key: category.category_node_key,
  category_node_id: category.id,
  parent_placement_id: category.parent_category_node_id?.replace("cat_", "placement_") || null,
  platform: "ALL",
  menu_name_ko: category.category_name_ko,
  sort_order: index + 1,
  is_visible: 1,
  exclusion_registry_refs_json: JSON.stringify(category.category_node_key === "ALL_VEHICLES" ? ["ASSET_TYPE:PARTS_GOODS"] : []),
  created_at: now(),
  updated_at: now(),
}));

const defaultSource = ["보배드림 가변설계 정본", "https://docs.google.com/spreadsheets/d/1ei78gzOyLeKXcVrrsKmNx5U3zWXmvpGyY6E9dcVOeFo/edit"];

const variableDefinitions = {
  CAR: [
    ["make_id", "제조사", "MAKE_MODEL_MASTER", "cascading_select", "string", "REQUIRED"],
    ["model_id", "모델", "MAKE_MODEL_MASTER", "cascading_select", "string", "REQUIRED"],
    ["generation_id", "세대", "MAKE_MODEL_MASTER", "cascading_select", "string", "RECOMMENDED"],
    ["trim_id", "세부모델·트림", "MAKE_MODEL_MASTER", "cascading_select", "string", "RECOMMENDED"],
    ["model_year", "연식", "FILTER", "year_range", "integer", "REQUIRED"],
    ["first_registration_date", "최초등록", "REGISTRATION_FIELD", "month_picker", "date", "REQUIRED"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer", "REQUIRED"],
    ["mileage_km", "주행거리", "FILTER", "range_input", "integer", "REQUIRED"],
    ["fuel_type", "연료·동력", "FILTER", "multi_select", "enum", "REQUIRED"],
    ["transmission_type", "변속기", "FILTER", "single_select", "enum", "REQUIRED"],
    ["body_type", "차체형식", "FILTER", "multi_select", "enum", "RECOMMENDED"],
    ["exterior_color", "색상", "FILTER", "multi_select", "enum", "RECOMMENDED"],
    ["region_code", "지역", "LOCATION_STORAGE", "region_selector", "string", "REQUIRED"],
    ["seller_type", "판매자 유형", "SELLER_TYPE", "single_select", "enum", "REQUIRED"],
    ["accident_disclosure", "사고 여부", "TRUST_VERIFICATION", "single_select", "enum", "REQUIRED"],
    ["insurance_history_available", "보험이력 제공", "TRUST_VERIFICATION", "toggle", "boolean", "RECOMMENDED"],
    ["performance_inspection_id", "성능점검기록부", "LEGAL_DOCUMENT", "document_reference", "string", "RECOMMENDED"],
    ["certification_type", "인증 여부", "TRUST_VERIFICATION", "single_select", "enum", "OPTIONAL"],
  ],
  BIKE: [
    ["make_id", "제조사", "MAKE_MODEL_MASTER", "cascading_select", "string", "REQUIRED"],
    ["model_id", "모델", "MAKE_MODEL_MASTER", "cascading_select", "string", "REQUIRED"],
    ["displacement_cc", "배기량", "FILTER", "range_input", "integer", "REQUIRED"],
    ["model_year", "연식", "FILTER", "year_range", "integer", "REQUIRED"],
    ["first_registration_date", "최초등록", "REGISTRATION_FIELD", "month_picker", "date", "RECOMMENDED"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer", "REQUIRED"],
    ["mileage_km", "주행거리", "FILTER", "range_input", "integer", "REQUIRED"],
    ["transmission_type", "기어방식", "FILTER", "single_select", "enum", "RECOMMENDED"],
    ["abs_available", "ABS", "OPTION", "toggle", "boolean", "RECOMMENDED"],
    ["bike_style", "차체유형", "FILTER", "multi_select", "enum", "REQUIRED"],
    ["usage_type", "용도", "FILTER", "multi_select", "enum", "RECOMMENDED"],
    ["engine_type", "엔진형식", "DETAIL_BASIC", "single_select", "enum", "RECOMMENDED"],
    ["electric_drive", "전기오토바이", "FILTER", "toggle", "boolean", "OPTIONAL"],
    ["customized", "튜닝·커스텀", "OPTION", "toggle", "boolean", "OPTIONAL"],
    ["region_code", "지역", "LOCATION_STORAGE", "region_selector", "string", "REQUIRED"],
    ["seller_type", "판매자 유형", "SELLER_TYPE", "single_select", "enum", "REQUIRED"],
  ],
  TRUCK_SPECIAL: [
    ["truck_body_type", "트럭·특장 유형", "FILTER", "category_selector", "enum", "REQUIRED"],
    ["make_id", "제조사", "MAKE_MODEL_MASTER", "cascading_select", "string", "REQUIRED"],
    ["model_id", "모델", "MAKE_MODEL_MASTER", "cascading_select", "string", "REQUIRED"],
    ["model_year", "연식", "FILTER", "year_range", "integer", "REQUIRED"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer", "REQUIRED"],
    ["mileage_km", "주행거리", "FILTER", "range_input", "integer", "REQUIRED"],
    ["payload_kg", "적재중량", "FILTER", "range_input", "integer", "REQUIRED"],
    ["gross_vehicle_weight_kg", "총중량", "DETAIL_BASIC", "number_input", "integer", "RECOMMENDED"],
    ["axle_configuration", "축 구성", "FILTER", "multi_select", "enum", "RECOMMENDED"],
    ["drive_configuration", "구동 방식", "FILTER", "multi_select", "enum", "RECOMMENDED"],
    ["superstructure_type", "특장 구조", "OPTION", "conditional_select", "enum", "RECOMMENDED"],
    ["inspection_expiry_date", "검사 유효기간", "LEGAL_DOCUMENT", "date_picker", "date", "RECOMMENDED"],
    ["storage_region_code", "차고지·보관지", "LOCATION_STORAGE", "region_selector", "string", "REQUIRED"],
    ["seller_type", "판매자 유형", "SELLER_TYPE", "single_select", "enum", "REQUIRED"],
  ],
  BUS: [
    ["bus_type", "버스 유형", "FILTER", "category_selector", "enum", "REQUIRED"],
    ["make_id", "제조사", "MAKE_MODEL_MASTER", "cascading_select", "string", "REQUIRED"],
    ["model_id", "모델", "MAKE_MODEL_MASTER", "cascading_select", "string", "REQUIRED"],
    ["seat_capacity", "승차정원", "FILTER", "range_input", "integer", "REQUIRED"],
    ["seat_layout", "좌석배치", "OPTION", "single_select", "enum", "RECOMMENDED"],
    ["usage_type", "용도", "FILTER", "multi_select", "enum", "REQUIRED"],
    ["model_year", "연식", "FILTER", "year_range", "integer", "REQUIRED"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer", "REQUIRED"],
    ["mileage_km", "주행거리", "FILTER", "range_input", "integer", "REQUIRED"],
    ["fuel_type", "연료", "FILTER", "multi_select", "enum", "RECOMMENDED"],
    ["transmission_type", "변속기", "FILTER", "single_select", "enum", "RECOMMENDED"],
    ["region_code", "지역", "LOCATION_STORAGE", "region_selector", "string", "REQUIRED"],
    ["seller_type", "판매자 유형", "SELLER_TYPE", "single_select", "enum", "REQUIRED"],
  ],
  CAMPING_CARAVAN: [
    ["camping_type", "캠핑 차량 형태", "FILTER", "category_selector", "enum", "REQUIRED"],
    ["base_vehicle", "베이스차량", "MAKE_MODEL_MASTER", "cascading_select", "string", "RECOMMENDED"],
    ["seat_capacity", "승차인원", "FILTER", "range_input", "integer", "REQUIRED"],
    ["sleep_capacity", "취침인원", "FILTER", "range_input", "integer", "REQUIRED"],
    ["bed_count", "침상 수", "DETAIL_BASIC", "number_input", "integer", "RECOMMENDED"],
    ["toilet_available", "화장실", "OPTION", "toggle", "boolean", "RECOMMENDED"],
    ["shower_available", "샤워실", "OPTION", "toggle", "boolean", "RECOMMENDED"],
    ["kitchen_available", "주방", "OPTION", "toggle", "boolean", "RECOMMENDED"],
    ["electrical_system", "전기설비", "OPTION", "multi_select", "enum", "RECOMMENDED"],
    ["solar_available", "태양광", "OPTION", "toggle", "boolean", "OPTIONAL"],
    ["expansion_type", "확장 여부", "OPTION", "single_select", "enum", "OPTIONAL"],
    ["model_year", "연식", "FILTER", "year_range", "integer", "REQUIRED"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer", "REQUIRED"],
    ["mileage_km", "주행거리", "FILTER", "range_input", "integer", "RECOMMENDED"],
    ["region_code", "지역", "LOCATION_STORAGE", "region_selector", "string", "REQUIRED"],
    ["seller_type", "판매자 유형", "SELLER_TYPE", "single_select", "enum", "REQUIRED"],
  ],
  CONSTRUCTION: [
    ["equipment_type", "장비유형", "FILTER", "category_selector", "enum", "REQUIRED"],
    ["make_id", "제조사", "MAKE_MODEL_MASTER", "cascading_select", "string", "REQUIRED"],
    ["model_id", "모델", "MAKE_MODEL_MASTER", "cascading_select", "string", "REQUIRED"],
    ["model_year", "연식", "FILTER", "year_range", "integer", "REQUIRED"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer", "REQUIRED"],
    ["working_hours", "사용시간", "FILTER", "range_input", "integer", "REQUIRED"],
    ["operating_weight_kg", "작업중량", "DETAIL_BASIC", "number_input", "integer", "RECOMMENDED"],
    ["bucket_capacity_m3", "버킷용량", "DETAIL_BASIC", "number_input", "decimal", "RECOMMENDED"],
    ["undercarriage_type", "궤도·휠", "FILTER", "single_select", "enum", "RECOMMENDED"],
    ["condition_grade", "장비상태", "CONDITION_GRADE", "single_select", "enum", "REQUIRED"],
    ["attachment_included", "어태치먼트 포함", "OPTION", "toggle", "boolean", "RECOMMENDED"],
    ["storage_region_code", "보관지", "LOCATION_STORAGE", "region_selector", "string", "REQUIRED"],
    ["seller_type", "판매자 유형", "SELLER_TYPE", "single_select", "enum", "REQUIRED"],
  ],
  MATERIAL_HANDLING: [
    ["equipment_type", "장비유형", "FILTER", "category_selector", "enum", "REQUIRED"],
    ["power_source", "동력원", "FILTER", "multi_select", "enum", "REQUIRED"],
    ["lift_capacity_kg", "인양능력", "FILTER", "range_input", "integer", "REQUIRED"],
    ["lift_height_mm", "인양높이", "FILTER", "range_input", "integer", "RECOMMENDED"],
    ["mast_type", "마스트", "FILTER", "single_select", "enum", "RECOMMENDED"],
    ["make_id", "제조사", "MAKE_MODEL_MASTER", "cascading_select", "string", "REQUIRED"],
    ["model_id", "모델", "MAKE_MODEL_MASTER", "cascading_select", "string", "REQUIRED"],
    ["model_year", "연식", "FILTER", "year_range", "integer", "REQUIRED"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer", "REQUIRED"],
    ["working_hours", "사용시간", "FILTER", "range_input", "integer", "REQUIRED"],
    ["battery_condition", "배터리상태", "CONDITION_GRADE", "single_select", "enum", "RECOMMENDED"],
    ["storage_region_code", "보관지", "LOCATION_STORAGE", "region_selector", "string", "REQUIRED"],
    ["seller_type", "판매자 유형", "SELLER_TYPE", "single_select", "enum", "REQUIRED"],
  ],
  ATTACHMENT: [
    ["attachment_type", "어태치먼트 유형", "FILTER", "category_selector", "enum", "REQUIRED"],
    ["compatible_equipment_type", "호환 장비", "FILTER", "multi_select", "enum", "REQUIRED"],
    ["compatible_make_id", "호환 제조사", "MAKE_MODEL_MASTER", "cascading_select", "string", "RECOMMENDED"],
    ["compatible_model_id", "호환 모델", "MAKE_MODEL_MASTER", "cascading_select", "string", "RECOMMENDED"],
    ["specification", "규격", "DETAIL_BASIC", "text_input", "string", "REQUIRED"],
    ["weight_kg", "중량", "DETAIL_BASIC", "number_input", "integer", "RECOMMENDED"],
    ["coupler_type", "연결방식", "FILTER", "single_select", "enum", "RECOMMENDED"],
    ["condition_grade", "상태", "CONDITION_GRADE", "single_select", "enum", "REQUIRED"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer", "REQUIRED"],
    ["region_code", "지역", "LOCATION_STORAGE", "region_selector", "string", "REQUIRED"],
    ["seller_type", "판매자 유형", "SELLER_TYPE", "single_select", "enum", "REQUIRED"],
  ],
  PARTS_GOODS: [
    ["parts_category_id", "부품 카테고리", "FILTER", "category_selector", "string", "REQUIRED"],
    ["compatible_vehicle_type", "호환 차량유형", "FILTER", "multi_select", "enum", "REQUIRED"],
    ["compatible_make_id", "호환 제조사", "MAKE_MODEL_MASTER", "cascading_select", "string", "RECOMMENDED"],
    ["compatible_model_id", "호환 모델", "MAKE_MODEL_MASTER", "cascading_select", "string", "RECOMMENDED"],
    ["compatible_year_range", "호환 연식", "REGISTRATION_FIELD", "year_range", "range", "RECOMMENDED"],
    ["oem_number", "OEM 번호", "FILTER", "text_input", "string", "RECOMMENDED"],
    ["part_origin_type", "부품 구분", "FILTER", "single_select", "enum", "REQUIRED"],
    ["condition_grade", "상태", "CONDITION_GRADE", "single_select", "enum", "REQUIRED"],
    ["installation_position", "장착 위치", "FILTER", "single_select", "enum", "RECOMMENDED"],
    ["sale_price", "가격", "PRICE_DISPLAY", "price_input", "integer", "REQUIRED"],
    ["delivery_method", "배송·직거래", "DELIVERY_TRANSPORT", "multi_select", "enum", "REQUIRED"],
    ["seller_type", "개인·업체 구분", "SELLER_TYPE", "single_select", "enum", "REQUIRED"],
  ],
};

const paidProductDefinitions = [
  ["premium_listing_available", "프리미엄 노출 가능", "PAID_PRODUCT", "toggle", "boolean", "RECOMMENDED"],
  ["top_placement_available", "상단노출 가능", "PAID_PRODUCT", "toggle", "boolean", "RECOMMENDED"],
  ["lead_fee_available", "문의 리드 과금 가능", "PAID_PRODUCT", "toggle", "boolean", "RECOMMENDED"],
  ["monthly_plan_available", "월정액 상품 가능", "PAID_PRODUCT", "toggle", "boolean", "RECOMMENDED"],
];

const enrichedVariableDefinitions = Object.fromEntries(Object.entries(variableDefinitions).map(([scope, items]) => [
  scope,
  [...items, ...paidProductDefinitions],
]));

function optionSetKey(scope, key, dataType) {
  return dataType === "enum" ? `${scope.toLowerCase()}.${key}.options` : null;
}

const variableItems = Object.entries(enrichedVariableDefinitions).flatMap(([scope, items]) => {
  const [sourceSite, sourceUrl] = defaultSource;
  return items.map(([key, label, group, component, dataType, required], index) => ({
    id: `var_${scope.toLowerCase()}_${key}`,
    item_key: `${scope.toLowerCase()}.${key}`,
    variable_group: group,
    item_name_ko: label,
    item_name_en: key,
    screen_label: label,
    ui_component: component,
    data_type: dataType,
    unit: key.endsWith("_km") ? "km" : key.endsWith("_kg") ? "kg" : key === "sale_price" ? "KRW" : null,
    option_set_key: optionSetKey(scope, key, dataType),
    validation_rules_json: JSON.stringify(required === "REQUIRED" ? { required: true } : {}),
    source_site: sourceSite,
    source_url: sourceUrl,
    korea_applicability: "APPLY",
    status: "ACTIVE",
    created_at: now(),
    updated_at: now(),
  }));
});

const ASSET_SCOPES = new Set(["ATTACHMENT", "PARTS_GOODS"]);

function schema(scope, type, categoryKey, platform, items, version = "1.0.0") {
  const id = `schema_${scope.toLowerCase()}_${type.toLowerCase()}_${platform.toLowerCase()}_v1`;
  return {
    row: {
      id,
      schema_type: type,
      vehicle_type_key: ASSET_SCOPES.has(scope) ? null : scope,
      asset_type_key: ASSET_SCOPES.has(scope) ? scope : null,
      category_node_key: categoryKey,
      platform,
      schema_version: version,
      workflow_status: "QA_APPROVED",
      publication_status: "UNPUBLISHED",
      schema_hash: null,
      fallback_schema_id: null,
      title: `${scope} ${type} ${platform}`,
      created_by: "seed",
      updated_by: "seed",
      created_at: now(),
      updated_at: now(),
    },
    items: items.map((itemKey, index) => {
      const variable = variableItems.find((row) => row.item_key === `${scope.toLowerCase()}.${itemKey}`);
      return {
        id: `si_${id}_${index + 1}`,
        schema_id: id,
        variable_item_id: variable.id,
        item_order: index + 1,
        section_key: sectionKeyFor(type, variable, index),
        exposure_type: type === "FILTER" ? (index < 5 ? "DEFAULT" : "MORE") : "SECTION",
        required_level: JSON.parse(variable.validation_rules_json).required ? "REQUIRED" : "RECOMMENDED",
        is_visible: 1,
        conditional_rules_json: JSON.stringify([]),
        validation_rules_json: variable.validation_rules_json,
        display_rules_json: JSON.stringify({}),
        created_at: now(),
        updated_at: now(),
      };
    }),
  };
}

function sectionKeyFor(type, variable, index) {
  if (type === "LIST_META") return index < 3 ? "CARD_PRIMARY" : "CARD_META";
  if (type === "PAID_PRODUCT") return "MONETIZATION";
  if (type === "MAKE_MODEL") return "MAKE_MODEL";
  if (type === "OPTION") return "OPTION";
  if (type === "SELLER") return "SELLER";
  if (type !== "DETAIL") return index < 4 ? "BASIC" : "ADDITIONAL";
  const group = variable?.variable_group;
  if (["MAKE_MODEL_MASTER", "PRICE_DISPLAY"].includes(group)) return "BASIC_INFO";
  if (["FILTER", "DETAIL_BASIC", "CONDITION_GRADE"].includes(group)) return "SPEC";
  if (["TRUST_VERIFICATION", "LEGAL_DOCUMENT"].includes(group)) return "CONDITION";
  if (group === "SELLER_TYPE") return "SELLER";
  if (group === "LOCATION_STORAGE") return "LOCATION";
  if (["DELIVERY_TRANSPORT", "REGISTRATION_FIELD"].includes(group)) return "TRANSACTION";
  if (group === "PAID_PRODUCT") return "MONETIZATION";
  return "ADDITIONAL";
}

const schemaPackages = Object.entries(enrichedVariableDefinitions).flatMap(([scope, rows]) => {
  const allKeys = rows.map((row) => row[0]);
  const keysForGroups = (...groups) => rows.filter((row) => groups.includes(row[2])).map((row) => row[0]);
  const filterKeys = keysForGroups("FILTER", "MAKE_MODEL_MASTER", "PRICE_DISPLAY", "LOCATION_STORAGE", "CONDITION_GRADE", "SELLER_TYPE");
  const listKeys = allKeys.filter((key) => [
    "make_id", "model_id", "model_year", "sale_price", "mileage_km", "region_code", "storage_region_code",
    "truck_body_type", "bus_type", "bike_style", "camping_type", "equipment_type", "attachment_type",
    "parts_category_id", "payload_kg", "seat_capacity", "sleep_capacity", "working_hours", "condition_grade",
  ].includes(key)).slice(0, 8);
  const optionKeys = keysForGroups("OPTION");
  const sellerKeys = keysForGroups("SELLER_TYPE");
  const paidProductKeys = keysForGroups("PAID_PRODUCT");
  const makeModelKeys = keysForGroups("MAKE_MODEL_MASTER");
  return [
    schema(scope, "REGISTRATION_FORM", null, "ADMIN", allKeys),
    schema(scope, "FILTER", null, "MOBILE_APP", filterKeys),
    schema(scope, "LIST_META", null, "ALL", listKeys.length ? listKeys : allKeys.slice(0, 6)),
    schema(scope, "DETAIL", null, "ALL", allKeys),
    schema(scope, "SELLER", null, "ADMIN", sellerKeys.length ? sellerKeys : allKeys.slice(-1)),
    paidProductKeys.length ? schema(scope, "PAID_PRODUCT", null, "ADMIN", paidProductKeys) : null,
    makeModelKeys.length ? schema(scope, "MAKE_MODEL", null, "ADMIN", makeModelKeys) : null,
    optionKeys.length ? schema(scope, "OPTION", null, "ALL", optionKeys) : null,
  ].filter(Boolean);
});

const manufacturers = [
  ["CAR", "HYUNDAI", "현대", "Hyundai"], ["CAR", "KIA", "기아", "Kia"], ["CAR", "GENESIS", "제네시스", "Genesis"],
  ["CAR", "BMW", "BMW", "BMW"], ["CAR", "MERCEDES_BENZ", "벤츠", "Mercedes-Benz"],
  ["TRUCK_SPECIAL", "HYUNDAI_COMMERCIAL", "현대 상용", "Hyundai Commercial"],
  ["TRUCK_SPECIAL", "TATA_DAEWOO", "타타대우", "Tata Daewoo"], ["TRUCK_SPECIAL", "VOLVO_TRUCKS", "볼보트럭", "Volvo Trucks"],
  ["BIKE", "HONDA", "혼다", "Honda"], ["BIKE", "YAMAHA", "야마하", "Yamaha"],
].map(([scope, key, ko, en], index) => ({
  id: `make_${scope.toLowerCase()}_${key.toLowerCase()}`,
  scope_key: scope,
  manufacturer_key: key,
  name_ko: ko,
  name_en: en,
  country_code: ["HYUNDAI", "KIA", "GENESIS", "HYUNDAI_COMMERCIAL", "TATA_DAEWOO"].includes(key) ? "KR" : null,
  sort_order: index + 1,
  status: "ACTIVE",
  created_at: now(),
  updated_at: now(),
}));

const models = [
  ["CAR", "HYUNDAI", "AVANTE", "아반떼"], ["CAR", "HYUNDAI", "SONATA", "쏘나타"], ["CAR", "KIA", "K5", "K5"],
  ["CAR", "GENESIS", "G80", "G80"], ["CAR", "BMW", "5_SERIES", "5시리즈"], ["CAR", "MERCEDES_BENZ", "E_CLASS", "E클래스"],
  ["TRUCK_SPECIAL", "HYUNDAI_COMMERCIAL", "PORTER2", "포터2"], ["TRUCK_SPECIAL", "HYUNDAI_COMMERCIAL", "MIGHTY", "마이티"],
  ["TRUCK_SPECIAL", "TATA_DAEWOO", "DEXEN", "더쎈"], ["BIKE", "HONDA", "PCX", "PCX"],
].map(([scope, makeKey, key, name], index) => ({
  id: `model_${scope.toLowerCase()}_${key.toLowerCase()}`,
  manufacturer_id: `make_${scope.toLowerCase()}_${makeKey.toLowerCase()}`,
  model_key: key,
  name_ko: name,
  name_en: key.replaceAll("_", " "),
  parent_model_id: null,
  sort_order: index + 1,
  status: "ACTIVE",
  created_at: now(),
  updated_at: now(),
}));

const legacyFieldMappings = [
  ["car", "maker_no", "car.make_id", "LEGACY_TO_MASTER_KEY"],
  ["car", "model_no", "car.model_id", "LEGACY_TO_MASTER_KEY"],
  ["car", "car_year", "car.model_year", "INTEGER"],
  ["car", "mileage", "car.mileage_km", "INTEGER_KM"],
  ["car", "fuel_code", "car.fuel_type", "CODE_MAP"],
  ["car", "gear_code", "car.transmission_type", "CODE_MAP"],
  ["car", "price", "car.sale_price", "KRW_INTEGER"],
].map(([table, column, variableKey, transformer], index) => ({
  id: `legacy_map_${index + 1}`,
  source_system: "BOBAEDREAM_USED_CAR_ADMIN",
  legacy_table: table,
  legacy_column: column,
  variable_item_key: variableKey,
  transformer_class: transformer,
  value_mapping_json: JSON.stringify({}),
  read_strategy: "LEGACY_AUTHORITATIVE",
  write_strategy: "LEGACY_FIRST",
  status: "ACTIVE",
  created_at: now(),
  updated_at: now(),
}));

export function buildSeedData() {
  return {
    registryRows,
    categories,
    categoryBindings,
    placements,
    variableItems,
    schemas: schemaPackages.map((item) => item.row),
    schemaItems: schemaPackages.flatMap((item) => item.items),
    manufacturers,
    models,
    legacyFieldMappings,
  };
}
