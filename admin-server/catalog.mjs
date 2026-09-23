import { createHash, randomUUID } from "node:crypto";

export const NAMESPACES = Object.freeze([
  "VEHICLE_TYPE",
  "ASSET_TYPE",
  "MENU_ALIAS",
  "OVERLAY",
  "THEME_OVERLAY",
  "TRANSACTION_TYPE",
  "SELLER_CHANNEL",
  "SERVICE_BM",
]);

export const SCHEMA_TYPES = Object.freeze([
  "FILTER",
  "REGISTRATION_FORM",
  "LIST_META",
  "DETAIL",
  "OPTION",
  "SELLER",
  "PAID_PRODUCT",
  "MAKE_MODEL",
  "QA_CHECKLIST",
  "PLATFORM_DIFF",
]);

export const PLATFORMS = Object.freeze(["PC_WEB", "MOBILE_WEB", "MOBILE_APP", "ADMIN", "ALL"]);
export const WORKFLOW_STATUSES = Object.freeze([
  "DRAFT",
  "REVIEW_REQUESTED",
  "QA_APPROVED",
  "PUBLISHED",
  "ARCHIVED",
  "ROLLED_BACK",
]);

export const ROLES = Object.freeze([
  "SUPER_ADMIN",
  "PRODUCT_OWNER",
  "CATEGORY_MANAGER",
  "QA_REVIEWER",
  "PUBLISHER",
  "READ_ONLY",
]);

const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ["read", "write", "request_review", "approve", "publish", "rollback"],
  PRODUCT_OWNER: ["read", "write", "request_review"],
  CATEGORY_MANAGER: ["read", "write", "request_review"],
  QA_REVIEWER: ["read", "approve"],
  PUBLISHER: ["read", "publish", "rollback"],
  READ_ONLY: ["read"],
};

export function assertPermission(role, permission) {
  const normalized = ROLES.includes(role) ? role : "READ_ONLY";
  if (!ROLE_PERMISSIONS[normalized].includes(permission)) {
    const error = new Error(`${normalized} role cannot perform ${permission}`);
    error.statusCode = 403;
    error.code = "forbidden";
    throw error;
  }
}

export function parseJson(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = canonicalize(value[key]);
        return result;
      }, {});
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function schemaHash(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

export function makeId(prefix) {
  return `${prefix}_${randomUUID()}`;
}

export function registryRef(namespace, systemKey) {
  return `${namespace}:${systemKey}`;
}

export function validateRegistryItem(item) {
  const errors = [];
  if (!NAMESPACES.includes(item.namespace)) errors.push("invalid namespace");
  if (!/^[A-Z][A-Z0-9_]*$/.test(item.system_key || "")) errors.push("system_key must be uppercase snake case");
  if (!item.name_ko) errors.push("name_ko is required");

  const forbiddenVehicleTypes = new Set([
    "IMPORT_CAR",
    "EV_OVERLAY",
    "BRAND_CERTIFIED_CAR",
    "DEALER_COMPLEX_CAR",
    "CLASSIC_OLD",
    "DEALER",
    "DEALER_COMPANY",
    "DEALER_COMPLEX",
    "DIRECT_STORE",
    "PARTS_GOODS",
    "ATTACHMENT",
  ]);
  if (item.namespace === "VEHICLE_TYPE" && forbiddenVehicleTypes.has(item.system_key)) {
    errors.push(`${item.system_key} cannot be stored as VEHICLE_TYPE`);
  }
  return errors;
}

export function validateSchemaTransition(current, action) {
  const allowed = {
    request_review: ["DRAFT"],
    approve: ["REVIEW_REQUESTED"],
    publish: ["QA_APPROVED"],
    archive: ["PUBLISHED", "ROLLED_BACK"],
    rollback: ["PUBLISHED"],
  };
  if (!allowed[action]?.includes(current)) {
    const error = new Error(`cannot ${action} schema from ${current}`);
    error.statusCode = 409;
    error.code = "invalid_workflow_transition";
    throw error;
  }
}

export function normalizeDbRow(row) {
  if (!row) return row;
  const result = { ...row };
  for (const [key, value] of Object.entries(result)) {
    if (key.endsWith("_json")) result[key] = parseJson(value, key.endsWith("s_json") ? [] : null);
    if (key.startsWith("is_") || key.endsWith("_enabled") || key.endsWith("_visible")) {
      if (value === 0 || value === 1) result[key] = Boolean(value);
    }
  }
  return result;
}

export function classifyListing(listing, categoryKeys, placementsByCategory) {
  const categories = new Set();
  const add = (key) => {
    if (categoryKeys.has(key)) categories.add(key);
  };

  if (listing.listing_domain === "VEHICLE_LISTING") add("ALL_VEHICLES");
  if (listing.listing_domain === "PARTS_LISTING" && listing.asset_type_key === "PARTS_GOODS") add("PARTS_GOODS");

  switch (listing.vehicle_type_key) {
    case "CAR":
      add("USED_CAR");
      add(listing.origin_type === "IMPORT" ? "IMPORTED_CAR" : "DOMESTIC_CAR");
      if (listing.fuel_type === "ELECTRIC") add("ELECTRIC_CAR");
      if (listing.transaction_type === "LEASE_TAKEOVER") add("LEASE_USED_CAR");
      if (listing.certification_type === "BRAND_CERTIFIED") add("BRAND_CERTIFIED_CAR");
      if (listing.seller_channel === "DEALER_COMPLEX") add("DEALER_COMPLEX_CAR");
      for (const theme of listing.theme_keys || []) {
        if (theme === "CLASSIC_OLD") add("CLASSIC_CAR");
        if (theme === "LUXURY") add("LUXURY_CAR");
        if (theme === "SUPERCAR") add("SUPERCAR");
        add("THEME_CAR");
      }
      break;
    case "BIKE":
      add("BIKE");
      if (listing.asset_subtype === "ATV") add("ATV");
      break;
    case "TRUCK_SPECIAL":
      add("TRUCK_SPECIAL");
      break;
    case "BUS":
      add("BUS");
      break;
    case "CAMPING_CARAVAN":
      add("CAMPING_CARAVAN");
      break;
    case "CONSTRUCTION":
      add("CONSTRUCTION");
      break;
    case "MATERIAL_HANDLING":
      add("MATERIAL_HANDLING");
      if (listing.asset_subtype === "FORKLIFT") add("FORKLIFT");
      break;
    default:
      break;
  }

  if (listing.asset_type_key === "ATTACHMENT") {
    add("ATTACHMENT");
  }

  if (listing.asset_type_key === "PARTS_GOODS") {
    const compatibleCategory = {
      CAR: "CAR_PARTS",
      BIKE: "BIKE_PARTS",
      TRUCK_SPECIAL: "TRUCK_PARTS",
      BUS: "BUS_PARTS",
      CONSTRUCTION: "CONSTRUCTION_PARTS",
      CAMPING_CARAVAN: "CAMPING_PARTS",
    }[listing.compatible_vehicle_type];
    if (compatibleCategory) add(compatibleCategory);
  }

  const placementKeys = new Set();
  for (const categoryKey of categories) {
    for (const placementKey of placementsByCategory.get(categoryKey) || []) placementKeys.add(placementKey);
  }

  return { categoryNodeKeys: [...categories], placementKeys: [...placementKeys] };
}
