import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyTopic,
  extractMakes,
  extractSitemapLinks,
  fetchWithTimeout,
  normalizeUrl,
  parseFeed,
  sha1,
  stableArticleId,
  titleSimilarity,
} from "./lib.mjs";
import { fetchIframelyPreview } from "./iframely.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourcePath = path.join(root, "data", "foreign-news", "sources.json");
const jsonPath = path.join(root, "public", "community", "data", "foreign-car-news.json");
const jsPath = path.join(root, "public", "community", "data", "board-foreign-car-news.js");
const registry = JSON.parse(await readFile(sourcePath, "utf8"));
const limit = Math.max(0, Number(process.env.FOREIGN_NEWS_SOURCE_LIMIT || 0));
const concurrency = Math.max(1, Number(process.env.FOREIGN_NEWS_COLLECT_CONCURRENCY || 8));
const maxArticles = Math.max(20, Number(process.env.FOREIGN_NEWS_MAX_ARTICLES || 500));
// RSS/Atom 제공 이미지 URL만 원격 표시한다. 이미지는 내려받거나 재호스팅하지 않는다.
// 운영 중 긴급 차단이 필요하면 FOREIGN_NEWS_ALLOW_FEED_IMAGES=false 로 끌 수 있다.
const allowFeedImages = process.env.FOREIGN_NEWS_ALLOW_FEED_IMAGES !== "false";
const outputSchemaVersion = 5;
const activeSources = registry.sources.filter((source) => source.status === "active" && source.feedUrl && ["rss", "atom", "sitemap"].includes(source.fetchType));
const selectedSources = limit ? activeSources.slice(0, limit) : activeSources;

const makeNamesKo = new Map([
  ["hyundai", "현대"], ["kia", "기아"], ["genesis", "제네시스"], ["tesla", "테슬라"],
  ["toyota", "토요타"], ["honda", "혼다"], ["nissan", "닛산"], ["mazda", "마쓰다"],
  ["subaru", "스바루"], ["suzuki", "스즈키"], ["bmw", "BMW"], ["mercedes", "메르세데스-벤츠"],
  ["audi", "아우디"], ["volkswagen", "폭스바겐"], ["porsche", "포르쉐"], ["ferrari", "페라리"],
  ["lamborghini", "람보르기니"], ["volvo", "볼보"], ["ford", "포드"], ["chevrolet", "쉐보레"],
  ["jeep", "지프"], ["renault", "르노"], ["peugeot", "푸조"], ["citroen", "시트로엥"],
  ["byd", "BYD"], ["nio", "니오"], ["xpeng", "샤오펑"], ["geely", "지리"],
  ["rivian", "리비안"], ["lucid", "루시드"],
]);

function koreanMakeName(value) {
  const text = String(value || "").trim();
  return makeNamesKo.get(text.toLowerCase()) || (/^[가-힣]/.test(text) ? text : "");
}

function normalizedEntityList(value) {
  const values = Array.isArray(value) ? value : String(value || "").split(/[|,]/);
  return [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))];
}

function displayTitleKo(article) {
  const translated = String(article.titleKo || "").trim();
  if (translated) return translated;
  const makes = [...new Set((article.makes || []).map(koreanMakeName).filter(Boolean))].slice(0, 2);
  const subject = makes.length ? makes.join("·") : `${article.country || "해외"} 자동차`;
  return `${subject} ${article.topic || "주요"} 관련 해외 보도`;
}

function translatedSummaryLines(article) {
  const translated = String(article.summaryKo || "").replace(/\s+/g, " ").trim();
  if (translated) {
    const sentences = translated.match(/[^.!?。！？]+[.!?。！？]?/g)?.map((value) => value.trim()).filter(Boolean) || [];
    const lines = (sentences.length ? sentences : [translated]).slice(0, 3);
    if (lines.length < 2) lines.push(`${article.source}가 제공한 기사 내용을 요약했습니다.`);
    if (lines.length < 3) lines.push("세부 내용은 연결된 원문 기사에서 확인할 수 있습니다.");
    return lines.join("\n");
  }
  const makes = [...new Set((article.makes || []).map(koreanMakeName).filter(Boolean))].slice(0, 3);
  return [
    `${article.source}가 전한 ${article.country || "해외"} 자동차 소식입니다.`,
    `${makes.length ? `${makes.join("·")} 관련 ` : ""}${article.topic || "자동차"} 내용을 다룹니다.`,
    "번역문 준비 전에는 원문 제목과 원문 요약을 화면에 노출하지 않습니다.",
  ].join("\n");
}

