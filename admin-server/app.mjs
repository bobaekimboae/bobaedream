import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { assertPermission } from "./catalog.mjs";
import { AdminDatabase } from "./database.mjs";
import { AdminService } from "./service.mjs";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const PUBLIC_ROOT = join(ROOT, "public", "category-admin");

export function createAdminApp({ database = new AdminDatabase() } = {}) {
  database.seed();
  const service = new AdminService(database);
  service.publishSeedSchemas();

  const handler = async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      if (url.pathname === "/api/admin/health" && req.method === "GET") {
        return json(res, 200, { ok: true, service: "bobaedream-category-admin", database: "sqlite", time: new Date().toISOString() });
      }
      if (url.pathname.startsWith("/api/")) return await routeApi(req, res, url, service);
      return serveAdmin(req, res, url.pathname);
    } catch (error) {
      const status = error.statusCode || 500;
      if (status >= 500) console.error(error);
      return json(res, status, {
        error: error.code || "internal_error",
        message: error.message,
        details: error.details || undefined,
      });
    }
  };

  handler.database = database;
  handler.service = service;
  return handler;
}

async function routeApi(req, res, url, service) {
  const path = url.pathname;
  const context = {
    actorId: req.headers["x-admin-email"] || "admin@bobaedream.local",
    actorRole: req.headers["x-admin-role"] || "SUPER_ADMIN",
  };
  const requirePermission = (permission) => assertPermission(context.actorRole, permission);

  if (req.method === "GET" && path === "/api/admin/dashboard") {
    requirePermission("read");
    return json(res, 200, service.dashboard());
  }

  if (path === "/api/admin/registry") {
    if (req.method === "GET") {
      requirePermission("read");
      return json(res, 200, service.listRegistry(url.searchParams.get("namespace")));
    }
    if (req.method === "POST") {
      requirePermission("write");
      return json(res, 201, service.createRegistry(await readBody(req), context));
    }
  }

  let match = path.match(/^\/api\/admin\/registry\/([^/]+)$/);
  if (match && req.method === "PATCH") {
    requirePermission("write");
    return json(res, 200, service.updateRegistry(decodeURIComponent(match[1]), await readBody(req), context));
  }
  if (match && req.method === "DELETE") {
    requirePermission("write");
    return json(res, 200, service.archiveRegistry(decodeURIComponent(match[1]), context));
  }

  if (path === "/api/admin/categories") {
    if (req.method === "GET") {
      requirePermission("read");
      return json(res, 200, service.listCategories());
    }
    if (req.method === "POST") {
      requirePermission("write");
      return json(res, 201, service.createCategory(await readBody(req), context));
    }
  }

  match = path.match(/^\/api\/admin\/categories\/([^/]+)$/);
  if (match && req.method === "PATCH") {
    requirePermission("write");
    return json(res, 200, service.updateCategory(decodeURIComponent(match[1]), await readBody(req), context));
  }
  if (match && req.method === "DELETE") {
    requirePermission("write");
    return json(res, 200, service.updateCategory(decodeURIComponent(match[1]), { status: "ARCHIVED" }, context));
  }

  if (path === "/api/admin/variables") {
    if (req.method === "GET") {
      requirePermission("read");
      return json(res, 200, service.listVariables());
    }
    if (req.method === "POST") {
      requirePermission("write");
      return json(res, 201, service.createVariable(await readBody(req), context));
    }
  }

  match = path.match(/^\/api\/admin\/variables\/([^/]+)$/);
  if (match && req.method === "PATCH") {
    requirePermission("write");
    return json(res, 200, service.updateVariable(decodeURIComponent(match[1]), await readBody(req), context));
  }
  if (match && req.method === "DELETE") {
    requirePermission("write");
    return json(res, 200, service.archiveVariable(decodeURIComponent(match[1]), context));
  }

  if (path === "/api/admin/schemas") {
    if (req.method === "GET") {
      requirePermission("read");
      return json(res, 200, service.listSchemas());
    }
    if (req.method === "POST") {
      requirePermission("write");
      return json(res, 201, service.createDraft(await readBody(req), context));
    }
  }

  match = path.match(/^\/api\/admin\/schemas\/([^/]+)$/);
  if (match && req.method === "GET") {
    requirePermission("read");
    return json(res, 200, service.schemaDetails(decodeURIComponent(match[1])));
  }

  match = path.match(/^\/api\/admin\/schemas\/([^/]+)\/items$/);
  if (match && req.method === "POST") {
    requirePermission("write");
    return json(res, 201, service.addSchemaItem(decodeURIComponent(match[1]), await readBody(req), context));
  }

  match = path.match(/^\/api\/admin\/schemas\/([^/]+)\/items\/([^/]+)$/);
  if (match && req.method === "DELETE") {
    requirePermission("write");
    return json(res, 200, service.removeSchemaItem(decodeURIComponent(match[1]), decodeURIComponent(match[2]), context));
  }

  match = path.match(/^\/api\/admin\/schemas\/([^/]+)\/actions\/(request-review|approve|publish|rollback)$/);
  if (match && req.method === "POST") {
    const schemaId = decodeURIComponent(match[1]);
    const action = match[2];
    if (action === "request-review") {
      requirePermission("request_review");
      return json(res, 200, service.requestReview(schemaId, context));
    }
    if (action === "approve") {
      requirePermission("approve");
      return json(res, 200, service.approve(schemaId, context));
    }
    if (action === "publish") {
      requirePermission("publish");
      return json(res, 200, service.publish(schemaId, context));
    }
    requirePermission("rollback");
    return json(res, 200, service.rollback(schemaId, context));
  }

  if (path === "/api/admin/manufacturers") {
    if (req.method === "GET") {
      requirePermission("read");
      return json(res, 200, service.listManufacturers(url.searchParams.get("scope_key")));
    }
    if (req.method === "POST") {
      requirePermission("write");
      return json(res, 201, service.createManufacturer(await readBody(req), context));
    }
  }

  if (path === "/api/admin/models") {
    if (req.method === "GET") {
      requirePermission("read");
      return json(res, 200, service.listModels(url.searchParams.get("manufacturer_id")));
    }
    if (req.method === "POST") {
      requirePermission("write");
      return json(res, 201, service.createModel(await readBody(req), context));
    }
  }

  if (req.method === "GET" && path === "/api/admin/legacy-field-mappings") {
    requirePermission("read");
    return json(res, 200, service.listLegacyMappings());
  }

  if (req.method === "GET" && path === "/api/admin/audit-logs") {
    requirePermission("read");
    return json(res, 200, service.database.db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200").all());
  }

  match = path.match(/^\/api\/v1\/placements\/([^/]+)\/schemas\/([^/]+)$/);
  if (match && req.method === "GET") {
    return json(res, 200, service.resolvePublishedSchema({
      placementKey: decodeURIComponent(match[1]),
      schemaType: decodeURIComponent(match[2]).toUpperCase(),
      platform: (url.searchParams.get("platform") || "MOBILE_APP").toUpperCase(),
    }));
  }

  if (path === "/api/v1/placements" && req.method === "GET") {
    const placements = service.database.db.prepare(`
      SELECT p.placement_key, p.platform, p.menu_name_ko, p.sort_order, c.category_node_key,
             c.listing_domain, c.category_name_ko
      FROM category_placements p JOIN category_nodes c ON c.id = p.category_node_id
      WHERE p.is_visible = 1 AND c.status = 'ACTIVE' ORDER BY p.sort_order
    `).all();
    return json(res, 200, placements);
  }

  match = path.match(/^\/api\/internal\/v1\/listings\/([^/]+)\/classify$/);
  if (match && req.method === "POST") {
    requirePermission("write");
    const payload = await readBody(req);
    payload.listing_id = decodeURIComponent(match[1]);
    return json(res, 200, service.classify(payload, context, { dryRun: url.searchParams.get("dry_run") === "true" }));
  }

  match = path.match(/^\/api\/internal\/v1\/listings\/([^/]+)\/projection$/);
  if (match && req.method === "GET") {
    requirePermission("read");
    return json(res, 200, service.getProjection(decodeURIComponent(match[1])));
  }

  return json(res, 404, { error: "not_found", message: `${req.method} ${path} was not found` });
}

async function readBody(req) {
  let text = "";
  for await (const chunk of req) {
    text += chunk;
    if (text.length > 1_000_000) {
      const error = new Error("request body too large");
      error.statusCode = 413;
      throw error;
    }
  }
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const error = new Error("invalid JSON body");
    error.statusCode = 400;
    error.code = "invalid_json";
    throw error;
  }
}

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": status >= 400 ? "no-store" : "private, max-age=0",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

function serveAdmin(req, res, pathname) {
  if (!["GET", "HEAD"].includes(req.method)) return json(res, 405, { error: "method_not_allowed" });
  const relative = pathname === "/" || pathname === "/admin" || pathname === "/category-admin" || pathname === "/category-admin/"
    ? "index.html"
    : pathname.replace(/^\/category-admin\/?/, "");
  const safe = normalize(relative).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = join(PUBLIC_ROOT, safe);
  if (!filePath.startsWith(PUBLIC_ROOT) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    return json(res, 404, { error: "not_found" });
  }
  const contentType = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
  }[extname(filePath)] || "application/octet-stream";
  res.writeHead(200, { "content-type": contentType, "cache-control": "no-store" });
  if (req.method === "HEAD") return res.end();
  createReadStream(filePath).pipe(res);
}
