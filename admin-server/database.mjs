import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { buildSeedData } from "./seed-data.mjs";
import { makeId, normalizeDbRow } from "./catalog.mjs";

const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS registry_items (
  id TEXT PRIMARY KEY,
  namespace TEXT NOT NULL,
  system_key TEXT NOT NULL,
  name_ko TEXT NOT NULL,
  name_en TEXT,
  parent_id TEXT REFERENCES registry_items(id),
  launch_status TEXT NOT NULL,
  status TEXT NOT NULL,
  display_scope_json TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(namespace, system_key)
);

CREATE TABLE IF NOT EXISTS category_nodes (
  id TEXT PRIMARY KEY,
  category_node_key TEXT NOT NULL UNIQUE,
  parent_category_node_id TEXT REFERENCES category_nodes(id),
  category_name_ko TEXT NOT NULL,
  category_name_en TEXT,
  slug TEXT NOT NULL UNIQUE,
  depth INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  listing_domain TEXT NOT NULL,
  pc_visible INTEGER NOT NULL DEFAULT 1,
  mobile_visible INTEGER NOT NULL DEFAULT 1,
  app_visible INTEGER NOT NULL DEFAULT 1,
  registration_enabled INTEGER NOT NULL DEFAULT 1,
  search_enabled INTEGER NOT NULL DEFAULT 1,
  list_enabled INTEGER NOT NULL DEFAULT 1,
  detail_enabled INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL,
  launch_phase TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS category_node_bindings (
  id TEXT PRIMARY KEY,
  category_node_id TEXT NOT NULL REFERENCES category_nodes(id),
  registry_item_id TEXT NOT NULL REFERENCES registry_items(id),
  binding_role TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(category_node_id, registry_item_id, binding_role)
);

CREATE TABLE IF NOT EXISTS category_placements (
  id TEXT PRIMARY KEY,
  placement_key TEXT NOT NULL UNIQUE,
  category_node_id TEXT NOT NULL REFERENCES category_nodes(id),
  parent_placement_id TEXT REFERENCES category_placements(id),
  platform TEXT NOT NULL,
  menu_name_ko TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  exclusion_registry_refs_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS variable_items (
  id TEXT PRIMARY KEY,
  item_key TEXT NOT NULL UNIQUE,
  variable_group TEXT NOT NULL,
  item_name_ko TEXT NOT NULL,
  item_name_en TEXT,
  screen_label TEXT NOT NULL,
  ui_component TEXT NOT NULL,
  data_type TEXT NOT NULL,
  unit TEXT,
  option_set_key TEXT,
  validation_rules_json TEXT NOT NULL DEFAULT '{}',
  source_site TEXT NOT NULL,
  source_url TEXT NOT NULL,
  korea_applicability TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schemas (
  id TEXT PRIMARY KEY,
  schema_type TEXT NOT NULL,
  vehicle_type_key TEXT,
  asset_type_key TEXT,
  category_node_key TEXT,
  platform TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  workflow_status TEXT NOT NULL,
  publication_status TEXT NOT NULL,
  schema_hash TEXT,
  fallback_schema_id TEXT REFERENCES schemas(id),
  title TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(schema_type, vehicle_type_key, asset_type_key, category_node_key, platform, schema_version)
);

CREATE TABLE IF NOT EXISTS schema_items (
  id TEXT PRIMARY KEY,
  schema_id TEXT NOT NULL REFERENCES schemas(id) ON DELETE CASCADE,
  variable_item_id TEXT NOT NULL REFERENCES variable_items(id),
  item_order INTEGER NOT NULL,
  section_key TEXT NOT NULL,
  exposure_type TEXT NOT NULL,
  required_level TEXT NOT NULL,
  is_visible INTEGER NOT NULL DEFAULT 1,
  conditional_rules_json TEXT NOT NULL DEFAULT '[]',
  validation_rules_json TEXT NOT NULL DEFAULT '{}',
  display_rules_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(schema_id, variable_item_id)
);

CREATE TABLE IF NOT EXISTS publish_versions (
  id TEXT PRIMARY KEY,
  schema_id TEXT NOT NULL REFERENCES schemas(id),
  schema_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  target_key TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  schema_hash TEXT NOT NULL,
  fallback_version TEXT,
  cache_ttl INTEGER NOT NULL DEFAULT 300,
  published_json_snapshot TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  published_by TEXT NOT NULL,
  published_at TEXT NOT NULL,
  rolled_back_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_publish_active
ON publish_versions(schema_type, platform, target_key, is_active);

CREATE TABLE IF NOT EXISTS manufacturers (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL,
  manufacturer_key TEXT NOT NULL,
  name_ko TEXT NOT NULL,
  name_en TEXT,
  country_code TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(scope_key, manufacturer_key)
);

CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  manufacturer_id TEXT NOT NULL REFERENCES manufacturers(id),
  model_key TEXT NOT NULL,
  name_ko TEXT NOT NULL,
  name_en TEXT,
  parent_model_id TEXT REFERENCES models(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(manufacturer_id, model_key)
);

CREATE TABLE IF NOT EXISTS legacy_field_mappings (
  id TEXT PRIMARY KEY,
  source_system TEXT NOT NULL,
  legacy_table TEXT NOT NULL,
  legacy_column TEXT NOT NULL,
  variable_item_key TEXT NOT NULL REFERENCES variable_items(item_key),
  transformer_class TEXT NOT NULL,
  value_mapping_json TEXT NOT NULL DEFAULT '{}',
  read_strategy TEXT NOT NULL,
  write_strategy TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(source_system, legacy_table, legacy_column)
);

CREATE TABLE IF NOT EXISTS listing_read_models (
  listing_id TEXT PRIMARY KEY,
  listing_domain TEXT NOT NULL,
  vehicle_type_key TEXT,
  asset_type_key TEXT,
  category_node_keys_json TEXT NOT NULL,
  overlay_keys_json TEXT NOT NULL DEFAULT '[]',
  attributes_json TEXT NOT NULL DEFAULT '{}',
  resolution_version TEXT NOT NULL,
  source_updated_at TEXT,
  projected_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS listing_category_resolutions (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  category_node_key TEXT NOT NULL,
  assignment_type TEXT NOT NULL,
  assignment_source TEXT NOT NULL,
  resolution_version TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  display_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE(listing_id, category_node_key, resolution_version)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  aggregate_version TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  published_at TEXT,
  created_at TEXT NOT NULL
);
`;

export class AdminDatabase {
  constructor(filePath = process.env.ADMIN_DB_PATH || "./data/category-admin.sqlite") {
    this.filePath = filePath;
    if (filePath !== ":memory:") mkdirSync(dirname(filePath), { recursive: true });
    this.db = new DatabaseSync(filePath);
    this.db.exec(SCHEMA_SQL);
  }

  close() {
    this.db.close();
  }

  transaction(callback) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = callback();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  count(table) {
    return Number(this.db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count);
  }

  all(table, orderBy = "created_at ASC") {
    return this.db.prepare(`SELECT * FROM ${table} ORDER BY ${orderBy}`).all().map(normalizeDbRow);
  }

  get(table, id) {
    return normalizeDbRow(this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id));
  }

  getBy(table, column, value) {
    return normalizeDbRow(this.db.prepare(`SELECT * FROM ${table} WHERE ${column} = ?`).get(value));
  }

  insert(table, row) {
    const keys = Object.keys(row);
    const placeholders = keys.map(() => "?").join(", ");
    this.db.prepare(`INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`).run(...keys.map((key) => row[key]));
    if (row.id) return this.get(table, row.id);
    if (row.listing_id) return normalizeDbRow(this.db.prepare(`SELECT * FROM ${table} WHERE listing_id = ?`).get(row.listing_id));
    return normalizeDbRow(row);
  }

  update(table, id, patch) {
    const keys = Object.keys(patch);
    if (!keys.length) return this.get(table, id);
    this.db.prepare(`UPDATE ${table} SET ${keys.map((key) => `${key} = ?`).join(", ")} WHERE id = ?`).run(...keys.map((key) => patch[key]), id);
    return this.get(table, id);
  }

  audit({ actorId, actorRole, action, entityType, entityId, before = null, after = null }) {
    return this.insert("audit_logs", {
      id: makeId("audit"),
      actor_id: actorId,
      actor_role: actorRole,
      action,
      entity_type: entityType,
      entity_id: entityId,
      before_json: before ? JSON.stringify(before) : null,
      after_json: after ? JSON.stringify(after) : null,
      created_at: new Date().toISOString(),
    });
  }

  emit(eventType, aggregateId, aggregateVersion, payload) {
    const id = makeId("event");
    return this.insert("outbox_events", {
      id,
      event_type: eventType,
      aggregate_id: aggregateId,
      aggregate_version: aggregateVersion,
      payload_json: JSON.stringify(payload),
      idempotency_key: `${eventType}:${aggregateId}:${aggregateVersion}`,
      published_at: null,
      created_at: new Date().toISOString(),
    });
  }

  seed({ force = false } = {}) {
    if (force) {
      this.db.exec(`
        DELETE FROM listing_category_resolutions;
        DELETE FROM listing_read_models;
        DELETE FROM outbox_events;
        DELETE FROM audit_logs;
        DELETE FROM publish_versions;
        DELETE FROM schema_items;
        DELETE FROM schemas;
        DELETE FROM legacy_field_mappings;
        DELETE FROM models;
        DELETE FROM manufacturers;
        DELETE FROM variable_items;
        DELETE FROM category_placements;
        DELETE FROM category_node_bindings;
        DELETE FROM category_nodes;
        DELETE FROM registry_items;
      `);
    }
    if (this.count("registry_items") > 0) return false;

    const seed = buildSeedData();
    this.transaction(() => {
      for (const row of seed.registryRows) this.insert("registry_items", row);
      for (const row of seed.categories) this.insert("category_nodes", row);
      for (const row of seed.categoryBindings) this.insert("category_node_bindings", row);
      for (const row of seed.placements) this.insert("category_placements", row);
      for (const row of seed.variableItems) this.insert("variable_items", row);
      for (const row of seed.schemas) this.insert("schemas", row);
      for (const row of seed.schemaItems) this.insert("schema_items", row);
      for (const row of seed.manufacturers) this.insert("manufacturers", row);
      for (const row of seed.models) this.insert("models", row);
      for (const row of seed.legacyFieldMappings) this.insert("legacy_field_mappings", row);
    });
    return true;
  }
}
