// 주소 = 화면: ?board=review|fuel&view=list|detail|write&id=… 휴대폰 뒤로가기가 앱 안에서 한 화면씩 돌아가게 history를 쓴다.
import { reactive } from "vue";

export type Board = "review" | "fuel";
export type View = "list" | "detail" | "write";
export type Route = { board: Board; view: View; id: string };

const parse = (): Route => {
  const q = new URLSearchParams(window.location.search);
  const board: Board = q.get("board") === "fuel" ? "fuel" : "review";
  const v = q.get("view");
  const view: View = v === "detail" || v === "write" ? v : "list";
  return { board, view, id: q.get("id") ?? "" };
};

export const route = reactive<Route>({ board: "review", view: "list", id: "" });

const toUrl = (r: Route) => {
  const q = new URLSearchParams(window.location.search);
  q.set("board", r.board);
  q.set("view", r.view);
  if (r.id) q.set("id", r.id); else q.delete("id");
  return `${window.location.pathname}?${q.toString()}`;
};

let guard: (() => boolean) | null = null;
let depth = 0;
/** 목록으로 돌아오면 보던 자리로(원본 앱과 같음) */
const scrollMemo: Record<string, number> = {};
const key = (r: Route) => `${r.board}:${r.view}:${r.id}`;
const restore = (r: Route) => requestAnimationFrame(() => window.scrollTo(0, scrollMemo[key(r)] ?? 0));
/** 글쓰기 화면이 「나갈까요?」를 물을 때 쓴다. false를 돌려주면 뒤로가기를 막는다. */
export const setLeaveGuard = (fn: (() => boolean) | null) => { guard = fn; };

export function startRouter() {
  // 넉스트 기본 라우터(페이지 없음)가 뒤로가기 뒤에 빈 state로 주소를 덮어쓴다(이 앱의 board · view를 잃음).
  // 이 앱의 state가 아닌 replaceState는 지금 화면 주소 · state로 바꿔 쓴다.
  const orig = window.history.replaceState.bind(window.history);
  window.history.replaceState = (s: unknown, t: string, u?: string | URL | null) =>
    s && typeof s === "object" && "board" in (s as object) ? orig(s, t, u) : orig({ ...route }, t, toUrl(route));
  Object.assign(route, parse());
  window.history.replaceState({ ...route }, "", toUrl(route));
  // 넉스트 기본 라우터(페이지 없음)도 popstate를 받아 주소 · state를 덮어쓴다. 캡처 단계에서 먼저 받고 전파를 멈춘다.
  window.addEventListener("popstate", (e) => {
    e.stopImmediatePropagation();
    if (guard && !guard()) {
      window.history.pushState({ ...route }, "", toUrl(route));
      return;
    }
    depth = Math.max(0, depth - 1);
    Object.assign(route, (e.state as Route) ?? parse());
    restore(route);
  }, { capture: true });
}

export const go = (r: Partial<Route>) => {
  const next: Route = { board: r.board ?? route.board, view: r.view ?? "list", id: r.id ?? "" };
  scrollMemo[key(route)] = window.scrollY;
  window.history.pushState(next, "", toUrl(next));
  depth += 1;
  Object.assign(route, next);
  window.scrollTo(0, 0);
};
export const replace = (r: Partial<Route>) => {
  const next: Route = { board: r.board ?? route.board, view: r.view ?? "list", id: r.id ?? "" };
  window.history.replaceState(next, "", toUrl(next));
  Object.assign(route, next);
  window.scrollTo(0, 0);
};
/** 앱 안에서 뒤로: 기록이 있으면 history.back, 처음 연 화면이면 목록으로 */
export const back = () => {
  if (depth > 0) window.history.back();
  else if (route.view !== "list") replace({ board: route.board, view: "list" });
  else window.location.href = new URL("../community/naver-cafe-list.html", document.baseURI).href;
};
