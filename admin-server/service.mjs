import {
  classifyListing,
  makeId,
  normalizeDbRow,
  parseJson,
  schemaHash,
  validateRegistryItem,
  validateSchemaTransition,
} from "./catalog.mjs";

const now = () => new Date().toISOString();

function conflict(message, code = "conflict") {
  const error = new Error(message);
  error.statusCode = 409;
  error.code = code;
  return error;
}

function notFound(message = "not found") {
  const error = new Error(message);
  error.statusCode = 404;
  error.code = "not_found";
  return error;
}

function invalid(errors) {
  const error = new Error(errors.join("; "));
  error.statusCode = 422;
  error.code = "validation_failed";
  error.details = errors;
  return error;
}

export class AdminService {
  constructor(database) {
    this.database = database;
  }

  actor(context = {}) {
    return {
      actorId: context.actorId || "system@bobaedream.local",
      actorRole: context.actorRole || "SUPER_ADMIN",
    };
  }

  dashboard() {
    const db = this.database.db;
    const counts = Object.fromEntries([
      "registry_items",
      "category_nodes",
      "category_placements",
      "variable_items",
      "schemas",
      "manufacturers",
      "models",
      "listing_read_models",
    ].map((table) => [table, this.database.count(table)]));

    const workflow = db.prepare("SELECT workflow_status AS status, COUNT(*) AS count FROM schemas GROUP BY workflow_status ORDER BY workflow_status").all();
    const domains = db.prepare("SELECT listing_domain, COUNT(*) AS count FROM category_nodes GROUP BY listing_domain ORDER BY listing_domain").all();
    const missingReferences = Number(db.prepare("SELECT COUNT(*) AS count FROM variable_items WHERE source_url = '' OR source_url IS NULL").get().count);
    const recentPublishes = db.prepare("SELECT * FROM publish_versions ORDER BY published_at DESC LIMIT 10").all().map(normalizeDbRow);
    const recentAudit = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 12").all().map(normalizeDbRow);

    return { counts, workflow, domains, missing_reference_count: missingReferences, recent_publishes: recentPublishes, recent_audit: recentAudit };
  }

  listRegistry(namespace = null) {
    const rows = namespace
      ? this.database.db.prepare("SELECT * FROM registry_items WHERE namespace = ? ORDER BY sort_order, system_key").all(namespace)
      : this.database.db.prepare("SELECT * FROM registry_items ORDER BY namespace, sort_order, system_key").all();
    return rows.map(normalizeDbRow);
  }

  createRegistry(payload, context) {
    const errors = validateRegistryItem(payload);
    if (errors.length) throw invalid(errors);
    const actor = this.actor(context);
    const timestamp = now();
    const row = {
      id: makeId("registry"),
      namespace: payload.namespace,
      system_key: payload.system_key,
      name_ko: payload.name_ko,
      name_en: payload.name_en || null,
      parent_id: payload.parent_id || null,
      launch_status: payload.launch_status || "HOLD",
      status: payload.status || "DRAFT",
      display_scope_json: JSON.stringify(payload.display_scope_json || ["ADMIN"]),
      sort_order: Number(payload.sort_order || 999),
      metadata_json: JSON.stringify(payload.metadata_json || {}),
      created_at: timestamp,
      updated_at: timestamp,
    };
    try {
      const created = this.database.insert("registry_items", row);
      this.database.audit({ ...actor, action: "CREATE", entityType: "registry_item", entityId: created.id, after: created });
      return created;
    } catch (error) {
      if (String(error.message).includes("UNIQUE")) throw conflict("namespace and system_key already exist", "duplicate_registry_key");
      throw error;
    }
  }

  updateRegistry(id, payload, context) {
    const before = this.database.get("registry_items", id);
    if (!before) throw notFound("registry item not found");
    const candidate = { ...before, ...payload };
    const errors = validateRegistryItem(candidate);
    if (errors.length) throw invalid(errors);
    const patch = this.preparePatch(payload, ["name_ko", "name_en", "parent_id", "launch_status", "status", "display_scope_json", "sort_order", "metadata_json"]);
    patch.updated_at = now();
    const after = this.database.update("registry_items", id, patch);
    this.database.audit({ ...this.actor(context), action: "UPDATE", entityType: "registry_item", entityId: id, before, after });
    return after;
  }

