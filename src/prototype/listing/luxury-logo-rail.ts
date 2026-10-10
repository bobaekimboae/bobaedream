import "./luxury-logo-rail.css";

/** 럭셔리카 브랜드 로고 퀵필터 비교 시안. 순서·이름은 확정값, 파일 번호 01~16 = 순서. 로고 소스만 `?luxlogo=`로 바꾼다. */
export const luxuryLogoBrands = [
  { maker: "페라리", slug: "ferrari" },
  { maker: "람보르기니", slug: "lamborghini" },
  { maker: "롤스로이스", slug: "rollsroyce" },
  { maker: "벤틀리", slug: "bentley" },
  { maker: "포르쉐", slug: "porsche" },
  { maker: "벤츠", slug: "benz" },
  { maker: "맥라렌", slug: "mclaren" },
  { maker: "애스턴마틴", slug: "astonmartin" },
  { maker: "BMW", slug: "bmw" },
  { maker: "마세라티", slug: "maserati" },
  { maker: "아우디", slug: "audi" },
  { maker: "캐딜락", slug: "cadillac" },
  { maker: "테슬라", slug: "tesla" },
  { maker: "GMC", slug: "gmc" },
  { maker: "부가티", slug: "bugatti" },
  { maker: "코닉세그", slug: "koenigsegg" },
] as const;

export type LuxuryLogoSource = "guazi" | "autohome2" | "autohome" | "daangn" | "dongchedi";
const sources: LuxuryLogoSource[] = ["guazi", "autohome2", "autohome", "daangn", "dongchedi"];

/** 기본 = autohome2. 비교용 guazi·autohome·daangn·dongchedi를 URL에서 선택한다. */
export function luxuryLogoSource(): LuxuryLogoSource {
  if (typeof window === "undefined") return "autohome2";
  const value = new URLSearchParams(window.location.search).get("luxlogo");
  return sources.includes(value as LuxuryLogoSource) ? (value as LuxuryLogoSource) : "autohome2";
}

/** autohome2 폴더는 autohome 접두사를 공유하며, guazi는 원본 로고를 같은 44×28 슬롯에 정규화한다. */
const filePrefix: Record<LuxuryLogoSource, string> = { guazi: "guazi", autohome2: "autohome", autohome: "autohome", daangn: "daangn", dongchedi: "dongchedi" };

/** public/assets/brand/luxury-qf-v01/{source}/qf_{prefix}_{NN}_{slug}_44x28@3x.png (132×84 투명 PNG, 드라이브 원본 복사본) */
export function luxuryLogoPath(source: LuxuryLogoSource, index: number) {
  const brand = luxuryLogoBrands[index];
  return `brand/luxury-qf-v01/${source}/qf_${filePrefix[source]}_${String(index + 1).padStart(2, "0")}_${brand.slug}_44x28@3x.png`;
}
