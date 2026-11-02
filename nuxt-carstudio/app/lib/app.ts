// 화면 전체에서 함께 쓰는 상태: 화면 이동(주소 검색어), 크레딧, 알림, 크레딧 사기 창.
import { reactive } from "vue";
import { query } from "./site";
import { readCredits, writeCredits } from "./store";

export type View = "orders" | "editor" | "video" | "pricing" | "profile";
export const ui = reactive({
  view: "orders" as View,
  id: "",
  step: "",
  tab: "editor" as "editor" | "video",
  credits: 3,
  toast: "",
  buyOpen: false,
  lang: "ko",
  /** 모바일 앱 모양 강제(?app=1) */
  forceApp: false,
});
let tt = 0;
export function say(t: string) {
  ui.toast = t;
  window.clearTimeout(tt);
  tt = window.setTimeout(() => (ui.toast = ""), 3200);
}
export function readRoute() {
  const q = query();
  ui.view = (["orders", "editor", "video", "pricing", "profile"].includes(q.get("v") || "") ? q.get("v") : "orders") as View;
  ui.id = q.get("id") || "";
  ui.step = q.get("step") || "";
  ui.tab = q.get("tab") === "video" ? "video" : "editor";
  ui.forceApp = q.get("app") === "1";
}
export function go(v: View, extra: Record<string, string> = {}) {
  const u = new URL(window.location.href);
  const keepApp = u.searchParams.get("app");
  u.search = "";
  if (v !== "orders") u.searchParams.set("v", v);
  for (const [k, val] of Object.entries(extra)) if (val) u.searchParams.set(k, val);
  if (keepApp) u.searchParams.set("app", keepApp);
  history.pushState(null, "", u);
  readRoute();
  window.scrollTo({ top: 0 });
}
export function loadCredits() {
  ui.credits = readCredits();
}
export function spend(n: number) {
  if (ui.credits < n) return false;
  ui.credits -= n;
  writeCredits(ui.credits);
  return true;
}
export function addCredits(n: number) {
  ui.credits += n;
  writeCredits(ui.credits);
}
export const fmtDate = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};
export const isPhoneSize = () => typeof window !== "undefined" && (ui.forceApp || window.matchMedia("(max-width: 767px)").matches);
