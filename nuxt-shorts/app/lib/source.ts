// 숏폼 데이터를 어디서 받을지 정한다.
//   api      = 보배드림 숏폼 API(shorts-api, Laravel 12). 부위 시각 · 시청 기록까지 됨. 운영 기본값.
//   live     = 보배드림 리뉴얼 화면과 같은 도메인에서 원본 BFF(/api/bff/v2/cars/shorts)를 바로 부름. 로그인 쿠키로 찜까지 됨.
//   snapshot = 원본 실매물을 받아 둔 사본(data/shorts-snapshot.json). 원본이 다른 도메인을 막는(CORS) GitHub Pages 시안용.
// 주소로 고르기: ?source=api&api=https://… · ?source=live · ?source=snapshot
import { normalizeCar } from "./normalize.js";
import type { Page, ShortItem, SourceKind } from "./types";

export type LikeResult = { ok: true; liked: boolean; likes: number | null } | { ok: false; reason: "login" | "error"; message: string };

export interface ShortsSource {
  kind: SourceKind;
  label: string;
  first(startId?: string | null): Promise<Page>;
  more(after: string): Promise<Page>;
  like(id: string, on: boolean): Promise<LikeResult>;
  view(id: string, watched: number): void;
}

export class SourceError extends Error {
  constructor(message: string, public status = 0) {
    super(message);
  }
}

const LIVE_HOSTS = ["dev.bbmuseum.co.kr", "staging.bbmuseum.co.kr", "www.bobaedream.co.kr", "bobaedream.co.kr"];

async function json(res: Response) {
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new SourceError(body?.error || body?.message || "숏폼을 불러오지 못했어요.", res.status);
  return body;
}

function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 10000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  return fetch(url, { ...init, signal: ctl.signal })
    .catch((e) => {
      throw new SourceError(e?.name === "AbortError" ? "응답이 늦어요. 잠시 뒤 다시 시도해 주세요." : "숏폼을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.");
    })
    .finally(() => clearTimeout(t));
}

