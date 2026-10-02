import { asset } from "../data";
import { krBrandLogos } from "./brand-logos-kr.generated";
import { bbCatalog } from "./pc-bbmuseum";
import brandTop10 from "../data/brand-top10.json";
import brandTop10Bike from "../data/brand-top10-bike.json";
import brandTop10Truck from "../data/brand-top10-truck.json";
import "./bbm-brand-logos.css";
import { bikeBrandCount } from "../data/bike-filter-catalog";

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

// QF-096 보완 3(시안 v1 규격 복원, 비율 = 잘라낸 로고 폭÷높이). 이전의 "높이 밸런스 · 폭 72"·"로고 틀 56×26"·"정사각 36×36"·"글자 로고 폭 64" 규칙은 취소
// 퀵필터 제조사 카드(로고 칸 48×28): 비율 1.25 이하 폭 = min(44, 28×비율)·높이 = min(28, 폭÷비율) / 1.25 초과 폭 = min(44, 28×√비율)·높이 = 폭÷비율 — 모든 로고가 칸 안
// (예: 벤츠·BMW 28×28, 현대 40×20, 기아 44×10, 제네시스 44×9, KGM 44×9, 닷지 44×6, 허머 44×5, 링컨 13×28)
export function krRailLogoSize(ratio: number) {
  if (ratio <= 1.25) { const width = Math.min(44, 28 * ratio); return { width, height: Math.min(28, width / ratio) }; }
  const width = Math.min(44, 28 * Math.sqrt(ratio));
  return { width, height: width / ratio };
}
// 목록(로고 칸 24×24): 비율 유지로 칸 안에 맞춤(contain)
export function krListLogoSize(ratio: number) {
  return ratio >= 1 ? { width: 24, height: 24 / ratio } : { width: 24 * ratio, height: 24 };
}
const px = (value: number) => `${Math.round(value * 100) / 100}px`;

// QF-108 plain(초톳식) 로고 상자(PC 40×40 · 모바일 36×36) 안 크기 3단계(초톳 실측 M-041 · 매뉴얼 v1.3, 비율 = 잘라낸 로고 폭÷높이), 가로·세로 가운데
//  1.25 이하: 긴 변 = 상자의 82.5%(PC 33 · 모바일 29.7) / 1.25 초과 1.6 미만: 폭 = 91%(PC 36.4 · 모바일 32.8) / 1.6 이상: 폭 = 100%(PC 40 · 모바일 36)
export function krPlainLogoSize(ratio: number) {
  if (ratio >= 1.6) return { width: "100%", height: "auto" };
  if (ratio > 1.25) return { width: "91%", height: "auto" };
  return ratio >= 1 ? { width: "82.5%", height: "auto" } : { width: "auto", height: "82.5%" };
}

/** 로고 칸(퀵필터 48×28 · 목록 24×24 · plain 40×40/36×36). 로고가 없으면 빈 칸(이름 시작선을 맞춘다). 이미지는 alt=""(이름이 바로 옆) */
export function KrBrandLogo({ name, kind, initialFallback = false }: { name: string; kind: "rail" | "list" | "plain"; initialFallback?: boolean }) {
  const logo = krBrandLogo(name);
  // QF-114: 로고를 못 구한 브랜드(바이크·트럭)는 이름 첫 글자 원형(#F4F4F4, 600)으로 임시 표시
  if (!logo && initialFallback) return <span className={`kr-brand-logo is-${kind} is-initial`} data-brand={name}><span className="kr-brand-initial" aria-hidden="true">{krRailLabel(name).slice(0, 1)}</span></span>;
  const size = logo ? (kind === "plain" ? krPlainLogoSize(logo.ratio) : (() => { const value = kind === "rail" ? krRailLogoSize(logo.ratio) : krListLogoSize(logo.ratio); return { width: px(value.width), height: px(value.height) }; })()) : null;
  return (
    <span className={`kr-brand-logo is-${kind}${logo ? "" : " is-empty"}`} data-brand={krBrandName(name) ?? name} data-ratio={logo?.ratio}>
      {logo && size ? <img src={asset(`brand/kr/${logo.slug}.png`)} alt="" draggable={false} style={size} /> : null}
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

/** QF-108 과쯔 퀵필터 제조사 줄 = 월 단위 상위 10(src/prototype/data/brand-top10.json, 국산 → 구분선 → 수입) + "전체 브랜드" 칸. 이름은 좌측 필터 표기, 값은 catalog key */
// QF-114: 바이크 · 트럭·특장은 유형별 상위 10(brand-top10-bike.json · brand-top10-truck.json) — 승용 목록과 섞지 않는다
type TypeTop10 = { month: string; category: string; basis: string; domestic: string[]; imported: string[]; all: { note: string; domestic: string[]; imported: string[]; etc: string[] } };
const typeTop10: Record<string, TypeTop10> = { 바이크: brandTop10Bike, "트럭 · 특장": brandTop10Truck };
export const krTypeTop10 = (category: string) => typeTop10[category] ?? null;
export function krTopTenSections(scope: "all" | "domestic" | "imported", category?: string) {
  const type = category ? typeTop10[category] : undefined;
  const rows = bbCatalog.flatMap((section) => section.rows);
  const toItem = (label: string) => { if (type) return { label, key: label, count: category === "바이크" ? bikeBrandCount[label] ?? 0 : 0 }; const row = rows.find(([name]) => name === label); return { label, key: row?.[2] ?? label, count: row?.[1] ?? 0 }; };
  const source = type ?? brandTop10;
  const domestic = scope === "imported" ? [] : source.domestic.map(toItem);
  const imported = scope === "domestic" ? [] : source.imported.map(toItem);
  return { domestic, imported, month: source.month };
}

// QF-096 보완: 퀵필터 제조사 카드(80 칸)에만 짧은 이름 — 좌측 필터·칩 모달·시트·필터 적용·칩 줄·경로·제목은 원래 표기 그대로
const krRailLabels: Record<string, string> = { "쉐보레(국산)": "쉐보레", "르노코리아(삼성)": "르노코리아", "KG모빌리티(쌍용)": "KGM", "KG모빌리티": "KGM", "만(MAN)": "MAN", "다프(DAF)": "DAF", "대림(DL)": "대림" };
export function krRailLabel(label: string) {
  return krRailLabels[label] ?? label.replace(/\s*\(.*\)\s*$/, "");
}