  archiveRegistry(id, context) {
    return this.updateRegistry(id, { status: "ARCHIVED" }, context);
  }

  listCategories() {
    const rows = this.database.db.prepare(`
      SELECT c.*, p.placement_key, p.platform AS placement_platform, p.is_visible AS placement_visible,
             GROUP_CONCAT(r.namespace || ':' || r.system_key || ':' || b.binding_role) AS bindings
      FROM category_nodes c
      LEFT JOIN category_placements p ON p.category_node_id = c.id
      LEFT JOIN category_node_bindings b ON b.category_node_id = c.id
      LEFT JOIN registry_items r ON r.id = b.registry_item_id
      GROUP BY c.id, p.id
      ORDER BY c.depth, c.sort_order, c.category_node_key
    `).all();
    return rows.map((row) => ({ ...normalizeDbRow(row), bindings: row.bindings ? row.bindings.split(",") : [] }));
  }

  createCategory(payload, context) {
    const required = ["category_node_key", "category_name_ko", "slug", "listing_domain"];
    const errors = required.filter((key) => !payload[key]).map((key) => `${key} is required`);
    if (errors.length) throw invalid(errors);
    const timestamp = now();
    const row = {
      id: makeId("category"),
      category_node_key: payload.category_node_key,
      parent_category_node_id: payload.parent_category_node_id || null,
      category_name_ko: payload.category_name_ko,
      category_name_en: payload.category_name_en || null,
      slug: payload.slug,
      depth: Number(payload.depth || (payload.parent_category_node_id ? 2 : 1)),
      sort_order: Number(payload.sort_order || 999),
      listing_domain: payload.listing_domain,
      pc_visible: payload.pc_visible === false ? 0 : 1,
      mobile_visible: payload.mobile_visible === false ? 0 : 1,
      app_visible: payload.app_visible === false ? 0 : 1,
      registration_enabled: payload.registration_enabled === false ? 0 : 1,
      search_enabled: payload.search_enabled === false ? 0 : 1,
      list_enabled: payload.list_enabled === false ? 0 : 1,
      detail_enabled: payload.detail_enabled === false ? 0 : 1,
      status: payload.status || "DRAFT",
      launch_phase: payload.launch_phase || "HOLD",
      description: payload.description || "",
      created_at: timestamp,
      updated_at: timestamp,
    };
    const created = this.database.insert("category_nodes", row);
    this.database.audit({ ...this.actor(context), action: "CREATE", entityType: "category_node", entityId: created.id, after: created });
    return created;
  }

  updateCategory(id, payload, context) {
    const before = this.database.get("category_nodes", id);
    if (!before) throw notFound("category not found");
    const allowed = ["parent_category_node_id", "category_name_ko", "category_name_en", "slug", "depth", "sort_order", "listing_domain", "pc_visible", "mobile_visible", "app_visible", "registration_enabled", "search_enabled", "list_enabled", "detail_enabled", "status", "launch_phase", "description"];
    const patch = this.preparePatch(payload, allowed);
    patch.updated_at = now();
    const after = this.database.update("category_nodes", id, patch);
    this.database.audit({ ...this.actor(context), action: "UPDATE", entityType: "category_node", entityId: id, before, after });
    return after;
  }

  listVariables() {
    return this.database.db.prepare("SELECT * FROM variable_items ORDER BY item_key").all().map(normalizeDbRow);
  }