function apiSource(base: string, category: string, token: () => string | null): ShortsSource {
  const h = (): HeadersInit => {
    const t = token();
    return { Accept: "application/json", "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
  };
  const list = async (q: Record<string, string>): Promise<Page> => {
    const u = new URL(`${base}/api/shorts`);
    u.searchParams.set("category", category);
    for (const [k, v] of Object.entries(q)) u.searchParams.set(k, v);
    const b = await json(await fetchWithTimeout(u.toString(), { headers: h() }));
    return { items: b.data as ShortItem[], next: b.next ?? null };
  };
  return {
    kind: "api",
    label: "숏폼 API",
    async first(startId) {
      if (startId) {
        try {
          const b = await json(await fetchWithTimeout(`${base}/api/shorts/${encodeURIComponent(startId)}?category=${category}`, { headers: h() }));
          return { items: [b.data as ShortItem], next: b.next ? (b.data as ShortItem).id : null };
        } catch {
          /* 그 매물이 끝났으면 처음부터 */
        }
      }
      return list({});
    },
    more: (after) => list({ after }),
    async like(id, on) {
      if (!token()) return { ok: false, reason: "login", message: "로그인하면 찜할 수 있어요." };
      const res = await fetchWithTimeout(`${base}/api/shorts/${encodeURIComponent(id)}/like`, { method: on ? "PUT" : "DELETE", headers: h() });
      const b = await res.json().catch(() => null);
      if (res.status === 401) return { ok: false, reason: "login", message: "로그인하면 찜할 수 있어요." };
      if (!res.ok) return { ok: false, reason: "error", message: b?.error || "찜을 저장하지 못했어요." };
      return { ok: true, liked: on, likes: b?.likes ?? null };
    },
    view(id, watched) {
      void fetchWithTimeout(`${base}/api/shorts/${encodeURIComponent(id)}/views`, {
        method: "POST",
        headers: h(),
        body: JSON.stringify({ watched: Math.round(watched * 10) / 10 }),
        keepalive: true,
      }).catch(() => {});
    },
  };
}

function liveSource(base: string, category: string): ShortsSource {
  const one = async (publicId: string | null) => {
    const res = await fetchWithTimeout(`${base}/v2/cars/shorts`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(publicId ? { category_code: category, public_car_id: publicId } : { category_code: category }),
    });
    if (res.status === 404) return { car: null, next: null as string | null };
    const b = await json(res);
    return { car: b?.data?.[0] ?? null, next: (b?.meta?.navigation?.next?.public_id as string | undefined) ?? null };
  };
  // 원본은 한 번에 한 매물을 준다. 다음 매물 번호를 따라가며 n개를 모은다.
  const walk = async (startCursor: string | null, n: number, includeStart: boolean): Promise<Page> => {
    const items: ShortItem[] = [];
    const seen = new Set<string>();
    let cursor = startCursor;
    let last: string | null = null;
    if (!includeStart && cursor) {
      cursor = (await one(cursor)).next;
      if (!cursor) return { items, next: null };
    }
    let first = true;
    while (items.length < n && (first || cursor)) {
      first = false;
      const r = await one(cursor);
      if (!r.car || seen.has(r.car.public_id)) {
        cursor = null;
        break;
      }
      seen.add(r.car.public_id);
      last = r.car.public_id;
      const it = normalizeCar(r.car);
      if (it) items.push(it);
      cursor = r.next;
    }
    return { items, next: cursor ? last : null };
  };
  return {
    kind: "live",
    label: "보배드림 실매물",
    first: (startId) => walk(startId ?? null, 4, true),
    more: (after) => walk(after, 4, false),
    async like(id, on) {
      const res = await fetchWithTimeout(`${base}/v2/cars/${encodeURIComponent(id)}/like`, {
        method: on ? "PUT" : "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (res.status === 401) return { ok: false, reason: "login", message: "로그인하면 찜할 수 있어요." };
      if (!res.ok) return { ok: false, reason: "error", message: "찜을 저장하지 못했어요." };
      const b = await res.json().catch(() => null);
      return { ok: true, liked: on, likes: b?.data?.like_count ?? null };
    },
    view() {
      /* 원본 시청 기록(/v2/car-videos/{id}/views)은 영상 번호가 필요해 원본 화면이 맡는다 */
    },
  };
}

function snapshotSource(load: () => Promise<{ fetched_at: string; items: ShortItem[] }>): ShortsSource {
  let cache: ShortItem[] | null = null;
  const all = async () => (cache ??= (await load()).items);
  const SIZE = 4;
  const slice = (list: ShortItem[], from: number): Page => {
    const items = list.slice(from, from + SIZE);
    return { items, next: from + SIZE < list.length ? (items[items.length - 1]?.id ?? null) : null };
  };
  return {
    kind: "snapshot",
    label: "실매물 사본",
    async first(startId) {
      const list = await all();
      const at = startId ? Math.max(0, list.findIndex((s) => s.id === startId)) : 0;
      return slice(list, at);
    },
    async more(after) {
      const list = await all();
      return slice(list, list.findIndex((s) => s.id === after) + 1);
    },
    async like() {
      return { ok: false, reason: "login", message: "로그인하면 찜할 수 있어요." };
    },
    view() {},
  };
}

export function pickSource(opts: {
  apiBase: string;
  liveBase: string;
  category: string;
  token: () => string | null;
  snapshot: () => Promise<{ fetched_at: string; items: ShortItem[] }>;
}): ShortsSource {
  const q = new URLSearchParams(window.location.search);
  const want = q.get("source");
  const api = (q.get("api") || opts.apiBase || "").replace(/\/$/, "");
  const apiOk = /^https:\/\//.test(api) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(api);
  const onLive = LIVE_HOSTS.includes(window.location.hostname);
  if ((want === "api" || (!want && api)) && apiOk) return apiSource(api, opts.category, opts.token);
  if (want === "live" || (!want && onLive)) return liveSource(onLive ? "/api/bff" : opts.liveBase, opts.category);
  return snapshotSource(opts.snapshot);
}
