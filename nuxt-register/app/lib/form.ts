// 등록 화면 상태(Nuxt useState) · 검사 · 임시저장 · 등록 시간 측정.
// 서버가 붙기 전 시안: 임시저장은 이 브라우저(IndexedDB bbm-register), 등록하기는 확인 화면까지만.
import { useState } from "#app";
import { computed } from "vue";
import { categoryOf, visibleFields, type CategoryId } from "./categories";

export type Media = { id: string; kind: "photo" | "video"; src: string; poster?: string; from: "album" | "shoot"; slot?: string; seconds?: number };
/** 초톳 「Địa chỉ」 4칸: 시·도 / 시·군·구 / 읍·면·동 / 상세 주소(선택) */
export type Region = { sido: string; gu: string; dong?: string; detail?: string } | null;
export const regionLine = (r: Region) => (r ? [r.sido, r.gu, r.dong, r.detail?.trim()].filter(Boolean).join(" ") : "");
export type PostType = "free" | "premium";
export type FormState = {
  category: CategoryId;
  media: Media[];
  desc: string;
  title: string;
  price: string;
  region: Region;
  seller: "개인" | "딜러";
  values: Record<string, string>;
  postType: PostType;
  sns: string[];
};

export const MAX_MEDIA = 30;
export const DESC_MAX = 1500;
export const TITLE_MAX = 50;

export const blank = (category: CategoryId = "car"): FormState => ({
  category,
  media: [],
  desc: "",
  title: "",
  price: "",
  region: null,
  seller: "개인",
  values: {},
  postType: "free",
  sns: [],
});

export function useForm() {
  const form = useState<FormState>("reg-form", () => blank());
  /** 등록하기를 한 번 누른 뒤부터 빈 필수 칸을 빨갛게(초톳과 같다) */
  const tried = useState<boolean>("reg-tried", () => false);
  const cat = computed(() => categoryOf(form.value.category));
  const fields = computed(() => visibleFields(cat.value, form.value.values));

  const errors = computed<Record<string, string>>(() => {
    const f = form.value;
    const e: Record<string, string> = {};
    if (!f.media.length) e.media = "사진을 1장 이상 올려 주세요";
    if (f.desc.trim().length < 10) e.desc = f.desc.trim() ? "10자 이상 입력해 주세요" : "입력해 주세요";
    if (!f.title.trim()) e.title = "입력해 주세요";
    const price = Number(f.price.replace(/[^0-9]/g, ""));
    if (!f.price) e.price = "입력해 주세요";
    else if (!price) e.price = "0보다 큰 금액을 입력해 주세요";
    if (!f.region || !f.region.gu || !f.region.dong) e.region = "선택해 주세요";
    for (const fd of fields.value) {
      if (!fd.required) continue;
      if (!f.values[fd.key]) e[fd.key] = fd.kind === "number" || fd.kind === "text" ? "입력해 주세요" : "선택해 주세요";
    }
    return e;
  });
  const shown = (key: string) => (tried.value ? errors.value[key] ?? "" : "");

  const setValue = (key: string, val: string) => {
    const fd = cat.value.fields.find((x) => x.key === key);
    const next = { ...form.value.values, [key]: val };
    if (!val) delete next[key];
    for (const r of fd?.resets ?? []) delete next[r];
    form.value = { ...form.value, values: next };
  };
  const setCategory = (id: CategoryId) => {
    if (id === form.value.category) return;
    form.value = { ...form.value, category: id, values: {} };
  };
  return { form, tried, cat, fields, errors, shown, setValue, setCategory };
}

// ── 임시저장(IndexedDB) ──
const DB = "bbm-register";
const STORE = "drafts";
const DRAFT_ID = "draft";
let dbp: Promise<IDBDatabase> | null = null;
const db = () =>
  (dbp ??= new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
const plain = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(b);
  });
