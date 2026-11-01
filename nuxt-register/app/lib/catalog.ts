// 제조사 · 모델 목록: 사이트 공용 차량 기준표(public/data/vehicle-catalog)를 처음 열 때 한 번만 받는다.
// 승용(중고차 · 전기차) = cars-index-v1.json, 바이크 = bikes-index-v1.json. 매물 수 · 외부 코드는 들어 있지 않다.
import { sitePath } from "@kit/site";
import regions from "@proto/data/regions-kr.json";

type Maker = { id: string; name: string; kind?: string; sortOrder?: number; popular?: boolean };
type Group = { id: string; makeId: string; name: string; sortOrder?: number };
type Index = { manufacturers: Maker[]; modelGroups: Group[] };

const cache = new Map<string, Promise<Index>>();
const load = (kind: "car" | "bike") => {
  const file = kind === "car" ? "cars-index-v1.json" : "bikes-index-v1.json";
  let p = cache.get(file);
  if (!p) {
    p = fetch(sitePath("data", "vehicle-catalog", file)).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<Index>;
    });
    p.catch(() => cache.delete(file));
    cache.set(file, p);
  }
  return p;
};

export type Section = { title?: string; items: string[] };

/** 제조사 목록. 승용은 국산 → 수입으로 나눈다(초톳 시트는 구획 없이 이름순이지만 국내 사용 습관을 따른다). */
export async function makerSections(kind: "car" | "bike"): Promise<Section[]> {
  const idx = await load(kind);
  const sorted = [...idx.manufacturers].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  if (kind === "bike") return [{ items: sorted.map((m) => m.name) }];
  return [
    { title: "국산", items: sorted.filter((m) => m.kind === "국산").map((m) => m.name) },
    { title: "수입", items: sorted.filter((m) => m.kind !== "국산").map((m) => m.name) },
  ];
}

export async function modelsOf(kind: "car" | "bike", makerName: string): Promise<string[]> {
  const idx = await load(kind);
  const m = idx.manufacturers.find((x) => x.name === makerName);
  if (!m) return [];
  return idx.modelGroups
    .filter((g) => g.makeId === m.id)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((g) => g.name);
}

const R = regions as unknown as { sido: string[]; districts: Record<string, string[]> };
export const SIDO: string[] = R.sido;
/** 세종은 시·군·구가 없어 「세종시」 한 칸으로 둔다(초톳 3칸 구조 유지) */
export const districtsOf = (sido: string): string[] => (sido === "세종" ? ["세종시"] : R.districts[sido] ?? []);

// 읍·면·동: 법정동 코드(행정표준코드관리시스템)를 시·군·구별로 묶은 사이트 공용 파일. 처음 열 때 한 번만 받는다.
// 구가 있는 시(수원시 등)는 「권선구 세류동」처럼 구 이름을 앞에 붙여 한 목록으로 둔다.
let dongP: Promise<Record<string, string[]>> | null = null;
export async function dongsOf(sido: string, gu: string): Promise<string[]> {
  dongP ??= fetch(sitePath("data", "regions-kr-dong-v1.json"))
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<{ dong: Record<string, string[]> }>;
    })
    .then((j) => j.dong);
  dongP.catch(() => (dongP = null));
  return (await dongP)[`${sido}|${gu}`] ?? [];
}