async function collectSource(source) {
  try {
    const response = await fetchWithTimeout(source.feedUrl, { timeoutMs: 15000 });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (source.fetchType === "sitemap") {
      const urls = extractSitemapLinks(text, source.feedUrl).filter((url) => {
        const pathName = new URL(url).pathname.toLowerCase();
        return !/\.(?:jpg|jpeg|png|gif|webp|svg|pdf|xml)(?:$|\?)/.test(pathName);
      }).slice(0, 50);
      return urls.map((canonicalUrl) => ({
        sourceId: source.id,
        source: source.nameKo,
        country: source.country,
        region: source.region,
        originalLanguage: source.language,
        originalTitle: "",
        titleKo: "",
        originalSummary: "",
        summaryKo: "",
        canonicalUrl,
        publishedAt: "",
        imageUrl: "",
        sitemapOnly: true,
      }));
    }
    return parseFeed(text, source);
  } catch (error) {
    console.warn(`${source.nameKo}: ${error.message}`);
    return [];
  }
}

let cursor = 0;
const batches = new Array(selectedSources.length);
async function worker() {
  while (cursor < selectedSources.length) {
    const index = cursor;
    cursor += 1;
    const source = selectedSources[index];
    batches[index] = await collectSource(source);
    console.log(`[${index + 1}/${selectedSources.length}] ${source.nameKo}: ${batches[index].length}`);
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, selectedSources.length) }, () => worker()));

const cutoff = Date.now() - 14 * 86400000;
const exact = new Map();
for (const raw of batches.flat()) {
  if (!raw.originalTitle || !raw.canonicalUrl) continue;
  const published = Date.parse(raw.publishedAt || "");
  if (published && published < cutoff) continue;
  const canonicalUrl = normalizeUrl(raw.canonicalUrl);
  if (!canonicalUrl || exact.has(canonicalUrl)) continue;
  const article = {
    ...raw,
    id: stableArticleId(canonicalUrl),
    canonicalUrl,
    topic: classifyTopic(raw),
    makes: extractMakes(raw),
    collectedAt: new Date().toISOString(),
    translationStatus: raw.titleKo ? "translated" : "original",
    imageUsage: raw.imageUrl ? "feed-provided-review" : "none",
    relatedCount: 0,
    clusterId: "",
  };
  exact.set(canonicalUrl, article);
}

const articles = [...exact.values()].sort((left, right) => (Date.parse(right.publishedAt) || 0) - (Date.parse(left.publishedAt) || 0));
const representatives = [];
for (const article of articles) {
  const published = Date.parse(article.publishedAt) || 0;
  const match = representatives.find((representative) => {
    const compared = Date.parse(representative.publishedAt) || 0;
    return Math.abs(published - compared) <= 48 * 3600000 && titleSimilarity(article.originalTitle, representative.originalTitle) >= 0.72;
  });
  if (match) {
    match.relatedCount += 1;
    article.clusterId = match.clusterId;
  } else {
    article.clusterId = `cluster-${sha1(`${article.originalTitle}|${article.publishedAt}`).slice(0, 12)}`;
    representatives.push(article);
  }
}

let previous = null;
try { previous = JSON.parse(await readFile(jsonPath, "utf8")); } catch {}
const previousByUrl = new Map((previous?.articles || []).map((article) => [article.canonicalUrl, article]));

