// 주문 목록 · 만들기 대기열(앱 전체가 함께 쓰는 상태). 한 번에 한 개씩 만든다(폰 메모리 보호).
// 주문 하나 = 크레딧 1개 = 형식 A(짧은 소개) + 형식 B(자세히 보기) 세로 영상 두 편. 정사각 · 가로는 원할 때 더 만든다(크레딧 안 씀).
import { reactive } from "vue";
import { deleteOrder, listOrders, putOrder, readCredits, readProfile, writeCredits, type Format, type Order, type Output } from "./store";
import { posterOf, render } from "./make";
import type { ShortformAspect } from "@kit/render";

export const state = reactive({ orders: [] as Order[], credits: 0, loaded: false, busy: false, owner: "" });

type Job = { id: string; format: Format; aspect: ShortformAspect };
const queue: Job[] = [];
const fmt = (x: Output) => x.format ?? "A";
export const outputOf = (o: Order, format: Format, aspect: ShortformAspect) => o.outputs.find((x) => fmt(x) === format && x.aspect === aspect);
export const isQueued = (o: Order, format: Format, aspect: ShortformAspect) => queue.some((q) => q.id === o.id && q.format === format && q.aspect === aspect);

/** 로그인한 계정의 크레딧 · 주문을 불러온다(계정이 바뀌면 다시 부른다) */
export async function loadAll(owner: string) {
  state.owner = owner;
  state.loaded = false;
  queue.length = 0;
  state.credits = readCredits(owner);
  let all: Order[] = [];
  try {
    all = await listOrders();
  } catch {
    all = [];
  }
  // 계정 기능 전에 만든 주문은 지금 계정의 것으로 본다
  for (const o of all) if (!o.owner) {
    o.owner = owner;
    void putOrder(o).catch(() => undefined);
  }
  state.orders = all.filter((o) => o.owner === owner);
  // 이전에 만들다 멈춘 것(창을 닫음)은 다시 줄 세운다
  state.orders.forEach((o) => {
    if (o.status !== "making" && o.status !== "queued") return;
    o.status = "queued";
    for (const f of ["A", "B"] as const) if (!outputOf(o, f, "9:16")) queue.push({ id: o.id, format: f, aspect: "9:16" });
    if (!queue.some((q) => q.id === o.id)) o.status = "done";
  });
  state.loaded = true;
  void pump();
}

export async function submit(o: Order) {
  if (state.credits < 1) throw new Error("크레딧이 없어요.");
  o.owner = state.owner;
  o.poster = await posterOf(o.photos[0]!);
  state.orders.unshift(o);
  state.credits -= 1;
  writeCredits(state.owner, state.credits);
  try {
    await putOrder(o);
  } catch {
    state.orders = state.orders.filter((x) => x.id !== o.id);
    state.credits += 1;
    writeCredits(state.owner, state.credits);
    throw new Error("브라우저 저장 공간이 부족해요. 오래된 영상을 지우거나 저장 공간을 확보한 뒤 다시 시도해 주세요.");
  }
  queue.push({ id: o.id, format: "A", aspect: "9:16" }, { id: o.id, format: "B", aspect: "9:16" });
  void pump();
}

/** 크레딧 넣기(시안 결제: 실제 돈은 오가지 않는다) */
export function addCredits(n: number) {
  state.credits += n;
  writeCredits(state.owner, state.credits);
}

/** 같은 형식의 다른 비율(정사각 · 가로)을 추가로 만든다(크레딧 안 씀) */
export function addAspect(o: Order, format: Format, aspect: ShortformAspect) {
  if (outputOf(o, format, aspect) || isQueued(o, format, aspect)) return;
  if (o.status !== "making") o.status = "queued";
  queue.push({ id: o.id, format, aspect });
  void pump();
}

/** 같은 주문을 처음부터 다시(틀 · 음악을 바꾼 뒤). 크레딧 안 씀 */
export function remake(o: Order) {
  o.outputs = [];
  o.status = "queued";
  o.error = undefined;
  for (let i = queue.length - 1; i >= 0; i--) if (queue[i]!.id === o.id) queue.splice(i, 1);
  queue.push({ id: o.id, format: "A", aspect: "9:16" }, { id: o.id, format: "B", aspect: "9:16" });
  void pump();
}

export async function removeOrder(id: string) {
  state.orders = state.orders.filter((o) => o.id !== id);
  for (let i = queue.length - 1; i >= 0; i--) if (queue[i]!.id === id) queue.splice(i, 1);
  await deleteOrder(id).catch(() => undefined);
}

async function pump() {
  if (state.busy) return;
  const next = queue.shift();
  if (!next) return;
  const o = state.orders.find((x) => x.id === next.id);
  if (!o) return void pump();
  state.busy = true;
  o.status = "making";
  o.progress = 0;
  o.error = undefined;
  try {
    const r = await render(o, readProfile(), next.format, next.aspect, (p) => (o.progress = Math.round(p * 100)));
    const out: Output = { format: next.format, aspect: next.aspect, video: r.video, seconds: r.seconds, codec: r.codec };
    o.outputs = [...o.outputs.filter((x) => !(fmt(x) === next.format && x.aspect === next.aspect)), out];
    o.status = queue.some((q) => q.id === o.id) ? "queued" : "done";
  } catch (e) {
    o.status = "failed";
    o.error = e instanceof Error ? e.message : "영상을 만들지 못했어요.";
    for (let i = queue.length - 1; i >= 0; i--) if (queue[i]!.id === o.id) queue.splice(i, 1);
  } finally {
    o.progress = o.status === "done" ? 100 : o.progress;
    await putOrder(o).catch(() => undefined);
    state.busy = false;
    void pump();
  }
}
