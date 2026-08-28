const MAX_IMPORTED_PHOTOS = 20;
const MAX_HTML_BYTES = 2 * 1024 * 1024;

type EncarPhoto = {
  code?: string;
  path?: string;
  type?: string;
};

type EncarBase = {
  vehicleId?: number;
  vehicleNo?: string;
  category?: {
    manufacturerName?: string;
    modelName?: string;
    gradeName?: string;
    formYear?: string;
    yearMonth?: string;
  };
  advertisement?: {
    price?: number;
    diagnosisCar?: boolean;
    homeService?: boolean;
  };
  contact?: {
    no?: string;
    address?: string;
  };
  spec?: {
    mileage?: number;
    transmissionName?: string;
    fuelName?: string;
    colorName?: string;
  };
  photos?: EncarPhoto[];
  partnership?: {
    dealer?: {
      name?: string;
      firm?: { name?: string };
    };
  };
};

type ProviderId = "encar" | "bobaedream" | "kcar" | "daangn" | "kbchachacha" | "chutcha" | "other";

const PROVIDERS: Record<Exclude<ProviderId, "other">, { name: string; hosts: string[] }> = {
  encar: { name: "엔카", hosts: ["encar.com"] },
  bobaedream: { name: "보배드림", hosts: ["bobaedream.co.kr"] },
  kcar: { name: "K Car", hosts: ["kcar.com"] },
  daangn: { name: "당근 중고차", hosts: ["daangn.com", "karrotmarket.com"] },
  kbchachacha: { name: "KB차차차", hosts: ["kbchachacha.com"] },
  chutcha: { name: "첫차", hosts: ["chutcha.net", "chutcha.com"] },
};

async function runtimeEnv() {
  return (await import("cloudflare:workers")).env;
}

function parseEncarUrl(input: string) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("INVALID_URL");
  }
  if (url.protocol !== "https:" || url.hostname !== "fem.encar.com") {
    throw new Error("UNSUPPORTED_LISTING_URL");
  }
  const match = url.pathname.match(/^\/cars\/detail\/(\d+)\/?$/);
  if (!match) throw new Error("UNSUPPORTED_LISTING_URL");
  return { id: match[1], url: `https://fem.encar.com/cars/detail/${match[1]}` };
}

function hostMatches(hostname: string, suffix: string) {
  return hostname === suffix || hostname.endsWith(`.${suffix}`);
}

function identifyProvider(input: string) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("INVALID_URL");
  }
  if (url.protocol !== "https:") throw new Error("UNSUPPORTED_LISTING_URL");
  const match = Object.entries(PROVIDERS).find(([, provider]) =>
    provider.hosts.some((host) => hostMatches(url.hostname, host)),
  );
  if (!match) throw new Error("UNSUPPORTED_LISTING_URL");
  return { provider: match[0] as Exclude<ProviderId, "other">, providerName: match[1].name, url };
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function metaContent(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1].trim());
  }
  return "";
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].replace(/,/g, "").trim();
  }
  return "";
}

