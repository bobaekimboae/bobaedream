// 화면 동작 → API 계약 호출. mock이면 이 브라우저 상태(R)만 바꾸고, 서버 모드면 먼저 화면을 바꾼 뒤(낙관적) 서버에 보내고 실패하면 되돌린다.
import { ref, type Ref } from "vue";
import { api, apiMode } from "./api/client";
import type { Board } from "./api/contract";
import { R, toggle, vote } from "./react";
import { fuelPosts, reviews, type Comment, type FuelPost, type Review } from "./data";
import { toast } from "./ui";

const server = apiMode === "server";

export const doVote = (board: Board, id: string, v: 1 | -1) => {
  vote(id, v);
  if (!server) return;
  api.react(board, id, v === 1 ? "like" : "dislike", R.like[id] === v).catch(() => { vote(id, v); toast("반응을 저장하지 못했어요"); });
};
export const doBookmark = (board: Board, id: string) => {
  toggle("save", id);
  toast(R.save[id] ? "즐겨찾기에 담았어요" : "즐겨찾기에서 뺐어요");
  if (!server) return;
  api.react(board, id, "bookmark", Boolean(R.save[id])).catch(() => { toggle("save", id); toast("즐겨찾기를 저장하지 못했어요"); });
};
export const doComment = async (board: Board, postId: string, body: string) => {
  const c = await api.createComment(board, postId, body);
  if (server) R.mine[postId] = [c as Comment, ...(R.mine[postId] ?? [])];
  return c;
};
export const doUncomment = async (board: Board, postId: string, commentId: string) => {
  await api.deleteComment(board, postId, commentId);
  if (server) R.mine[postId] = (R.mine[postId] ?? []).filter((c) => c.id !== commentId);
};

/** 목록: mock은 바로, 서버 모드는 받아 온 뒤 바꾼다 */
export const useReviews = (): Ref<Review[]> => {
  const list = ref<Review[]>(reviews());
  if (server) api.listReviews().then((x) => (list.value = x)).catch(() => toast("리뷰를 불러오지 못했어요"));
  return list;
};
export const useFuel = (): Ref<FuelPost[]> => {
  const list = ref<FuelPost[]>(fuelPosts());
  if (server) api.listFuel().then((x) => (list.value = x)).catch(() => toast("기록을 불러오지 못했어요"));
  return list;
};
