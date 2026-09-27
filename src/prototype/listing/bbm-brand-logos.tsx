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

// 퀵필터 카드(로고 칸 48×28) 표시 크기 — 비율 1.25 이하: 높이 28(폭 최대 44) · 1.25~2.5: 폭 min(44, 28√비율) · 2.5 초과(글자 로고): 폭 64(카드 80 안)
export function krRailLogoSize(ratio: number) {
  if (ratio <= 1.25) { const width = Math.min(44, 28 * ratio); return { width, height: width / ratio }; }
  if (ratio <= 2.5) { const width = Math.min(44, 28 * Math.sqrt(ratio)); return { width, height: width / ratio }; }
  return { width: 64, height: 64 / ratio };
}
// 목록(로고 칸 24×24) 표시 크기 — 비율 유지로 칸 안에 맞춤
export function krListLogoSize(ratio: number) {
  return ratio >= 1 ? { width: 24, height: 24 / ratio } : { width: 24 * ratio, height: 24 };
}
const px = (value: number) => `${Math.round(value * 100) / 100}px`;

/** 로고 칸(퀵필터 48×28 · 목록 24×24). 로고가 없으면 빈 칸(이름 시작선을 맞춘다). 이미지는 alt=""(이름이 바로 옆) */
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
