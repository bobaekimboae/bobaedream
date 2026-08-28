type StoredAsset = { key: string; name: string; type: string; url: string };

async function runtimeEnv() {
  return (await import("cloudflare:workers")).env;
}

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const env = await runtimeEnv();
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) return json({ error: "PROJECT_ID_REQUIRED" }, 400);
  const row = await env.DB.prepare("SELECT data_json, updated_at FROM projects WHERE id = ?")
    .bind(id)
    .first<{ data_json: string; updated_at: number }>();
  if (!row) return json({ error: "PROJECT_NOT_FOUND" }, 404);
  return json({ id, updatedAt: row.updated_at, data: JSON.parse(row.data_json) });
}

export async function POST(request: Request) {
  try {
    const env = await runtimeEnv();
    const body = await request.formData();
    const raw = body.get("data");
    if (typeof raw !== "string") return json({ error: "PROJECT_DATA_REQUIRED" }, 400);
    const input = JSON.parse(raw) as Record<string, unknown>;
    const id = typeof input.projectId === "string" && /^[a-zA-Z0-9-]{20,80}$/.test(input.projectId)
      ? input.projectId
      : crypto.randomUUID();
    const prefix = `projects/${id}`;
    const photos: StoredAsset[] = [];
    for (const entry of body.getAll("photos")) {
      if (!(entry instanceof File) || !entry.size) continue;
      const index = photos.length;
      const key = `${prefix}/photos/${String(index).padStart(2, "0")}-${crypto.randomUUID()}`;
      await env.BUCKET.put(key, entry.stream(), { httpMetadata: { contentType: entry.type || "image/jpeg" } });
      photos.push({ key, name: entry.name, type: entry.type || "image/jpeg", url: `/api/assets?key=${encodeURIComponent(key)}` });
    }

    async function storeSingle(field: "logo" | "music") {
      const entry = body.get(field);
      if (!(entry instanceof File) || !entry.size) return null;
      const key = `${prefix}/${field}-${crypto.randomUUID()}`;
      await env.BUCKET.put(key, entry.stream(), { httpMetadata: { contentType: entry.type || "application/octet-stream" } });
      return { key, name: entry.name, type: entry.type || "application/octet-stream", url: `/api/assets?key=${encodeURIComponent(key)}` } satisfies StoredAsset;
    }

    const logo = await storeSingle("logo");
    const music = await storeSingle("music");
    const now = Date.now();
    const dataJson = JSON.stringify({ ...input, projectId: id, photos, logo, music });
    await env.DB.prepare(
      "INSERT INTO projects (id, data_json, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at"
    ).bind(id, dataJson, now, now).run();
    return json({ id, updatedAt: now, data: JSON.parse(dataJson) });
  } catch (error) {
    console.error("project_save_failed", error);
    return json({ error: "PROJECT_SAVE_FAILED" }, 500);
  }
}
