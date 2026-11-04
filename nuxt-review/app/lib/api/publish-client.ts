// 동처띠 글쓰기 키트(일상 · 질문 · 영상 · 긴 글 · 내 차 팔기 · 구매가) API 연결.
// 기본 = 이 브라우저(localStorage)에 저장하는 mock, `?api=https://…` 이면 Laravel(community-api)로 보낸다. 고르는 규칙은 client.ts 와 같다.
// 서버 계약 원본 = docs/community-publish-api.md · community-api/openapi.yaml (Laravel 12 · PHP 8.4 · PostgreSQL 15).
import { apiBase, apiToken, ApiError } from "./client";
import { allDrafts, deleteDraft, getDraft, postById, posts, saveDraft, savePost, type Media, type Post } from "../publish";
import type { Kind } from "../route";

export type PubKind = Exclude<Kind, "review" | "fuel">;
export type PubDraft<T> = { kind: Kind; at: string; payload: T };
/** 서버가 내려 주는 글(화면 Post + 서버 정책 결과) */
export type ServerPost = Post & { author?: string; avatar?: string; views?: number; likes?: number; comments?: number; can?: { update: boolean; delete: boolean; report: boolean } };

export interface PublishApi {
  list(kind: PubKind): Promise<ServerPost[]>;
  get(kind: PubKind, id: string): Promise<ServerPost | null>;
  /** 사진 · 영상(data: · blob: 주소)을 먼저 올리고 등록한다. progress(올린 수, 전체) */
  create(kind: PubKind, post: Omit<Post, "id" | "kind" | "createdAt">, progress?: (done: number, all: number) => void): Promise<ServerPost>;
  getDraft<T>(kind: Kind): Promise<PubDraft<T> | null>;
  saveDraft<T>(kind: Kind, payload: T): Promise<void>;
  deleteDraft(kind: Kind): Promise<void>;
  drafts(): Promise<PubDraft<{ title?: string; body?: string }>[]>;
  vote(kind: PubKind, id: string, choices: number[]): Promise<void>;
}

/* ---------- mock: 서버 연결 전 동작 그대로(이 브라우저에만 저장) ---------- */
export const mockPublishApi: PublishApi = {
  async list(kind) { return posts(kind); },
  async get(_kind, id) { return postById(id); },
  async create(kind, p) {
    const post: Post = { ...p, id: `p${Date.now().toString(36)}`, kind, createdAt: new Date().toISOString() };
    if (!savePost(post)) throw new ApiError(507, "storage_full", "저장 공간이 부족해 등록하지 못했어요");
    return post;
  },
  async getDraft<T>(kind: Kind) { const d = getDraft<T>(kind); return d ? { kind, at: d.at, payload: d.payload } : null; },
  async saveDraft(kind, payload) { saveDraft(kind, payload); },
  async deleteDraft(kind) { deleteDraft(kind); },
  async drafts() {
    return Object.entries(allDrafts()).map(([k, v]) => ({ kind: k as Kind, at: v!.at, payload: v!.payload as { title?: string; body?: string } }));
  },
  async vote() { /* 이 브라우저 글은 투표 집계가 없다 */ },
};

/* ---------- 서버(Laravel community-api) ---------- */
const UUID = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-cover)?\.\w+(?:\?.*)?$/i;
/** 서버 파일 주소의 파일 이름이 곧 upload id(…/{id}.jpg) */
export const uploadIdOf = (url: string) => url.match(UUID)?.[1] ?? null;
const isLocal = (s: unknown): s is string => typeof s === "string" && (s.startsWith("data:") || s.startsWith("blob:"));
/** "2026년 11월" · "2026.11" · "2026-11" → "2026.11" */
export const normMonth = (s = "") => { const m = s.match(/(\d{4})\D+(\d{1,2})/); return m ? `${m[1]}.${m[2]!.padStart(2, "0")}` : ""; };