let visible = representatives.slice(0, maxArticles).map((article) => {
  const cached = previousByUrl.get(article.canonicalUrl);
  if (!cached) return article;
  return {
    ...article,
    titleKo: cached.titleKo || "",
    summaryKo: cached.summaryKo || "",
    articleTypeKo: cached.articleTypeKo || "",
    makesKo: cached.makesKo || [],
    modelsKo: cached.modelsKo || [],
    peopleKo: cached.peopleKo || [],
    iframelyImage: cached.iframelyImage || "",
    iframelyLogo: cached.iframelyLogo || "",
    iframelySite: cached.iframelySite || "",
    iframelyStatus: cached.iframelyStatus || "",
    iframelyAccessAllowed: cached.iframelyAccessAllowed,
    iframelyFetchedAt: cached.iframelyFetchedAt || "",
  };
});
const translationEndpoint = process.env.NEWS_TRANSLATE_ENDPOINT || "";
const translationTargets = visible.filter((article) => !article.titleKo || !article.summaryKo);
if (translationEndpoint && translationTargets.length) {
  const response = await fetchWithTimeout(translationEndpoint, {
    method: "POST",
    timeoutMs: 30000,
    accept: "application/json",
    headers: {
      "content-type": "application/json",
      ...(process.env.NEWS_TRANSLATE_TOKEN ? { authorization: `Bearer ${process.env.NEWS_TRANSLATE_TOKEN}` } : {}),
    },
    body: JSON.stringify({
      articles: translationTargets.map(({ id, originalTitle, originalSummary, originalLanguage }) => ({ id, originalTitle, originalSummary, originalLanguage })),
      outputSchema: {
        titleKo: "한국어 번역 제목",
        summaryKo: "줄바꿈으로 구분한 한국어 3줄 요약",
        articleTypeKo: "기사 유형",
        makesKo: ["제조사"],
        modelsKo: ["자동차 모델"],
        peopleKo: ["기사에 등장하는 인물"],
      },
      summaryRules: [
        "1줄: 핵심 사건 또는 발표",
        "2줄: 모델·기술·수치 등 구체 정보",
        "3줄: 출시 일정·시장 영향 또는 다음 단계",
      ],
    }),
  });
  if (!response.ok) throw new Error(`translation endpoint failed: ${response.status}`);
  const translated = await response.json();
  const byId = new Map((translated.articles || []).map((article) => [String(article.id), article]));
  visible = visible.map((article) => {
    const next = byId.get(String(article.id));
    return next ? {
      ...article,
      titleKo: next.titleKo || "",
      summaryKo: next.summaryKo || "",
      articleTypeKo: next.articleTypeKo || "",
      makesKo: normalizedEntityList(next.makesKo),
      modelsKo: normalizedEntityList(next.modelsKo),
      peopleKo: normalizedEntityList(next.peopleKo),
      translationStatus: next.titleKo ? "translated" : "original",
    } : article;
  });
}

const iframelyApiKey = String(process.env.IFRAMELY_API_KEY || "").trim();
const iframelyMaxUrls = Math.max(1, Number(process.env.IFRAMELY_MAX_URLS || 50));
const iframelyConcurrency = Math.max(1, Math.min(5, Number(process.env.IFRAMELY_CONCURRENCY || 3)));
const iframelyTtlMs = Math.max(1, Number(process.env.IFRAMELY_CACHE_TTL_HOURS || 24)) * 3600000;
if (iframelyApiKey && visible.length) {
  const now = Date.now();
  const targetIndexes = visible
    .map((article, index) => ({ article, index }))
    .filter(({ article }) => !article.iframelyFetchedAt || now - (Date.parse(article.iframelyFetchedAt) || 0) >= iframelyTtlMs)
    .slice(0, iframelyMaxUrls);
  let iframelyCursor = 0;
  async function iframelyWorker() {
    while (iframelyCursor < targetIndexes.length) {
      const target = targetIndexes[iframelyCursor++];
      const fetchedAt = new Date().toISOString();
      try {
        const preview = await fetchIframelyPreview(target.article.canonicalUrl, iframelyApiKey);
        visible[target.index] = {
          ...target.article,
          iframelyImage: preview.image,
          iframelyLogo: preview.logo,
          iframelySite: preview.site,
          iframelyStatus: preview.status,
          iframelyAccessAllowed: preview.allowed,
          iframelyFetchedAt: fetchedAt,
        };
      } catch (error) {
        visible[target.index] = {
          ...target.article,
          iframelyStatus: String(error.message || "iframely-error"),
          iframelyFetchedAt: fetchedAt,
        };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(iframelyConcurrency, targetIndexes.length) }, () => iframelyWorker()));
  console.log(`Iframely enriched ${targetIndexes.length} URLs (mode=discover, use=reference)`);
}

