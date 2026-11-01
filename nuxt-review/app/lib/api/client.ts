// API 연결: 기본은 이 브라우저(localStorage)에서 계약과 똑같이 흉내 내는 mock, `?api=https://…` 를 붙이면 Laravel 서버로 보낸다.
// 서버 주소는 내 컴퓨터(localhost · 127.0.0.1) 또는 https 만 받는다.
import type { Board, CommunityApi, Draft, FuelInput, Me, ReactionKind, ReviewInput } from "./contract";
import { fuelPosts, removeMine, reviews, saveFuel, saveReview, type Comment, type FuelPost, type Review } from "../data";
import { R, addComment, removeComment } from "../react";

const DRAFT_KEY = "bbm-nuxt-review-drafts-v1";
const readDrafts = (): Record<string, Draft<unknown>> => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}"); } catch { return {}; } };
const writeDrafts = (v: Record<string, Draft<unknown>>) => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(v)); } catch { /* 공간 없음 */ } };

export const mockApi: CommunityApi = {
  async me(): Promise<Me> {
    return { id: 1, nickname: "나", avatar: "avatar-01.svg", can: { post: true, comment: true, react: true } };
  },
  async listReviews() { return reviews(); },
  async listFuel() { return fuelPosts(); },
  async createReview(_input: ReviewInput, view: Review) {
    if (!saveReview(view)) throw new ApiError(507, "storage_full", "이 폰에 저장할 공간이 부족해요");
    return view;
  },
  async createFuel(_input: FuelInput, view: FuelPost) {
    if (!saveFuel(view)) throw new ApiError(507, "storage_full", "이 폰에 저장할 공간이 부족해요");
    return view;
  },
  async deletePost(board, id) { removeMine(board, id); },
  async createComment(_board, postId, body) { return addComment(postId, body); },
  async deleteComment(_board, postId, commentId) { removeComment(postId, commentId); },
  async react(_board, postId, kind: ReactionKind, on) {
    if (kind === "bookmark") { if (on) R.save[postId] = true; else delete R.save[postId]; return; }
    if (on) R.like[postId] = kind === "like" ? 1 : -1; else delete R.like[postId];
  },
  async getDraft<T>(board: Board) { return (readDrafts()[board] as Draft<T> | undefined) ?? null; },
  async saveDraft<T>(board: Board, modelId: string, modelName: string, payload: T) {
    const all = readDrafts();
    all[board] = { board, model_id: modelId, model_name: modelName, payload, updated_at: new Date().toISOString() };
    writeDrafts(all);
  },
  async deleteDraft(board) { const all = readDrafts(); delete all[board]; writeDrafts(all); },
};

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields: string[] = []) { super(message); }
}

/** Laravel 서버(community-api)로 보내는 연결. 인증 = Sanctum 토큰(Authorization: Bearer). 오류 모양 = { ok:false, error, code, fields } */
export const httpApi = (base: string, token = ""): CommunityApi => {
  const call = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
    const res = await fetch(`${base}/api/community${path}`, {
      method,
      headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 204) return undefined as T;
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, json.code ?? "error", json.error ?? "요청을 처리하지 못했어요", json.fields ?? []);
    return (json.data ?? json) as T;
  };
  return {
    me: () => call("GET", "/me"),
    listReviews: () => call("GET", "/review/posts"),
    listFuel: () => call("GET", "/fuel/posts"),
    createReview: (input) => call("POST", "/review/posts", input),
    createFuel: (input) => call("POST", "/fuel/posts", input),
    deletePost: (board, id) => call("DELETE", `/${board}/posts/${id}`),
    createComment: (board, postId, body) => call<Comment>("POST", `/${board}/posts/${postId}/comments`, { body }),
    deleteComment: (board, postId, commentId) => call("DELETE", `/${board}/posts/${postId}/comments/${commentId}`),
    react: (board, postId, kind, on) => call(on ? "PUT" : "DELETE", `/${board}/posts/${postId}/reactions/${kind}`),
    getDraft: <T>(board: Board) => call<Draft<T> | null>("GET", `/${board}/draft`),
    saveDraft: (board, modelId, modelName, payload) => call("PUT", `/${board}/draft`, { model_id: modelId, model_name: modelName, payload }),
    deleteDraft: (board) => call("DELETE", `/${board}/draft`),
  };
};

const pickBase = () => {
  if (typeof window === "undefined") return "";
  const v = new URLSearchParams(window.location.search).get("api") ?? "";
  try { const u = new URL(v); return u.protocol === "https:" || ["localhost", "127.0.0.1"].includes(u.hostname) ? u.origin : ""; } catch { return ""; }
};
const base = pickBase();
export const api: CommunityApi = base ? httpApi(base) : mockApi;
export const apiMode = base ? "server" : "mock";