  createVariable(payload, context) {
    const required = ["item_key", "variable_group", "item_name_ko", "screen_label", "ui_component", "data_type", "source_site", "source_url", "korea_applicability"];
    const errors = required.filter((key) => !payload[key]).map((key) => `${key} is required`);
    if (errors.length) throw invalid(errors);
    const timestamp = now();
    const row = {
      id: makeId("variable"),
      item_key: payload.item_key,
      variable_group: payload.variable_group,
      item_name_ko: payload.item_name_ko,
      item_name_en: payload.item_name_en || null,
      screen_label: payload.screen_label,
      ui_component: payload.ui_component,
      data_type: payload.data_type,
      unit: payload.unit || null,
      option_set_key: payload.option_set_key || null,
      validation_rules_json: JSON.stringify(payload.validation_rules_json || {}),
      source_site: payload.source_site,
      source_url: payload.source_url,
      korea_applicability: payload.korea_applicability,
      status: payload.status || "DRAFT",
      created_at: timestamp,
      updated_at: timestamp,
    };
    const created = this.database.insert("variable_items", row);
    this.database.audit({ ...this.actor(context), action: "CREATE", entityType: "variable_item", entityId: created.id, after: created });
    return created;
  }

  updateVariable(id, payload, context) {
    const before = this.database.get("variable_items", id);
    if (!before) throw notFound("variable item not found");
    const allowed = ["variable_group", "item_name_ko", "item_name_en", "screen_label", "ui_component", "data_type", "unit", "option_set_key", "validation_rules_json", "source_site", "source_url", "korea_applicability", "status"];
    const patch = this.preparePatch(payload, allowed);
    patch.updated_at = now();
    const after = this.database.update("variable_items", id, patch);
    this.database.audit({ ...this.actor(context), action: "UPDATE", entityType: "variable_item", entityId: id, before, after });
    return after;
  }

  archiveVariable(id, context) {
    const refs = Number(this.database.db.prepare("SELECT COUNT(*) AS count FROM schema_items WHERE variable_item_id = ?").get(id).count);
    if (refs > 0) return this.updateVariable(id, { status: "ARCHIVED" }, context);
    const before = this.database.get("variable_items", id);
    if (!before) throw notFound("variable item not found");
    this.database.db.prepare("DELETE FROM variable_items WHERE id = ?").run(id);
    this.database.audit({ ...this.actor(context), action: "DELETE", entityType: "variable_item", entityId: id, before });
    return { id, deleted: true };
  }

  listSchemas() {
    return this.database.db.prepare(`
      SELECT s.*, COUNT(si.id) AS item_count
      FROM schemas s LEFT JOIN schema_items si ON si.schema_id = s.id
      GROUP BY s.id ORDER BY s.updated_at DESC, s.schema_type
    `).all().map(normalizeDbRow);
  }

  variableMatrix(scopeKey = null) {
    const schemaTypes = ["FILTER", "REGISTRATION_FORM", "LIST_META", "DETAIL", "OPTION", "SELLER"];
    const registryRows = this.database.db.prepare(`
      SELECT * FROM registry_items
      WHERE namespace IN ('VEHICLE_TYPE', 'ASSET_TYPE') AND status != 'ARCHIVED'
      ORDER BY namespace, sort_order, system_key
    `).all().map(normalizeDbRow);
    const scopes = registryRows
      .filter((row) => !scopeKey || row.system_key === scopeKey)
      .map((row) => {
        const schemas = this.database.db.prepare(`
          SELECT s.*, COUNT(si.id) AS item_count
          FROM schemas s
          LEFT JOIN schema_items si ON si.schema_id = s.id AND si.is_visible = 1
          WHERE ${row.namespace === "ASSET_TYPE" ? "s.asset_type_key" : "s.vehicle_type_key"} = ?
          GROUP BY s.id
          ORDER BY s.schema_type, s.platform, s.updated_at DESC
        `).all(row.system_key).map(normalizeDbRow);

        const schemaByType = new Map();
        for (const schema of schemas) {
          const current = schemaByType.get(schema.schema_type);
          if (!current || schema.workflow_status === "PUBLISHED") schemaByType.set(schema.schema_type, schema);
        }

        const packedSchemas = schemaTypes.map((type) => {
          const schema = schemaByType.get(type);
          if (!schema) return { schema_type: type, status: "MISSING", item_count: 0, items: [] };
          const snapshot = this.buildSnapshot(schema);
          return {
            id: schema.id,
            schema_type: schema.schema_type,
            platform: schema.platform,
            schema_version: schema.schema_version,
            workflow_status: schema.workflow_status,
            publication_status: schema.publication_status,
            item_count: snapshot.items.length,
            items: snapshot.items,
          };
        });

        const publishedCount = packedSchemas.filter((schema) => schema.workflow_status === "PUBLISHED").length;
        const readyCount = packedSchemas.filter((schema) => schema.status !== "MISSING" && schema.item_count > 0).length;
        return {
          scope_key: row.system_key,
          namespace: row.namespace,
          name_ko: row.name_ko,
          name_en: row.name_en,
          launch_status: row.launch_status,
          status: row.status,
          field_count: Number(this.database.db.prepare("SELECT COUNT(*) AS count FROM variable_items WHERE item_key LIKE ? AND status != 'ARCHIVED'").get(`${row.system_key.toLowerCase()}.%`).count),
          schema_counts: Object.fromEntries(packedSchemas.map((schema) => [schema.schema_type, schema.item_count])),
          schema_ready_count: readyCount,
          published_count: publishedCount,
          completeness_percent: Math.round((readyCount / schemaTypes.length) * 100),
          schemas: packedSchemas,
        };
      });
    return { generated_at: now(), schema_types: schemaTypes, scopes };
  }

