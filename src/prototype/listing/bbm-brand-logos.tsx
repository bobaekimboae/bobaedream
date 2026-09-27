import { asset } from "../data";
import { krBrandLogos } from "./brand-logos-kr.generated";
import { bbCatalog } from "./pc-bbmuseum";
import "./bbm-brand-logos.css";

// QF-096: 과쯔 모드 제조사 로고(public/assets/brand/kr). 기준 이름 = 좌측 필터 표기(bbCatalog 라벨).
// 퀵필터·매물 데이터의 제조사 값(maker)은 catalog key 또는 아래 대응으로 좌측 필터 이름을 찾는다. 대응이 없으면 로고 없음(추측 연결 안 함).
export const krBrandAliases: Record<string, string> = {
  도요타: "토요타",
  미쯔비시: "미쓰비시",
  다이하쯔: "다이하쓰",
  동풍소콘: "동펑",
  코닉세그: "코닉세크",
  MG로버: "로버",
  "쉐보레(GM대우)": "쉐보레(국산)",
  "시트로엥/DS": "시트로엥",
};

// pc-bbmuseum.tsx 와 서로 가져오므로(좌측 필터가 이 로고를 씀) 처음 쓸 때 만든다
let catalogNameByKey: Map<string, string> | null = null;
const catalogName = (key: string) => {
  if (!catalogNameByKey) { catalogNameByKey = new Map(); for (const section of bbCatalog) for (const [label, , rowKey] of section.rows) if (!catalogNameByKey.has(rowKey ?? label)) catalogNameByKey.set(rowKey ?? label, label); }
  return catalogNameByKey.get(key) ?? null;
};

/** 제조사 값·다른 표기 → 좌측 필터 이름(없으면 null) */
export function krBrandName(name: string) {
  if (krBrandLogos[name] || bbCatalog.some((section) => section.rows.some(([label]) => label === name))) return name;
  if (krBrandAliases[name]) return krBrandAliases[name];
  return catalogName(name);
}
export function krBrandLogo(name: string) {
  const resolved = krBrandName(name);
  return resolved ? krBrandLogos[resolved] ?? null : null;
}

// QF-096 보완 3(높이 밸런스, 비율 = 잘라낸 로고 폭÷높이): 넓은 로고일수록 조금씩 낮게 — 높이 = min(최대, 기준 × 비율^-0.35), 폭 = 높이 × 비율, 폭이 한도를 넘으면 폭 한도·높이 = 폭÷비율
const balancedLogoSize = (ratio: number, base: number, maxHeight: number, maxWidth: number) => {
  let height = Math.min(maxHeight, base * ratio ** -0.35);
  let width = height * ratio;
  if (width > maxWidth) { width = maxWidth; height = maxWidth / ratio; }
  return { width, height };
};
// 퀵필터 제조사 카드(80 칸): 기준 24 · 최대 높이 28 · 최대 폭 72 (예: 벤츠 24×24, 현대 38×19, 기아 62×14, 허머 72×8, 링컨 13×28)
export function krRailLogoSize(ratio: number) {
  return balancedLogoSize(ratio, 24, 28, 72);
}
// 목록(로고 칸 32×24): 기준 18 · 최대 높이 22 · 최대 폭 32
export function krListLogoSize(ratio: number) {
  return balancedLogoSize(ratio, 18, 22, 32);
}
const px = (value: number) => `${Math.round(value * 100) / 100}px`;

/** 로고 칸(퀵필터 48×28 · 목록 32×24). 로고가 없으면 빈 칸(이름 시작선을 맞춘다). 이미지는 alt=""(이름이 바로 옆) */
export function KrBrandLogo({ name, kind }: { name: string; kind: "rail" | "list" }) {
  const logo = krBrandLogo(name);
  const size = logo ? (kind === "rail" ? krRailLogoSize(logo.ratio) : krListLogoSize(logo.ratio)) : null;
  return (
    <span className={`kr-brand-logo is-${kind}${logo ? "" : " is-empty"}`} data-brand={krBrandName(name) ?? name} data-ratio={logo?.ratio}>
      {logo && size ? <img src={asset(`brand/kr/${logo.slug}.png`)} alt="" draggable={false} style={{ width: px(size.width), height: px(size.height) }} /> : null}
    </span>
  );
}

/** 과쯔 퀵필터 제조사 줄 순서(좌측 필터와 같음): 국산 → 구분선 → 수입차 인기 → 수입차 이름순 나머지. 퀵필터는 0대·"기타 국산차·기타 수입차"를 뺀다 */
export function krMakerRailSections(scope: "all" | "domestic" | "imported") {
  const [domestic, popular, byName] = bbCatalog;
  const keep = ([label, count]: (typeof domestic.rows)[number]) => count > 0 && !label.startsWith("기타 ");
  const toItem = ([label, count, key]: (typeof domestic.rows)[number]) => ({ label, key: key ?? label, count });
  const popularNames = new Set(popular.rows.map(([label]) => label));
  const domesticItems = domestic.rows.filter(keep).map(toItem);
  const importedItems = [...popular.rows.filter(keep).map(toItem), ...byName.rows.filter((row) => keep(row) && !popularNames.has(row[0])).map(toItem)];
  if (scope === "domestic") return { domestic: domesticItems, imported: [] };
  if (scope === "imported") return { domestic: [], imported: importedItems };
  return { domestic: domesticItems, imported: importedItems };
}

// QF-096 보완: 퀵필터 제조사 카드(80 칸)에만 짧은 이름 — 좌측 필터·칩 모달·시트·필터 적용·칩 줄·경로·제목은 원래 표기 그대로
const krRailLabels: Record<string, string> = { "쉐보레(국산)": "쉐보레", "르노코리아(삼성)": "르노코리아", "KG모빌리티(쌍용)": "KGM" };
export function krRailLabel(label: string) {
  return krRailLabels[label] ?? label.replace(/\s*\(.*\)\s*$/, "");
}
