// 보배드림 AI 스튜디오 저장소: 이 브라우저의 IndexedDB(사진 · 결과물) + localStorage(크레딧 · 설정).
// 서버 없이 동작하는 시안이다. 차량번호 · 전화번호 · 매물 번호는 저장하지 않는다(프로젝트 이름만).
import { toRaw } from "vue";

export type Mode = "editor" | "blur" | "multi";
export type PlateMode = "keep" | "blur" | "white" | "custom";
export type Aspect = "original" | "4:3" | "3:2" | "16:9" | "1:1";
export type Resolution = "hd" | "fhd" | "qhd";
export type Adjust = { rotate: number; contrast: number; brightness: number; tint: number; saturation: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type Pos = { x: number; y: number; scale: number };
export type Photo = {
  id: string;
  original: Blob;
  /** 차만 오려 낸 PNG(원본과 같은 크기). 실패하면 없음 */
  cut: Blob | null;
  /** 차 테두리(원본 픽셀) */
  box: { x0: number; y0: number; x1: number; y1: number } | null;
  w: number;
  h: number;
  /** 번호판 칸(원본 기준 0~1). 없으면 번호판 처리 안 함 */
  plate: Rect | null;
  bg: string;
  pos: Pos;
  adjust: Adjust;
  reflect: boolean;
  error: string;
};
export type Settings = { aspect: Aspect; resolution: Resolution; grid: boolean; logo: Blob | null; logoAt: "tl" | "tr" | "bl" | "br" };
export type Version = { id: string; at: number; label: string; photos: Pick<Photo, "id" | "bg" | "pos" | "adjust" | "reflect" | "plate">[]; settings: Omit<Settings, "logo"> };
export type VideoOut = { id: string; at: number; template: string; aspect: "9:16" | "1:1" | "16:9"; seconds: number; video: Blob; title: string; poster: string };
export type Project = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  mode: Mode;
  plateMode: PlateMode;
  customPlate: string;
  photos: Photo[];
  settings: Settings;
  versions: Version[];
  videos: VideoOut[];
  poster: string;
};

export const DEFAULT_ADJUST: Adjust = { rotate: 0, contrast: 0, brightness: 0, tint: 0, saturation: 0 };
export const DEFAULT_POS: Pos = { x: 0.5, y: 0.8, scale: 1 };

const DB = "bbm-carstudio";
const STORE = "projects";
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
/** 화면 상태(반응형)를 평범한 객체로 풀어 넣는다(Blob은 그대로) */
const plain = <T>(v: T): T => {
  const r = toRaw(v) as unknown;
  if (r instanceof Blob || r === null || typeof r !== "object") return r as T;
  if (Array.isArray(r)) return r.map((x) => plain(x)) as T;
  const o: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(r as Record<string, unknown>)) o[k] = plain(x);
  return o as T;
};
export const listProjects = async () => (await tx<Project[]>("readonly", (s) => s.getAll() as IDBRequest<Project[]>)).sort((a, b) => b.createdAt - a.createdAt);
export const getProject = (id: string) => tx<Project | undefined>("readonly", (s) => s.get(id) as IDBRequest<Project | undefined>);
export const putProject = (p: Project) => tx("readwrite", (s) => s.put(plain(p)));
export const deleteProject = (id: string) => tx("readwrite", (s) => s.delete(id));
export const newId = (p = "cs") => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// 크레딧(사진 1장 처리 = 1크레딧, 영상은 무료 베타). 처음 3개
const CREDIT_KEY = "bbm-cs-credits";
export const FREE_CREDITS = 3;
export function readCredits() {
  try {
    const v = localStorage.getItem(CREDIT_KEY);
    return v === null ? FREE_CREDITS : Math.max(0, Number(v) || 0);
  } catch {
    return FREE_CREDITS;
  }
}
export function writeCredits(n: number) {
  try {
    localStorage.setItem(CREDIT_KEY, String(Math.max(0, n)));
  } catch {
    // 저장 못 해도 이번 화면에서는 쓴다
  }
}

// 내 번호판(사용자 지정 글자 판) 목록
const PLATES_KEY = "bbm-cs-plates";
export type CustomPlate = { id: string; text: string; color: string };
export function readPlates(): CustomPlate[] {
  try {
    return JSON.parse(localStorage.getItem(PLATES_KEY) || "[]") as CustomPlate[];
  } catch {
    return [];
  }
}
export function writePlates(p: CustomPlate[]) {
  try {
    localStorage.setItem(PLATES_KEY, JSON.stringify(p));
  } catch {
    // 무시
  }
}

// 판매자 정보(영상 끝 명함용)
const PROFILE_KEY = "bbm-cs-profile";
export type Profile = { name: string; company: string; phone: string };
export function readProfile(): Profile {
  try {
    return { name: "", company: "", phone: "", ...(JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}") as Partial<Profile>) };
  } catch {
    return { name: "", company: "", phone: "" };
  }
}
export function writeProfile(p: Profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {
    // 무시
  }
}