  schemaDetails(id) {
    const schema = this.database.get("schemas", id);
    if (!schema) throw notFound("schema not found");
    return this.buildSnapshot(schema);
  }

  createDraft(payload, context) {
    const timestamp = now();
    let source = null;
    if (payload.clone_schema_id) source = this.database.get("schemas", payload.clone_schema_id);
    const base = source || payload;
    const row = {
      id: makeId("schema"),
      schema_type: payload.schema_type || base.schema_type,
      vehicle_type_key: payload.vehicle_type_key ?? base.vehicle_type_key ?? null,
      asset_type_key: payload.asset_type_key ?? base.asset_type_key ?? null,
      category_node_key: payload.category_node_key ?? base.category_node_key ?? null,
      platform: payload.platform || base.platform || "ALL",
      schema_version: payload.schema_version,
      workflow_status: "DRAFT",
      publication_status: "UNPUBLISHED",
      schema_hash: null,
      fallback_schema_id: payload.fallback_schema_id || source?.id || null,
      title: payload.title || `${base.title || base.schema_type} draft`,
      created_by: this.actor(context).actorId,
      updated_by: this.actor(context).actorId,
      created_at: timestamp,
      updated_at: timestamp,
    };
    if (!row.schema_type || !row.schema_version || (!row.vehicle_type_key && !row.asset_type_key && !row.category_node_key)) {
      throw invalid(["schema_type, schema_version and target are required"]);
    }
    const created = this.database.insert("schemas", row);
    if (source) {
      const items = this.database.db.prepare("SELECT * FROM schema_items WHERE schema_id = ? ORDER BY item_order").all(source.id);
      for (const item of items) {
        this.database.insert("schema_items", { ...item, id: makeId("schema_item"), schema_id: created.id, created_at: timestamp, updated_at: timestamp });
      }
    }
    this.database.audit({ ...this.actor(context), action: "CREATE_DRAFT", entityType: "schema", entityId: created.id, after: created });
    return this.schemaDetails(created.id);
  }

  addSchemaItem(schemaId, payload, context) {
    const schema = this.database.get("schemas", schemaId);
    if (!schema) throw notFound("schema not found");
    if (schema.workflow_status !== "DRAFT") throw conflict("only DRAFT schema can be edited", "schema_locked");
    const variable = this.database.get("variable_items", payload.variable_item_id);
    if (!variable) throw invalid(["variable_item_id is invalid"]);
    const timestamp = now();
    const row = {
      id: makeId("schema_item"),
      schema_id: schemaId,
      variable_item_id: variable.id,
      item_order: Number(payload.item_order || 999),
      section_key: payload.section_key || "ADDITIONAL",
      exposure_type: payload.exposure_type || "MORE",
      required_level: payload.required_level || "OPTIONAL",
      is_visible: payload.is_visible === false ? 0 : 1,
      conditional_rules_json: JSON.stringify(payload.conditional_rules_json || []),
      validation_rules_json: JSON.stringify(payload.validation_rules_json || {}),
      display_rules_json: JSON.stringify(payload.display_rules_json || {}),
      created_at: timestamp,
      updated_at: timestamp,
    };
    const created = this.database.insert("schema_items", row);
    this.database.audit({ ...this.actor(context), action: "ADD_ITEM", entityType: "schema", entityId: schemaId, after: created });
    return created;
  }

