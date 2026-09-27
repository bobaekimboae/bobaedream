import { asset, generationCodeLabel, quickGenerationsByMakerModel, quickModelVisualsByMaker, quickModelsByMaker } from "../data";
import type { QuickGenerationOption, QuickModelVisual } from "../data";
import { modelCatalogKr } from "../data/model-catalog-kr.generated";
import type { CatalogModel, CatalogSubModel } from "../data/model-catalog-kr.generated";
import "./model-catalog-kr.css";

// QF-097: 과쯔 모드 모델·세부 모델 = 개발 시안 카탈로그 스냅숏(9개 제조사: 벤츠·BMW·현대·기아·포르쉐·페라리·람보르기니·벤틀리·롤스로이스).
// 화면은 API 를 부르지 않고 스냅숏에서 만든 model-catalog-kr.generated.ts 만 읽는다. 그 밖의 제조사는 기존 퀵필터 데이터 그대로.
// 퀵필터 모델·세부 모델 카드, 좌측 필터(PC) 모델·등급, 모델 칩 모달·시트, 차종 시트가 같은 데이터를 쓴다.

const norm = (value: string) => value.replace(/[-\s]/g, "").toLowerCase();
/** 이름은 괄호 앞까지("G클래스 (G바겐)" → "G클래스", "더 뉴 K3 [2세대]" → "더 뉴 K3") */
export const cutBracket = (label: string) => label.replace(/\s*[([].*$/, "").trim() || label;

// 모델 순서(엔카 기준, PR #88 보완): 숫자로 시작하는 현행 모델(BMW 3시리즈·포르쉐 911 등) → 영문 → 가나다 → 숫자로 시작하는 구형 모델(벤츠 190·280·600, BMW 02 등) → "기타".
// 구형 = 카탈로그 세부 모델 가운데 "~현재"가 하나도 없는 모델(BMW "N시리즈"는 제외 — 6시리즈도 1~8시리즈 사이). 벤츠 "A클래스"는 "A-클래스"로 읽어 정렬(A클래스 → AMG GT → B클래스 → C클래스 → CL클래스 → CLA클래스 …). 괄호(G바겐 등)는 이름에서 이미 뺐다
const oldNumericModels = new Set<string>();
const orderBucket = (name: string) => name === "기타" ? 9 : /^\d/.test(name) ? (oldNumericModels.has(name) ? 3 : 0) : /^[A-Za-z]/.test(name) ? 1 : /^[가-힣]/.test(name) ? 2 : 4;
const latinKey = (name: string) => name.replace(/^([A-Za-z]+)클래스/, "$1-클래스").toUpperCase();
const codePointCompare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
export function compareModelNames(a: string, b: string) {
  const bucket = orderBucket(a) - orderBucket(b);
  if (bucket) return bucket;
  if (orderBucket(a) === 1) return codePointCompare(latinKey(a), latinKey(b));
  if (orderBucket(a) === 0 || orderBucket(a) === 3) return (parseInt(a, 10) - parseInt(b, 10)) || codePointCompare(latinKey(a), latinKey(b));
  return a.localeCompare(b, "ko");
}

// 세부 모델 순서: 최신 먼저(출시 연도 내림차순, 연도 없으면 뒤). 두 자리 연도 30 이상은 1900년대("36~95년" = 1936)
const startYear = (relYear: string | null) => {
  const match = relYear?.match(/^(\d{2})/);
  if (!match) return -Infinity;
  const yy = Number(match[1]);
  return yy >= 30 ? 1900 + yy : 2000 + yy;
};
// "22년~현재" → "22~현재", "13~18년" 그대로
const yearsLabel = (relYear: string | null) => (relYear ?? "").replace(/년~현재$/, "~현재").trim();
const codesOf = (sub: CatalogSubModel) => (sub.code ?? "").split(/[,/]/).map((code) => code.trim()).filter(Boolean);

/** 세부 모델 카드 큰 글자: 섀시 코드(하이브리드는 +HEV) → 없으면 N세대 → 없으면 연식. 모델 안 코드가 모두 같으면(포르쉐 718 등) 세부 모델 이름 */
function subCardLabel(sub: CatalogSubModel, sameCode: boolean) {
  if (sameCode) return cutBracket(sub.label);
  if (sub.code?.trim()) return `${sub.code.trim()}${/하이브리드/.test(sub.label) ? " HEV" : ""}`;
  if (sub.generation) return `${sub.generation}세대`;
  const year = sub.relYear?.match(/^(\d{2})/);
  return year ? `${year[1]}년` : cutBracket(sub.label);
}
/** 세부 모델 카드 작은 글자: 부분변경 이름·연식("디 올 뉴·22~현재"). 이름에서 모델명·코드·"하이브리드"를 빼고 남은 말이 부분변경 이름 */
function subCardSub(sub: CatalogSubModel, modelName: string, sameCode: boolean) {
  const years = yearsLabel(sub.relYear);
  if (sameCode) return years;
  let rest = cutBracket(sub.label);
  const modelPattern = new RegExp(modelName.replace(/[-\s]/g, "").split("").map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[-\\s]?"), "i");
  rest = rest.replace(modelPattern, " ");
  for (const code of codesOf(sub)) rest = rest.replace(code, " ");
  rest = rest.replace(/하이브리드/g, " ").replace(/\s+/g, " ").trim();
  return rest ? `${rest}·${years}` : years;
}

const modelImage = (makerId: number, sub: CatalogSubModel) => sub.ratio ? asset(`models/kr/${makerId}/${sub.value}.png`) : undefined;
// 56×28 칸: 폭 56, 비율이 2 보다 작아(높아) 높이 28 을 넘으면 높이 맞춤 — 아래 정렬(rails.css)
const fitOf = (ratio?: number) => (ratio && ratio < 2 ? "height" : "width") as QuickModelVisual["bodyFit"];

const guaziModelsByMaker: Record<string, string[]> = { ...quickModelsByMaker };
const guaziGenerationsByMakerModel: Record<string, Record<string, QuickGenerationOption[]>> = { ...quickGenerationsByMakerModel };
const guaziModelVisualsByMaker: Record<string, Record<string, QuickModelVisual>> = { ...quickModelVisualsByMaker };
/** 카탈로그로 모델·세부 모델을 바꾼 제조사(9개) */
export const catalogMakerNames = new Set(modelCatalogKr.map((entry) => entry.maker));

for (const { maker, makerId, models } of modelCatalogKr) {
  const existingNames = quickModelsByMaker[maker] ?? [];
  const existingGenerations = quickGenerationsByMakerModel[maker] ?? {};
  const existingVisuals = quickModelVisualsByMaker[maker] ?? {};
  const names: string[] = [];
  const generations: Record<string, QuickGenerationOption[]> = {};
  const visuals: Record<string, QuickModelVisual> = {};
  for (const model of models as CatalogModel[]) {
    const label = cutBracket(model.label);
    // 기존 퀵필터 이름과 글자가 같으면(하이픈·공백 무시, 예: "E클래스" = "E-클래스") 기존 이름을 그대로 써 주소·트림 연결을 유지
    const name = existingNames.find((existing) => norm(existing) === norm(label)) ?? label;
    if (names.includes(name)) continue;
    names.push(name);
    // 구형 숫자 모델: 이름이 숫자로 시작하고 "~현재"가 없는 모델. 단 BMW "N시리즈"(1~8시리즈)는 단종이어도 숫자 순서대로 앞에 둔다(QF-097 보완 2)
    if (/^\d/.test(name) && !/^\d+시리즈$/.test(name) && !models.filter((entry) => cutBracket(entry.label) === label).some((entry) => entry.models.some((sub) => /현재/.test(sub.relYear ?? "")))) oldNumericModels.add(name);
    const existingVisual = existingVisuals[name];
    const existingGens = existingGenerations[name] ?? [];
    const subs = [...model.models].sort((a, b) => startYear(b.relYear) - startYear(a.relYear));
    const codes = subs.map((sub) => (sub.code ?? "").trim());
    const sameCode = subs.length > 1 && Boolean(codes[0]) && codes.every((code) => code === codes[0]);
    const usedNames = new Set<string>();
    generations[name] = subs.map((sub) => {
      const subCodes = codesOf(sub);
      // 기존 세대 데이터(트림 칩)와는 섀시 코드가 같을 때만 잇는다
      const linked = subCodes.length ? existingGens.find((generation) => subCodes.includes(generationCodeLabel(generation)) || subCodes.includes(generation.name)) : undefined;
      let optionName = [cutBracket(sub.label), sub.code?.trim(), yearsLabel(sub.relYear)].filter(Boolean).join(" ");
      if (usedNames.has(optionName)) optionName = `${optionName} #${sub.value}`;
      usedNames.add(optionName);
      const cardLabel = subCardLabel(sub, sameCode);
      return {
        name: optionName,
        years: sub.relYear ?? "",
        variants: linked?.variants ?? [],
        image: modelImage(makerId, sub),
        bodyFit: fitOf(sub.ratio),
        bodyType: linked?.bodyType ?? existingVisual?.bodyType,
        isEV: linked?.isEV ?? existingVisual?.isEV,
        count: sub.count,
        cardLabel,
        cardSub: subCardSub(sub, label, sameCode),
        displayLabel: cardLabel,
        // 목록 매물 거르기: 코드(없으면 N세대)가 매물 이름·트림에 들어 있으면 해당. 둘 다 없으면 세부 모델이 하나뿐일 때만 모델 전체([]),
        // 여럿이면 거를 말이 없어 해당 매물 없음(이름으로 추측하지 않음)
        matchKeys: subCodes.length ? subCodes : sub.generation ? [`${sub.generation}세대`] : subs.length === 1 ? [] : [`#${sub.value}`],
        catalogValue: sub.value,
      };
    });
    // 모델 카드 이미지 = 매물이 가장 많은 세부 모델의 이미지(그 세부 모델에 이미지가 없으면 다음으로 많은 것)
    const top = [...model.models].sort((a, b) => b.count - a.count).find((sub) => sub.ratio);
    visuals[name] = {
      image: top ? asset(`models/kr/${makerId}/${top.value}.png`) : "",
      bodyFit: fitOf(top?.ratio),
      bodyType: existingVisual?.bodyType,
      isEV: existingVisual?.isEV,
      count: `${model.count.toLocaleString("ko-KR")}대`,
    };
  }
  guaziModelsByMaker[maker] = names.sort(compareModelNames);
  guaziGenerationsByMakerModel[maker] = generations;
  guaziModelVisualsByMaker[maker] = visuals;
}

export { guaziModelsByMaker, guaziGenerationsByMakerModel, guaziModelVisualsByMaker };

/** 매물 한 대 → 카탈로그 모델 하나(PR #88 보완). 제목에서 제조사를 뺀 앞부분이 모델 이름으로 시작하는 것 중 가장 긴 이름(또는 modelGroup 과 같은 이름).
 *  이름 일부만 겹치는 연결(벤츠 "220" ↔ "C 220d", 현대 "아이오닉" ↔ "아이오닉 5")을 막는다. 없으면 null */
export function catalogModelOfCar(car: { maker: string; title: string; modelGroup?: string }) {
  const names = guaziModelsByMaker[car.maker];
  if (!names || !catalogMakerNames.has(car.maker)) return null;
  const head = norm(car.title.startsWith(car.maker) ? car.title.slice(car.maker.length) : car.title);
  const group = car.modelGroup ? norm(car.modelGroup) : null;
  let best: string | null = null;
  for (const name of names) {
    const key = norm(name);
    if ((group === key || head.startsWith(key)) && (!best || key.length > norm(best).length)) best = name;
  }
  return best;
}

/** 세부 모델 카드 이미지 칸: 이미지가 없으면 점선 빈 칸 */
export function CatalogModelImage({ src }: { src?: string }) {
  return src ? <img src={src} alt="" aria-hidden="true" draggable={false} /> : <span className="kr-model-empty" aria-hidden="true" />;
}
