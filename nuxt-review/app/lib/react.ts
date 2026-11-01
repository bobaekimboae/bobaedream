// 공감 · 비공감 · 즐겨찾기 · 팔로우 · 내가 단 댓글: 이 브라우저(localStorage)에만 기억한다(서버 없음).
import { reactive, watch } from "vue";
import type { Comment } from "./data";

const KEY = "bbm-nuxt-review-reactions-v1";
type State = { like: Record<string, 1 | -1>; save: Record<string, true>; follow: Record<string, true>; cLike: Record<string, true>; mine: Record<string, Comment[]> };
const load = (): State => {
  try { return { like: {}, save: {}, follow: {}, cLike: {}, mine: {}, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return { like: {}, save: {}, follow: {}, cLike: {}, mine: {} }; }
};
export const R = reactive<State>(typeof window === "undefined" ? { like: {}, save: {}, follow: {}, cLike: {}, mine: {} } : load());
if (typeof window !== "undefined") watch(R, (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* 저장 공간 없음: 화면 안에서만 유지 */ } }, { deep: true });

/** 공감(1) · 비공감(-1): 같은 걸 다시 누르면 해제, 반대를 누르면 바뀐다 */
export const vote = (id: string, v: 1 | -1) => { if (R.like[id] === v) delete R.like[id]; else R.like[id] = v; };
export const likeCount = (id: string, base: number) => base + (R.like[id] === 1 ? 1 : 0);
export const toggle = (bag: "save" | "follow" | "cLike", id: string) => { if (R[bag][id]) delete R[bag][id]; else R[bag][id] = true; };
export const addComment = (postId: string, body: string) => {
  const c: Comment = { id: `m${Date.now()}`, author: "나", avatar: "community/assets/profile-avatars/avatar-01.svg", body, likes: 0, region: "", daysAgo: 0, replies: 0 };
  R.mine[postId] = [c, ...(R.mine[postId] ?? [])];
  return c;
};
export const removeComment = (postId: string, id: string) => { R.mine[postId] = (R.mine[postId] ?? []).filter((c) => c.id !== id); };