visible = visible.map((article) => ({
  ...article,
  displayArticleTypeKo: article.articleTypeKo || article.topic || "자동차 일반",
  displayMakesKo: normalizedEntityList(article.makesKo).length
    ? normalizedEntityList(article.makesKo)
    : [...new Set((article.makes || []).map(koreanMakeName).filter(Boolean))],
  displayModelsKo: normalizedEntityList(article.modelsKo),
  displayPeopleKo: normalizedEntityList(article.peopleKo),
  displayTitleKo: displayTitleKo(article),
  displaySummaryKo: translatedSummaryLines(article),
  displayTranslationStatus: article.titleKo ? "번역완료" : "한국어 메타 대체",
  previewImageUrl: article.iframelyImage || (allowFeedImages && article.imageUsage === "feed-provided-review" ? article.imageUrl : ""),
  previewImageSource: article.iframelyImage ? "iframely-data-api" : (article.imageUrl ? "feed" : "none"),
}));

const signature = sha1(JSON.stringify({
  outputSchemaVersion,
  articles: visible.map(({ id, originalTitle, originalSummary, titleKo, summaryKo, displayArticleTypeKo, displayMakesKo, displayModelsKo, displayPeopleKo, displayTitleKo, displaySummaryKo, previewImageUrl, iframelyLogo, iframelyStatus, relatedCount }) => ({
    id, originalTitle, originalSummary, titleKo, summaryKo, displayArticleTypeKo, displayMakesKo, displayModelsKo, displayPeopleKo, displayTitleKo, displaySummaryKo, previewImageUrl, iframelyLogo, iframelyStatus, relatedCount,
  })),
}));
if (previous?.signature === signature) {
  console.log(`No news changes (${visible.length} articles, signature ${signature.slice(0, 8)})`);
  process.exit(0);
}

const generatedAt = new Date().toISOString();
const payload = {
  schemaVersion: outputSchemaVersion,
  generatedAt,
  signature,
  sourceCount: registry.sources.length,
  activeSourceCount: activeSources.length,
  collectedSourceCount: selectedSources.length,
  articleCount: visible.length,
  translationMode: translationEndpoint ? "endpoint" : "korean-metadata-fallback",
  embedPreviewMode: iframelyApiKey ? "iframely-data-api" : "feed-fallback",
  articles: visible,
};
await writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

const topics = ["전체", ...new Set(visible.map((article) => article.topic))];
const rows = visible.map((article) => {
  const previewImage = article.previewImageUrl;
  const titleKo = article.displayTitleKo;
  const summaryKo = article.displaySummaryKo;
  return ({
  id: article.id,
  category: article.topic,
  title: titleKo,
  summary: summaryKo,
  body: summaryKo,
  source: article.source,
  sourceUrl: article.canonicalUrl,
  author: article.source,
  publishedAt: article.publishedAt,
  // 대표 이미지는 일반 게시물 사진이 아니라 원문 링크 프리뷰에만 넣는다.
  // 이렇게 해야 Reddit 링크 포스트처럼 제목·요약·출처와 한 카드로 움직인다.
  thumbnail: "",
  images: "",
  embed: article.canonicalUrl,
  embedTitle: titleKo,
  embedDescription: summaryKo,
  embedImage: previewImage,
  embedLogo: article.iframelyLogo || "",
  embedSite: article.iframelySite || article.source,
  embedProvider: article.iframelyImage ? "Iframely" : "RSS",
  embedLang: article.originalLanguage,
  views: "0",
  comments: "0",
  likes: "0",
  tags: [article.country, article.displayArticleTypeKo, ...article.displayMakesKo, ...article.displayModelsKo, ...article.displayPeopleKo].filter(Boolean).join("|"),
  country: article.country,
  region: article.region,
  originalTitle: "",
  originalLanguage: article.originalLanguage,
  relatedCount: String(article.relatedCount),
  collectedAt: article.collectedAt,
  collector: "해외자동차뉴스봇",
  });
});
const table = {
  board: "foreign-car-news",
  displayName: "해외 자동차뉴스",
  idStart: 920000001,
  defaultView: "naver-discussion",
  updatedAt: generatedAt,
  topics,
  rows,
};
const script = `/* Generated by scripts/foreign-news/collect.mjs. Do not edit rows by hand. */\n(function(){\n  'use strict';\n  var tables=window.BBM_BOARD_TABLES=window.BBM_BOARD_TABLES||{};\n  tables["foreign-car-news"]=${JSON.stringify(table, null, 2)};\n})();\n`;
await writeFile(jsPath, script, "utf8");
console.log(`Wrote ${visible.length} articles from ${selectedSources.length}/${registry.sources.length} sources (${signature.slice(0, 8)})`);