export const httpPublishApi = (base: string, token = ""): PublishApi => {
  const root = `${base}/api/community`;
  const auth = (): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {});
  const call = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
    const res = await fetch(root + path, { method, headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...auth() }, body: body ? JSON.stringify(body) : undefined });
    if (res.status === 204) return undefined as T;
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, json.code ?? "error", json.error ?? "요청을 처리하지 못했어요", json.fields ?? []);
    return (json && typeof json === "object" && "data" in json ? json.data : json) as T;
  };
  type Up = { id: string; url: string | null; cover_url?: string; kind: "image" | "video" };
  const done = new Map<string, Up>(); // 같은 사진을 두 번 올리지 않는다(자동 임시저장마다 다시 올리지 않게)
  const upload = async (src: string, o: { purpose?: "post" | "receipt"; cover?: string; duration?: number } = {}): Promise<Up> => {
    const key = `${o.purpose ?? "post"}:${src}`; // 영수증은 같은 사진이어도 비공개로 따로 올린다
    const hit = done.get(key);
    if (hit) return hit;
    const fd = new FormData();
    const blob = await (await fetch(src)).blob();
    fd.append("file", blob, blob.type.startsWith("video/") ? "video.mp4" : "photo.jpg");
    if (o.purpose) fd.append("purpose", o.purpose);
    if (o.cover && isLocal(o.cover)) fd.append("cover", await (await fetch(o.cover)).blob(), "cover.jpg");
    if (o.duration) fd.append("duration", String(Math.round(o.duration * 10) / 10));
    const res = await fetch(`${root}/uploads`, { method: "POST", headers: { Accept: "application/json", ...auth() }, body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, json.code ?? "error", json.error ?? "파일을 올리지 못했어요", json.fields ?? []);
    done.set(key, json.data as Up);
    return json.data as Up;
  };
  /** 값 안의 data: · blob: 주소를 올린 파일 주소로 바꾼다. 영상 Media 는 표지 · 길이와 함께 올린다. invoice(영수증)는 임시저장에 넣지 않는다 */
  const materialize = async <T>(v: T, count: { n: number; all: number; on?: (d: number, a: number) => void }, key = ""): Promise<T> => {
    if (key === "invoice") return "" as T;
    if (isLocal(v)) { const u = await upload(v); count.n += 1; count.on?.(count.n, count.all); return (u.url ?? "") as T; }
    if (Array.isArray(v)) { const out = []; for (const x of v) out.push(await materialize(x, count)); return out as T; }
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (o.kind === "video" && isLocal(o.src)) {
        const u = await upload(o.src, { cover: o.cover as string | undefined, duration: o.duration as number | undefined });
        count.n += 1; count.on?.(count.n, count.all);
        return { ...o, src: u.url, cover: u.cover_url ?? "" } as T;
      }
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(o)) out[k] = await materialize(x, count, k);
      return out as T;
    }
    return v;
  };
  const countLocal = (v: unknown, key = ""): number => {
    if (key === "invoice" || key === "cover") return 0;
    if (isLocal(v)) return 1;
    if (Array.isArray(v)) return v.reduce((s, x) => s + countLocal(x), 0);
    if (v && typeof v === "object") return Object.entries(v as Record<string, unknown>).reduce((s, [k, x]) => s + countLocal(x, k), 0);
    return 0;
  };

  /** 화면 Post → 서버 등록 본문(StorePublishRequest) */
  const toInput = (kind: PubKind, p: Omit<Post, "id" | "kind" | "createdAt">, receiptId: string | null) => {
    const media = (p.media ?? []).map((m: Media) => uploadIdOf(m.src)).filter(Boolean);
    const op = p.ownerPrice;
    const raw = (p.raw ?? {}) as Record<string, unknown>;
    return {
      title: p.title || null, body: p.body || null, media, topic: p.topic || null, circle: p.circle || null, claim: p.claim || null, city: p.city || null,
      model_id: (kind === "price" ? op?.car?.id : p.car?.id) ?? null,
      vote: p.vote && (kind === "dynamic" || kind === "ask") ? { title: p.vote.title, multi: p.vote.multi, options: p.vote.options, ends_in_days: parseInt(p.vote.until, 10) || 3 } : undefined,
      owner_price: op?.car && (kind === "dynamic" || kind === "long") ? { model_id: op.car.id, month: normMonth(op.month), list_price: Number(op.nake), paid_price: Number(op.total), city: op.city || null } : undefined,
      parts: kind === "long" && p.parts?.length ? p.parts.map((x) => ({ type: x.type, brand: x.brand, metric: x.metric || null, price: x.price || null })) : undefined,
      sell: kind === "sell" ? raw : undefined,
      price: kind === "price" && op ? {
        list_price: Number(op.nake), paid_price: Number(op.total), purchase_month: normMonth(op.month), city: op.city || p.city || "",
        pay: op.pay || null, dealer: op.dealer || null, gift: (raw.gift as string) || null, receipt_upload_id: receiptId,
      } : undefined,
    };
  };

  return {
    list: (kind) => call<ServerPost[]>("GET", `/${kind}/posts?mine=1`),
    get: async (kind, id) => { try { return await call<ServerPost>("GET", `/${kind}/posts/${encodeURIComponent(id)}`); } catch (e) { if (e instanceof ApiError && e.status === 404) return null; throw e; } },
    async create(kind, p, progress) {
      const { raw, ...rest } = p;
      const count = { n: 0, all: countLocal(rest), on: progress };
      const ready = await materialize(rest, count);
      const receipt = (raw as Record<string, unknown> | undefined)?.receipt;
      const receiptId = isLocal(receipt) ? (await upload(receipt, { purpose: "receipt" })).id : null;
      const saved = await call<ServerPost>("POST", `/${kind}/posts`, toInput(kind, { ...ready, raw }, receiptId));
      done.clear(); // 글에 붙은 파일은 다른 글에 다시 못 쓰므로, 같은 사진을 또 고르면 새로 올린다
      return saved;
    },
    async getDraft<T>(kind: Kind) {
      const d = await call<{ board: Kind; payload: T; updated_at: string } | null>("GET", `/${kind}/draft`);
      return d ? { kind: d.board, at: d.updated_at, payload: d.payload } : null;
    },
    async saveDraft(kind, payload) {
      const ready = await materialize(payload, { n: 0, all: 0 });
      await call("PUT", `/${kind}/draft`, { payload: ready });
    },
    deleteDraft: (kind) => call("DELETE", `/${kind}/draft`),
    async drafts() {
      const all = await call<{ board: Kind; payload: { title?: string; body?: string }; updated_at: string }[]>("GET", "/drafts");
      return all.filter((d) => d.board !== "review" && d.board !== "fuel").map((d) => ({ kind: d.board, at: d.updated_at, payload: d.payload }));
    },
    vote: (kind, id, choices) => call("PUT", `/${kind}/posts/${id}/vote`, { choices }),
  };
};

export const pubApi: PublishApi = apiBase ? httpPublishApi(apiBase, apiToken) : mockPublishApi;