  removeSchemaItem(schemaId, itemId, context) {
    const schema = this.database.get("schemas", schemaId);
    if (!schema) throw notFound("schema not found");
    if (schema.workflow_status !== "DRAFT") throw conflict("only DRAFT schema can be edited", "schema_locked");
    const before = this.database.get("schema_items", itemId);
    if (!before || before.schema_id !== schemaId) throw notFound("schema item not found");
    this.database.db.prepare("DELETE FROM schema_items WHERE id = ?").run(itemId);
    this.database.audit({ ...this.actor(context), action: "REMOVE_ITEM", entityType: "schema", entityId: schemaId, before });
    return { id: itemId, deleted: true };
  }

  requestReview(id, context) {
    return this.transition(id, "request_review", "REVIEW_REQUESTED", context);
  }

  approve(id, context) {
    return this.transition(id, "approve", "QA_APPROVED", context);
  }

  transition(id, action, nextStatus, context) {
    const before = this.database.get("schemas", id);
    if (!before) throw notFound("schema not found");
    validateSchemaTransition(before.workflow_status, action);
    const after = this.database.update("schemas", id, { workflow_status: nextStatus, updated_by: this.actor(context).actorId, updated_at: now() });
    this.database.audit({ ...this.actor(context), action: action.toUpperCase(), entityType: "schema", entityId: id, before, after });
    return after;
  }

  validateForPublish(schema) {
    const snapshot = this.buildSnapshot(schema);
    const errors = [];
    if (!snapshot.items.length) errors.push("schema has no items");
    const seen = new Set();
    for (const item of snapshot.items) {
      if (!item.source_url) errors.push(`${item.item_key} has no source_url`);
      if (!item.korea_applicability) errors.push(`${item.item_key} has no korea_applicability`);
      if (seen.has(item.item_key)) errors.push(`duplicate item_key: ${item.item_key}`);
      seen.add(item.item_key);
    }
    if (schema.asset_type_key === "PARTS_GOODS" && schema.schema_type === "REGISTRATION_FORM") {
      const requiredKeys = ["parts_goods.parts_category_id", "parts_goods.compatible_vehicle_type", "parts_goods.part_origin_type", "parts_goods.condition_grade", "parts_goods.delivery_method", "parts_goods.seller_type"];
      for (const key of requiredKeys) if (!seen.has(key)) errors.push(`PARTS_GOODS missing required field: ${key}`);
    }
    if (errors.length) throw invalid(errors);
    return snapshot;
  }

  publish(id, context, { skipTransitionCheck = false } = {}) {
    const schema = this.database.get("schemas", id);
    if (!schema) throw notFound("schema not found");
    if (!skipTransitionCheck) validateSchemaTransition(schema.workflow_status, "publish");
    const snapshot = this.validateForPublish(schema);
    const hash = schemaHash(snapshot);
    const targetKey = schema.category_node_key || schema.vehicle_type_key || schema.asset_type_key || "GLOBAL";
    const actor = this.actor(context);
    const timestamp = now();

    const version = this.database.transaction(() => {
      this.database.db.prepare(`
        UPDATE publish_versions SET is_active = 0
        WHERE schema_type = ? AND platform = ? AND target_key = ? AND is_active = 1
      `).run(schema.schema_type, schema.platform, targetKey);
      const published = this.database.insert("publish_versions", {
        id: makeId("publish"),
        schema_id: schema.id,
        schema_type: schema.schema_type,
        platform: schema.platform,
        target_key: targetKey,
        schema_version: schema.schema_version,
        schema_hash: hash,
        fallback_version: schema.fallback_schema_id ? this.database.get("schemas", schema.fallback_schema_id)?.schema_version || null : null,
        cache_ttl: 300,
        published_json_snapshot: JSON.stringify({ ...snapshot, schema_hash: hash, status: "PUBLISHED", published_at: timestamp }),
        is_active: 1,
        published_by: actor.actorId,
        published_at: timestamp,
        rolled_back_at: null,
      });
      this.database.update("schemas", schema.id, {
        workflow_status: "PUBLISHED",
        publication_status: "PUBLISHED",
        schema_hash: hash,
        updated_by: actor.actorId,
        updated_at: timestamp,
      });
      return published;
    });

    this.database.audit({ ...actor, action: "PUBLISH", entityType: "schema", entityId: id, before: schema, after: version });
    this.database.emit("SchemaPublished", id, schema.schema_version, { target_key: targetKey, schema_type: schema.schema_type, platform: schema.platform, schema_hash: hash });
    return { ...version, snapshot: parseJson(version.published_json_snapshot, {}) };
  }

