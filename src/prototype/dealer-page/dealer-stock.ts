export const stockCategories = ["국산차", "수입차", "상용차", "슈퍼카"] as const;
export type StockCategory = typeof stockCategories[number];
export const readStockCategory = (value: string | null): StockCategory | "전체" => stockCategories.find((category) => category === value) ?? "전체";
export const readStockCategories = (values: readonly string[]): StockCategory[] => stockCategories.filter((category) => values.includes(category));

type StockVehicle = { maker: string; modelGroup?: string; truck?: unknown; supercarSheet?: boolean; deutschSource?: unknown; filter?: { origin?: string; body?: string } };
const domesticMakers = new Set(["현대", "기아", "제네시스", "쉐보레", "르노코리아", "르노삼성", "KGM", "KG모빌리티", "쌍용", "대우", "GM대우"]);
const supercarMakers = new Set(["페라리", "람보르기니", "맥라렌", "부가티", "코닉세그", "파가니"]);
const supercarModels = new Set(["포르쉐|911", "마세라티|MC20", "아우디|R8", "애스턴마틴|밴티지"]);

export function matchesStockCategory(car: StockVehicle, category: StockCategory | "전체") {
  if (category === "전체") return true;
  const commercial = Boolean(car.truck) || ["트럭", "화물", "화물차", "특장차", "픽업트럭", "버스", "상용밴", "밴(승합)", "승합차"].includes(car.filter?.body ?? "");
  if (category === "상용차") return commercial;
  if (commercial) return false;
  if (category === "슈퍼카") return Boolean(car.supercarSheet) || supercarMakers.has(car.maker) || supercarModels.has(`${car.maker}|${car.modelGroup ?? ""}`);
  const domestic = !car.deutschSource && (domesticMakers.has(car.maker) || ["한국", "대한민국", "국산"].includes(car.filter?.origin ?? ""));
  return category === "국산차" ? domestic : !domestic;
}

export function matchesStockCategories(car: StockVehicle, categories: readonly StockCategory[]) {
  return categories.length === 0 || categories.some((category) => matchesStockCategory(car, category));
}

export function stockUrl(base: string, shop: string, emp: string, category: StockCategory | "전체" = "전체", view?: "feed" | "list") {
  const url = new URL(base);
  url.search = new URLSearchParams({ profile: "dealer", shop, emp, tab: "ads" }).toString();
  if (category !== "전체") url.searchParams.set("stockCategory", category);
  if (view === "feed" || view === "list") url.searchParams.set("view", view);
  url.hash = "";
  return url.href;
}
