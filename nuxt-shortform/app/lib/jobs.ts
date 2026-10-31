// 주문 목록 · 만들기 대기열(앱 전체가 함께 쓰는 상태). 한 번에 한 개씩 만든다(폰 메모리 보호).
import { reactive } from "vue";
import { deleteOrder, listOrders, putOrder, readCredits, readProfile, writeCredits, type Order, type Output } from "./store";
import { posterOf, render } from "./make";
import type { ShortformAspect } from "@kit/render";

export const state = reactive({ orders: [] as Order[], credits: 0, loaded: false, busy: false });

export async function loadAll() {
  state.credits = readCredits();
  try {
    state.orders = await listOrders();
  } catch {
    state.orders = [];
  }
  // 이전에 만들다 멈춘 것(창을 닫음)은 다시 줄 세운다
  state.orders.forEach((o) => {
    if (o.status === "making" || o.status === "queued") o.status = o.outputs.length ? "done" : "queued";
  });
  state.loaded = true;
  void pump();
}

const queue: { id: string; aspect: ShortformAspect }[] = [];

export async function submit(o: Order) {
  if (state.credits < 1) throw new Error("크레딧이 없어요.");
  o.poster = await posterOf(o.photos[0]!);
  state.orders.unshift(o);
  state.credits -= 1;
  writeCredits(state.credits);
  await putOrder(o).catch(() => undefined);
  queue.push({ id: o.id, aspect: "9:16" });
  void pump();
}

/** 다른 비율(정사각 · 가로)을 추가로 만든다(크레딧 안 씀: 같은 주문 안의 형식) */
export function addAspect(o: Order, aspect: ShortformAspect) {
  if (o.outputs.some((x) => x.aspect === aspect) || queue.some((q) => q.id === o.id && q.aspect === aspect)) return;
  o.status = "queued";
  queue.push({ id: o.id, aspect });
  void pump();
}

/** 같은 주문을 처음부터 다시(틀 · 음악 · 길이를 바꾼 뒤). 크레딧 안 씀 */
export function remake(o: Order) {
  o.outputs = [];
  o.status = "queued";
  o.error = undefined;
  queue.push({ id: o.id, aspect: "9:16" });
  void pump();
}

export async function removeOrder(id: string) {
  state.orders = state.orders.filter((o) => o.id !== id);
  await deleteOrder(id).catch(() => undefined);
}

async function pump() {
  if (state.busy) return;
  // 다시 연 화면에서 대기 중이던 주문을 줄에 넣는다
  state.orders.forEach((o) => {
    if (o.status === "queued" && !o.outputs.length && !queue.some((q) => q.id === o.id)) queue.push({ id: o.id, aspect: "9:16" });
  });
  const next = queue.shift();
  if (!next) return;
  const o = state.orders.find((x) => x.id === next.id);
  if (!o) return void pump();
  state.busy = true;
  o.status = "making";
  o.progress = 0;
  o.error = undefined;
  try {
    const r = await render(o, readProfile(), next.aspect, (p) => (o.progress = Math.round(p * 100)));
    const out: Output = { aspect: next.aspect, video: r.video, seconds: r.seconds, codec: r.codec };
    o.outputs = [...o.outputs.filter((x) => x.aspect !== next.aspect), out];
    o.status = queue.some((q) => q.id === o.id) ? "queued" : "done";
  } catch (e) {
    o.status = "failed";
    o.error = e instanceof Error ? e.message : "영상을 만들지 못했어요.";
  } finally {
    o.progress = o.status === "done" ? 100 : o.progress;
    await putOrder(o).catch(() => undefined);
    state.busy = false;
    void pump();
  }
}
