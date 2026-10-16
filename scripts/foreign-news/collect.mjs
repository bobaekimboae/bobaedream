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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourcePath = path.join(root, "data", "foreign-news", "sources.json");
const jsonPath = path.join(root, "public", "community", "data", "foreign-car-news.json");
const jsPath = path.join(root, "public", "community", "data", "board-foreign-car-news.js");
const registry = JSON.parse(await readFile(sourcePath, "utf8"));
const limit = Math.max(0, Number(process.env.FOREIGN_NEWS_SOURCE_LIMIT || 0));
const concurrency = Math.max(1, Number(process.env.FOREIGN_NEWS_COLLECT_CONCURRENCY || 8));
const maxArticles = Math.max(20, Number(process.env.FOREIGN_NEWS_MAX_ARTICLES || 500));
const allowFeedImages = process.env.FOREIGN_NEWS_ALLOW_FEED_IMAGES === "true";
const activeSources = registry.sources.filter((source) => source.status === "active" && source.feedUrl && ["rss", "atom", "sitemap"].includes(source.fetchType));
const selectedSources = limit ? activeSources.slice(0, limit) : activeSources;

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

let visible = representatives.slice(0, maxArticles);
const translationEndpoint = process.env.NEWS_TRANSLATE_ENDPOINT || "";
if (translationEndpoint && visible.length) {
  const response = await fetchWithTimeout(translationEndpoint, {
    method: "POST",
    timeoutMs: 30000,
    accept: "application/json",
    headers: {
      "content-type": "application/json",
      ...(process.env.NEWS_TRANSLATE_TOKEN ? { authorization: `Bearer ${process.env.NEWS_TRANSLATE_TOKEN}` } : {}),
    },
    body: JSON.stringify({ articles: visible.map(({ id, originalTitle, originalSummary, originalLanguage }) => ({ id, originalTitle, originalSummary, originalLanguage })) }),
  });
  if (!response.ok) throw new Error(`translation endpoint failed: ${response.status}`);
  const translated = await response.json();
  const byId = new Map((translated.articles || []).map((article) => [String(article.id), article]));
  visible = visible.map((article) => {
    const next = byId.get(String(article.id));
    return next ? { ...article, titleKo: next.titleKo || "", summaryKo: next.summaryKo || "", translationStatus: next.titleKo ? "translated" : "original" } : article;
  });
}

let previous = null;
try { previous = JSON.parse(await readFile(jsonPath, "utf8")); } catch {}
const signature = sha1(JSON.stringify(visible.map(({ id, titleKo, summaryKo, relatedCount }) => ({ id, titleKo, summaryKo, relatedCount }))));
if (previous?.signature === signature) {
  console.log(`No news changes (${visible.length} articles, signature ${signature.slice(0, 8)})`);
  process.exit(0);
}

const generatedAt = new Date().toISOString();
const payload = {
  generatedAt,
  signature,
  sourceCount: registry.sources.length,
  activeSourceCount: activeSources.length,
  collectedSourceCount: selectedSources.length,
  articleCount: visible.length,
  translationMode: translationEndpoint ? "endpoint" : "original",
  articles: visible,
};
await writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

const topics = ["전체", ...new Set(visible.map((article) => article.topic))];
const rows = visible.map((article) => ({
  id: article.id,
  category: article.topic,
  title: article.titleKo || article.originalTitle,
  summary: article.summaryKo || article.originalSummary,
  body: article.summaryKo || article.originalSummary,
  source: article.source,
  sourceUrl: article.canonicalUrl,
  author: article.source,
  publishedAt: article.publishedAt,
  thumbnail: allowFeedImages && article.imageUsage === "feed-provided-review" ? article.imageUrl : "",
  images: allowFeedImages && article.imageUsage === "feed-provided-review" ? article.imageUrl : "",
  views: "0",
  comments: "0",
  likes: "0",
  tags: [article.country, article.topic, ...article.makes].filter(Boolean).join("|"),
  country: article.country,
  region: article.region,
  originalTitle: article.originalTitle,
  originalLanguage: article.originalLanguage,
  relatedCount: String(article.relatedCount),
  collectedAt: article.collectedAt,
  collector: "해외자동차뉴스봇",
}));
const table = {
  board: "foreign-car-news",
  displayName: "해외 자동차뉴스",
  idStart: 920000001,
  defaultView: "naver-discussion-thumb",
  updatedAt: generatedAt,
  topics,
  rows,
};
const script = `/* Generated by scripts/foreign-news/collect.mjs. Do not edit rows by hand. */\n(function(){\n  'use strict';\n  var tables=window.BBM_BOARD_TABLES=window.BBM_BOARD_TABLES||{};\n  tables["foreign-car-news"]=${JSON.stringify(table, null, 2)};\n})();\n`;
await writeFile(jsPath, script, "utf8");
console.log(`Wrote ${visible.length} articles from ${selectedSources.length}/${registry.sources.length} sources (${signature.slice(0, 8)})`);


