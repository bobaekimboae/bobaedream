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

const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
})[character]);

const roleCapabilities = {
  SUPER_ADMIN: ["design", "approve", "publish"],
  PRODUCT_OWNER: ["design"],
  CATEGORY_MANAGER: ["design"],
  QA_REVIEWER: ["approve"],
  PUBLISHER: ["publish"],
  READ_ONLY: []
};

const categoryNode = ({ key, name, depth, leaf = true, domain = "VEHICLE_LISTING", binding, primary, aliases = [], schemas = [], exclusions = [], sellers = [], products = [] }) => ({
  key, name, depth, leaf, domain, binding, primary, aliases, schemas, exclusions, sellers, products
});

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

const commonSchemas = ["FILTER", "REGISTRATION_FORM", "LIST_META", "DETAIL", "SELLER"];
const commonSellers = ["PRIVATE", "DEALER"];
const commonProducts = ["TOP_PLACEMENT", "PREMIUM_BADGE"];
const categoryTrees = {
  CAR: [
    categoryNode({ key: "USED_CAR", name: "중고차", depth: 0, leaf: false, binding: "VEHICLE_TYPE:CAR", primary: "USED_CAR", schemas: commonSchemas, sellers: ["PRIVATE", "DEALER", "DEALER_COMPANY"], products: commonProducts }),
    categoryNode({ key: "DOMESTIC_CAR", name: "국산차", depth: 1, binding: "VEHICLE_TYPE:CAR", primary: "USED_CAR/DOMESTIC_CAR", schemas: commonSchemas, sellers: commonSellers, products: commonProducts }),
    categoryNode({ key: "IMPORTED_CAR", name: "수입차", depth: 1, binding: "VEHICLE_TYPE:CAR + OVERLAY:IMPORT_OVERLAY", primary: "USED_CAR/IMPORTED_CAR", aliases: ["IMPORT_CAR_HOME"], schemas: commonSchemas, sellers: ["PRIVATE", "DEALER", "IMPORT_SPECIALIST"], products: commonProducts }),
    categoryNode({ key: "ELECTRIC_CAR", name: "전기차", depth: 1, binding: "VEHICLE_TYPE:CAR + OVERLAY:EV_OVERLAY", primary: "USED_CAR/ELECTRIC_CAR", aliases: ["ELECTRIC_CAR_HOME"], schemas: commonSchemas, sellers: commonSellers, products: commonProducts }),
    categoryNode({ key: "LEASE_USED_CAR", name: "리스중고차", depth: 1, binding: "VEHICLE_TYPE:CAR + TRANSACTION_TYPE:LEASE_TAKEOVER", primary: "USED_CAR/LEASE_USED_CAR", aliases: ["LEASE_HOME"], schemas: commonSchemas, sellers: ["DEALER", "LEASE_COMPANY"], products: ["TOP_PLACEMENT", "LEAD_FEE"] }),
    categoryNode({ key: "LUXURY_CAR", name: "럭셔리카", depth: 1, binding: "VEHICLE_TYPE:CAR + THEME_OVERLAY:LUXURY", primary: "USED_CAR/LUXURY_CAR", aliases: ["THEME_HOME/LUXURY"], schemas: commonSchemas, sellers: commonSellers, products: commonProducts }),
    categoryNode({ key: "SUPERCAR", name: "슈퍼카", depth: 1, binding: "VEHICLE_TYPE:CAR + THEME_OVERLAY:SUPERCAR", primary: "USED_CAR/SUPERCAR", aliases: ["THEME_HOME/SUPERCAR"], schemas: commonSchemas, sellers: ["DEALER", "SUPERCAR_SPECIALIST"], products: commonProducts }),
    categoryNode({ key: "CLASSIC_CAR", name: "클래식카", depth: 1, binding: "VEHICLE_TYPE:CAR + THEME_OVERLAY:CLASSIC_OLD", primary: "USED_CAR/CLASSIC_CAR", aliases: ["CLASSIC_HOME"], schemas: commonSchemas, sellers: ["PRIVATE", "CLASSIC_SPECIALIST"], products: commonProducts }),
    categoryNode({ key: "THEME_CAR", name: "테마별 차량", depth: 1, leaf: false, binding: "VEHICLE_TYPE:CAR + THEME_OVERLAY:*", primary: "USED_CAR/THEME_CAR", aliases: ["THEME_HOME"], schemas: commonSchemas, sellers: commonSellers, products: commonProducts }),
    categoryNode({ key: "BRAND_CERTIFIED_CAR", name: "브랜드인증 중고차", depth: 1, binding: "VEHICLE_TYPE:CAR + OVERLAY:BRAND_CERTIFIED_OVERLAY", primary: "USED_CAR/BRAND_CERTIFIED", aliases: ["BRAND_CERTIFIED_HOME"], schemas: commonSchemas, sellers: ["BRAND_CERTIFIED_DEALER"], products: ["CERTIFIED_BADGE", "TOP_PLACEMENT"] }),
    categoryNode({ key: "DEALER_COMPLEX_CAR", name: "매매단지별 중고차", depth: 1, binding: "VEHICLE_TYPE:CAR + SELLER_CHANNEL:DEALER_COMPLEX", primary: "USED_CAR/DEALER_COMPLEX", aliases: ["DEALER_COMPLEX_HOME"], schemas: commonSchemas, sellers: ["DEALER_COMPLEX", "DEALER_COMPANY"], products: ["DEALER_PAGE", "TOP_PLACEMENT"] })
  ],
  BIKE: [
    categoryNode({ key: "BIKE", name: "바이크", depth: 0, leaf: false, binding: "VEHICLE_TYPE:BIKE", primary: "BIKE", schemas: commonSchemas, sellers: ["PRIVATE", "BIKE_DEALER"], products: commonProducts }),
    categoryNode({ key: "BIKE_ONROAD", name: "온로드", depth: 1, leaf: false, binding: "VEHICLE_TYPE:BIKE", primary: "BIKE/ONROAD", schemas: commonSchemas, sellers: ["PRIVATE", "BIKE_DEALER"], products: commonProducts }),
    categoryNode({ key: "BIKE_SCOOTER", name: "스쿠터", depth: 2, binding: "VEHICLE_TYPE:BIKE", primary: "BIKE/ONROAD/SCOOTER", schemas: commonSchemas, sellers: ["PRIVATE", "BIKE_DEALER"], products: commonProducts }),
    categoryNode({ key: "BIKE_OFFROAD", name: "오프로드", depth: 1, binding: "VEHICLE_TYPE:BIKE", primary: "BIKE/OFFROAD", schemas: commonSchemas, sellers: ["PRIVATE", "BIKE_DEALER"], products: commonProducts }),
    categoryNode({ key: "ATV", name: "ATV", depth: 1, binding: "VEHICLE_TYPE:BIKE + SUBTYPE:ATV", primary: "BIKE/ATV", aliases: ["LEISURE/ATV"], schemas: commonSchemas, sellers: ["PRIVATE", "BIKE_DEALER"], products: commonProducts })
  ],
  TRUCK_SPECIAL: [
    categoryNode({ key: "TRUCK_SPECIAL", name: "트럭·특장", depth: 0, leaf: false, binding: "VEHICLE_TYPE:TRUCK_SPECIAL", primary: "TRUCK_SPECIAL", schemas: commonSchemas, sellers: ["PRIVATE", "COMMERCIAL_DEALER"], products: commonProducts }),
    categoryNode({ key: "TRUCK_CARGO", name: "화물트럭", depth: 1, leaf: false, binding: "VEHICLE_TYPE:TRUCK_SPECIAL", primary: "TRUCK_SPECIAL/CARGO", schemas: commonSchemas, sellers: ["PRIVATE", "COMMERCIAL_DEALER"], products: commonProducts }),
    categoryNode({ key: "TRUCK_CARGO_FLAT", name: "카고", depth: 2, binding: "VEHICLE_TYPE:TRUCK_SPECIAL", primary: "TRUCK_SPECIAL/CARGO/FLAT", schemas: commonSchemas, sellers: ["PRIVATE", "COMMERCIAL_DEALER"], products: commonProducts }),
    categoryNode({ key: "TRUCK_CARGO_WING", name: "윙바디", depth: 2, binding: "VEHICLE_TYPE:TRUCK_SPECIAL", primary: "TRUCK_SPECIAL/CARGO/WING", schemas: commonSchemas, sellers: ["PRIVATE", "COMMERCIAL_DEALER"], products: commonProducts }),
    categoryNode({ key: "SPECIAL_PURPOSE", name: "특장차", depth: 1, binding: "VEHICLE_TYPE:TRUCK_SPECIAL", primary: "TRUCK_SPECIAL/SPECIAL_PURPOSE", schemas: commonSchemas, sellers: ["COMMERCIAL_DEALER", "SPECIAL_BODY_VENDOR"], products: commonProducts })
  ],
  BUS: [
    categoryNode({ key: "BUS", name: "버스", depth: 0, leaf: false, binding: "VEHICLE_TYPE:BUS", primary: "BUS", aliases: ["TRUCK_SPECIAL/BUS"], schemas: commonSchemas, sellers: ["PRIVATE", "COMMERCIAL_DEALER"], products: commonProducts }),
    categoryNode({ key: "BUS_CITY", name: "시내·마을버스", depth: 1, binding: "VEHICLE_TYPE:BUS", primary: "BUS/CITY", aliases: ["TRUCK_SPECIAL/BUS/CITY"], schemas: commonSchemas, sellers: ["COMMERCIAL_DEALER"], products: commonProducts }),
    categoryNode({ key: "BUS_COACH", name: "전세·관광버스", depth: 1, binding: "VEHICLE_TYPE:BUS", primary: "BUS/COACH", aliases: ["TRUCK_SPECIAL/BUS/COACH"], schemas: commonSchemas, sellers: ["COMMERCIAL_DEALER"], products: commonProducts })
  ],
  CAMPING_CARAVAN: [
    categoryNode({ key: "CAMPING_CARAVAN", name: "캠핑카·카라반", depth: 0, leaf: false, binding: "VEHICLE_TYPE:CAMPING_CARAVAN", primary: "CAMPING_CARAVAN", aliases: ["TRUCK_SPECIAL/CAMPING"], schemas: commonSchemas, sellers: ["PRIVATE", "CAMPING_DEALER", "CONVERTER"], products: commonProducts }),
    categoryNode({ key: "MOTORHOME", name: "캠핑카", depth: 1, binding: "VEHICLE_TYPE:CAMPING_CARAVAN", primary: "CAMPING_CARAVAN/MOTORHOME", aliases: ["TRUCK_SPECIAL/CAMPING/MOTORHOME"], schemas: commonSchemas, sellers: ["PRIVATE", "CAMPING_DEALER", "CONVERTER"], products: commonProducts }),
    categoryNode({ key: "CARAVAN", name: "카라반", depth: 1, binding: "VEHICLE_TYPE:CAMPING_CARAVAN", primary: "CAMPING_CARAVAN/CARAVAN", schemas: commonSchemas, sellers: ["PRIVATE", "CAMPING_DEALER"], products: commonProducts }),
    categoryNode({ key: "CAMPING_TRAILER", name: "캠핑 트레일러", depth: 1, binding: "VEHICLE_TYPE:CAMPING_CARAVAN", primary: "CAMPING_CARAVAN/TRAILER", schemas: commonSchemas, sellers: ["PRIVATE", "CAMPING_DEALER"], products: commonProducts })
  ],
  CONSTRUCTION: [
    categoryNode({ key: "CONSTRUCTION", name: "건설기계", depth: 0, leaf: false, binding: "VEHICLE_TYPE:CONSTRUCTION", primary: "CONSTRUCTION", exclusions: ["ASSET_TYPE:PARTS_GOODS"], schemas: commonSchemas, sellers: ["PRIVATE", "EQUIPMENT_DEALER"], products: commonProducts }),
    categoryNode({ key: "EXCAVATOR", name: "굴착기", depth: 1, binding: "VEHICLE_TYPE:CONSTRUCTION + SUBTYPE:EXCAVATOR", primary: "CONSTRUCTION/EXCAVATOR", schemas: commonSchemas, sellers: ["PRIVATE", "EQUIPMENT_DEALER"], products: commonProducts }),
    categoryNode({ key: "LOADER", name: "로더", depth: 1, binding: "VEHICLE_TYPE:CONSTRUCTION + SUBTYPE:LOADER", primary: "CONSTRUCTION/LOADER", schemas: commonSchemas, sellers: ["PRIVATE", "EQUIPMENT_DEALER"], products: commonProducts })
  ],
  MATERIAL_HANDLING: [
    categoryNode({ key: "MATERIAL_HANDLING", name: "자재운반장비", depth: 0, leaf: false, binding: "VEHICLE_TYPE:MATERIAL_HANDLING", primary: "MATERIAL_HANDLING", schemas: commonSchemas, sellers: ["PRIVATE", "EQUIPMENT_DEALER"], products: commonProducts }),
    categoryNode({ key: "FORKLIFT", name: "지게차", depth: 1, binding: "VEHICLE_TYPE:MATERIAL_HANDLING + SUBTYPE:FORKLIFT", primary: "MATERIAL_HANDLING/FORKLIFT", aliases: ["CONSTRUCTION/FORKLIFT"], schemas: commonSchemas, sellers: ["PRIVATE", "EQUIPMENT_DEALER", "RENTAL_COMPANY"], products: commonProducts }),
    categoryNode({ key: "AERIAL_PLATFORM", name: "고소작업대", depth: 1, binding: "VEHICLE_TYPE:MATERIAL_HANDLING", primary: "MATERIAL_HANDLING/AERIAL_PLATFORM", schemas: commonSchemas, sellers: ["EQUIPMENT_DEALER", "RENTAL_COMPANY"], products: commonProducts }),
    categoryNode({ key: "PALLET_EQUIPMENT", name: "팔레트 장비", depth: 1, binding: "VEHICLE_TYPE:MATERIAL_HANDLING", primary: "MATERIAL_HANDLING/PALLET", schemas: commonSchemas, sellers: ["EQUIPMENT_DEALER"], products: commonProducts })
  ],
  ATTACHMENT: [
    categoryNode({ key: "ATTACHMENT", name: "어태치먼트", depth: 0, leaf: false, domain: "PARTS_LISTING", binding: "ASSET_TYPE:ATTACHMENT", primary: "CONSTRUCTION/ATTACHMENT", aliases: ["PARTS_GOODS/ATTACHMENT"], schemas: commonSchemas, sellers: ["PRIVATE", "EQUIPMENT_DEALER", "PARTS_VENDOR"], products: commonProducts }),
    categoryNode({ key: "EXCAVATOR_ATTACHMENT", name: "굴착기 어태치먼트", depth: 1, leaf: false, domain: "PARTS_LISTING", binding: "ASSET_TYPE:ATTACHMENT + EQUIPMENT:EXCAVATOR", primary: "CONSTRUCTION/ATTACHMENT/EXCAVATOR", aliases: ["PARTS_GOODS/ATTACHMENT/EXCAVATOR"], schemas: commonSchemas, sellers: ["PRIVATE", "EQUIPMENT_DEALER", "PARTS_VENDOR"], products: commonProducts }),
    categoryNode({ key: "BUCKET", name: "버킷", depth: 2, domain: "PARTS_LISTING", binding: "ASSET_TYPE:ATTACHMENT + SUBTYPE:BUCKET", primary: "CONSTRUCTION/ATTACHMENT/EXCAVATOR/BUCKET", aliases: ["PARTS_GOODS/ATTACHMENT/BUCKET"], schemas: commonSchemas, sellers: ["PRIVATE", "PARTS_VENDOR"], products: commonProducts }),
    categoryNode({ key: "BREAKER", name: "브레이커", depth: 2, domain: "PARTS_LISTING", binding: "ASSET_TYPE:ATTACHMENT + SUBTYPE:BREAKER", primary: "CONSTRUCTION/ATTACHMENT/EXCAVATOR/BREAKER", aliases: ["PARTS_GOODS/ATTACHMENT/BREAKER"], schemas: commonSchemas, sellers: ["PRIVATE", "PARTS_VENDOR"], products: commonProducts })
  ],
  PARTS_GOODS: [
    categoryNode({ key: "PARTS_GOODS", name: "부품·용품", depth: 0, leaf: false, domain: "PARTS_LISTING", binding: "ASSET_TYPE:PARTS_GOODS", primary: "PARTS_GOODS", exclusions: ["ALL_VEHICLES"], schemas: commonSchemas, sellers: ["PRIVATE", "PARTS_VENDOR"], products: ["TOP_PLACEMENT", "PREMIUM_BADGE", "SHOP_SUBSCRIPTION"] }),
    categoryNode({ key: "CAR_PARTS", name: "자동차 부품·용품", depth: 1, domain: "PARTS_LISTING", binding: "ASSET_TYPE:PARTS_GOODS + COMPATIBLE:CAR", primary: "PARTS_GOODS/CAR", schemas: commonSchemas, sellers: ["PRIVATE", "PARTS_VENDOR"], products: commonProducts }),
    categoryNode({ key: "BIKE_PARTS", name: "바이크 부품·용품", depth: 1, domain: "PARTS_LISTING", binding: "ASSET_TYPE:PARTS_GOODS + COMPATIBLE:BIKE", primary: "PARTS_GOODS/BIKE", schemas: commonSchemas, sellers: ["PRIVATE", "PARTS_VENDOR"], products: commonProducts }),
    categoryNode({ key: "TRUCK_PARTS", name: "트럭 부품·용품", depth: 1, domain: "PARTS_LISTING", binding: "ASSET_TYPE:PARTS_GOODS + COMPATIBLE:TRUCK_SPECIAL", primary: "PARTS_GOODS/TRUCK", schemas: commonSchemas, sellers: ["PRIVATE", "PARTS_VENDOR"], products: commonProducts }),
    categoryNode({ key: "BUS_PARTS", name: "버스 부품·용품", depth: 1, domain: "PARTS_LISTING", binding: "ASSET_TYPE:PARTS_GOODS + COMPATIBLE:BUS", primary: "PARTS_GOODS/BUS", schemas: commonSchemas, sellers: ["PRIVATE", "PARTS_VENDOR"], products: commonProducts }),
    categoryNode({ key: "CONSTRUCTION_PARTS", name: "건설기계 부품·용품", depth: 1, domain: "PARTS_LISTING", binding: "ASSET_TYPE:PARTS_GOODS + COMPATIBLE:CONSTRUCTION", primary: "PARTS_GOODS/CONSTRUCTION", schemas: commonSchemas, sellers: ["PRIVATE", "PARTS_VENDOR", "EQUIPMENT_DEALER"], products: commonProducts }),
    categoryNode({ key: "CAMPING_PARTS", name: "캠핑카 부품·용품", depth: 1, domain: "PARTS_LISTING", binding: "ASSET_TYPE:PARTS_GOODS + COMPATIBLE:CAMPING_CARAVAN", primary: "PARTS_GOODS/CAMPING", schemas: commonSchemas, sellers: ["PRIVATE", "PARTS_VENDOR", "CAMPING_DEALER"], products: commonProducts })
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
let selectedRole = "SUPER_ADMIN";
let issueFilter = "all";
let fieldFilter = "all";
let releaseFilter = "all";

function can(permission) {
  return roleCapabilities[selectedRole]?.includes(permission) ?? false;
}

function applyRolePreview() {
  document.querySelectorAll("[data-permission]").forEach((button) => {
    const allowed = can(button.dataset.permission);
    button.disabled = !allowed;
    button.title = allowed ? `${selectedRole} 권한으로 실행 가능` : `${selectedRole} 권한에서는 실행할 수 없습니다.`;
  });
}

function stateCell(state) {
  const meta = stateMeta[state];
  return `<span class="matrix-state ${escapeHtml(state)}" title="${escapeHtml(meta.label)}"><span class="material-symbols-rounded">${escapeHtml(meta.icon)}</span>${escapeHtml(meta.label)}</span>`;
}

function badge(tone, label) {
  return `<span class="state-badge ${escapeHtml(tone)}">${escapeHtml(label)}</span>`;
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
  const platform = document.querySelector("#matrix-platform").value;
  const release = document.querySelector("#matrix-release").value;
  const rows = vehicleTypes.filter((item) => {
    const states = policyKeys.map((key) => policyState(item, key, platform));
    const queryMatch = `${item.name} ${item.code}`.toLowerCase().includes(query);
    const requiredStates = requiredPolicyKeys.map((key) => policyState(item, key, platform));
    const statusMatch = status === "all" || (status === "missing" && states.includes("missing")) || (status === "review" && states.includes("review")) || (status === "ready" && requiredStates.every((value) => value === "done"));
    const summaryMatch = summaryFilter === "all"
      || (summaryFilter === "missing" && states.includes("missing"))
      || (summaryFilter === "review" && item.qa === "review")
      || (summaryFilter === "blocked" && item.platform === "review");
    const releaseMatch = release === "all" || item.release === release;
    return queryMatch && statusMatch && summaryMatch && releaseMatch && (phase === "all" || item.phase === phase);
  });

  document.querySelector("#matrix-body").innerHTML = rows.map((item) => `
    <tr data-type="${escapeHtml(item.code)}" class="${item.code === selectedType.code ? "selected" : ""}" tabindex="0">
      <td class="sticky-col"><div class="type-cell"><span class="type-icon"><span class="material-symbols-rounded">${escapeHtml(item.icon)}</span></span><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.code)}</small></span></div></td>
      ${policyKeys.map((key) => `<td>${stateCell(policyState(item, key, platform))}</td>`).join("")}
      <td><span class="release-tag ${item.release === "current" ? "current" : ""}">${escapeHtml(item.release)}</span></td>
    </tr>`).join("") || `<tr><td colspan="12"><div class="empty-state"><span class="material-symbols-rounded">search_off</span>조건에 맞는 차량유형이 없습니다.</div></td></tr>`;

  document.querySelector("#matrix-count").textContent = `(${rows.length})`;
  document.querySelector("#matrix-result-count").textContent = `총 ${rows.length}개 유형·자산`;
  document.querySelectorAll("#matrix-body tr[data-type]").forEach((row) => {
    const select = () => {
      selectedType = vehicleTypes.find((item) => item.code === row.dataset.type);
      inspectorTab = "inheritance";
      document.querySelector(".inspector").hidden = false;
      renderMatrix();
      renderInspector();
    };
    row.addEventListener("click", select);
    row.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") select(); });
  });
}

function policyState(item, key, platform) {
  if (key !== "platform" || platform === "ALL") return item[key];
  if (item.code === "CONSTRUCTION" && platform === "MOBILE_APP") return "review";
  if (item.code === "CAMPING_CARAVAN" && platform === "MOBILE_WEB") return "review";
  return "done";
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
  document.querySelectorAll("[data-inspector-tab]").forEach((button) => {
    const active = button.dataset.inspectorTab === inspectorTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  const target = document.querySelector("#inspector-content");

  if (inspectorTab === "inheritance") {
    const layers = [
      ["G", "GLOBAL", "전역 기본 정책", "v1.0"],
      ["V", "VEHICLE_TYPE", selectedType.name, "v8"],
      ["C", "CATEGORY_NODE", "대표 카테고리", "v5"],
      ["P", "PLACEMENT", "WEB / 기본 배치", "v3"],
      ["S", "SELLER", "DEALER 우선 정책", "v4"],
      ["L", "PLATFORM", document.querySelector("#matrix-platform").value, "v6"],
      ["F", "FALLBACK", "유형 기본 스키마", "v1"]
    ];
    target.innerHTML = `<div class="inherit-title">위에서 아래 순서로 덮어쓰기 · 일치 규칙이 없으면 FALLBACK 적용</div><ol class="inheritance-ladder">${layers.map((layer) => `<li><span class="step">${escapeHtml(layer[0])}</span><span><strong>${escapeHtml(layer[1])}</strong><small>${escapeHtml(layer[2])}</small></span><em>${escapeHtml(layer[3])}</em></li>`).join("")}</ol>`;
  } else if (inspectorTab === "gaps") {
    target.innerHTML = gaps.length ? `<div class="gap-list">${gaps.map((gap) => `<article class="gap-card ${gap.state}"><strong>${gap.label} · ${stateMeta[gap.state].label}</strong><small>${gap.state === "missing" ? "발행 전에 새 정의 또는 상속 규칙이 필요합니다." : "후보 버전이 QA 승인을 기다리고 있습니다."}</small></article>`).join("")}</div>` : `<div class="empty-state"><span class="material-symbols-rounded">verified</span>검수 또는 누락 항목이 없습니다.</div>`;
  } else {
    target.innerHTML = `<div class="history-list"><article class="history-card"><strong>상품 정책 검수 요청</strong><small>김태민 · 오늘 10:12 · candidate v1.1.0</small></article><article class="history-card"><strong>상세 스키마 필드 순서 변경</strong><small>박서윤 · 어제 16:42 · draft v9</small></article><article class="history-card"><strong>카테고리 배치 발행</strong><small>시스템 · 09-20 11:04 · current v1.0.0</small></article></div>`;
  }
}

function renderTypes() {
  const query = document.querySelector("#type-search").value.trim().toLowerCase();
  const namespace = document.querySelector("#type-namespace").value;
  const rows = vehicleTypes.filter((item) => `${item.name} ${item.code}`.toLowerCase().includes(query) && (namespace === "all" || item.namespace === namespace));
  document.querySelector("#types-body").innerHTML = rows.map((item, index) => `<tr><td>${String(index + 1).padStart(2, "0")}</td><td><code>${escapeHtml(item.code)}</code></td><td><strong>${escapeHtml(item.name)}</strong></td><td>${escapeHtml(item.namespace)}</td><td>${categoryTrees[item.code]?.length || 0}개</td><td>${badge("success", item.phase)}</td><td>${badge("success", "ACTIVE")}</td></tr>`).join("") || '<tr><td colspan="7"><div class="empty-state">조건에 맞는 유형이 없습니다.</div></td></tr>';
}

function renderCategoryTree(code = "CAR") {
  const tree = categoryTrees[code] || categoryTrees.CAR;
  document.querySelector("#category-tree").innerHTML = tree.map((node, index) => `<button class="tree-row depth-${node.depth} ${index === 0 ? "active" : ""}" data-node="${escapeHtml(node.key)}" aria-pressed="${index === 0 ? "true" : "false"}"><span class="material-symbols-rounded">${node.leaf ? "sell" : "folder"}</span><strong>${escapeHtml(node.name)}</strong><code>${escapeHtml(node.key)}</code>${node.aliases.length ? `<span class="alias-count" title="Alias placement ${node.aliases.length}개">+${node.aliases.length}</span>` : ""}</button>`).join("");
  document.querySelectorAll(".tree-row").forEach((row) => row.addEventListener("click", () => {
    document.querySelectorAll(".tree-row").forEach((item) => {
      item.classList.remove("active");
      item.setAttribute("aria-pressed", "false");
    });
    row.classList.add("active");
    row.setAttribute("aria-pressed", "true");
    renderCategoryDetail(tree.find((node) => node.key === row.dataset.node));
  }));
  document.querySelector(".tree-row")?.click();
}

function renderCategoryDetail(node) {
  if (!node) return;
  document.querySelector("#node-title").textContent = node.name;
  document.querySelector("#node-key").value = node.key;
  document.querySelector("#node-name").value = node.name;
  document.querySelector("#node-depth").value = String(node.depth + 1);
  document.querySelector("#node-leaf").value = node.leaf ? "YES" : "NO";
  document.querySelector("#node-domain").value = node.domain;
  document.querySelector("#node-binding").value = node.binding;
  document.querySelector("#node-primary-placement").value = node.primary;
  document.querySelector("#node-alias-placements").value = node.aliases.join(", ") || "없음";
  document.querySelector("#node-schemas").value = node.schemas.join(", ") || "상위 유형 기본값";
  document.querySelector("#node-exclusions").value = node.exclusions.join(", ") || "없음";
  document.querySelector("#node-sellers").innerHTML = node.sellers.map((value) => `<span>${escapeHtml(value)}</span>`).join("") || "<em>상위 정책 상속</em>";
  document.querySelector("#node-products").innerHTML = node.products.map((value) => `<span>${escapeHtml(value)}</span>`).join("") || "<em>없음</em>";
}

function renderStaticTables() {
  document.querySelector("#operations-queue").innerHTML = queueRows.map((row) => `<tr><td><span class="priority ${escapeHtml(row[0])}"><span class="material-symbols-rounded">${row[0] === "high" ? "error" : row[0] === "mid" ? "warning" : "info"}</span>${escapeHtml(row[1])}</span></td><td><strong>${escapeHtml(row[2])}</strong></td><td><code>${escapeHtml(row[3])}</code></td><td>${escapeHtml(row[4])}</td><td>${escapeHtml(row[5])}</td><td>${escapeHtml(row[6])}</td><td><button class="row-action demo-action">${escapeHtml(row[7])}</button></td></tr>`).join("");
  renderIssues();
  renderFields();
  renderSchemas();
  renderReleaseDiff();
  document.querySelector("#mapping-list").innerHTML = mappings.map((row) => `<div class="mapping-row"><code>${escapeHtml(row[0])}</code><span class="material-symbols-rounded">arrow_forward</span><code>${escapeHtml(row[1])}</code>${badge(row[2], row[3])}</div>`).join("");
  document.querySelector("#audit-list").innerHTML = auditEvents.map((row) => `<article class="timeline-item"><span class="material-symbols-rounded">verified</span><time>${escapeHtml(row[0])}</time><div><strong>${escapeHtml(row[1])}</strong><small>${escapeHtml(row[2])}</small></div><code>${escapeHtml(row[3])}</code></article>`).join("");
}

function renderReleaseDiff() {
  const rows = releaseDiff.filter((row) => releaseFilter === "all"
    || (releaseFilter === "schema" && ["FIELD", "SCHEMA"].includes(row[0]))
    || (releaseFilter === "axis" && row[0] === "POLICY")
    || (releaseFilter === "rule" && row[0] === "RULE"));
  document.querySelector("#release-diff").innerHTML = rows.map((row) => `<tr><td><code>${escapeHtml(row[0])}</code></td><td><strong>${escapeHtml(row[1])}</strong></td><td>${escapeHtml(row[2])}</td><td>${escapeHtml(row[3])}건</td><td>${escapeHtml(row[4])}</td><td>${escapeHtml(row[5])}</td><td>${badge(row[6], row[7])}</td></tr>`).join("") || '<tr><td colspan="7"><div class="empty-state">조건에 맞는 변경이 없습니다.</div></td></tr>';
}

function renderIssues() {
  const rows = issueRows.filter((row) => issueFilter === "all"
    || (issueFilter === "review" && ["QA_REVIEW", "PLATFORM_DIFF"].includes(row[2]))
    || (issueFilter === "mapping" && row[2] === "MAPPING_MISMATCH")
    || (issueFilter === "mine" && row[5] === "김태민"));
  document.querySelector("#issues-body").innerHTML = rows.map((row) => `<tr><td>${badge(row[0], row[1])}</td><td><code>${escapeHtml(row[2])}</code></td><td><strong>${escapeHtml(row[3])}</strong></td><td>${escapeHtml(row[4])}</td><td>${escapeHtml(row[5])}</td><td>${escapeHtml(row[6])}</td><td>${escapeHtml(row[7])}</td></tr>`).join("") || '<tr><td colspan="7"><div class="empty-state">조건에 맞는 작업이 없습니다.</div></td></tr>';
}

function renderFields() {
  const rows = fields.filter((row) => fieldFilter === "all"
    || (fieldFilter === "required" && row[4] === "REQUIRED")
    || (fieldFilter === "optional" && ["OPTIONAL", "CONDITIONAL"].includes(row[4]))
    || (fieldFilter === "review" && row[7] !== "PUBLISHED"));
  document.querySelector("#fields-body").innerHTML = rows.map((row) => `<tr><td><code>${escapeHtml(row[0])}</code></td><td><strong>${escapeHtml(row[1])}</strong></td><td>${escapeHtml(row[2])}</td><td>${escapeHtml(row[3])}</td><td>${escapeHtml(row[4])}</td><td>${escapeHtml(row[5])}</td><td>${badge(row[6], row[7])}</td></tr>`).join("") || '<tr><td colspan="7"><div class="empty-state">조건에 맞는 필드가 없습니다.</div></td></tr>';
}

function renderSchemas() {
  const query = document.querySelector("#schema-search").value.trim().toLowerCase();
  const type = document.querySelector("#schema-type-filter").value;
  const status = document.querySelector("#schema-status-filter").value;
  const rows = schemas.filter((row) => `${row[0]} ${row[1]} ${row[2]}`.toLowerCase().includes(query)
    && (type === "all" || row[1] === type)
    && (status === "all" || row[6] === status));
  document.querySelector("#schemas-body").innerHTML = rows.map((row) => `<tr><td><strong>${escapeHtml(row[0])}</strong></td><td><code>${escapeHtml(row[1])}</code></td><td>${escapeHtml(row[2])}</td><td>${escapeHtml(row[3])}</td><td>${escapeHtml(row[4])}개</td><td>${badge(row[5], row[6])}</td><td>${escapeHtml(row[7])}</td><td><button class="row-action demo-action">상세</button></td></tr>`).join("") || '<tr><td colspan="8"><div class="empty-state">조건에 맞는 스키마가 없습니다.</div></td></tr>';
  applyRolePreview();
}

function renderResolver() {
  const legacy = document.querySelector("#legacy-category").value;
  const fuel = document.querySelector("#fuel").value;
  const listingStatus = document.querySelector("#listing-status").value;
  const price = Math.max(0, Number(document.querySelector("#price").value) || 0);
  const sellerType = document.querySelector("#seller-type").value;
  const map = {
    CAR_IMPORTED: ["CAR", "IMPORTED_CAR", "R-CAR-014", ["USED_CAR", "IMPORTED_CAR", "IMPORT_CAR_HOME"]],
    TRUCK_CARGO: ["TRUCK_SPECIAL", "TRUCK_CARGO_FLAT", "R-TRUCK-007", ["TRUCK_SPECIAL", "TRUCK_CARGO_FLAT"]],
    BIKE_SCOOTER: ["BIKE", "BIKE_SCOOTER", "R-BIKE-003", ["BIKE", "BIKE_SCOOTER"]]
  }[legacy];
  const placements = listingStatus === "DRAFT" ? [] : [...map[3]];
  if (listingStatus !== "DRAFT" && legacy === "CAR_IMPORTED" && fuel === "ELECTRIC") placements.push("ELECTRIC_CAR");
  const matched = placements.length > 0;
  const state = document.querySelector("#resolver-state");
  state.textContent = matched ? "MATCHED" : "PUBLIC EXCLUDED";
  state.className = `state-badge ${matched ? "success" : "warning"}`;
  const placementMarkup = matched
    ? placements.map((value) => `<b>${escapeHtml(value)}</b>`).join("")
    : "<em>DRAFT 매물은 공개 placement에 노출되지 않습니다.</em>";
  document.querySelector("#resolver-result").innerHTML = `<div class="result-stack"><div class="result-main"><small>resolved_vehicle_type</small><strong>${escapeHtml(map[0])}</strong><code>category_node · ${escapeHtml(map[1])}</code></div><div class="result-section"><span>노출 위치</span><div class="result-chips">${placementMarkup}</div></div><div class="evidence-list"><div><span>적용 규칙</span><strong>${escapeHtml(map[2])}</strong></div><div><span>정책 버전</span><strong>sample v1.0.0-demo</strong></div><div><span>판정 방식</span><strong>규칙 일치 · 결정론적</strong></div><div><span>입력 상태</span><strong>${escapeHtml(listingStatus)} · ${escapeHtml(sellerType)} · ${price.toLocaleString("ko-KR")}만원</strong></div><div><span>상속 경로</span><strong>GLOBAL → TYPE → CATEGORY → PLACEMENT</strong></div><div><span>Fallback</span><strong>TYPE_DEFAULT</strong></div><div><span>처리 모드</span><strong>READ_ONLY SHADOW</strong></div></div></div>`;
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
["matrix-search", "matrix-status", "matrix-phase", "matrix-platform", "matrix-release"].forEach((id) => document.querySelector(`#${id}`).addEventListener(id === "matrix-search" ? "input" : "change", () => {
  renderMatrix();
  renderInspector();
}));
document.querySelector("#type-search").addEventListener("input", renderTypes);
document.querySelector("#type-namespace").addEventListener("change", renderTypes);
document.querySelectorAll("[data-inspector-tab]").forEach((button) => button.addEventListener("click", () => { inspectorTab = button.dataset.inspectorTab; renderInspector(); }));
document.querySelector("#inspector-close").addEventListener("click", () => { document.querySelector(".inspector").hidden = true; });

const categorySelect = document.querySelector("#category-type");
categorySelect.innerHTML = Object.keys(categoryTrees).map((code) => `<option value="${code}">${vehicleTypes.find((item) => item.code === code).name}</option>`).join("");
categorySelect.addEventListener("change", () => renderCategoryTree(categorySelect.value));
document.querySelector("#run-resolver").addEventListener("click", renderResolver);
document.querySelector("#legacy-category").addEventListener("change", renderResolver);
document.querySelector("#fuel").addEventListener("change", renderResolver);
document.querySelector("#listing-status").addEventListener("change", renderResolver);
document.querySelector("#price").addEventListener("input", renderResolver);
document.querySelector("#seller-type").addEventListener("change", renderResolver);
document.querySelector("#user-menu").addEventListener("click", () => openDemo("사용자 메뉴", `${selectedRole} 권한을 미리 보는 공개 데모입니다. 계정·세션 기능은 실서버 관리자에서만 제공됩니다.`));
document.querySelector("#role-select").addEventListener("change", (event) => {
  selectedRole = event.target.value;
  applyRolePreview();
  openDemo("권한 미리보기", `${selectedRole} 권한 기준으로 실행 버튼 활성 상태를 반영했습니다. 공개 데모에서는 데이터 변경이 저장되지 않습니다.`);
});

document.querySelectorAll("[data-issue-filter]").forEach((button) => button.addEventListener("click", () => {
  issueFilter = button.dataset.issueFilter;
  document.querySelectorAll("[data-issue-filter]").forEach((item) => item.classList.toggle("active", item === button));
  renderIssues();
}));
document.querySelectorAll("[data-field-filter]").forEach((button) => button.addEventListener("click", () => {
  fieldFilter = button.dataset.fieldFilter;
  document.querySelectorAll("[data-field-filter]").forEach((item) => item.classList.toggle("active", item === button));
  renderFields();
}));
document.querySelector("#schema-search").addEventListener("input", renderSchemas);
document.querySelector("#schema-type-filter").addEventListener("change", renderSchemas);
document.querySelector("#schema-status-filter").addEventListener("change", renderSchemas);
document.querySelector("#check-integration").addEventListener("click", () => {
  document.querySelector("#integration-checkpoint").textContent = new Date().toLocaleString("ko-KR", { hour12: false });
  document.querySelector("#integration-state").textContent = "확인 완료";
});
document.querySelector("#refresh-operations").addEventListener("click", () => openDemo("운영 현황 갱신", `공개 데모 데이터를 ${new Date().toLocaleTimeString("ko-KR", { hour12: false })} 기준으로 다시 계산했습니다.`));
document.querySelectorAll("[data-operation-filter]").forEach((button) => button.addEventListener("click", () => {
  issueFilter = button.dataset.operationFilter;
  document.querySelectorAll("[data-issue-filter]").forEach((item) => item.classList.toggle("active", item.dataset.issueFilter === issueFilter));
  renderIssues();
  showView("issues");
}));

document.querySelectorAll(".help-button").forEach((button) => button.addEventListener("click", () => openDemo("매트릭스 가이드", "행은 차량유형, 열은 운영 정책입니다. 완료·검수·누락 상태를 선택하면 오른쪽에서 상속 근거와 작업 대상을 확인할 수 있습니다.")));
document.querySelector("#add-type").addEventListener("click", () => openDemo("차량유형 추가", "실서버에서는 안정된 시스템 키, 네임스페이스, 출시 단계 입력 후 승인 워크플로가 시작됩니다."));
document.querySelector("#add-node").addEventListener("click", () => openDemo("카테고리 노드 추가", "의미 노드를 만든 뒤 Primary placement와 필요한 Alias placement를 별도로 연결합니다."));
document.querySelector("#add-field").addEventListener("click", () => openDemo("필드 정의", "필드 키·한국어명·데이터형·UI 컴포넌트·단위·검증·선택값과 한국 적용 근거를 등록합니다."));
document.querySelector("#edit-schema").addEventListener("click", () => openDemo("스키마 편집", `${selectedType.name}의 현재 Published 정의는 직접 수정하지 않습니다. 새 Draft 버전을 생성해 검수합니다.`));
document.querySelector("#new-schema").addEventListener("click", () => openDemo("Draft 생성", "새 스키마 버전을 만든 뒤 자동 검증 → QA 승인 → Release Bundle 순서로 배포합니다."));
document.querySelector("#qa-approve").addEventListener("click", () => openDemo("QA 승인", "실제 승인에는 QA_REVIEWER 권한과 사유 기록이 필요하며 감사 로그에 영구 저장됩니다."));
document.querySelectorAll(".view button.primary:not(#run-resolver), .demo-action").forEach((button) => {
  if (!["add-type", "add-node", "add-field", "edit-schema", "new-schema", "qa-approve"].includes(button.id) && !button.dataset.viewJump) button.addEventListener("click", () => openDemo());
});

document.querySelectorAll("[data-release-filter]").forEach((button) => button.addEventListener("click", () => {
  releaseFilter = button.dataset.releaseFilter;
  document.querySelectorAll("[data-release-filter]").forEach((item) => item.classList.toggle("active", item === button));
  renderReleaseDiff();
}));

renderStaticTables();
const currentDate = new Date();
document.querySelector("#current-date").dateTime = currentDate.toISOString().slice(0, 10);
document.querySelector("#current-date").textContent = currentDate.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" });
renderTypes();
renderCategoryTree();
renderMatrix();
renderInspector();
renderResolver();
applyRolePreview();
