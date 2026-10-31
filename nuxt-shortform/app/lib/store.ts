import { toRaw } from "vue";

// 주문(만든 영상) 보관: 이 브라우저의 IndexedDB `bbm-shortform`. 서버로 보내지 않는다(시안).
export type Car = { maker: string; model: string; year: string; price: string; mileage: string; color: string; url: string };
export type Profile = { name: string; company: string; phone: string; logo: string | null };
export type Status = "queued" | "making" | "done" | "failed";
export type Style = { template: "reels" | "card" | "band"; music: MusicId; seconds: 15 | 20 | 30 };
export type MusicId = "drive" | "calm" | "punch" | "none";
/** 형식 A = 짧은 소개 영상, 형식 B = 사진 전부 · 자세히 보기 영상(autohaus-video 「Format A + B」, 크레딧 1개에 둘 다) */
export type Format = "A" | "B";
export type Output = { format?: Format; aspect: "9:16" | "1:1" | "16:9"; video: Blob; seconds: number; codec: string };
export type Order = {
  id: string;
  /** 주문한 계정(이메일). 다른 계정으로 로그인하면 보이지 않는다 */
  owner?: string;
  createdAt: number;
  car: Car;
  note: string;
  photos: Blob[];
  style: Style;
  status: Status;
  progress: number;
  error?: string;
  poster?: string;
  outputs: Output[];
};

export type ShortformDraft = {
  car: Car;
  note: string;
  style: Style;
  profile: Profile;
  savedAt: number;
};

const DB = "bbm-shortform";
const STORE = "orders";
let dbp: Promise<IDBDatabase> | null = null;
function db() {
  dbp ??= new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "id" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return dbp;
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const req = fn(d.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export const listOrders = async () => (await tx<Order[]>("readonly", (s) => s.getAll() as IDBRequest<Order[]>)).sort((a, b) => b.createdAt - a.createdAt);
export const getOrder = (id: string) => tx<Order | undefined>("readonly", (s) => s.get(id) as IDBRequest<Order | undefined>);
/** 화면 상태(Vue 반응형)는 IndexedDB에 그대로 못 넣는다: 평범한 객체로 풀어서 넣는다(사진·영상 Blob은 그대로) */
function plain(o: Order): Order {
  const r = toRaw(o);
  return { ...r, car: { ...toRaw(r.car) }, style: { ...toRaw(r.style) }, photos: toRaw(r.photos).map((b) => toRaw(b)), outputs: toRaw(r.outputs).map((x) => ({ ...toRaw(x) })) };
}
export const putOrder = (o: Order) => tx("readwrite", (s) => s.put(plain(o)));
export const deleteOrder = (id: string) => tx("readwrite", (s) => s.delete(id));
export const newId = () => `sf${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// 크레딧 · 판매자 정보: 이 브라우저 localStorage
const CREDIT_KEY = "bbm-sf-credits";
const PROFILE_KEY = "bbm-sf-profile";
const DRAFT_KEY = "bbm-sf-draft";
/** 시험용 무료 크레딧(autohaus-video의 「첫 영상 무료」를 따라 3개로 시작) */
export const FREE_CREDITS = 3;
const creditKey = (owner: string) => `${CREDIT_KEY}:${owner}`;
export function readCredits(owner: string): number {
  try {
    const v = localStorage.getItem(creditKey(owner));
    return v == null ? FREE_CREDITS : Math.max(0, Number(v) || 0);
  } catch {
    return FREE_CREDITS;
  }
}
export function writeCredits(owner: string, n: number) {
  try { localStorage.setItem(creditKey(owner), String(n)); } catch { /* 저장 못 해도 화면은 계속 */ }
}
export function readProfile(): Profile {
  try {
    return { name: "", company: "", phone: "", logo: null, ...JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") };
  } catch {
    return { name: "", company: "", phone: "", logo: null };
  }
}
export function writeProfile(p: Profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch { /* 로고가 너무 크면 저장 실패 — 화면은 계속 */ }
}

const draftKey = (owner: string) => `${DRAFT_KEY}:${owner || "guest"}`;
export function readDraft(owner: string): ShortformDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(owner));
    return raw ? (JSON.parse(raw) as ShortformDraft) : null;
  } catch {
    return null;
  }
}
export function writeDraft(owner: string, draft: ShortformDraft) {
  try { localStorage.setItem(draftKey(owner), JSON.stringify(draft)); } catch { /* 주문 단계에서 저장 공간을 다시 검증 */ }
}
export function clearDraft(owner: string) {
  try { localStorage.removeItem(draftKey(owner)); } catch { /* 지우지 못해도 제작은 계속 */ }
}