/** blob: 주소는 탭을 닫으면 사라지므로 저장할 때만 글자(data URL)로 바꾼다 */
const keep = async (s?: string) => (s && s.startsWith("blob:") ? blobToDataUrl(await (await fetch(s)).blob()) : s);

export async function saveDraft(f: FormState) {
  const media = await Promise.all(f.media.map(async (m) => ({ ...m, src: (await keep(m.src))!, poster: await keep(m.poster) })));
  const rec = { id: DRAFT_ID, savedAt: Date.now(), form: plain({ ...f, media }) };
  const d = await db();
  await new Promise<void>((resolve, reject) => {
    const tx = d.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(rec);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
export async function loadDraft(): Promise<{ savedAt: number; form: FormState } | null> {
  try {
    const d = await db();
    return await new Promise((resolve, reject) => {
      const req = d.transaction(STORE).objectStore(STORE).get(DRAFT_ID);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}
export async function dropDraft() {
  try {
    const d = await db();
    d.transaction(STORE, "readwrite").objectStore(STORE).delete(DRAFT_ID);
  } catch {
    /* 없으면 그만 */
  }
}

// ── 등록 시간 측정(?debug=1) ──
// 시작 = 등록 화면 진입, 끝 = 등록하기 통과. 사람이 손으로 한 시간만 잰다(업로드 · 영상 처리 대기 없음 — 서버 없는 시안).
function readSess<T>(k: string): T | null {
  try {
    const v = sessionStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
export type Mark = { k: string; t: number };
export type Run = { at: number; category: string; role: string; marks: Mark[]; total: number; photos: number; video: boolean };
const RUNS = "bbm-register-runs";
export function useTimer() {
  // 촬영 키트에 다녀와도 이어서 재도록 시작 시각 · 기록을 이 탭(sessionStorage)에 둔다
  const marks = useState<Mark[]>("reg-marks", () => readSess<Mark[]>("bbm-reg-marks") ?? []);
  const start = useState<number>("reg-start", () => readSess<number>("bbm-reg-start") ?? 0);
  const keepSess = () => {
    try {
      sessionStorage.setItem("bbm-reg-start", JSON.stringify(start.value));
      sessionStorage.setItem("bbm-reg-marks", JSON.stringify(marks.value));
    } catch {
      /* 사생활 보호 창 */
    }
  };
  const begin = () => {
    start.value = Date.now();
    marks.value = [];
    keepSess();
  };
  const mark = (k: string) => {
    if (!start.value) begin();
    if (marks.value.some((m) => m.k === k)) return;
    marks.value = [...marks.value, { k, t: Math.round((Date.now() - start.value) / 100) / 10 }];
    keepSess();
  };
  const finish = (f: FormState, role: string): Run => {
    const total = Math.round((Date.now() - start.value) / 100) / 10;
    const run: Run = { at: Date.now(), category: f.category, role, marks: marks.value, total, photos: f.media.filter((m) => m.kind === "photo").length, video: f.media.some((m) => m.kind === "video") };
    try {
      const list = JSON.parse(localStorage.getItem(RUNS) || "[]") as Run[];
      list.unshift(run);
      localStorage.setItem(RUNS, JSON.stringify(list.slice(0, 50)));
    } catch {
      /* 저장 못 해도 화면은 계속 */
    }
    return run;
  };
  const runs = (): Run[] => {
    try {
      return JSON.parse(localStorage.getItem(RUNS) || "[]") as Run[];
    } catch {
      return [];
    }
  };
  const reset = () => {
    start.value = 0;
    marks.value = [];
    keepSess();
  };
  return { marks, start, begin, mark, finish, runs, reset };
}

export const fmtSec = (s: number) => (s < 60 ? `${s.toFixed(1)}초` : `${Math.floor(s / 60)}분 ${String(Math.round(s % 60)).padStart(2, "0")}초`);
export const priceText = (raw: string) => {
  const n = Number(raw.replace(/[^0-9]/g, ""));
  return n ? n.toLocaleString("ko-KR") : "";
};
