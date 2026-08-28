const CLOVA_ENDPOINT = "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts";
const MAX_TEXT_LENGTH = 2000;
const DAILY_REQUEST_LIMIT = 50;
const ALLOWED_SPEAKERS = new Set([
  "vara",
  "vyuna",
  "vmikyung",
  "vdaeseong",
  "nreview",
  "vian",
]);
const EMOTION_SPEAKERS = new Set(["vara", "vyuna", "vmikyung", "vdaeseong"]);

async function runtimeEnv() {
  return (await import("cloudflare:workers")).env;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

async function usageKey(request: Request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  const hash = Array.from(new Uint8Array(digest).slice(0, 8), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${new Date().toISOString().slice(0, 10)}:${hash}`;
}

async function checkRateLimit(request: Request) {
  const env = await runtimeEnv();
  const id = await usageKey(request);
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO tts_daily_usage (id, request_count, updated_at)
     VALUES (?, 1, ?)
     ON CONFLICT(id) DO UPDATE SET
       request_count = request_count + 1,
       updated_at = excluded.updated_at`,
  ).bind(id, now).run();
  const row = await env.DB.prepare("SELECT request_count FROM tts_daily_usage WHERE id = ?")
    .bind(id)
    .first<{ request_count: number }>();
  return Number(row?.request_count || 0) <= DAILY_REQUEST_LIMIT;
}

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const origin = request.headers.get("Origin");
    const fetchSite = request.headers.get("Sec-Fetch-Site");
    if ((origin && origin !== requestUrl.origin) || (fetchSite && fetchSite !== "same-origin")) {
      return Response.json({ error: "CROSS_ORIGIN_TTS_BLOCKED" }, { status: 403 });
    }

    const body = await request.json() as {
      text?: string;
      speaker?: string;
      rate?: number;
      pitch?: number;
      emotion?: number;
    };
    const text = String(body.text || "").replace(/\s+/g, " ").trim();
    const speaker = String(body.speaker || "");
    if (!text || text.length > MAX_TEXT_LENGTH) {
      return Response.json({ error: "TTS_TEXT_INVALID" }, { status: 400 });
    }
    if (!ALLOWED_SPEAKERS.has(speaker)) {
      return Response.json({ error: "TTS_SPEAKER_INVALID" }, { status: 400 });
    }

    const env = await runtimeEnv();
    const clientId = String(env.CLOVA_CLIENT_ID || "");
    const clientSecret = String(env.CLOVA_CLIENT_SECRET || "");
    if (!clientId || !clientSecret) {
      return Response.json({ error: "CLOVA_NOT_CONFIGURED" }, { status: 503 });
    }
    if (!(await checkRateLimit(request))) {
      return Response.json({ error: "TTS_DAILY_LIMIT_REACHED" }, { status: 429 });
    }

    const rate = clamp(Number(body.rate) || 1, 0.65, 1.45);
    const pitch = clamp(Number(body.pitch) || 1, 0.5, 1.5);
    const params = new URLSearchParams({
      speaker,
      text,
      volume: "0",
      speed: String(clamp(Math.round((1 - rate) * 10), -5, 10)),
      pitch: String(clamp(Math.round((1 - pitch) * 5), -5, 5)),
      format: "mp3",
      alpha: "0",
    });
    if (EMOTION_SPEAKERS.has(speaker)) {
      params.set("emotion", String(clamp(Math.round(Number(body.emotion) || 0), 0, 3)));
      params.set("emotion-strength", "1");
    }

    const response = await fetch(CLOVA_ENDPOINT, {
      method: "POST",
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": clientSecret,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      console.error("clova_tts_failed", response.status, await response.text());
      return Response.json({ error: "CLOVA_TTS_FAILED" }, { status: 502 });
    }
    const audio = await response.arrayBuffer();
    if (!audio.byteLength) {
      return Response.json({ error: "CLOVA_EMPTY_AUDIO" }, { status: 502 });
    }
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("tts_route_failed", error);
    return Response.json({ error: "CLOVA_TTS_FAILED" }, { status: 500 });
  }
}
