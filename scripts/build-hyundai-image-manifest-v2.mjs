import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const catalogPath = path.join(root, "public", "data", "hyundai-catalog-v2", "catalog.json");
const outputDir = path.join(root, "public", "data", "hyundai-catalog-v2");
const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));

function representativeColor(model, generation) {
  const year = Number(String(generation.releaseYm || "0").slice(0, 4));
  const name = generation.displayName;
  if (model === "그랜저") {
    if (year >= 2026) return "바이오필릭 블루 펄";
    if (year >= 2022) return "세레니티 화이트 펄";
    if (year >= 2019) return "옥스퍼드 블루";
    if (year >= 2016) return "녹턴 그레이 메탈릭";
    if (year >= 2011) return "하이퍼 메탈릭";
    if (year >= 2005) return "블랙 다이아몬드";
    if (year >= 1998) return "다이아몬드 화이트";
    return "검정 단색";
  }
  if (model === "쏘나타") {
    if (year >= 2023) return "트랜스미션 블루 펄";
    if (year >= 2019) return "녹턴 그레이 메탈릭";
    if (year >= 2014) return "코스트 블루";
    if (year >= 2009) return "블루 오션";
    if (year >= 2004) return "노블 화이트";
    return "은회색 메탈릭";
  }
  if (model === "아반떼") {
    if (year >= 2026) return "메타 블루 펄";
    if (year >= 2020) return "아마존 그레이 메탈릭";
    if (year >= 2015) return "마리나 블루";
    if (year >= 2010) return "하이퍼 실버";
    if (year >= 2006) return "스톤 블랙";
    return "은회색 메탈릭";
  }
  if (model === "싼타페") return year >= 2023 ? "테라코타 오렌지" : year >= 2018 ? "라바 오렌지" : year >= 2012 ? "아라비안 모카" : "슬릭 실버";
  if (model === "투싼") return year >= 2020 ? "쉬머링 실버 메탈릭" : year >= 2015 ? "아라 블루" : year >= 2009 ? "실키 브론즈" : "노틸러스 블루";
  if (model === "팰리세이드") return year >= 2025 ? "에코트로닉 그레이 펄" : "문라이트 클라우드";
  if (model === "아이오닉5") return "디지털 틸 그린 펄";
  if (model === "아이오닉6") return "그래비티 골드 매트";
  if (model === "아이오닉9") return "셀라돈 그레이 메탈릭";
  if (model === "코나") return year >= 2023 ? "미라지 그린" : "서피 블루";
  if (model === "캐스퍼") return "톰보이 카키";
  if (model === "벨로스터") return year >= 2018 ? "썬더 볼트" : "비타민 C";
  if (model === "넥쏘") return year >= 2025 ? "고요 코퍼 펄" : "더스크 블루 매트";
  if (model === "i30") return year >= 2016 ? "파이어리 레드" : year >= 2011 ? "아쿠아 블루" : "스틸 그레이";
  if (model === "i40") return name.includes("더 뉴") ? "오션 뷰" : "티타늄 실버";
  if (["에쿠스", "다이너스티", "아슬란", "제네시스"].includes(model)) return year >= 2013 ? "폴리시드 메탈" : "팬텀 블랙";
  if (model === "제네시스 쿠페") return "슈퍼 레드";
  if (["스타리아", "스타렉스", "쏠라티", "ST1"].includes(model)) return "크리미 화이트";
  if (["갤로퍼", "테라칸", "베라크루즈", "맥스크루즈"].includes(model)) return "티타늄 그레이 메탈릭";
  if (["포니", "프레스토", "엑셀", "엘란트라", "마르샤", "베르나", "클릭"].includes(model)) return year < 1995 ? "아이보리 화이트" : "밀키 화이트";
  if (["티뷰론", "투스카니"].includes(model)) return "트로피컬 레드";
  if (model === "아이오닉") return "마리나 블루";
  if (model === "베뉴") return "데님 블루 펄";
  return "쉬머링 실버 메탈릭";
}

const assets = new Map();
const generationImages = {};
for (const model of catalog.manufacturer.modelGroups) {
  for (const generation of model.generations) {
    if (!assets.has(generation.imageAssetId)) {
      assets.set(generation.imageAssetId, {
        assetId: generation.imageAssetId,
        fileName: `${generation.imageAssetId}.png`,
        model: model.displayName,
        generationName: generation.displayName,
        generationNumber: generation.generationNumber,
        generationCode: generation.generationCode,
        releaseYm: generation.releaseYm,
        endYm: generation.endYm,
        colorName: representativeColor(model.displayName, generation),
        colorEvidence: "다나와·카이즈유 해당 연형 공식 외장색 교차확인 대상",
        sourceGenerationKeys: [generation.sourceKey],
        status: "pending"
      });
    } else {
      assets.get(generation.imageAssetId).sourceGenerationKeys.push(generation.sourceKey);
    }
    generationImages[generation.key] = `hyundai-v2/${generation.imageAssetId}.png`;
  }
}

const manifest = {
  version: "2026-10-07-v01",
  rules: {
    master: "1920×1200 transparent PNG",
    delivery: "960×600 transparent PNG",
    angle: "AutoScout24-style left-facing front three-quarter",
    width: "88~90%",
    floorGap: "6%",
    shadow: "compact contact shadow",
    references: [
      "https://www.hyundai.com/kr/ko/brand/heritage/model",
      "https://auto.danawa.com/auto/?Work=brand&Brand=303",
      "https://www.carisyou.com/car/"
    ]
  },
  assets: [...assets.values()]
};

await fs.writeFile(path.join(outputDir, "image-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
await fs.writeFile(path.join(outputDir, "generation-images.json"), `${JSON.stringify(generationImages, null, 2)}\n`);
console.log(JSON.stringify({ assets: manifest.assets.length, connections: Object.keys(generationImages).length }, null, 2));