  rollback(id, context) {
    const schema = this.database.get("schemas", id);
    if (!schema) throw notFound("schema not found");
    validateSchemaTransition(schema.workflow_status, "rollback");
    const targetKey = schema.category_node_key || schema.vehicle_type_key || schema.asset_type_key || "GLOBAL";
    const versions = this.database.db.prepare(`
      SELECT * FROM publish_versions WHERE schema_type = ? AND platform = ? AND target_key = ? ORDER BY published_at DESC
    `).all(schema.schema_type, schema.platform, targetKey).map(normalizeDbRow);
    const activeIndex = versions.findIndex((row) => row.is_active);
    const fallback = versions.slice(activeIndex + 1).find((row) => row.id !== versions[activeIndex]?.id);
    if (!fallback) throw conflict("no previous published version available", "rollback_target_missing");
    const timestamp = now();
    this.database.transaction(() => {
      this.database.db.prepare("UPDATE publish_versions SET is_active = 0, rolled_back_at = ? WHERE is_active = 1 AND schema_type = ? AND platform = ? AND target_key = ?")
        .run(timestamp, schema.schema_type, schema.platform, targetKey);
      this.database.db.prepare("UPDATE publish_versions SET is_active = 1, rolled_back_at = NULL WHERE id = ?").run(fallback.id);
      this.database.update("schemas", id, { workflow_status: "ROLLED_BACK", publication_status: "ROLLED_BACK", updated_at: timestamp });
    });
    this.database.audit({ ...this.actor(context), action: "ROLLBACK", entityType: "schema", entityId: id, before: versions[activeIndex], after: fallback });
    this.database.emit("SchemaRolledBack", id, fallback.schema_version, { target_key: targetKey, fallback_version: fallback.schema_version });
    return { ...fallback, snapshot: parseJson(fallback.published_json_snapshot, {}) };
  }

  publishSeedSchemas() {
    if (this.database.count("publish_versions") > 0) return;
    const rows = this.database.db.prepare("SELECT * FROM schemas WHERE workflow_status = 'QA_APPROVED'").all().map(normalizeDbRow);
    for (const schema of rows) this.publish(schema.id, { actorId: "seed", actorRole: "SUPER_ADMIN" }, { skipTransitionCheck: true });
  }

  buildSnapshot(schema) {
    const rows = this.database.db.prepare(`
      SELECT si.*, v.item_key, v.variable_group, v.item_name_ko, v.item_name_en,
             v.screen_label, v.ui_component, v.data_type, v.unit, v.option_set_key,
             v.source_site, v.source_url, v.korea_applicability, v.status AS variable_status
      FROM schema_items si
      JOIN variable_items v ON v.id = si.variable_item_id
      WHERE si.schema_id = ? AND si.is_visible = 1 AND v.status != 'ARCHIVED'
      ORDER BY si.item_order, v.item_key
    `).all(schema.id).map(normalizeDbRow);
    return {
      id: schema.id,
      vehicle_type_id: schema.vehicle_type_key,
      asset_type_id: schema.asset_type_key,
      category_node_id: schema.category_node_key,
      schema_type: schema.schema_type,
      platform: schema.platform,
      schema_version: schema.schema_version,
      workflow_status: schema.workflow_status,
      publication_status: schema.publication_status,
      fallback_schema_version: schema.fallback_schema_id ? this.database.get("schemas", schema.fallback_schema_id)?.schema_version || null : null,
      title: schema.title,
      validation_rules: rows.map((row) => ({ item_key: row.item_key, rules: row.validation_rules_json })),
      conditional_rules: rows.filter((row) => row.conditional_rules_json?.length).map((row) => ({ item_key: row.item_key, rules: row.conditional_rules_json })),
      option_sets: [],
      items: rows,
    };
  }