function genericVehicleData(html: string, sourceUrl: URL, providerName: string) {
  const title = metaContent(html, "og:title") || metaContent(html, "twitter:title") || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "";
  const description = metaContent(html, "og:description") || metaContent(html, "description");
  const corpus = decodeHtml(`${title} ${description} ${html.slice(0, 800_000)}`).replace(/<[^>]+>/g, " ");
  const year = firstMatch(corpus, [/(20\d{2})\s*년(?:식|형|\s)/, /(?:연식|등록)\s*[:：]?\s*(20\d{2})/]);
  const mileage = firstMatch(corpus, [/(\d{1,3}(?:,\d{3})+)\s*(?:km|KM|킬로미터)/, /주행거리\s*[:：]?\s*(\d+)/]);
  const price = firstMatch(corpus, [/(\d{2,5}(?:,\d{3})?)\s*만원/, /(?:가격|판매가)\s*[:：]?\s*(\d{2,5})/]);
  const fuel = firstMatch(corpus, [/(가솔린|디젤|하이브리드|전기|LPG|수소)/]);
  const transmission = /(?:오토|자동)/.test(corpus) ? "자동" : /수동/.test(corpus) ? "수동" : "";
  const cleanTitle = decodeHtml(title).replace(/\s*[:|｜-].*$/, "").trim();
  const titleParts = cleanTitle.split(/\s+/).filter(Boolean);
  const make = titleParts[0] || "";
  const model = titleParts.slice(1, 3).join(" ");
  const trim = titleParts.slice(3).join(" ");
  const imageCandidates = [
    metaContent(html, "og:image"),
    metaContent(html, "twitter:image"),
    ...Array.from(html.matchAll(/https:\/\/[^"'<>\\\s]+?\.(?:jpe?g|png|webp)(?:\?[^"'<>\\\s]*)?/gi), (match) => decodeHtml(match[0])),
  ];
  const photos = [...new Set(imageCandidates)]
    .filter((value) => {
      try { return new URL(value, sourceUrl).protocol === "https:"; } catch { return false; }
    })
    .slice(0, MAX_IMPORTED_PHOTOS);
  const listingId = firstMatch(sourceUrl.pathname, [/(\d{5,})/]) || crypto.randomUUID().slice(0, 8);
  return {
    listingId,
    photos,
    vehicle: {
      make, model, trim, year, mileage, fuel, transmission, price,
      feature: `${providerName} 등록매물 · 상세정보 확인`,
      seller: `${providerName} 등록 판매자`, phone: "",
      accidentHistory: "성능점검기록부 확인 필요", repairHistory: "", specialNotes: "",
    },
  };
}

async function cacheRemotePhoto(provider: ProviderId, listingId: string, remoteUrl: string, index: number) {
  const remote = new URL(remoteUrl);
  if (remote.protocol !== "https:" || !remote.hostname.includes(".")) throw new Error("PHOTO_HOST_BLOCKED");
  const key = `projects/imports/${provider}/${listingId}/${String(index + 1).padStart(2, "0")}.jpg`;
  const env = await runtimeEnv();
  const existing = await env.BUCKET.head(key);
  if (!existing) {
    const response = await fetch(remote, { headers: { Accept: "image/avif,image/webp,image/jpeg,image/*", "User-Agent": "Mozilla/5.0 CARVID listing importer" } });
    const type = response.headers.get("content-type") || "";
    const size = Number(response.headers.get("content-length") || 0);
    if (!response.ok || !type.startsWith("image/") || size > 8 * 1024 * 1024) throw new Error("PHOTO_DOWNLOAD_FAILED");
    await env.BUCKET.put(key, response.body, { httpMetadata: { contentType: type }, customMetadata: { source: provider, listingId } });
  }
  return `/api/assets?key=${encodeURIComponent(key)}`;
}

function extractPreloadedState(html: string) {
  const marker = "__PRELOADED_STATE__ = ";
  const start = html.indexOf(marker);
  if (start < 0) throw new Error("LISTING_DATA_NOT_FOUND");
  const valueStart = start + marker.length;
  const end = html.indexOf("</script>", valueStart);
  if (end < 0) throw new Error("LISTING_DATA_NOT_FOUND");
  return JSON.parse(html.slice(valueStart, end).trim().replace(/;$/, ""));
}

function preferredPhotos(photos: EncarPhoto[]) {
  const priority = [
    "001", "002", "003", "004", "005", "031", "032", "033", "006", "007",
    "008", "009", "034", "035", "010", "036", "015", "016", "017", "018",
  ];
  const rank = new Map(priority.map((code, index) => [code, index]));
  return [...photos]
    .filter((photo) => /^\/carpicture\d+\//.test(photo.path || ""))
    .sort((a, b) => {
      const aRank = rank.get(a.code || "") ?? 999;
      const bRank = rank.get(b.code || "") ?? 999;
      return aRank - bRank || String(a.code).localeCompare(String(b.code));
    })
    .slice(0, MAX_IMPORTED_PHOTOS);
}

async function cachePhoto(listingId: string, photo: EncarPhoto) {
  const code = String(photo.code || crypto.randomUUID()).replace(/[^0-9A-Za-z_-]/g, "");
  const key = `projects/imports/encar/${listingId}/${code}.jpg`;
  const env = await runtimeEnv();
  const existing = await env.BUCKET.head(key);
  if (!existing) {
    const remote = new URL(`https://ci.encar.com${photo.path}`);
    if (remote.hostname !== "ci.encar.com") throw new Error("PHOTO_HOST_BLOCKED");
    const response = await fetch(remote, {
      headers: {
        Accept: "image/avif,image/webp,image/jpeg,image/*",
        "User-Agent": "Mozilla/5.0 CARVID listing importer",
      },
    });
    const type = response.headers.get("content-type") || "";
    const size = Number(response.headers.get("content-length") || 0);
    if (!response.ok || !type.startsWith("image/") || size > 8 * 1024 * 1024) {
      throw new Error("PHOTO_DOWNLOAD_FAILED");
    }
    await env.BUCKET.put(key, response.body, {
      httpMetadata: { contentType: type || "image/jpeg" },
      customMetadata: { source: "encar", listingId, photoCode: code },
    });
  }
  return `/api/assets?key=${encodeURIComponent(key)}`;
}

async function cachePhotosReliably(listingId: string, photos: EncarPhoto[]) {
  const output = new Map<string, string>();
  let pending = [...photos];
  for (let attempt = 0; attempt < 3 && pending.length; attempt += 1) {
    const failed: EncarPhoto[] = [];
    for (let index = 0; index < pending.length; index += 3) {
      const batch = pending.slice(index, index + 3);
      const results = await Promise.allSettled(batch.map((photo) => cachePhoto(listingId, photo)));
      results.forEach((result, resultIndex) => {
        const photo = batch[resultIndex];
        if (result.status === "fulfilled") output.set(photo.code || String(index + resultIndex), result.value);
        else failed.push(photo);
      });
    }
    pending = failed;
  }
  return photos
    .map((photo) => output.get(photo.code || ""))
    .filter((url): url is string => Boolean(url));
}

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const origin = request.headers.get("Origin");
    const fetchSite = request.headers.get("Sec-Fetch-Site");
    if ((origin && origin !== requestUrl.origin) || (fetchSite && fetchSite !== "same-origin")) {
      return Response.json({ error: "CROSS_ORIGIN_REQUEST_BLOCKED" }, { status: 403 });
    }
    const payload = (await request.json()) as { url?: unknown; provider?: unknown };
    const rawUrl = String(payload.url || "").trim();
    const identified = identifyProvider(rawUrl);
    if (identified.provider !== "encar") {
      const response = await fetch(identified.url, {
        headers: { Accept: "text/html,application/xhtml+xml", "Accept-Language": "ko-KR,ko;q=0.9", "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/127 Mobile Safari/537.36" },
        redirect: "follow",
      });
      const html = await response.text();
      if (!response.ok || html.length > MAX_HTML_BYTES) throw new Error("LISTING_FETCH_FAILED");
      const generic = genericVehicleData(html, identified.url, identified.providerName);
      const settled = await Promise.allSettled(generic.photos.map((photo, index) => cacheRemotePhoto(identified.provider, generic.listingId, photo, index)));
      const photos = settled.filter((item): item is PromiseFulfilledResult<string> => item.status === "fulfilled").map((item) => item.value);
      return Response.json({
        source: identified.provider, listingId: generic.listingId, sourceUrl: identified.url.toString(),
        importedPhotoCount: photos.length, totalPhotoCount: generic.photos.length, photos,
        vehicle: generic.vehicle, meta: { plate: "", dealer: "", location: "" },
        partial: !generic.vehicle.make || !photos.length,
      }, { headers: { "Cache-Control": "no-store" } });
    }
    const parsed = parseEncarUrl(rawUrl);
    const listingResponse = await fetch(parsed.url, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9",
        "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/127 Mobile Safari/537.36",
      },
      redirect: "follow",
    });
    const declaredSize = Number(listingResponse.headers.get("content-length") || 0);
    if (!listingResponse.ok || declaredSize > MAX_HTML_BYTES) throw new Error("LISTING_FETCH_FAILED");
    const html = await listingResponse.text();
    if (html.length > MAX_HTML_BYTES) throw new Error("LISTING_FETCH_FAILED");
    const state = extractPreloadedState(html);
    const base = state?.cars?.base as EncarBase | undefined;
    if (!base || String(base.vehicleId) !== parsed.id) throw new Error("LISTING_DATA_NOT_FOUND");

    const selected = preferredPhotos(Array.isArray(base.photos) ? base.photos : []);
    const photos = await cachePhotosReliably(parsed.id, selected);
    if (!photos.length) throw new Error("PHOTO_DOWNLOAD_FAILED");

    const diagnosis = Boolean(base.advertisement?.diagnosisCar);
    const homeService = Boolean(base.advertisement?.homeService);
    const feature = [
      diagnosis ? "엔카진단" : "성능점검 확인",
      homeService ? "엔카홈서비스" : "판매자 직접 문의",
      "스마트키",
      "내비게이션",
      "열선·통풍시트",
    ].join(" · ");
    const seller = base.partnership?.dealer?.firm?.name || base.partnership?.dealer?.name || "엔카 등록매물";

    return Response.json({
      source: "encar",
      listingId: parsed.id,
      sourceUrl: parsed.url,
      importedPhotoCount: photos.length,
      totalPhotoCount: base.photos?.length || photos.length,
      photos,
      vehicle: {
        make: base.category?.manufacturerName || "",
        model: base.category?.modelName || "",
        trim: base.category?.gradeName || "",
        year: base.category?.formYear || base.category?.yearMonth?.slice(0, 4) || "",
        mileage: String(base.spec?.mileage || ""),
        fuel: base.spec?.fuelName || "",
        transmission: base.spec?.transmissionName === "오토" ? "자동" : base.spec?.transmissionName || "",
        price: String(base.advertisement?.price || ""),
        feature,
        seller,
        phone: base.contact?.no || "",
        accidentHistory: diagnosis ? "엔카진단 차량 · 성능점검 제공" : "성능점검기록부 확인 필요",
        repairHistory: "",
        specialNotes: `${base.spec?.colorName || ""}${base.contact?.address ? ` · ${base.contact.address}` : ""}`,
      },
      meta: {
        plate: base.vehicleNo || "",
        dealer: base.partnership?.dealer?.name || "",
        location: base.contact?.address || "",
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "LISTING_IMPORT_FAILED";
    const status = message === "INVALID_URL" || message === "UNSUPPORTED_LISTING_URL" ? 400 : 502;
    console.error("listing_import_failed", message);
    return Response.json({ error: message }, { status });
  }
}
