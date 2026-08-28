async function runtimeEnv() {
  return (await import("cloudflare:workers")).env;
}

export async function GET(request: Request) {
  const env = await runtimeEnv();
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "";
  if (!key.startsWith("projects/")) return new Response("Not found", { status: 404 });
  const object = await env.BUCKET.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "private, max-age=3600");
  headers.set("ETag", object.httpEtag);
  if (url.searchParams.get("download") === "1") {
    const requested = (url.searchParams.get("name") || "bobaedream-shortform.mp4")
      .replace(/[\r\n"\\/]/g, "_")
      .slice(0, 120);
    headers.set(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(requested)}`,
    );
  }
  return new Response(object.body, { headers });
}

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const origin = request.headers.get("Origin");
    const fetchSite = request.headers.get("Sec-Fetch-Site");
    if ((origin && origin !== requestUrl.origin) || (fetchSite && fetchSite !== "same-origin")) {
      return Response.json({ error: "CROSS_ORIGIN_UPLOAD_BLOCKED" }, { status: 403 });
    }
    const body = await request.formData();
    const video = body.get("video");
    if (!(video instanceof File) || !video.size) {
      return Response.json({ error: "VIDEO_REQUIRED" }, { status: 400 });
    }
    if (!video.type.startsWith("video/") || video.size > 80 * 1024 * 1024) {
      return Response.json({ error: "VIDEO_INVALID" }, { status: 413 });
    }
    const extension = video.type.includes("mp4") ? "mp4" : "webm";
    const key = `projects/exports/${crypto.randomUUID()}.${extension}`;
    const env = await runtimeEnv();
    await env.BUCKET.put(key, video.stream(), {
      httpMetadata: { contentType: video.type },
      customMetadata: { generatedAt: String(Date.now()) },
    });
    const name = video.name || `bobaedream-shortform.${extension}`;
    const url = `/api/assets?key=${encodeURIComponent(key)}&download=1&name=${encodeURIComponent(name)}`;
    return Response.json({ key, url, name }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("video_upload_failed", error);
    return Response.json({ error: "VIDEO_UPLOAD_FAILED" }, { status: 500 });
  }
}