  resolvePublishedSchema({ placementKey, schemaType, platform }) {
    const placement = this.database.getBy("category_placements", "placement_key", placementKey);
    if (!placement || !placement.is_visible) throw notFound("placement not found");
    const category = this.database.get("category_nodes", placement.category_node_id);
    const bindings = this.database.db.prepare(`
      SELECT r.namespace, r.system_key, b.binding_role
      FROM category_node_bindings b JOIN registry_items r ON r.id = b.registry_item_id
      WHERE b.category_node_id = ?
    `).all(category.id);
    const primary = bindings.find((row) => row.binding_role === "PRIMARY_TYPE");
    const candidates = [category.category_node_key, primary?.system_key, "GLOBAL"].filter(Boolean);
    const platforms = [platform, "ALL"];

    for (const targetKey of candidates) {
      for (const candidatePlatform of platforms) {
        const version = this.database.db.prepare(`
          SELECT * FROM publish_versions
          WHERE schema_type = ? AND platform = ? AND target_key = ? AND is_active = 1
          ORDER BY published_at DESC LIMIT 1
        `).get(schemaType, candidatePlatform, targetKey);
        if (version) {
          return {
            resolution: {
              requested_placement: placementKey,
              resolved_target: targetKey,
              resolution_level: targetKey === category.category_node_key ? "CATEGORY_OVERRIDE" : targetKey === "GLOBAL" ? "GLOBAL_FALLBACK" : "TYPE_DEFAULT",
            },
            ...parseJson(version.published_json_snapshot, {}),
          };
        }
      }
    }
    throw notFound("published schema not found");
  }

  listManufacturers(scopeKey = null) {
    const rows = scopeKey
      ? this.database.db.prepare("SELECT * FROM manufacturers WHERE scope_key = ? ORDER BY sort_order, name_ko").all(scopeKey)
      : this.database.db.prepare("SELECT * FROM manufacturers ORDER BY scope_key, sort_order, name_ko").all();
    return rows.map(normalizeDbRow);
  }

  createManufacturer(payload, context) {
    const timestamp = now();
    const row = {
      id: makeId("make"), scope_key: payload.scope_key, manufacturer_key: payload.manufacturer_key,
      name_ko: payload.name_ko, name_en: payload.name_en || null, country_code: payload.country_code || null,
      sort_order: Number(payload.sort_order || 999), status: payload.status || "DRAFT", created_at: timestamp, updated_at: timestamp,
    };
    if (!row.scope_key || !row.manufacturer_key || !row.name_ko) throw invalid(["scope_key, manufacturer_key and name_ko are required"]);
    const created = this.database.insert("manufacturers", row);
    this.database.audit({ ...this.actor(context), action: "CREATE", entityType: "manufacturer", entityId: created.id, after: created });
    return created;
  }

  listModels(manufacturerId = null) {
    const rows = manufacturerId
      ? this.database.db.prepare("SELECT * FROM models WHERE manufacturer_id = ? ORDER BY sort_order, name_ko").all(manufacturerId)
      : this.database.db.prepare("SELECT * FROM models ORDER BY manufacturer_id, sort_order, name_ko").all();
    return rows.map(normalizeDbRow);
  }

  createModel(payload, context) {
    const timestamp = now();
    const row = {
      id: makeId("model"), manufacturer_id: payload.manufacturer_id, model_key: payload.model_key,
      name_ko: payload.name_ko, name_en: payload.name_en || null, parent_model_id: payload.parent_model_id || null,
      sort_order: Number(payload.sort_order || 999), status: payload.status || "DRAFT", created_at: timestamp, updated_at: timestamp,
    };
    if (!row.manufacturer_id || !row.model_key || !row.name_ko) throw invalid(["manufacturer_id, model_key and name_ko are required"]);
    const created = this.database.insert("models", row);
    this.database.audit({ ...this.actor(context), action: "CREATE", entityType: "model", entityId: created.id, after: created });
    return created;
  }

