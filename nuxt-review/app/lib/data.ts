// 게시판 데이터: 기존 커뮤니티 표(scripts/build-data.mjs로 만든 JSON) + 이 브라우저에서 새로 쓴 글(localStorage).
import reviewSeed from "../data/review.json";
import fuelSeed from "../data/fuel.json";
import { ratingCategories, ratingComment, ratingProfiles, reviewModels, type Powertrain, type RatingCategoryId } from "@proto/dealer-page/vehicle-review-data";

export type { Powertrain, RatingCategoryId };
export { ratingCategories, ratingComment, ratingProfiles };

export type Comment = { id: string; author: string; avatar: string; body: string; likes: number; region: string; daysAgo: number; replies: number };
export type Review = {
  id: string; modelId: string; brand: string; model: string; trim: string; year: number; powertrain: Powertrain; brandLogo: string;
  title: string; body: string; author: string; avatar: string; publishedAt: string; images: string[];
  views: number; comments: number; likes: number; rating: number; ratings: { label: string; score: number }[];
  owner: boolean; ownership: string; location: string; benchmark: string;
  purchase: { month: string; price: number; city: string; metric: string } | null; commentList: Comment[]; mine?: boolean; can?: { update: boolean; delete: boolean; report: boolean };
};
export type FuelPost = {
  id: string; modelId: string; brand: string; model: string; trim: string; powertrain: "ice" | "hybrid" | "ev" | "phev"; brandLogo: string; photo: string;
  title: string; body: string; author: string; avatar: string; publishedAt: string; images: string[]; comments: number; likes: number; views: number;
  city: string; odometer: number; fuel: number | null; energy: number | null; range: number | null; temperature: number | null; ownerYears: number;
  commentList: Comment[]; mine?: boolean; can?: { update: boolean; delete: boolean; report: boolean };
};
export type CarModel = { id: string; brand: string; model: string; trim: string; powertrain: Powertrain; brandLogo: string; photo: string };

const KEY_REVIEW = "bbm-nuxt-review-posts-v1";
const KEY_FUEL = "bbm-nuxt-fuel-posts-v1";
const read = <T>(k: string): T[] => {
  try { return JSON.parse(localStorage.getItem(k) || "[]") as T[]; } catch { return []; }
};
const write = (k: string, v: unknown[]) => {
  try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; }
};

export const reviews = (): Review[] => [...read<Review>(KEY_REVIEW), ...(reviewSeed as Review[])];
export const fuelPosts = (): FuelPost[] => [...read<FuelPost>(KEY_FUEL), ...((fuelSeed as { posts: FuelPost[] }).posts)];
export const saveReview = (r: Review) => write(KEY_REVIEW, [r, ...read<Review>(KEY_REVIEW)]);
export const saveFuel = (p: FuelPost) => write(KEY_FUEL, [p, ...read<FuelPost>(KEY_FUEL)]);
export const removeMine = (board: "review" | "fuel", id: string) => {
  const k = board === "review" ? KEY_REVIEW : KEY_FUEL;
  write(k, read<{ id: string }>(k).filter((x) => x.id !== id));
};

/** 차량 고르기 목록: 리뷰 · 연비 표의 차종을 합친다(같은 이름은 하나로) */
export const carModels = (): CarModel[] => {
  const map = new Map<string, CarModel>();
  for (const m of (fuelSeed as { models: CarModel[] }).models) map.set(`${m.brand}|${m.model}|${m.trim}`, m);
  for (const r of reviewSeed as Review[]) {
    const k = `${r.brand}|${r.model}|${r.trim}`;
    if (!map.has(k)) map.set(k, { id: r.modelId, brand: r.brand, model: r.model, trim: r.trim, powertrain: r.powertrain, brandLogo: r.brandLogo, photo: r.images[0] ?? "" });
  }
  return [...map.values()];
};

/** 동처띠 평가 말: 5.00 「优秀」 · 3.50 「良好」 실측 → 4.0 이상 우수 · 3.0 이상 양호 · 2.0 이상 보통 · 그 아래 아쉬움 */
export const scoreWord = (s: number) => (s >= 4 ? "우수" : s >= 3 ? "양호" : s >= 2 ? "보통" : "아쉬움");
export const fmtScore = (s: number) => s.toFixed(2);
export const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export const ptLabel: Record<string, string> = { ev: "전기차", phev: "플러그인 하이브리드", erev: "주행거리 연장형", hybrid: "하이브리드", ice: "내연기관" };

/** 날짜: 동처띠 목록 「2026-10-14」 · 댓글 「10월26일」 */
export const ymd = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const ymdKo = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};
export const daysAgo = (n: number) => {
  const d = new Date(Date.now() - n * 864e5);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

/** 연비 단위: 내연·하이브리드 km/L, 전기 km/kWh(표의 전비는 kWh/100km라 100으로 나눠 바꾼다) */
export const fuelText = (p: Pick<FuelPost, "fuel" | "energy" | "powertrain">) => {
  const out: { label: string; value: string; unit: string }[] = [];
  if (p.energy != null) out.push({ label: "평균 전비", value: (100 / p.energy).toFixed(1), unit: "km/kWh" });
  if (p.fuel != null) out.push({ label: "평균 연비", value: p.fuel.toFixed(1), unit: "km/L" });
  return out;
};

export const SIDO = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

/** 원본 「揽胜在SUV中综合评分为 4.36，可供参考」: 차종의 차급 평균(기준표 benchmark)이 있으면 평점 칸 위에 보여 준다 */
export const benchmarkOf = (brand: string, model: string) => {
  const m = (reviewModels as readonly { brand: string; model: string; benchmark: string }[]).find((x) => x.brand === brand && x.model === model);
  const hit = m?.benchmark.match(/^(.*?)\s*평균\s*([\d.]+)$/);
  return hit ? { segment: hit[1]!, score: Number(hit[2]) } : null;
};