  listLegacyMappings() {
    return this.database.all("legacy_field_mappings", "legacy_table, legacy_column");
  }

  classify(listing, context, { dryRun = false } = {}) {
    const required = ["listing_id", "listing_domain"];
    const errors = required.filter((key) => !listing[key]).map((key) => `${key} is required`);
    if (listing.listing_domain === "VEHICLE_LISTING" && !listing.vehicle_type_key) errors.push("vehicle_type_key is required for VEHICLE_LISTING");
    if (listing.listing_domain === "PARTS_LISTING" && listing.vehicle_type_key) errors.push("PARTS_LISTING must not store PARTS_GOODS as vehicle_type_key");
    if (errors.length) throw invalid(errors);
    const placementKeys = new Set(this.database.db.prepare("SELECT placement_key FROM category_placements WHERE is_visible = 1").all().map((row) => row.placement_key));
    const categories = classifyListing(listing, placementKeys);
    const resolutionVersion = `classification-${new Date().toISOString().slice(0, 10)}`;
    const projection = {
      listing_id: String(listing.listing_id),
      listing_domain: listing.listing_domain,
      vehicle_type_key: listing.vehicle_type_key || null,
      asset_type_key: listing.asset_type_key || (listing.listing_domain === "PARTS_LISTING" ? "PARTS_GOODS" : null),
      category_node_keys: categories,
      overlay_keys: listing.overlay_keys || [],
      attributes: listing.attributes || {},
      resolution_version: resolutionVersion,
      source_updated_at: listing.source_updated_at || null,
      projected_at: now(),
    };
    if (dryRun) return { dry_run: true, projection };

    this.database.transaction(() => {
      this.database.db.prepare("DELETE FROM listing_category_resolutions WHERE listing_id = ?").run(projection.listing_id);
      this.database.db.prepare("DELETE FROM listing_read_models WHERE listing_id = ?").run(projection.listing_id);
      this.database.insert("listing_read_models", {
        listing_id: projection.listing_id,
        listing_domain: projection.listing_domain,
        vehicle_type_key: projection.vehicle_type_key,
        asset_type_key: projection.asset_type_key,
        category_node_keys_json: JSON.stringify(categories),
        overlay_keys_json: JSON.stringify(projection.overlay_keys),
        attributes_json: JSON.stringify(projection.attributes),
        resolution_version: projection.resolution_version,
        source_updated_at: projection.source_updated_at,
        projected_at: projection.projected_at,
      });
      for (const [index, categoryKey] of categories.entries()) {
        this.database.insert("listing_category_resolutions", {
          id: makeId("resolution"), listing_id: projection.listing_id, category_node_key: categoryKey,
          assignment_type: index === 0 ? "PRIMARY" : "AUTOMATIC", assignment_source: "RULE_ENGINE",
          resolution_version: resolutionVersion, is_primary: index === 0 ? 1 : 0, display_enabled: 1, created_at: now(),
        });
      }
    });
    this.database.audit({ ...this.actor(context), action: "CLASSIFY", entityType: "listing_projection", entityId: projection.listing_id, after: projection });
    this.database.emit("ListingProjectionUpdated", projection.listing_id, resolutionVersion, projection);
    return { dry_run: false, projection };
  }

  getProjection(listingId) {
    const row = this.database.db.prepare("SELECT * FROM listing_read_models WHERE listing_id = ?").get(String(listingId));
    if (!row) throw notFound("listing projection not found");
    return normalizeDbRow(row);
  }

  preparePatch(payload, allowed) {
    const patch = {};
    for (const key of allowed) {
      if (!(key in payload)) continue;
      const value = payload[key];
      patch[key] = key.endsWith("_json") && typeof value !== "string" ? JSON.stringify(value) : value;
    }
    return patch;
  }
}
